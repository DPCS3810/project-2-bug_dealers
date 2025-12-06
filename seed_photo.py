import requests
import sys
import os

# Usage: python seed_photo.py <username> <password> <image_path>

if len(sys.argv) < 4:
    print("Usage: python seed_photo.py <username> <password> <image_path>")
    sys.exit(1)

username = sys.argv[1]
password = sys.argv[2]
image_path = sys.argv[3]
base_url = 'http://localhost:8000'

# 1. Login
# Correct URL: /api/auth/login/
login_resp = requests.post(f'{base_url}/api/auth/login/', data={'username': username, 'password': password})
if login_resp.status_code != 200:
    print(f"Login failed: {login_resp.text}")
    sys.exit(1)

token = login_resp.json()['access']
headers = {'Authorization': f'Bearer {token}'}

# 2. Get or Create Album
# Correct URL: /api/gallery/albums/
albums_resp = requests.get(f'{base_url}/api/gallery/albums/', headers=headers)
if albums_resp.status_code != 200:
     print(f"Failed to fetch albums: {albums_resp.text}")
     sys.exit(1)

albums = albums_resp.json()
album_id = None
album_title = 'Seeded Album'

for album in albums:
    if album['title'] == album_title:
        album_id = album['id']
        break

if not album_id:
    create_resp = requests.post(f'{base_url}/api/gallery/albums/', data={'title': album_title, 'description': 'Auto-created'}, headers=headers)
    if create_resp.status_code == 201:
        album_id = create_resp.json()['id']
        print(f"Created album: {album_id}")
    else:
        print(f"Failed to create album: {create_resp.text}")
        sys.exit(1)
else:
    print(f"Using existing album: {album_id}")

# 3. Upload Photo
if not os.path.exists(image_path):
    # Create a dummy image if it doesn't exist
    from PIL import Image
    img = Image.new('RGB', (800, 600), color = 'red')
    img.save(image_path)
    print(f"Created dummy image at {image_path}")

with open(image_path, 'rb') as f:
    files = {'image': f}
    data = {'title': 'Seeded Photo', 'album': album_id}
    # Correct URL: /api/gallery/photos/
    upload_resp = requests.post(f'{base_url}/api/gallery/photos/', headers=headers, data=data, files=files)
    if upload_resp.status_code == 201:
        print(f"Successfully uploaded photo: {upload_resp.json()['id']}")
    else:
        print(f"Failed to upload photo: {upload_resp.text}")
