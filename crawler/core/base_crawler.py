"""
Base Crawler Class
Main crawler that coordinates HTTP requests and data extraction
"""

import time
from typing import List, Dict, Any, Optional
from loguru import logger

from crawler.config.settings import settings
from crawler.core.http_client import http_client

class BaseCrawler:
    """Base crawler class with core functionality"""
    
    def __init__(self):
        """Initialize the crawler"""
        self.is_running = False
        self.crawled_count = 0
        self.failed_count = 0
        self.start_time = None
        self.visited_urls = set()  # Simple in-memory tracking
        
        # Validate configuration
        if not settings.validate_config():
            raise ValueError("Invalid crawler configuration")
        
        # Setup logging
        self._setup_logging()
        
        logger.info("🕷️ Base crawler initialized")
    
    def _setup_logging(self):
        """Setup logging configuration"""
        try:
            # Create logs directory if it doesn't exist
            import os
            os.makedirs('logs', exist_ok=True)
            
            # Configure loguru
            logger.add(
                settings.LOG_FILE,
                rotation="1 day",
                retention="30 days",
                level=settings.LOG_LEVEL,
                format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}"
            )
            
        except Exception as e:
            logger.warning(f"Could not setup file logging: {e}")
    
    def start(self):
        """Start the crawler"""
        if self.is_running:
            logger.warning("Crawler is already running")
            return
        
        self.is_running = True
        self.start_time = time.time()
        self.crawled_count = 0
        self.failed_count = 0
        self.visited_urls.clear()
        
        logger.info("🚀 Starting crawler...")
        logger.info(f"📊 Configuration: {settings.DELAY_BETWEEN_REQUESTS}s delay, {settings.MAX_CONCURRENT_REQUESTS} max concurrent")
    
    def stop(self):
        """Stop the crawler"""
        if not self.is_running:
            logger.warning("Crawler is not running")
            return
        
        self.is_running = False
        end_time = time.time()
        duration = end_time - self.start_time if self.start_time else 0
        
        logger.info("🛑 Stopping crawler...")
        logger.info(f"📊 Final stats: {self.crawled_count} crawled, {self.failed_count} failed, {duration:.1f}s duration")
    
    def crawl_url(self, url: str) -> Optional[Dict[str, Any]]:
        """Crawl a single URL"""
        if not self.is_running:
            logger.warning("Crawler is not running")
            return None
        
        try:
            # Check if URL already visited
            if url in self.visited_urls:
                logger.debug(f"URL already visited: {url}")
                return None
            
            # Fetch page content
            page_data = http_client.get_page(url)
            if not page_data:
                self.failed_count += 1
                logger.warning(f"Failed to fetch: {url}")
                return None
            
            # Mark URL as visited
            self.visited_urls.add(url)
            
            self.crawled_count += 1
            logger.info(f"✅ Successfully crawled: {url}")
            
            return page_data
            
        except Exception as e:
            self.failed_count += 1
            logger.error(f"Error crawling {url}: {e}")
            return None
    
    def crawl_urls(self, urls: List[str]) -> List[Dict[str, Any]]:
        """Crawl multiple URLs"""
        if not urls:
            logger.warning("No URLs provided")
            return []
        
        logger.info(f"🔄 Starting to crawl {len(urls)} URLs")
        
        results = []
        for i, url in enumerate(urls, 1):
            if not self.is_running:
                logger.info("Crawler stopped, aborting remaining URLs")
                break
            
            logger.info(f"Progress: {i}/{len(urls)} - {url}")
            
            result = self.crawl_url(url)
            if result:
                results.append(result)
            
            # Progress update
            if i % 10 == 0:
                success_rate = (self.crawled_count / (self.crawled_count + self.failed_count)) * 100
                logger.info(f"📊 Progress: {i}/{len(urls)} - Success rate: {success_rate:.1f}%")
        
        logger.info(f"🎯 Crawling completed: {len(results)} successful, {self.failed_count} failed")
        return results
    
    def get_stats(self) -> Dict[str, Any]:
        """Get current crawling statistics"""
        http_stats = http_client.get_session_info()
        
        current_time = time.time()
        duration = current_time - self.start_time if self.start_time else 0
        
        return {
            'crawler': {
                'is_running': self.is_running,
                'crawled_count': self.crawled_count,
                'failed_count': self.failed_count,
                'success_rate': (self.crawled_count / (self.crawled_count + self.failed_count)) * 100 if (self.crawled_count + self.failed_count) > 0 else 0,
                'duration_seconds': duration,
                'start_time': self.start_time,
                'visited_urls_count': len(self.visited_urls)
            },
            'http': http_stats
        }
    
    def cleanup(self):
        """Cleanup resources"""
        try:
            # Close HTTP client
            http_client.close()
            
            # Clear visited URLs
            self.visited_urls.clear()
            
            logger.info("🧹 Cleanup completed")
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
    
    def __enter__(self):
        """Context manager entry"""
        self.start()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.stop()
        self.cleanup()

# Example usage:
# with BaseCrawler() as crawler:
#     urls = ["https://example1.com", "https://example2.com"]
#     results = crawler.crawl_urls(urls)
#     stats = crawler.get_stats()
#     print(f"Crawled {stats['crawler']['crawled_count']} URLs")
