import enum
from sqlalchemy import Column, Integer, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base

class ExerciseEnumList(str, enum.Enum):
    squat = "squat"
    plank = "plank"
    push_up = "push up"  # ใน DB มีเว้นวรรค ตรงนี้ก็ต้องมี
    pull_up = "pull up"
    bicep_curl = "bicep curl"

class Exercise_type(Base):
    __tablename__ = "exercise_type"
    
    type_id = Column(Integer, primary_key=True, index=True)
    type_name = Column(Enum(ExerciseEnumList, name="exercise_enum_list", values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    videos = relationship("Video", back_populates="exercise_type")
    goals = relationship("ExerciseGoal", back_populates="exercise_type")