@echo off
chcp 65001 >nul
echo ==========================================
echo   DPWH QAS Inventory - Auto-Start Setup
echo ==========================================
echo.

REM Get the Startup folder path
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SOURCE_VBS=%~dp0start-server.vbs"
set "TARGET_VBS=%STARTUP_FOLDER%\DPWH-Inventory-Server.vbs"

REM Check if source file exists
if not exist "%SOURCE_VBS%" (
    echo ❌ Error: start-server.vbs not found in this folder.
    pause
    exit /b 1
)

REM Copy to Startup folder
copy /Y "%SOURCE_VBS%" "%TARGET_VBS%" >nul

if %errorlevel% neq 0 (
    echo ❌ Failed to copy to Startup folder.
    pause
    exit /b 1
)

echo ✅ Auto-start installed successfully!
echo.
echo The server will now start automatically when Windows boots.
echo.
echo 📁 Location: %TARGET_VBS%
echo.
echo 🔧 To test it now:
echo    1. Restart your computer, OR
echo    2. Double-click the file in the Startup folder
echo.
echo 🛑 To remove auto-start:
echo    Delete this file from the Startup folder:
echo    %TARGET_VBS%
echo.
pause
