from app.extensions import db
from datetime import datetime
import json

class AttemptStatus:
    IN_PROGRESS = 'IN_PROGRESS'
    SUBMITTED = 'SUBMITTED'

class Attempt(db.Model):
    __tablename__ = 'attempts'
    
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    participant_name = db.Column(db.String(100), nullable=True)
    participant_info = db.Column(db.Text, nullable=True)  # JSON string
    started_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    submitted_at = db.Column(db.DateTime, nullable=True)
    score = db.Column(db.Float, nullable=True)
    total_points = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(20), default=AttemptStatus.IN_PROGRESS, nullable=False)
    
    # Relationships
    answers = db.relationship('Answer', backref='attempt', lazy=True, cascade='all, delete-orphan')
    
    def get_participant_info(self):
        if self.participant_info:
            try:
                return json.loads(self.participant_info)
            except:
                return {}
        return {}
    
    def set_participant_info(self, info):
        self.participant_info = json.dumps(info) if info else None
    
    def to_dict(self, include_answers=False):
        data = {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'user_id': self.user_id,
            'participant_name': self.participant_name,
            'participant_info': self.get_participant_info(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'score': self.score,
            'total_points': self.total_points,
            'status': self.status
        }
        
        if include_answers:
            data['answers'] = [a.to_dict() for a in self.answers]
        
        return data


class Answer(db.Model):
    __tablename__ = 'answers'
    
    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey('attempts.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    answer_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, nullable=True)
    ai_feedback = db.Column(db.Text, nullable=True)
    points_earned = db.Column(db.Float, default=0.0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'attempt_id': self.attempt_id,
            'question_id': self.question_id,
            'answer_text': self.answer_text,
            'is_correct': self.is_correct,
            'ai_feedback': self.ai_feedback,
            'points_earned': self.points_earned,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

