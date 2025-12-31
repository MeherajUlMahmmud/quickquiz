import api from './api';
import { Question, CreateQuestionData, GenerateQuestionsData } from '../types/question';

export const questionService = {
  createQuestion: async (quizId: number, data: CreateQuestionData): Promise<Question> => {
    const response = await api.post<Question>(`/questions/quizzes/${quizId}/questions`, data);
    return response.data;
  },

  getQuestions: async (quizId: number): Promise<Question[]> => {
    const response = await api.get<Question[]>(`/questions/quizzes/${quizId}/questions`);
    return response.data;
  },

  updateQuestion: async (id: number, data: Partial<CreateQuestionData>): Promise<Question> => {
    const response = await api.put<Question>(`/questions/${id}`, data);
    return response.data;
  },

  deleteQuestion: async (id: number): Promise<void> => {
    await api.delete(`/questions/${id}`);
  },

  generateQuestions: async (quizId: number, data: GenerateQuestionsData): Promise<{ questions: Question[] }> => {
    const response = await api.post<{ questions: Question[] }>(`/questions/quizzes/${quizId}/questions/generate`, data);
    return response.data;
  },

  reorderQuestions: async (quizId: number, orders: Record<number, number>): Promise<void> => {
    await api.post('/questions/reorder', { quiz_id: quizId, orders });
  },
};

