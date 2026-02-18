from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.core.config import get_settings
from app.core.database import engine
from app.models import Base

settings = get_settings()

# สร้าง Tables ทั้งหมดใน Database
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

# CORS Middleware สำหรับให้ Frontend เรียกใช้ได้
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# สร้างโฟลเดอร์สำหรับเก็บวิดีโอถ้ายังไม่มี
if not os.path.exists("uploads"):
    os.makedirs("uploads")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include Routers
from app.routers import exercise, auth, users
# from app.routers import video

app.include_router(exercise.router, prefix="/api/exercise", tags=["Exercise"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
# app.include_router(video.router, prefix="/api/videos", tags=["Videos"])

from app.routers import stats
app.include_router(stats.router, prefix="/api/stats", tags=["Stats"])

@app.get("/")
def root():
    return {
        "message": "Exercise Posture Detection API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

if __name__ == "__main__":
    import uvicorn
    # ใช้ "main:app" เพื่อให้ reload ทำงานได้
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
