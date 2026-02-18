from sqlalchemy import Column, Integer, ForeignKey, DateTime, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Score(Base):
    __tablename__ = "scores"
    
    score_id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.video_id"))
    total_score = Column(Integer) # คะแนนรวม
    avg_score = Column(Numeric(5, 2)) # คะแนนเฉลี่ย
    max_score = Column(Integer) # คะแนนสูงสุด
    min_score = Column(Integer) # คะแนนต่ำสุด
    accuracy_percent = Column(Numeric(5, 2)) # ความถูกต้อง
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    video = relationship("Video", back_populates="scores")
