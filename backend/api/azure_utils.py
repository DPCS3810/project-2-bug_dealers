import os
from datetime import datetime, timedelta
from azure.storage.blob import generate_blob_sas, BlobSasPermissions


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
