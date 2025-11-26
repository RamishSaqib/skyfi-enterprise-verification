from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class User(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: datetime

class UserInDB(User):
    hashed_password: str

class CompanyCreate(BaseModel):
    name: str
    website: str

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    website: Optional[str] = None

class Company(BaseModel):
    id: str
    name: str
    website: str
    verified: bool = False
    risk_score: Optional[int] = None
    risk_level: Optional[RiskLevel] = None
    report_data: Optional[dict] = None
    review_status: str = "pending"
    reviewed_at: Optional[datetime] = None
    created_at: datetime
