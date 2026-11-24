from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Create database engine with connection pooling and ping check
engine = create_engine(
    settings.get_database_url(),
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that yields a database session and closes it on completion."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
