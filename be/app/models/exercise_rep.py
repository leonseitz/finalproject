from sqlalchemy import Column, Integer, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class ExerciseRep(Base):
    __tablename__ = "exercise_reps"
    
    rep_id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.video_id"))
    rep_number = Column(Integer) # จำนวนครั้งที่
    score = Column(Integer) # คะแนน 5คือ คะแนนเต็ม,3คือ มีการแจ้งเตือน 1 จุด,1คือมีการแจ้งเตือน 2 จุด หรือมากกว่า
    duration_sec = Column(Numeric(5, 2)) # ระยะเวลาที่ใช้ในการทำ 1 ครั้ง
    warning_count = Column(Integer) # จำนวนคำเตือน
    
    # Relationships
    video = relationship("Video", back_populates="exercise_reps")
    feedbacks = relationship("ExerciseFeedback", back_populates="rep")
