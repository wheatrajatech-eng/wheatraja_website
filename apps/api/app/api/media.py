from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.auth_deps import require_admin_permission
from app.core.database import get_db
from app.models.entities import MediaLibrary
from app.services.storage import store_image

router = APIRouter(prefix="/media", tags=["media"])


@router.post("/upload")
async def upload_image(file: UploadFile = File(...), admin: dict = Depends(require_admin_permission("cms.write")), db: Session = Depends(get_db)):
    content = await file.read()
    try:
        stored = store_image(content, file.filename or "upload", file.content_type or "")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    media = MediaLibrary(url=stored.url, file_name=stored.file_name, mime_type=stored.mime_type, size_bytes=stored.size_bytes)
    db.add(media)
    db.commit()
    return {
        "id": media.id,
        "url": stored.url,
        "provider": stored.provider,
        "file_name": stored.file_name,
        "mime_type": stored.mime_type,
        "size_bytes": stored.size_bytes,
    }
