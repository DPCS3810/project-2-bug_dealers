from azure.storage.blob import generate_blob_sas, BlobSasPermissions
from django.conf import settings
import uuid
import datetime

def generate_sas_for_upload(filename, content_type):
    blob_name = f"uploads/{uuid.uuid4()}_{filename}"

    sas = generate_blob_sas(
        account_name=settings.AZURE_ACCOUNT_NAME,
        container_name=settings.AZURE_CONTAINER,
        blob_name=blob_name,
        account_key=settings.AZURE_ACCOUNT_KEY,
        permission=BlobSasPermissions(write=True, create=True),
        expiry=datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    )

    upload_url = (
        f"{settings.AZURE_BLOB_BASE_URL}/{blob_name}?{sas}"
    )

    return {
        "upload_url": upload_url,
        "blob_path": blob_name
    }
