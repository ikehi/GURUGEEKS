#!/bin/bash

# Development workflow script for News Aggregator
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "All prerequisites are installed."
}

# Function to setup environment
setup_env() {
    print_status "Setting up environment..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
            print_warning "Please update .env with your API keys and secrets."
        else
            print_error ".env.example file not found. Please create .env file manually."
            exit 1
        fi
    else
        print_success ".env file already exists."
    fi
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    
    # Remove Python cache files
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.pyc" -delete 2>/dev/null || true
    
    # Remove node_modules cache
    if [ -d "frontend/node_modules/.vite" ]; then
        rm -rf frontend/node_modules/.vite
    fi
    
    print_success "Cleanup completed."
}

# Function to start development environment
start_dev() {
    print_status "Starting development environment..."
    
    # Build and start services
    docker-compose up --build -d
    
    print_success "Development environment started!"
    print_status "Backend API: http://localhost:8000"
    print_status "Frontend: http://localhost:3000"
    print_status "API Documentation: http://localhost:8000/docs"
}

# Function to stop development environment
stop_dev() {
    print_status "Stopping development environment..."
    docker-compose down
    print_success "Development environment stopped."
}

# Function to show logs
show_logs() {
    local service=${1:-""}
    if [ -n "$service" ]; then
        docker-compose logs -f "$service"
    else
        docker-compose logs -f
    fi
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Backend tests
    if [ -d "backend" ]; then
        print_status "Running backend tests..."
        docker-compose exec backend pytest || print_warning "Backend tests failed or not configured"
    fi
    
    # Frontend tests
    if [ -d "frontend" ]; then
        print_status "Running frontend tests..."
        docker-compose exec frontend npm test || print_warning "Frontend tests failed or not configured"
    fi
    
    print_success "Tests completed."
}

# Function to show help
show_help() {
    echo "News Aggregator Development Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start development environment"
    echo "  stop      Stop development environment"
    echo "  restart   Restart development environment"
    echo "  logs      Show logs (optionally specify service: backend, frontend, db, redis)"
    echo "  test      Run tests"
    echo "  clean     Clean up cache files and temporary data"
    echo "  setup     Setup environment and check prerequisites"
    echo "  status    Show status of all services"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs backend"
    echo "  $0 test"
}

# Function to show status
show_status() {
    print_status "Service Status:"
    docker-compose ps
}

# Main script logic
case "${1:-help}" in
    start)
        check_prerequisites
        setup_env
        cleanup
        start_dev
        ;;
    stop)
        stop_dev
        ;;
    restart)
        stop_dev
        sleep 2
        start_dev
        ;;
    logs)
        show_logs "$2"
        ;;
    test)
        run_tests
        ;;
    clean)
        cleanup
        ;;
    setup)
        check_prerequisites
        setup_env
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
