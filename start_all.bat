@echo off
TITLE ProfitSheets - Production Server Launcher
COLOR 0A

echo =====================================================================
echo                  PROFITSHEETS - ALL SYSTEMS LAUNCHER
echo =====================================================================
echo.
echo  [1/4] Checking environment and dependencies...

:: Change directory to script root
cd /d "%~dp0"

:: Check if Node is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check backend node_modules
if not exist "backend\node_modules" (
    echo [INFO] Installing backend dependencies...
    cd backend && call npm install && cd ..
)

:: Check frontend node_modules
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend && call npm install && cd ..
)

:: Check if frontend dist exists, build if missing
if not exist "frontend\dist" (
    echo [2/4] Building frontend assets...
    cd frontend && call npm run build && cd ..
) else (
    echo [2/4] Frontend production build verified.
)

echo [3/4] Starting ProfitSheets Full-Stack Engine on port 5000...
echo.
echo   * URL:         http://localhost:5000
echo   * Login Page:  http://localhost:5000/login
echo   * Signup Page: http://localhost:5000/signup
echo   * Market Feed: Angel One SmartAPI Live
echo   * Demo Cash:   Rs 5,00,000 per user
echo.

:: Automatically open default browser after a brief pause
start "" http://localhost:5000

echo [4/4] Server is LIVE. Press Ctrl+C to terminate.
echo =====================================================================
echo.

cd backend
node index.js
pause
