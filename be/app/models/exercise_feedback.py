from sqlalchemy import Column, Integer, String, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class ExerciseFeedback(Base):
    __tablename__ = "exercise_feedback"
    
    feedback_id = Column(Integer, primary_key=True, index=True)
    rep_id = Column(Integer, ForeignKey("exercise_reps.rep_id"))
    body_part = Column(String(100)) # ส่วนที่ทำผิด
    issue = Column(Text) # แจ้งเตือนอะไร
    timestamp_in_video = Column(Numeric(5, 2)) # เวลาที่ผิดในวิดีโอ วินาที
    
    # Relationships
    rep = relationship("ExerciseRep", back_populates="feedbacks")
