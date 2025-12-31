import re
from marshmallow import Schema, fields, validate, ValidationError

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValidationError('Invalid email format')

class RegisterSchema(Schema):
    email = fields.Email(required=True, validate=validate_email)
    password = fields.Str(required=True, validate=validate.Length(min=6))
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))

class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class QuizSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    is_survey = fields.Bool(load_default=False)
    requires_login = fields.Bool(load_default=False)
    allow_ai_evaluation = fields.Bool(load_default=False)
    time_limit = fields.Int(allow_none=True, validate=validate.Range(min=1))
    show_results_immediately = fields.Bool(load_default=True)
    allow_retake = fields.Bool(load_default=False)
    custom_fields = fields.List(fields.Dict(), allow_none=True)

class QuestionSchema(Schema):
    type = fields.Str(required=True, validate=validate.OneOf(['MCQ', 'DESCRIPTIVE', 'FILL_BLANK', 'TRUE_FALSE']))
    prompt = fields.Str(required=True, validate=validate.Length(min=1))
    options = fields.List(fields.Str(), allow_none=True)
    correct_answer = fields.Raw(allow_none=True)
    points = fields.Int(load_default=1, validate=validate.Range(min=1))
    order = fields.Int(required=True, validate=validate.Range(min=0))

class AttemptSchema(Schema):
    participant_name = fields.Str(allow_none=True, validate=validate.Length(max=100))
    participant_info = fields.Dict(allow_none=True)

class AnswerSchema(Schema):
    question_id = fields.Int(required=True)
    answer_text = fields.Str(required=True, validate=validate.Length(min=1))

