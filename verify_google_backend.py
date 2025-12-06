import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_google_login():
    print("Testing Google Login endpoint with dummy code...")
    url = f"{BASE_URL}/auth/google/"
    # Using a dummy code
    payload = {'code': 'dummy_invalid_code_12345'}
    
    try:
        response = requests.post(url, json=payload)
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 400:
            print("Success! Backend reachable, Google rejected invalid code (as expected).")
        elif response.status_code == 500:
            print("Failure! Backend crashed.")
        else:
            print(f"Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_google_login()
