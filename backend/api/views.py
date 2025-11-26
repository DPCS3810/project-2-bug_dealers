from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from .models import (
    Album, Photo, ShareLink, Comment, EditJob
)
from .serializers import (
    RegisterSerializer, AlbumSerializer, PhotoSerializer,
    ShareLinkSerializer, CommentSerializer, EditJobSerializer
)
from .azure_utils import generate_upload_sas_url
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User


# --------------------------
# Registration
# --------------------------
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "User registered"}, status=201)
    return Response(serializer.errors, status=400)


# --------------------------
# Album ViewSet
# --------------------------
class AlbumViewSet(viewsets.ModelViewSet):
    serializer_class = AlbumSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Album.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


# --------------------------
# Photo ViewSet
# --------------------------
class PhotoViewSet(viewsets.ModelViewSet):
    serializer_class = PhotoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Photo.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


# --------------------------
# ShareLink ViewSet
# --------------------------
class ShareLinkViewSet(viewsets.ModelViewSet):
    serializer_class = ShareLinkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ShareLink.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# --------------------------
# Comment ViewSet
# --------------------------
class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# --------------------------
# EditJob ViewSet
# --------------------------
class EditJobViewSet(viewsets.ModelViewSet):
    serializer_class = EditJobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return EditJob.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# --------------------------
# SAS Token API
# --------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_upload_sas(request):
    filename = request.data.get("filename")
    if not filename:
        return Response({"error": "filename required"}, status=400)

    sas_url, blob_url = generate_upload_sas_url(filename)
    return Response({"uploadUrl": sas_url, "blobUrl": blob_url})
