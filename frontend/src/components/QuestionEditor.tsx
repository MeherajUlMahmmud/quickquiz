import { useState, useEffect } from 'react';
import { Question, CreateQuestionData, QuestionType } from '../types/question';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Plus, X, Save, XCircle, FileQuestion, Award } from 'lucide-react';

interface QuestionEditorProps {
  question?: Question | null;
  onSave: (data: CreateQuestionData) => void;
  onCancel: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, onSave, onCancel }) => {
  const [type, setType] = useState<QuestionType>(question?.type || 'MCQ');
  const [prompt, setPrompt] = useState(question?.prompt || '');
  const [options, setOptions] = useState<string[]>(question?.options || ['', '']);
  const [correctAnswer, setCorrectAnswer] = useState<any>(question?.correct_answer);
  const [points, setPoints] = useState(question?.points || 1);
  const [order, setOrder] = useState(question?.order || 0);

  useEffect(() => {
    if (question) {
      setType(question.type);
      setPrompt(question.prompt);
      setOptions(question.options || ['', '']);
      setCorrectAnswer(question.correct_answer);
      setPoints(question.points);
      setOrder(question.order);
    }
  }, [question]);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: CreateQuestionData = {
      type,
      prompt,
      points,
      order,
    };

    if (type === 'MCQ') {
      data.options = options.filter(opt => opt.trim() !== '');
      data.correct_answer = correctAnswer;
    } else if (type === 'TRUE_FALSE') {
      data.correct_answer = correctAnswer === 'true' || correctAnswer === true;
    } else if (type === 'FILL_BLANK') {
      data.correct_answer = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
    } else {
      data.correct_answer = correctAnswer;
    }

    onSave(data);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="question-type" className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4" />
            Question Type
          </Label>
          <Select value={type} onValueChange={(value) => setType(value as QuestionType)}>
            <SelectTrigger id="question-type" className="mt-1">
              <SelectValue placeholder="Select question type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MCQ">Multiple Choice</SelectItem>
              <SelectItem value="DESCRIPTIVE">Descriptive</SelectItem>
              <SelectItem value="FILL_BLANK">Fill in the Blank</SelectItem>
              <SelectItem value="TRUE_FALSE">True/False</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="question-prompt" className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4" />
            Question Prompt
          </Label>
          <Textarea
            id="question-prompt"
            required
            className="mt-1"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {type === 'MCQ' && (
          <>
            <div>
              <Label>Options</Label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2 mt-1">
                  <Input
                    type="text"
                    className="flex-1"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-900"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                onClick={handleAddOption}
                variant="ghost"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </div>
            <div>
              <Label htmlFor="correct-answer">Correct Answer (index)</Label>
              <Input
                id="correct-answer"
                type="number"
                min="0"
                max={options.length - 1}
                className="mt-1"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(parseInt(e.target.value))}
              />
            </div>
          </>
        )}

        {type === 'TRUE_FALSE' && (
          <div>
            <Label htmlFor="true-false-answer">Correct Answer</Label>
            <Select
              value={correctAnswer === true || correctAnswer === 'true' ? 'true' : 'false'}
              onValueChange={(value) => setCorrectAnswer(value === 'true')}
            >
              <SelectTrigger id="true-false-answer" className="mt-1">
                <SelectValue placeholder="Select answer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {type === 'FILL_BLANK' && (
          <div>
            <Label htmlFor="fill-blank-answer">Correct Answer(s) - comma separated</Label>
            <Input
              id="fill-blank-answer"
              type="text"
              className="mt-1"
              value={Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value.split(',').map(s => s.trim()))}
            />
          </div>
        )}

        {type === 'DESCRIPTIVE' && (
          <div>
            <Label htmlFor="descriptive-answer">Sample Answer (optional)</Label>
            <Textarea
              id="descriptive-answer"
              className="mt-1"
              rows={2}
              value={correctAnswer || ''}
              onChange={(e) => setCorrectAnswer(e.target.value)}
            />
          </div>
        )}

        <div>
          <Label htmlFor="points" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Points
          </Label>
          <Input
            id="points"
            type="number"
            min="1"
            className="mt-1"
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value))}
          />
        </div>

        <div className="flex space-x-2">
          <Button
            type="submit"
            variant="default"
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

