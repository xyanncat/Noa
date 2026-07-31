@echo off
setlocal enabledelayedexpansion

:MENU
cls
echo ===================================================
echo   NOA AUTONOMOUS AI ENGINE - INSTALLATION & BUILD
echo ===================================================
echo.
echo   [1] Install All Dependencies (Python + Node.js Workspaces)
echo   [2] Build Smartphone Package  (Android .apk)
echo   [3] Build Desktop Package     (Windows .exe Setup)
echo   [4] Build Full Release        (APK + EXE + SHA-256 Metadata)
echo   [5] Start Local Services      (Backend API + Web UI)
echo   [6] Exit
echo.
echo ===================================================
set /p choice="Select an option [1-6]: "

if "%choice%"=="1" goto INSTALL_ALL
if "%choice%"=="2" goto BUILD_MOBILE
if "%choice%"=="3" goto BUILD_DESKTOP
if "%choice%"=="4" goto BUILD_RELEASE
if "%choice%"=="5" goto START_SERVICES
if "%choice%"=="6" goto END

echo Invalid selection. Please try again.
pause
goto MENU

:INSTALL_ALL
echo.
echo [1/2] Installing Python Backend Dependencies...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies.
    pause
    goto MENU
)
echo.
echo [2/2] Installing Node.js Workspace Dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm dependencies.
    pause
    goto MENU
)
echo.
echo === Dependencies successfully installed! ===
pause
goto MENU

:BUILD_MOBILE
echo.
echo === Building Smartphone Android Release APK ===
call npm run build:mobile
if %errorlevel% neq 0 (
    echo [ERROR] Android build failed.
    pause
    goto MENU
)
echo.
echo [SUCCESS] APK generated at: mobile\android\app\build\outputs\apk\release\app-release.apk
pause
goto MENU

:BUILD_DESKTOP
echo.
echo === Building Desktop Windows Executable Installer ===
call npm run build:desktop
if %errorlevel% neq 0 (
    echo [ERROR] Desktop build failed.
    pause
    goto MENU
)
echo.
echo [SUCCESS] Windows Installer generated in: desktop-windows\src-tauri\target\release\bundle\nsis
pause
goto MENU

:BUILD_RELEASE
echo.
echo === Building Full Multi-Platform Release ===
powershell -ExecutionPolicy Bypass -File .\tools\build-local-release.ps1
if %errorlevel% neq 0 (
    echo [ERROR] Local release build failed.
    pause
    goto MENU
)
echo.
echo [SUCCESS] Full release packages and build-metadata.json generated in release-assets\
pause
goto MENU

:START_SERVICES
echo.
echo Starting Backend API in new window...
start "Noa Backend API" cmd /k "python api/main.py"
echo Starting Web UI...
cd ui
call npm run dev
cd ..
goto MENU

:END
exit /b 0
