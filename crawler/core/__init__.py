"""
Core crawler components
"""

from .base_crawler import BaseCrawler
from .http_client import HTTPClient, http_client

__all__ = ["BaseCrawler", "HTTPClient", "http_client"]
