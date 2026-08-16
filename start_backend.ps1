# AI QA Engineer Agent - Backend Startup Script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Look for venv or site-packages dynamically
if (Test-Path "$ScriptDir\..\venv\Scripts\Activate.ps1") {
    & "$ScriptDir\..\venv\Scripts\Activate.ps1"
}

$env:PYTHONPATH = "$ScriptDir\backend;$env:PYTHONPATH;E:\PyEnv\site-packages"

Write-Host "🚀 Starting AI QA Engineer Backend on http://localhost:8000" -ForegroundColor Cyan
Set-Location "$ScriptDir\backend"

if (Get-Command uvicorn -ErrorAction SilentlyContinue) {
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
} elseif (Test-Path "C:\Python\Python314\python.exe") {
    C:\Python\Python314\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
} else {
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
}
