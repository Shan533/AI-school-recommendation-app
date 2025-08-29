"""
Test cases for Supabase integration and data extractors
Tests the crawler's ability to store data in Supabase and extract information
"""

import unittest
import asyncio
import os
import sys
from unittest.mock import Mock, patch, AsyncMock
from dotenv import load_dotenv

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

# Load environment variables from the root directory
load_dotenv('../../env.local')

class TestSupabaseIntegration(unittest.TestCase):
    """Test cases for Supabase data storage and management"""
    
    def setUp(self):
        """Set up test environment"""
        # Check if environment variables are set
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            self.skipTest("Supabase credentials not configured")
    
    def test_environment_variables(self):
        """Test that required environment variables are set"""
        self.assertIsNotNone(self.supabase_url, "NEXT_PUBLIC_SUPABASE_URL should be set")
        self.assertIsNotNone(self.supabase_key, "NEXT_PUBLIC_SUPABASE_ANON_KEY should be set")
        self.assertTrue(self.supabase_url.startswith('https://'), "Supabase URL should be HTTPS")
    
    @patch('crawler.storage.supabase_manager.httpx.AsyncClient')
    async def test_create_crawler_job(self, mock_client):
        """Test creating a crawler job in Supabase"""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 201
        mock_response.json.return_value = [{'id': 'test-job-id'}]
        
        mock_client_instance = Mock()
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client_instance.__aexit__.return_value = None
        mock_client_instance.post.return_value = mock_response
        mock_client.return_value = mock_client_instance
        
        from crawler.storage.supabase_manager import supabase_manager
        
        # Test creating a job
        job_id = await supabase_manager.create_crawler_job("test_job", {"test": True})
        
        self.assertIsNotNone(job_id)
        self.assertEqual(job_id, 'test-job-id')
    
    @patch('crawler.storage.supabase_manager.httpx.AsyncClient')
    async def test_store_unreviewed_school(self, mock_client):
        """Test storing school data in unreviewed_schools table"""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 201
        mock_response.json.return_value = [{'id': 'test-school-id'}]
        
        mock_client_instance = Mock()
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client_instance.__aexit__.return_value = None
        mock_client_instance.post.return_value = mock_response
        mock_client.return_value = mock_client_instance
        
        from crawler.storage.supabase_manager import supabase_manager
        
        # Test school data
        school_data = {
            'name': 'Test University',
            'location': 'Test City, Test Country',
            'website': 'https://test.edu',
            'description': 'A test university'
        }
        
        # Store school data
        school_id = await supabase_manager.store_unreviewed_school(school_data)
        
        self.assertIsNotNone(school_id)
        self.assertEqual(school_id, 'test-school-id')
    
    @patch('crawler.storage.supabase_manager.httpx.AsyncClient')
    async def test_store_unreviewed_program(self, mock_client):
        """Test storing program data in unreviewed_programs table"""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 201
        mock_response.json.return_value = [{'id': 'test-program-id'}]
        
        mock_client_instance = Mock()
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client_instance.__aexit__.return_value = None
        mock_client_instance.post.return_value = mock_response
        mock_client.return_value = mock_client_instance
        
        from crawler.storage.supabase_manager import supabase_manager
        
        # Test program data
        program_data = {
            'name': 'Test Program',
            'school_name': 'Test University',
            'degree': 'Master of Science',
            'description': 'A test program'
        }
        
        # Store program data
        program_id = await supabase_manager.store_unreviewed_program(program_data)
        
        self.assertIsNotNone(program_id)
        self.assertEqual(program_id, 'test-program-id')

