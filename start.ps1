param(
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host "== Summer Web App ==" -ForegroundColor Cyan
Write-Host "Project: $projectRoot"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js 未安装或未加入 PATH，请先安装 Node.js。"
}

if (-not $SkipInstall -and -not (Test-Path "node_modules")) {
    Write-Host "未检测到 node_modules，正在安装依赖..." -ForegroundColor Yellow
    npm install
}

$existing = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "检测到 3000 端口已经有进程在监听，项目可能已经启动。" -ForegroundColor Yellow
    Write-Host "如果你想重新启动，请先停止占用 3000 端口的进程。"
    exit 0
}

Write-Host "正在启动项目..." -ForegroundColor Green
Write-Host "启动后访问: http://localhost:3000" -ForegroundColor Green
Write-Host ""

npm start
