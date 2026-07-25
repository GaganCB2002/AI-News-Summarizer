$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  AI News Summarizer - Starting Project" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "[1/3] Starting Backend (FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root/backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload" -WindowStyle Normal

# Wait for backend health
Write-Host "[2/3] Waiting for backend to be ready..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 2 -ErrorAction Stop
        if ($response.status -eq "ok") {
            $ready = $true
            break
        }
    } catch {
        # Backend not ready yet
    }
}

if ($ready) {
    Write-Host "   Backend is ready!" -ForegroundColor Green
} else {
    Write-Host "   Warning: Backend may still be starting..." -ForegroundColor Red
}

Write-Host ""

# Start Frontend
Write-Host "[3/3] Starting Frontend (Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root/frontend'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Project is running!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Backend API:  http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:     http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Frontend:     http://localhost:5173" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Auto-open browser
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"