from rest_framework import viewsets, permissions, parsers, status, filters
from .models import Album, Photo, Share
from .serializers import AlbumSerializer, PhotoSerializer, ShareSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from PIL import Image, ImageEnhance
import os

class AlbumViewSet(viewsets.ModelViewSet):
    serializer_class = AlbumSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']

    def get_queryset(self):
        return Album.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class PhotoViewSet(viewsets.ModelViewSet):
    serializer_class = PhotoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title']
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        return Photo.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def edit(self, request, pk=None):
        photo = self.get_object()
        command = request.data.get('command')
        value = float(request.data.get('value', 0))

        try:
            img_path = photo.image.path
            with Image.open(img_path) as img:
                if command == 'rotate':
                    img = img.rotate(-value, expand=True) # Rotate clockwise
                elif command == 'brightness':
                    enhancer = ImageEnhance.Brightness(img)
                    img = enhancer.enhance(value) # 1.0 is original
                elif command == 'contrast':
                    enhancer = ImageEnhance.Contrast(img)
                    img = enhancer.enhance(value)
                elif command == 'grayscale':
                     img = img.convert('L')
                
                img.save(img_path)
            
            return Response({'status': 'edited', 'url': photo.image.url})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ShareViewSet(viewsets.ModelViewSet):
    serializer_class = ShareSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Share.objects.filter(album__owner=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], url_path='view/(?P<token>[^/.]+)')
    def view_shared(self, request, token=None):
        try:
            share = Share.objects.get(token=token)
            album = share.album
            # Serialize album with photos
            serializer = AlbumSerializer(album)
            return Response({
                'album': serializer.data,
                'can_edit': share.can_edit
            })
        except Share.DoesNotExist:
            return Response({'error': 'Invalid token'}, status=404)
