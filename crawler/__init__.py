"""
AI School Recommendation App - Web Crawler Package
Main package initialization and exports
"""

from crawler.core.base_crawler import BaseCrawler
from crawler.core.http_client import HTTPClient, http_client

__version__ = "0.1.0"
__author__ = "AI School Recommendation App Team"

# Export main classes and instances
__all__ = [
    "BaseCrawler",      # Base crawler class
    "HTTPClient",       # HTTP client class
    "http_client",      # Global HTTP client instance
]
