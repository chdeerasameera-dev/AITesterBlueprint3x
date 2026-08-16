@echo off
title AI QA Engineer Agent Launcher
echo ===================================================
echo   Starting AI QA Engineer Agent Application
echo ===================================================

set ROOT_DIR=%~dp0
set PYTHONPATH=%ROOT_DIR%backend;%PYTHONPATH%;E:\PyEnv\site-packages

echo Starting Backend Server on http://localhost:8000 ...
start "AI QA Backend" cmd /k "cd /d "%ROOT_DIR%backend" && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend Server on http://localhost:5173 ...
start "AI QA Frontend" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run dev"

echo.
echo ===================================================
echo Both services are starting in separate windows.
echo - Backend API: http://localhost:8000 / http://localhost:8000/docs
echo - Frontend UI: http://localhost:5173
echo ===================================================
