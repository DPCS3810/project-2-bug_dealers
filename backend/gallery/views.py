from rest_framework import viewsets, permissions, parsers, status, filters
from django.db import models
from .models import Album, Photo, Share, Tag
from .serializers import AlbumSerializer, PhotoSerializer, TagSerializer, ShareSerializer, SharedContentSerializer, ShareDetailSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from PIL import Image, ImageEnhance
import os

class AlbumViewSet(viewsets.ModelViewSet):
    serializer_class = AlbumSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            # Owned albums
            queryset = Album.objects.filter(owner=user)
            # Shared albums (redeemed)
            shared_albums = Album.objects.filter(shares__shared_with=user, shares__redeemed=True)
            return queryset | shared_albums
        
        token = self.request.query_params.get('token') or self.request.headers.get('X-Share-Token')
        if token:
            try:
                share = Share.objects.get(token=token)
                if share.album:
                    return Album.objects.filter(id=share.album.id)
            except Share.DoesNotExist:
                pass
        return Album.objects.none()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def shares(self, request, pk=None):
        """List all shares for this album"""
        album = self.get_object()
        if album.owner != request.user:
            return Response({'error': 'Only the owner can view shares'}, status=403)
        
        shares = Share.objects.filter(album=album, redeemed=True)
        serializer = ShareDetailSerializer(shares, many=True)
        return Response(serializer.data)

class PhotoViewSet(viewsets.ModelViewSet):
    serializer_class = PhotoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'tags__name', 'uploaded_at']

    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            # Owned photos
            queryset = Photo.objects.filter(owner=user)
            # Shared photos (direct or via album)
            shared_photos = Photo.objects.filter(shares__shared_with=user, shares__redeemed=True)
            shared_album_photos = Photo.objects.filter(album__shares__shared_with=user, album__shares__redeemed=True)
            return (queryset | shared_photos | shared_album_photos).distinct()

        token = self.request.query_params.get('token') or self.request.headers.get('X-Share-Token')
        if token:
            try:
                share = Share.objects.get(token=token)
                if share.album: # Shared album
                     return Photo.objects.filter(album=share.album)
                elif share.photo: # Shared photo
                     return Photo.objects.filter(id=share.photo.id)
            except Share.DoesNotExist:
                pass
        return Photo.objects.none()

    def perform_create(self, serializer):
        token = self.request.query_params.get('token') or self.request.headers.get('X-Share-Token')
        if token:
             try:
                share = Share.objects.get(token=token)
                if share.album and share.can_edit:
                    serializer.save(owner=share.album.owner, album=share.album)
                    return
             except Share.DoesNotExist:
                pass
        
        if self.request.user.is_authenticated:
            serializer.save(owner=self.request.user)
        else:
             raise permissions.exceptions.PermissionDenied("You do not have permission to upload.")

    @action(detail=True, methods=['post'])
    def edit(self, request, pk=None):
        photo = self.get_object()
        
        # Permission check
        if photo.owner != request.user:
            # Check if shared with edit permission
            has_perm = Share.objects.filter(
                (models.Q(photo=photo) | models.Q(album=photo.album)),
                shared_with=request.user, 
                redeemed=True, 
                can_edit=True
            ).exists()
            if not has_perm:
                return Response({'error': 'You do not have permission to edit this photo.'}, status=403)

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
            
            # Log the edit
            from .models import PhotoEditLog
            is_seen = request.user == photo.owner
            PhotoEditLog.objects.create(
                photo=photo,
                editor=request.user,
                operation=command,
                details=f"Value: {value}" if command != 'grayscale' else "Applied",
                is_seen=is_seen
            )
            
            return Response({'status': 'edited', 'url': photo.image.url})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        photo = self.get_object()
        # Only owner or shared users with edit access should see history ideally
        # For now, allow anyone with access to the photo
        logs = photo.edit_logs.all().order_by('-timestamp')
        from .serializers import PhotoEditLogSerializer
        serializer = PhotoEditLogSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    @action(detail=True, methods=['post'])
    def mark_seen(self, request, pk=None):
        photo = self.get_object()
        if request.user != photo.owner:
            return Response({'error': 'Only owner can mark edits as seen'}, status=403)
        
        photo.edit_logs.filter(is_seen=False).update(is_seen=True)
        return Response({'status': 'marked_seen'})

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def shares(self, request, pk=None):
        """List all shares for this photo"""
        photo = self.get_object()
        if photo.owner != request.user:
            return Response({'error': 'Only the owner can view shares'}, status=403)
        
        shares = Share.objects.filter(photo=photo, redeemed=True)
        serializer = ShareDetailSerializer(shares, many=True)
        return Response(serializer.data)

class ShareViewSet(viewsets.ModelViewSet):
    serializer_class = ShareSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Share.objects.filter(
            models.Q(album__owner=self.request.user) | 
            models.Q(photo__owner=self.request.user)
        )
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_path='redeem')
    def redeem(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=400)
        
        try:
            share = Share.objects.get(token=token)
            if share.shared_with != request.user:
                return Response({'error': 'This share link is not for you.'}, status=403)
            
            share.redeemed = True
            share.save()
            return Response({'status': 'redeemed'})
        except Share.DoesNotExist:
            return Response({'error': 'Invalid token'}, status=404)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='received')
    def received(self, request):
        shares = Share.objects.filter(shared_with=request.user, redeemed=True)
        serializer = SharedContentSerializer(shares, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='view/(?P<token>[^/.]+)')
    def view_shared(self, request, token=None):
        try:
            share = Share.objects.get(token=token)
            
            # Check if user is the intended recipient
            if share.shared_with != request.user:
                 return Response({'error': 'You do not have permission to view this share.'}, status=403)
            
            response_data = {'can_edit': share.can_edit, 'redeemed': share.redeemed}
            
            if share.album:
                serializer = AlbumSerializer(share.album)
                response_data['type'] = 'album'
                response_data['data'] = serializer.data
            elif share.photo:
                serializer = PhotoSerializer(share.photo)
                response_data['type'] = 'photo'
                response_data['data'] = serializer.data
                
            return Response(response_data)
        except Share.DoesNotExist:
            return Response({'error': 'Invalid token'}, status=404)

    def update(self, request, *args, **kwargs):
        """Update share permissions (only owner can update)"""
        share = self.get_object()
        
        # Check if user is the owner of the shared content
        is_owner = False
        if share.album and share.album.owner == request.user:
            is_owner = True
        elif share.photo and share.photo.owner == request.user:
            is_owner = True
        
        if not is_owner:
            return Response({'error': 'Only the owner can update share permissions'}, status=403)
        
        # Only allow updating can_edit field
        if 'can_edit' in request.data:
            share.can_edit = request.data['can_edit']
            share.save()
        
        serializer = ShareDetailSerializer(share)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Revoke share access (only owner can revoke)"""
        share = self.get_object()
        
        # Check if user is the owner of the shared content
        is_owner = False
        if share.album and share.album.owner == request.user:
            is_owner = True
        elif share.photo and share.photo.owner == request.user:
            is_owner = True
        
        if not is_owner:
            return Response({'error': 'Only the owner can revoke share access'}, status=403)
        
        share.delete()
        return Response({'status': 'access revoked'}, status=status.HTTP_204_NO_CONTENT)

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]  # Only logged-in users can make tags
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']