# QuickQuiz Backend (Flask)

A Flask-based REST API backend for the QuickQuiz exam taking system.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Initialize database:
```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

4. Run the server:
```bash
python run.py
```

The API will be available at `http://localhost:5000/api`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Quizzes
- `POST /api/quizzes` - Create quiz (protected)
- `GET /api/quizzes` - List user's quizzes (protected)
- `GET /api/quizzes/<id>` - Get quiz details
- `GET /api/quizzes/share/<code>` - Get quiz by share code
- `PUT /api/quizzes/<id>` - Update quiz (protected, owner only)
- `DELETE /api/quizzes/<id>` - Delete quiz (protected, owner only)
- `GET /api/quizzes/<id>/attempts` - List attempts (protected, owner only)

### Questions
- `POST /api/questions/quizzes/<quiz_id>/questions` - Create question (protected)
- `POST /api/questions/quizzes/<quiz_id>/questions/generate` - Generate questions via AI (protected)
- `GET /api/questions/quizzes/<quiz_id>/questions` - Get all questions for quiz
- `PUT /api/questions/<id>` - Update question (protected)
- `DELETE /api/questions/<id>` - Delete question (protected)
- `POST /api/questions/reorder` - Reorder questions (protected)

### Attempts
- `POST /api/attempts/quizzes/<quiz_id>/attempts` - Start attempt
- `POST /api/attempts/<id>/answers` - Submit answer
- `PUT /api/attempts/<id>` - Update attempt (save progress)
- `POST /api/attempts/<id>/submit` - Submit attempt for scoring
- `GET /api/attempts/<id>` - Get attempt details and results

## Environment Variables

- `DATABASE_URL` - Database connection string (default: sqlite:///quickquiz.db)
- `JWT_SECRET` - Secret key for JWT tokens
- `SECRET_KEY` - Flask secret key
- `GROQ_API_KEY` - GroqCloud API key for AI features

