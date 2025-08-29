"""
Website Accessibility Checker
Checks if target websites can be crawled and what data is available
"""

import asyncio
import httpx
import time
import os
import sys
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from crawler.config.settings import settings
from crawler.extractors.school_extractor import school_extractor
from crawler.extractors.program_extractor import program_extractor

class WebsiteChecker:
    """Check website accessibility and data availability"""
    
    def __init__(self):
        self.client = None
        self.results = {}
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.client = httpx.AsyncClient(
            timeout=settings.REQUEST_TIMEOUT,
            headers={'User-Agent': settings.USER_AGENT},
            follow_redirects=True
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.client:
            await self.client.aclose()
    
    async def check_website(self, domain: str) -> dict:
        """Check a single website for accessibility"""
        print(f"\n🔍 Checking {domain}...")
        
        result = {
            'domain': domain,
            'accessible': False,
            'status_code': None,
            'response_time': None,
            'robots_txt': None,
            'data_quality': {},
            'sample_data': {},
            'errors': []
        }
        
        try:
            # Try different URL formats
            urls_to_try = [
                f"https://{domain}",
                f"http://{domain}",
                f"https://www.{domain}",
                f"http://www.{domain}"
            ]
            
            working_url = None
            for url in urls_to_try:
                try:
                    start_time = time.time()
                    response = await self.client.get(url)
                    response_time = time.time() - start_time
                    
                    if response.status_code == 200:
                        working_url = url
                        result['accessible'] = True
                        result['status_code'] = response.status_code
                        result['response_time'] = response_time
                        break
                        
                except Exception as e:
                    result['errors'].append(f"Failed to access {url}: {str(e)}")
                    continue
            
            if not working_url:
                result['errors'].append("No working URL found")
                return result
            
            # Check robots.txt
            try:
                robots_url = urljoin(working_url, '/robots.txt')
                robots_response = await self.client.get(robots_url)
                if robots_response.status_code == 200:
                    result['robots_txt'] = robots_response.text[:500] + "..." if len(robots_response.text) > 500 else robots_response.text
                else:
                    result['robots_txt'] = "Not found or not accessible"
            except Exception as e:
                result['robots_txt'] = f"Error accessing: {str(e)}"
            
            # Analyze page content
            await self._analyze_content(working_url, result)
            
            print(f"✅ {domain} is accessible")
            print(f"   Response time: {result['response_time']:.2f}s")
            print(f"   Data quality score: {result['data_quality'].get('overall_score', 'N/A')}")
            
        except Exception as e:
            result['errors'].append(f"Unexpected error: {str(e)}")
            print(f"❌ {domain} check failed: {str(e)}")
        
        return result
    
    async def _analyze_content(self, url: str, result: dict):
        """Analyze the content of a webpage"""
        try:
            response = await self.client.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Check for school data
            school_data = school_extractor.extract_school_data(response.text, url)
            result['sample_data']['school'] = school_data
            
            # Calculate data quality score
            quality_score = 0
            total_fields = 0
            
            for field, value in school_data.items():
                if field != 'confidence_score' and field != 'raw_data':
                    total_fields += 1
                    if value and value != 'Unknown':
                        quality_score += 1
            
            if total_fields > 0:
                result['data_quality']['overall_score'] = f"{quality_score}/{total_fields}"
                result['data_quality']['percentage'] = f"{(quality_score/total_fields)*100:.1f}%"
            
            # Look for program links
            program_links = []
            for link in soup.find_all('a', href=True):
                href = link.get('href')
                text = link.get_text(strip=True).lower()
                
                # Check if link might lead to programs
                if any(keyword in text for keyword in ['program', 'course', 'degree', 'study']):
                    full_url = urljoin(url, href)
                    program_links.append({
                        'text': link.get_text(strip=True),
                        'url': full_url
                    })
            
            result['sample_data']['program_links'] = program_links[:5]  # Limit to 5
            
            # Check for common anti-bot measures
            anti_bot_indicators = []
            if 'cloudflare' in response.text.lower():
                anti_bot_indicators.append('Cloudflare protection detected')
            if 'captcha' in response.text.lower():
                anti_bot_indicators.append('Captcha detected')
            if 'blocked' in response.text.lower():
                anti_bot_indicators.append('Access blocked message')
            
            result['data_quality']['anti_bot_measures'] = anti_bot_indicators
            
        except Exception as e:
            result['errors'].append(f"Content analysis failed: {str(e)}")
    
    async def check_all_websites(self) -> dict:
        """Check all target websites"""
        print("🌐 Starting website accessibility check...")
        print(f"Target websites: {len(settings.PRIORITY_UNIVERSITIES)}")
        
        results = {}
        
        for domain in settings.PRIORITY_UNIVERSITIES:
            result = await self.check_website(domain)
            results[domain] = result
            
            # Be respectful with delays
            await asyncio.sleep(1)
        
        return results
    
    def generate_report(self, results: dict) -> str:
        """Generate a human-readable report"""
        report = []
        report.append("=" * 60)
        report.append("🌐 WEBSITE ACCESSIBILITY REPORT")
        report.append("=" * 60)
        
        accessible_count = sum(1 for r in results.values() if r['accessible'])
        total_count = len(results)
        
        report.append(f"\n📊 SUMMARY:")
        report.append(f"   Total websites checked: {total_count}")
        report.append(f"   Accessible: {accessible_count}")
        report.append(f"   Not accessible: {total_count - accessible_count}")
        report.append(f"   Success rate: {(accessible_count/total_count)*100:.1f}%")
        
        report.append(f"\n✅ ACCESSIBLE WEBSITES:")
        for domain, result in results.items():
            if result['accessible']:
                report.append(f"   {domain}")
                report.append(f"     Response time: {result['response_time']:.2f}s")
                report.append(f"     Data quality: {result['data_quality'].get('overall_score', 'N/A')}")
                
                if result['sample_data'].get('program_links'):
                    report.append(f"     Program links found: {len(result['sample_data']['program_links'])}")
                
                if result['data_quality'].get('anti_bot_measures'):
                    report.append(f"     ⚠️  Anti-bot measures: {', '.join(result['data_quality']['anti_bot_measures'])}")
        
        report.append(f"\n❌ INACCESSIBLE WEBSITES:")
        for domain, result in results.items():
            if not result['accessible']:
                report.append(f"   {domain}")
                for error in result['errors']:
                    report.append(f"     Error: {error}")
        
        report.append(f"\n🔧 RECOMMENDATIONS:")
        if accessible_count > 0:
            report.append("   ✅ Start with accessible websites for initial testing")
            report.append("   ⚠️  Check robots.txt and respect rate limits")
            report.append("   📝 Test data extraction on accessible sites first")
        else:
            report.append("   ❌ No websites are currently accessible")
            report.append("   🔍 Check network connectivity and firewall settings")
            report.append("   🌍 Some sites may be geo-blocked")
        
        return "\n".join(report)

async def main():
    """Main function"""
    print("🔍 Website Accessibility Checker")
    print("This tool checks if target websites can be crawled")
    
    async with WebsiteChecker() as checker:
        # Check all websites
        results = await checker.check_all_websites()
        
        # Generate and display report
        report = checker.generate_report(results)
        print("\n" + report)
        
        # Save detailed results to file
        import json
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        filename = f"logs/website_check_{timestamp}.json"
        
        # Ensure logs directory exists
        import os
        os.makedirs("logs", exist_ok=True)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"\n📁 Detailed results saved to: {filename}")

if __name__ == "__main__":
    asyncio.run(main())
