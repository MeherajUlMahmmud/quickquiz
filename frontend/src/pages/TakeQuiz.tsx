import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../services/quizzes';
import { attemptService } from '../services/attempts';
import { useAuth } from '../hooks/useAuth';
import { useAntiCheating } from '../hooks/useAntiCheating';
import { Quiz } from '../types/quiz';
import { Attempt, Answer } from '../types/attempt';
import { ParticipantForm } from '../components/ParticipantForm';
import { MCQQuestion } from '../components/QuestionTypes/MCQQuestion';
import { DescriptiveQuestion } from '../components/QuestionTypes/DescriptiveQuestion';
import { FillBlankQuestion } from '../components/QuestionTypes/FillBlankQuestion';
import { TrueFalseQuestion } from '../components/QuestionTypes/TrueFalseQuestion';
import { AntiCheatingWarning } from '../components/AntiCheatingWarning';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, ChevronLeft, ChevronRight, Clock, CheckCircle2, FileQuestion } from 'lucide-react';

export const TakeQuiz: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [warningMessage, setWarningMessage] = useState('');

  // Randomize questions if enabled
  const randomizedQuestions = useMemo(() => {
    if (!quiz?.questions) return [];
    const questions = [...quiz.questions];
    if (quiz.settings?.randomize_question_order) {
      // Fisher-Yates shuffle
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
    }
    return questions;
  }, [quiz?.questions, quiz?.settings?.randomize_question_order]);

  // Anti-cheating hook
  const { isWarningVisible, shouldBlock } = useAntiCheating({
    enabled: quiz?.settings?.enable_anti_cheating || false,
    onViolation: (type) => {
      const messages: Record<string, string> = {
        copy: 'Copying is disabled during the quiz',
        paste: 'Pasting is disabled during the quiz',
        cut: 'Cutting is disabled during the quiz',
        right_click: 'Right-click is disabled during the quiz',
        tab_switch: 'Tab switching detected',
        window_blur: 'Window focus lost',
        devtools_shortcut: 'Developer tools are disabled',
        max_violations: 'Maximum violations reached. Quiz may be submitted automatically.',
      };
      setWarningMessage(messages[type] || 'Violation detected');
      if (type === 'max_violations') {
        setTimeout(() => {
          handleSubmit();
        }, 2000);
      }
    },
    maxViolations: 3,
  });

  useEffect(() => {
    if (shareCode) {
      loadQuiz();
    }
  }, [shareCode]);

  useEffect(() => {
    if (quiz && !showParticipantForm && !attempt) {
      checkParticipantForm();
    }
  }, [quiz, isAuthenticated]);

  useEffect(() => {
    if (attempt) {
      loadAnswers();
      startTimer();
    }
  }, [attempt]);

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

  const checkParticipantForm = () => {
    if (quiz?.requires_login && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!quiz?.requires_login) {
      setShowParticipantForm(true);
    } else {
      startAttempt();
    }
  };

  const startAttempt = async (participantData?: any) => {
    try {
      const data = await attemptService.startAttempt(quiz!.id, participantData);
      setAttempt(data);
      setShowParticipantForm(false);
    } catch (error) {
      console.error('Failed to start attempt:', error);
      alert('Failed to start quiz');
    }
  };

  const loadAnswers = async () => {
    if (!attempt) return;
    try {
      const attemptData = await attemptService.getAttempt(attempt.id);
      const answersMap: Record<number, string> = {};
      attemptData.answers?.forEach((ans) => {
        answersMap[ans.question_id] = ans.answer_text;
      });
      setAnswers(answersMap);
    } catch (error) {
      console.error('Failed to load answers:', error);
    }
  };

  const startTimer = () => {
    if (!quiz?.settings?.time_limit) return;

    const timeLimitMs = quiz.settings.time_limit * 60 * 1000;
    setTimeRemaining(timeLimitMs);

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1000) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
  };

  const handleAnswerChange = async (questionId: number, answer: string) => {
    if (!attempt) return;

    setAnswers({ ...answers, [questionId]: answer });

    // Auto-save with debounce
    try {
      await attemptService.saveAnswer(attempt.id, {
        question_id: questionId,
        answer_text: answer,
      });
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const handleSubmit = async () => {
    if (!attempt) return;

    if (!window.confirm('Are you sure you want to submit? You cannot change your answers after submission.')) {
      return;
    }

    try {
      const submittedAttempt = await attemptService.submitAttempt(attempt.id);
      navigate(`/attempts/${submittedAttempt.id}/results`);
    } catch (error) {
      console.error('Failed to submit attempt:', error);
      alert('Failed to submit quiz');
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
        <div className="text-center">
          <FileQuestion className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Quiz not found</p>
        </div>
      </div>
    );
  }

  if (showParticipantForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="h-6 w-6" />
                {quiz.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ParticipantForm
                onSubmit={startAttempt}
                customFields={quiz.settings?.custom_fields}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!attempt || !randomizedQuestions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  const currentQuestion = randomizedQuestions[currentQuestionIndex];

  const renderQuestion = () => {
    const answer: Answer | undefined = attempt.answers?.find(
      (a) => a.question_id === currentQuestion.id
    );

    const randomizeOptions = quiz.settings?.randomize_answer_options || false;

    switch (currentQuestion.type) {
      case 'MCQ':
        return (
          <MCQQuestion
            question={currentQuestion}
            answer={answer}
            onChange={(ans) => handleAnswerChange(currentQuestion.id, ans)}
            randomizeOptions={randomizeOptions}
          />
        );
      case 'DESCRIPTIVE':
        return (
          <DescriptiveQuestion
            question={currentQuestion}
            answer={answer}
            onChange={(ans) => handleAnswerChange(currentQuestion.id, ans)}
          />
        );
      case 'FILL_BLANK':
        return (
          <FillBlankQuestion
            question={currentQuestion}
            answer={answer}
            onChange={(ans) => handleAnswerChange(currentQuestion.id, ans)}
          />
        );
      case 'TRUE_FALSE':
        return (
          <TrueFalseQuestion
            question={currentQuestion}
            answer={answer}
            onChange={(ans) => handleAnswerChange(currentQuestion.id, ans)}
            randomizeOptions={randomizeOptions}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {quiz.settings?.enable_anti_cheating && (
        <AntiCheatingWarning visible={isWarningVisible} message={warningMessage} />
      )}
      {shouldBlock && (
        <div className="fixed inset-0 bg-red-50 bg-opacity-95 z-50 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Maximum Violations Reached</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                You have exceeded the maximum number of violations. The quiz will be submitted automatically.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="h-6 w-6" />
                {quiz.title}
              </CardTitle>
              {timeRemaining !== null && (
                <div className={`text-lg font-medium flex items-center gap-2 ${
                  timeRemaining < 300000 ? 'text-red-600' : 'text-gray-700'
                }`}>
                  <Clock className="h-5 w-5" />
                  {formatTime(timeRemaining)}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{
                  width: `${((currentQuestionIndex + 1) / (randomizedQuestions.length || 1)) * 100}%`,
                }}
              />
            </div>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <FileQuestion className="h-4 w-4" />
              Question {currentQuestionIndex + 1} of {randomizedQuestions.length || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="pt-6">
            {renderQuestion()}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          {currentQuestionIndex === randomizedQuestions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={() =>
                setCurrentQuestionIndex(Math.min((randomizedQuestions.length || 1) - 1, currentQuestionIndex + 1))
              }
              variant="default"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

