import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizService } from '@/services/quizzes';
import { CreateQuizData } from '@/types/quiz';
import { FileText, Loader2, XCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const CreateQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateQuizData>({
    title: '',
    description: '',
    is_survey: false,
    requires_login: false,
    allow_ai_evaluation: false,
    show_results_immediately: true,
    allow_retake: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const quiz = await quizService.createQuiz(formData);
      navigate(`/quizzes/${quiz.id}/edit`);
    } catch (error) {
      console.error('Failed to create quiz:', error);
      alert('Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Create New Quiz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  type="text"
                  required
                  className="mt-1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  className="mt-1"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_survey"
                  checked={formData.is_survey}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_survey: checked as boolean })}
                />
                <Label htmlFor="is_survey" className="cursor-pointer">
                  This is a survey (no correct answers)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires_login"
                  checked={formData.requires_login}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_login: checked as boolean })}
                />
                <Label htmlFor="requires_login" className="cursor-pointer">
                  Require login to take quiz
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow_ai_evaluation"
                  checked={formData.allow_ai_evaluation}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_ai_evaluation: checked as boolean })}
                />
                <Label htmlFor="allow_ai_evaluation" className="cursor-pointer">
                  Allow AI evaluation for descriptive questions
                </Label>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-gray-900">Randomization & Security</h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="randomize_question_order"
                    checked={formData.randomize_question_order || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, randomize_question_order: checked as boolean })}
                  />
                  <Label htmlFor="randomize_question_order" className="cursor-pointer">
                    Randomize question order
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="randomize_answer_options"
                    checked={formData.randomize_answer_options || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, randomize_answer_options: checked as boolean })}
                  />
                  <Label htmlFor="randomize_answer_options" className="cursor-pointer">
                    Randomize answer options (MCQ & True/False)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable_anti_cheating"
                    checked={formData.enable_anti_cheating || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, enable_anti_cheating: checked as boolean })}
                  />
                  <Label htmlFor="enable_anti_cheating" className="cursor-pointer">
                    Enable anti-cheating measures (tab switching detection, copy/paste prevention)
                  </Label>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  variant="default"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Quiz
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </div>
  );
};

