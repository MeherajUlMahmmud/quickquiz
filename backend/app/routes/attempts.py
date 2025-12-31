from flask import Blueprint, request, jsonify
from app.services.attempt_service import AttemptService
from app.services.scoring_service import ScoringService
from app.utils.decorators import token_required, optional_token
from app.utils.validators import AttemptSchema, AnswerSchema
from marshmallow import ValidationError

bp = Blueprint('attempts', __name__)
attempt_service = AttemptService()
scoring_service = ScoringService()

@bp.route('/quizzes/<int:quiz_id>/attempts', methods=['POST'])
@optional_token
def start_attempt(current_user, quiz_id):
    try:
        schema = AttemptSchema()
        data = schema.load(request.json or {})
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    
    attempt, error = attempt_service.start_attempt(
        quiz_id=quiz_id,
        user_id=current_user.id if current_user else None,
        participant_name=data.get('participant_name'),
        participant_info=data.get('participant_info')
    )
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify(attempt.to_dict(include_answers=False)), 201

@bp.route('/<int:attempt_id>/answers', methods=['POST'])
def save_answer(attempt_id):
    try:
        schema = AnswerSchema()
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    
    answer, error = attempt_service.save_answer(
        attempt_id=attempt_id,
        question_id=data['question_id'],
        answer_text=data['answer_text']
    )
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify(answer.to_dict()), 200

@bp.route('/<int:attempt_id>', methods=['PUT'])
def update_attempt(attempt_id):
    try:
        schema = AttemptSchema()
        data = schema.load(request.json, partial=True)
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    
    attempt, error = attempt_service.update_attempt(
        attempt_id=attempt_id,
        participant_name=data.get('participant_name'),
        participant_info=data.get('participant_info')
    )
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify(attempt.to_dict(include_answers=False)), 200

@bp.route('/<int:attempt_id>/submit', methods=['POST'])
def submit_attempt(attempt_id):
    attempt = attempt_service.get_attempt(attempt_id)
    if not attempt:
        return jsonify({'error': 'Attempt not found'}), 404
    
    if attempt.status == 'SUBMITTED':
        return jsonify({'error': 'Attempt already submitted'}), 400
    
    attempt = scoring_service.submit_attempt(attempt)
    return jsonify(attempt.to_dict(include_answers=True)), 200

@bp.route('/<int:attempt_id>', methods=['GET'])
def get_attempt(attempt_id):
    attempt = attempt_service.get_attempt(attempt_id, include_answers=True)
    if not attempt:
        return jsonify({'error': 'Attempt not found'}), 404
    
    return jsonify(attempt.to_dict(include_answers=True)), 200

