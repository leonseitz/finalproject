
import sys
import os
import logging

# Disable SQLAlchemy logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.core.database import SessionLocal
from app.models.exercise_type import Exercise_type
from app.models.video import Video
from app.models.exercise_rep import ExerciseRep
from app.models.score import Score
from sqlalchemy import desc

def verify_db():
    output_file = "verify_output.txt"
    with open(output_file, "w", encoding="utf-8") as f:
        db = SessionLocal()
        try:
            f.write("--- Verifying Exercise Types ---\n")
            types = db.query(Exercise_type).all()
            plank_type = None
            for t in types:
                f.write(f"ID: {t.type_id}, Name: {t.type_name}\n")
                if t.type_id == 5:
                    plank_type = t
            
            if not plank_type:
                f.write("❌ Plank type (ID 5) NOT FOUND!\n")
            else:
                 f.write("✅ Plank type (ID 5) found.\n")

            f.write("\n--- Verifying Recent Videos (Type 5) ---\n")
            videos = db.query(Video).filter(Video.type_id == 5).order_by(desc(Video.created_at)).limit(5).all()
            if not videos:
                f.write("❌ No Plank videos found.\n")
            else:
                for v in videos:
                    f.write(f"Video ID: {v.video_id}, Created: {v.created_at}, Goal ID: {v.goal_id}\n")
                    
                    # Check Reps
                    reps = db.query(ExerciseRep).filter(ExerciseRep.video_id == v.video_id).all()
                    f.write(f"  - Reps count: {len(reps)}\n")
                    for r in reps:
                        f.write(f"    - Rep {r.rep_number}: Score={r.score}, Warning={r.warning_count}\n")
                    
                    # Check Score
                    score = db.query(Score).filter(Score.video_id == v.video_id).first()
                    if score:
                        f.write(f"  - Score: Total={score.total_score}, Avg={score.avg_score}, Accuracy={score.accuracy_percent}\n")
                    else:
                        f.write("  ❌ Score NOT FOUND for this video\n")

        except Exception as e:
            f.write(f"Error: {e}\n")
        finally:
            db.close()
    print(f"Verification output written to {output_file}")


if __name__ == "__main__":
    verify_db()
