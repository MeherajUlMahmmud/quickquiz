import json
from datetime import datetime

from app.extensions import db


class Quiz(db.Model):
    __tablename__ = 'quizzes'

    id = db.Column(db.Integer, primary_key=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_survey = db.Column(db.Boolean, default=False, nullable=False)
    requires_login = db.Column(db.Boolean, default=False, nullable=False)
    share_code = db.Column(db.String(20), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    questions = db.relationship('Question', backref='quiz', lazy=True, cascade='all, delete-orphan',
                                order_by='Question.order')
    attempts = db.relationship('Attempt', backref='quiz', lazy=True, cascade='all, delete-orphan')
    settings = db.relationship('QuizSettings', backref='quiz', uselist=False, cascade='all, delete-orphan')

    def to_dict(self, include_questions=False):
        data = {
            'id': self.id,
            'creator_id': self.creator_id,
            'title': self.title,
            'description': self.description,
            'is_survey': self.is_survey,
            'requires_login': self.requires_login,
            'share_code': self.share_code,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if self.settings:
            data['settings'] = self.settings.to_dict()

        if include_questions:
            data['questions'] = [q.to_dict() for q in self.questions]

        return data


class QuizSettings(db.Model):
    __tablename__ = 'quiz_settings'

    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), primary_key=True)
    allow_ai_evaluation = db.Column(db.Boolean, default=False, nullable=False)
    time_limit = db.Column(db.Integer, nullable=True)  # in minutes
    show_results_immediately = db.Column(db.Boolean, default=True, nullable=False)
    allow_retake = db.Column(db.Boolean, default=False, nullable=False)
    randomize_question_order = db.Column(db.Boolean, default=False, nullable=False)
    randomize_answer_options = db.Column(db.Boolean, default=False, nullable=False)
    enable_anti_cheating = db.Column(db.Boolean, default=False, nullable=False)
    custom_fields = db.Column(db.Text, nullable=True)  # JSON string

    def get_custom_fields(self):
        if self.custom_fields:
            try:
                return json.loads(self.custom_fields)
            except:
                return []
        return []

    def set_custom_fields(self, fields):
        self.custom_fields = json.dumps(fields) if fields else None

    def to_dict(self):
        return {
            'allow_ai_evaluation': self.allow_ai_evaluation,
            'time_limit': self.time_limit,
            'show_results_immediately': self.show_results_immediately,
            'allow_retake': self.allow_retake,
            'randomize_question_order': self.randomize_question_order,
            'randomize_answer_options': self.randomize_answer_options,
            'enable_anti_cheating': self.enable_anti_cheating,
            'custom_fields': self.get_custom_fields()
        }
