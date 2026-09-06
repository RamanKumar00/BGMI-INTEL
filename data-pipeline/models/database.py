import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

def get_engine():
    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("postgresql"):
        try:
            test_engine = create_engine(db_url)
            with test_engine.connect() as conn:
                pass
            return test_engine
        except Exception as e:
            print(f"Notice: PostgreSQL database connection unavailable ({e}). Falling back to local SQLite database.")
    
    # Consistently locate bgmi_intel.db inside data-pipeline/ folder
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "bgmi_intel.db")
    
    # Fallback if db file exists in root directory
    if not os.path.exists(db_path) and os.path.exists("bgmi_intel.db"):
        db_path = os.path.abspath("bgmi_intel.db")
        
    sqlite_url = f"sqlite:///{db_path.replace('\\', '/')}"
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
