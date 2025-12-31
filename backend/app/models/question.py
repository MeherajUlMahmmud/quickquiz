from app.extensions import db
from datetime import datetime
import json

class QuestionType:
    MCQ = 'MCQ'
    DESCRIPTIVE = 'DESCRIPTIVE'
    FILL_BLANK = 'FILL_BLANK'
    TRUE_FALSE = 'TRUE_FALSE'

class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # MCQ, DESCRIPTIVE, FILL_BLANK, TRUE_FALSE
    prompt = db.Column(db.Text, nullable=False)
    options = db.Column(db.Text, nullable=True)  # JSON string for MCQ options
    correct_answer = db.Column(db.Text, nullable=True)  # JSON string or text depending on type
    points = db.Column(db.Integer, default=1, nullable=False)
    order = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    answers = db.relationship('Answer', backref='question', lazy=True, cascade='all, delete-orphan')
    
    def get_options(self):
        if self.options:
            try:
                return json.loads(self.options)
            except:
                return []
        return []
    
    def set_options(self, options):
        self.options = json.dumps(options) if options else None
    
    def get_correct_answer(self):
        if self.correct_answer:
            try:
                return json.loads(self.correct_answer)
            except:
                return self.correct_answer
        return None
    
    def set_correct_answer(self, answer):
        if isinstance(answer, (list, dict)):
            self.correct_answer = json.dumps(answer)
        else:
            self.correct_answer = str(answer) if answer else None
    
    def to_dict(self):
        return {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'type': self.type,
            'prompt': self.prompt,
            'options': self.get_options(),
            'correct_answer': self.get_correct_answer(),
            'points': self.points,
            'order': self.order,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

