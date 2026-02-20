from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class ExerciseGoal(Base):
    __tablename__ = "exercise_goals"

    goal_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False) # ผู้ใช้
    type_id = Column(Integer, ForeignKey("exercise_type.type_id"), nullable=False) # ประเภท
    target_type = Column(String(50))    # ประเภท 'reps', 'time'
    target_reps = Column(Integer, default=0) # เป้าหมายจำนวน
    target_time_sec = Column(Integer, default=0) # เป้าหมายระยะเวลา
    auto_stop = Column(Boolean, default=False) # ทำที่หลังว่าหยุดอัตโนมัติไหม
    status = Column(Integer, nullable=True, default=None)  # None=active, 0=fail, 1=success, 2=exceed
    created_at = Column(DateTime, server_default=func.now())

    # --- Relationships ---
    user = relationship("User", back_populates="goals")
    exercise_type = relationship("Exercise_type", back_populates="goals")
    videos = relationship("Video", back_populates="goal")