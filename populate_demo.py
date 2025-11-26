#!/usr/bin/env python3
"""
Populate the backend with test companies for demonstration.
"""
import requests
import json

BASE_URL = "http://localhost:8000"

# Get authentication token
def get_token():
    response = requests.post(
        f"{BASE_URL}/token",
        data={"username": "admin@skyfi.com", "password": "secret"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    return response.json()["access_token"]

# Test verification for a company
def verify_company(token, name, website):
    response = requests.post(
        f"{BASE_URL}/verify",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json={"name": name, "website": website}
    )
    return response.json()

def main():
    print("Populating backend with test companies...")
    print()
    
    # Get auth token
    token = get_token()
    
    # Test companies
    companies = [
        ("Google", "google.com"),
        ("Facebook", "facebook.com"),
        ("Microsoft", "microsoft.com"),
        ("Acme Corporation", "acme-corp.com"),
        ("Globex Industries", "globex.com"),
        ("Fake Scam Inc", "fakescam123.xyz"),
        ("Test Phishing Co", "phishing-test.com"),
    ]
    
    for name, website in companies:
        print(f"✓ Verifying {name}...", end=" ")
        result = verify_company(token, name, website)
        print(f"Risk Score: {result['risk_score']}, Level: {result['risk_level'].upper()}")
    
    print()
    print("=" * 80)
    print("✅ All companies added! Now refresh your browser to see them.")
    print("=" * 80)

if __name__ == "__main__":
    main()
