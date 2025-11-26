from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, Album, Photo, Tag, PhotoVersion,
    ShareLink, Comment, EditJob, Notification
)


# ==========================
# User & Auth Serializers
# ==========================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User(
            username=validated_data["username"],
            email=validated_data.get("email", "")
        )
        user.set_password(validated_data["password"])
        user.save()
        UserProfile.objects.create(user=user)
        return user


# ==========================
# Tag Serializer
# ==========================
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


# ==========================
# Photo Serializers
# ==========================
class PhotoSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, required=False)

    class Meta:
        model = Photo
        fields = [
            "id", "album", "owner", "blob_path", "original_blob_path",
            "thumbnail_blob_path", "filename", "mime_type", "file_size",
            "exif_data", "metadata", "tags", "capture_date", "width",
            "height", "order", "is_deleted", "uploaded_at"
        ]
        read_only_fields = ("owner", "uploaded_at")

    def update(self, instance, validated_data):
        tags_data = validated_data.pop("tags", None)

        if tags_data:
            tag_objs = []
            for t in tags_data:
                obj, created = Tag.objects.get_or_create(name=t["name"])
                tag_objs.append(obj)
            instance.tags.set(tag_objs)

        return super().update(instance, validated_data)


# ==========================
# Album Serializer
# ==========================
class AlbumSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    thumbnail_photo = PhotoSerializer(read_only=True)
    collaborators = UserSerializer(read_only=True, many=True)

    class Meta:
        model = Album
        fields = [
            "id", "title", "description", "owner", "is_public",
            "thumbnail_photo", "collaborators",
            "created_at", "updated_at"
        ]


# ==========================
# PhotoVersion Serializer
# ==========================
class PhotoVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotoVersion
        fields = [
            "id", "photo", "version_number", "blob_path",
            "applied_edits", "created_by", "created_at"
        ]


# ==========================
# ShareLink Serializer
# ==========================
class ShareLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShareLink
        fields = [
            "id", "album", "token", "can_edit",
            "created_by", "created_at", "expires_at",
            "max_uses", "used_count"
        ]


# ==========================
# Comment Serializer
# ==========================
class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id", "photo", "user", "parent", "text",
            "is_deleted", "created_at", "updated_at", "replies"
        ]

    def get_replies(self, obj):
        return CommentSerializer(obj.replies.all(), many=True).data


# ==========================
# EditJob Serializer
# ==========================
class EditJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = EditJob
        fields = "__all__"


# ==========================
# Notification Serializer
# ==========================
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
