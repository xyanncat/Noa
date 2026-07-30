@echo off
echo ===================================================
echo   NOA AUTONOMOUS AI ENGINE - AUTOMATED SETUP SCRIPT
echo ===================================================
echo.

echo [1/3] Installing Python Backend Dependencies...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies. Please ensure Python 3.10+ is installed.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Installing Web Interface Dependencies...
cd ui
call npm install
cd ..

echo.
echo [3/3] System Setup Complete!
echo.
echo ===================================================
echo   HOW TO START NOA:
echo   1. Start Backend API Server: python api/main.py
echo   2. Start Web Interface:       cd ui && npm run dev
echo ===================================================
echo.
pause
