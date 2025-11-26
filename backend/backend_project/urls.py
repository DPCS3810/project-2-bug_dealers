from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # include all API routes from the api app
    path('api/', include('api.urls')),
]
