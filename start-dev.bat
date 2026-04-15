@echo off
echo Starting HRIS in frontend dev mode...
echo =====================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker is not running. Please start Docker Desktop first.
    exit /b 1
)

echo Starting postgres, backend, and Vite dev frontend...
docker-compose --profile dev up -d postgres backend frontend-dev

echo.
echo HRIS dev mode is starting.
echo ==========================
echo Frontend (hot reload): http://localhost:5173
echo Backend API:           http://localhost:8083/api/v1
echo API Docs:              http://localhost:8083/docs
echo.
echo Open http://localhost:5173 for design changes.
echo To stop: docker-compose down
pause
