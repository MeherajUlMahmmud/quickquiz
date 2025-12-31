// Base API URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// App Routes (Frontend URLs)
export const APP_ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    CREATE_QUIZ: '/quizzes/create',
    EDIT_QUIZ: (id: number | string) => `/quizzes/${id}/edit`,
    PUBLIC_QUIZ: (shareCode: string) => `/quiz/${shareCode}`,
    TAKE_QUIZ: (shareCode: string) => `/quiz/${shareCode}/take`,
    QUIZ_RESULTS: (attemptId: number | string) => `/attempts/${attemptId}/results`,
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