class TestDataExtractors(unittest.TestCase):
    """Test cases for data extraction functionality"""
    
    def setUp(self):
        """Set up test environment"""
        self.test_school_html = """
        <html>
        <head>
            <title>MIT - Massachusetts Institute of Technology</title>
            <meta name="description" content="MIT is a world-renowned university focused on science and technology education.">
        </head>
        <body>
            <h1>Massachusetts Institute of Technology</h1>
            <div class="location">Cambridge, Massachusetts, United States</div>
            <div class="founded">Established in 1861</div>
            <p>MIT is a private research university in Cambridge, Massachusetts.</p>
        </body>
        </html>
        """
        
        self.test_program_html = """
        <html>
        <head>
            <title>Computer Science Program - MIT</title>
        </head>
        <body>
            <h1>Master of Science in Computer Science</h1>
            <div class="duration">2 years</div>
            <div class="credits">120 credits</div>
            <p>Advanced computer science program focusing on AI and machine learning.</p>
        </body>
        </html>
        """
    
    def test_school_extractor(self):
        """Test school data extraction"""
        from crawler.extractors.school_extractor import school_extractor
        
        # Extract school data
        school_data = school_extractor.extract_school_data(self.test_school_html, "https://mit.edu")
        
        # Verify extraction
        self.assertIsNotNone(school_data.get('name'))
        self.assertIn('MIT', school_data['name'])
        self.assertIsNotNone(school_data.get('location'))
        self.assertIn('Cambridge', school_data['location'])
        self.assertIsNotNone(school_data.get('founding_year'))
        self.assertIn('1861', school_data['founding_year'])
        self.assertIsNotNone(school_data.get('description'))
        self.assertIn('technology', school_data['description'])
        self.assertIsNotNone(school_data.get('confidence_score'))
        self.assertGreater(school_data['confidence_score'], 0.0)
    
    def test_program_extractor(self):
        """Test program data extraction"""
        from crawler.extractors.program_extractor import program_extractor
        
        # Extract program data
        program_data = program_extractor.extract_program_data(
            self.test_program_html, 
            "https://mit.edu/cs", 
            "MIT"
        )
        
        # Verify extraction
        self.assertIsNotNone(program_data.get('name'))
        self.assertIn('Computer Science', program_data['name'])
        self.assertIsNotNone(program_data.get('school_name'))
        self.assertEqual(program_data['school_name'], 'MIT')
        self.assertIsNotNone(program_data.get('description'))
        self.assertIn('AI and machine learning', program_data['description'])
        self.assertIsNotNone(program_data.get('confidence_score'))
        self.assertGreater(program_data['confidence_score'], 0.0)
    
    def test_confidence_scoring(self):
        """Test confidence score calculation"""
        from crawler.extractors.school_extractor import school_extractor
        
        # Test with complete data
        complete_html = """
        <html>
        <head><title>Complete University</title></head>
        <body>
            <h1>Complete University</h1>
            <div class="location">Complete City, Complete Country</div>
            <div class="founded">Established in 1900</div>
            <p>Complete description of the university.</p>
        </body>
        </html>
        """
        
        complete_data = school_extractor.extract_school_data(complete_html, "https://complete.edu")
        self.assertGreater(complete_data['confidence_score'], 0.8)
        
        # Test with minimal data
        minimal_html = """
        <html>
        <head><title>Minimal University</title></head>
        <body>
            <h1>Minimal University</h1>
        </body>
        </html>
        """
        
        minimal_data = school_extractor.extract_school_data(minimal_html, "https://minimal.edu")
        self.assertLess(minimal_data['confidence_score'], 0.5)

def run_async_test(test_func):
    """Helper function to run async tests"""
    def wrapper(*args, **kwargs):
        return asyncio.run(test_func(*args, **kwargs))
    return wrapper

# Convert async test methods to sync for unittest
TestSupabaseIntegration.test_create_crawler_job = run_async_test(TestSupabaseIntegration.test_create_crawler_job)
TestSupabaseIntegration.test_store_unreviewed_school = run_async_test(TestSupabaseIntegration.test_store_unreviewed_school)
TestSupabaseIntegration.test_store_unreviewed_program = run_async_test(TestSupabaseIntegration.test_store_unreviewed_program)

if __name__ == '__main__':
    unittest.main()
