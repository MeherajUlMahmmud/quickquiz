import { Question } from "./question";

export interface QuizSettings {
  allow_ai_evaluation: boolean;
  time_limit?: number;
  show_results_immediately: boolean;
  allow_retake: boolean;
  randomize_question_order: boolean;
  randomize_answer_options: boolean;
  enable_anti_cheating: boolean;
  custom_fields?: Record<string, any>[];
}

export interface Quiz {
  id: number;
  creator_id: number;
  title: string;
  description?: string;
  is_survey: boolean;
  requires_login: boolean;
  share_code: string;
  created_at: string;
  updated_at: string;
  settings?: QuizSettings;
  questions?: Question[];
}

export interface CreateQuizData {
  title: string;
  description?: string;
  is_survey?: boolean;
  requires_login?: boolean;
  allow_ai_evaluation?: boolean;
  time_limit?: number;
  show_results_immediately?: boolean;
  allow_retake?: boolean;
  randomize_question_order?: boolean;
  randomize_answer_options?: boolean;
  enable_anti_cheating?: boolean;
  custom_fields?: Record<string, any>[];
}

