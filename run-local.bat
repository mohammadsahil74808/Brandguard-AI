@echo off
echo ========================================================
echo   BrandGuard AI - Local Standalone Environment
echo   (Zero Cloud Configuration Required)
echo ========================================================
echo.
echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "BrandGuard Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo Starting Vite React Frontend on http://localhost:5173 ...
start "BrandGuard Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   BrandGuard AI is launching!
echo   Frontend: http://localhost:5173
echo   API Docs: http://127.0.0.1:8000/docs
echo ========================================================
pause
