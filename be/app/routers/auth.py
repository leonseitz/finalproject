from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, Token
from app.core.security import get_password_hash, verify_password, create_access_token

from app.models.personal_detail import PersonalDetail

router = APIRouter()

@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists (username or email)
    db_user = db.query(User).filter(
        or_(User.username == user.username, User.email == user.email)
    ).first()
    
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password,
        tel=user.tel
    )
    
    db.add(new_user)
    db.flush() # Flush to get user_id
    
    # Create personal detail
    personal_detail = PersonalDetail(
        user_id=new_user.user_id,
        fname=user.fname,
        lname=user.lname,
        age=user.age,
        height=user.height,
        weight=user.weight
    )
    db.add(personal_detail)
    
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    # Check if user exists (by email or username)
    user = db.query(User).filter(
        or_(User.email == user_credentials.identifier, User.username == user_credentials.identifier)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Credentials"
        )
    
    if not verify_password(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Credentials"
        )
    
    # Generate Token
    access_token = create_access_token(data={"sub": str(user.user_id)})
    
    return {"access_token": access_token, "token_type": "bearer"}
