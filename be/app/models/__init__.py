from app.core.database import Base

from app.models.user import User
from app.models.personal_detail import PersonalDetail
from app.models.exercise_type import Exercise_type
from app.models.video import Video
from app.models.exercise_rep import ExerciseRep
from app.models.exercise_feedback import ExerciseFeedback
from app.models.score import Score
from app.models.exercise_goals import ExerciseGoal

# Export all models
__all__ = [
    "Base",
    "User",
    "PersonalDetail",
    "Exercise_type",
    "Video",
    "ExerciseRep",
    "ExerciseFeedback",
    "Score",
    "ExerciseGoal",
]
