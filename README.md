# QuickQuiz - Exam Taking System

A complete exam/survey taking system with AI-powered question generation, multiple question types, flexible authentication, and AI-assisted scoring.

## Tech Stack

- **Backend**: Flask (Python), SQLAlchemy, SQLite, PyJWT
- **Frontend**: React + TypeScript + Vite, Tailwind CSS, React Router
- **AI Integration**: GroqCloud API

## Project Structure

```
quickquiz/
├── backend/          # Flask backend API
├── frontend/        # React frontend
└── TODOS.md         # Development todos
```

## Getting Started

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Initialize database:
```bash
flask db upgrade
```

6. Run the server:
```bash
python run.py
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create `.env` file:
```
VITE_API_URL=http://localhost:5000/api
```

4. Run the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Features

- ✅ User authentication (JWT)
- ✅ Quiz/Survey creation and management
- ✅ Multiple question types (MCQ, Descriptive, Fill-in-blank, True/False)
- ✅ AI-powered question generation (GroqCloud)
- ✅ Flexible authentication (creator-controlled)
- ✅ Anonymous participants support
- ✅ Auto-save during exam taking
- ✅ AI-assisted scoring for descriptive answers
- ✅ Results display with feedback
- ✅ Share quizzes via share codes

## API Endpoints

See `backend/README.md` for complete API documentation.

## Environment Variables

### Backend (.env)
- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `SECRET_KEY` - Flask secret key
- `GROQ_API_KEY` - GroqCloud API key

### Frontend (.env)
- `VITE_API_URL` - Backend API URL

## License

MIT

