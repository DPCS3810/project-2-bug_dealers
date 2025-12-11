from django.db import models
from django.conf import settings
import uuid

class Album(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='albums')
    created_at = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=False)

    def __str__(self):
        return self.title
    
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Photo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    album = models.ForeignKey(Album, on_delete=models.SET_NULL, related_name='photos', null=True, blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='photos/%Y/%m/%d/')
    title = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    tags = models.ManyToManyField('Tag', related_name='photos', blank=True)


    def __str__(self):
        return self.title or str(self.id)

class Share(models.Model):
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name='shares', null=True, blank=True)
    photo = models.ForeignKey(Photo, on_delete=models.CASCADE, related_name='shares', null=True, blank=True)
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    can_edit = models.BooleanField(default=False)
    shared_with = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shared_with_me', null=True, blank=True)
    redeemed = models.BooleanField(default=False)

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.album and self.photo:
            raise ValidationError("A share link can only be associated with either an album or a photo, not both.")
        if not self.album and not self.photo:
            raise ValidationError("A share link must be associated with either an album or a photo.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return str(self.token)

class PhotoEditLog(models.Model):
    photo = models.ForeignKey(Photo, on_delete=models.CASCADE, related_name='edit_logs')
    editor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    operation = models.CharField(max_length=50)
    details = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_seen = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.editor.username} - {self.operation} on {self.photo.title}"
