import requests
import sys

# Usage: python debug_patch.py <photo_id> <token>

photo_id = sys.argv[1]
token = sys.argv[2]
url = f'http://localhost:8000/gallery/photos/{photo_id}/'

headers = {'Authorization': f'Bearer {token}'}
data = {'title': 'Updated Title from Script'}

print(f"Sending PATCH to {url}")
try:
    response = requests.patch(url, json=data, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
