@echo off
setlocal EnableExtensions
set "ROOT=%~dp0"

echo ============================================
echo   AI News Summarizer - Starting Project
echo ============================================
echo.

echo [1/3] Starting Backend (FastAPI)...
start "AI News Backend" cmd /k "cd /d "%ROOT%backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Waiting for backend to be ready...
:wait_loop
timeout /t 2 /nobreak >nul
powershell -Command "try { $r = Invoke-WebRequest -Uri http://127.0.0.1:8000/health -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if errorlevel 1 goto wait_loop

echo    Backend is ready!
echo.

echo [3/3] Starting Frontend (Vite)...
start "AI News Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

echo.
echo ============================================
echo   Project is running!
echo ============================================
echo   Backend API:  http://localhost:8000
echo   API Docs:     http://localhost:8000/docs
echo   Frontend:     http://localhost:5173
echo ============================================
echo.

timeout /t 3 /nobreak >nul
start http://localhost:5173

pause