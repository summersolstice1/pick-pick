@echo off
setlocal

cd /d "%~dp0"

echo == Summer Web App ==
echo Project: %cd%
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0start.ps1"

if errorlevel 1 (
    echo.
    echo 启动失败，请检查上面的报错信息。
    pause
    exit /b 1
)

echo.
echo 服务已退出。
pause
