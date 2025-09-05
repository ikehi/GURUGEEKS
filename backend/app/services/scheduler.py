import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv

from app.database import SessionLocal
from app.services.news_service import NewsAggregatorService
from app.crud import create_or_update_article
from app.models import Article

load_dotenv()

logger = logging.getLogger(__name__)

class NewsScheduler:
    """Scheduler for fetching news articles periodically"""
    
    def __init__(self):
        self.news_service = NewsAggregatorService()
        self.task: Optional[asyncio.Task] = None
        self.is_running = False
        self.interval_minutes = int(os.getenv("SCRAPING_INTERVAL", "30"))
        
    async def start(self):
        """Start the scheduler"""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
            
        self.is_running = True
        logger.info(f"Starting news scheduler with {self.interval_minutes} minute interval")
        
        # Run initial fetch
        await self._fetch_and_store_articles()
        
        # Start periodic task
        self.task = asyncio.create_task(self._run_periodic())
        
    async def stop(self):
        """Stop the scheduler"""
        if not self.is_running:
            logger.warning("Scheduler is not running")
            return
            
        self.is_running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("News scheduler stopped")
        
    async def _run_periodic(self):
        """Run the periodic fetch task"""
        while self.is_running:
            try:
                await asyncio.sleep(self.interval_minutes * 60)  # Convert to seconds
                if self.is_running:
                    await self._fetch_and_store_articles()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in periodic fetch: {str(e)}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying
                
    async def _fetch_and_store_articles(self):
        """Fetch articles from all sources and store them in the database"""
        try:
            logger.info("Starting article fetch and store process")
            start_time = datetime.utcnow()
            
            # Fetch articles from all sources
            articles = await self.news_service.fetch_all_articles()
            logger.info(f"Fetched {len(articles)} articles from all sources")
            
            # Scrape content for articles that don't have it
            articles = await self.news_service.scrape_missing_content(articles)
            logger.info(f"Content scraping completed for {len(articles)} articles")
            
            # Store articles in database
            db = SessionLocal()
            try:
                stored_count = 0
                updated_count = 0
                
                for article in articles:
                    try:
                        # Use the create_or_update_article function to handle duplicates
                        result = create_or_update_article(db, article)
                        if result:
                            # Check if this was a new article or an update
                            # We can't compare scraped_at since ArticleCreate doesn't have it
                            # Instead, we'll assume it's an update if the article already existed
                            stored_count += 1
                            
                    except Exception as e:
                        logger.error(f"Error processing article {article.external_id}: {str(e)}")
                        continue
                
                db.commit()
                end_time = datetime.utcnow()
                duration = (end_time - start_time).total_seconds()
                
                logger.info(f"Article fetch and store completed in {duration:.2f}s")
                logger.info(f"Stored: {stored_count}, Updated: {updated_count}")
                
            except Exception as e:
                db.rollback()
                logger.error(f"Database error during article storage: {str(e)}")
                raise
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error in fetch and store process: {str(e)}")
            
    async def run_once(self):
        """Run the fetch and store process once"""
        await self._fetch_and_store_articles()

# Global scheduler instance
_scheduler: Optional[NewsScheduler] = None

def start_scheduler():
    """Start the global scheduler"""
    global _scheduler
    if _scheduler is None:
        _scheduler = NewsScheduler()
    
    # Create event loop if it doesn't exist
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    # Start scheduler in background
    loop.create_task(_scheduler.start())

def stop_scheduler():
    """Stop the global scheduler"""
    global _scheduler
    if _scheduler:
        # Create event loop if it doesn't exist
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        # Stop scheduler
        loop.create_task(_scheduler.stop())

async def run_fetch_once():
    """Run the fetch process once (for manual triggering)"""
    global _scheduler
    if _scheduler is None:
        _scheduler = NewsScheduler()
    
    await _scheduler.run_once()
