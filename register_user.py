import requests
import sys

# Usage: python register_user.py <username> <password> <email>

if len(sys.argv) < 4:
    print("Usage: python register_user.py <username> <password> <email>")
    sys.exit(1)

username = sys.argv[1]
password = sys.argv[2]
email = sys.argv[3]
base_url = 'https://bugedits.site'

url = f'{base_url}/api/auth/register/'
data = {
    'username': username,
    'password': password,
    'email': email
}

print(f"Registering user {username}...")
resp = requests.post(url, data=data)

if resp.status_code == 201:
    print(f"Successfully registered user: {resp.json()['username']}")
else:
    print(f"Failed to register: {resp.status_code} - {resp.text}")
