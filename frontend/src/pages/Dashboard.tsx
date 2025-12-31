import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizService } from '../services/quizzes';
import { Quiz } from '../types/quiz';
import { QuizCard } from '../components/QuizCard';
import { Loader2, Plus, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const data = await quizService.listQuizzes();
      setQuizzes(data);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = () => {
    navigate('/quizzes/create');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6" />
              My Quizzes
            </h2>
            <Button
              onClick={handleCreateQuiz}
              variant="default"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          </div>

          {quizzes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No quizzes yet. Create your first quiz!</p>
              <Button
                onClick={handleCreateQuiz}
                variant="default"
                size="lg"
                className="mx-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Quiz
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} onDelete={loadQuizzes} />
              ))}
            </div>
          )}
        </div>
    </div>
  );
};

