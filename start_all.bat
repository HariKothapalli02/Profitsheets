@echo off
setlocal enabledelayedexpansion
TITLE ProfitSheets - Master Full-Stack Launcher
COLOR 0A

:: Ensure script root is working directory
cd /d "%~dp0"

echo =====================================================================
echo                  PROFITSHEETS - ALL SYSTEMS LAUNCHER
echo =====================================================================
echo.

:: 1. Validate Node.js Installation
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    COLOR 0C
    echo [ERROR] Node.js is not installed or not in your system PATH!
    echo Please download and install Node.js v18 or higher from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Check for missing dependencies
if not exist "backend\node_modules" (
    echo [INFO] backend\node_modules missing. Checking npm...
    where npm >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        echo [INFO] Installing backend dependencies...
        cd backend && call npm install && cd ..
    ) else (
        echo [WARNING] npm command not found in PATH. Ensure dependencies are installed.
    )
)

if not exist "frontend\node_modules" (
    echo [INFO] frontend\node_modules missing. Checking npm...
    where npm >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        echo [INFO] Installing frontend dependencies...
        cd frontend && call npm install && cd ..
    ) else (
        echo [WARNING] npm command not found in PATH. Ensure dependencies are installed.
    )
)

:: Check CLI flags
if /i "%1"=="prod" goto launch_prod
if /i "%1"=="--prod" goto launch_prod
if /i "%1"=="production" goto launch_prod
if /i "%1"=="build" goto run_build
if /i "%1"=="clean" goto free_ports_standalone
if /i "%1"=="kill" goto free_ports_standalone

:launch_dev
echo [1/3] Checking and clearing port conflicts (5000 / 3000)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5000, 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo [2/3] Starting ProfitSheets Backend API Engine on port 5000...
start "ProfitSheets Backend [Port 5000]" cmd /k "title ProfitSheets Backend [Port 5000] && color 0B && cd /d \"%~dp0backend\" && node index.js"

echo [3/3] Starting ProfitSheets Frontend (Vite) on port 3000...
start "ProfitSheets Frontend [Port 3000]" cmd /k "title ProfitSheets Frontend [Port 3000] && color 0E && cd /d \"%~dp0frontend\" && node node_modules\vite\bin\vite.js --port 3000"

echo.
echo Launching default browser in 2 seconds...
timeout /t 2 /nobreak >nul 2>&1
start "" http://localhost:3000

:controller_loop
cls
echo =====================================================================
echo                  PROFITSHEETS - ALL SYSTEMS ONLINE
echo =====================================================================
echo.
echo   * Web App (Vite + React):   http://localhost:3000
echo   * Backend API Engine:        http://localhost:5000
echo   * System Health Status:      http://localhost:5000/api/health
echo.
echo   * Live Feeds:       Yahoo Finance Quotes + Technical Indicators
echo   * Corporate News:   Official BSE India Announcements + Concall PDFs
echo   * Broker Gateway:   Zerodha Kite 1-Click Order Execution
echo   * Paper Trading:    Rs 5,00,000 Live Virtual Demat Portfolio
echo.
echo =====================================================================
echo   CONTROL COMMANDS:
echo     [O] Open App in Default Browser
echo     [R] Clean Restart Both Servers (Frees Ports and Relaunches)
echo     [B] Compile Production Frontend Assets (Vite Build)
echo     [P] Switch to Production Mode (Port 5000 Single Server)
echo     [K] Kill / Free Ports 5000 and 3000
echo     [Q] Stop All Servers and Exit
echo =====================================================================
echo.
set "CMD="
set /p CMD="Enter command [O/R/B/P/K/Q]: "

if /i "%CMD%"=="O" (
    start "" http://localhost:3000
    goto controller_loop
)
if /i "%CMD%"=="R" (
    echo [INFO] Restarting servers...
    goto launch_dev
)
if /i "%CMD%"=="B" (
    goto run_build
)
if /i "%CMD%"=="P" (
    goto launch_prod
)
if /i "%CMD%"=="K" (
    goto free_ports_menu
)
if /i "%CMD%"=="Q" (
    echo [INFO] Stopping all ProfitSheets servers...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5000, 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
    for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
    for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
    echo [INFO] All servers terminated cleanly. Goodbye!
    timeout /t 2 >nul 2>&1
    exit /b 0
)
goto controller_loop

:launch_prod
cls
echo =====================================================================
echo             PROFITSHEETS - PRODUCTION FULL-STACK LAUNCHER
echo =====================================================================
echo.
echo [1/3] Clearing stale processes on port 5000 and 3000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5000, 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo [2/3] Compiling latest frontend assets with Vite...
cd /d "%~dp0frontend"
call node node_modules\vite\bin\vite.js build
cd /d "%~dp0"

echo [3/3] Starting Unified Server on port 5000...
echo.
echo   * URL:         http://localhost:5000
echo   * Login Page:  http://localhost:5000/login
echo   * Signup Page: http://localhost:5000/signup
echo   * Health:      http://localhost:5000/api/health
echo.
timeout /t 2 /nobreak >nul 2>&1
start "" http://localhost:5000

echo =====================================================================
echo  Server is LIVE on port 5000. Press Ctrl+C to terminate.
echo =====================================================================
echo.
cd /d "%~dp0backend"
node index.js
pause
exit /b 0

:run_build
cls
echo =====================================================================
echo            PROFITSHEETS - COMPILING FRONTEND ASSETS
echo =====================================================================
echo.
cd /d "%~dp0frontend"
call node node_modules\vite\bin\vite.js build
cd /d "%~dp0"
echo.
echo [INFO] Frontend build completed. Output located in frontend\dist\
echo.
pause
goto controller_loop

:free_ports_menu
echo.
echo [INFO] Terminating all processes on ports 5000 and 3000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5000, 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
echo [INFO] Ports 5000 and 3000 are now completely free.
echo.
pause
goto controller_loop

:free_ports_standalone
echo [INFO] Terminating all processes on ports 5000 and 3000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5000, 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
echo [INFO] Done. Ports 5000 and 3000 are freed.
exit /b 0
