from app.core.database import engine, SessionLocal
from app.models import User

def test_connection():
    print("🔍 กำลังทดสอบการเชื่อมต่อ Database...")
    try:
        # Test engine connection
        with engine.connect() as connection:
            print("✅ Database connection successful!")
            print(f"📋 Connected to: {engine.url}")
        
        # Test session
        db = SessionLocal()
        users = db.query(User).all()
        print(f"✅ Query successful! พบ {len(users)} users ใน database")
        db.close()
        
        print("\n🎉 การเชื่อมต่อทำงานได้ปกติ!")
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\n💡 กรุณาตรวจสอบ:")
        print("   1. DATABASE_URL ในไฟล์ .env ถูกต้องหรือไม่")
        print("   2. Database server ทำงานอยู่หรือไม่")
        print("   3. Username/Password ถูกต้องหรือไม่")
        return False

if __name__ == "__main__":
    test_connection()
