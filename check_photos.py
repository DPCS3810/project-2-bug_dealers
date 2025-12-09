import requests
import sys

# Usage: python check_photos.py <username> <password>

if len(sys.argv) < 3:
    print("Usage: python check_photos.py <username> <password>")
    sys.exit(1)

username = sys.argv[1]
password = sys.argv[2]
base_url = 'https://bugedits.site/api'

# 1. Login
resp = requests.post(f'{base_url}/api/auth/login/', data={'username': username, 'password': password})
if resp.status_code != 200:
    print("Login failed")
    sys.exit(1)

token = resp.json()['access']
headers = {'Authorization': f'Bearer {token}'}

# 2. Get Albums
albums = requests.get(f'{base_url}/api/gallery/albums/', headers=headers).json()
target_album = next((a for a in albums if a['title'] == 'Seeded Album'), None)

if not target_album:
    print("Seeded Album not found")
    sys.exit(0)

# 3. List Photos
photos = requests.get(f'{base_url}/api/gallery/albums/{target_album["id"]}/', headers=headers).json()['photos']
print(f"Album: {target_album['title']}")
print(f"Photo Count: {len(photos)}")
for p in photos:
    print(f"- {p['id']}: {p['title']}")
