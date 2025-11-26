from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    register_view, AlbumViewSet, PhotoViewSet, ShareLinkViewSet,
    CommentViewSet, EditJobViewSet, get_upload_sas
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register("albums", AlbumViewSet, basename="albums")
router.register("photos", PhotoViewSet, basename="photos")
router.register("sharelinks", ShareLinkViewSet, basename="sharelinks")
router.register("comments", CommentViewSet, basename="comments")
router.register("editjobs", EditJobViewSet, basename="editjobs")

urlpatterns = [
    path("", include(router.urls)),

    # Auth
    path("auth/register/", register_view, name="register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="refresh"),

    # Uploads
    path("uploads/init/", get_upload_sas, name="get_upload_sas"),
]
