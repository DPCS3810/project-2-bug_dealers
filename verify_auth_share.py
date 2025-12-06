import requests
import sys

# Usage: python verify_auth_share.py <token>
# Token is the UUID of the share link

if len(sys.argv) < 2:
    print("Usage: python verify_auth_share.py <share_token_uuid>")
    sys.exit(1)

share_token_uuid = sys.argv[1]
base_url = 'http://localhost:8000'

view_url = f'{base_url}/api/gallery/shares/view/{share_token_uuid}/'

print(f"Testing Unauthenticated Access to: {view_url}")
resp = requests.get(view_url)

if resp.status_code == 401: # OR 403 depending on permissions config
    print(f"SUCCESS: Access denied as expected. Status: {resp.status_code}")
else:
    print(f"FAILURE: Unauthenticated access allowed! Status: {resp.status_code}")
    sys.exit(1)

# Note: We assume authenticated access works from previous tests/scripts
