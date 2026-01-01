import { ApiHandler } from './api';
import { Attempt, StartAttemptData, SaveAnswerData } from '../types/attempt';

const getToken = (): string => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
};

export const attemptService = {
  startAttempt: async (quizId: number, data?: StartAttemptData): Promise<Attempt> => {
    const token = getToken();
    const response = await ApiHandler.sendPostRequest(`/attempts/quizzes/${quizId}/attempts`, data || {}, token);
    return response.data.data;
  },

  saveAnswer: async (attemptId: number, data: SaveAnswerData): Promise<void> => {
    const token = getToken();
    await ApiHandler.sendPostRequest(`/attempts/${attemptId}/answers`, data, token);
  },

  updateAttempt: async (attemptId: number, data: Partial<StartAttemptData>): Promise<Attempt> => {
    const token = getToken();
    const response = await ApiHandler.sendPatchRequest(`/attempts/${attemptId}`, data, token);
    return response.data.data;
  },

  submitAttempt: async (attemptId: number): Promise<Attempt> => {
    const token = getToken();
    const response = await ApiHandler.sendPostRequest(`/attempts/${attemptId}/submit`, {}, token);
    return response.data.data;
  },

  getAttempt: async (attemptId: number): Promise<Attempt> => {
    const token = getToken();
    const response = await ApiHandler.sendGetRequest(`/attempts/${attemptId}`, token);
    return response.data.data;
  },

  getUserAttempts: async (): Promise<Attempt[]> => {
    const token = getToken();
    const response = await ApiHandler.sendGetRequest('/attempts/user/attempts', token);
    return response.data.data;
  },
};

