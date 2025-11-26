import os
from datetime import datetime, timedelta
from azure.storage.blob import (
    generate_blob_sas, BlobSasPermissions,
    BlobServiceClient
)
from urllib.parse import urlparse


def generate_upload_sas_url(filename):
    """
    Returns (signed_upload_url, blob_url_without_sas)
    """

    account_name = os.getenv("AZURE_ACCOUNT_NAME")
    account_key = os.getenv("AZURE_ACCOUNT_KEY")
    container = os.getenv("AZURE_CONTAINER", "photos")

    if not account_name or not account_key:
        raise Exception("Azure account keys are missing in .env")

    expiry = datetime.utcnow() + timedelta(minutes=30)

    sas = generate_blob_sas(
        account_name=account_name,
        container_name=container,
        blob_name=filename,
        account_key=account_key,
        permission=BlobSasPermissions(create=True, write=True),
        expiry=expiry
    )

    blob_url = f"https://{account_name}.blob.core.windows.net/{container}/{filename}"
    signed_url = f"{blob_url}?{sas}"

    return signed_url, blob_url

def generate_upload_sas_url(filename):
    account_name = os.getenv("AZURE_ACCOUNT_NAME")
    account_key = os.getenv("AZURE_ACCOUNT_KEY")
    container = os.getenv("AZURE_CONTAINER", "photos")
    expiry = datetime.utcnow() + timedelta(minutes=30)

    sas = generate_blob_sas(
        account_name=account_name,
        container_name=container,
        blob_name=filename,
        account_key=account_key,
        permission=BlobSasPermissions(create=True, write=True),
        expiry=expiry
    )
    blob_url = f"https://{account_name}.blob.core.windows.net/{container}/{filename}"
    signed_url = f"{blob_url}?{sas}"
    return signed_url, blob_url

def get_blob_service_client():
    conn_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    if conn_str:
        return BlobServiceClient.from_connection_string(conn_str)
    account_name = os.getenv("AZURE_ACCOUNT_NAME")
    account_key = os.getenv("AZURE_ACCOUNT_KEY")
    if not account_name or not account_key:
        raise RuntimeError("Azure creds not configured")
    account_url = f"https://{account_name}.blob.core.windows.net"
    return BlobServiceClient(account_url=account_url, credential=account_key)

def blob_exists_and_props(filename):
    """
    filename: blob path inside container (e.g. uploads/user/photo.jpg)
    returns: dict with properties (content_type, size, last_modified) or None
    """
    container = os.getenv("AZURE_CONTAINER", "photos")
    client = get_blob_service_client()
    blob_client = client.get_blob_client(container=container, blob=filename)
    try:
        props = blob_client.get_blob_properties()
    except Exception:
        return None
    return {
        "content_type": props.content_settings.content_type,
        "size": props.size,
        "last_modified": props.last_modified,
        "etag": props.etag,
    }

def full_blob_url_from_path(blob_path):
    account_name = os.getenv("AZURE_ACCOUNT_NAME")
    container = os.getenv("AZURE_CONTAINER", "photos")
    return f"https://{account_name}.blob.core.windows.net/{container}/{blob_path}"