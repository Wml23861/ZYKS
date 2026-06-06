@echo off
title Qihuang TCM Exam Prep

cd /d "%~dp0tcm-exam-prep-server"

echo ====================================
echo   Qihuang TCM Exam Prep System
echo ====================================
echo.
echo   Starting backend server...
echo.

start "Qihuang-Backend" cmd /c "cd /d %~dp0tcm-exam-prep-server && npx tsx src/index.ts"

echo   Waiting for server to start...
timeout /t 4 /nobreak >nul

echo   Opening browser...
start "" http://localhost:3000

echo.
echo   System is running at http://localhost:3000
echo   Login: admin / tcm2024
echo   Close this window to stop the server.
echo.
pause
