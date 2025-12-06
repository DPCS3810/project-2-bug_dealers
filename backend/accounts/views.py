from rest_framework import generics, permissions
from .serializers import UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
import requests

from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code = request.data.get('code')
        
        if not code:
            return Response({'error': 'Code is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Setup retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS", "POST"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        http = requests.Session()
        http.mount("https://", adapter)
        http.mount("http://", adapter)

        # Exchange code for tokens
        token_endpoint = "https://oauth2.googleapis.com/token"
        payload = {
            'code': code,
            'client_id': settings.GOOGLE_OAUTH2_CLIENT_ID,
            'client_secret': settings.GOOGLE_OAUTH2_CLIENT_SECRET,
            'redirect_uri': 'http://localhost:5173/auth/google/callback',
            'grant_type': 'authorization_code'
        }
        
        try:
            print(f"Exchanging code for tokens. Code: {code[:10]}...")
            res = http.post(token_endpoint, data=payload)
            if res.status_code != 200:
                print(f"Token exchange failed: {res.status_code} - {res.text}")
            res.raise_for_status()
            tokens = res.json()
            access_token = tokens.get('access_token')
            
            # Get user info
            print("Fetching user info...")
            user_info_endpoint = "https://www.googleapis.com/oauth2/v2/userinfo"
            user_res = http.get(user_info_endpoint, headers={'Authorization': f'Bearer {access_token}'})
            if user_res.status_code != 200:
                 print(f"User info fetch failed: {user_res.status_code} - {user_res.text}")
            user_res.raise_for_status()
            user_data = user_res.json()
            print(f"User data received: {user_data}")
            
            email = user_data.get('email')
            
            if not email:
                return Response({'error': 'Email not provided by Google'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Check if user exists (enforce registration)
            user = User.objects.filter(email=email).first()
            if not user:
                return Response({'error': 'User not registered. Please register first.'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Issue JWTs
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'username': user.username,
                    'id': user.id
                }
            })
            
        except requests.exceptions.RequestException as e:
            print(f"Google communication failed: {str(e)}")
            return Response({'error': f'Failed to communicate with Google: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def patch(self, request, *args, **kwargs):
        # Handle profile picture deletion
        if 'profile_picture' in request.data and request.data['profile_picture'] in [None, '', 'null']:
            user = self.get_object()
            if user.profile_picture:
                user.profile_picture.delete(save=False)
            user.profile_picture = None
            user.save()
            return Response(UserSerializer(user).data)
        return super().patch(request, *args, **kwargs)
