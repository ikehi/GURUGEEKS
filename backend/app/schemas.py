from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    email: Optional[str] = None

# User Preference Schemas
class UserPreferenceBase(BaseModel):
    preferred_sources: List[str] = []
    preferred_categories: List[str] = []
    preferred_authors: List[str] = []
    language: str = "en"
    country: str = "us"

class UserPreferenceCreate(UserPreferenceBase):
    pass

class UserPreferenceUpdate(BaseModel):
    preferred_sources: Optional[List[str]] = None
    preferred_categories: Optional[List[str]] = None
    preferred_authors: Optional[List[str]] = None
    language: Optional[str] = None
    country: Optional[str] = None

class UserPreferenceResponse(UserPreferenceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Article Schemas
class ArticleBase(BaseModel):
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    url: str
    image_url: Optional[str] = None
    source_name: str
    source_id: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    published_at: datetime
    language: str = "en"
    country: str = "us"

class ArticleCreate(ArticleBase):
    external_id: str

class ArticleResponse(ArticleBase):
    id: int
    external_id: str
    scraped_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class ArticleListResponse(BaseModel):
    articles: List[ArticleResponse]
    total: int
    page: int
    size: int
    pages: int

# Saved Article Schemas
class SavedArticleBase(BaseModel):
    notes: Optional[str] = None

class SavedArticleCreate(SavedArticleBase):
    article_id: int

# Input schema for save endpoint (notes only; article_id comes from path)
class SavedArticleInput(BaseModel):
    notes: Optional[str] = None

class SavedArticleResponse(SavedArticleBase):
    id: int
    user_id: int
    article_id: int
    saved_at: datetime
    article: ArticleResponse
    
    class Config:
        from_attributes = True

# Search and Filter Schemas
class ArticleSearchParams(BaseModel):
    query: Optional[str] = None
    sources: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    authors: Optional[List[str]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    language: Optional[str] = None
    country: Optional[str] = None
    page: int = 1
    size: int = 20

class ArticleFilterResponse(BaseModel):
    sources: List[str]
    categories: List[str]
    authors: List[str]
    languages: List[str]
    countries: List[str]

# API Response Schemas
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None

# Health Check Schema
class HealthCheck(BaseModel):
    status: str
    service: str
    timestamp: datetime
    version: str
