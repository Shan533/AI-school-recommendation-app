# Web Crawler for AI School Recommendation App

A Python-based web crawler designed to collect university and program data for the AI School Recommendation App.

## 🚀 Quick Start

### 0. Activate Virtual Environment
Before proceeding, ensure your virtual environment is activated:

**Windows (PowerShell):**
```bash
.venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
source .venv/bin/activate
```

To deactivate the virtual environment when you're done:

**All Platforms:**
```bash
deactivate
```

### 1. Environment Setup
Make sure you have the required environment variables in your root `env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Install Dependencies
```bash
pip install -r ../requirements.txt
```

### 3. Test Website Accessibility (Recommended First Step)
Before running the full crawler, check if target websites are accessible:

**Check all target websites:**
```bash
python crawler/scripts/check_website_accessibility.py
```

**Test a single website:**
```bash
python crawler/scripts/test_single_website.py mit.edu
python crawler/scripts/test_single_website.py https://stanford.edu
```

### 4. Run Tests
```bash
# Test Supabase integration and data extractors
python -m unittest crawler/tests/test_supabase_integration.py

# Test university data extraction
python -m unittest crawler/tests/test_university_crawler.py

# Test program data extraction
python -m unittest crawler/tests/test_program_crawler.py
```

### 5. Test Database Connection
Before running the crawler, ensure that the database connection is working:

**Test Supabase Connection:**
```bash
python crawler/test_auth.py
```
This script checks if the application can connect to the Supabase database using the credentials provided in your environment variables.

### 6. Check Website Accessibility
Ensure target websites are accessible before crawling:

**Check all target websites:**
```bash
python crawler/scripts/check_website_accessibility.py
```
This script verifies if the target websites can be accessed, checks response times, and identifies any crawling restrictions.

### 7. Run the Crawler for New Data
Use the `crawl_universities.py` script to fetch new data:

#### a) Direct QS JSON (Recommended)
The most stable and efficient method. First, locate the .txt requests (main data + indicators) in DevTools → Network:

- .../sites/default/files/qs-rankings-data/en/<hash>.txt?...
- .../sites/default/files/qs-rankings-data/en/<hash>_indicators.txt?... (optional)

Then run:
```bash
python -m crawler.scripts.crawl_universities --limit 200 --qs-main-url "https://www.qschina.cn/sites/default/files/qs-rankings-data/en/<hash>.txt?_t=..." --qs-indicators-url "https://www.qschina.cn/sites/default/files/qs-rankings-data/en/<hash>_indicators.txt?_t=..."
```
Or without indicators:
```bash
python -m crawler.scripts.crawl_universities --limit 200 --qs-main-url "https://www.qschina.cn/sites/default/files/qs-rankings-data/en/<hash>.txt?_t=..."
```

#### b) Auto Discovery (Optional)
If you don't manually find the .txt, let the crawler detect them from the page and external JS:
```bash
python -m crawler.scripts.crawl_universities --limit 50 --url "https://www.qschina.cn/en/university-rankings/world-university-rankings/2026"
```
Auto discovery is sensitive to frontend packaging and less stable than direct mode. Prefer method A).

### 9. Run QS Top-N Crawler
Use the `crawl_qs_topN.py` script to ensure the top N QS rankings are fetched and stored:

**Usage:**
```bash
python crawler/scripts/crawl_qs_topN.py --qs-main-url "your_qs_main_url" --top-n 100
```
This script checks the database for the top N QS rankings and fetches missing data if necessary.

### 10. Run Tests
```bash
# Test Supabase integration and data extractors
python -m unittest crawler/tests/test_supabase_integration.py

# Test university data extraction
python -m unittest crawler/tests/test_university_crawler.py

# Test program data extraction
python -m unittest crawler/tests/test_program_crawler.py
```


## 🏗️ Architecture

### Core Components
- **`crawler/config/settings.py`**: Manages configuration and settings for the crawler, including rate limiting and target URLs.
- **`crawler/core/`**: Contains the core logic for the crawler, including the base crawler class and HTTP client for making requests.
  - `base_crawler.py`: Provides the main crawling logic and lifecycle management.
  - `http_client.py`: Handles HTTP requests and responses, including error handling and retries.
- **`crawler/storage/supabase_manager.py`**: Manages database operations, including inserting and updating records in Supabase.
- **`crawler/scripts/`**: Contains the main scripts for executing different crawling tasks.
  - `crawl_universities.py`: Crawls university data using either direct JSON endpoints or auto-discovery.
  - `crawl_qs_topN.py`: Ensures the top N QS rankings are fetched and stored.
  - `check_website_accessibility.py`: Checks if target websites are accessible and logs any issues.

### Data Flow
1. **Configuration** → Load settings and target URLs from configuration files.
2. **HTTP Requests** → Fetch web pages with rate limiting to avoid overwhelming servers.
3. **Data Storage** → Store extracted data in Supabase unreviewed tables for further processing.
5. **Logging** → Track progress, errors, and performance metrics to logs for analysis.

## 📝 Logging

All crawler activities are logged to:
- Console output with emojis for easy reading
- `logs/crawler.log` for detailed logging
- `logs/website_check_*.json` for accessibility check results

## 🚨 Troubleshooting

### Common Issues

**1. Supabase Connection Failed**
- Check `env.local` has correct credentials
- Verify Supabase project is active
- Check network connectivity

**2. Website Blocked**
- Increase delay between requests
- Check robots.txt restrictions
- Some sites may block automated access

**3. Data Extraction Poor**
- Review CSS selectors in settings
- Check if website structure changed
- Verify HTML content is accessible

### Getting Help
1. Run the website accessibility checker first
2. Check the logs for detailed error messages
3. Test with a single website before full crawling
4. Verify environment variables are set correctly