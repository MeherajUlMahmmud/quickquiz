import logging
from app.models.question import QuestionType
from app.models.attempt import Attempt, AttemptStatus, Answer
from app.extensions import db
from app.services.groq_service import GroqService
from flask import current_app

logger = logging.getLogger(__name__)

class ScoringService:
    def __init__(self):
        self.groq_service = GroqService()
    
    def score_mcq(self, question, user_answer):
        """Score an MCQ question"""
        
        logger.debug(f"📊 Scoring MCQ: question_id={question.id}, user_answer={user_answer}")
        
        correct_answer = question.get_correct_answer()
        options = question.get_options()
        
        if isinstance(correct_answer, list):
            # Multiple correct answers
            user_answers = [int(x) for x in user_answer.split(',') if x.isdigit()]
            user_answers.sort()
            correct_answer.sort()
            is_correct = user_answers == correct_answer
            logger.debug(f"MCQ multiple choice: user={user_answers}, correct={correct_answer}, result={is_correct}")
        else:
            # Single correct answer
            try:
                user_choice = int(user_answer)
                is_correct = user_choice == correct_answer
                logger.debug(f"MCQ single choice: user={user_choice}, correct={correct_answer}, result={is_correct}")
            except:
                is_correct = False
                logger.warning(f"⚠️ Invalid MCQ answer format: {user_answer}")
        
        points_earned = question.points if is_correct else 0
        logger.info(f"MCQ scored: question_id={question.id}, correct={is_correct}, points={points_earned}/{question.points}")
        return is_correct, points_earned, None
    
    def score_true_false(self, question, user_answer):
        """Score a True/False question"""
        
        logger.debug(f"📊 Scoring True/False: question_id={question.id}, user_answer={user_answer}")
        
        correct_answer = question.get_correct_answer()
        user_answer_bool = user_answer.lower() in ['true', '1', 'yes']
        is_correct = user_answer_bool == correct_answer
        
        logger.debug(f"True/False: user={user_answer_bool}, correct={correct_answer}, result={is_correct}")
        points_earned = question.points if is_correct else 0
        logger.info(f"True/False scored: question_id={question.id}, correct={is_correct}, points={points_earned}/{question.points}")
        return is_correct, points_earned, None
    
    def score_fill_blank(self, question, user_answer):
        """Score a Fill-in-blank question"""
        
        logger.debug(f"📊 Scoring Fill-in-blank: question_id={question.id}")
        
        correct_answers = question.get_correct_answer()
        if not isinstance(correct_answers, list):
            correct_answers = [correct_answers]
        
        user_answers = [a.strip().lower() for a in user_answer.split('|')]
        
        correct_count = 0
        for i, correct in enumerate(correct_answers):
            if i < len(user_answers):
                if str(correct).strip().lower() == user_answers[i]:
                    correct_count += 1
        
        is_correct = correct_count == len(correct_answers)
        points_earned = (correct_count / len(correct_answers)) * question.points if correct_answers else 0
        
        logger.debug(f"Fill-in-blank: correct_count={correct_count}/{len(correct_answers)}, result={is_correct}")
        logger.info(f"Fill-in-blank scored: question_id={question.id}, correct={is_correct}, points={points_earned}/{question.points}")
        return is_correct, points_earned, None
    
    def score_descriptive(self, question, user_answer, allow_ai_evaluation=False):
        """Score a descriptive question"""
        
        logger.debug(f"📊 Scoring Descriptive: question_id={question.id}, allow_ai={allow_ai_evaluation}")
        
        if allow_ai_evaluation:
            try:
                logger.info(f"🤖 Starting AI evaluation for question_id={question.id}")
                correct_answer = question.get_correct_answer()
                evaluation = self.groq_service.evaluate_answer(
                    question.prompt,
                    correct_answer,
                    user_answer
                )
                points_earned = evaluation['points_earned']
                is_correct = points_earned >= (question.points * 0.7)  # 70% threshold
                feedback = evaluation['feedback']
                
                logger.info(f"✅ AI evaluation completed: question_id={question.id}, score={points_earned}/{question.points}, correct={is_correct}")
                return is_correct, points_earned, feedback
            except Exception as e:
                # Fallback to manual scoring
                logger.error(f"💥 AI evaluation failed: question_id={question.id}, error={str(e)}", exc_info=True)
                return None, 0, f"AI evaluation failed: {str(e)}"
        else:
            # Manual scoring required
            logger.debug(f"Manual scoring required for question_id={question.id}")
            return None, 0, None
    
    def score_answer(self, question, user_answer, allow_ai_evaluation=False):
        """Score an answer based on question type"""
        if question.type == QuestionType.MCQ:
            return self.score_mcq(question, user_answer)
        elif question.type == QuestionType.TRUE_FALSE:
            return self.score_true_false(question, user_answer)
        elif question.type == QuestionType.FILL_BLANK:
            return self.score_fill_blank(question, user_answer)
        elif question.type == QuestionType.DESCRIPTIVE:
            return self.score_descriptive(question, user_answer, allow_ai_evaluation)
        else:
            return False, 0, None
    
    def submit_attempt(self, attempt):
        """Submit and score an attempt"""
        
        logger.info(f"📝 Submitting attempt: attempt_id={attempt.id}, quiz_id={attempt.quiz_id}")
        
        if attempt.status == AttemptStatus.SUBMITTED:
            logger.warning(f"⚠️ Attempt already submitted: attempt_id={attempt.id}")
            return attempt  # Already submitted
        
        try:
            quiz = attempt.quiz
            allow_ai_evaluation = quiz.settings.allow_ai_evaluation if quiz.settings else False
            logger.debug(f"Scoring attempt with AI evaluation: {allow_ai_evaluation}")
            
            total_points = 0
            earned_points = 0
            answered_count = len(attempt.answers)
            
            logger.info(f"Scoring {answered_count} answer(s) for attempt_id={attempt.id}")
            
            for idx, answer in enumerate(attempt.answers, 1):
                question = answer.question
                total_points += question.points
                
                logger.debug(f"Scoring answer {idx}/{answered_count}: question_id={question.id}, type={question.type}")
                
                is_correct, points, feedback = self.score_answer(
                    question,
                    answer.answer_text,
                    allow_ai_evaluation
                )
                
                answer.is_correct = is_correct
                answer.points_earned = points
                if feedback:
                    answer.ai_feedback = feedback
                
                earned_points += points
                logger.debug(f"Answer {idx} scored: points={points}/{question.points}, correct={is_correct}")
            
            from datetime import datetime
            attempt.score = earned_points
            attempt.total_points = total_points
            attempt.status = AttemptStatus.SUBMITTED
            attempt.submitted_at = datetime.utcnow()
            
            db.session.commit()
            
            percentage = (earned_points / total_points * 100) if total_points > 0 else 0
            logger.info(f"✅ Attempt submitted successfully: attempt_id={attempt.id}, score={earned_points}/{total_points} ({percentage:.1f}%)")
            return attempt
        except Exception as e:
            logger.error(f"💥 Attempt submission failed: attempt_id={attempt.id}, error={str(e)}", exc_info=True)
            db.session.rollback()
            raise

