import httpx
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import logging
import time

from app.schemas import ArticleCreate
from app.services.content_scraper import ContentScrapingService

load_dotenv()

logger = logging.getLogger(__name__)

class NewsAPIService:
    """Service for fetching news from NewsAPI"""
    
    def __init__(self):
        self.api_key = os.getenv("NEWS_API_KEY")
        self.base_url = "https://newsapi.org/v2"
        
    async def fetch_articles(self, category: str = "general", country: str = "us", page_size: int = 100) -> List[Dict[str, Any]]:
        """Fetch articles from NewsAPI"""
        if not self.api_key:
            logger.warning("NewsAPI key not configured")
            return []
            
        try:
            url = f"{self.base_url}/top-headlines"
            params = {
                "country": country,
                "category": category,
                "pageSize": page_size,
                "apiKey": self.api_key
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                
                if data.get("status") == "ok":
                    return data.get("articles", [])
                else:
                    logger.error(f"NewsAPI error: {data.get('message', 'Unknown error')}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error fetching from NewsAPI: {str(e)}")
            return []

class GuardianService:
    """Service for fetching news from The Guardian"""
    
    def __init__(self):
        self.api_key = os.getenv("GUARDIAN_API_KEY")
        self.base_url = "https://content.guardianapis.com"
        
    async def fetch_articles(self, section: str = "news", page_size: int = 50) -> List[Dict[str, Any]]:
        """Fetch articles from The Guardian"""
        if not self.api_key:
            logger.warning("Guardian API key not configured")
            return []
            
        try:
            url = f"{self.base_url}/search"
            params = {
                "section": section,
                "page-size": page_size,
                "api-key": self.api_key,
                "show-fields": "headline,trailText,bodyText,thumbnail,byline,firstPublicationDate"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                
                if data.get("response", {}).get("status") == "ok":
                    return data.get("response", {}).get("results", [])
                else:
                    logger.error(f"Guardian API error: {data.get('response', {}).get('message', 'Unknown error')}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error fetching from Guardian: {str(e)}")
            return []

class NYTimesService:
    """Service for fetching news from New York Times"""
    
    def __init__(self):
        self.api_key = os.getenv("NYT_API_KEY")
        self.base_url = "https://api.nytimes.com/svc/news/v3/content"
        self.last_request_time = 0
        self.min_interval = 1.0  # Minimum 1 second between requests
        
    async def fetch_articles(self, section: str = "all", limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch articles from New York Times"""
        if not self.api_key:
            logger.warning("NYT API key not configured")
            return []
            
        try:
            # Rate limiting: ensure minimum interval between requests
            current_time = time.time()
            time_since_last = current_time - self.last_request_time
            if time_since_last < self.min_interval:
                await asyncio.sleep(self.min_interval - time_since_last)
            
            # Use the correct NYT API endpoint
            url = f"{self.base_url}/all/{section}.json"
            params = {
                "api-key": self.api_key,
                "limit": limit
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=30.0)
                self.last_request_time = time.time()
                response.raise_for_status()
                data = response.json()
                
                if data.get("status") == "OK":
                    return data.get("results", [])
                else:
                    logger.error(f"NYT API error: {data.get('fault', {}).get('faultstring', 'Unknown error')}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error fetching from NYT: {str(e)}")
            return []

class NewsAggregatorService:
    """Main service for aggregating news from multiple sources"""
    
    def __init__(self):
        self.news_api = NewsAPIService()
        self.guardian = GuardianService()
        self.nyt = NYTimesService()
        self.content_scraper = ContentScrapingService()
        
    def _parse_newsapi_article(self, article: Dict[str, Any]) -> Optional[ArticleCreate]:
        """Parse NewsAPI article format"""
        try:
            published_at = datetime.fromisoformat(article.get("publishedAt", "").replace("Z", "+00:00"))
            
            return ArticleCreate(
                external_id=f"newsapi_{article.get('url', '').split('/')[-1]}",
                title=article.get("title", ""),
                description=article.get("description", ""),
                content=article.get("content", ""),
                url=article.get("url", ""),
                image_url=article.get("urlToImage", ""),
                source_name=article.get("source", {}).get("name", "NewsAPI"),
                source_id=article.get("source", {}).get("id", ""),
                author=article.get("author", ""),
                category="general",  # NewsAPI doesn't provide category in top-headlines
                tags=[],
                published_at=published_at,
                language="en",
                country="us"
            )
        except Exception as e:
            logger.error(f"Error parsing NewsAPI article: {str(e)}")
            return None
            
    def _parse_guardian_article(self, article: Dict[str, Any]) -> Optional[ArticleCreate]:
        """Parse Guardian article format"""
        try:
            fields = article.get("fields", {})
            published_at = datetime.fromisoformat(article.get("webPublicationDate", ""))
            
            return ArticleCreate(
                external_id=f"guardian_{article.get('id', '')}",
                title=fields.get("headline", ""),
                description=fields.get("trailText", ""),
                content=fields.get("bodyText", ""),
                url=article.get("webUrl", ""),
                image_url=fields.get("thumbnail", ""),
                source_name="The Guardian",
                source_id="guardian",
                author=fields.get("byline", ""),
                category=article.get("sectionName", ""),
                tags=[tag.get("webTitle", "") for tag in article.get("tags", [])],
                published_at=published_at,
                language="en",
                country="gb"
            )
        except Exception as e:
            logger.error(f"Error parsing Guardian article: {str(e)}")
            return None
            
    def _parse_nyt_article(self, article: Dict[str, Any]) -> Optional[ArticleCreate]:
        """Parse NYT article format"""
        try:
            published_at = datetime.fromisoformat(article.get("published_date", ""))
            
            return ArticleCreate(
                external_id=f"nyt_{article.get('url', '').split('/')[-1]}",
                title=article.get("title", ""),
                description=article.get("abstract", ""),
                content="",  # NYT doesn't provide full content in this endpoint
                url=article.get("url", ""),
                image_url="",  # NYT doesn't provide image URL in this endpoint
                source_name="The New York Times",
                source_id="nyt",
                author=article.get("byline", ""),
                category=article.get("section", ""),
                tags=article.get("des_facet", []),
                published_at=published_at,
                language="en",
                country="us"
            )
        except Exception as e:
            logger.error(f"Error parsing NYT article: {str(e)}")
            return None
    
    async def fetch_all_articles(self) -> List[ArticleCreate]:
        """Fetch articles from all sources"""
        tasks = [
            self._fetch_newsapi_articles(),
            self._fetch_guardian_articles(),
            self._fetch_nyt_articles()
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_articles = []
        for result in results:
            if isinstance(result, list):
                all_articles.extend(result)
            else:
                logger.error(f"Error in fetch task: {result}")
                
        return all_articles
    
    async def _fetch_newsapi_articles(self) -> List[ArticleCreate]:
        """Fetch and parse NewsAPI articles"""
        categories = ["general", "business", "technology", "sports", "entertainment", "health", "science"]
        articles = []
        
        for category in categories:
            raw_articles = await self.news_api.fetch_articles(category=category, page_size=20)
            for article in raw_articles:
                parsed_article = self._parse_newsapi_article(article)
                if parsed_article:
                    articles.append(parsed_article)
                    
        return articles
    
    async def _fetch_guardian_articles(self) -> List[ArticleCreate]:
        """Fetch and parse Guardian articles"""
        sections = ["news", "sport", "culture", "business", "technology", "politics"]
        articles = []
        
        for section in sections:
            raw_articles = await self.guardian.fetch_articles(section=section, page_size=20)
            for article in raw_articles:
                parsed_article = self._parse_guardian_article(article)
                if parsed_article:
                    articles.append(parsed_article)
                    
        return articles
    
    async def _fetch_nyt_articles(self) -> List[ArticleCreate]:
        """Fetch and parse NYT articles"""
        sections = ["all"]  # Reduced to just "all" to avoid rate limiting
        articles = []
        
        for section in sections:
            raw_articles = await self.nyt.fetch_articles(section=section, limit=10)  # Reduced limit
            for article in raw_articles:
                parsed_article = self._parse_nyt_article(article)
                if parsed_article:
                    articles.append(parsed_article)
                    
        return articles
    
    async def scrape_missing_content(self, articles: List[ArticleCreate]) -> List[ArticleCreate]:
        """Scrape content for articles that don't have it"""
        scraped_articles = []
        
        for article in articles:
            if not article.content or len(article.content.strip()) < 100:
                # Try to scrape content
                scraped_content = await self.content_scraper.scrape_content(article.url)
                if scraped_content:
                    article.content = scraped_content
                    logger.info(f"Scraped content for article: {article.title[:50]}...")
                else:
                    logger.warning(f"Could not scrape content for: {article.url}")
            
            scraped_articles.append(article)
        
        return scraped_articles
