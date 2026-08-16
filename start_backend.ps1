# AI QA Engineer Agent - Backend Startup Script
$env:PYTHONPATH = "E:\PyEnv\site-packages;E:\AIHackthon\AIQAEngineer AGent\backend"

Write-Host "🚀 Starting AI QA Engineer Backend on http://localhost:8000" -ForegroundColor Cyan
Set-Location "E:\AIHackthon\AIQAEngineer AGent\backend"
C:\Python\Python314\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
