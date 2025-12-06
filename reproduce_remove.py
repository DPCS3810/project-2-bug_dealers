import requests
import os

BASE_URL = "http://localhost:8000/api"

def login():
    try:
        login_data = {
            "username": "test_user_registration", 
            "password": "testpassword123"
        }
        res = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        if res.status_code == 200:
            return res.json()['access']
        print(f"Login failed: {res.text}")
        return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_remove():
    token = login()
    if not token:
        return

    print("Testing Profile Removal...")
    url = f"{BASE_URL}/auth/profile/"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json' 
    }
    
    # 1. First ensure we have a pic? (Skipping implementation of upload here, assuming one exists or it's okay to remove null)
    
    # 2. Send remove request
    payload = {"profile_picture": None}
    
    try:
        print("Sending PATCH with profile_picture: null")
        response = requests.patch(url, json=payload, headers=headers)
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('profile_picture') is None:
                print("SUCCESS: profile_picture is None")
            else:
                print(f"FAILURE: profile_picture is {data.get('profile_picture')}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_remove()
