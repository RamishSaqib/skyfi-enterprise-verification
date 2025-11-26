import random
import asyncio
from datetime import datetime
from models import Company, RiskLevel

async def verify_company(company_data: Company):
    """
    Enhanced mock verification logic with reputation-based scoring.
    Simulates checks for Domain Age, SSL Certificate, and Registration Database.
    Calculates a weighted risk score based on company reputation.
    """
    # Simulate processing time
    await asyncio.sleep(1.5)
    
    findings = []
    risk_score = 0
    
    # Determine company reputation based on name and website
    company_name_lower = company_data.name.lower()
    website_lower = company_data.website.lower() if company_data.website else ""
    
    # Well-known legitimate companies (should get LOW risk scores: 0-20)
    well_known_companies = [
        'google', 'facebook', 'meta', 'microsoft', 'apple', 'amazon', 
        'netflix', 'twitter', 'linkedin', 'instagram', 'youtube',
        'tesla', 'nvidia', 'intel', 'ibm', 'oracle', 'salesforce'
    ]
    
    # Lesser-known but legitimate companies (should get MEDIUM risk scores: 30-50)
    lesser_known_companies = [
        'acme', 'globex', 'initech', 'umbrella', 'cyberdyne',
        'weyland', 'tyrell', 'oscorp', 'stark', 'wayne'
    ]
    
    # Determine reputation tier
    is_well_known = any(known in company_name_lower or known in website_lower for known in well_known_companies)
    is_lesser_known = any(lesser in company_name_lower or lesser in website_lower for lesser in lesser_known_companies)
    
    # Fake/suspicious indicators
    suspicious_keywords = ['scam', 'fake', 'phishing', 'fraud', 'test123', 'xyz', 'temp']
    is_suspicious = any(sus in company_name_lower or sus in website_lower for sus in suspicious_keywords)
    
    # 1. Domain Age Check (Weight: 30)
    if is_well_known:
        # Well-known companies always have old domains
        findings.append({"source": "DomainTools", "status": "Pass", "details": "Domain registered > 10 years ago."})
    elif is_lesser_known:
        # Lesser-known companies have moderate domain age
        findings.append({"source": "DomainTools", "status": "Pass", "details": "Domain registered > 3 years ago."})
    elif is_suspicious:
        # Suspicious companies have new domains
        risk_score += 30
        findings.append({"source": "DomainTools", "status": "Warning", "details": "Domain registered < 6 months ago."})
    else:
        # Unknown companies - random but likely newer
        risk_score += 25
        findings.append({"source": "DomainTools", "status": "Warning", "details": "Domain registered < 1 year ago."})

    # 2. SSL Certificate Check (Weight: 20)
    if is_well_known:
        # Well-known companies always have valid SSL
        findings.append({"source": "SSL Labs", "status": "Pass", "details": "Valid EV SSL certificate found with A+ rating."})
    elif is_lesser_known:
        # Lesser-known companies usually have SSL
        findings.append({"source": "SSL Labs", "status": "Pass", "details": "Valid SSL certificate found."})
    elif is_suspicious:
        # Suspicious companies often lack proper SSL
        risk_score += 20
        findings.append({"source": "SSL Labs", "status": "Fail", "details": "No valid SSL certificate found."})
    else:
        # Unknown companies - might have basic SSL
        risk_score += 10
        findings.append({"source": "SSL Labs", "status": "Warning", "details": "Basic SSL certificate found (not EV)."})

    # 3. Registration Database Check (Weight: 50)
    if is_well_known:
        # Well-known companies are always in registries
        findings.append({"source": "OpenCorporates", "status": "Pass", "details": f"Company '{company_data.name}' verified in multiple international registries."})
    elif is_lesser_known:
        # Lesser-known companies are in registries but with less detail
        findings.append({"source": "OpenCorporates", "status": "Pass", "details": f"Company '{company_data.name}' found in registry."})
        risk_score += 15  # Small penalty for less verification
    elif is_suspicious:
        # Suspicious companies not found
        risk_score += 50
        findings.append({"source": "OpenCorporates", "status": "Fail", "details": f"Company '{company_data.name}' NOT found in any registry."})
    else:
        # Unknown companies - might not be found
        risk_score += 40
        findings.append({"source": "OpenCorporates", "status": "Fail", "details": f"Company '{company_data.name}' NOT found in registry."})

    # 4. Contact Info Verification (Weight: 10 each)
    # Email Verification
    email_verified = False
    if is_well_known:
        email_verified = True
        findings.append({"source": "Hunter.io", "status": "Pass", "details": f"Corporate email domain verified for {company_data.website}. Multiple valid patterns found."})
    elif is_lesser_known:
        email_verified = True
        findings.append({"source": "Hunter.io", "status": "Pass", "details": f"Corporate email domain verified for {company_data.website}."})
        risk_score += 5
    elif is_suspicious:
        risk_score += 10
        findings.append({"source": "Hunter.io", "status": "Warning", "details": f"No valid corporate email patterns found for {company_data.website}."})
    else:
        risk_score += 10
        findings.append({"source": "Hunter.io", "status": "Warning", "details": f"Limited corporate email verification for {company_data.website}."})

    # Phone Verification
    phone_verified = False
    if is_well_known:
        phone_verified = True
        findings.append({"source": "Twilio Lookup", "status": "Pass", "details": "Official phone number verified with multiple contact points."})
    elif is_lesser_known:
        phone_verified = True
        findings.append({"source": "Twilio Lookup", "status": "Pass", "details": "Official phone number verified."})
        risk_score += 5
    elif is_suspicious:
        risk_score += 10
        findings.append({"source": "Twilio Lookup", "status": "Warning", "details": "No official phone number found."})
    else:
        risk_score += 10
        findings.append({"source": "Twilio Lookup", "status": "Warning", "details": "Phone number verification incomplete."})
        
    # Cap risk score at 100 (to keep it as a percentage)
    risk_score = min(risk_score, 100)
    
    # Determine Risk Level
    if risk_score < 30:
        risk_level = RiskLevel.LOW
    elif risk_score < 60:
        risk_level = RiskLevel.MEDIUM
    elif risk_score < 85:
        risk_level = RiskLevel.HIGH
    else:
        risk_level = RiskLevel.CRITICAL
            
    # Construct Report
    report_data = {
        "summary": f"Verification for {company_data.name} completed with Risk Level: {risk_level.value.upper()}.",
        "sources": ["OpenCorporates", "LinkedIn", "DomainTools", "SSL Labs", "Hunter.io", "Twilio"],
        "findings": findings,
        "match_details": {
            "name_match": True, # Simulated
            "website_match": True, # Simulated
            "email_verified": email_verified,
            "phone_verified": phone_verified
        },
        "generated_at": datetime.utcnow().isoformat()
    }
    
    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "report_data": report_data,
        "verified": True
    }
