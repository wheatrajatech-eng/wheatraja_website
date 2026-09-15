import re
import uuid
from dataclasses import dataclass
from pathlib import Path

from app.core.config import API_ROOT, settings


ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}
IMAGE_SIGNATURES = {
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/webp": [b"RIFF"],
    "image/gif": [b"GIF87a", b"GIF89a"],
}


@dataclass
class StoredFile:
    url: str
    file_name: str
    mime_type: str
    size_bytes: int
    provider: str


def safe_file_name(original_name: str, mime_type: str) -> str:
    stem = Path(original_name or "upload").stem
    stem = re.sub(r"[^a-zA-Z0-9._-]+", "-", stem).strip(".-").lower()[:80] or "upload"
    suffix = ALLOWED_IMAGE_MIME_TYPES[mime_type]
    return f"{stem}-{uuid.uuid4().hex[:12]}{suffix}"


def validate_image_upload(content: bytes, mime_type: str) -> None:
    if mime_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise ValueError("Unsupported image type. Use JPEG, PNG, WebP or GIF.")
    if not content:
        raise ValueError("Uploaded file is empty.")
    if len(content) > settings.upload_max_bytes:
        raise ValueError(f"Uploaded file exceeds {settings.upload_max_bytes} bytes.")
    signatures = IMAGE_SIGNATURES[mime_type]
    if not any(content.startswith(signature) for signature in signatures):
        raise ValueError("Uploaded file content does not match its declared image type.")


class LocalStorageAdapter:
    provider = "local"

    def upload(self, content: bytes, file_name: str, mime_type: str) -> StoredFile:
        upload_root = Path(settings.local_upload_dir)
        if not upload_root.is_absolute():
            upload_root = API_ROOT / upload_root
        upload_root.mkdir(parents=True, exist_ok=True)
        target = upload_root / file_name
        target.write_bytes(content)
        base_url = settings.public_upload_base_url.rstrip("/")
        return StoredFile(url=f"{base_url}/{file_name}", file_name=file_name, mime_type=mime_type, size_bytes=len(content), provider=self.provider)


class S3StorageAdapter:
    provider = "s3"

    def upload(self, content: bytes, file_name: str, mime_type: str) -> StoredFile:
        import boto3

        client = boto3.client(
            "s3",
            region_name=settings.aws_s3_region,
            aws_access_key_id=settings.aws_s3_access_key_id,
            aws_secret_access_key=settings.aws_s3_secret_access_key,
        )
        key = f"uploads/{file_name}"
        client.put_object(Bucket=settings.aws_s3_bucket, Key=key, Body=content, ContentType=mime_type)
        public_base = settings.public_upload_base_url.strip().rstrip("/")
        if public_base and public_base != "/uploads":
            url = f"{public_base}/{key}"
        else:
            url = f"https://{settings.aws_s3_bucket}.s3.{settings.aws_s3_region}.amazonaws.com/{key}"
        return StoredFile(url=url, file_name=file_name, mime_type=mime_type, size_bytes=len(content), provider=self.provider)


def storage_adapter():
    if settings.storage_provider == "s3":
        return S3StorageAdapter()
    if settings.storage_provider == "local":
        return LocalStorageAdapter()
    raise RuntimeError(f"Unsupported storage provider: {settings.storage_provider}")


def store_image(content: bytes, original_name: str, mime_type: str) -> StoredFile:
    validate_image_upload(content, mime_type)
    return storage_adapter().upload(content, safe_file_name(original_name, mime_type), mime_type)
