import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings
from app.models.exercise_goals import ExerciseGoal

def check_error():
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        print("Attempting to insert a test goal with integer status...")
        # active_goal = ExerciseGoal(
        #     user_id=1, # Assume user 1 exists or use a simplified raw insert
             # ... 
        # )
        # Use raw SQL to be sure about what we are sending
        # But raw SQL might bypass SQLAlchemy type casting if we use text() with params.
        # Let's use the model to replicate the app's behavior.
        
        # We need a valid user_id and type_id.
        # Let's just try to select headers first to see column types if possible?
        # Postgres query to check column type:
        result = db.execute(text("SELECT data_type FROM information_schema.columns WHERE table_name = 'exercise_goals' AND column_name = 'status'"))
        row = result.fetchone()
        if row:
            print(f"Current 'status' column type in DB: {row[0]}")
        else:
            print("Column 'status' not found in table 'exercise_goals'.")
            
    except Exception as e:
        print(f"Error checking DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_error()
