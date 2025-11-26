# backend/api/models.py
import uuid
from django.conf import settings
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


# -----------------------
# UserProfile
# -----------------------
class UserProfile(models.Model):
    """
    Optional extension for Django User to store identity provider info and profile metadata.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    oauth_provider = models.CharField(max_length=50, blank=True, null=True)  # e.g., google, facebook, azuread
    profile_photo = models.CharField(max_length=512, blank=True, null=True)  # blob path or CDN URL
    remember_me = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile({self.user.username})"


# -----------------------
# Tag
# -----------------------
class Tag(models.Model):
    """
    Normalized tags for photos (searchable, de-duplicated).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("name",)

    def __str__(self):
        return self.name


# -----------------------
# Album
# -----------------------
class Album(models.Model):
    """
    Album containing multiple photos. Supports collaborators and soft-delete.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, related_name="albums", on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)
    thumbnail_photo = models.ForeignKey(
        "Photo",
        related_name="thumbnail_for_albums",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    collaborators = models.ManyToManyField(User, related_name="collaborations", blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return f"{self.title} ({self.owner.username})"


# -----------------------
# Photo
# -----------------------
class Photo(models.Model):
    """
    Photo metadata stored in SQL; binary data stored in Azure Blob (blob_path fields).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    album = models.ForeignKey(Album, related_name="photos", on_delete=models.CASCADE)
    owner = models.ForeignKey(User, related_name="photos", on_delete=models.CASCADE)

    # Blob paths (relative path in container or absolute URL)
    blob_path = models.CharField(max_length=1024)           # current/primary version blob path
    original_blob_path = models.CharField(max_length=1024)  # immutable original
    thumbnail_blob_path = models.CharField(max_length=1024, blank=True, null=True)

    filename = models.CharField(max_length=512)
    mime_type = models.CharField(max_length=50, blank=True, null=True)
    file_size = models.BigIntegerField(blank=True, null=True)

    # EXIF and generic structured metadata
    exif_data = models.JSONField(default=dict, blank=True)     # camera, gps, orientation
    metadata = models.JSONField(default=dict, blank=True)      # app-specific: edits, histogram, etc.

    # Searchable / normalized tags
    tags = models.ManyToManyField(Tag, related_name="photos", blank=True)

    # Denormalized fields for faster queries
    capture_date = models.DateTimeField(null=True, blank=True)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)

    # ordering and soft-delete
    order = models.IntegerField(default=0)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("order", "-uploaded_at")
        indexes = [
            models.Index(fields=["owner", "album"]),
            models.Index(fields=["uploaded_at"]),
            models.Index(fields=["capture_date"]),
        ]

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return self.filename


# -----------------------
# PhotoVersion
# -----------------------
class PhotoVersion(models.Model):
    """
    Store immutable versions for a Photo. Each edit that is persisted creates a new PhotoVersion.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    photo = models.ForeignKey(Photo, related_name="versions", on_delete=models.CASCADE)
    version_number = models.PositiveIntegerField()   # 0 = original, 1..N for edits
    blob_path = models.CharField(max_length=1024)
    applied_edits = models.JSONField(default=dict, blank=True)  # list/params of edits applied
    created_by = models.ForeignKey(User, related_name="photo_versions", on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("photo", "version_number")
        ordering = ("photo", "version_number")

    def __str__(self):
        return f"{self.photo.filename} v{self.version_number}"


# -----------------------
# ShareLink
# -----------------------
class ShareLink(models.Model):
    """
    Token-based sharing for albums (or photos if desired).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    album = models.ForeignKey(Album, related_name="share_links", on_delete=models.CASCADE)
    token = models.CharField(max_length=150, unique=True)
    can_edit = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, related_name="created_share_links", on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    max_uses = models.IntegerField(null=True, blank=True)
    used_count = models.IntegerField(default=0)

    def increment_use(self):
        if self.max_uses is not None and self.used_count >= self.max_uses:
            raise ValueError("Max uses exceeded")
        self.used_count += 1
        self.save()

    def is_valid(self):
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        if self.max_uses is not None and self.used_count >= self.max_uses:
            return False
        return True

    def __str__(self):
        return f"ShareLink({self.album.title})"


# -----------------------
# Comment
# -----------------------
class Comment(models.Model):
    """
    Comments on photos (supports threads and soft-delete).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    photo = models.ForeignKey(Photo, related_name="comments", on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name="comments", on_delete=models.CASCADE)
    parent = models.ForeignKey("self", related_name="replies", on_delete=models.CASCADE, null=True, blank=True)
    text = models.TextField()
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return f"Comment by {self.user.username} on {self.photo.filename}"


# -----------------------
# EditJob (processing queue tracker)
# -----------------------
class EditJob(models.Model):
    """
    Tracks async image processing jobs (submitted by Django, processed by Flask workers).
    """
    STATUS_CHOICES = [
        ("queued", "Queued"),
        ("processing", "Processing"),
        ("success", "Success"),
        ("failed", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    photo = models.ForeignKey(Photo, related_name="edit_jobs", on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name="edit_jobs", on_delete=models.SET_NULL, null=True)
    operation = models.CharField(max_length=100)   # e.g., "rotate", "crop", "resize", "filter"
    params = models.JSONField(default=dict, blank=True)  # operation parameters
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="queued")
    attempts = models.IntegerField(default=0)
    result_blob_path = models.CharField(max_length=1024, null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    queued_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-queued_at",)
        indexes = [
            models.Index(fields=["status"]),
        ]

    def mark_processing(self):
        self.status = "processing"
        self.started_at = timezone.now()
        self.save()

    def mark_success(self, blob_path):
        self.status = "success"
        self.result_blob_path = blob_path
        self.finished_at = timezone.now()
        self.save()

    def mark_failed(self, error_message):
        self.status = "failed"
        self.error_message = error_message
        self.attempts += 1
        self.finished_at = timezone.now()
        self.save()

    def __str__(self):
        return f"EditJob({self.operation}) for {self.photo.filename}"


# -----------------------
# Notification (optional)
# -----------------------
class Notification(models.Model):
    """
    In-app notifications for shares/comments/job completion.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name="notifications", on_delete=models.CASCADE)
    actor = models.ForeignKey(User, related_name="notifications_sent", on_delete=models.SET_NULL, null=True, blank=True)
    type = models.CharField(max_length=100)   # "comment", "share", "job_complete", etc.
    data = models.JSONField(default=dict, blank=True)  # arbitrary payload
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def mark_read(self):
        self.is_read = True
        self.save()

    def __str__(self):
        return f"Notification({self.type}) to {self.user.username}"
