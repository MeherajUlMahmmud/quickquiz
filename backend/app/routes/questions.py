import logging

from flask import Blueprint, request
from marshmallow import ValidationError

from app.services.groq_service import GroqService
from app.services.question_service import QuestionService
from app.services.quiz_service import QuizService
from app.utils.decorators import token_required
from app.utils.response import ResponseFormatter
from app.utils.validators import QuestionSchema

bp = Blueprint('questions', __name__)
question_service = QuestionService()
quiz_service = QuizService()
groq_service = GroqService()
logger = logging.getLogger(__name__)


@bp.route('/quizzes/<int:quiz_id>/questions', methods=['POST'])
@token_required
def create_question(current_user, quiz_id):
    quiz = quiz_service.get_quiz_by_id(quiz_id)
    if not quiz:
        return ResponseFormatter.not_found("Quiz")

    if quiz.creator_id != current_user.id:
        return ResponseFormatter.unauthorized("You don't have permission to add questions to this quiz")

    try:
        schema = QuestionSchema()
        data = schema.load(request.json)
    except ValidationError as err:
        return ResponseFormatter.validation_error(err.messages)

    # Validate question data
    is_valid, error_msg = question_service.validate_question_data(
        data['type'],
        data.get('options'),
        data.get('correct_answer')
    )
    if not is_valid:
        return ResponseFormatter.error(error_msg)

    try:
        question = question_service.create_question(
            quiz_id=quiz_id,
            question_type=data['type'],
            prompt=data['prompt'],
            options=data.get('options'),
            correct_answer=data.get('correct_answer'),
            points=data.get('points', 1),
            order=data.get('order', 0)
        )
        return ResponseFormatter.created(
            data=question.to_dict(),
            message="Question created successfully"
        )
    except Exception as e:
        logger.error(f"Error creating question: {str(e)}", exc_info=True)
        return ResponseFormatter.server_error(f"Failed to create question: {str(e)}")


@bp.route('/quizzes/<int:quiz_id>/questions/generate', methods=['POST'])
@token_required
def generate_questions(current_user, quiz_id):
    quiz = quiz_service.get_quiz_by_id(quiz_id)
    if not quiz:
        return ResponseFormatter.not_found("Quiz")

    if quiz.creator_id != current_user.id:
        return ResponseFormatter.unauthorized("You don't have permission to generate questions for this quiz")

    data = request.json
    prompt = data.get('prompt')
    question_type = data.get('type', 'MCQ')
    count = data.get('count', 5)

    if not prompt:
        return ResponseFormatter.error("Prompt is required")

    try:
        generated_questions = groq_service.generate_questions(prompt, question_type, count)

        # Validate that all questions have required fields, especially correct_answer
        validated_questions = []
        for i, q_data in enumerate(generated_questions):
            if not q_data.get('prompt'):
                continue  # Skip questions without prompts

            # Ensure correct_answer is always provided
            correct_answer = q_data.get('correct_answer')
            if correct_answer is None:
                # Log warning but try to continue - AI should have provided this
                logger.warning(f"Question {i + 1} missing correct_answer, skipping")
                continue

            # Validate question data before saving
            is_valid, error_msg = question_service.validate_question_data(
                question_type,
                q_data.get('options'),
                correct_answer
            )
            if not is_valid:
                logger.warning(f"Question {i + 1} validation failed: {error_msg}, skipping")
                continue

            validated_questions.append(q_data)

        if not validated_questions:
            return ResponseFormatter.error(
                "No valid questions were generated. Please try again with a different prompt."
            )

        # Get current max order
        existing_questions = question_service.get_questions_by_quiz(quiz_id)
        max_order = max([q.order for q in existing_questions], default=-1)

        # Save generated questions with correct answers
        saved_questions = []
        for i, q_data in enumerate(validated_questions):
            try:
                question = question_service.create_question(
                    quiz_id=quiz_id,
                    question_type=question_type,
                    prompt=q_data.get('prompt', ''),
                    options=q_data.get('options'),
                    correct_answer=q_data.get('correct_answer'),  # Always provided after validation
                    points=q_data.get('points', 1),
                    order=max_order + 1 + i
                )
                saved_questions.append(question.to_dict())
            except Exception as e:
                logger.error(f"Failed to save question {i + 1}: {str(e)}")
                # Continue with other questions

        if not saved_questions:
            return ResponseFormatter.server_error(
                "Failed to save any questions. Please check the generated questions and try again."
            )

        return ResponseFormatter.created(
            data={'questions': saved_questions},
            message=f'Successfully generated and saved {len(saved_questions)} question(s)'
        )
    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}", exc_info=True)
        return ResponseFormatter.server_error(f"Failed to generate questions: {str(e)}")


