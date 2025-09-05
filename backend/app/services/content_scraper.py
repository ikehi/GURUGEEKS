import httpx
import asyncio
from typing import Optional
from bs4 import BeautifulSoup
import logging
import re
from urllib.parse import urljoin, urlparse
import time

logger = logging.getLogger(__name__)

class ContentScraper:
    """Service for scraping article content from URLs"""
    
    def __init__(self):
        self.timeout = 30.0
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
    async def scrape_article_content(self, url: str) -> Optional[str]:
        """Scrape article content from a given URL"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Remove script and style elements
                for script in soup(["script", "style", "nav", "header", "footer", "aside"]):
                    script.decompose()
                
                # Try different selectors for article content
                content_selectors = [
                    'article',
                    '[role="main"]',
                    '.article-content',
                    '.post-content',
                    '.entry-content',
                    '.content',
                    '.article-body',
                    '.post-body',
                    '.entry-body',
                    'main',
                    '.main-content'
                ]
                
                content = None
                for selector in content_selectors:
                    elements = soup.select(selector)
                    if elements:
                        # Get the largest element (most likely to be the main content)
                        content = max(elements, key=lambda x: len(x.get_text()))
                        break
                
                if not content:
                    # Fallback: look for paragraphs with substantial text
                    paragraphs = soup.find_all('p')
                    if paragraphs:
                        # Find the paragraph with the most text
                        content = max(paragraphs, key=lambda x: len(x.get_text()))
                        # Include surrounding content
                        parent = content.parent
                        if parent:
                            content = parent
                
                if content:
                    # Clean up the content
                    text = content.get_text()
                    text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
                    text = text.strip()
                    
                    # Only return if we have substantial content
                    if len(text) > 200:  # Minimum 200 characters
                        return text
                
                return None
                
        except Exception as e:
            logger.error(f"Error scraping content from {url}: {str(e)}")
            return None
    
    def is_scrapable_url(self, url: str) -> bool:
        """Check if a URL is likely scrapable"""
        try:
            parsed = urlparse(url)
            # Skip certain domains that are known to be problematic
            blocked_domains = [
                'youtube.com',
                'twitter.com',
                'facebook.com',
                'instagram.com',
                'tiktok.com',
                'linkedin.com'
            ]
            
            domain = parsed.netloc.lower()
            for blocked in blocked_domains:
                if blocked in domain:
                    return False
            
            # Must have http or https
            return parsed.scheme in ['http', 'https']
            
        except Exception:
            return False

class ContentScrapingService:
    """Service for managing content scraping with rate limiting"""
    
    def __init__(self):
        self.scraper = ContentScraper()
        self.last_request_time = 0
        self.min_interval = 2.0  # Minimum 2 seconds between requests
        
    async def scrape_content(self, url: str) -> Optional[str]:
        """Scrape content with rate limiting"""
        if not self.scraper.is_scrapable_url(url):
            return None
            
        # Rate limiting
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.min_interval:
            await asyncio.sleep(self.min_interval - time_since_last)
        
        self.last_request_time = time.time()
        return await self.scraper.scrape_article_content(url)