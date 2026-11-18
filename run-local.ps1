# BrandGuard AI - Local Standalone Environment Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  BrandGuard AI - Local Standalone Environment" -ForegroundColor Cyan
Write-Host "  (Frontend, Backend & DB running without deployment!)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "`n[1/2] Starting Backend on http://127.0.0.1:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "[2/2] Starting Frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`nApp successfully launched!" -ForegroundColor Green
Write-Host "  • Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  • API Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
