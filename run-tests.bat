@echo off
REM LoanTracker Test Runner Script for Windows
REM Run all automated tests for the application

echo.
echo ===============================================
echo  LoanTracker Test Suite Runner
echo ===============================================
echo.

cd /d "%~dp0\backend"

REM Check if pytest is installed
python -m pytest --version >nul 2>&1
if %errorlevel% neq 0 (
    echo pytest not found. Installing dependencies...
    pip install -r requirements.txt
)

echo.
echo ===============================================
echo  Running Unit Tests...
echo ===============================================
python -m pytest tests\unit\ -v

echo.
echo ===============================================
echo  Running Integration Tests...
echo ===============================================
python -m pytest tests\integration\ -v

echo.
echo ===============================================
echo  Generating Coverage Report...
echo ===============================================
python -m pytest tests\ --cov=app --cov-report=term-missing --cov-report=html

echo.
echo ===============================================
echo  All Tests Complete!
echo ===============================================
echo.
echo Coverage report generated: backend\htmlcov\index.html
echo Open in browser to view detailed coverage
echo.
pause
