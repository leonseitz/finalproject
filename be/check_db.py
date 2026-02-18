import sys
import logging

# Disable SQLAlchemy echo to avoid encoding issues
logging.basicConfig(level=logging.ERROR)

from app.core.database import engine, SessionLocal
from sqlalchemy import text, inspect

def check_database():
    results = []
    
    try:
        # 1. Test Connection
        results.append("="*60)
        results.append("DATABASE CONNECTION TEST")
        results.append("="*60)
        
        with engine.connect() as conn:
            results.append("\n[1] Connection: SUCCESS")
            results.append(f"    Database: {engine.url.database}")
            results.append(f"    Host: {engine.url.host}:{engine.url.port}")
            results.append(f"    Username: {engine.url.username}")
            
            # Get PostgreSQL version
            version = conn.execute(text("SELECT version()")).fetchone()[0]
            results.append(f"    Version: {version.split(',')[0]}")
        
        # 2. Check if tables exist
        results.append("\n[2] Tables Check:")
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if tables:
            results.append(f"    Found {len(tables)} tables:")
            for table in tables:
                results.append(f"    - {table}")
        else:
            results.append("    No tables found. Creating tables...")
            from app.models import Base
            Base.metadata.create_all(bind=engine)
            
            # Check again
            tables = inspector.get_table_names()
            results.append(f"    Created {len(tables)} tables:")
            for table in tables:
                results.append(f"    - {table}")
        
        # 3. Test queries
        results.append("\n[3] Query Test:")
        db = SessionLocal()
        
        from app.models import User, Video, Fitness
        
        user_count = db.query(User).count()
        video_count = db.query(Video).count()
        fitness_count = db.query(Fitness).count()
        
        results.append(f"    Users: {user_count} records")
        results.append(f"    Videos: {video_count} records")
        results.append(f"    Fitness: {fitness_count} records")
        
        db.close()
        
        results.append("\n" + "="*60)
        results.append("RESULT: DATABASE CONNECTION SUCCESSFUL!")
        results.append("="*60)
        
        status = "SUCCESS"
        
    except Exception as e:
        results.append(f"\n[ERROR] {type(e).__name__}: {str(e)}")
        status = "FAILED"
    
    # Write to file
    with open("database_test_result.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(results))
    
    # Print summary
    print("="*60)
    print(f"Database Test: {status}")
    print("="*60)
    print("Results saved to: database_test_result.txt")
    
    if status == "SUCCESS":
        print("\nSUMMARY:")
        if tables:
            print(f"  Tables: {len(tables)}")
            print(f"  Users: {user_count}")
            print(f"  Videos: {video_count}")
            print(f"  Fitness: {fitness_count}")
    
    return status == "SUCCESS"

if __name__ == "__main__":
    success = check_database()
    sys.exit(0 if success else 1)
