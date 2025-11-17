from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Album, Photo
from .serializers import AlbumSerializer, PhotoSerializer
from .azure_utils import generate_sas_for_upload

class AlbumViewSet(viewsets.ModelViewSet):
    queryset = Album.objects.all()
    serializer_class = AlbumSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class PhotoViewSet(viewsets.ModelViewSet):
    queryset = Photo.objects.all()
    serializer_class = PhotoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def create_sas(self, request):
        filename = request.data.get('filename')
        content_type = request.data.get('content_type', 'image/jpeg')
        album = request.data.get('album')

        sas = generate_sas_for_upload(filename, content_type)

        return Response({
            "upload_url": sas["upload_url"],
            "blob_path": sas["blob_path"],
            "album": album
        })

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
