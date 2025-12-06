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
    if resp.status_code != 201:
        print(f"Create album failed: {resp.text}")
        sys.exit(1)
    return resp.json()['id']

def share_content(token, type, id, recipient_username):
    headers = {'Authorization': f'Bearer {token}'}
    payload = {type: id, 'username': recipient_username}
    resp = requests.post(f"{BASE_URL}/gallery/shares/", json=payload, headers=headers)
    if resp.status_code != 201:
        print(f"Share failed: {resp.text}")
        sys.exit(1)
    return resp.json()['token']

def redeem_share(token, share_token):
    headers = {'Authorization': f'Bearer {token}'}
    resp = requests.post(f"{BASE_URL}/gallery/shares/redeem/", json={'token': share_token}, headers=headers)
    return resp

def list_received(token):
    headers = {'Authorization': f'Bearer {token}'}
    resp = requests.get(f"{BASE_URL}/gallery/shares/received/", headers=headers)
    return resp.json()

def main():
    print("--- Starting Share Workflow Verification ---")
    
    # 1. Login Sender
    sender_token = get_token('qwertytestuser', 'password123')
    print("Sender logged in.")

    # 2. Login Recipient
    recipient_token = get_token('recipient', 'password123')
    print("Recipient logged in.")

    # 3. Create Album
    album_id = create_album(sender_token, "Secret Project")
    print(f"Album created: {album_id}")

    # 4. Share with Recipient
    share_token = share_content(sender_token, 'album', album_id, 'recipient')
    print(f"Shared with recipient. Token: {share_token}")

    # 5. Verify Recipient has NO shared content yet
    received = list_received(recipient_token)
    if len(received) != 0:
        print("FAILURE: Recipient should not see unredeemed shares.")
        sys.exit(1)
    print("Verified: No shared content before redemption.")

    # 6. Redeem Share
    resp = redeem_share(recipient_token, share_token)
    if resp.status_code != 200:
        print(f"Redeem failed: {resp.text}")
        sys.exit(1)
    print("Share redeemed successfully.")

    # 7. Verify Recipient sees shared content
    received = list_received(recipient_token)
    if len(received) == 1 and received[0]['token'] == share_token:
        print("SUCCESS: Shared content visible after redemption.")
    else:
        print(f"FAILURE: Shared content not found. Received: {received}")
        sys.exit(1)

if __name__ == "__main__":
    main()
