@echo off
chcp 65001 >nul
echo ==========================================
echo   DPWH QAS Inventory - USB Packaging
echo ==========================================
echo.

set "SOURCE=%~dp0"
set "DEST=%USERPROFILE%\Desktop\DPWH-INVENTORY-USB"

echo 📦 Preparing files for USB transfer...
echo.

REM Create destination folder
if exist "%DEST%" rmdir /S /Q "%DEST%"
mkdir "%DEST%"

REM Copy main project files
xcopy /E /I /Y "%SOURCE%*.html" "%DEST%\" >nul 2>&1
xcopy /E /I /Y "%SOURCE%*.css" "%DEST%\" >nul 2>&1
xcopy /E /I /Y "%SOURCE%*.js" "%DEST%\" >nul 2>&1
xcopy /E /I /Y "%SOURCE%*.jpg" "%DEST%\" >nul 2>&1
xcopy /E /I /Y "%SOURCE%*.md" "%DEST%\" >nul 2>&1
xcopy /E /I /Y "%SOURCE%*.bat" "%DEST%\" >nul 2>&1
xcopy /E /I /Y "%SOURCE%*.vbs" "%DEST%\" >nul 2>&1

REM Copy Backend folder (including node_modules for offline use)
xcopy /E /I /Y "%SOURCE%Backend" "%DEST%\Backend\" >nul 2>&1

REM Copy .gitignore
xcopy /Y "%SOURCE%.gitignore" "%DEST%\" >nul 2>&1

echo ✅ Package created at:
echo    %DEST%
echo.
echo 📋 Next steps:
echo    1. Copy this folder to your USB drive
echo    2. Plug USB into the DPWH server computer
echo    3. Copy from USB to Desktop
echo    4. Run install-autostart.bat
echo.
pause
