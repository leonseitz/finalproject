"use client";

import { EXERCISE_DATA } from "@/constants/exerciseData";
import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, StopCircle, Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

function RecordContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const exerciseId = Number(params.id);
  const exercise = EXERCISE_DATA[exerciseId];
  
  const targetValue = Number(searchParams.get("target") || "0");
  const targetType = searchParams.get("type") || "reps";
  const side = searchParams.get("side") || "both"; // อ่านค่าพารามิเตอร์ข้าง (side)
  const autoStop = searchParams.get("auto_stop") === "true"; // ตรวจสอบค่า auto_stop

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const frameIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(0);
  const lastProcessTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null); // New ref for precise duration
  const stopTimeRef = useRef<number | null>(null); // Ref for precise stop time
  const summaryDataRef = useRef<any>(null); // Store session summary from backend
  const pendingVideoBlobRef = useRef<Blob | null>(null); // Store video blob if summary hasn't arrived yet

  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false); // ใช้ Ref สำหรับ ws.onmessage เพื่อป้องกันปิดการทำงานผิดพลาด
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [currentCount, setCurrentCount] = useState(0);
  const [feedback, setFeedback] = useState("กรุณาวางตำแหน่งร่างกายให้พร้อม");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isError, setIsError] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [landmarker, setLandmarker] = useState<PoseLandmarker | null>(null);
  const [isLandmarkerLoaded, setIsLandmarkerLoaded] = useState(false);

  // ระบบจับเวลา
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      startTimeRef.current = Date.now(); // Set start time
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - (startTimeRef.current || now)) / 1000);
        setElapsedTime(elapsed);

        // Auto Stop for Time Target
        if (autoStop && targetType === "time" && targetValue > 0 && elapsed >= targetValue) {
             toggleRecording(); // Stop recording
        }
      }, 1000);
    } 
    return () => clearInterval(interval);
  }, [isRecording, autoStop, targetType, targetValue]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // เริ่มต้นระบบ MediaPipe PoseLandmarker
  useEffect(() => {
    async function createLandmarker() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
        );
        
        let newLandmarker;
        try {
            newLandmarker = await PoseLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: `/models/pose_landmarker_full.task`,
                delegate: "GPU"
              },
              runningMode: "VIDEO",
              numPoses: 1
            });
            console.log("MediaPipe PoseLandmarker loaded (GPU)");
        } catch (gpuError) {
            console.warn("Failed to load MediaPipe with GPU, trying CPU...", gpuError);
            newLandmarker = await PoseLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: `/models/pose_landmarker_full.task`,
                delegate: "CPU"
              },
              runningMode: "VIDEO",
              numPoses: 1
            });
            console.log("MediaPipe PoseLandmarker loaded (CPU)");
        }

        setLandmarker(newLandmarker);
        setIsLandmarkerLoaded(true);
      } catch (error) {
        console.error("Error loading MediaPipe:", error);
        setFeedback("ไม่สามารถโหลดระบบ AI ได้ กรุณาเช็คอินเทอร์เน็ต");
        setIsError(true);
      }
    }
    createLandmarker();
  }, []);

  // เริ่มต้นการใช้งานกล้อง
  useEffect(() => {
    let isUnmounted = false;
    let localStream: MediaStream | null = null;

    async function setupCamera() {
      try {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "user", 
            // ปรับแต่งสำหรับมือถือ: ลดความละเอียดลง
            width: isMobile ? { ideal: 480 } : { ideal: 640 }, 
            height: isMobile ? { ideal: 640 } : { ideal: 480 },
            frameRate: { ideal: 30 }
          },
          audio: false, 
        });
        
        if (isUnmounted) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        localStream = mediaStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
      } catch (err) {
        if (!isUnmounted) {
          console.error("Error accessing camera:", err);
          setFeedback("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการอนุญาต");
          setIsError(true);
        }
      }
    }

    setupCamera();

    return () => {
      isUnmounted = true;
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, []);

  const drawSkeleton = (landmarks: any[]) => {
    if (!overlayRef.current || !videoRef.current) return;
    const canvas = overlayRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // แก้ไขการหมุนและการปรับขนาด (Orientation & Scaling)
    const videoRatio = video.videoWidth / video.videoHeight;
    const canvasRatio = canvas.width / canvas.height;
    
    let scale, offsetX, offsetY;

    // Logic for object-cover scaling: determine if limited by width or height
    if (canvasRatio > videoRatio) {
        // Canvas is wider relative to height -> scale to fit width, crop height
        scale = canvas.width / video.videoWidth;
        const visualHeight = video.videoHeight * scale;
        offsetX = 0;
        offsetY = (visualHeight - canvas.height) / 2;
    } else {
        // Canvas is taller/narrower -> scale to fit height, crop width
        scale = canvas.height / video.videoHeight;
        const visualWidth = video.videoWidth * scale;
        offsetX = (visualWidth - canvas.width) / 2;
        offsetY = 0;
    }

    const w = canvas.width;
    const h = canvas.height;

    // วาดจุด (Dots)
    ctx.fillStyle = "#22d3ee"; 
    landmarks.forEach((lm) => {
      if (lm.visibility > 0.5) {
        // กลับด้านพิกัด X (Mirror) 
        const nx = (1 - lm.x); 
        const ny = lm.y;
        
        // Map normalized coordinates to visual pixels, then shift by offset
        const x = (nx * video.videoWidth * scale) - offsetX;
        const y = (ny * video.videoHeight * scale) - offsetY;
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // วาดเส้นเชื่อมต่อ (Connections) 
    const connections = [
      [11, 12], [11, 23], [12, 24], [23, 24], 
      [11, 13], [13, 15], [12, 14], [14, 16],
      [23, 25], [25, 27], [24, 26], [26, 28]
    ];

    ctx.strokeStyle = "rgba(34, 211, 238, 0.6)"; 
    ctx.lineWidth = 4;
    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
        const x1 = ((1 - p1.x) * video.videoWidth * scale) - offsetX;
        const y1 = (p1.y * video.videoHeight * scale) - offsetY;
        const x2 = ((1 - p2.x) * video.videoWidth * scale) - offsetX;
        const y2 = (p2.y * video.videoHeight * scale) - offsetY;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });
  };

  const predictWebcam = () => {
    if (!landmarker || !videoRef.current) return;
    
    // ตรวจสอบความพร้อมของวิดีโอ
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        frameIdRef.current = requestAnimationFrame(predictWebcam);
        return;
    }

    // THROTTLING: ประมวลผลแค่ประมาณ 15 FPS (ทุกๆ ~66ms) หรือ 10 FPS (100ms) สำหรับมือถือ
    const now = performance.now();
    const THROTTLE_MS = 66; // ~15 FPS
    if (now - lastProcessTimeRef.current < THROTTLE_MS) {
        frameIdRef.current = requestAnimationFrame(predictWebcam);
        return;
    }
    lastProcessTimeRef.current = now;

    try {
        let startTimeMs = performance.now();
        const result = landmarker.detectForVideo(videoRef.current, startTimeMs);

        if (result.landmarks && result.landmarks.length > 0) {
            const landmarks = result.landmarks[0];
            
            // วาดลงบนเครื่อง (Locally)
            drawSkeleton(landmarks);
            
            // ส่งไปที่ Backend
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                const now = Date.now();
                // Calculate timestamp in milliseconds if recording, otherwise 0
                const timestamp = isRecordingRef.current && startTimeRef.current 
                    ? now - startTimeRef.current 
                    : 0;
                
                wsRef.current.send(JSON.stringify({ 
                    landmarks: landmarks,
                    timestamp: timestamp
                }));
            }
        } else {
             // ล้างหน้าจอ Canvas ถ้าตรวจไม่พบท่าทาง
             if (overlayRef.current) {
                 const ctx = overlayRef.current.getContext("2d");
                 ctx?.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
             }
        }
    } catch (e) {
        console.error("Prediction error:", e);
    }

    frameIdRef.current = requestAnimationFrame(predictWebcam);
  };

  // ตั้งค่า WebSocket (สำหรับ Preview)
  useEffect(() => {
    if (!stream) return;

    console.log("Setting up WebSocket...");
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    let wsHost = window.location.hostname;
    
    // ตั้งค่า IP แบบ Manual สำหรับการทดสอบบน Android
    // หากใช้มือถือที่เชื่อมต่อเครือข่ายเดียวกัน ต้องใช้ IP ของเครื่องคอมพิวเตอร์ (เช่น 10.10.100.213) ห้ามใช้ localhost
    if (wsHost === 'localhost' || wsHost === '127.0.0.1' || wsHost === '') {
        // Try to keep it dynamic if possible, but fallback to known IP if needed
        // wsHost = '10.10.100.213'; // Example
    }

    const wsUrl = `${protocol}//${wsHost}:8000/api/exercise/ws/exercise/${exerciseId}`;
    console.log("Connecting to WebSocket:", wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("Connected to Exercise AI");
      wsRef.current = ws;
      // Start prediction loop regardless of recording status (for preview)
      predictWebcam();
    };

    ws.onmessage = (event) => {
      try {
          const data = JSON.parse(event.data);
          if (isRecordingRef.current && data.count !== undefined) {
            setCurrentCount(data.count);
            
            // Auto Stop for Reps Target
            if (autoStop && targetType === "reps" && targetValue > 0 && data.count >= targetValue) {
                 toggleRecording();
            }
          }
          if (data.warnings && Array.isArray(data.warnings) && data.warnings.length > 0) {
            setWarnings(data.warnings);
          } else {
            setWarnings([]);
            if (data.feedback !== undefined) setFeedback(data.feedback || "กำลังวิเคราะห์...");
          }
          
          if (data.type === "SUMMARY") {
              console.log("Received Session Summary:", data.data);
              summaryDataRef.current = data.data;
              
              // Check if we have a pending video blob waiting for this summary
              if (pendingVideoBlobRef.current) {
                  console.log("Found pending video blob, uploading now...");
                  uploadVideo(pendingVideoBlobRef.current);
                  pendingVideoBlobRef.current = null; // Clear pending
              }
          }
      } catch (e) {
          console.error("Error parsing WS message:", e);
      }
    };

    ws.onerror = (e) => {
      console.error("WebSocket Error:", e);
      // Optional: Retry logic could go here
    };

    ws.onclose = () => {
      console.log("WebSocket Closed");
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
          ws.close();
      }
    };
  }, [stream, landmarker]); 

  // Start prediction loop manually since WS is disabled
  // Manual start removed as it's now handled in the main WebSocket useEffect
  /* 
  useEffect(() => {
    if (stream && landmarker) { 
        predictWebcam();
    }
  }, [stream, landmarker]);
  */

  const uploadVideo = async (videoBlob: Blob) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setFeedback("กรุณาเข้าสู่ระบบก่อนบันทึกวิดีโอ");
        setIsError(true);
        // Redirect to login if not logged in
        setTimeout(() => {
            router.push("/login");
        }, 1500); 
        return;
      }

      const formData = new FormData();
      formData.append("exercise_id", exerciseId.toString());
      
      // Calculate duration from start to stop (or current time if stop time missing)
      const endTime = stopTimeRef.current || Date.now();
      const durationSec = startTimeRef.current ? Math.floor((endTime - startTimeRef.current) / 1000) : 0;
      
      formData.append("duration", durationSec.toString());
      formData.append("video_file", videoBlob, `exercise_${exerciseId}.webm`);
      
      // Attach tracking data
      if (summaryDataRef.current) {
          formData.append("reps_data", JSON.stringify(summaryDataRef.current.reps_history || []));
          formData.append("score_data", JSON.stringify(summaryDataRef.current));
      } else {
          formData.append("reps_data", "[]");
          formData.append("score_data", "{}");
      }

      // Attach Goal Target Info (to create goal if missing)
      formData.append("target_type", targetType);
      formData.append("target_value", targetValue.toString());
      formData.append("auto_stop", autoStop ? "true" : "false");

      // Dynamic URL construction
      const protocol = window.location.protocol === "https:" ? "https:" : "http:";
      const host = window.location.hostname;
      const port = "8000"; 
      const apiUrl = `${protocol}//${host}:${port}/api/exercise/upload-video`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Video uploaded successfully", result);
        setFeedback("บันทึกวิดีโอเรียบร้อยแล้ว");
      } else {
        if (response.status === 401) {
             setFeedback("หมดเวลาเข้าสู่ระบบ กรุณาล็อกอินใหม่");
             localStorage.removeItem("token");
             setTimeout(() => {
                router.push("/login");
             }, 1500);
        } else {
             console.error("Failed to upload video");
             setFeedback("เกิดข้อผิดพลาดในการบันทึกวิดีโอ");
        }
      }
    } catch (err) {
      console.error("Error uploading video:", err);
      setFeedback("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const toggleRecording = () => {
    if (!isRecordingRef.current) {
      // เริ่มบันทึก (START RECORDING)
      if (!stream) return;

      setIsRecording(true);
      isRecordingRef.current = true;
      setFeedback("ระบบกำลังเริ่มบันทึก...");
      setWarnings([]);
      setCurrentCount(0); // รีเซ็ตตัวนับในเครื่อง
      setElapsedTime(0); // Reset time on start
      startTimeRef.current = Date.now();
      stopTimeRef.current = null;
      
      // Clear previous data
      summaryDataRef.current = null;
      pendingVideoBlobRef.current = null;

      // ส่งสัญญาณเริ่มไปยัง Backend พร้อมระบุข้าง (Side)
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ 
          command: "START_TRACKING",
          side: side 
        }));
      }

      // ตั้งค่า MediaRecorder สำหรับบันทึกไฟล์คุณภาพสูง
      // หมายเหตุ: เราต้องขอสิทธิ์เสียงแยกต่างหากถ้าต้องการเสียง
      // แต่ตอนนี้ stream ตั้งค่า audio: false ไว้
      try {
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8" });
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const completeBlob = new Blob(chunksRef.current, { type: "video/webm" });
          
          // Check if we already have the summary
          if (summaryDataRef.current) {
              console.log("Summary already available, uploading now...");
              uploadVideo(completeBlob);
          } else {
              console.log("Summary not yet available, storing pending video blob...");
              pendingVideoBlobRef.current = completeBlob;
              setFeedback("กำลังบันทึกวิดีโอ... รอผลสรุปจาก AI");
              
              // Fallback: If summary doesn't arrive within 3 seconds, upload anyway
              setTimeout(() => {
                  if (pendingVideoBlobRef.current) {
                      console.warn("Summary timeout, uploading video without summary stats");
                      uploadVideo(pendingVideoBlobRef.current);
                      pendingVideoBlobRef.current = null;
                  }
              }, 3000);
          }
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.error("Error starting MediaRecorder:", err);
      }

    } else {
      // หยุดบันทึก (STOP RECORDING)
      setIsRecording(false);
      isRecordingRef.current = false;
      stopTimeRef.current = Date.now(); // Capture stop time immediately
      setFeedback("หยุดการบันทึกแล้ว... กำลังประมวลผลวิดีโอ");
      
      // Stop Tracking in Backend (Trigger Summary Generation)
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ 
            command: "STOP_TRACKING" 
          }));
      }

      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    }
  };


  if (!exercise) return null;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#10141d] text-[#ededed] font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="flex-none pt-6 px-6 pb-2 flex items-center justify-between z-20">
        <button
          onClick={() => router.replace(`/exercise/${exerciseId}/prepare`)}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f293a] text-gray-400 hover:text-white transition-all hover:bg-[#252e42]"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="flex flex-col items-end">
          <div className="rounded-2xl bg-[#1c2333] px-4 py-2 border border-[#2a3449]">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">กำลังออกกำลังกาย</p>
            <p className="text-white font-bold text-lg">{exercise.title_th}</p>
          </div>
        </div>
      </div>

      {/* Main Content: Centered Taller Video Frame */}
      <div className="flex-1 flex items-center justify-center relative min-h-0 p-4 mb-22">
        <div className="relative w-full max-w-md aspect-[3/4] max-h-full bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-[#2a3449]">
          {/* Video Feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover -scale-x-100"
          />
          <canvas ref={overlayRef} className="absolute inset-0 pointer-events-none h-full w-full" />

          {/* Loading Indicator */}
          {!isLandmarkerLoaded && !isError && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#10141d]/80 z-50">
              <div className="text-center">
                <div className="h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-cyan-400 font-bold">กำลังโหลดโมเดล AI...</p>
                <p className="text-gray-400 text-xs mt-2">อาจใช้เวลาสักครู่ในการโหลดครั้งแรก</p>
              </div>
            </div>
          )}

          {/* Center Feedback Overlay (Inside Video) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-6 text-center pointer-events-none">
            {!isRecording && !isError && isLandmarkerLoaded && (
              <div className="bg-[#10141d]/60 backdrop-blur-md rounded-3xl p-6 border border-[#2a3449] animate-pulse inline-block">
                <p className="text-white text-lg font-medium">จัดให้ทั้งตัวอยู่ในกรอบ</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls Section */}
      <div className="flex-none px-6 pb-10 pt-2 z-20 relative">
        {/* Real-time Feedback Alerts */}
        <div className="absolute bottom-[130px] left-0 right-0 flex flex-col-reverse gap-2 items-center w-full max-w-lg mx-auto min-h-[60px] h-auto justify-end pointer-events-none">
          {(() => {
            const rawMessages = warnings.length > 0 ? warnings : [feedback];
            const messages = rawMessages.flatMap(msg => 
              msg ? msg.split(/(?<=!)/).map(s => s.trim()).filter(s => s.length > 0) : []
            );

            return messages.map((msg, index) => (
              <div 
                key={index}
                className={`w-full max-w-md rounded-2xl px-4 py-2.5 flex items-center gap-3 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto ${
                  isError || warnings.length > 0 
                  ? "bg-red-500/90 border border-red-400 text-white shadow-lg shadow-red-900/20" 
                  : "bg-[#1c2333] border border-[#2a3449] text-white shadow-md"
                }`}
              >
                {isError || warnings.length > 0 ? (
                  <AlertCircle className="h-5 w-5 shrink-0 text-white" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-400" />
                )}
                <p className="font-medium text-sm leading-snug flex-1 text-center">{msg}</p>
              </div>
            ));
          })()}
        </div>

        {/* Controls Row: Stats | Start | Status */}
        <div className="flex items-stretch gap-3 h-20 max-w-lg mx-auto w-full">
          {/* Stats Card */}
          <div className="flex-1 bg-[#1c2333] rounded-2xl px-2 flex flex-col items-center justify-center border border-[#2a3449] shadow-md">
            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-tighter mb-0.5">COUNT</p>
            <h3 className="text-white text-2xl font-black leading-none">
              {currentCount}<span className="text-xs font-normal text-gray-500 ml-0.5">/{targetValue}</span>
            </h3>
            <p className="text-cyan-400 text-[8px] font-bold mt-1 uppercase tracking-widest leading-none">
              {targetType === "reps" ? "REPS" : "SEC"}
            </p>
          </div>

          {/* Start/Stop Button */}
          <button
            onClick={toggleRecording}
            disabled={isError || !isLandmarkerLoaded}
            className={`flex-[1.5] rounded-2xl flex items-center justify-center gap-2 font-black text-base transition-all active:scale-95 disabled:opacity-50 ${
              isRecording 
                ? "bg-red-500 hover:bg-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]" 
                : "bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            }`}
          >
            {isRecording ? (
              <>
                <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                <StopCircle className="h-5 w-5 fill-current" />
                <span>หยุด</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5 fill-current" />
                <span>เริ่ม</span>
              </>
            )}
          </button>

          {/* Status/Timer Card */}
          <div className="flex-1 bg-[#1c2333] rounded-2xl px-2 flex flex-col items-center justify-center border border-[#2a3449] shadow-md">
            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-tighter mb-0.5">STATUS</p>
            <div className="flex flex-col items-center leading-none">
               <p className={`text-[10px] font-black ${
                 isRecording ? "text-red-400" : "text-emerald-400"
               }`}>
                 {isRecording ? "REC" : "READY"}
               </p>
               <p className="text-white text-lg font-mono font-bold mt-1">
                 {isRecording ? formatTime(elapsedTime) : "00:00"}
               </p>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function RecordClient() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-black text-white">Loading...</div>}>
      <RecordContent />
    </Suspense>
  );
}
