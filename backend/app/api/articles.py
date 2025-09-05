from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import User
from app.schemas import (
    ArticleResponse, ArticleListResponse, ArticleSearchParams, 
    ArticleFilterResponse, SavedArticleCreate, SavedArticleResponse, SavedArticleInput
)
from app.crud import (
    get_articles, get_article, search_articles, get_article_filters,
    get_personalized_articles, save_article, unsave_article,
    get_saved_articles, is_article_saved
)
from app.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=ArticleListResponse)
async def get_articles_list(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    sources: Optional[List[str]] = Query(None, description="Filter by sources"),
    categories: Optional[List[str]] = Query(None, description="Filter by categories"),
    authors: Optional[List[str]] = Query(None, description="Filter by authors"),
    date_from: Optional[datetime] = Query(None, description="Filter from date"),
    date_to: Optional[datetime] = Query(None, description="Filter to date"),
    language: Optional[str] = Query(None, description="Filter by language"),
    country: Optional[str] = Query(None, description="Filter by country"),
    db: Session = Depends(get_db)
):
    """
    Get articles with filtering and pagination
    """
    skip = (page - 1) * size
    
    articles, total = get_articles(
        db=db,
        skip=skip,
        limit=size,
        sources=sources,
        categories=categories,
        authors=authors,
        date_from=date_from,
        date_to=date_to,
        language=language,
        country=country
    )
    
    pages = (total + size - 1) // size
    
    return ArticleListResponse(
        articles=articles,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.get("/search", response_model=ArticleListResponse)
async def search_articles_endpoint(
    q: str = Query(..., description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db)
):
    """
    Search articles by title and content
    """
    skip = (page - 1) * size
    
    articles, total = search_articles(
        db=db,
        query=q,
        skip=skip,
        limit=size
    )
    
    pages = (total + size - 1) // size
    
    return ArticleListResponse(
        articles=articles,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.get("/personalized", response_model=ArticleListResponse)
async def get_personalized_articles_endpoint(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized articles based on user preferences
    """
    skip = (page - 1) * size
    
    articles, total = get_personalized_articles(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=size
    )
    
    pages = (total + size - 1) // size
    
    return ArticleListResponse(
        articles=articles,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.get("/{article_id}", response_model=ArticleResponse)
async def get_article_detail(
    article_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific article by ID
    """
    article = get_article(db, article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    return article

@router.get("/filters/available", response_model=ArticleFilterResponse)
async def get_available_filters(db: Session = Depends(get_db)):
    """
    Get available filters for articles
    """
    filters = get_article_filters(db)
    return ArticleFilterResponse(**filters)

@router.post("/{article_id}/save", response_model=SavedArticleResponse)
async def save_article_endpoint(
    article_id: int,
    saved_article: Optional[SavedArticleInput] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Save an article for the current user
    """
    # Verify article exists
    article = get_article(db, article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    # Build the create payload using path article_id and optional notes from body
    create_payload = SavedArticleCreate(
        article_id=article_id,
        notes=(saved_article.notes if saved_article else None)
    )
    
    db_saved_article = save_article(db, current_user.id, create_payload)
    return db_saved_article

@router.delete("/{article_id}/save")
async def unsave_article_endpoint(
    article_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Remove a saved article for the current user
    """
    success = unsave_article(db, current_user.id, article_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved article not found"
        )
    
    return {"message": "Article unsaved successfully"}

@router.get("/saved/list", response_model=ArticleListResponse)
async def get_saved_articles_list(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get user's saved articles
    """
    skip = (page - 1) * size
    
    saved_articles, total = get_saved_articles(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=size
    )
    
    # Convert SavedArticle to ArticleResponse
    articles = [saved_article.article for saved_article in saved_articles]
    
    pages = (total + size - 1) // size
    
    return ArticleListResponse(
        articles=articles,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.get("/{article_id}/saved")
async def check_article_saved(
    article_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Check if an article is saved by the current user
    """
    is_saved = is_article_saved(db, current_user.id, article_id)
    return {"is_saved": is_saved}

@router.post("/{article_id}/scrape-content")
async def scrape_article_content(
    article_id: int,
    db: Session = Depends(get_db)
):
    """
    Scrape content for an article that doesn't have it
    """
    from app.services.content_scraper import ContentScrapingService
    
    # Get the article
    article = get_article(db, article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    # Check if article already has content
    if article.content and len(article.content.strip()) > 100:
        return {"message": "Article already has content", "content": article.content}
    
    # Scrape content
    scraper = ContentScrapingService()
    scraped_content = await scraper.scrape_content(article.url)
    
    if scraped_content:
        # Update the article with scraped content
        article.content = scraped_content
        db.commit()
        db.refresh(article)
        
        return {"message": "Content scraped successfully", "content": scraped_content}
    else:
        return {
            "message": "Could not scrape content from this URL. The website may be blocking automated requests or the content may not be accessible.",
            "content": None
        }
