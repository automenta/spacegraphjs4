@echo off
title SpaceGraphJS4 Demo Server

echo Starting SpaceGraphJS4 Demo Server...
echo ====================================

REM Check if node is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js to run the demo.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo npm is not installed. Please install npm to run the demo.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Start the demo server
echo Starting demo server on http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
echo Available demos:
echo   - Comprehensive Demo: http://localhost:3000/demo/comprehensive-demo.html
echo   - Integration Tests: http://localhost:3000/demo/integration-tests.html
echo   - Physics Demo: http://localhost:3000/demo/physics-demo.html
echo.

npx serve .