export interface ParticipantInfo {
  [key: string]: any;
}

export interface Attempt {
  id: number;
  quiz_id: number;
  user_id?: number;
  participant_name?: string;
  participant_info?: ParticipantInfo;
  started_at: string;
  submitted_at?: string;
  score?: number;
  total_points?: number;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  answers?: Answer[];
  quiz?: {
    id: number;
    title: string;
    description?: string;
    share_code?: string;
    total_points?: number;
  };
}

export interface Answer {
  id: number;
  attempt_id: number;
  question_id: number;
  answer_text: string;
  is_correct?: boolean;
  ai_feedback?: string;
  points_earned: number;
  created_at?: string;
}

export interface StartAttemptData {
  participant_name?: string;
  participant_info?: ParticipantInfo;
}

export interface SaveAnswerData {
  question_id: number;
  answer_text: string;
}

