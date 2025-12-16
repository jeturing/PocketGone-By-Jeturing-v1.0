from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database file path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data")
os.makedirs(DATA_DIR, exist_ok=True)
DATABASE_URL = f"sqlite:///{os.path.join(DATA_DIR, 'pocketgone.db')}"

# Create engine
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False},
    echo=False
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize database
def init_db():
    """Create all tables and seed initial data"""
    from models import User
    Base.metadata.create_all(bind=engine)
    
    # Seed default users if not exist
    db = SessionLocal()
    try:
        # Check if users exist
        existing_users = db.query(User).count()
        if existing_users == 0:
            # Create default users
            admin_user = User(
                username="Prof. Falken",
                access_code="admin",
                role="PROFESSOR",
                is_active=True
            )
            student_user = User(
                username="Student Unit 1",
                access_code="student",
                role="STUDENT",
                is_active=True
            )
            db.add(admin_user)
            db.add(student_user)
            db.commit()
            print("✓ Default users created")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
