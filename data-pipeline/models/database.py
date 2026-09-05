import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

def get_engine():
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/bgmi_intel")
    try:
        connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
        test_engine = create_engine(db_url, connect_args=connect_args)
        # Verify connection works
        with test_engine.connect() as conn:
            pass
        return test_engine
    except Exception as e:
        print(f"Notice: Database connection to '{db_url}' unavailable ({e}).")
        print("Falling back to local SQLite database: bgmi_intel.db")
        sqlite_url = "sqlite:///bgmi_intel.db"
        return create_engine(sqlite_url, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency helper for FastAPI endpoints or CLI commands"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

