import api from './api';
import { Attempt, StartAttemptData, SaveAnswerData } from '../types/attempt';

export const attemptService = {
  startAttempt: async (quizId: number, data?: StartAttemptData): Promise<Attempt> => {
    const response = await api.post<Attempt>(`/attempts/quizzes/${quizId}/attempts`, data || {});
    return response.data;
  },

  saveAnswer: async (attemptId: number, data: SaveAnswerData): Promise<void> => {
    await api.post(`/attempts/${attemptId}/answers`, data);
  },

  updateAttempt: async (attemptId: number, data: Partial<StartAttemptData>): Promise<Attempt> => {
    const response = await api.put<Attempt>(`/attempts/${attemptId}`, data);
    return response.data;
  },

  submitAttempt: async (attemptId: number): Promise<Attempt> => {
    const response = await api.post<Attempt>(`/attempts/${attemptId}/submit`);
    return response.data;
  },

  getAttempt: async (attemptId: number): Promise<Attempt> => {
    const response = await api.get<Attempt>(`/attempts/${attemptId}`);
    return response.data;
  },
};

