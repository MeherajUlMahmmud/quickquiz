import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../services/quizzes';
import { questionService } from '../services/questions';
import { Quiz } from '../types/quiz';
import { Question, CreateQuestionData, GenerateQuestionsData } from '../types/question';
import { QuestionEditor } from '../components/QuestionEditor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Sparkles, Plus, Pencil, Trash2, Loader2, Bot, Award, FileQuestion, CheckCircle2, Type, Minus, Settings, Save, Clock, Eye, RotateCcw, Sparkles as SparklesIcon } from 'lucide-react';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';

export const EditQuiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiType, setAiType] = useState<'MCQ' | 'DESCRIPTIVE' | 'FILL_BLANK' | 'TRUE_FALSE'>('MCQ');
  const [aiCount, setAiCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizSettings, setQuizSettings] = useState({
    allow_ai_evaluation: false,
    time_limit: undefined as number | undefined,
    show_results_immediately: true,
    allow_retake: false,
    randomize_question_order: false,
    randomize_answer_options: false,
    enable_anti_cheating: false,
    is_survey: false,
    requires_login: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadQuiz();
      loadQuestions();
    }
  }, [id]);

  const loadQuiz = async () => {
    try {
      const data = await quizService.getQuiz(parseInt(id!));
      setQuiz(data);
      setQuizTitle(data.title);
      setQuizDescription(data.description || '');
      setQuizSettings({
        allow_ai_evaluation: data.settings?.allow_ai_evaluation || false,
        time_limit: data.settings?.time_limit,
        show_results_immediately: data.settings?.show_results_immediately ?? true,
        allow_retake: data.settings?.allow_retake || false,
        randomize_question_order: data.settings?.randomize_question_order || false,
        randomize_answer_options: data.settings?.randomize_answer_options || false,
        enable_anti_cheating: data.settings?.enable_anti_cheating || false,
        is_survey: data.is_survey,
        requires_login: data.requires_login,
      });
    } catch (error) {
      console.error('Failed to load quiz:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      const data = await questionService.getQuestions(parseInt(id!));
      setQuestions(data);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!aiPrompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setGenerating(true);
    try {
      const data: GenerateQuestionsData = {
        prompt: aiPrompt,
        type: aiType,
        count: aiCount,
      };
      const result = await questionService.generateQuestions(parseInt(id!), data);
      setQuestions([...questions, ...result.questions]);
      setAiPrompt('');
      setShowAIGenerator(false);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      alert('Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveQuestion = async (data: CreateQuestionData) => {
    try {
      if (editingQuestion) {
        await questionService.updateQuestion(editingQuestion.id, data);
      } else {
        await questionService.createQuestion(parseInt(id!), data);
      }
      setShowQuestionEditor(false);
      setEditingQuestion(null);
      loadQuestions();
    } catch (error) {
      console.error('Failed to save question:', error);
      alert('Failed to save question');
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await questionService.deleteQuestion(questionId);
      loadQuestions();
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('Failed to delete question');
    }
  };

  const handleSaveQuiz = async () => {
    if (!quizTitle.trim()) {
      alert('Quiz title is required');
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        title: quizTitle,
        description: quizDescription || undefined,
        is_survey: quizSettings.is_survey,
        requires_login: quizSettings.requires_login,
        allow_ai_evaluation: quizSettings.allow_ai_evaluation,
        time_limit: quizSettings.time_limit || undefined,
        show_results_immediately: quizSettings.show_results_immediately,
        allow_retake: quizSettings.allow_retake,
        randomize_question_order: quizSettings.randomize_question_order,
        randomize_answer_options: quizSettings.randomize_answer_options,
        enable_anti_cheating: quizSettings.enable_anti_cheating,
      };

      await quizService.updateQuiz(parseInt(id!), updateData);
      await loadQuiz();
      setShowSettingsDialog(false);
    } catch (error) {
      console.error('Failed to save quiz:', error);
      alert('Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle>{quiz.title}</CardTitle>
                {quiz.description && <CardDescription>{quiz.description}</CardDescription>}
              </div>
              <Button
                onClick={() => setShowSettingsDialog(true)}
                variant="outline"
                size="sm"
              >
                <Settings className="mr-2 h-4 w-4" />
                Edit Quiz & Settings
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Dialog 
          open={showSettingsDialog} 
          onOpenChange={setShowSettingsDialog}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Edit Quiz & Settings
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div>
                <Label htmlFor="quiz-title">Quiz Title</Label>
                <Input
                  id="quiz-title"
                  className="mt-1"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Enter quiz title"
                />
              </div>

              <div>
                <Label htmlFor="quiz-description">Description</Label>
                <Textarea
                  id="quiz-description"
                  className="mt-1"
                  rows={3}
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder="Enter quiz description (optional)"
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-sm">Quiz Type</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_survey"
                    checked={quizSettings.is_survey}
                    onCheckedChange={(checked) => 
                      setQuizSettings({ ...quizSettings, is_survey: checked as boolean })
                    }
                  />
                  <Label htmlFor="is_survey" className="cursor-pointer">
                    This is a survey (no correct answers)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requires_login"
                    checked={quizSettings.requires_login}
                    onCheckedChange={(checked) => 
                      setQuizSettings({ ...quizSettings, requires_login: checked as boolean })
                    }
                  />
                  <Label htmlFor="requires_login" className="cursor-pointer">
                    Require login to take quiz
                  </Label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Quiz Settings
                </h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allow_ai_evaluation"
                    checked={quizSettings.allow_ai_evaluation}
                    onCheckedChange={(checked) => 
                      setQuizSettings({ ...quizSettings, allow_ai_evaluation: checked as boolean })
                    }
                  />
                  <Label htmlFor="allow_ai_evaluation" className="cursor-pointer flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4" />
                    Allow AI evaluation for descriptive questions
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show_results_immediately"
                    checked={quizSettings.show_results_immediately}
                    onCheckedChange={(checked) => 
                      setQuizSettings({ ...quizSettings, show_results_immediately: checked as boolean })
                    }
                  />
                  <Label htmlFor="show_results_immediately" className="cursor-pointer flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Show results immediately after submission
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allow_retake"
                    checked={quizSettings.allow_retake}
                    onCheckedChange={(checked) => 
                      setQuizSettings({ ...quizSettings, allow_retake: checked as boolean })
                    }
                  />
                  <Label htmlFor="allow_retake" className="cursor-pointer flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Allow retake
                  </Label>
                </div>

                <div>
                  <Label htmlFor="time_limit" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Limit (minutes)
                  </Label>
                  <Input
                    id="time_limit"
                    type="number"
                    min="1"
                    className="mt-1"
                    value={quizSettings.time_limit || ''}
                    onChange={(e) => 
                      setQuizSettings({ 
                        ...quizSettings, 
                        time_limit: e.target.value ? parseInt(e.target.value) : undefined 
                      })
                    }
                    placeholder="Leave empty for no time limit"
                  />
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-sm">Randomization & Security</h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="randomize_question_order"
                    checked={quizSettings.randomize_question_order}
                    onCheckedChange={(checked) => 
                      setQuizSettings({ ...quizSettings, randomize_question_order: checked as boolean })
                    }
                  />
                  <Label htmlFor="randomize_question_order" className="cursor-pointer">
                    Randomize question order
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="randomize_answer_options"
                    checked={quizSettings.randomize_answer_options}
                    onCheckedChange={(checked) => 
                      setQuizSettings({ ...quizSettings, randomize_answer_options: checked as boolean })
                    }
                  />
                  <Label htmlFor="randomize_answer_options" className="cursor-pointer">
                    Randomize answer options (MCQ & True/False)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable_anti_cheating"
                    checked={quizSettings.enable_anti_cheating}
                    onCheckedChange={(checked) => 
                      setQuizSettings({ ...quizSettings, enable_anti_cheating: checked as boolean })
                    }
                  />
                  <Label htmlFor="enable_anti_cheating" className="cursor-pointer">
                    Enable anti-cheating measures (tab switching detection, copy/paste prevention)
                  </Label>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleSaveQuiz}
                  disabled={saving}
                  variant="default"
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowSettingsDialog(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Questions</CardTitle>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setShowAIGenerator(!showAIGenerator)}
                  variant="default"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with AI
                </Button>
                <Button
                  onClick={() => {
                    setEditingQuestion(null);
                    setShowQuestionEditor(true);
                  }}
                  variant="default"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>

            {showAIGenerator && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-5 w-5 text-gray-600" />
                  <h3 className="font-medium">AI Question Generator</h3>
                </div>
                <Textarea
                  className="mb-2"
                  rows={3}
                  placeholder="Enter topic or prompt for question generation..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
                <div className="flex space-x-4 mb-2">
                  <Select value={aiType} onValueChange={(value) => setAiType(value as any)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Question Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MCQ">Multiple Choice</SelectItem>
                      <SelectItem value="DESCRIPTIVE">Descriptive</SelectItem>
                      <SelectItem value="FILL_BLANK">Fill in the Blank</SelectItem>
                      <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    className="w-24"
                    value={aiCount}
                    onChange={(e) => setAiCount(parseInt(e.target.value))}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleGenerateQuestions}
                    disabled={generating}
                    variant="default"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowAIGenerator(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

          <Dialog 
            open={showQuestionEditor} 
            onOpenChange={(open) => {
              setShowQuestionEditor(open);
              if (!open) {
                setEditingQuestion(null);
              }
            }}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion ? 'Edit Question' : 'Add Question'}
                </DialogTitle>
              </DialogHeader>
              <QuestionEditor
                question={editingQuestion}
                onSave={handleSaveQuestion}
                onCancel={() => {
                  setShowQuestionEditor(false);
                  setEditingQuestion(null);
                }}
              />
            </DialogContent>
          </Dialog>

            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileQuestion className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Q{index + 1}</span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                            {question.type === 'MCQ' && <CheckCircle2 className="h-3 w-3" />}
                            {question.type === 'TRUE_FALSE' && <Type className="h-3 w-3" />}
                            {question.type === 'FILL_BLANK' && <Minus className="h-3 w-3" />}
                            {question.type === 'DESCRIPTIVE' && <FileQuestion className="h-3 w-3" />}
                            {question.type}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {question.points} points
                          </span>
                        </div>
                        <p className="text-gray-900">{question.prompt}</p>
                        {question.options && question.options.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {question.options.map((option, i) => (
                              <li key={i} className="text-sm text-gray-600">• {option}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => {
                            setEditingQuestion(question);
                            setShowQuestionEditor(true);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteQuestion(question.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
    </div>
  );
};

