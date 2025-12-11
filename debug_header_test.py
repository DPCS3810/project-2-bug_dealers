import requests
import os

BASE_URL = "http://localhost:8000/api"

def login():
    try:
        login_data = {
            "username": "test_user_registration", 
            "password": "testpassword123"
        }
        res = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        if res.status_code == 200:
            return res.json()['access']
        print(f"Login failed: {res.text}")
        return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_headers():
    token = login()
    if not token:
        return

    print("--- Login Successful ---")
    headers_auth = {'Authorization': f'Bearer {token}'}
    
    # Create dummy image
    image_path = 'temp_debug_img.jpg'
    with open(image_path, 'wb') as f:
        f.write(b'\xFF\xD8\xFF\xE0\x00\x10JFIF' + b'\x00' * 100)

    photo_id = None

    # TEST 1: POST with *Correct* Headers (requests default)
    print("\n--- TEST 1: POST with Correct Headers ---")
    files = {'image': open(image_path, 'rb')}
    data = {'title': 'Test 1 Correct'}
    try:
        # requests automatically sets multipart/form-data; boundary=...
        res = requests.post(f"{BASE_URL}/gallery/photos/", headers=headers_auth, files=files, data=data)
        print(f"Status: {res.status_code}")
        if res.status_code == 201:
            print("Success!")
            photo_id = res.json()['id']
        else:
            print(f"Failed: {res.text}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        files['image'].close()

    # TEST 2: POST with *Broken* Headers (Simulating Frontend Bug)
    print("\n--- TEST 2: POST with Broken Headers (Manual Content-Type) ---")
    files2 = {'image': open(image_path, 'rb')}
    data2 = {'title': 'Test 2 Broken'}
    # Manually creating headers that override requests' smart behavior
    bad_headers = headers_auth.copy()
    bad_headers['Content-Type'] = 'multipart/form-data' 
    
    try:
        res = requests.post(f"{BASE_URL}/gallery/photos/", headers=bad_headers, files=files2, data=data2)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        files2['image'].close()

    # TEST 3: PATCH with *Broken* Headers (Simulating Edit Bug)
    if photo_id:
        print(f"\n--- TEST 3: PATCH with Broken Headers (Targeting ID {photo_id}) ---")
        files3 = {'image': open(image_path, 'rb')}
        data3 = {'title': 'Test 3 Broken Patch'}
        
        try:
            res = requests.patch(f"{BASE_URL}/gallery/photos/{photo_id}/", headers=bad_headers, files=files3, data=data3)
            print(f"Status: {res.status_code}")
            print(f"Response: {res.text}")
            
            # Verify if title changed?
            res_get = requests.get(f"{BASE_URL}/gallery/photos/{photo_id}/", headers=headers_auth)
            print(f"Current Title after PATCH: {res_get.json().get('title')}")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            files3['image'].close()
    
    # Cleanup
    if os.path.exists(image_path):
        os.remove(image_path)

if __name__ == "__main__":
    test_headers()
