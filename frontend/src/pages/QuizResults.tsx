import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptService } from '../services/attempts';
import { quizService } from '../services/quizzes';
import { Attempt } from '../types/attempt';
import { Quiz } from '../types/quiz';
import { Question } from '../types/question';
import { MCQQuestion } from '../components/QuestionTypes/MCQQuestion';
import { DescriptiveQuestion } from '../components/QuestionTypes/DescriptiveQuestion';
import { FillBlankQuestion } from '../components/QuestionTypes/FillBlankQuestion';
import { TrueFalseQuestion } from '../components/QuestionTypes/TrueFalseQuestion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, Trophy, Award, FileQuestion, ArrowLeft } from 'lucide-react';

export const QuizResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadResults();
    }
  }, [id]);

  const loadResults = async () => {
    try {
      const attemptData = await attemptService.getAttempt(parseInt(id!));
      setAttempt(attemptData);
      
      const quizData = await quizService.getQuiz(attemptData.quiz_id);
      setQuiz(quizData);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!attempt || !quiz || !quiz.questions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileQuestion className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Results not found</p>
        </div>
      </div>
    );
  }

  const scorePercentage = attempt.total_points
    ? Math.round((attempt.score! / attempt.total_points) * 100)
    : 0;

  const renderQuestion = (question: Question) => {
    const answer = attempt.answers?.find((a) => a.question_id === question.id);

    switch (question.type) {
      case 'MCQ':
        return (
          <MCQQuestion
            question={question}
            answer={answer}
            reviewMode={true}
          />
        );
      case 'DESCRIPTIVE':
        return (
          <DescriptiveQuestion
            question={question}
            answer={answer}
            reviewMode={true}
          />
        );
      case 'FILL_BLANK':
        return (
          <FillBlankQuestion
            question={question}
            answer={answer}
            reviewMode={true}
          />
        );
      case 'TRUE_FALSE':
        return (
          <TrueFalseQuestion
            question={question}
            answer={answer}
            reviewMode={true}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Quiz Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-indigo-600 mb-2 flex items-center justify-center gap-2">
                <Trophy className="h-12 w-12" />
                {scorePercentage}%
              </div>
              <p className="text-xl text-gray-600 flex items-center justify-center gap-2">
                <Award className="h-5 w-5" />
                Score: {attempt.score?.toFixed(1)} / {attempt.total_points?.toFixed(1)} points
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {quiz.questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileQuestion className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">
                    Question {index + 1} ({question.points} points)
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {renderQuestion(question)}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="default"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

