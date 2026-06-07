@echo off
chcp 65001 >nul
title 岐黄备考 - 构建并启动

cd /d "%~dp0"

echo ====================================
echo   岐黄备考系统 - 构建并启动
echo ====================================
echo.

echo [1/2] 构建前端...
cd /d "%~dp0tcm-exam-prep"
call npm run build
if %errorlevel% neq 0 (
    echo   ❌ 构建失败！请检查错误。
    pause
    exit /b 1
)
echo   ✅ 构建完成！
echo.

echo [2/2] 启动后端服务...
cd /d "%~dp0tcm-exam-prep-server"
start "岐黄后端" cmd /c "echo 后端服务启动中... && npx tsx src/index.ts && echo. && echo 服务已停止，按任意键关闭... && pause >nul"

echo   等待服务就绪...
timeout /t 5 /nobreak >nul

echo   打开浏览器...
start "" http://localhost:3001

echo.
echo ====================================
echo   系统已启动！
echo   地址：http://localhost:3001
echo   账号：admin / tcm2024
echo ====================================
echo.
pause
