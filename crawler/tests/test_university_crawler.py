"""
Test cases for university crawler
Tests the crawler's ability to extract university information
"""

import unittest
import os
import sys
from unittest.mock import Mock, patch
import json

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from crawler.extractors.school_extractor import school_extractor
from crawler.config.settings import settings

class TestUniversityCrawler(unittest.TestCase):
    """Test cases for university data extraction"""
    
    def setUp(self):
        """Set up test environment"""
        self.test_html = """
        <html>
            <head><title>Test University</title></head>
            <body>
                <h1 class="university-name">Test University</title>
                <div class="location">Cambridge, MA</div>
                <div class="founded">Established in 1861</div>
                <div class="website">
                    <a href="https://test.edu">Visit Website</a>
                </div>
                <div class="programs">
                    <h2>Available Programs</h2>
                    <ul>
                        <li>Computer Science</li>
                        <li>Data Science</li>
                    </ul>
                </div>
            </body>
        </html>
        """
        
    def test_extract_university_name(self):
        """Test university name extraction"""
        school_data = school_extractor.extract_school_data(self.test_html, "https://test.edu")
        self.assertIsNotNone(school_data.get('name'))
        self.assertIn('Test University', school_data['name'])
                
    def test_extract_location(self):
        """Test location extraction"""
        school_data = school_extractor.extract_school_data(self.test_html, "https://test.edu")
        self.assertIsNotNone(school_data.get('location'))
        self.assertIn('Cambridge', school_data['location'])
                
    def test_extract_founding_year(self):
        """Test founding year extraction"""
        school_data = school_extractor.extract_school_data(self.test_html, "https://test.edu")
        self.assertIsNotNone(school_data.get('founding_year'))
        self.assertIn("1861", school_data['founding_year'])
                
    def test_extract_website(self):
        """Test website URL extraction"""
        school_data = school_extractor.extract_school_data(self.test_html, "https://test.edu")
        self.assertIsNotNone(school_data.get('website'))
        self.assertIn("test.edu", school_data['website'])
                
    def test_extract_description(self):
        """Test description extraction"""
        school_data = school_extractor.extract_school_data(self.test_html, "https://test.edu")
        self.assertIsNotNone(school_data.get('description'))
        self.assertIn("Computer Science", school_data['description'])
        
    def test_validate_university_data(self):
        """Test university data validation"""
        school_data = school_extractor.extract_school_data(self.test_html, "https://test.edu")
        
        # Check required fields
        required_fields = ["name", "website"]
        for field in required_fields:
            self.assertIn(field, school_data)
            
        # Validate confidence score
        self.assertIsNotNone(school_data.get('confidence_score'))
        self.assertGreater(school_data['confidence_score'], 0.0)

if __name__ == '__main__':
    unittest.main()
