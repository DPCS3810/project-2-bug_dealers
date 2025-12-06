
import requests
import os

BASE_URL = "http://localhost:8000/api"

def reproduce():
    # 1. Register/Login a user
    username = "repro_user"
    password = "password123"
    email = "repro@example.com"
    
    # Try login first
    login_url = f"{BASE_URL}/auth/login/"
    response = requests.post(login_url, data={"username": username, "password": password})
    
    if response.status_code != 200:
        # Register
        register_url = f"{BASE_URL}/auth/register/"
        print(f"Registering user: {username}")
        response = requests.post(register_url, json={"username": username, "password": password, "email": email})
        if response.status_code != 201:
            print(f"Registration failed: {response.text}")
            # try login again just in case it existed but login failed initially? Unlikely.
            
        # Login again
        response = requests.post(login_url, data={"username": username, "password": password})
        if response.status_code != 200:
             print(f"Login failed: {response.text}")
             return

    tokens = response.json()
    access_token = tokens['access']
    headers = {'Authorization': f'Bearer {access_token}'}
    print("Logged in successfully.")

    # 2. Try to create an Album
    print("Attempting to create an album...")
    album_data = {
        "title": "Repro Album",
        "description": "Testing creation failure"
    }
    response = requests.post(f"{BASE_URL}/gallery/albums/", json=album_data, headers=headers)
    print(f"Create Album Response: {response.status_code} - {response.text}")

    # 3. Try to upload a Photo
    print("Attempting to upload a photo...")
    # Create a dummy image
    from PIL import Image
    img = Image.new('RGB', (100, 100), color = 'red')
    img.save('test_repro.jpg')
    
    with open('test_repro.jpg', 'rb') as f:
        files = {'image': f}
        data = {'title': 'Repro Photo'}
        response = requests.post(f"{BASE_URL}/gallery/photos/", data=data, files=files, headers=headers)
        print(f"Upload Photo Response: {response.status_code} - {response.text}")
    
    # Cleanup
    if os.path.exists('test_repro.jpg'):
        os.remove('test_repro.jpg')

    # 4. Fetch Albums
    print("Attempting to fetch albums...")
    response = requests.get(f"{BASE_URL}/gallery/albums/", headers=headers)
    print(f"Fetch Albums Response: {response.status_code}")
    if response.status_code == 500:
        print(f"Error Content: {response.text}")
        
    try:
        data = response.json()
        print(f"Fetch Albums Data Type: {type(data)}")
        if isinstance(data, dict) and 'results' in data:
            print("Pagination detected!")
        else:
            print("No pagination detected (List).")
    except Exception as e:
        print(f"Failed to parse JSON: {e}")

if __name__ == "__main__":
    reproduce()
