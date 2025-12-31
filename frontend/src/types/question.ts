export type QuestionType = 'MCQ' | 'DESCRIPTIVE' | 'FILL_BLANK' | 'TRUE_FALSE';

export interface Question {
  id: number;
  quiz_id: number;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correct_answer?: any;
  points: number;
  order: number;
  created_at?: string;
}

export interface CreateQuestionData {
  type: QuestionType;
  prompt: string;
  options?: string[];
  correct_answer?: any;
  points?: number;
  order: number;
}

export interface GenerateQuestionsData {
  prompt: string;
  type: QuestionType;
  count?: number;
}

