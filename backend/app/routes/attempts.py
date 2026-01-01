import logging

from flask import Blueprint, request
from marshmallow import ValidationError

from app.services.attempt_service import AttemptService
from app.services.scoring_service import ScoringService
from app.utils.decorators import optional_token, token_required
from app.utils.response import ResponseFormatter
from app.utils.validators import AttemptSchema, AnswerSchema

bp = Blueprint('attempts', __name__)
attempt_service = AttemptService()
scoring_service = ScoringService()
logger = logging.getLogger(__name__)


@bp.route('/quizzes/<int:quiz_id>/attempts', methods=['POST'])
@optional_token
def start_attempt(current_user, quiz_id):
    try:
        schema = AttemptSchema()
        data = schema.load(request.json or {})
    except ValidationError as err:
        return ResponseFormatter.validation_error(err.messages)

    attempt, error = attempt_service.start_attempt(
        quiz_id=quiz_id,
        user_id=current_user.id if current_user else None,
        participant_name=data.get('participant_name'),
        participant_info=data.get('participant_info')
    )

    if error:
        return ResponseFormatter.error(error)

    return ResponseFormatter.created(
        data=attempt.to_dict(include_answers=False),
        message="Attempt started successfully"
    )


@bp.route('/<int:attempt_id>/answers', methods=['POST'])
def save_answer(attempt_id):
    try:
        schema = AnswerSchema()
        data = schema.load(request.json)
    except ValidationError as err:
        return ResponseFormatter.validation_error(err.messages)

    answer, error = attempt_service.save_answer(
        attempt_id=attempt_id,
        question_id=data['question_id'],
        answer_text=data['answer_text']
    )

    if error:
        return ResponseFormatter.error(error)

    return ResponseFormatter.success(
        data=answer.to_dict(),
        message="Answer saved successfully"
    )


@bp.route('/<int:attempt_id>', methods=['PUT', 'PATCH'])
def update_attempt(attempt_id):
    try:
        schema = AttemptSchema()
        data = schema.load(request.json, partial=True)
    except ValidationError as err:
        return ResponseFormatter.validation_error(err.messages)

    attempt, error = attempt_service.update_attempt(
        attempt_id=attempt_id,
        participant_name=data.get('participant_name'),
        participant_info=data.get('participant_info')
    )

    if error:
        return ResponseFormatter.error(error)

    return ResponseFormatter.success(
        data=attempt.to_dict(include_answers=False),
        message="Attempt updated successfully"
    )


@bp.route('/<int:attempt_id>/submit', methods=['POST'])
def submit_attempt(attempt_id):
    attempt = attempt_service.get_attempt(attempt_id)
    if not attempt:
        return ResponseFormatter.not_found("Attempt")

    if attempt.status == 'SUBMITTED':
        return ResponseFormatter.error("Attempt already submitted")

    try:
        attempt = scoring_service.submit_attempt(attempt)
        return ResponseFormatter.success(
            data=attempt.to_dict(include_answers=True),
            message="Attempt submitted successfully"
        )
    except Exception as e:
        logger.error(f"Error submitting attempt: {str(e)}", exc_info=True)
        return ResponseFormatter.server_error(f"Failed to submit attempt: {str(e)}")


@bp.route('/<int:attempt_id>', methods=['GET'])
def get_attempt(attempt_id):
    attempt = attempt_service.get_attempt(attempt_id, include_answers=True)
    if not attempt:
        return ResponseFormatter.not_found("Attempt")

    return ResponseFormatter.success(
        data=attempt.to_dict(include_answers=True),
        message="Attempt retrieved successfully"
    )


@bp.route('/user/attempts', methods=['GET'])
@token_required
def get_user_attempts(current_user):
    """Get all attempts for the current user"""
    try:
        attempts = attempt_service.get_user_attempts(current_user.id)
        # Include quiz information for each attempt
        from app.services.quiz_service import QuizService
        quiz_service = QuizService()
        
        attempts_with_quiz = []
        for attempt in attempts:
            attempt_dict = attempt.to_dict(include_answers=False)
            quiz = quiz_service.get_quiz_by_id(attempt.quiz_id)
            if quiz:
                # Calculate total points from quiz questions
                total_points = sum(q.points for q in quiz.questions) if quiz.questions else 0
                attempt_dict['quiz'] = {
                    'id': quiz.id,
                    'title': quiz.title,
                    'description': quiz.description,
                    'share_code': quiz.share_code,
                    'total_points': total_points
                }
            attempts_with_quiz.append(attempt_dict)
        
        return ResponseFormatter.success(
            data=attempts_with_quiz,
            message="User attempts retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error retrieving user attempts: {str(e)}", exc_info=True)
        return ResponseFormatter.server_error(f"Failed to retrieve user attempts: {str(e)}")
