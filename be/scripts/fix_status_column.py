import sys
import os
from sqlalchemy import create_engine, text

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings

def fix_status_column():
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as connection:
        # Start transaction
        with connection.begin():
            print("Checking current columns...")
            # Check if column exists and its type (optional but good for logging)
            
            print("Updating 'active' to NULL...")
            connection.execute(text("UPDATE exercise_goals SET status = NULL WHERE status = 'active'"))
            
            print("Updating 'success' to 1...")
            connection.execute(text("UPDATE exercise_goals SET status = '1' WHERE status = 'success'"))
            
            print("Updating 'fail' to 0...")
            connection.execute(text("UPDATE exercise_goals SET status = '0' WHERE status = 'fail'"))
            
            print("Altering column type to INTEGER...")
            # USING clause handles explicit casting if needed, but we already updated values to be compatible numbers or NULL
            connection.execute(text("ALTER TABLE exercise_goals ALTER COLUMN status TYPE INTEGER USING status::integer"))
            
            print("Dropping default value if exists (was 'active')...")
            connection.execute(text("ALTER TABLE exercise_goals ALTER COLUMN status DROP DEFAULT"))
            
            print("Migration completed successfully.")

if __name__ == "__main__":
    try:
        fix_status_column()
    except Exception as e:
        print(f"Error: {e}")
