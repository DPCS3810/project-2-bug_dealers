from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User
import uuid


# =========================
# Album Model
# =========================
class Album(models.Model):
    """
    Represents an album belonging to a user.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        User,
        related_name="albums",
        on_delete=models.CASCADE
    )
    title = models.CharField(max_length=200)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.owner.username})"


# =========================
# Photo Model
# =========================
class Photo(models.Model):
    """
    Stores metadata of photos uploaded to Azure Blob Storage.
    Blob path is the relative path in the Azure container.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    album = models.ForeignKey(
        Album,
        related_name="photos",
        on_delete=models.CASCADE
    )
    owner = models.ForeignKey(
        User,
        related_name="photos",
        on_delete=models.CASCADE
    )

    # Path to blob inside Azure container, ex: "uploads/a23d9-image.jpg"
    blob_path = models.CharField(max_length=500)

    filename = models.CharField(max_length=200)
    metadata = models.JSONField(default=dict, blank=True)  # brightness, crop, rotation etc.
    uploaded_at = models.DateTimeField(auto_now_add=True)

    # Used for ordering inside album
    order = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.filename}"


# =========================
# ShareLink Model
# =========================
class ShareLink(models.Model):
    """
    Allows albums to be shared securely via a one-time or expiring link.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    album = models.ForeignKey(
        Album,
        related_name="share_links",
        on_delete=models.CASCADE
    )

    # token included in shareable URL
    token = models.CharField(max_length=150, unique=True)
    can_edit = models.BooleanField(default=False)
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"ShareLink({self.album.title})"


# =========================
# Comment Model
# =========================
class Comment(models.Model):
    """
    Comments on photos inside shared albums.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    photo = models.ForeignKey(
        Photo,
        related_name="comments",
        on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        User,
        related_name="comments",
        on_delete=models.CASCADE
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username}"
