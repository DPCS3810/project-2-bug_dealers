from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-*fn%i14&-%g*(60^kv5$kdvbcoua^iut+u912n9sbr#h*jg@#7'

DEBUG = True   # Change to False for production

ALLOWED_HOSTS = [
    'ec2-13-234-242-97.ap-south-1.compute.amazonaws.com',
    '15.207.71.227',
    'localhost',
    '127.0.0.1',
    'bugedits.site',
    'www.bugedits.site',
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
    'storages',

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

# ---- DATABASE ----
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',  # replace with Postgres later
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ---- CORS + CSRF CONFIG ----
CORS_ALLOWED_ORIGINS = [
    "https://bugedits.site",
    "https://www.bugedits.site",
    "http://localhost:5173",
    "http://localhost:5174",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ["*"]
CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]

CSRF_TRUSTED_ORIGINS = [
    "https://bugedits.site",
    "https://www.bugedits.site",
]

# ---- PASSWORD VALIDATION ----
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ---- INTERNATIONALIZATION ----
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ---- STATIC & MEDIA FILES ----
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

AUTH_USER_MODEL = 'accounts.User'

# ---- GOOGLE OAUTH ----
GOOGLE_OAUTH2_CLIENT_ID = '1028042670362-ttkns9gji669u7jsrdvdd6fe8j951k9s.apps.googleusercontent.com'
GOOGLE_OAUTH2_CLIENT_SECRET = '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'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
