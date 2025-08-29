"""
HTTP Client for Web Crawler
Handles HTTP requests with rate limiting, retries, and error handling
"""

import time
import random
from typing import Optional, Dict, Any
import httpx
from loguru import logger

from crawler.config.settings import settings

class HTTPClient:
    """HTTP client with rate limiting and retry logic"""
    
    def __init__(self):
        """Initialize HTTP client"""
        self.session = None
        self.last_request_time = 0
        self.request_count = 0
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0'
        ]
        
        self.create_session()
    
    def create_session(self):
        """Create HTTP session with proper headers"""
        try:
            # Random user agent
            user_agent = random.choice(self.user_agents)
            
            # Default headers
            headers = {
                'User-Agent': user_agent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            
            # Create session with timeout
            self.session = httpx.Client(
                headers=headers,
                timeout=settings.REQUEST_TIMEOUT,
                follow_redirects=True,
                max_redirects=5
            )
            
            logger.info("✅ HTTP session created successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to create HTTP session: {e}")
            self.session = None
    
    def _rate_limit(self):
        """Implement rate limiting between requests"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        # Calculate delay based on settings
        min_delay = settings.DELAY_BETWEEN_REQUESTS
        
        if time_since_last < min_delay:
            sleep_time = min_delay - time_since_last
            logger.debug(f"Rate limiting: sleeping for {sleep_time:.2f}s")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
        self.request_count += 1
    
    def get_page(self, url: str, retries: int = None) -> Optional[Dict[str, Any]]:
        """Get page content with rate limiting and retries"""
        if retries is None:
            retries = settings.MAX_RETRIES
        
        for attempt in range(retries + 1):
            try:
                # Rate limiting
                self._rate_limit()
                
                # Make request
                logger.info(f"🌐 Fetching: {url} (attempt {attempt + 1})")
                response = self.session.get(url)
                
                # Check response status
                if response.status_code == 200:
                    logger.info(f"✅ Successfully fetched {url}")
                    
                    return {
                        'url': url,
                        'status_code': response.status_code,
                        'content': response.text,
                        'headers': dict(response.headers),
                        'encoding': response.encoding,
                        'timestamp': time.time()
                    }
                
                elif response.status_code == 404:
                    logger.warning(f"⚠️ Page not found: {url}")
                    return None
                
                elif response.status_code in [429, 503]:
                    # Rate limited or service unavailable
                    wait_time = (2 ** attempt) * 5  # Exponential backoff
                    logger.warning(f"⚠️ Rate limited (HTTP {response.status_code}), waiting {wait_time}s")
                    time.sleep(wait_time)
                    continue
                
                else:
                    logger.warning(f"⚠️ HTTP {response.status_code} for {url}")
                    if attempt < retries:
                        time.sleep(settings.RETRY_DELAY)
                        continue
                    return None
                
            except httpx.TimeoutException:
                logger.warning(f"⏰ Timeout for {url} (attempt {attempt + 1})")
                if attempt < retries:
                    time.sleep(settings.RETRY_DELAY)
                    continue
                return None
                
            except httpx.RequestError as e:
                logger.error(f"❌ Request error for {url}: {e}")
                if attempt < retries:
                    time.sleep(settings.RETRY_DELAY)
                    continue
                return None
                
            except Exception as e:
                logger.error(f"❌ Unexpected error for {url}: {e}")
                if attempt < retries:
                    time.sleep(settings.RETRY_DELAY)
                    continue
                return None
        
        logger.error(f"❌ Failed to fetch {url} after {retries + 1} attempts")
        return None
    
    def post_data(self, url: str, data: Dict[str, Any], retries: int = None) -> Optional[Dict[str, Any]]:
        """Post data to URL with rate limiting and retries"""
        if retries is None:
            retries = settings.MAX_RETRIES
        
        for attempt in range(retries + 1):
            try:
                # Rate limiting
                self._rate_limit()
                
                # Make POST request
                logger.info(f"📤 Posting to: {url} (attempt {attempt + 1})")
                response = self.session.post(url, data=data)
                
                if response.status_code == 200:
                    logger.info(f"✅ Successfully posted to {url}")
                    return {
                        'url': url,
                        'status_code': response.status_code,
                        'content': response.text,
                        'headers': dict(response.headers),
                        'timestamp': time.time()
                    }
                else:
                    logger.warning(f"⚠️ HTTP {response.status_code} for POST to {url}")
                    if attempt < retries:
                        time.sleep(settings.RETRY_DELAY)
                        continue
                    return None
                    
            except Exception as e:
                logger.error(f"❌ POST error for {url}: {e}")
                if attempt < retries:
                    time.sleep(settings.RETRY_DELAY)
                    continue
                return None
        
        logger.error(f"❌ Failed to POST to {url} after {retries + 1} attempts")
        return None
    
    def check_robots_txt(self, base_url: str) -> Optional[str]:
        """Check robots.txt file for crawling rules"""
        try:
            # Extract base domain
            if '://' in base_url:
                base_domain = base_url.split('://')[1].split('/')[0]
            else:
                base_domain = base_url.split('/')[0]
            
            robots_url = f"https://{base_domain}/robots.txt"
            
            logger.info(f"🤖 Checking robots.txt: {robots_url}")
            response = self.session.get(robots_url, timeout=10)
            
            if response.status_code == 200:
                return response.text
            else:
                logger.debug(f"Robots.txt not found at {robots_url}")
                return None
                
        except Exception as e:
            logger.debug(f"Could not check robots.txt: {e}")
            return None
    
    def get_session_info(self) -> Dict[str, Any]:
        """Get current session information"""
        return {
            'request_count': self.request_count,
            'last_request_time': self.last_request_time,
            'user_agent': self.session.headers.get('User-Agent') if self.session else None,
            'is_active': self.session is not None
        }
    
    def close(self):
        """Close HTTP session"""
        try:
            if self.session:
                self.session.close()
                logger.info("HTTP session closed")
        except Exception as e:
            logger.error(f"Error closing HTTP session: {e}")

# Global HTTP client instance
http_client = HTTPClient()
