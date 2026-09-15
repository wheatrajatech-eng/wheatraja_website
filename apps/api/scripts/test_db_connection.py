from pathlib import Path
import sys

from sqlalchemy import create_engine, text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings


def main() -> None:
    print(f"Loaded DB config: {settings.sanitized_db_config}")
    engine = create_engine(settings.sqlalchemy_database_url, pool_pre_ping=True)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1")).scalar_one()
    print(f"SELECT 1 -> {result}")


if __name__ == "__main__":
    main()
