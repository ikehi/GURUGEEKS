from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    preferences = relationship("UserPreference", back_populates="user", uselist=False)
    saved_articles = relationship("SavedArticle", back_populates="user")

class UserPreference(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    preferred_sources = Column(JSON, default=list)  # List of source names
    preferred_categories = Column(JSON, default=list)  # List of category names
    preferred_authors = Column(JSON, default=list)  # List of author names
    language = Column(String(10), default="en")
    country = Column(String(10), default="us")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="preferences")

class Article(Base):
    __tablename__ = "articles"
    
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(255), unique=True, index=True, nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    content = Column(Text)
    url = Column(String(1000), nullable=False)
    image_url = Column(String(1000))
    source_name = Column(String(255), nullable=False)
    source_id = Column(String(255), index=True)
    author = Column(String(255))
    category = Column(String(100), index=True)
    tags = Column(JSON, default=list)
    published_at = Column(DateTime(timezone=True), nullable=False)
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    language = Column(String(10), default="en")
    country = Column(String(10), default="us")
    is_active = Column(Boolean, default=True)
    
    # Relationships
    saved_by = relationship("SavedArticle", back_populates="article")

class SavedArticle(Base):
    __tablename__ = "saved_articles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    saved_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)
    
    # Relationships
    user = relationship("User", back_populates="saved_articles")
    article = relationship("Article", back_populates="saved_by")

# Create indexes for better query performance
Index('idx_articles_published_at', Article.published_at)
Index('idx_articles_source_category', Article.source_name, Article.category)
Index('idx_articles_title_search', Article.title)
# Removed content index due to size limitations - will use full-text search instead
Index('idx_user_email', User.email)
Index('idx_user_username', User.username)
