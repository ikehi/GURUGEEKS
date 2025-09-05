# Development workflow script for News Aggregator (PowerShell)
param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed. Please install Docker Desktop first."
        exit 1
    }
    
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    }
    
    Write-Success "All prerequisites are installed."
}

# Function to setup environment
function Initialize-Environment {
    Write-Status "Setting up environment..."
    
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Success "Created .env file from .env.example"
            Write-Warning "Please update .env with your API keys and secrets."
        } else {
            Write-Error ".env.example file not found. Please create .env file manually."
            exit 1
        }
    } else {
        Write-Success ".env file already exists."
    }
}

# Function to clean up
function Clear-Cache {
    Write-Status "Cleaning up..."
    
    # Remove Python cache files
    Get-ChildItem -Recurse -Directory -Name "__pycache__" -ErrorAction SilentlyContinue | ForEach-Object { Remove-Item -Recurse -Force $_ -ErrorAction SilentlyContinue }
    Get-ChildItem -Recurse -Name "*.pyc" -ErrorAction SilentlyContinue | ForEach-Object { Remove-Item -Force $_ -ErrorAction SilentlyContinue }
    
    # Remove node_modules cache
    if (Test-Path "frontend/node_modules/.vite") {
        Remove-Item -Recurse -Force "frontend/node_modules/.vite" -ErrorAction SilentlyContinue
    }
    
    Write-Success "Cleanup completed."
}

# Function to start development environment
function Start-Development {
    Write-Status "Starting development environment..."
    
    # Build and start services
    docker-compose up --build -d
    
    Write-Success "Development environment started!"
    Write-Status "Backend API: http://localhost:8000"
    Write-Status "Frontend: http://localhost:3000"
    Write-Status "API Documentation: http://localhost:8000/docs"
}

# Function to stop development environment
function Stop-Development {
    Write-Status "Stopping development environment..."
    docker-compose down
    Write-Success "Development environment stopped."
}

# Function to show logs
function Show-Logs {
    param([string]$Service = "")
    
    if ($Service) {
        docker-compose logs -f $Service
    } else {
        docker-compose logs -f
    }
}

# Function to run tests
function Invoke-Tests {
    Write-Status "Running tests..."
    
    # Backend tests
    if (Test-Path "backend") {
        Write-Status "Running backend tests..."
        try {
            docker-compose exec backend pytest
        } catch {
            Write-Warning "Backend tests failed or not configured"
        }
    }
    
    # Frontend tests
    if (Test-Path "frontend") {
        Write-Status "Running frontend tests..."
        try {
            docker-compose exec frontend npm test
        } catch {
            Write-Warning "Frontend tests failed or not configured"
        }
    }
    
    Write-Success "Tests completed."
}

# Function to show help
function Show-Help {
    Write-Host "News Aggregator Development Script (PowerShell)" -ForegroundColor $Blue
    Write-Host ""
    Write-Host "Usage: .\scripts\dev.ps1 [COMMAND]" -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor $Green
    Write-Host "  start     Start development environment"
    Write-Host "  stop      Stop development environment"
    Write-Host "  restart   Restart development environment"
    Write-Host "  logs      Show logs (optionally specify service: backend, frontend, db, redis)"
    Write-Host "  test      Run tests"
    Write-Host "  clean     Clean up cache files and temporary data"
    Write-Host "  setup     Setup environment and check prerequisites"
    Write-Host "  status    Show status of all services"
    Write-Host "  help      Show this help message"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Yellow
    Write-Host "  .\scripts\dev.ps1 start"
    Write-Host "  .\scripts\dev.ps1 logs backend"
    Write-Host "  .\scripts\dev.ps1 test"
}

# Function to show status
function Show-Status {
    Write-Status "Service Status:"
    docker-compose ps
}

# Main script logic
switch ($Command.ToLower()) {
    "start" {
        Test-Prerequisites
        Initialize-Environment
        Clear-Cache
        Start-Development
    }
    "stop" {
        Stop-Development
    }
    "restart" {
        Stop-Development
        Start-Sleep -Seconds 2
        Start-Development
    }
    "logs" {
        Show-Logs $args[0]
    }
    "test" {
        Invoke-Tests
    }
    "clean" {
        Clear-Cache
    }
    "setup" {
        Test-Prerequisites
        Initialize-Environment
    }
    "status" {
        Show-Status
    }
    "help" {
        Show-Help
    }
    default {
        Write-Error "Unknown command: $Command"
        Show-Help
        exit 1
    }
}
