from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), nullable=False) # ชื่อผู้ใช้
    password = Column(String(255), nullable=False) # รหัสผ่าน
    tel = Column(String(20)) # เบอร์โทรศัพท์
    email = Column(String(255), nullable=False) # อีเมล
    
    # Relationships
    personal_detail = relationship("PersonalDetail", back_populates="user", uselist=False)
    videos = relationship("Video", back_populates="user")
    goals = relationship("ExerciseGoal", back_populates="user")
