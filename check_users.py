import os
import django
from collections import Counter

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "photo_editor_backend.settings")
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def check_users():
    print("Checking users...")
    users = User.objects.all()
    emails = [u.email for u in users]
    
    print(f"Total users: {len(users)}")
    
    counts = Counter(emails)
    duplicates = {email: count for email, count in counts.items() if count > 1}
    
    if duplicates:
        print("DUPLICATE EMAILS FOUND!")
        for email, count in duplicates.items():
            print(f"- {email}: {count} users")
    else:
        print("No duplicate emails found.")

if __name__ == "__main__":
    check_users()
