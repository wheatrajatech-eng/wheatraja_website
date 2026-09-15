import logging
import subprocess
from pathlib import Path
from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.services.store import ensure_seed_data

logger = logging.getLogger("wheatraja.bootstrap")


def create_mysql_database_if_missing() -> None:
    if settings.sqlalchemy_database_url.startswith("sqlite"):
        logger.info("SQLite development database selected; skipping MySQL database creation.")
        return
    logger.info("Preparing MySQL database config=%s", settings.sanitized_db_config)
    server_engine = create_engine(settings.mysql_server_url, pool_pre_ping=True)
    with server_engine.connect() as connection:
        connection.execute(text(
            f"CREATE DATABASE IF NOT EXISTS `{settings.effective_db_name}` "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        ))
        connection.commit()
    logger.info("Database `%s` is ready.", settings.effective_db_name)


def run_alembic_migrations() -> None:
    if settings.environment == "development":
        Base.metadata.create_all(bind=engine)
        logger.info("Development database tables created from SQLAlchemy metadata.")
        return
    api_root = Path(__file__).resolve().parents[2]
    subprocess.run(["alembic", "-c", str(api_root / "alembic.ini"), "upgrade", "head"], cwd=str(api_root), check=True)


def seed_default_data() -> None:
    db = SessionLocal()
    try:
        ensure_seed_data(db)
    finally:
        db.close()


def initialize_application_storage() -> None:
    logger.info("Starting database bootstrap config=%s", settings.sanitized_db_config)
    create_mysql_database_if_missing()
    run_alembic_migrations()
    seed_default_data()
