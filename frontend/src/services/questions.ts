import { ApiHandler } from './api';
import { Question, CreateQuestionData, GenerateQuestionsData } from '../types/question';

const getToken = (): string => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
};

export const questionService = {
  createQuestion: async (quizId: number, data: CreateQuestionData): Promise<Question> => {
    const token = getToken();
    const response = await ApiHandler.sendPostRequest(`/questions/quizzes/${quizId}/questions`, data, token);
    return response.data.data;
  },

  getQuestions: async (quizId: number): Promise<Question[]> => {
    const token = getToken();
    const response = await ApiHandler.sendGetRequest(`/questions/quizzes/${quizId}/questions`, token);
    return response.data.data;
  },

  updateQuestion: async (id: number, data: Partial<CreateQuestionData>): Promise<Question> => {
    const token = getToken();
    const response = await ApiHandler.sendPatchRequest(`/questions/${id}`, data, token);
    return response.data.data;
  },

  deleteQuestion: async (id: number): Promise<void> => {
    const token = getToken();
    await ApiHandler.sendDeleteRequest(`/questions/${id}`, token);
  },

  generateQuestions: async (quizId: number, data: GenerateQuestionsData): Promise<{ questions: Question[] }> => {
    const token = getToken();
    const response = await ApiHandler.sendPostRequest(`/questions/quizzes/${quizId}/questions/generate`, data, token);
    return response.data.data;
  },

  reorderQuestions: async (quizId: number, orders: Record<number, number>): Promise<void> => {
    const token = getToken();
    await ApiHandler.sendPostRequest('/questions/reorder', { quiz_id: quizId, orders }, token);
  },
};

