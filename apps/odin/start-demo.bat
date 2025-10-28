@echo off
REM X402 Demo Startup Script for Windows

echo 🔱 Starting Odysseus X402 Protocol Demo...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ to run the demo.
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this script from the apps\odin directory.
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
call npm install

echo.
echo 🔧 Building TypeScript...
call npm run build

echo.
echo 🚀 Starting X402 Demo Server...
echo.
echo 🌐 Demo will be available at: http://localhost:9999
echo 📊 API endpoints available at: http://localhost:9999/api
echo.
echo Press Ctrl+C to stop the demo
echo.

REM Set demo environment
set NODE_ENV=development
set PAPER_TRADING=true
set ODIN_PORT=9999

REM Start the server
call npm start