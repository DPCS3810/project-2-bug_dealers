from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-*fn%i14&-%g*(60^kv5$kdvbcoua^iut+u912n9sbr#h*jg@#7'

DEBUG = True  # Change to False for production!

ALLOWED_HOSTS = [
    'ec2-13-234-242-97.ap-south-1.compute.amazonaws.com',
    '15.207.71.227',
    'localhost',
    '127.0.0.1',
    'bugedits.site',
    'www.bugedits.site',
    '13.234.242.97',
    
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'django_filters',
    'corsheaders',
    'storages',   # REQUIRED FOR S3 STORAGE

    'whitenoise.runserver_nostatic',

    'accounts',
    'gallery',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',

    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'photo_editor_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'photo_editor_backend.wsgi.application'


# ------------------------------
# DATABASE
# ------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3', 
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ------------------------------
# CORS / CSRF
# ------------------------------
CORS_ALLOWED_ORIGINS = [
    "https://bugedits.site",
    "https://www.bugedits.site",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://bugedits.site",
    "http://www.bugedits.site",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ["*"]
CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]

CSRF_TRUSTED_ORIGINS = [
    "https://bugedits.site",
    "https://www.bugedits.site",
    "http://bugedits.site",
    "http://www.bugedits.site",
]

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# ------------------------------
# STATIC FILES
# ------------------------------
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / "staticfiles"

# ------------------------------
# LOCAL MEDIA — ONLY USED IF S3 IS DISABLED
# ------------------------------
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ------------------------------
# ENABLE S3 STORAGE
# ------------------------------
DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME")
#AWS_S3_REGION_NAME = os.getenv("AWS_S3_REGION_NAME")
AWS_S3_REGION_NAME = os.getenv("AWS_S3_REGION_NAME", "ap-south-1")


AWS_S3_SIGNATURE_VERSION = "s3v4"
AWS_S3_FILE_OVERWRITE = True
AWS_DEFAULT_ACL = None          # DO NOT set to "public-read" here
AWS_QUERYSTRING_AUTH = False    # Pretty public URLs

# CRITICAL: Ensures each uploaded file gets ACL = public-read
AWS_S3_OBJECT_PARAMETERS = {
    #"ACL": "public-read", 
    "CacheControl": "max-age=86400",
}

#AWS_S3_OBJECT_PARAMETERS = {
#    'CacheControl': 'no-cache, no-store, must-revalidate',
#    'Expires': '0',
#}


#AWS_S3_REGION_NAME = "ap-south-1"
AWS_S3_CUSTOM_DOMAIN = f"{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com"
AWS_S3_ADDRESSING_STYLE = "virtual"
MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/"


# ------------------------------
# AUTH
# ------------------------------
AUTH_USER_MODEL = 'accounts.User'

# ------------------------------
# GOOGLE OAUTH
# ------------------------------
GOOGLE_OAUTH2_CLIENT_ID = '1028042670362-ttkns9gji669u7jsrdvdd6fe8j951k9s.apps.googleusercontent.com'
GOOGLE_OAUTH2_CLIENT_SECRET = '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'

GOOGLE_REDIRECT_URI = "https://bugedits.site/auth/callback"

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
