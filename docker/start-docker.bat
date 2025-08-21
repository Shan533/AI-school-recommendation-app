@echo off
echo ========================================
echo    AI School Recommendation App
echo    One-Click Docker Environment
echo ========================================
echo.

REM Check if Docker is running
echo 🔍 Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running, please start Docker Desktop first
    pause
    exit /b 1
)
echo ✅ Docker is running

REM Stop and remove existing containers
echo.
echo 🧹 Cleaning up existing containers...
docker-compose -f docker/docker-compose.yml down --remove-orphans 2>nul
echo ✅ Cleanup completed

REM Start base services (Web + Redis)
echo.
echo 🚀 Starting base services (Web + Redis)...
docker-compose -f docker/docker-compose.yml up -d web redis
if %errorlevel% neq 0 (
    echo ❌ Failed to start base services
    pause
    exit /b 1
)
echo ✅ Base services started successfully

REM Wait for services to be ready
echo.
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service status
echo.
echo 🔍 Checking service status...
docker-compose -f docker/docker-compose.yml ps

echo.
echo ========================================
echo 🎉 Environment startup completed!
echo.
echo 📱 Web Application: http://localhost:3000
echo 🔴 Redis: localhost:6379
echo.
echo 💡 Optional services:
echo    Start crawler: docker-compose -f docker/docker-compose.yml --profile crawler up -d crawler
echo    Start monitoring: docker-compose -f docker/docker-compose.yml --profile monitoring up -d redis-commander
echo.
echo 🛑 Stop services: docker-compose -f docker/docker-compose.yml down
echo ========================================
echo.

REM Ask if user wants to start crawler
set /p start_crawler="Do you want to start the crawler service? (y/n): "
if /i "%start_crawler%"=="y" (
    echo.
    echo 🕷️ Starting crawler service...
    docker-compose -f docker/docker-compose.yml --profile crawler up -d crawler
    if %errorlevel% equ 0 (
        echo ✅ Crawler service started successfully
        echo 📊 Crawler status: docker-compose -f docker/docker-compose.yml ps crawler
    ) else (
        echo ❌ Failed to start crawler service
    )
)

echo.
pause
