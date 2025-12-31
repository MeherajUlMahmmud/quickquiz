import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quiz } from '../types/quiz';
import { quizService } from '../services/quizzes';
import { Pencil, Share2, Trash2, Loader2, Check, Copy } from 'lucide-react';

interface QuizCardProps {
  quiz: Quiz;
  onDelete: () => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz, onDelete }) => {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleEdit = () => {
    navigate(`/quizzes/${quiz.id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) {
      return;
    }

    setDeleting(true);
    try {
      await quizService.deleteQuiz(quiz.id);
      onDelete();
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      alert('Failed to delete quiz');
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/quiz/${quiz.share_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{quiz.title}</h3>
          <span className="text-xs text-gray-500">
            {quiz.is_survey ? 'Survey' : 'Quiz'}
          </span>
        </div>
        {quiz.description && (
          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{quiz.description}</p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Share2 className="h-3 w-3" />
            Share Code: <span className="font-mono">{quiz.share_code}</span>
          </span>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-900"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-900"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Share
              </>
            )}
          </button>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-900 disabled:opacity-50"
        >
          {deleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Delete
            </>
          )}
        </button>
      </div>
    </div>
  );
};

