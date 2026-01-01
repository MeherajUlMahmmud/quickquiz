import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptService } from '@/services/attempts';
import { quizService } from '@/services/quizzes';
import { Attempt } from '@/types/attempt';
import { Quiz } from '@/types/quiz';
import { Question } from '@/types/question';
import { MCQQuestion } from '@/components/QuestionTypes/MCQQuestion';
import { DescriptiveQuestion } from '@/components/QuestionTypes/DescriptiveQuestion';
import { FillBlankQuestion } from '@/components/QuestionTypes/FillBlankQuestion';
import { TrueFalseQuestion } from '@/components/QuestionTypes/TrueFalseQuestion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/Layout';
import { Loader2, Trophy, Award, FileQuestion, ArrowLeft, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export const QuizResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadResults();
    }
  }, [id]);

  const loadResults = async () => {
    try {
      setError(null);
      const attemptData = await attemptService.getAttempt(parseInt(id!));
      
      if (!attemptData) {
        setError('Attempt not found');
        setLoading(false);
        return;
      }
      
      setAttempt(attemptData);
      
      // Try to get quiz with questions
      let quizData: Quiz;
      try {
        quizData = await quizService.getQuiz(attemptData.quiz_id);
        
        // If quiz doesn't have questions, try to get via share code (public access includes questions)
        if (!quizData.questions || quizData.questions.length === 0) {
          // If we have share_code, try loading via public endpoint which includes questions
          if (quizData.share_code) {
            try {
              const publicQuizData = await quizService.getQuizByShareCode(quizData.share_code);
              if (publicQuizData.questions && publicQuizData.questions.length > 0) {
                quizData = publicQuizData;
              }
            } catch (shareCodeError) {
              console.error('Failed to load quiz by share code:', shareCodeError);
            }
          }
        }
        
        // If still no questions, show error
        if (!quizData.questions || quizData.questions.length === 0) {
          setError('Quiz questions not available. You may not have permission to view these results.');
          setLoading(false);
          return;
        }
      } catch (quizError: any) {
        console.error('Failed to load quiz:', quizError);
        const errorMsg = quizError.response?.data?.error || 'Failed to load quiz data';
        throw new Error(errorMsg);
      }
      
      setQuiz(quizData);
    } catch (error: any) {
      console.error('Failed to load results:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load results';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        </div>
      </Layout>
    );
  }

  if (!attempt || !quiz || !quiz.questions) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <CardTitle className="mb-2">Results not found</CardTitle>
              <p className="text-gray-600 mb-4">
                {error || 'The results you\'re looking for don\'t exist or you don\'t have permission to view them.'}
              </p>
              <Button
                onClick={() => navigate('/dashboard')}
                variant="default"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const totalPoints = attempt.total_points || 0;
  const scorePercentage = totalPoints > 0 && attempt.score !== undefined
    ? Math.round((attempt.score / totalPoints) * 100)
    : (attempt.score === 0 && totalPoints === 0 ? 0 : 0);

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

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
    <Layout>
      <div className="py-8">
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
                <p className="text-xl text-gray-600 flex items-center justify-center gap-2 mb-4">
                  <Award className="h-5 w-5" />
                  Score: {(attempt.score ?? 0).toFixed(1)} / {totalPoints.toFixed(1)} points
                </p>
                <div className="flex flex-col gap-2 text-sm text-gray-500 mt-4">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Started: {formatDateTime(attempt.started_at)}</span>
                  </div>
                  {attempt.submitted_at && (
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Submitted: {formatDateTime(attempt.submitted_at)}</span>
                    </div>
                  )}
                </div>
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
    </Layout>
  );
};

