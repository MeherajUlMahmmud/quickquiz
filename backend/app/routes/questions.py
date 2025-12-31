from flask import Blueprint, request, jsonify
from app.services.question_service import QuestionService
from app.services.quiz_service import QuizService
from app.services.groq_service import GroqService
from app.utils.decorators import token_required
from app.utils.validators import QuestionSchema
from marshmallow import ValidationError

bp = Blueprint('questions', __name__)
question_service = QuestionService()
quiz_service = QuizService()
groq_service = GroqService()

@bp.route('/quizzes/<int:quiz_id>/questions', methods=['POST'])
@token_required
def create_question(current_user, quiz_id):
    quiz = quiz_service.get_quiz_by_id(quiz_id)
    if not quiz:
        return jsonify({'error': 'Quiz not found'}), 404
    
    if quiz.creator_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        schema = QuestionSchema()
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    
    # Validate question data
    is_valid, error_msg = question_service.validate_question_data(
        data['type'],
        data.get('options'),
        data.get('correct_answer')
    )
    if not is_valid:
        return jsonify({'error': error_msg}), 400
    
    question = question_service.create_question(
        quiz_id=quiz_id,
        question_type=data['type'],
        prompt=data['prompt'],
        options=data.get('options'),
        correct_answer=data.get('correct_answer'),
        points=data.get('points', 1),
        order=data.get('order', 0)
    )
    
    return jsonify(question.to_dict()), 201

@bp.route('/quizzes/<int:quiz_id>/questions/generate', methods=['POST'])
@token_required
def generate_questions(current_user, quiz_id):
    quiz = quiz_service.get_quiz_by_id(quiz_id)
    if not quiz:
        return jsonify({'error': 'Quiz not found'}), 404
    
    if quiz.creator_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    prompt = data.get('prompt')
    question_type = data.get('type', 'MCQ')
    count = data.get('count', 5)
    
    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400
    
    try:
        generated_questions = groq_service.generate_questions(prompt, question_type, count)
        
        # Get current max order
        existing_questions = question_service.get_questions_by_quiz(quiz_id)
        max_order = max([q.order for q in existing_questions], default=-1)
        
        # Save generated questions
        saved_questions = []
        for i, q_data in enumerate(generated_questions):
            question = question_service.create_question(
                quiz_id=quiz_id,
                question_type=question_type,
                prompt=q_data.get('prompt', ''),
                options=q_data.get('options'),
                correct_answer=q_data.get('correct_answer'),
                points=q_data.get('points', 1),
                order=max_order + 1 + i
            )
            saved_questions.append(question.to_dict())
        
        return jsonify({'questions': saved_questions}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/quizzes/<int:quiz_id>/questions', methods=['GET'])
def get_questions(quiz_id):
    questions = question_service.get_questions_by_quiz(quiz_id)
    return jsonify([q.to_dict() for q in questions]), 200

@bp.route('/<int:question_id>', methods=['PUT'])
@token_required
def update_question(current_user, question_id):
    from app.models.question import Question
    question = Question.query.get(question_id)
    if not question:
        return jsonify({'error': 'Question not found'}), 404
    
    quiz = quiz_service.get_quiz_by_id(question.quiz_id)
    if quiz.creator_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        schema = QuestionSchema()
        data = schema.load(request.json, partial=True)
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    
    question = question_service.update_question(
        question,
        prompt=data.get('prompt'),
        options=data.get('options'),
        correct_answer=data.get('correct_answer'),
        points=data.get('points'),
        order=data.get('order')
    )
    
    return jsonify(question.to_dict()), 200

@bp.route('/<int:question_id>', methods=['DELETE'])
@token_required
def delete_question(current_user, question_id):
    from app.models.question import Question
    question = Question.query.get(question_id)
    if not question:
        return jsonify({'error': 'Question not found'}), 404
    
    quiz = quiz_service.get_quiz_by_id(question.quiz_id)
    if quiz.creator_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    question_service.delete_question(question)
    return jsonify({'message': 'Question deleted successfully'}), 200

@bp.route('/reorder', methods=['POST'])
@token_required
def reorder_questions(current_user):
    data = request.json
    quiz_id = data.get('quiz_id')
    question_orders = data.get('orders', {})
    
    if not quiz_id:
        return jsonify({'error': 'quiz_id is required'}), 400
    
    quiz = quiz_service.get_quiz_by_id(quiz_id)
    if not quiz:
        return jsonify({'error': 'Quiz not found'}), 404
    
    if quiz.creator_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    question_service.reorder_questions(quiz_id, question_orders)
    return jsonify({'message': 'Questions reordered successfully'}), 200