@bp.route('/quizzes/<int:quiz_id>/questions', methods=['GET'])
def get_questions(quiz_id):
    questions = question_service.get_questions_by_quiz(quiz_id)
    return ResponseFormatter.success(
        data=[q.to_dict() for q in questions],
        message="Questions retrieved successfully"
    )


@bp.route('/<int:question_id>', methods=['PUT'])
@token_required
def update_question(current_user, question_id):
    from app.models.question import Question
    question = Question.query.get(question_id)
    if not question:
        return ResponseFormatter.not_found("Question")

    quiz = quiz_service.get_quiz_by_id(question.quiz_id)
    if quiz.creator_id != current_user.id:
        return ResponseFormatter.unauthorized("You don't have permission to update this question")

    try:
        schema = QuestionSchema()
        data = schema.load(request.json, partial=True)
    except ValidationError as err:
        return ResponseFormatter.validation_error(err.messages)

    try:
        question = question_service.update_question(
            question,
            prompt=data.get('prompt'),
            options=data.get('options'),
            correct_answer=data.get('correct_answer'),
            points=data.get('points'),
            order=data.get('order')
        )
        return ResponseFormatter.success(
            data=question.to_dict(),
            message="Question updated successfully"
        )
    except Exception as e:
        logger.error(f"Error updating question: {str(e)}", exc_info=True)
        return ResponseFormatter.server_error(f"Failed to update question: {str(e)}")


@bp.route('/<int:question_id>', methods=['DELETE'])
@token_required
def delete_question(current_user, question_id):
    from app.models.question import Question
    question = Question.query.get(question_id)
    if not question:
        return ResponseFormatter.not_found("Question")

    quiz = quiz_service.get_quiz_by_id(question.quiz_id)
    if quiz.creator_id != current_user.id:
        return ResponseFormatter.unauthorized("You don't have permission to delete this question")

    try:
        question_service.delete_question(question)
        return ResponseFormatter.success(
            message="Question deleted successfully"
        )
    except Exception as e:
        logger.error(f"Error deleting question: {str(e)}", exc_info=True)
        return ResponseFormatter.server_error(f"Failed to delete question: {str(e)}")


@bp.route('/reorder', methods=['POST'])
@token_required
def reorder_questions(current_user):
    data = request.json
    quiz_id = data.get('quiz_id')
    question_orders = data.get('orders', {})

    if not quiz_id:
        return ResponseFormatter.error("quiz_id is required")

    quiz = quiz_service.get_quiz_by_id(quiz_id)
    if not quiz:
        return ResponseFormatter.not_found("Quiz")

    if quiz.creator_id != current_user.id:
        return ResponseFormatter.unauthorized("You don't have permission to reorder questions for this quiz")

    try:
        question_service.reorder_questions(quiz_id, question_orders)
        return ResponseFormatter.success(
            message="Questions reordered successfully"
        )
    except Exception as e:
        logger.error(f"Error reordering questions: {str(e)}", exc_info=True)
        return ResponseFormatter.server_error(f"Failed to reorder questions: {str(e)}")
