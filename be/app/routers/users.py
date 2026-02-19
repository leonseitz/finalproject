from fastapi import APIRouter, Depends
from app.schemas.user import UserOut, UserUpdate
from app.dependencies import get_current_user, get_db
from app.models.user import User
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserOut)
def update_user_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Update User table
    if user_update.username:
        current_user.username = user_update.username
    
    # Update or Create PersonalDetail
    if not current_user.personal_detail:
        from app.models.personal_detail import PersonalDetail
        new_detail = PersonalDetail(user_id=current_user.user_id)
        db.add(new_detail)
        current_user.personal_detail = new_detail
        db.flush() # Ensure personal_detail is available

    if user_update.fname is not None:
        current_user.personal_detail.fname = user_update.fname
    if user_update.lname is not None:
        current_user.personal_detail.lname = user_update.lname
    if user_update.age is not None:
        current_user.personal_detail.age = user_update.age
    if user_update.height is not None:
        current_user.personal_detail.height = user_update.height
    if user_update.weight is not None:
        current_user.personal_detail.weight = user_update.weight
    
    db.commit()
    db.refresh(current_user)
    return current_user

