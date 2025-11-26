from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from models import TokenData, User, UserInDB

# Secret key for signing JWTs (should be in env vars in production)
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = get_user(fake_users_db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

# Mock database for demonstration
fake_users_db = {
    "admin@skyfi.com": {
        "email": "admin@skyfi.com",
        "full_name": "Admin User",
        "hashed_password": get_password_hash("secret"),
        "role": "admin",
        "id": "1",
        "created_at": datetime.utcnow()
    }
}

def get_user(db, email: str):
    if email in db:
        user_dict = db[email]
        return UserInDB(**user_dict)
    return None

def authenticate_user(db, email, password):
    user = get_user(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user
