@echo off
title Qihuang TCM
cd /d "%~dp0"

echo ====================================
echo   Qihuang TCM Exam Prep System
echo ====================================
echo.

REM Kill old processes
echo [Clean] Killing old processes...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING" 2^>nul') do (
    echo   Killing backend PID:%%a
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING" 2^>nul') do (
    echo   Killing frontend PID:%%a
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo   Done.
echo.

REM Check dependencies
if not exist "%~dp0tcm-exam-prep-server\node_modules" (
    echo [Deps] Installing backend dependencies...
    cd /d "%~dp0tcm-exam-prep-server"
    call npm install
    cd /d "%~dp0"
    echo.
)
if not exist "%~dp0tcm-exam-prep\node_modules" (
    echo [Deps] Installing frontend dependencies...
    cd /d "%~dp0tcm-exam-prep"
    call npm install
    cd /d "%~dp0"
    echo.
)

REM Start backend
echo [1/2] Starting backend on http://localhost:3001
start "Qihuang Backend" cmd /k "title Qihuang Backend && cd /d %~dp0tcm-exam-prep-server && npx tsx src/index.ts"

echo   Waiting for backend...
timeout /t 4 /nobreak >nul

REM Start frontend
echo [2/2] Starting frontend on http://localhost:3000
start "Qihuang Frontend" cmd /k "title Qihuang Frontend && cd /d %~dp0tcm-exam-prep && npx vite --host"

timeout /t 3 /nobreak >nul

REM Open browser
start "" http://localhost:3000

echo.
echo ====================================
echo   System Ready
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:3001
echo   Login:    admin / tcm2024
echo.
echo   Close the two sub-windows to stop.
echo ====================================
