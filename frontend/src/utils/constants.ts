// Base API URL
// Use relative path in development to leverage Vite proxy (avoids CORS)
// In production, set VITE_API_URL to full backend URL (e.g., 'https://api.example.com/api')
export const API_URL = import.meta.env.VITE_API_URL || '/api';

// App Routes (Frontend URLs)
export const APP_ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    CREATE_QUIZ: '/quizzes/create',
    EDIT_QUIZ: (id: number | string) => `/quizzes/${id}/edit`,
    EDIT_QUIZ_PATTERN: '/quizzes/:id/edit',
    PUBLIC_QUIZ: (shareCode: string) => `/quiz/${shareCode}`,
    PUBLIC_QUIZ_PATTERN: '/quiz/:shareCode',
    TAKE_QUIZ: (shareCode: string) => `/quiz/${shareCode}/take`,
    TAKE_QUIZ_PATTERN: '/quiz/:shareCode/take',
    QUIZ_RESULTS: (attemptId: number | string) => `/attempts/${attemptId}/results`,
    QUIZ_RESULTS_PATTERN: '/attempts/:id/results',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
    // Authentication
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        ME: '/auth/me',
    },

    // Quizzes
    QUIZZES: {
        BASE: '/quizzes',
        BY_ID: (id: number | string) => `/quizzes/${id}`,
        BY_SHARE_CODE: (shareCode: string) => `/quizzes/share/${shareCode}`,
        ATTEMPTS: (id: number | string) => `/quizzes/${id}/attempts`,
    },

    // Questions
    QUESTIONS: {
        BY_QUIZ: (quizId: number | string) => `/questions/quizzes/${quizId}/questions`,
        GENERATE: (quizId: number | string) => `/questions/quizzes/${quizId}/questions/generate`,
        BY_ID: (id: number | string) => `/questions/${id}`,
        REORDER: '/questions/reorder',
    },

    // Attempts
    ATTEMPTS: {
        START: (quizId: number | string) => `/attempts/quizzes/${quizId}/attempts`,
        BY_ID: (id: number | string) => `/attempts/${id}`,
        ANSWERS: (id: number | string) => `/attempts/${id}/answers`,
        SUBMIT: (id: number | string) => `/attempts/${id}/submit`,
    },
} as const;
