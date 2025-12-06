from rest_framework import serializers
from .models import Album, Photo, Share, PhotoEditLog

class PhotoSerializer(serializers.ModelSerializer):
    has_unseen_edits = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = '__all__'
        read_only_fields = ('owner', 'uploaded_at')

    def get_has_unseen_edits(self, obj):
        request = self.context.get('request')
        if request and request.user == obj.owner:
            return obj.edit_logs.filter(is_seen=False).exists()
        return False

class AlbumSerializer(serializers.ModelSerializer):
    photos = PhotoSerializer(many=True, read_only=True)

    class Meta:
        model = Album
        fields = '__all__'
        read_only_fields = ('owner', 'created_at')

from django.contrib.auth import get_user_model



class PhotoEditLogSerializer(serializers.ModelSerializer):
    editor_username = serializers.CharField(source='editor.username', read_only=True)

    class Meta:
        model = PhotoEditLog
        fields = '__all__'
        read_only_fields = ('timestamp', 'editor')

class ShareSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)

    class Meta:
        model = Share
        fields = '__all__'
        read_only_fields = ('token', 'created_at', 'shared_with', 'redeemed')

    def validate(self, data):
        if 'album' in data and 'photo' in data:
            raise serializers.ValidationError("A share link can only be associated with either an album or a photo, not both.")
        if 'album' not in data and 'photo' not in data:
            raise serializers.ValidationError("A share link must be associated with either an album or a photo.")
        
        username = data.pop('username', None)
        if username:
            User = get_user_model()
            try:
                user = User.objects.get(username=username)
                data['shared_with'] = user
            except User.DoesNotExist:
                raise serializers.ValidationError({"username": "User with this username does not exist."})
        else:
             raise serializers.ValidationError({"username": "This field is required."})

        return data

class SharedContentSerializer(serializers.ModelSerializer):
    """Serializer for received shares with full album/photo details"""
    album_title = serializers.CharField(source='album.title', read_only=True)
    album_id = serializers.UUIDField(source='album.id', read_only=True)
    album_owner = serializers.CharField(source='album.owner.username', read_only=True)
    photo_title = serializers.CharField(source='photo.title', read_only=True)
    photo_id = serializers.UUIDField(source='photo.id', read_only=True)
    photo_owner = serializers.CharField(source='photo.owner.username', read_only=True)
    photo_image = serializers.ImageField(source='photo.image', read_only=True)
    
    class Meta:
        model = Share
        fields = ['token', 'created_at', 'can_edit', 'album', 'photo', 
                  'album_title', 'album_id', 'album_owner',
                  'photo_title', 'photo_id', 'photo_owner', 'photo_image']

class ShareDetailSerializer(serializers.ModelSerializer):
    """Serializer for listing shares on an album/photo (for access management)"""
    shared_with_username = serializers.CharField(source='shared_with.username', read_only=True)
    shared_with_email = serializers.CharField(source='shared_with.email', read_only=True)
    
    class Meta:
        model = Share
        fields = ['id', 'token', 'shared_with', 'shared_with_username', 'shared_with_email', 
                  'can_edit', 'redeemed', 'created_at']
        read_only_fields = ['token', 'created_at', 'shared_with', 'redeemed']
