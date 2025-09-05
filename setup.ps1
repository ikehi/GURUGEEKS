# PowerShell Setup Script for News Aggregator
Write-Host "Setting up News Aggregator Development Environment..." -ForegroundColor Green

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✓ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
try {
    docker-compose --version | Out-Null
    Write-Host "✓ Docker Compose is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created" -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

# Check if Python is available
try {
    py --version | Out-Null
    Write-Host "✓ Python is available" -ForegroundColor Green
} catch {
    Write-Host "✗ Python is not available. Please install Python 3.8+ first." -ForegroundColor Red
    exit 1
}

# Install Python dependencies for backend
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
Set-Location backend
try {
    py -m pip install -r requirements.txt
    Write-Host "✓ Python dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install Python dependencies" -ForegroundColor Red
    Write-Host "You may need to install pip or upgrade it" -ForegroundColor Yellow
}

Set-Location ..

# Check if Node.js is available
try {
    node --version | Out-Null
    Write-Host "✓ Node.js is available" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not available. Please install Node.js 16+ first." -ForegroundColor Red
    Write-Host "You can download it from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Install Node.js dependencies for frontend
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
Set-Location frontend
try {
    npm install
    Write-Host "✓ Node.js dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install Node.js dependencies" -ForegroundColor Red
}

Set-Location ..

Write-Host "`nSetup completed!" -ForegroundColor Green
Write-Host "`nTo run the application:" -ForegroundColor Cyan
Write-Host "1. With Docker (recommended): docker-compose up" -ForegroundColor White
Write-Host "2. Without Docker:" -ForegroundColor White
Write-Host "   - Backend: cd backend && py -m uvicorn app.main:app --reload" -ForegroundColor White
Write-Host "   - Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "`nMake sure to set up your API keys in the .env file!" -ForegroundColor Yellow
