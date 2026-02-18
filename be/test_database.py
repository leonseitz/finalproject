import sys
from app.core.database import engine, SessionLocal
from app.models import Base, User, Video, Fitness

def test_database():
    print("=" * 60)
    print("🔍 ทดสอบการเชื่อมต่อ Database")
    print("=" * 60)
    
    try:
        # 1. Test Connection
        print("\n[1/4] ทดสอบ Connection...")
        with engine.connect() as connection:
            print(f"✅ เชื่อมต่อสำเร็จ!")
            print(f"   Database: {engine.url.database}")
            print(f"   Host: {engine.url.host}")
            print(f"   Port: {engine.url.port}")
        
        # 2. Create Tables
        print("\n[2/4] สร้าง Tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ สร้าง Tables สำเร็จ!")
        
        # 3. List Tables
        print("\n[3/4] ตรวจสอบ Tables ใน Database...")
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"✅ พบ {len(tables)} tables:")
        for table in tables:
            print(f"   - {table}")
        
        # 4. Test Query
        print("\n[4/4] ทดสอบ Query...")
        db = SessionLocal()
        user_count = db.query(User).count()
        video_count = db.query(Video).count()
        fitness_count = db.query(Fitness).count()
        print(f"✅ Query สำเร็จ!")
        print(f"   Users: {user_count}")
        print(f"   Videos: {video_count}")
        print(f"   Fitness: {fitness_count}")
        db.close()
        
        print("\n" + "=" * 60)
        print("🎉 การเชื่อมต่อ Database ทำงานได้ปกติทุกอย่าง!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n❌ เกิดข้อผิดพลาด:")
        print(f"   Error: {str(e)}")
        print(f"   Type: {type(e).__name__}")
        
        print("\n💡 แนะนำการแก้ไข:")
        print("   1. ตรวจสอบว่า PostgreSQL Server ทำงานอยู่")
        print("   2. ตรวจสอบ DATABASE_URL ในไฟล์ .env")
        print("   3. ตรวจสอบ username/password")
        print("   4. ตรวจสอบว่า database 'finalproject' ถูกสร้างแล้ว")
        
        import traceback
        print("\n📋 รายละเอียด Error:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_database()
    sys.exit(0 if success else 1)
