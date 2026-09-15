from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db


def module_router(name: str, tag: str, dependencies: list | None = None) -> APIRouter:
    router = APIRouter(prefix=f"/{name}", tags=[tag], dependencies=dependencies or [])

    @router.get("")
    def list_items(db: Session = Depends(get_db)):
        return {"module": name, "status": "ready", "items": []}

    @router.get("/{item_id}")
    def get_item(item_id: int, db: Session = Depends(get_db)):
        return {"module": name, "id": item_id, "status": "ready"}

    return router
