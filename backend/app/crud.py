from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import re

from app.models import User, Article, UserPreference, SavedArticle
from app.schemas import UserCreate, ArticleCreate, UserPreferenceCreate, SavedArticleCreate
from app.auth import get_password_hash

# User CRUD operations
def get_user(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username"""
    return db.query(User).filter(User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Get multiple users"""
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate) -> User:
    """Create a new user"""
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_data: Dict[str, Any]) -> Optional[User]:
    """Update user information"""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    for field, value in user_data.items():
        if hasattr(db_user, field):
            setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

# Article CRUD operations
def get_article(db: Session, article_id: int) -> Optional[Article]:
    """Get article by ID"""
    return db.query(Article).filter(Article.id == article_id).first()

def get_article_by_external_id(db: Session, external_id: str) -> Optional[Article]:
    """Get article by external ID"""
    return db.query(Article).filter(Article.external_id == external_id).first()

def get_articles(
    db: Session, 
    skip: int = 0, 
    limit: int = 20,
    sources: Optional[List[str]] = None,
    categories: Optional[List[str]] = None,
    authors: Optional[List[str]] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    language: Optional[str] = None,
    country: Optional[str] = None
) -> tuple[List[Article], int]:
    """Get articles with filtering"""
    query = db.query(Article).filter(Article.is_active == True)
    
    # Apply filters
    if sources:
        query = query.filter(Article.source_name.in_(sources))
    if categories:
        query = query.filter(Article.category.in_(categories))
    if authors:
        query = query.filter(Article.author.in_(authors))
    if date_from:
        query = query.filter(Article.published_at >= date_from)
    if date_to:
        query = query.filter(Article.published_at <= date_to)
    if language:
        query = query.filter(Article.language == language)
    if country:
        query = query.filter(Article.country == country)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    articles = query.order_by(desc(Article.published_at)).offset(skip).limit(limit).all()
    
    return articles, total

def search_articles(
    db: Session,
    query: str,
    skip: int = 0,
    limit: int = 20
) -> tuple[List[Article], int]:
    """Search articles by title and content"""
    search_query = f"%{query}%"
    
    # Search in title and content
    articles_query = db.query(Article).filter(
        and_(
            Article.is_active == True,
            or_(
                Article.title.ilike(search_query),
                Article.description.ilike(search_query),
                Article.content.ilike(search_query)
            )
        )
    )
    
    total = articles_query.count()
    articles = articles_query.order_by(desc(Article.published_at)).offset(skip).limit(limit).all()
    
    return articles, total

def create_article(db: Session, article: ArticleCreate) -> Article:
    """Create a new article"""
    db_article = Article(**article.dict())
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

def create_or_update_article(db: Session, article: ArticleCreate) -> Article:
    """Create or update article by external ID"""
    existing_article = get_article_by_external_id(db, article.external_id)
    if existing_article:
        # Update existing article
        for field, value in article.dict().items():
            if hasattr(existing_article, field):
                setattr(existing_article, field, value)
        existing_article.scraped_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_article)
        return existing_article
    else:
        # Create new article
        return create_article(db, article)

def get_article_filters(db: Session) -> Dict[str, List[str]]:
    """Get available filters for articles"""
    sources = [r[0] for r in db.query(Article.source_name).distinct().all()]
    categories = [r[0] for r in db.query(Article.category).filter(Article.category.isnot(None)).distinct().all()]
    authors = [r[0] for r in db.query(Article.author).filter(Article.author.isnot(None)).distinct().all()]
    languages = [r[0] for r in db.query(Article.language).distinct().all()]
    countries = [r[0] for r in db.query(Article.country).distinct().all()]
    
    return {
        "sources": sources,
        "categories": categories,
        "authors": authors,
        "languages": languages,
        "countries": countries
    }

# User Preference CRUD operations
def get_user_preference(db: Session, user_id: int) -> Optional[UserPreference]:
    """Get user preferences"""
    return db.query(UserPreference).filter(UserPreference.user_id == user_id).first()

def create_user_preference(db: Session, user_id: int, preference: UserPreferenceCreate) -> UserPreference:
    """Create user preferences"""
    db_preference = UserPreference(user_id=user_id, **preference.dict())
    db.add(db_preference)
    db.commit()
    db.refresh(db_preference)
    return db_preference

def update_user_preference(db: Session, user_id: int, preference_data: Dict[str, Any]) -> Optional[UserPreference]:
    """Update user preferences"""
    db_preference = get_user_preference(db, user_id)
    if not db_preference:
        return None
    
    for field, value in preference_data.items():
        if hasattr(db_preference, field):
            setattr(db_preference, field, value)
    
    db_preference.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_preference)
    return db_preference

def get_personalized_articles(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 20
) -> tuple[List[Article], int]:
    """Get personalized articles based on user preferences"""
    user_pref = get_user_preference(db, user_id)
    if not user_pref:
        # If no preferences, return recent articles
        return get_articles(db, skip, limit)
    
    query = db.query(Article).filter(Article.is_active == True)
    
    # Apply user preferences
    if user_pref.preferred_sources:
        query = query.filter(Article.source_name.in_(user_pref.preferred_sources))
    if user_pref.preferred_categories:
        query = query.filter(Article.category.in_(user_pref.preferred_categories))
    if user_pref.preferred_authors:
        query = query.filter(Article.author.in_(user_pref.preferred_authors))
    if user_pref.language:
        query = query.filter(Article.language == user_pref.language)
    if user_pref.country:
        query = query.filter(Article.country == user_pref.country)
    
    total = query.count()
    articles = query.order_by(desc(Article.published_at)).offset(skip).limit(limit).all()
    
    return articles, total

# Saved Article CRUD operations
def get_saved_articles(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> tuple[List[SavedArticle], int]:
    """Get user's saved articles"""
    query = db.query(SavedArticle).filter(SavedArticle.user_id == user_id)
    total = query.count()
    saved_articles = query.order_by(desc(SavedArticle.saved_at)).offset(skip).limit(limit).all()
    return saved_articles, total

def save_article(db: Session, user_id: int, saved_article: SavedArticleCreate) -> SavedArticle:
    """Save an article for a user"""
    # Check if already saved
    existing = db.query(SavedArticle).filter(
        and_(
            SavedArticle.user_id == user_id,
            SavedArticle.article_id == saved_article.article_id
        )
    ).first()
    
    if existing:
        # Update existing saved article
        existing.notes = saved_article.notes
        existing.saved_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    
    # Create new saved article
    db_saved_article = SavedArticle(
        user_id=user_id,
        article_id=saved_article.article_id,
        notes=saved_article.notes
    )
    db.add(db_saved_article)
    db.commit()
    db.refresh(db_saved_article)
    return db_saved_article

def unsave_article(db: Session, user_id: int, article_id: int) -> bool:
    """Remove a saved article"""
    saved_article = db.query(SavedArticle).filter(
        and_(
            SavedArticle.user_id == user_id,
            SavedArticle.article_id == article_id
        )
    ).first()
    
    if saved_article:
        db.delete(saved_article)
        db.commit()
        return True
    return False

def is_article_saved(db: Session, user_id: int, article_id: int) -> bool:
    """Check if an article is saved by the user"""
    return db.query(SavedArticle).filter(
        and_(
            SavedArticle.user_id == user_id,
            SavedArticle.article_id == article_id
        )
    ).first() is not None
