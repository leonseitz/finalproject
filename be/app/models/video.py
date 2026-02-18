from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func # แนะนำให้ใช้ func.now() สำหรับเวลา server
from app.core.database import Base

class Video(Base):
    __tablename__ = "videos"
    
    video_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False) # ผู้ใช้
    type_id = Column(Integer, ForeignKey("exercise_type.type_id"), nullable=True) # ประเภท
    goal_id = Column(Integer, ForeignKey("exercise_goals.goal_id"), nullable=True) # วัตถุประสงค์
    video_path = Column(Text) # ตำแหน่งไฟล์คลิป
    duration_sec = Column(Integer)  # ความยาวคลิป (วินาที)
    started_at = Column(DateTime)   # เวลาเริ่มอัด
    ended_at = Column(DateTime)     # เวลาจบ
    
    created_at = Column(DateTime, server_default=func.now()) 
    
    # --- Relationships ---
    user = relationship("User", back_populates="videos")
    exercise_type = relationship("Exercise_type", back_populates="videos")
    goal = relationship("ExerciseGoal", back_populates="videos")
    exercise_reps = relationship("ExerciseRep", back_populates="video", cascade="all, delete-orphan")
    scores = relationship("Score", back_populates="video", cascade="all, delete-orphan")