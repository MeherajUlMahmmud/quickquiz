import { Question, Answer } from '../../../types/question';

interface FillBlankQuestionProps {
  question: Question;
  answer?: Answer;
  onChange?: (answer: string) => void;
  reviewMode?: boolean;
}

export const FillBlankQuestion: React.FC<FillBlankQuestionProps> = ({ question, answer, onChange, reviewMode }) => {
  const answerText = answer?.answer_text || '';
  const answers = answerText.split('|').filter(a => a.trim() !== '');
  const correctAnswers = Array.isArray(question.correct_answer)
    ? question.correct_answer
    : [question.correct_answer];

  // Simple parsing - in a real app, you'd parse the prompt to find blanks
  const parts = question.prompt.split(/_+/);
  const blankCount = Math.max(parts.length - 1, correctAnswers.length);

  const handleChange = (index: number, value: string) => {
    if (!reviewMode && onChange) {
      const newAnswers = [...answers];
      newAnswers[index] = value;
      onChange(newAnswers.join('|'));
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-lg font-medium mb-4">{question.prompt}</p>
      <div className="space-y-3">
        {Array.from({ length: blankCount }).map((_, index) => {
          const value = answers[index] || '';
          const correctAnswer = correctAnswers[index];
          const isCorrect = reviewMode && answer
            ? value.toLowerCase().trim() === String(correctAnswer).toLowerCase().trim()
            : undefined;

          return (
            <div key={index} className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Blank {index + 1}:
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => handleChange(index, e.target.value)}
                disabled={reviewMode}
                className={`w-full border rounded-md px-3 py-2 ${
                  reviewMode
                    ? isCorrect
                      ? "bg-green-50 border-green-500"
                      : "bg-red-50 border-red-500"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                }`}
                placeholder={`Enter answer for blank ${index + 1}`}
              />
              {reviewMode && (
                <div className="text-sm">
                  {isCorrect ? (
                    <span className="text-green-600">✓ Correct</span>
                  ) : (
                    <span className="text-red-600">
                      ✗ Correct answer: {correctAnswer}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {reviewMode && answer && (
        <div className="mt-2 text-sm text-gray-600">
          Points earned: {answer.points_earned} / {question.points}
        </div>
      )}
    </div>
  );
};

