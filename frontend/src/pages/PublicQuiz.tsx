import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../services/quizzes';
import { Quiz } from '../types/quiz';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Loader2, FileQuestion, Clock, Play, AlertCircle } from 'lucide-react';

export const PublicQuiz: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shareCode) {
      loadQuiz();
    }
  }, [shareCode]);

  const loadQuiz = async () => {
    try {
      const data = await quizService.getQuizByShareCode(shareCode!);
      setQuiz(data);
    } catch (error) {
      console.error('Failed to load quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    navigate(`/quiz/${shareCode}/take`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <CardTitle className="mb-2">Quiz not found</CardTitle>
            <CardDescription>
              The quiz you're looking for doesn't exist or has been deleted.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-6 w-6" />
              {quiz.title}
            </CardTitle>
            {quiz.description && (
              <CardDescription>{quiz.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-2">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <FileQuestion className="h-4 w-4" />
                {quiz.questions?.length || 0} questions
              </p>
              {quiz.settings?.time_limit && (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time limit: {quiz.settings.time_limit} minutes
                </p>
              )}
            </div>

            <Button
              onClick={handleStart}
              className="w-full"
              size="lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Start {quiz.is_survey ? 'Survey' : 'Quiz'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

