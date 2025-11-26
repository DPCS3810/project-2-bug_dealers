# backend/api/permissions.py
from rest_framework import permissions
from .models import ShareLink, Album

class IsOwnerOrCollaboratorOrShare(permissions.BasePermission):
    """
    Allow access if:
    - user is owner
    - OR user is in album.collaborators
    - OR valid share_token is provided via ?share_token=TOKEN (checked for expiry & permissions)
    """

    def has_object_permission(self, request, view, obj):
        # obj can be Album or Photo
        user = request.user
        # if unauthenticated but share_token present, permit read-only if token allows it
        token = request.query_params.get("share_token") or request.data.get("share_token")
        if token:
            try:
                sl = ShareLink.objects.get(token=token, album__id=getattr(obj, "album_id", getattr(obj, "id", None)) or obj.album.id)
            except ShareLink.DoesNotExist:
                return False
            return sl.is_valid() and (sl.can_edit or request.method in permissions.SAFE_METHODS)

        # authenticated checks
        if not user or not user.is_authenticated:
            return False

        # for Photo object, get album
        album = obj if isinstance(obj, Album) else obj.album
        if album.owner_id == user.id:
            return True
        if album.collaborators.filter(id=user.id).exists():
            return True
        # fallback deny
        return False
