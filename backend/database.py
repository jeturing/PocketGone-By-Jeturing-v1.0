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
            # Create default users with system-level credentials
            admin_user = User(
                username="root",
                access_code="toor",  # root/toor for admin access
                role="ADMIN",
                system_user="root",
                is_active=True
            )
            student_user = User(
                username="student",
                access_code="student",
                role="STUDENT",
                system_user="student",  # System user for student execution
                is_active=True
            )
            db.add(admin_user)
            db.add(student_user)
            db.commit()
            print("✓ Default users created (root/toor for admin, student/student)")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
