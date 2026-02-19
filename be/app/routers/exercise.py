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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload recorded video file and save tracking data to database"""
    # Create uploads directory if not exists
    upload_dir = Path("uploads") / str(exercise_id)
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
    
    try:
        print(f"Received reps_data: {reps_data}")
        reps_list = json.loads(reps_data)
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
                print(f"Saved rep {new_rep.rep_id}")
                
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
                if duration > active_goal.target_time_sec:
                    # For time, maybe exceeding is also good? Or is it "holding too long"?
                    # Usually holding longer is better/exceed.
                    status = 2 # EXCEED
                elif duration == active_goal.target_time_sec:
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
        print(f"Received score_data: {score_data}")
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
