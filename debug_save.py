import requests
import sys
import os

# Usage: python debug_save.py <username> <password> <image_path> <album_id>

if len(sys.argv) < 5:
    print("Usage: python debug_save.py <username> <password> <image_path> <album_id>")
    sys.exit(1)

username = sys.argv[1]
password = sys.argv[2]
image_path = sys.argv[3]
album_id = sys.argv[4]
base_url = 'http://localhost:8000'

# 1. Login
resp = requests.post(f'{base_url}/api/auth/login/', data={'username': username, 'password': password})
if resp.status_code != 200:
    print(f"Login failed: {resp.text}")
    sys.exit(1)

token = resp.json()['access']
headers = {'Authorization': f'Bearer {token}'}

# 2. Upload (Save Copy simulation)
print(f"Uploading to album: {album_id}")
with open(image_path, 'rb') as f:
    files = {'image': ('edited_image.jpg', f, 'image/jpeg')}
    data = {
        'title': 'Debug Save Copy',
        'album': album_id,
        'description': 'Debug description'
    }
    upload_resp = requests.post(f'{base_url}/api/gallery/photos/', headers=headers, data=data, files=files)
    
    print(f"Status: {upload_resp.status_code}")
    print(f"Response: {upload_resp.text}")
