@echo off
setlocal enabledelayedexpansion

echo 🚀 Setting up AI School Recommendation App...

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    (
        echo # Supabase Configuration
        echo NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
        echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
        echo SUPABASE_KEY=your_supabase_service_role_key
        echo.
        echo # Crawler Configuration
        echo CRAWLER_USER_AGENT=AcademicCrawler/1.0
        echo CRAWLER_TIMEOUT=30
        echo CRAWLER_MAX_RETRIES=3
        echo CRAWLER_DELAY=2.0
        echo CRAWLER_MAX_CONCURRENT=3
    ) > .env
    echo ✅ Created .env file
) else (
    echo ℹ️ .env file already exists
)

REM Create logs directory
if not exist logs (
    echo 📁 Creating logs directory...
    mkdir logs
    echo ✅ Created logs directory
) else (
    echo ℹ️ logs directory already exists
)

echo.
echo 🎉 Setup completed!
echo.
echo 📝 Next steps:
echo    1. Edit .env file with your Supabase credentials
echo    2. Run npm install to install dependencies
echo    3. Run npm run dev to start the development server
echo.
echo 🌐 Available services:
echo    📱 Web App: http://localhost:3000
echo.
pause