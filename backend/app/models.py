from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_admin = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False)
    category = Column(String(80), nullable=False, default="Soft Silk")
    note = Column(String(160), nullable=False, default="")
    description = Column(String(2000), nullable=False, default="")
    image_url = Column(String(500), nullable=False)
    price = Column(Integer, nullable=True)
    compare_at_price = Column(Integer, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    is_featured = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
