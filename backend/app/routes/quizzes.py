import logging

from flask import Blueprint, request
from marshmallow import ValidationError

from app.services.quiz_service import QuizService
from app.utils.decorators import token_required, optional_token
from app.utils.response import ResponseFormatter
from app.utils.validators import QuizSchema

bp = Blueprint('quizzes', __name__)
quiz_service = QuizService()
logger = logging.getLogger(__name__)


@bp.route('', methods=['POST'])
@token_required
def create_quiz(current_user):
    try:
        schema = QuizSchema()
        data = schema.load(request.json)
    except ValidationError as err:
        return ResponseFormatter.validation_error(err.messages)

    settings = {
        'allow_ai_evaluation': data.get('allow_ai_evaluation', False),
        'time_limit': data.get('time_limit'),
        'show_results_immediately': data.get('show_results_immediately', True),
        'allow_retake': data.get('allow_retake', False),
        'randomize_question_order': data.get('randomize_question_order', False),
        'randomize_answer_options': data.get('randomize_answer_options', False),
        'enable_anti_cheating': data.get('enable_anti_cheating', False),
        'custom_fields': data.get('custom_fields')
    }

    try:
        quiz = quiz_service.create_quiz(
            creator_id=current_user.id,
            title=data['title'],
            description=data.get('description'),
            is_survey=data.get('is_survey', False),
            requires_login=data.get('requires_login', False),
            settings=settings
        )
        return ResponseFormatter.created(
            data=quiz.to_dict(include_questions=False),
            message="Quiz created successfully"
        )
    except Exception as e:
        logger.error(f"Error creating quiz: {str(e)}", exc_info=True)
        return ResponseFormatter.server_error(f"Failed to create quiz: {str(e)}")


@bp.route('', methods=['GET'])
@token_required
def list_quizzes(current_user):
    quizzes = quiz_service.get_user_quizzes(current_user.id)
    return ResponseFormatter.success(
        data=[q.to_dict() for q in quizzes],
        message="Quizzes retrieved successfully"
    )


@bp.route('/<int:quiz_id>', methods=['GET'])
@optional_token
def get_quiz(current_user, quiz_id):
    quiz = quiz_service.get_quiz_by_id(quiz_id)
    if not quiz:
        return ResponseFormatter.not_found("Quiz")

    # Include questions if user is the creator
    include_questions = current_user and current_user.id == quiz.creator_id
    return ResponseFormatter.success(
        data=quiz.to_dict(include_questions=include_questions),
        message="Quiz retrieved successfully"
    )


@bp.route('/share/<share_code>', methods=['GET'])
@optional_token
def get_quiz_by_share_code(current_user, share_code):
    quiz = quiz_service.get_quiz_by_share_code(share_code)
    if not quiz:
        return ResponseFormatter.not_found("Quiz")

    # Include questions for public access
    return ResponseFormatter.success(
        data=quiz.to_dict(include_questions=True),
        message="Quiz retrieved successfully"
    )


@bp.route('/<int:quiz_id>', methods=['PUT', 'PATCH'])
@token_required
def update_quiz(current_user, quiz_id):
    quiz = quiz_service.get_quiz_by_id(quiz_id)
    if not quiz:
        return ResponseFormatter.not_found("Quiz")

    if quiz.creator_id != current_user.id:
        return ResponseFormatter.unauthorized("You don't have permission to update this quiz")

    try:
        schema = QuizSchema()
        data = schema.load(request.json, partial=True)
    except ValidationError as err:
        return ResponseFormatter.validation_error(err.messages)

    settings = {}
    if 'allow_ai_evaluation' in data:
        settings['allow_ai_evaluation'] = data['allow_ai_evaluation']
    if 'time_limit' in data:
        settings['time_limit'] = data.get('time_limit')
    if 'show_results_immediately' in data:
        settings['show_results_immediately'] = data['show_results_immediately']
    if 'allow_retake' in data:
        settings['allow_retake'] = data['allow_retake']
    if 'randomize_question_order' in data:
        settings['randomize_question_order'] = data['randomize_question_order']
    if 'randomize_answer_options' in data:
        settings['randomize_answer_options'] = data['randomize_answer_options']
    if 'enable_anti_cheating' in data:
        settings['enable_anti_cheating'] = data['enable_anti_cheating']
    if 'custom_fields' in data:
        settings['custom_fields'] = data['custom_fields']

    try:
        quiz = quiz_service.update_quiz(
            quiz,
            title=data.get('title'),
            description=data.get('description'),
            is_survey=data.get('is_survey'),
            requires_login=data.get('requires_login'),
            settings=settings if settings else None
        )
        return ResponseFormatter.success(
            data=quiz.to_dict(include_questions=False),
            message="Quiz updated successfully"
        )
    except Exception as e:
        logger.error(f"Error updating quiz: {str(e)}", exc_info=True)
        return ResponseFormatter.server_error(f"Failed to update quiz: {str(e)}")


@bp.route('/<int:quiz_id>', methods=['DELETE'])
@token_required
def delete_quiz(current_user, quiz_id):
    quiz = quiz_service.get_quiz_by_id(quiz_id)
    if not quiz:
        return ResponseFormatter.not_found("Quiz")

    if quiz.creator_id != current_user.id:
        return ResponseFormatter.unauthorized("You don't have permission to delete this quiz")

    try:
        quiz_service.delete_quiz(quiz)
        return ResponseFormatter.success(
            message="Quiz deleted successfully"
        )
    except Exception as e:
        logger.error(f"Error deleting quiz: {str(e)}", exc_info=True)
        return ResponseFormatter.server_error(f"Failed to delete quiz: {str(e)}")


@bp.route('/<int:quiz_id>/attempts', methods=['GET'])
@token_required
def list_attempts(current_user, quiz_id):
    from app.services.attempt_service import AttemptService
    attempt_service = AttemptService()

    quiz = quiz_service.get_quiz_by_id(quiz_id)
    if not quiz:
        return ResponseFormatter.not_found("Quiz")

    if quiz.creator_id != current_user.id:
        return ResponseFormatter.unauthorized("You don't have permission to view attempts for this quiz")

    try:
        attempts = attempt_service.get_quiz_attempts(quiz_id, current_user.id)
        return ResponseFormatter.success(
            data=[a.to_dict(include_answers=True) for a in attempts],
            message="Attempts retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error retrieving attempts: {str(e)}", exc_info=True)
        return ResponseFormatter.server_error(f"Failed to retrieve attempts: {str(e)}")
