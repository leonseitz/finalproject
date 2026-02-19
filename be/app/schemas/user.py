from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: EmailStr
    tel: Optional[str] = None

class UserCreate(UserBase):
    password: str
    fname: Optional[str] = None
    lname: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None

class UserUpdate(BaseModel):
    fname: Optional[str] = None
    lname: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    username: Optional[str] = None


class UserLogin(BaseModel):
    identifier: str # Can be username or email
    password: str

class PersonalDetailOut(BaseModel):
    fname: Optional[str] = None
    lname: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    
    class Config:
        from_attributes = True

class UserOut(UserBase):
    user_id: int
    personal_detail: Optional[PersonalDetailOut] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
