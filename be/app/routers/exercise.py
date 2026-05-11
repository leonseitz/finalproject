import base64
import json
import os
import uuid
import cv2
import numpy as np
from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
from app.services.bicep_curl_tracker import BicepCurlTracker
from app.services.squat_tracker import SquatTracker
from app.services.push_up_tracker import PushUpTracker
from app.services.pull_up_tracker import PullUpTracker
from app.services.plank_tracker import PlankTracker
from app.models.exercise_type import Exercise_type
from app.models.exercise_rep import ExerciseRep
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from sqlalchemy import desc
from fastapi import Depends
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.video import Video

router = APIRouter()

def get_tracker(exercise_id: int):
    if exercise_id == 1:
        return BicepCurlTracker()
    elif exercise_id == 2:
        return SquatTracker()
    elif exercise_id == 3:
        return PushUpTracker()
    elif exercise_id == 4:
        return PullUpTracker()
    elif exercise_id == 5:
        return PlankTracker()
    return None

@router.websocket("/ws/exercise/{exercise_id}")
async def websocket_endpoint(websocket: WebSocket, exercise_id: int):
    await websocket.accept()
    
    # Initialize tracker based on exercise_id
    # mapping from exerciseData.ts: 1: Bicep, 2: Squats, 3: Push-ups, 4: Pull-ups, 5: Plank
    tracker = None
    if exercise_id == 1: tracker = BicepCurlTracker()
    elif exercise_id == 2: tracker = SquatTracker()
    elif exercise_id == 3: tracker = PushUpTracker()
    elif exercise_id == 4: tracker = PullUpTracker()
    elif exercise_id == 5: tracker = PlankTracker()

    if not tracker:
        await websocket.send_text(json.dumps({"error": "Invalid exercise ID"}))
        await websocket.close()
        return

    try:
        while True:
            # Receive data (can be text or bytes)
            message = await websocket.receive()
            
            if message["type"] == "websocket.disconnect":
                print(f"Client disconnected from exercise {exercise_id}")
                break

            data = None
            if "text" in message:
                # Check if it's a JSON command or base64 image
                text_content = message["text"]
                try:
                    # Attempt to parse as JSON for commands
                    command_data = json.loads(text_content)
                    if command_data.get("command") == "START_TRACKING":
                        if tracker:
                            # Handle side selection for Bicep Curl
                            if hasattr(tracker, 'set_side'):
                                side = command_data.get("side", "both")
                                tracker.set_side(side)
                                print(f"Tracker set to side: {side}")

                            tracker.reset()
                            tracker.is_tracking = True # Enable counting
                            print(f"Tracker started for exercise {exercise_id}")
                        continue
                        
                    elif command_data.get("command") == "STOP_TRACKING":
                        if tracker:
                            tracker.is_tracking = False
                            summary = tracker.get_session_summary()
                            await websocket.send_text(json.dumps({
                                "type": "SUMMARY",
                                "data": summary
                            }))
                            print(f"Tracker stopped. Sent summary: {summary}")
                            tracker.reset()
                        continue
                    
                    elif "landmarks" in command_data:
                        if tracker:
                            timestamp = command_data.get("timestamp", 0)
                            tracker.process_landmarks(command_data["landmarks"], timestamp_ms=timestamp)
                            
                            # Get stats
                            stats = tracker.get_stats()
                            
                            # Prepare response
                            result_data = {
                                "count": stats.get('total_count') or stats.get('count') or stats.get('elapsed_time') or 0,
                                "feedback": "",
                                "warnings": []
                            }
                            
                            # Collect warnings (same logic as image processing)
                            warnings = []
                            if hasattr(tracker, 'warning_message') and tracker.warning_message:
                                warnings.append(tracker.warning_message)
                            if hasattr(tracker, 'warning_message_left') and tracker.warning_message_left:
                                warnings.append(tracker.warning_message_left)
                            if hasattr(tracker, 'warning_message_right') and tracker.warning_message_right:
                                warnings.append(tracker.warning_message_right)
                            
                            result_data['warnings'] = warnings
                            if warnings:
                                result_data['feedback'] = warnings[0]
                                
                            result_data.update({k: v for k, v in stats.items() if k not in ['total_count', 'count', 'elapsed_time']})
                            
                            await websocket.send_text(json.dumps(result_data))
                        continue
                except json.JSONDecodeError:
                    # Not a JSON command, assume it's base64 image data
                    img_data = base64.b64decode(text_content.split(",")[1] if "," in text_content else text_content)
                    data = img_data
            elif "bytes" in message:
                # Handle direct binary data (Blob from frontend)
                data = message["bytes"]

            if data is None:
                continue

            try:
                # Decode image
                nparr = np.frombuffer(data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if frame is not None:
                    # Convert BGR to RGB for MediaPipe
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    
                    # Process frame
                    tracker.process_frame(rgb_frame)
                    
                    # Get stats and send back as JSON
                    stats = tracker.get_stats()
                    
                    # Normalize for frontend (Next.js expects 'count' and 'feedback')
                    result_data = {
                        "count": stats.get('total_count') or stats.get('count') or stats.get('elapsed_time') or 0,
                        "feedback": "",
                        "warnings": []
                    }
                    
                    # Collect ALL feedback/warning messages
                    warnings = []
                    if hasattr(tracker, 'warning_message') and tracker.warning_message:
                        warnings.append(tracker.warning_message)
                    if hasattr(tracker, 'warning_message_left') and tracker.warning_message_left:
                        warnings.append(tracker.warning_message_left)
                    if hasattr(tracker, 'warning_message_right') and tracker.warning_message_right:
                        warnings.append(tracker.warning_message_right)
                    
                    result_data['warnings'] = warnings
                    # Join for legacy support (show first or join)
                    if warnings:
                        result_data['feedback'] = warnings[0]
                    
                    # Include other metrics if available (optional)
                    result_data.update({k: v for k, v in stats.items() if k not in ['total_count', 'count', 'elapsed_time']})
                    
                    # Include skeleton landmarks for drawing on frontend
                    if hasattr(tracker, 'latest_landmarks') and tracker.latest_landmarks:
                        result_data['landmarks'] = [
                            {"x": lm.x, "y": lm.y, "z": lm.z, "visibility": lm.visibility}
                            for lm in tracker.latest_landmarks
                        ]

                    await websocket.send_text(json.dumps(result_data))
                
            except Exception as e:
                print(f"Error processing frame: {e}")
                await websocket.send_text(json.dumps({"error": str(e)}))
    except Exception as e:
        print(f"Unexpected error in websocket: {e}")
    finally:
        if tracker:
            tracker.reset()
            tracker.is_tracking = False

@router.post("/upload-video")
async def upload_video(
    exercise_id: int = Form(...),
    duration: int = Form(...),
    video_file: UploadFile = File(...),
    reps_data: str = Form(default="[]"), # JSON string of reps history
    score_data: str = Form(default="{}"), # JSON string of session summary
    target_type: str = Form(default="reps"),
    target_value: int = Form(default=0),
    auto_stop: bool = Form(default=True), # Default to True as per user request context
    valid_duration: int = Form(default=0), # Time with good form (from frontend)
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload recorded video file and save tracking data to database"""
    # Create uploads directory if not exists
    upload_dir = Path("uploads") / str(exercise_id)
    print(f"DEBUG: upload_video called for Ex {exercise_id}. Duration={duration}, ValidDuration={valid_duration}")

    # ... (skipping file save logic for brevity in replacement, but preserving lines 218-360 logic below) ...
    # Wait, I cannot skip lines. I need to replace the function definition block and the goal check block.
    # But they are far apart. I should use MultiReplace or just replace the specific chunks.
    # Let's use MultiReplace since I have two distinct changes.
    pass 
    # Actually I will use single replace for the signature first.

    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_extension = video_file.filename.split(".")[-1] if "." in video_file.filename else "webm"
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = upload_dir / file_name
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(await video_file.read())
        
    # Normalize path
    normalized_path = str(file_path).replace("\\", "/")
    
    # 1. Find Active Goal
    from app.models.exercise_goals import ExerciseGoal
    active_goal = db.query(ExerciseGoal).filter(
        ExerciseGoal.user_id == current_user.user_id,
        ExerciseGoal.type_id == exercise_id,
        ExerciseGoal.status.is_(None)
    ).first()

    # If no active goal, create one automatically based on session parameters
    if not active_goal:
        try:
            # Map target_type to database columns
            target_reps = 0
            target_time_sec = 0
            
            if target_type == 'reps':
                target_reps = target_value
            elif target_type == 'time':
                target_time_sec = target_value
            
            active_goal = ExerciseGoal(
                user_id=current_user.user_id,
                type_id=exercise_id,
                target_type=target_type,
                target_reps=target_reps,
                target_time_sec=target_time_sec,
                status=None,
                auto_stop=auto_stop 
            )
            db.add(active_goal)
            db.commit()
            db.refresh(active_goal)
            print(f"Created new auto-goal {active_goal.goal_id} for user {current_user.user_id}")
            
        except Exception as e:
            print(f"Error creating auto-goal: {e}")

    
    # 2. Save Video
    new_video = Video(
        user_id=current_user.user_id,
        type_id=exercise_id,
        goal_id=active_goal.goal_id if active_goal else None,
        video_path=normalized_path,
        duration_sec=duration,
        started_at=datetime.now() - timedelta(seconds=duration),
        ended_at=datetime.now()
    )
    
    db.add(new_video)
    db.commit()
    db.refresh(new_video)
    
    # 3. Save Reps and Feedback
    # We need to calculate totals to update goal status
    total_reps_count = 0
    total_score_sum = 0
    
    # 3. Save Reps and Feedback
    # We need to calculate totals to update goal status
    total_reps_count = 0
    total_score_sum = 0
    reps_list = [] # Initialize explicitly
    
    try:
        try:
            reps_list = json.loads(reps_data)
        except:
            reps_list = []
            
        if reps_list:
            from app.models.exercise_feedback import ExerciseFeedback
            
            total_reps_count = len(reps_list)
            
            for rep in reps_list:
                total_score_sum += rep.get('score', 0)
                
                new_rep = ExerciseRep(
                    video_id=new_video.video_id,
                    rep_number=rep.get('rep_number'),
                    score=rep.get('score'),
                    duration_sec=rep.get('duration'),
                    warning_count=rep.get('warning_count', 0)
                )
                db.add(new_rep)
                db.commit()
                db.refresh(new_rep)
                
                # Save Feedbacks for this rep
                feedbacks = rep.get('feedbacks', [])
                for fb in feedbacks:
                    new_fb = ExerciseFeedback(
                        rep_id=new_rep.rep_id,
                        body_part=fb.get('body_part'),
                        issue=fb.get('issue'),
                        timestamp_in_video=fb.get('timestamp')
                    )
                    db.add(new_fb)
            
            db.commit()
    except Exception as e:
        print(f"Error saving reps: {e}")

    # Update Goal Status if active goal exists
    if active_goal:
        try:
            status = 0 # Default FAIL
            
            # Check based on target type
            if active_goal.target_type == 'reps':
                if total_reps_count > active_goal.target_reps:
                    status = 2 # EXCEED
                elif total_reps_count == active_goal.target_reps:
                    status = 1 # SUCCESS
                else: # < target
                    status = 0 # FAIL
            
            elif active_goal.target_type == 'time':
                # For time-based goals (Plank), video 'duration' includes pauses!
                # PRIORITY 1: use 'valid_duration' from frontend (RecordClient) - most accurate
                # PRIORITY 2: sum of rep durations from analysis
                # PRIORITY 3: video duration (fallback, least/inaccurate)
                
                final_valid_duration = 0
                if valid_duration > 0:
                    final_valid_duration = valid_duration
                else:
                    # For plank: use total_time from score_data (most accurate source)
                    # because reps_list contains virtual reps whose duration sum may not equal actual elapsed_time
                    try:
                        score_info = json.loads(score_data) if isinstance(score_data, str) else score_data
                        final_valid_duration = score_info.get('total_time', 0)
                    except:
                        pass
                    if not final_valid_duration and reps_list:
                        final_valid_duration = sum(r.get('duration', 0) for r in reps_list)
                    if not final_valid_duration:
                        final_valid_duration = duration  # Last resort fallback
                
                print(f"Goal Check: Target={active_goal.target_time_sec}, ValidDuration={final_valid_duration}, TotalDuration={duration}")

                # Use a larger buffer (3 sec) to match Frontend's warning grace period
                # If user survives until 7s of a 10s Plank, counting the 3s warning buffer, it's virtually 10s.
                
                if final_valid_duration >= active_goal.target_time_sec + 5:
                    status = 2 # EXCEED (Only if held significantly longer than target)
                elif final_valid_duration >= active_goal.target_time_sec - 3: # Allow 3s under-shoot as success
                    status = 1 # SUCCESS
                else:
                    status = 0 # FAIL
            
            # Update status
            active_goal.status = status
                
            db.add(active_goal)
            db.commit()
            print(f"Updated goal {active_goal.goal_id} status to {active_goal.status}")
            
        except Exception as e:
            print(f"Error updating goal status: {e}")


    # 4. Save Overall Score
    try:
        score_info = json.loads(score_data)
        # allow saving even if 0 reps
        if score_info: 
            from app.models.score import Score
            new_score = Score(
                video_id=new_video.video_id,
                total_score=score_info.get('total_score', 0),
                avg_score=score_info.get('average_score', 0),
                max_score=score_info.get('max_score', 0),
                min_score=score_info.get('min_score', 0),
                accuracy_percent=score_info.get('accuracy_percent', 0)
            )
            db.add(new_score)
            db.commit()
            print(f"Saved score for video {new_video.video_id}")
            
    except Exception as e:
        print(f"Error saving score: {e}")
    
    return {
        "status": "success",
        "video_id": new_video.video_id,
        "video_path": str(file_path),
        "message": "Video uploaded and saved to database successfully"
    }

@router.get("/history")
def get_user_history(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Query videos with exercise info
        # Use cast to avoid Enum validation issues if DB has distinct values
        from sqlalchemy import String, cast
        
        videos = db.query(Video, cast(Exercise_type.type_name, String).label("type_name"))\
            .join(Exercise_type, Video.type_id == Exercise_type.type_id)\
            .filter(Video.user_id == current_user.user_id)\
            .order_by(Video.started_at.desc().nulls_last())\
            .offset(skip)\
            .limit(limit)\
            .all()
        
        history_list = []
        
        for video, type_name_str in videos:
            # Count reps for this video
            reps_count = db.query(func.count(ExerciseRep.rep_id))\
                .filter(ExerciseRep.video_id == video.video_id)\
                .scalar()
                
            history_list.append({
                "id": video.video_id,
                "name": type_name_str, # It's already a string now
                "started_at": video.started_at,
                "duration_sec": video.duration_sec,
                "reps": reps_count or 0,
                "video_path": video.video_path
            })
            
        return history_list
    except Exception as e:
        print(f"Error getting history: {str(e)}")
        import traceback
        traceback.print_exc()
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.get("/video/{video_id}")
async def get_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    video = db.query(Video).filter(Video.video_id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Normalize path usage
    file_path = Path(video.video_path)
    if not file_path.exists():
        # Fallback check if it was saved with mixed slashes
        # Try to resolve relative to project root or absolute
        if not file_path.is_absolute():
            # Assume it's relative to root or some known dir?
            # Current logic saves absolute path? Let's check upload code.
            # Upload code: file_path = upload_dir / file_name ; upload_dir = "d:/finalproject/videos" ...
            pass
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found on server")

    return FileResponse(file_path, media_type="video/webm")

@router.get("/session/{video_id}")
def get_session_details(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Get Video & Score & Type Name
    from app.models.score import Score
    from sqlalchemy import String, cast
    
    # Query Video joined with Exercise_type
    result = db.query(Video, cast(Exercise_type.type_name, String).label("type_name"))\
        .join(Exercise_type, Video.type_id == Exercise_type.type_id)\
        .filter(Video.video_id == video_id)\
        .first()
        
    if not result:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video, type_name = result
        
    # Check ownership
    if video.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this session")

    score = db.query(Score).filter(Score.video_id == video_id).first()
    
    # 2. Get Reps
    reps = db.query(ExerciseRep).filter(ExerciseRep.video_id == video_id).order_by(ExerciseRep.rep_number).all()
    
    # 3. Get Feedbacks (Collect all feedbacks from all reps)
    feedbacks = []
    reps_data = []
    
    current_time = 0.0 # Track start time of current rep
    
    for rep in reps:
        # Rep Details
        reps_data.append({
            "rep_no": rep.rep_number,
            "score": rep.score,
            "duration": rep.duration_sec,
            "warnings": rep.warning_count,
            "start_time": current_time # Start time of this rep
        })
        
        # Feedback Details
        for fb in rep.feedbacks:
            feedbacks.append({
                "timestamp": fb.timestamp_in_video,
                "timestamp_start_rep": current_time, # Added field: Start time of the rep containing this feedback
                "message": f"{fb.body_part}: {fb.issue}",
                "rep_no": rep.rep_number
            })
            
        # Update current_time for next rep
        current_time += float(rep.duration_sec or 0)
            
    # Sort feedbacks by timestamp
    feedbacks.sort(key=lambda x: x['timestamp'] or 0)

    # 4. Get Goal Status
    goal_status = None
    if video.goal_id:
        from app.models.exercise_goals import ExerciseGoal
        goal = db.query(ExerciseGoal).filter(ExerciseGoal.goal_id == video.goal_id).first()
        if goal:
            goal_status = goal.status
    
    return {
        "video_id": video.video_id,
        "type_name": type_name, # Added field
        "duration": video.duration_sec,
        "date": video.started_at,
        "goal_status": goal_status, # Added field
        "score": {
            "total": score.total_score if score else 0,
            "accuracy": score.accuracy_percent if score else 0,
            "max": score.max_score if score else 0,
            "min": score.min_score if score else 0,
            "avg": score.avg_score if score else 0
        },
        "reps": reps_data,
        "feedbacks": feedbacks
    }

