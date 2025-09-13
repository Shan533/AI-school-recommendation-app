@echo off
setlocal enabledelayedexpansion

REM ======================
REM Paths & constants
REM ======================
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%"
set "REPO_ROOT=%CD%"
set "COMPOSE_FILE=%REPO_ROOT%\docker\docker-compose.yml"

echo Setting up AI School Recommendation App...
echo.
echo Usage:
echo   setup.bat              -> up (build if needed)
echo   setup.bat rebuild      -> down -v + build --no-cache + up -d
echo   setup.bat down         -> down -v
echo.

REM ======================
REM Basic checks
REM ======================
where docker >nul 2>nul
if errorlevel 1 (
  echo Docker is not installed or not in PATH.
  echo    Please install Docker Desktop and try again.
  exit /b 1
)

docker compose version >nul 2>nul
if errorlevel 1 (
  echo Docker Compose is not available. Please update Docker Desktop.
  exit /b 1
)

if not exist "%COMPOSE_FILE%" (
  echo Compose file not found: %COMPOSE_FILE%
  echo    Make sure the file exists at docker\docker-compose.yml
  exit /b 1
)

if not exist "%REPO_ROOT%\package.json" (
  echo package.json not found at repo root: %REPO_ROOT%
  echo    Make sure you are running this script from the repository root.
  exit /b 1
)

REM ======================
REM Create .env (for docker compose) if missing
REM ======================
if not exist "%REPO_ROOT%\.env" (
  echo Creating .env (for Docker Compose)...
  > "%REPO_ROOT%\.env" (
    echo # Supabase (Docker Compose will read this file)
    echo NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    echo SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
    echo ADMIN_EMAILS=you@example.com
    echo.
    echo # Crawler
    echo CRAWLER_USER_AGENT=AcademicCrawler/1.0
    echo CRAWLER_TIMEOUT=30
    echo CRAWLER_MAX_RETRIES=3
    echo CRAWLER_DELAY=2.0
    echo CRAWLER_MAX_CONCURRENT=3
  )
  echo .env created.
) else (
  echo .env already exists.
)

REM ======================
REM Create .env.local (for Next.js dev) if missing
REM ======================
if not exist "%REPO_ROOT%\.env.local" (
  echo Creating .env.local (for Next.js dev)...
  > "%REPO_ROOT%\.env.local" (
    echo NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    echo SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
    echo ADMIN_EMAILS=you@example.com
  )
  echo .env.local created.
) else (
  echo   .env.local already exists.
)

REM ======================
REM Create logs directory
REM ======================
if not exist "%REPO_ROOT%\logs" (
  echo Creating logs directory...
  mkdir "%REPO_ROOT%\logs" >nul 2>nul
  echo logs created.
) else (
  echo  logs directory already exists.
)

REM ======================
REM Dependency sanity check (Radix Dropdown)
REM ======================
for /f "delims=" %%L in ('findstr /rc:"\"@radix-ui/react-dropdown-menu\"" "%REPO_ROOT%\package.json"') do set "RADIX_LINE=%%L"
if not defined RADIX_LINE (
  echo  "@radix-ui/react-dropdown-menu" not found in package.json.
  echo     If you use the DropdownMenu component, run:
  echo     npm i @radix-ui/react-dropdown-menu
) else (
  echo Found @radix-ui/react-dropdown-menu in package.json.
)

echo.

REM ======================
REM Modes:
REM   setup.bat           -> up (build if needed)
REM   setup.bat rebuild   -> down -v + build --no-cache + up -d
REM   setup.bat down      -> down -v
REM ======================
set "MODE=%~1"
if /i "%MODE%"=="down" (
  echo docker compose down -v
  docker compose -f "%COMPOSE_FILE%" down -v
  goto :DONE
)

if /i "%MODE%"=="rebuild" (
  echo Rebuilding from scratch (down -v + build --no-cache)...
  docker compose -f "%COMPOSE_FILE%" down -v
  if errorlevel 1 (
    echo (Ignoring down errors...)
  )
  echo  Building without cache...
  docker compose -f "%COMPOSE_FILE%" build --no-cache
  if errorlevel 1 (
    echo Build failed.
    exit /b 1
  )
  echo Starting containers...
  docker compose -f "%COMPOSE_FILE%" up -d
  if errorlevel 1 (
    echo Failed to start containers.
    exit /b 1
  )
  goto :SUCCESS
)

REM Default: up (build if needed)
echo Starting containers (build if needed)...
docker compose -f "%COMPOSE_FILE%" up -d --build
if errorlevel 1 (
  echo Failed to start containers.
  exit /b 1
)

:SUCCESS
echo.
echo Done!
echo    Web App: http://localhost:3000
echo.
goto :DONE

:DONE
popd
endlocal