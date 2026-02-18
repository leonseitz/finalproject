from sqlalchemy import Column, Integer, String, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class PersonalDetail(Base):
    __tablename__ = "personal_detail"
    
    personal_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    fname = Column(String(255)) # ชื่อ
    lname = Column(String(255)) # นามสกุล
    height = Column(Numeric(5, 2)) # ส่วนสูง
    weight = Column(Numeric(5, 2)) # น้ำหนัก
    age = Column(Integer) # อายุ
    
    # Relationships
    user = relationship("User", back_populates="personal_detail")
