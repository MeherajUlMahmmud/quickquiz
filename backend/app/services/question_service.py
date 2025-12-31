import logging
from app.extensions import db
from app.models.question import Question, QuestionType
from flask import current_app

logger = logging.getLogger(__name__)

class QuestionService:
    def create_question(self, quiz_id, question_type, prompt, options=None,
                       correct_answer=None, points=1, order=0):
        """Create a new question"""
        
        logger.info(f"❓ Creating question: quiz_id={quiz_id}, type={question_type}, order={order}")
        
        try:
            # Validate question data
            is_valid, error_msg = self.validate_question_data(question_type, options, correct_answer)
            if not is_valid:
                logger.warning(f"⚠️ Question validation failed: {error_msg}")
                raise ValueError(error_msg)
            
            question = Question(
                quiz_id=quiz_id,
                type=question_type,
                prompt=prompt,
                points=points,
                order=order
            )
            
            if options:
                question.set_options(options)
                logger.debug(f"Set {len(options)} options for question")
            if correct_answer is not None:
                question.set_correct_answer(correct_answer)
                logger.debug(f"Set correct answer for question")
            
            db.session.add(question)
            db.session.commit()
            logger.info(f"✅ Question created successfully: question_id={question.id}, quiz_id={quiz_id}")
            return question
        except Exception as e:
            logger.error(f"💥 Question creation failed: quiz_id={quiz_id}, error={str(e)}", exc_info=True)
            db.session.rollback()
            raise
    
    def update_question(self, question, prompt=None, options=None,
                      correct_answer=None, points=None, order=None):
        """Update a question"""
        
        logger.info(f"✏️ Updating question: question_id={question.id}")
        
        try:
            updates = []
            if prompt is not None:
                question.prompt = prompt
                updates.append("prompt")
            if options is not None:
                question.set_options(options)
                updates.append(f"options({len(options)})")
            if correct_answer is not None:
                question.set_correct_answer(correct_answer)
                updates.append("correct_answer")
            if points is not None:
                question.points = points
                updates.append(f"points={points}")
            if order is not None:
                question.order = order
                updates.append(f"order={order}")
            
            if updates:
                logger.debug(f"Question fields updated: {', '.join(updates)}")
            
            db.session.commit()
            logger.info(f"✅ Question updated successfully: question_id={question.id}")
            return question
        except Exception as e:
            logger.error(f"💥 Question update failed: question_id={question.id}, error={str(e)}", exc_info=True)
            db.session.rollback()
            raise
    
    def get_questions_by_quiz(self, quiz_id):
        """Get all questions for a quiz"""
        
        logger.debug(f"🔍 Fetching questions for quiz: quiz_id={quiz_id}")
        questions = Question.query.filter_by(quiz_id=quiz_id).order_by(Question.order).all()
        logger.info(f"Found {len(questions)} question(s) for quiz_id={quiz_id}")
        return questions
    
    def delete_question(self, question):
        """Delete a question"""
        
        question_id = question.id
        quiz_id = question.quiz_id
        logger.info(f"🗑️ Deleting question: question_id={question_id}, quiz_id={quiz_id}")
        try:
            db.session.delete(question)
            db.session.commit()
            logger.info(f"✅ Question deleted successfully: question_id={question_id}")
        except Exception as e:
            logger.error(f"💥 Question deletion failed: question_id={question_id}, error={str(e)}", exc_info=True)
            db.session.rollback()
            raise
    
    def reorder_questions(self, quiz_id, question_orders):
        """Reorder questions"""
        
        logger.info(f"🔄 Reordering questions: quiz_id={quiz_id}, count={len(question_orders)}")
        try:
            updated_count = 0
            for q_id, order in question_orders.items():
                question = Question.query.get(q_id)
                if question and question.quiz_id == quiz_id:
                    question.order = order
                    updated_count += 1
                    logger.debug(f"Updated question order: question_id={q_id}, order={order}")
            
            db.session.commit()
            logger.info(f"✅ Reordered {updated_count} question(s) for quiz_id={quiz_id}")
        except Exception as e:
            logger.error(f"💥 Question reordering failed: quiz_id={quiz_id}, error={str(e)}", exc_info=True)
            db.session.rollback()
            raise
    
    def validate_question_data(self, question_type, options=None, correct_answer=None):
        """Validate question data based on type"""
        
        logger.debug(f"🔍 Validating question data: type={question_type}")
        
        if question_type == QuestionType.MCQ:
            if not options or len(options) < 2:
                logger.warning(f"Validation failed: MCQ needs at least 2 options")
                return False, "MCQ questions must have at least 2 options"
            if correct_answer is None:
                logger.warning(f"Validation failed: MCQ needs correct answer")
                return False, "MCQ questions must have a correct answer"
        elif question_type == QuestionType.TRUE_FALSE:
            if correct_answer is None:
                logger.warning(f"Validation failed: True/False needs correct answer")
                return False, "True/False questions must have a correct answer"
        elif question_type == QuestionType.FILL_BLANK:
            if not correct_answer:
                logger.warning(f"Validation failed: Fill-in-blank needs correct answers")
                return False, "Fill-in-blank questions must have correct answers"
        
        logger.debug(f"✅ Question data validation passed")
        return True, None

