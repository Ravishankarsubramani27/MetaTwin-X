@echo off
echo ============================================
echo   MetaTwin-X — Starting All Services
echo ============================================
echo.

echo [1/3] Starting FastAPI Backend (port 8000)...
start "MetaTwin-X Backend" cmd /k "cd /d %~dp0 && python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak > nul

echo [2/3] Starting React Frontend (port 3000)...
start "MetaTwin-X Frontend" cmd /k "cd /d %~dp0metatwin-frontend && npm start"
timeout /t 2 /nobreak > nul

echo [3/3] Starting Streamlit Dashboard (port 8501)...
start "MetaTwin-X Streamlit" cmd /k "cd /d %~dp0 && python -m streamlit run app.py --server.port 8501"

echo.
echo ============================================
echo   Services starting in separate windows
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo   React UI:  http://localhost:3000
echo   Streamlit: http://localhost:8501
echo ============================================
echo.
echo Press any key to exit this window...
pause > nul
