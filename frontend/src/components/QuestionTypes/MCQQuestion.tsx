import { useMemo } from 'react';
import { Question, Answer } from '../../../types/question';

interface MCQQuestionProps {
  question: Question;
  answer?: Answer;
  onChange?: (answer: string) => void;
  reviewMode?: boolean;
  randomizeOptions?: boolean;
}

export const MCQQuestion: React.FC<MCQQuestionProps> = ({ question, answer, onChange, reviewMode, randomizeOptions = false }) => {
  const selectedAnswer = answer?.answer_text || '';

  // Create shuffled options with mapping
  const { shuffledOptions, indexMapping } = useMemo(() => {
    const options = question.options || [];
    if (!randomizeOptions || reviewMode) {
      return {
        shuffledOptions: options.map((opt, idx) => ({ option: opt, originalIndex: idx })),
        indexMapping: options.map((_, idx) => idx),
      };
    }

    // Fisher-Yates shuffle
    const shuffled = options.map((opt, idx) => ({ option: opt, originalIndex: idx }));
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const mapping = shuffled.map((item) => item.originalIndex);
    return { shuffledOptions: shuffled, indexMapping: mapping };
  }, [question.options, randomizeOptions, reviewMode]);

  const handleChange = (shuffledIndex: number) => {
    if (!reviewMode && onChange) {
      // Map shuffled index back to original index
      const originalIndex = indexMapping[shuffledIndex];
      onChange(originalIndex.toString());
    }
  };

  const isCorrect = answer?.is_correct;
  const correctAnswer = question.correct_answer;

  return (
    <div className="space-y-3">
      <p className="text-lg font-medium">{question.prompt}</p>
      <div className="space-y-2">
        {shuffledOptions.map((item, shuffledIndex) => {
          const originalIndex = item.originalIndex;
          const isSelected = selectedAnswer === originalIndex.toString();
          const isCorrectOption = correctAnswer === originalIndex || (Array.isArray(correctAnswer) && correctAnswer.includes(originalIndex));
          
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
              key={shuffledIndex}
              type="button"
              onClick={() => handleChange(shuffledIndex)}
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
                <span>{item.option}</span>
                {reviewMode && isCorrectOption && (
                  <span className="ml-auto text-green-600 font-medium">✓ Correct</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {reviewMode && answer?.ai_feedback && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
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

