import { useMemo } from 'react';
import { Question } from '@/types/question';
import { Answer } from '@/types/attempt';

interface TrueFalseQuestionProps {
  question: Question;
  answer?: Answer;
  onChange?: (answer: string) => void;
  reviewMode?: boolean;
  randomizeOptions?: boolean;
}

export const TrueFalseQuestion: React.FC<TrueFalseQuestionProps> = ({ question, answer, onChange, reviewMode, randomizeOptions = false }) => {
  const selectedAnswer = answer?.answer_text || '';
  const correctAnswer = question.correct_answer === true || question.correct_answer === 'true';

  // Create shuffled True/False options
  const shuffledOptions = useMemo(() => {
    const options = [true, false];
    if (!randomizeOptions || reviewMode) {
      return options;
    }
    // Randomly swap True and False
    return Math.random() > 0.5 ? [false, true] : [true, false];
  }, [randomizeOptions, reviewMode]);

  const handleChange = (value: boolean) => {
    if (!reviewMode && onChange) {
      onChange(value ? 'true' : 'false');
    }
  };

  // const isCorrect = answer?.is_correct;
  const userAnswer = selectedAnswer === 'true' || selectedAnswer === '1';

  return (
    <div className="space-y-3">
      <p className="text-lg font-medium">{question.prompt}</p>
      <div className="space-y-2">
        {shuffledOptions.map((value) => {
          const isSelected = (value && userAnswer) || (!value && !userAnswer);
          const isCorrectOption = value === correctAnswer;
          
          let className = "w-full text-left px-4 py-3 border rounded-md transition-colors";
          
          if (reviewMode) {
            if (isCorrectOption) {
              className += " bg-green-50 border-green-500";
            } else if (isSelected && !isCorrectOption) {
              className += " bg-red-50 border-red-500";
            } else {
              className += " border-gray-300";
            }
          } else {
            className += isSelected
              ? " bg-indigo-50 border-indigo-500"
              : " border-gray-300 hover:border-indigo-300";
          }

          return (
            <button
              key={String(value)}
              type="button"
              onClick={() => handleChange(value)}
              disabled={reviewMode}
              className={className}
            >
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                  isSelected
                    ? reviewMode && isCorrectOption
                      ? "bg-green-500 border-green-500"
                      : reviewMode && !isCorrectOption
                      ? "bg-red-500 border-red-500"
                      : "bg-indigo-500 border-indigo-500"
                    : "border-gray-400"
                }`} />
                <span>{value ? 'True' : 'False'}</span>
                {reviewMode && isCorrectOption && (
                  <span className="ml-auto text-green-600 font-medium">✓ Correct</span>
                )}
              </div>
            </button>
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

