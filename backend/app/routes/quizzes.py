from flask import Blueprint, request, jsonify
from app.services.quiz_service import QuizService
from app.utils.decorators import token_required, optional_token
from app.utils.validators import QuizSchema
from marshmallow import ValidationError

bp = Blueprint('quizzes', __name__)
quiz_service = QuizService()

@bp.route('', methods=['POST'])
@token_required
def create_quiz(current_user):
    try:
        schema = QuizSchema()
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    
    settings = {
        'allow_ai_evaluation': data.get('allow_ai_evaluation', False),
        'time_limit': data.get('time_limit'),
        'show_results_immediately': data.get('show_results_immediately', True),
        'allow_retake': data.get('allow_retake', False),
        'custom_fields': data.get('custom_fields')
    }
    
    quiz = quiz_service.create_quiz(
        creator_id=current_user.id,
        title=data['title'],
        description=data.get('description'),
        is_survey=data.get('is_survey', False),
        requires_login=data.get('requires_login', False),
        settings=settings
    )
    
    return jsonify(quiz.to_dict(include_questions=False)), 201

@bp.route('', methods=['GET'])
@token_required
def list_quizzes(current_user):
    quizzes = quiz_service.get_user_quizzes(current_user.id)
    return jsonify([q.to_dict() for q in quizzes]), 200

@bp.route('/<int:quiz_id>', methods=['GET'])
@optional_token
def get_quiz(current_user, quiz_id):
    quiz = quiz_service.get_quiz_by_id(quiz_id)
    if not quiz:
        return jsonify({'error': 'Quiz not found'}), 404
    
    # Include questions if user is the creator
    include_questions = current_user and current_user.id == quiz.creator_id
    return jsonify(quiz.to_dict(include_questions=include_questions)), 200

@bp.route('/share/<share_code>', methods=['GET'])
@optional_token
def get_quiz_by_share_code(current_user, share_code):
    quiz = quiz_service.get_quiz_by_share_code(share_code)
    if not quiz:
        return jsonify({'error': 'Quiz not found'}), 404
    
    # Include questions for public access
    return jsonify(quiz.to_dict(include_questions=True)), 200

@bp.route('/<int:quiz_id>', methods=['PUT'])
@token_required
def update_quiz(current_user, quiz_id):
    quiz = quiz_service.get_quiz_by_id(quiz_id)
    if not quiz:
        return jsonify({'error': 'Quiz not found'}), 404
    
    if quiz.creator_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        schema = QuizSchema()
        data = schema.load(request.json, partial=True)
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    
    settings = {}
    if 'allow_ai_evaluation' in data:
        settings['allow_ai_evaluation'] = data['allow_ai_evaluation']
    if 'time_limit' in data:
        settings['time_limit'] = data.get('time_limit')
    if 'show_results_immediately' in data:
        settings['show_results_immediately'] = data['show_results_immediately']
    if 'allow_retake' in data:
        settings['allow_retake'] = data['allow_retake']
    if 'custom_fields' in data:
        settings['custom_fields'] = data['custom_fields']
    
    quiz = quiz_service.update_quiz(
        quiz,
        title=data.get('title'),
        description=data.get('description'),
        is_survey=data.get('is_survey'),
        requires_login=data.get('requires_login'),
        settings=settings if settings else None
    )
    
    return jsonify(quiz.to_dict(include_questions=False)), 200

@bp.route('/<int:quiz_id>', methods=['DELETE'])
@token_required
def delete_quiz(current_user, quiz_id):
    quiz = quiz_service.get_quiz_by_id(quiz_id)
    if not quiz:
        return jsonify({'error': 'Quiz not found'}), 404
    
    if quiz.creator_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    quiz_service.delete_quiz(quiz)
    return jsonify({'message': 'Quiz deleted successfully'}), 200

@bp.route('/<int:quiz_id>/attempts', methods=['GET'])
@token_required
def list_attempts(current_user, quiz_id):
    from app.services.attempt_service import AttemptService
    attempt_service = AttemptService()
    
    attempts = attempt_service.get_quiz_attempts(quiz_id, current_user.id)
    return jsonify([a.to_dict(include_answers=True) for a in attempts]), 200

