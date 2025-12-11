from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlbumViewSet, PhotoViewSet, ShareViewSet, TagViewSet

router = DefaultRouter()
router.register(r'albums', AlbumViewSet, basename='album')
router.register(r'photos', PhotoViewSet, basename='photo')
router.register(r'shares', ShareViewSet, basename='share')
router.register(r'tags', TagViewSet, basename='tag')


urlpatterns = [
    path('', include(router.urls)),
]
