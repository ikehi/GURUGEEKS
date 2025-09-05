#!/bin/bash

# News Aggregator Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Setting up News Aggregator..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please edit it with your API keys."
else
    echo "✅ .env file already exists."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/logs
mkdir -p frontend/public

# Set up backend
echo "🐍 Setting up Python backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
echo "📦 Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

cd ..

# Set up frontend
echo "📦 Setting up Node.js frontend..."
cd frontend

# Install dependencies if package-lock.json doesn't exist
if [ ! -f "package-lock.json" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
else
    echo "✅ Node.js dependencies already installed."
fi

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your API keys:"
echo "   - NEWS_API_KEY: Get from https://newsapi.org/"
echo "   - GUARDIAN_API_KEY: Get from https://open-platform.theguardian.com/"
echo "   - NYT_API_KEY: Get from https://developer.nytimes.com/"
echo ""
echo "2. Start the application:"
echo "   docker-compose up --build"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - API Documentation: http://localhost:8000/docs"
echo ""
echo "4. For development:"
echo "   - Backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "   - Frontend: cd frontend && npm run dev"
echo ""
echo "Happy coding! 🚀"
