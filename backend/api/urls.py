from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    register_view, AlbumViewSet, PhotoViewSet, ShareLinkViewSet,
    CommentViewSet, EditJobViewSet, get_upload_sas, upload_complete, create_edit_job, editjob_callback, search_photos
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
    
    path("auth/register/", register_view, name="register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("uploads/init/", get_upload_sas, name="get_upload_sas"),
    path("uploads/complete/", upload_complete, name="upload_complete"),
    path("editjobs/create/", create_edit_job, name="create_edit_job"),
    path("editjobs/<uuid:pk>/callback/", editjob_callback, name="editjob_callback"),
    path("search/photos/", search_photos, name="search_photos"),
]
