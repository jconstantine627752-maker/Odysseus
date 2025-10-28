#!/bin/bash
# X402 Demo Startup Script

echo "🔱 Starting Odysseus X402 Protocol Demo..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ to run the demo."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the apps/odin directory."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Building TypeScript..."
npm run build

echo ""
echo "🚀 Starting X402 Demo Server..."
echo ""
echo "🌐 Demo will be available at: http://localhost:9999"
echo "📊 API endpoints available at: http://localhost:9999/api"
echo ""
echo "Press Ctrl+C to stop the demo"
echo ""

# Set demo environment
export NODE_ENV=development
export PAPER_TRADING=true
export ODIN_PORT=9999

# Start the server
npm start