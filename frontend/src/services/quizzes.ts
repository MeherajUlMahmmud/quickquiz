import api from './api';
import { Quiz, CreateQuizData } from '../types/quiz';

export const quizService = {
  createQuiz: async (data: CreateQuizData): Promise<Quiz> => {
    const response = await api.post<Quiz>('/quizzes', data);
    return response.data;
  },

  getQuiz: async (id: number): Promise<Quiz> => {
    const response = await api.get<Quiz>(`/quizzes/${id}`);
    return response.data;
  },

  getQuizByShareCode: async (shareCode: string): Promise<Quiz> => {
    const response = await api.get<Quiz>(`/quizzes/share/${shareCode}`);
    return response.data;
  },

  updateQuiz: async (id: number, data: Partial<CreateQuizData>): Promise<Quiz> => {
    const response = await api.put<Quiz>(`/quizzes/${id}`, data);
    return response.data;
  },

  deleteQuiz: async (id: number): Promise<void> => {
    await api.delete(`/quizzes/${id}`);
  },

  listQuizzes: async (): Promise<Quiz[]> => {
    const response = await api.get<Quiz[]>('/quizzes');
    return response.data;
  },
};

