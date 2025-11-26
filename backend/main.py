from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from auth import authenticate_user, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, fake_users_db
from models import User, Company, CompanyCreate, CompanyUpdate, Token

app = FastAPI(title="SkyFi Enterprise Verification API")

import os

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

# Add production origin if set
if "FRONTEND_URL" in os.environ:
    origins.append(os.environ["FRONTEND_URL"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Mock database for companies
fake_companies_db = []

from uuid import uuid4
from datetime import datetime

@app.post("/verify", response_model=Company)
async def trigger_verification(company_in: CompanyCreate, current_user: User = Depends(get_current_user)):
    from verification import verify_company
    
    # Check for duplicates
    existing_company = next((c for c in fake_companies_db if c.name.lower() == company_in.name.lower() or (c.website and company_in.website and c.website.lower() == company_in.website.lower())), None)
    if existing_company:
        return existing_company

    # Create Company object from input
    company = Company(
        id=str(uuid4()),
        created_at=datetime.utcnow(),
        **company_in.dict()
    )
    
    # Run verification
    result = await verify_company(company)
    
    # Update company with results
    verified_company = company.copy(update=result)
    fake_companies_db.append(verified_company)
    
    return verified_company

@app.post("/companies/{company_id}/review", response_model=Company)
async def review_company(company_id: str, status: str, current_user: User = Depends(get_current_user)):
    # Find company
    company = next((c for c in fake_companies_db if c.id == company_id), None)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Update status
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    company.review_status = status
    company.reviewed_at = datetime.utcnow()
    
    company.review_status = status
    company.reviewed_at = datetime.utcnow()
    
    return company

@app.post("/companies/{company_id}/reverify", response_model=Company)
async def reverify_company(company_id: str, current_user: User = Depends(get_current_user)):
    from verification import verify_company
    
    # Find company
    # We need the index to update it in the list
    company_index = next((i for i, c in enumerate(fake_companies_db) if c.id == company_id), None)
    if company_index is None:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company = fake_companies_db[company_index]
    
    # Run verification again
    result = await verify_company(company)
    
    # Update company with results
    # Reset review status since data might have changed
    result['review_status'] = 'pending'
    result['reviewed_at'] = None
    
    updated_company = company.copy(update=result)
    fake_companies_db[company_index] = updated_company
    
    return updated_company

@app.put("/companies/{company_id}", response_model=Company)
async def update_company(company_id: str, company_update: CompanyUpdate, current_user: User = Depends(get_current_user)):
    # Find company
    company_index = next((i for i, c in enumerate(fake_companies_db) if c.id == company_id), None)
    if company_index is None:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company = fake_companies_db[company_index]
    
    # Update fields
    update_data = company_update.dict(exclude_unset=True)
    updated_company = company.copy(update=update_data)
    
    # If website changed, reset verification status? 
    # For now, let's just update the data. The user can click Re-verify.
    # But to be safe, let's reset verified to False if website changes.
    if 'website' in update_data and update_data['website'] != company.website:
        updated_company.verified = False
        updated_company.risk_score = None
        updated_company.risk_level = None
        updated_company.report_data = None
        updated_company.review_status = 'pending'
        updated_company.reviewed_at = None

    fake_companies_db[company_index] = updated_company
    return updated_company

@app.get("/companies", response_model=list[Company])
async def get_companies(current_user: User = Depends(get_current_user)):
    return fake_companies_db

@app.get("/")
def read_root():
    return {"message": "SkyFi Enterprise Verification API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
