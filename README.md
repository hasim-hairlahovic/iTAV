# Analytics Dashboard

A modern React-based business intelligence dashboard for workforce analytics and customer insights.

## Features

- Executive Dashboard with real-time metrics
- Customer membership analytics
- Call center performance tracking
- Workforce headcount management
- Forecasting scenarios
- Comprehensive reporting tools

## Technologies

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + PostgreSQL
- **Containerization**: Docker + Docker Compose
- **Charts**: Recharts
- **UI Components**: Radix UI + Shadcn/ui

## Quick Start with Docker

```bash
# Clone the repository
git clone <repository-url>
cd analytics-dashboard

# Start with Docker Compose
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Database: PostgreSQL on port 5432

## Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn

### Frontend Development
```bash
npm install
npm run dev
```

### API Development  
```bash
cd api
npm install
npm run dev
```

### Building for Production
```bash
npm run build
```

## Default Login Credentials

- **Admin**: admin@example.com / admin123
- **User**: user@example.com / admin123

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/analytics_db

# JWT Secret
JWT_SECRET=your-secret-key

# SMTP Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com  
SMTP_PASS=your-app-password

# OpenAI API (optional, for LLM integration)
OPENAI_API_KEY=your-openai-api-key
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Data Endpoints
- `GET /api/membership` - Get membership data
- `GET /api/calls` - Get call data  
- `GET /api/headcount` - Get headcount data
- `GET /api/forecast` - Get forecast scenarios

### Integrations
- `POST /api/integrations/llm/invoke` - Invoke LLM
- `POST /api/integrations/email/send` - Send email
- `POST /api/integrations/file/upload` - Upload file

## License

MIT License