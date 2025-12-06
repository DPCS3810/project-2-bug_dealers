import requests
import json
import sys

BASE_URL = 'http://localhost:8000/api'

def get_token(username, password):
    resp = requests.post(f"{BASE_URL}/auth/login/", json={'username': username, 'password': password})
    if resp.status_code != 200:
        print(f"Login failed for {username}: {resp.text}")
        sys.exit(1)
    return resp.json()['access']

def create_album(token, title):
    headers = {'Authorization': f'Bearer {token}'}
    resp = requests.post(f"{BASE_URL}/gallery/albums/", json={'title': title}, headers=headers)
    return resp.json()['id']

def upload_photo(token, album_id):
    headers = {'Authorization': f'Bearer {token}'}
    # Create a dummy image
    from PIL import Image
    import io
    img = Image.new('RGB', (100, 100), color = 'red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    
    files = {'image': ('test.jpg', img_byte_arr, 'image/jpeg')}
    data = {'title': 'Test Photo', 'album': album_id}
    
    resp = requests.post(f"{BASE_URL}/gallery/photos/", data=data, files=files, headers=headers)
    if resp.status_code != 201:
        print(f"Upload failed: {resp.text}")
        sys.exit(1)
    return resp.json()['id']

def share_content(token, type, id, recipient_username):
    headers = {'Authorization': f'Bearer {token}'}
    payload = {type: id, 'username': recipient_username, 'can_edit': True}
    resp = requests.post(f"{BASE_URL}/gallery/shares/", json=payload, headers=headers)
    data = resp.json()
    if 'token' not in data:
         # Try sharing again if it failed, maybe already exists? No, create should work.
         # Actually checking for error
         if resp.status_code != 201:
            print(f"Share failed: {resp.text}")
            sys.exit(1)
    return data['token']

def redeem_share(token, share_token):
    headers = {'Authorization': f'Bearer {token}'}
    requests.post(f"{BASE_URL}/gallery/shares/redeem/", json={'token': share_token}, headers=headers)

def edit_photo(token, photo_id):
    headers = {'Authorization': f'Bearer {token}'}
    payload = {'command': 'grayscale', 'value': 0}
    resp = requests.post(f"{BASE_URL}/gallery/photos/{photo_id}/edit/", json=payload, headers=headers)
    if resp.status_code != 200:
        print(f"Edit failed: {resp.text}")
        sys.exit(1)
    return resp.json()

def check_unseen(token, photo_id):
    headers = {'Authorization': f'Bearer {token}'}
    resp = requests.get(f"{BASE_URL}/gallery/photos/{photo_id}/", headers=headers)
    return resp.json().get('has_unseen_edits', False)

def mark_seen(token, photo_id):
    headers = {'Authorization': f'Bearer {token}'}
    resp = requests.post(f"{BASE_URL}/gallery/photos/{photo_id}/mark_seen/", headers=headers)
    return resp.json()

def main():
    print("--- Starting Collaborative Edit Verification ---")
    
    # 1. Login Users
    owner_token = get_token('qwertytestuser', 'password123')
    recipient_token = get_token('recipient', 'password123')
    print("Logged in.")

    # 2. Setup Data (Album + Photo)
    album_id = create_album(owner_token, "Collab Project")
    photo_id = upload_photo(owner_token, album_id)
    print(f"Created Album {album_id} and Photo {photo_id}")

    # 3. Share with Edit Access
    share_token = share_content(owner_token, 'album', album_id, 'recipient')
    redeem_share(recipient_token, share_token)
    print("Shared and Redeemed.")

    # 4. Recipient Edits Photo
    # Need to verify Recipient can SEE photo first (via album or directly)
    # But we know ID, so try edit directly
    print("Recipient attempting edit...")
    edit_photo(recipient_token, photo_id)
    print("Edit successful.")

    # 5. Owner Checks for Unseen Edits
    unseen = check_unseen(owner_token, photo_id)
    if not unseen:
        print("FAILURE: Owner should see 'has_unseen_edits=True'")
        sys.exit(1)
    print("Verified: Owner sees unseen edits flag.")

    # 6. Owner Marks Seen
    mark_seen(owner_token, photo_id)
    print("Marked as seen.")

    # 7. Owner Checks again
    unseen = check_unseen(owner_token, photo_id)
    if unseen:
        print("FAILURE: Owner should NOT see 'has_unseen_edits=True' after marking seen")
        sys.exit(1)
    print("Verified: Flag cleared.")

    print("--- SUCCESS ---")

if __name__ == "__main__":
    main()
