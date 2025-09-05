# News Aggregator - FullStack Take Home Challenge

A modern news aggregator application that pulls articles from multiple sources and provides a personalized, mobile-responsive experience.

## 🚀 Features

- **User Authentication**: Secure registration and login system
- **Article Search & Filtering**: Search by keywords, filter by date, category, and source
- **Personalized News Feed**: Customize preferences for sources, categories, and authors
- **Mobile-Responsive Design**: Optimized for all device sizes
- **Real-time Data**: Scheduled scraping from multiple news sources
- **Local Data Storage**: All filtering performed on local database

## 🏗️ Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with Python 3.11+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with Passlib
- **Data Sources**: NewsAPI, The Guardian, New York Times APIs
- **Scheduling**: Background tasks for data scraping

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI)
- **State Management**: React Context API + React Query
- **Routing**: React Router DOM

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL
- **Environment**: Development and production configurations

## 📁 Project Structure

```
news-aggregator/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── models.py            # SQLAlchemy database models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── crud.py              # Database CRUD operations
│   │   ├── auth.py              # Authentication logic
│   │   ├── api/                 # API route modules
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── articles.py      # Article endpoints
│   │   │   └── users.py         # User management endpoints
│   │   ├── services/            # Business logic services
│   │   │   ├── news_service.py  # News API integrations
│   │   │   └── scheduler.py     # Background task scheduling
│   │   └── utils.py             # Utility functions
│   ├── alembic/                 # Database migrations
│   ├── Dockerfile               # Backend container configuration
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   │   ├── common/          # Common UI components
│   │   │   ├── auth/            # Authentication components
│   │   │   ├── articles/        # Article-related components
│   │   │   └── layout/          # Layout components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API service functions
│   │   ├── hooks/               # Custom React hooks
│   │   ├── context/             # React context providers
│   │   ├── types/               # TypeScript type definitions
│   │   ├── utils/               # Utility functions
│   │   ├── App.tsx              # Main application component
│   │   └── main.tsx             # Application entry point
│   ├── public/                  # Static assets
│   ├── Dockerfile               # Frontend container configuration
│   ├── package.json             # Node.js dependencies
│   ├── tsconfig.json            # TypeScript configuration
│   └── vite.config.ts           # Vite configuration
├── docker-compose.yml           # Multi-service orchestration
├── .env.example                 # Environment variables template
└── README.md                    # This file
```

## 🛠️ Setup Instructions

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/ikehi/GURUGEEKS.git
   cd news-aggregator
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   get .env.example below
   # Edit .env with your API keys and configuration
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/news_aggregator

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# News APIs
NEWS_API_KEY=your-newsapi-key
GUARDIAN_API_KEY=your-guardian-key
NYT_API_KEY=your-nyt-key

# Application
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token

### Articles
- `GET /api/articles` - Get articles with filtering
- `GET /api/articles/{id}` - Get specific article
- `GET /api/articles/search` - Search articles
- `GET /api/articles/sources` - Get available sources
- `GET /api/articles/categories` - Get available categories

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/preferences` - Update user preferences
- `GET /api/users/preferences` - Get user preferences

## 🎨 Design Principles

### UI/UX Guidelines
- **Mobile-First**: Responsive design optimized for mobile devices
- **Clean Interface**: Minimalist design with clear typography
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Fast loading times and smooth interactions

### Code Quality
- **DRY**: Don't Repeat Yourself - reusable components and functions
- **KISS**: Keep It Simple, Stupid - straightforward implementations
- **SOLID**: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion

## 🔄 Data Flow

1. **Data Collection**: Scheduled background tasks fetch articles from APIs
2. **Data Storage**: Articles stored in PostgreSQL with proper indexing
3. **User Interaction**: Frontend requests filtered data from backend
4. **Personalization**: User preferences applied to article filtering
5. **Caching**: React Query handles client-side caching

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Production Build
```bash
docker-compose -f docker-compose.prod.yml up --build
```

### Environment Variables for Production
- Use strong, unique SECRET_KEY
- Configure production database URL
- Set up proper CORS origins
- Configure logging and monitoring

## 📝 Development Guidelines

### Git Workflow
- Feature branches for new development
- Descriptive commit messages
- Pull request reviews
- Clean merge history

### Code Standards
- **Python**: PEP 8 compliance, type hints
- **TypeScript**: Strict mode, proper typing
- **React**: Functional components, hooks
- **API**: RESTful design, proper error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is created for the FullStack Take Home Challenge.

## 🆘 Support

For questions or issues, please refer to the project documentation or create an issue in the repository.
