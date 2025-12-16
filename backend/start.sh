#!/bin/bash
# Quick start script for PocketGone Backend

echo "🚀 Starting PocketGone Backend..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt --quiet

# Start server
echo "✨ Starting FastAPI server..."
echo "📡 Backend API will be available at: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
python main.py
