@echo off
title Qihuang TCM - Build and Start

cd /d "%~dp0"

echo ====================================
echo   Qihuang TCM Exam Prep
echo   Build Frontend and Start Server
echo ====================================
echo.
echo [1/2] Building frontend...
cd /d "%~dp0tcm-exam-prep"
call pnpm build
if %errorlevel% neq 0 (
    echo   Build failed! Check errors above.
    pause
    exit /b 1
)
echo   Build complete!

echo.
echo [2/2] Starting backend server...
cd /d "%~dp0tcm-exam-prep-server"
start "Qihuang-Backend" cmd /c "cd /d %~dp0tcm-exam-prep-server && npx tsx src/index.ts"

echo   Waiting for server...
timeout /t 4 /nobreak >nul

echo   Opening browser...
start "" http://localhost:3000

echo.
echo ====================================
echo   System is running!
echo   http://localhost:3000
echo   Login: admin / tcm2024
echo ====================================
echo.
pause
