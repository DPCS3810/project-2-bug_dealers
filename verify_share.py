import requests
import sys

# Usage: python verify_share.py <username> <password>

if len(sys.argv) < 3:
    print("Usage: python verify_share.py <username> <password>")
    sys.exit(1)

username = sys.argv[1]
password = sys.argv[2]
base_url = 'http://localhost:8000'

# 1. Login
login_resp = requests.post(f'{base_url}/api/auth/login/', data={'username': username, 'password': password})
if login_resp.status_code != 200:
    print(f"Login failed: {login_resp.text}")
    sys.exit(1)

token = login_resp.json()['access']
headers = {'Authorization': f'Bearer {token}'}

# 2. Create Album
album_title = 'Share Test Album'
create_resp = requests.post(f'{base_url}/api/gallery/albums/', data={'title': album_title}, headers=headers)
if create_resp.status_code == 201:
    album_id = create_resp.json()['id']
    print(f"Created album: {album_id}")
else:
    # Try to find existing
    albums_resp = requests.get(f'{base_url}/api/gallery/albums/', headers=headers)
    found = False
    for alb in albums_resp.json():
        if alb['title'] == album_title:
            album_id = alb['id']
            found = True
            break
    if not found:
        print(f"Failed to create/find album: {create_resp.text}")
        sys.exit(1)
    print(f"Using existing album: {album_id}")

# 3. Generate Share Link (The Fix)
# We test the endpoint /api/gallery/shares/
share_url = f'{base_url}/api/gallery/shares/'
payload = {'album': album_id, 'can_edit': False}

print(f"Testing Share Endpoint: {share_url}")
share_resp = requests.post(share_url, json=payload, headers=headers)

if share_resp.status_code == 201:
    share_data = share_resp.json()
    print("SUCCESS: Share link generated!")
    print(f"Token: {share_data['token']}")
    print(f"Full Data: {share_data}")
else:
    print(f"FAILURE: Share link generation failed. Status: {share_resp.status_code}")
    print(f"Response: {share_resp.text}")
    sys.exit(1)
