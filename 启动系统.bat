@echo off
title Qihuang TCM

cd /d "%~dp0"

echo ====================================
echo   Qihuang TCM Exam Prep
echo ====================================
echo.

REM check if frontend is built
if not exist "%~dp0tcm-exam-prep\dist\index.html" (
    echo [1/2] Building frontend...
    cd /d "%~dp0tcm-exam-prep"
    call npm run build
    if %errorlevel% neq 0 (
        echo   Build failed!
        pause
        exit /b 1
    )
    echo   Build done.
    echo.
) else (
    echo [1/2] Frontend already built.
    echo.
)

echo [2/2] Starting backend server...
cd /d "%~dp0tcm-exam-prep-server"

REM start server in this same window so errors are visible
echo.
echo ====================================
echo   Server starting at http://localhost:3001
echo   Login: admin / tcm2024
echo   Close this window to stop.
echo ====================================
echo.

start "" http://localhost:3001

npx tsx src/index.ts

pause
