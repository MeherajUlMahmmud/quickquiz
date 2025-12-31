import { Question, Answer } from '../../../types/question';

interface DescriptiveQuestionProps {
  question: Question;
  answer?: Answer;
  onChange?: (answer: string) => void;
  reviewMode?: boolean;
}

export const DescriptiveQuestion: React.FC<DescriptiveQuestionProps> = ({ question, answer, onChange, reviewMode }) => {
  const answerText = answer?.answer_text || '';

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!reviewMode && onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-lg font-medium">{question.prompt}</p>
      <textarea
        value={answerText}
        onChange={handleChange}
        disabled={reviewMode}
        rows={6}
        className={`w-full border rounded-md px-3 py-2 ${
          reviewMode
            ? answer?.is_correct
              ? "bg-green-50 border-green-500"
              : "bg-gray-50 border-gray-300"
            : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
        }`}
        placeholder="Enter your answer here..."
      />
      {reviewMode && answer?.ai_feedback && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm font-medium text-blue-900 mb-1">AI Feedback:</p>
          <p className="text-sm text-blue-800">{answer.ai_feedback}</p>
        </div>
      )}
      {reviewMode && answer && (
        <div className="mt-2 text-sm text-gray-600">
          Points earned: {answer.points_earned} / {question.points}
        </div>
      )}
    </div>
  );
};

