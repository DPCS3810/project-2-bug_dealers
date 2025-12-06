import os
import django
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "photo_editor_backend.settings")
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def list_users():
    users = User.objects.all()
    print(f"Total users in database: {users.count()}")
    print("\nExisting users:")
    for user in users:
        print(f"  - Username: {user.username}, Email: {user.email}, ID: {user.id}")

if __name__ == "__main__":
    list_users()
