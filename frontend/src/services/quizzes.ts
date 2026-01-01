import { ApiHandler } from './api';
import { Quiz, CreateQuizData } from '../types/quiz';

const getToken = (): string => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
};

export const quizService = {
  createQuiz: async (data: CreateQuizData): Promise<Quiz> => {
    const token = getToken();
    const response = await ApiHandler.sendPostRequest('/quizzes', data, token);
    return response.data.data;
  },

  getQuiz: async (id: number): Promise<Quiz> => {
    const token = getToken();
    const response = await ApiHandler.sendGetRequest(`/quizzes/${id}`, token);
    return response.data.data;
  },

  getQuizByShareCode: async (shareCode: string): Promise<Quiz> => {
    const response = await ApiHandler.sendUnauthenticatedGetRequest(`/quizzes/share/${shareCode}`);
    return response.data.data;
  },

  updateQuiz: async (id: number, data: Partial<CreateQuizData>): Promise<Quiz> => {
    const token = getToken();
    const response = await ApiHandler.sendPatchRequest(`/quizzes/${id}`, data, token);
    return response.data.data;
  },

  deleteQuiz: async (id: number): Promise<void> => {
    const token = getToken();
    await ApiHandler.sendDeleteRequest(`/quizzes/${id}`, token);
  },

  listQuizzes: async (): Promise<Quiz[]> => {
    const token = getToken();
    const response = await ApiHandler.sendGetRequest('/quizzes', token);
    return response.data.data;
  },
};

