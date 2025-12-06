import requests

BASE_URL = "http://localhost:8000/api"

def test_register():
    print("Testing Registration...")
    url = f"{BASE_URL}/auth/register/" 
    data = {
        "username": "test_user_registration",
        "email": "test_user_registration@example.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_register()
