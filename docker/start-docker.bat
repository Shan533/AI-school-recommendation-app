@echo off
setlocal enabledelayedexpansion

REM ================== configurable variables ==================
set "COMPOSE=docker compose"  REM new syntax; if you can only use old version, change to docker-compose
set "COMPOSE_FILE=docker\docker-compose.yml"
set "WEB_SERVICE=web"
set "CRAWLER_SERVICE=crawler"
set "APP_URL=http://localhost:3000"
REM ===============================================

echo ========================================
echo    AI School Recommendation App
echo    One-Click Docker Environment
echo ========================================
echo.

REM -------- parse arguments --------
set "FLAG_BUILD="
set "FLAG_FRESH="
set "FLAG_CRAWLER="
set "FLAG_LOGS="

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="--build"   set "FLAG_BUILD=1"
if /i "%~1"=="--fresh"   set "FLAG_FRESH=1"
if /i "%~1"=="--crawler" set "FLAG_CRAWLER=1"
if /i "%~1"=="--logs"    set "FLAG_LOGS=1"
shift
goto parse_args
:args_done

REM -------- check Docker --------
echo  Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
  echo Docker is not running. Please start Docker Desktop first.
  pause
  exit /b 1
)
echo Docker is running

REM -------- cleanup strategy --------
if defined FLAG_FRESH (
  echo.
  echo Fresh cleanup: containers + volumes...
  %COMPOSE% -f "%COMPOSE_FILE%" down -v --remove-orphans 2>nul
) else (
  echo.
  echo Cleaning up existing containers...
  %COMPOSE% -f "%COMPOSE_FILE%" down --remove-orphans 2>nul
)
echo Cleanup completed

REM -------- start (optional rebuild)--------
echo.
if defined FLAG_BUILD (
  echo  Building images...
  %COMPOSE% -f "%COMPOSE_FILE%" build --pull
  if %errorlevel% neq 0 (
    echo Build failed.
    pause
    exit /b 1
  )
)

echo Starting web service...
if defined FLAG_BUILD (
  REM if already built, directly up
  %COMPOSE% -f "%COMPOSE_FILE%" up -d "%WEB_SERVICE%"
) else (
  REM default use --build, Docker will rebuild incrementally when dependencies change
  %COMPOSE% -f "%COMPOSE_FILE%" up -d --build "%WEB_SERVICE%"
)
if %errorlevel% neq 0 (
  echo Failed to start web service.
  pause
  exit /b 1
)
echo Web service started

REM -------- wait for health (if healthcheck defined)--------
echo.
echo Waiting for service to be healthy (if healthcheck defined)...
for /l %%i in (1,1,30) do (
  for /f "usebackq tokens=*" %%s in (`%COMPOSE% -f "%COMPOSE_FILE%" ps --status=running -q "%WEB_SERVICE%"`) do set "CID=%%s"
  if not defined CID (
    REM not started, wait for 1 second
    timeout /t 1 >nul
  ) else (
    for /f "usebackq tokens=*" %%H in (`docker inspect -f "{{.State.Health.Status}}" !CID! 2^>nul`) do set "HEALTH=%%H"
    if /i "!HEALTH!"=="healthy" (
      echo Service healthy.
      goto healthy_done
    )
    REM no healthcheck or still starting
    timeout /t 1 >nul
  )
)
:healthy_done

REM -------- optional start crawler --------
if defined FLAG_CRAWLER (
  echo.
  echo  Starting crawler service...
  %COMPOSE% -f "%COMPOSE_FILE%" --profile crawler up -d "%CRAWLER_SERVICE%"
  if %errorlevel% neq 0 (
    echo Failed to start crawler service.
  ) else (
    echo Crawler service started.
  )
)

REM -------- print service status --------
echo.
echo  Service status:
%COMPOSE% -f "%COMPOSE_FILE%" ps

echo.
echo ========================================
echo  Environment startup completed!
echo  Web Application: %APP_URL%
echo ----------------------------------------
echo Tips:
echo   - With new deps/Dockerfile changes:   start-docker.bat --build
echo   - Full reset (incl. volumes):         start-docker.bat --fresh
echo   - Start crawler together:             start-docker.bat --crawler
echo   - Tail logs after up:                 start-docker.bat --logs
echo   - Stop all:                           %COMPOSE% -f "%COMPOSE_FILE%" down
echo ========================================
echo.

if defined FLAG_LOGS (
  echo  Tailing logs (Ctrl+C to stop)...
  %COMPOSE% -f "%COMPOSE_FILE%" logs -f
) else (
  pause
)

endlocal