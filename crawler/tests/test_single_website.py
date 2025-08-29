"""
Test Single Website Accessibility
Quick test for a single website to check if it can be crawled
"""

import asyncio
import httpx
import sys
import os
from bs4 import BeautifulSoup

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from crawler.config.settings import settings
from crawler.extractors.school_extractor import school_extractor

async def test_website(url: str):
    """Test a single website"""
    print(f"🔍 Testing website: {url}")
    print("=" * 50)
    
    try:
        # Create HTTP client
        async with httpx.AsyncClient(
            timeout=30,
            headers={'User-Agent': settings.USER_AGENT},
            follow_redirects=True
        ) as client:
            
            # Test basic access
            print("1. Testing basic access...")
            start_time = asyncio.get_event_loop().time()
            response = await client.get(url)
            response_time = asyncio.get_event_loop().time() - start_time
            
            print(f"   Status code: {response.status_code}")
            print(f"   Response time: {response_time:.2f}s")
            print(f"   Content length: {len(response.text)} characters")
            
            if response.status_code != 200:
                print(f"   ❌ Website returned status {response.status_code}")
                return
            
            # Check robots.txt
            print("\n2. Checking robots.txt...")
            try:
                robots_url = f"{url.rstrip('/')}/robots.txt"
                robots_response = await client.get(robots_url)
                if robots_response.status_code == 200:
                    print("   ✅ robots.txt found")
                    print(f"   Content preview: {robots_response.text[:200]}...")
                else:
                    print(f"   ⚠️  robots.txt not found (status: {robots_response.status_code})")
            except Exception as e:
                print(f"   ❌ Error accessing robots.txt: {e}")
            
            # Test data extraction
            print("\n3. Testing data extraction...")
            try:
                school_data = school_extractor.extract_school_data(response.text, url)
                
                print("   Extracted data:")
                for field, value in school_data.items():
                    if field not in ['raw_data', 'confidence_score']:
                        print(f"     {field}: {value}")
                
                print(f"   Confidence score: {school_data.get('confidence_score', 'N/A')}")
                
                # Check for program links
                soup = BeautifulSoup(response.text, 'html.parser')
                program_links = []
                for link in soup.find_all('a', href=True):
                    text = link.get_text(strip=True).lower()
                    if any(keyword in text for keyword in ['program', 'course', 'degree', 'study']):
                        program_links.append(link.get_text(strip=True))
                
                if program_links:
                    print(f"   Program-related links found: {len(program_links)}")
                    for link in program_links[:3]:  # Show first 3
                        print(f"     - {link}")
                else:
                    print("   No program-related links found")
                
            except Exception as e:
                print(f"   ❌ Data extraction failed: {e}")
            
            # Check for anti-bot measures
            print("\n4. Checking for anti-bot measures...")
            anti_bot_indicators = []
            content_lower = response.text.lower()
            
            if 'cloudflare' in content_lower:
                anti_bot_indicators.append('Cloudflare protection')
            if 'captcha' in content_lower:
                anti_bot_indicators.append('Captcha detected')
            if 'blocked' in content_lower:
                anti_bot_indicators.append('Access blocked message')
            if 'rate limit' in content_lower:
                anti_bot_indicators.append('Rate limiting')
            
            if anti_bot_indicators:
                print("   ⚠️  Anti-bot measures detected:")
                for indicator in anti_bot_indicators:
                    print(f"     - {indicator}")
            else:
                print("   ✅ No obvious anti-bot measures detected")
            
            # Summary
            print("\n" + "=" * 50)
            print("📊 SUMMARY:")
            print(f"   Website: {url}")
            print(f"   Accessible: ✅ Yes")
            print(f"   Response time: {response_time:.2f}s")
            print(f"   Data extraction: {'✅ Working' if 'confidence_score' in school_data else '❌ Failed'}")
            
            if anti_bot_indicators:
                print(f"   Anti-bot measures: ⚠️  {len(anti_bot_indicators)} detected")
            else:
                print("   Anti-bot measures: ✅ None detected")
            
            print("\n🎯 RECOMMENDATION:")
            if not anti_bot_indicators and school_data.get('confidence_score', 0) > 0.5:
                print("   ✅ This website looks good for crawling!")
                print("   💡 Start with moderate delays (2-3 seconds between requests)")
            elif anti_bot_indicators:
                print("   ⚠️  Website has anti-bot measures")
                print("   💡 Use longer delays and rotate user agents")
            else:
                print("   ❓ Data extraction quality is low")
                print("   💡 Check if selectors need adjustment")
                
    except Exception as e:
        print(f"❌ Error testing website: {e}")
        print("\n🔧 TROUBLESHOOTING:")
        print("   - Check if the URL is correct")
        print("   - Verify internet connection")
        print("   - Some websites may block automated access")

def main():
    """Main function"""
    if len(sys.argv) != 2:
        print("Usage: python test_single_website.py <website_url>")
        print("Example: python test_single_website.py https://mit.edu")
        return
    
    url = sys.argv[1]
    
    # Validate URL
    if not url.startswith(('http://', 'https://')):
        url = f"https://{url}"
    
    print("🔍 Single Website Accessibility Tester")
    print("This tool tests if a specific website can be crawled")
    
    asyncio.run(test_website(url))

if __name__ == "__main__":
    main()
