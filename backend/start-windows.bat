@echo off
REM Quick Start Script for Crop Prediction System (Windows)
REM This script automates the setup process

echo.
echo ================================================
echo  🌾 Crop Prediction System - Quick Start
echo ================================================
echo.

cd /d %~dp0

REM Check if Node.js is installed
echo Checking dependencies...
node -v >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js not found. Please install from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js found

REM Check if Python is installed
python -V >nul 2>&1
if errorlevel 1 (
    echo ✗ Python not found. Please install from https://www.python.org/
    pause
    exit /b 1
)
echo ✓ Python found

echo.
echo Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo ✗ npm install failed
    pause
    exit /b 1
)
echo ✓ npm dependencies installed

echo.
echo Installing Python dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ✗ pip install failed
    pause
    exit /b 1
)
echo ✓ Python dependencies installed

echo.
echo Generating ML model (this may take 1-2 minutes)...
python generate_model.py
if errorlevel 1 (
    echo ✗ Model generation failed
    pause
    exit /b 1
)
echo ✓ ML model generated successfully

echo.
echo ================================================
echo  ✓ Setup Complete!
echo ================================================
echo.
echo Next steps:
echo  1. Keep this terminal open
echo  2. In a NEW terminal, run:
echo     npm start
echo  3. Open browser to:
echo     http://localhost:3000/farmer-dashboard.html
echo  4. Click "Crop Prediction" in navbar
echo.
echo Starting Flask API server...
echo.

REM Start Flask API
python app.py

pause