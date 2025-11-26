# backend/api/views.py

import os
import requests
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.conf import settings

from .models import (
    Album, Photo, PhotoVersion, ShareLink,
    Comment, EditJob
)

from .serializers import (
    RegisterSerializer, AlbumSerializer, PhotoSerializer,
    ShareLinkSerializer, CommentSerializer, EditJobSerializer,
    PhotoVersionSerializer
)

from .permissions import IsOwnerOrCollaboratorOrShare
from .azure_utils import (
    generate_upload_sas_url,
    blob_exists_and_props,
    full_blob_url_from_path
)

from rest_framework.pagination import PageNumberPagination
from django.db.models import Q


# =====================================================================
# AUTHENTICATION
# =====================================================================
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "User registered"}, status=201)
    return Response(serializer.errors, status=400)


# =====================================================================
# ALBUM CRUD
# =====================================================================
class AlbumViewSet(viewsets.ModelViewSet):
    serializer_class = AlbumSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Album.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


# =====================================================================
# PHOTO CRUD
# =====================================================================
class PhotoViewSet(viewsets.ModelViewSet):

    queryset = Photo.objects.all()   # ← ADD THIS LINE   
    serializer_class = PhotoSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrCollaboratorOrShare]

    def get_queryset(self):
        return Photo.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        print("PERFORM_CREATE CALLED")
        print("USER = ", self.request.user)
        serializer.save(owner=self.request.user)

# =====================================================================
# SHARE LINK CRUD
# =====================================================================
class ShareLinkViewSet(viewsets.ModelViewSet):
    serializer_class = ShareLinkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ShareLink.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# =====================================================================
# COMMENT CRUD
# =====================================================================
class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# =====================================================================
# EDIT JOB CRUD
# =====================================================================
class EditJobViewSet(viewsets.ModelViewSet):
    serializer_class = EditJobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return EditJob.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# =====================================================================
# SAS TOKEN
# =====================================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_upload_sas(request):
    filename = request.data.get("filename")
    if not filename:
        return Response({"error": "filename required"}, status=400)

    sas_url, blob_url = generate_upload_sas_url(filename)
    return Response({"uploadUrl": sas_url, "blobUrl": blob_url})


# =====================================================================
# PHASE 1: UPLOAD COMPLETE
# =====================================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_complete(request):
    user = request.user
    album_id = request.data.get("album")
    filename = request.data.get("filename")

    if not album_id or not filename:
        return Response({"error": "album and filename are required"}, status=400)

    album = get_object_or_404(Album, id=album_id)

    # Permission check
    if not (album.owner_id == user.id or album.collaborators.filter(id=user.id).exists()):
        return Response({"error": "permission denied"}, status=403)

    # Validate blob existence
    props = blob_exists_and_props(filename)
    if not props:
        return Response({"error": "Blob not found"}, status=400)

    # Create Photo
    photo = Photo.objects.create(
        album=album,
        owner=user,
        blob_path=filename,
        original_blob_path=filename,
        filename=os.path.basename(filename),
        mime_type=props.get("content_type"),
        file_size=props.get("size"),
    )

    # Create initial version
    PhotoVersion.objects.create(
        photo=photo,
        version_number=0,
        blob_path=filename,
        applied_edits={},
        created_by=user,
    )

    # Create thumbnail job
    ej = EditJob.objects.create(
        photo=photo,
        user=user,
        operation="thumbnail",
        params={"size": [200, 200]},
        status="queued"
    )

    # Call Flask worker
    flask_url = os.getenv("FLASK_PROCESS_URL", "http://localhost:5001/process")
    callback_url = f"{request.build_absolute_uri('/').rstrip('/')}/api/editjobs/{ej.id}/callback/"

    payload = {
        "job_id": str(ej.id),
        "blob_path": filename,
        "operation": "thumbnail",
        "params": ej.params,
        "callback_url": callback_url
    }

    try:
        requests.post(flask_url, json=payload, timeout=5)
    except Exception:
        pass  # Flask offline in dev

    return Response({"photo": PhotoSerializer(photo).data, "job_id": str(ej.id)}, status=201)


# =====================================================================
# PHASE 3: EDIT JOB CALLBACK
# =====================================================================
@api_view(["POST"])
@permission_classes([AllowAny])  # secure in production
def editjob_callback(request, pk):
    data = request.data
    job_id = data.get("job_id") or pk

    try:
        job = EditJob.objects.get(id=job_id)
    except EditJob.DoesNotExist:
        return Response({"error": "job not found"}, status=404)

    status_ = data.get("status")

    if status_ == "success":
        result_blob = data.get("result_blob_path")
        job.mark_success(result_blob)

        # Create new PhotoVersion
        photo = job.photo
        latest = photo.versions.order_by("-version_number").first()
        next_version = 1 if latest is None else latest.version_number + 1

        PhotoVersion.objects.create(
            photo=photo,
            version_number=next_version,
            blob_path=result_blob,
            applied_edits=job.params or {},
            created_by=job.user
        )

        # Update main photo if not thumbnail job
        if job.operation != "thumbnail":
            photo.blob_path = result_blob
            photo.save()

        return Response({"status": "ok"}, status=200)

    else:
        job.mark_failed(data.get("error", "unknown"))
        return Response({"status": "failed"}, status=200)


# =====================================================================
# PHASE 3: CREATE EDIT JOB
# =====================================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_edit_job(request):
    user = request.user
    photo_id = request.data.get("photo")
    operation = request.data.get("operation")
    params = request.data.get("params", {})

    photo = get_object_or_404(Photo, id=photo_id)

    # Permission
    if not (photo.owner_id == user.id or photo.album.collaborators.filter(id=user.id).exists()):
        return Response({"error": "permission denied"}, status=403)

    ej = EditJob.objects.create(
        photo=photo,
        user=user,
        operation=operation,
        params=params,
        status="queued"
    )

    # Send job to Flask worker
    flask_url = os.getenv("FLASK_PROCESS_URL", "http://localhost:5001/process")
    callback_url = f"{request.build_absolute_uri('/').rstrip('/')}/api/editjobs/{ej.id}/callback/"

    payload = {
        "job_id": str(ej.id),
        "blob_path": photo.blob_path,
        "operation": operation,
        "params": params,
        "callback_url": callback_url,
    }

    try:
        requests.post(flask_url, json=payload, timeout=5)
    except Exception:
        pass

    return Response({"job_id": str(ej.id)}, status=201)


# =====================================================================
# PHASE 4: SEARCH
# =====================================================================
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_photos(request):
    user = request.user
    q = request.query_params.get("q")
    tags = request.query_params.get("tags")
    start = request.query_params.get("start_date")
    end = request.query_params.get("end_date")
    exif_key = request.query_params.get("exif_key")
    exif_value = request.query_params.get("exif_value")

    queryset = Photo.objects.filter(owner=user, is_deleted=False)

    if q:
        queryset = queryset.filter(filename__icontains=q)

    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        queryset = queryset.filter(tags__name__in=tag_list).distinct()

    if start:
        queryset = queryset.filter(uploaded_at__gte=start)

    if end:
        queryset = queryset.filter(uploaded_at__lte=end)

    if exif_key and exif_value:
        queryset = queryset.filter(**{f"exif_data__{exif_key}__icontains": exif_value})

    paginator = StandardResultsSetPagination()
    page = paginator.paginate_queryset(queryset, request)
    serializer = PhotoSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)
