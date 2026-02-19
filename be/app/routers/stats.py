from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import List, Optional
from datetime import datetime, date, timedelta
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.video import Video
from app.models.score import Score
from app.models.exercise_rep import ExerciseRep
from app.models.exercise_feedback import ExerciseFeedback
from app.models.exercise_type import Exercise_type

router = APIRouter()

@router.get("/daily")
def get_daily_stats(
    target_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        if target_date is None:
            target_date = date.today()
        
        # Define start and end of the target day
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = datetime.combine(target_date, datetime.max.time())
        
        # Query Videos for the user on that day
        videos = db.query(Video).filter(
            Video.user_id == current_user.user_id,
            Video.started_at >= start_of_day,
            Video.started_at <= end_of_day
        ).all()
        
        video_ids = [v.video_id for v in videos]
        
        if not video_ids:
            return {
                "date": target_date,
                "total_score": 0,
                "total_duration_sec": 0,
                "total_exercises": 0,
                "calories_burned": 0, # Placeholder if no calculation logic yet
                "exercise_stats": [],
                "mistake_summary": {
                    "total_reps": 0,
                    "correct_reps": 0,
                    "incorrect_reps": 0,
                    "accuracy": 0
                },
                "common_mistakes": [],
                "comparison": {
                    "score_vs_avg": 0,
                    "time_vs_avg": 0,
                    "calories_vs_avg": 0,
                    "reps_vs_avg": 0
                }
            }

        # 1. Total Score & Duration
        total_score = db.query(func.sum(Score.total_score)).filter(Score.video_id.in_(video_ids)).scalar() or 0
        total_duration = sum(v.duration_sec for v in videos if v.duration_sec)
        
        # 2. Mistakes Analysis
        # Get all feedbacks for these videos with exercise type info
        feedbacks = db.query(ExerciseFeedback.issue, Exercise_type.type_name).join(
            ExerciseRep, ExerciseFeedback.rep_id == ExerciseRep.rep_id
        ).join(
            Video, ExerciseRep.video_id == Video.video_id
        ).join(
            Exercise_type, Video.type_id == Exercise_type.type_id
        ).filter(
            Video.video_id.in_(video_ids)
        ).all()
        
        mistake_counts = {}
        for issue, type_name in feedbacks:
            if issue:
                # Handle Enum or String for type_name
                import enum
                if isinstance(type_name, enum.Enum):
                    exercise_name = type_name.value
                else:
                    exercise_name = str(type_name)
                    
                key = (issue, exercise_name)
                mistake_counts[key] = mistake_counts.get(key, 0) + 1
                
        # Top 3 Common Mistakes
        sorted_mistakes = sorted(mistake_counts.items(), key=lambda x: x[1], reverse=True)
        common_mistakes = [
            {"issue": k[0], "exercise_name": k[1], "count": v} 
            for k, v in sorted_mistakes[:3]
        ]
        
        # 3. Correct vs Incorrect
        total_reps_count = db.query(ExerciseRep).filter(ExerciseRep.video_id.in_(video_ids)).count()
        reps_with_warnings = db.query(ExerciseRep).filter(
            ExerciseRep.video_id.in_(video_ids),
            ExerciseRep.warning_count > 0
        ).count()
        
        correct_reps = total_reps_count - reps_with_warnings
        
        # 4. Comparison (vs User's All-time Daily Average)
        distinct_days = db.query(func.count(func.distinct(func.date(Video.started_at)))).filter(
            Video.user_id == current_user.user_id
        ).scalar() or 1
        
        # Simple query for all time stats
        all_videos = db.query(Video).filter(Video.user_id == current_user.user_id).all()
        all_video_ids = [v.video_id for v in all_videos]
        
        user_total_score = 0
        if all_video_ids:
            user_total_score = db.query(func.sum(Score.total_score)).filter(Score.video_id.in_(all_video_ids)).scalar() or 0
            
        user_total_duration = sum(v.duration_sec for v in all_videos if v.duration_sec)
        
        # Calculate Total Reps across all history
        user_total_reps = db.query(func.count(ExerciseRep.rep_id)).join(Video).filter(
             Video.user_id == current_user.user_id
        ).scalar() or 0

        avg_daily_score = user_total_score / distinct_days if distinct_days > 0 else 0
        avg_daily_duration = user_total_duration / distinct_days if distinct_days > 0 else 0
        avg_daily_reps = user_total_reps / distinct_days if distinct_days > 0 else 0
        # Calories approx formula: duration * 0.15
        avg_daily_calories = avg_daily_duration * 0.15
        
        # 5. Exercise Breakdown
        exercise_types = db.query(Exercise_type).all()
        exercise_stats = []

        try:
            video_reps_query = db.query(ExerciseRep.video_id, func.count(ExerciseRep.rep_id)).filter(
                ExerciseRep.video_id.in_(video_ids)
            ).group_by(ExerciseRep.video_id).all()
            video_reps_map = {v_id: count for v_id, count in video_reps_query}

            for ex_type in exercise_types:
                type_videos = [v for v in videos if v.type_id == ex_type.type_id]
                type_reps = 0
                type_duration = 0
                
                for v in type_videos:
                    type_reps += video_reps_map.get(v.video_id, 0)
                    type_duration += (v.duration_sec or 0)
                
                # Safe type name conversion
                import enum
                type_name = ex_type.type_name
                if isinstance(type_name, enum.Enum):
                    type_name_str = type_name.value
                else:
                    type_name_str = str(type_name)

                exercise_stats.append({
                    "type_id": ex_type.type_id,
                    "type_name": type_name_str,
                    "reps": type_reps,
                    "duration_sec": type_duration,
                    "calories": int(type_duration * 0.15) 
                })
        except Exception as e:
            print(f"Error calculating exercise stats: {e}")
            import traceback
            traceback.print_exc()

        # 6. Best Session of the Day
        best_session = None
        try:
            best_video_row = db.query(Video, Score, Exercise_type)\
                .join(Score, Video.video_id == Score.video_id)\
                .join(Exercise_type, Video.type_id == Exercise_type.type_id)\
                .filter(Video.video_id.in_(video_ids))\
                .order_by(desc(Score.total_score))\
                .first()

            if best_video_row:
                video_obj, score_obj, type_obj = best_video_row
                
                # Count reps
                reps_count = db.query(func.count(ExerciseRep.rep_id))\
                    .filter(ExerciseRep.video_id == video_obj.video_id)\
                    .scalar() or 0

                # Safe type name
                import enum
                type_name = type_obj.type_name
                type_name_str = type_name.value if isinstance(type_name, enum.Enum) else str(type_name)

                best_session = {
                    "exercise": type_name_str,
                    "reps": reps_count,
                    "score": score_obj.total_score,
                    "duration_sec": video_obj.duration_sec,
                    "date": video_obj.started_at.isoformat()
                }
        except Exception as e:
            print(f"Error calculating best session: {e}")

        return {
            "date": target_date,
            "total_score": total_score,
            "total_duration_sec": total_duration,
            "total_exercises": len(video_ids), 
            "calories_burned": int(total_duration * 0.15),
            "exercise_stats": exercise_stats,
            "best_session": best_session,
            "mistake_summary": {
                "total_reps": total_reps_count,
                "correct_reps": correct_reps,
                "incorrect_reps": reps_with_warnings,
                "accuracy": (correct_reps / total_reps_count * 100) if total_reps_count > 0 else 0
            },
            "common_mistakes": common_mistakes,
            "comparison": {
                "score_vs_avg": total_score - avg_daily_score,
                "time_vs_avg": total_duration - avg_daily_duration,
                "calories_vs_avg": int(total_duration * 0.15) - avg_daily_calories,
                "reps_vs_avg": total_reps_count - avg_daily_reps
            }
        }
    except Exception as e:
        print(f"CRITICAL ERROR in get_daily_stats: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/monthly")
def get_monthly_stats(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    if month is None:
        month = today.month
    if year is None:
        year = today.year
        
    # Start and End of Month
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
        
    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())
    
    videos = db.query(Video).filter(
        Video.user_id == current_user.user_id,
        Video.started_at >= start_dt,
        Video.started_at <= end_dt
    ).all()
    
    video_ids = [v.video_id for v in videos]
    
    if not video_ids:
        return {
            "year": year, 
            "month": month,
            "total_score": 0, 
            "total_duration": 0,
            "calories_burned": 0,
            "activity_trend": [],
            "exercise_distribution": []
        }

    # 1. Aggegated Stats
    total_score = db.query(func.sum(Score.total_score)).filter(Score.video_id.in_(video_ids)).scalar() or 0
    total_duration = sum(v.duration_sec for v in videos if v.duration_sec)
    
    # 2. Activity Trend (Daily sum of duration/score)
    # Group by date
    trend_data = {}
    # Initialize all days in month
    current = start_date
    while current <= end_date:
        trend_data[current.strftime("%Y-%m-%d")] = {"date": current.strftime("%d"), "score": 0, "duration": 0}
        current += timedelta(days=1)
        
    video_scores = db.query(Score.video_id, Score.total_score).filter(Score.video_id.in_(video_ids)).all()
    score_map = {vs.video_id: vs.total_score for vs in video_scores}
    
    for v in videos:
        day_key = v.started_at.strftime("%Y-%m-%d")
        if day_key in trend_data:
            trend_data[day_key]["duration"] += (v.duration_sec or 0)
            trend_data[day_key]["score"] += score_map.get(v.video_id, 0)
            
    activity_trend = list(trend_data.values())
    
    # 3. Exercise Type Distribution
    # Join with ExerciseType
    # Use cast to avoid Enum validation issues if DB has values matching Enum values but SQLAlchemy fails to map
    from sqlalchemy import String, cast
    
    type_counts = db.query(
        cast(Exercise_type.type_name, String).label("type_name"), 
        func.count(Video.video_id)
    ).join(Video, Video.type_id == Exercise_type.type_id)\
     .filter(Video.video_id.in_(video_ids))\
     .group_by(Exercise_type.type_name).all()
     
    exercise_distribution = [{"name": name, "value": count} for name, count in type_counts]
    
    # 4. Best Session of the Month
    best_session = None
    try:
        best_video_row = db.query(Video, Score, Exercise_type)\
            .join(Score, Video.video_id == Score.video_id)\
            .join(Exercise_type, Video.type_id == Exercise_type.type_id)\
            .filter(Video.video_id.in_(video_ids))\
            .order_by(desc(Score.total_score))\
            .first()

        if best_video_row:
            video_obj, score_obj, type_obj = best_video_row
            
            # Count reps
            reps_count = db.query(func.count(ExerciseRep.rep_id))\
                .filter(ExerciseRep.video_id == video_obj.video_id)\
                .scalar() or 0

            import enum
            type_name = type_obj.type_name
            type_name_str = type_name.value if isinstance(type_name, enum.Enum) else str(type_name)

            best_session = {
                "exercise": type_name_str,
                "reps": reps_count,
                "score": score_obj.total_score,
                "duration_sec": video_obj.duration_sec,
                "date": video_obj.started_at.isoformat()
            }
    except Exception as e:
        print(f"Error calculating monthly best session: {e}")

    return {
        "year": year,
        "month": month,
        "total_score": total_score,
        "total_duration": total_duration,
        "calories_burned": int(total_duration * 0.15),
        "activity_trend": activity_trend,
        "exercise_distribution": exercise_distribution,
        "best_session": best_session
    }
