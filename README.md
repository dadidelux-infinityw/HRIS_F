# HRIS - Job Postings Management System

A modern, full-stack Human Resource Information System (HRIS) for managing job postings, built with React, FastAPI, PostgreSQL, and Docker.

## 🏗️ Architecture

```
HRIS_F/
├── frontend/              # React + TypeScript + Tailwind CSS
├── backend/              # FastAPI + SQLAlchemy + PostgreSQL
├── database/             # Database initialization scripts
├── docker-compose.yml    # Docker orchestration
└── README.md
```

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **Lucide React** for icons

### Backend
- **FastAPI** (Python 3.11)
- **SQLAlchemy** ORM
- **PostgreSQL** database
- **Pydantic** for validation

### Infrastructure
- **Docker** & **Docker Compose**
- **Nginx** for frontend serving
- **PostgreSQL 15** Alpine

## ✨ Features

### Job Postings Management
- ✅ Create job postings with multi-step wizard
- ✅ View all job postings in a grid layout
- ✅ View detailed job information
- ✅ Edit existing job postings
- ✅ Delete job postings with confirmation
- ✅ Real-time API integration
- ✅ Loading states and error handling

### Multi-Step Job Creation
1. **Basic Information** - Job Title, Department, Location
2. **Job Description** - Detailed description
3. **Requirements & Responsibilities** - Dynamic lists
4. **Application Details** - Deadline and summary

### Navigation
- HR Dashboard
- Job Postings
- Candidates (Coming soon)
- Interviews (Coming soon)
- Analytics (Coming soon)
- Reports (Coming soon)
- Settings

## 🐳 Quick Start with Docker

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### Running the Application

1. **Clone the repository**
```bash
cd HRIS_F
```

2. **Start all services**
```bash
docker-compose up -d
```

This will start:
- **Frontend**: http://localhost:8082
- **Backend API**: http://localhost:8083/api/v1
- **API Docs**: http://localhost:8083/docs
- **PostgreSQL**: localhost:5433

3. **Seed the database** (optional - for sample data)
```bash
docker-compose exec backend python seed_data.py
```

4. **Stop all services**
```bash
docker-compose down
```

5. **Stop and remove volumes** (clean slate)
```bash
docker-compose down -v
```

### Development Mode with Hot Reload

For frontend development with hot reload:
```bash
docker-compose --profile dev up
```

This starts the `frontend-dev` service on port 5173 with Vite's hot module replacement.
Open `http://localhost:5173` while editing UI files.

Important: `docker-compose up -d` serves the built `frontend` image through Nginx on port `8082`.
If you are viewing `http://localhost:8082`, source edits in `frontend/src` will not appear until you rebuild:

```bash
docker-compose up -d --build frontend
```

## 💻 Local Development (Without Docker)

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. **Run the backend**
```bash
uvicorn app.main:app --reload
```

Backend will be available at http://localhost:8000

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.development
# Edit .env.development if needed
```

4. **Run the development server**
```bash
npm run dev
```

Frontend will be available at http://localhost:5173

## 📡 API Endpoints

### Job Postings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/job-postings/` | Get all job postings |
| GET | `/api/v1/job-postings/{id}` | Get specific job posting |
| POST | `/api/v1/job-postings/` | Create new job posting |
| PUT | `/api/v1/job-postings/{id}` | Update job posting |
| DELETE | `/api/v1/job-postings/{id}` | Delete job posting |

### API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:8083/docs
- **ReDoc**: http://localhost:8083/redoc

## 🗄️ Database Schema

### job_postings Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_title | VARCHAR(255) | Job title |
| department | VARCHAR(100) | Department name |
| location | VARCHAR(100) | Job location |
| status | ENUM | Active/Inactive/Closed |
| date_posted | DATE | Posting date |
| application_deadline | DATE | Application deadline |
| description | TEXT | Job description |
| requirements | JSON | Array of requirements |
| responsibilities | JSON | Array of responsibilities |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/hris_db
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost
API_V1_PREFIX=/api/v1
PROJECT_NAME=HRIS API
DEBUG=True
```

#### Frontend (.env.development)
```env
VITE_API_URL=http://localhost:8083/api/v1
```

## 🧪 Testing the Application

1. **Access the frontend**: http://localhost:8082 or http://localhost:5173
2. **View existing job postings** (if seeded)
3. **Click "Add Job Posting"** to create a new posting
4. **Fill out the 4-step form**
5. **View, edit, or delete** existing postings

## 📦 Project Structure

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── modals/
│   │   │   ├── CreateJobModal.tsx
│   │   │   ├── ViewDetailsModal.tsx
│   │   │   ├── EditJobModal.tsx
│   │   │   └── DeleteConfirmModal.tsx
│   │   ├── JobPostingCard.tsx
│   │   └── Sidebar.tsx
│   ├── services/
│   │   └── api.ts              # API service layer
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── Dockerfile
├── nginx.conf
└── package.json
```

### Backend Structure
```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   └── job_postings.py
│   │       └── api.py
│   ├── core/
│   │   └── config.py
│   ├── db/
│   │   └── database.py
│   ├── models/
│   │   └── job_posting.py
│   ├── schemas/
│   │   └── job_posting.py
│   └── main.py
├── Dockerfile
├── requirements.txt
└── seed_data.py
```

## 🎨 UI/UX Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modal-based Workflows** - Clean, focused user interactions
- **Loading States** - Visual feedback during API calls
- **Error Handling** - Graceful error messages
- **Status Badges** - Visual indicators for job status
- **Action Buttons** - Quick access to view, edit, delete
- **Multi-step Forms** - Guided job creation process

## 🔐 Security Considerations

- CORS configuration for allowed origins
- Input validation with Pydantic
- SQL injection prevention with SQLAlchemy ORM
- Environment variable management
- Prepared statements for database queries

## 🚀 Deployment

### Production Build

1. **Build images**
```bash
docker-compose build
```

2. **Run in production**
```bash
docker-compose up -d
```

3. **View logs**
```bash
docker-compose logs -f
```

### Scaling

To scale the backend:
```bash
docker-compose up -d --scale backend=3
```

## 📝 Future Enhancements

- [ ] User authentication and authorization
- [ ] Candidate management module
- [ ] Interview scheduling system
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Advanced search and filtering
- [ ] Export to PDF/Excel
- [ ] Role-based access control
- [ ] Audit logging
- [ ] Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is part of the HRIS system development.

## 🆘 Troubleshooting

### Backend won't start
- Check if PostgreSQL is running
- Verify DATABASE_URL in .env
- Check logs: `docker-compose logs backend`

### Frontend changes are not showing up
- If you opened `http://localhost:8082`, you are using the built Docker frontend.
- Rebuild it with `docker-compose up -d --build frontend`, or
- Use hot reload instead: `docker-compose --profile dev up` and open `http://localhost:5173`

### Frontend can't connect to backend
- Verify VITE_API_URL in .env.development
- Check CORS settings in backend
- Ensure backend is running on port 8083

### Database connection errors
- Wait for PostgreSQL to fully start (healthcheck)
- Check credentials in docker-compose.yml
- Verify postgres service is healthy: `docker-compose ps`

### Port conflicts
- Check if ports 5173, 5433, 8058, 8082, 8083, or 8084 are in use
- Modify port mappings in docker-compose.yml if needed

## 📞 Support

For issues and questions, please check the troubleshooting section or create an issue in the repository.
