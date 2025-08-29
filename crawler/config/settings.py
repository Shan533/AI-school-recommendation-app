"""
Crawler Configuration Settings
Contains all configuration parameters for the web crawler
"""

import os
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class CrawlerSettings:
    """Main crawler configuration class"""
    
    # Basic Settings
    USER_AGENT = os.getenv('CRAWLER_USER_AGENT', 'AcademicCrawler/1.0 (Educational Research)')
    # REQUEST_TIMEOUT = int(os.getenv('CRAWLER_TIMEOUT', 30))
    MAX_RETRIES = int(os.getenv('CRAWLER_MAX_RETRIES', 3))
    
    # Rate Limiting
    # DELAY_BETWEEN_REQUESTS = float(os.getenv('CRAWLER_DELAY', 2.0))
    # MAX_CONCURRENT_REQUESTS = int(os.getenv('CRAWLER_MAX_CONCURRENT', 3))


    DELAY_BETWEEN_REQUESTS = 5.0      # 5秒延迟
    MAX_CONCURRENT_REQUESTS = 1        # 单线程
    REQUEST_TIMEOUT = 60               # 60秒超时

    # Supabase Configuration
    SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    # Target Universities (Priority List)
    PRIORITY_UNIVERSITIES = [
        # US Universities
        "mit.edu",
        "stanford.edu", 
        "berkeley.edu",
        "harvard.edu",
        "cmu.edu",
        
        # UK Universities
        "ox.ac.uk",
        "cam.ac.uk",
        "imperial.ac.uk",
        "ucl.ac.uk",
        
        # European Universities
        "ethz.ch",
        "tum.de",
        "tudelft.nl",
        
        # Asian Universities
        "nus.edu.sg",
        "tsinghua.edu.cn",
        "u-tokyo.ac.jp",
        "kaist.ac.kr"
    ]
    
    # Target Programs
    TARGET_PROGRAMS = [
        "Computer Science",
        "Data Science", 
        "Artificial Intelligence",
        "Machine Learning",
        "Engineering",
        "MBA",
        "Finance",
        "Management"
    ]
    
    # Data Extraction Rules
    UNIVERSITY_SELECTORS = {
        'name': [
            'h1.university-name',
            '.institution-title',
            'h1',
            '.university-title'
        ],
        'location': [
            '.location',
            '.address',
            '.city',
            '.country'
        ],
        'founding_year': [
            '.founded',
            '.established',
            '.year-founded',
            '.year'
        ],
        'website': [
            'a[href*="edu"]',
            'a[href*="ac.uk"]',
            'a[href*="university"]'
        ]
    }
    
    PROGRAM_SELECTORS = {
        'name': [
            '.program-title',
            '.degree-name',
            'h1.program-name',
            'h1',
            'h2'
        ],
        'degree': [
            '.degree-type',
            '.program-level',
            '.academic-level'
        ],
        'duration': [
            '.duration',
            '.length',
            '.time-to-complete',
            '.months'
        ],
        'tuition': [
            '.tuition',
            '.fees',
            '.cost',
            '.price'
        ],
        'description': [
            '.program-description',
            '.overview',
            '.summary'
        ]
    }
    
    # Output Settings
    LOG_LEVEL = 'INFO'
    LOG_FILE = 'logs/crawler.log'
    
    # Error Handling
    MAX_FAILED_ATTEMPTS = 3
    RETRY_DELAY = 5.0
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate configuration settings"""
        try:
            # Check required settings
            assert cls.SUPABASE_URL, "Supabase URL is required"
            assert cls.SUPABASE_KEY, "Supabase key is required"
            assert cls.DELAY_BETWEEN_REQUESTS > 0, "Delay must be positive"
            assert cls.MAX_CONCURRENT_REQUESTS > 0, "Max concurrent must be positive"
            
            return True
        except AssertionError as e:
            print(f"❌ Configuration validation failed: {e}")
            return False

# Global settings instance
settings = CrawlerSettings()