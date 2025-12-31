import logging
from datetime import datetime
from app.extensions import db
from app.models.attempt import Attempt, Answer, AttemptStatus
from app.models.quiz import Quiz
from flask import current_app

logger = logging.getLogger(__name__)

class AttemptService:
    def start_attempt(self, quiz_id, user_id=None, participant_name=None, participant_info=None):
        """Start a new attempt"""
        
        logger.info(f"🚀 Starting attempt: quiz_id={quiz_id}, user_id={user_id}, participant_name={participant_name}")
        
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            logger.warning(f"⚠️ Attempt start failed: Quiz not found, quiz_id={quiz_id}")
            return None, "Quiz not found"
        
        # Check login requirement
        if quiz.requires_login and not user_id:
            logger.warning(f"⚠️ Attempt start failed: Login required for quiz_id={quiz_id}")
            return None, "Login required for this quiz"
        
        try:
            attempt = Attempt(
                quiz_id=quiz_id,
                user_id=user_id,
                participant_name=participant_name,
                status=AttemptStatus.IN_PROGRESS
            )
            
            if participant_info:
                attempt.set_participant_info(participant_info)
                logger.debug(f"Set participant info for attempt")
            
            db.session.add(attempt)
            db.session.commit()
            
            logger.info(f"✅ Attempt started successfully: attempt_id={attempt.id}, quiz_id={quiz_id}")
            return attempt, None
        except Exception as e:
            logger.error(f"💥 Attempt start failed: quiz_id={quiz_id}, error={str(e)}", exc_info=True)
            db.session.rollback()
            raise
    
    def save_answer(self, attempt_id, question_id, answer_text):
        """Save or update an answer"""
        
        logger.info(f"💾 Saving answer: attempt_id={attempt_id}, question_id={question_id}")
        
        attempt = Attempt.query.get(attempt_id)
        if not attempt:
            logger.warning(f"⚠️ Answer save failed: Attempt not found, attempt_id={attempt_id}")
            return None, "Attempt not found"
        
        if attempt.status == AttemptStatus.SUBMITTED:
            logger.warning(f"⚠️ Answer save failed: Attempt already submitted, attempt_id={attempt_id}")
            return None, "Cannot modify submitted attempt"
        
        try:
            # Check if answer already exists
            answer = Answer.query.filter_by(
                attempt_id=attempt_id,
                question_id=question_id
            ).first()
            
            if answer:
                logger.debug(f"Updating existing answer: answer_id={answer.id}")
                answer.answer_text = answer_text
            else:
                logger.debug(f"Creating new answer")
                answer = Answer(
                    attempt_id=attempt_id,
                    question_id=question_id,
                    answer_text=answer_text
                )
                db.session.add(answer)
            
            db.session.commit()
            logger.info(f"✅ Answer saved successfully: answer_id={answer.id}, attempt_id={attempt_id}")
            return answer, None
        except Exception as e:
            logger.error(f"💥 Answer save failed: attempt_id={attempt_id}, question_id={question_id}, error={str(e)}", exc_info=True)
            db.session.rollback()
            raise
    
    def update_attempt(self, attempt_id, participant_name=None, participant_info=None):
        """Update attempt metadata"""
        
        logger.info(f"✏️ Updating attempt: attempt_id={attempt_id}")
        
        attempt = Attempt.query.get(attempt_id)
        if not attempt:
            logger.warning(f"⚠️ Attempt update failed: Attempt not found, attempt_id={attempt_id}")
            return None, "Attempt not found"
        
        if attempt.status == AttemptStatus.SUBMITTED:
            logger.warning(f"⚠️ Attempt update failed: Attempt already submitted, attempt_id={attempt_id}")
            return None, "Cannot modify submitted attempt"
        
        try:
            updates = []
            if participant_name is not None:
                attempt.participant_name = participant_name
                updates.append(f"participant_name={participant_name}")
            if participant_info is not None:
                attempt.set_participant_info(participant_info)
                updates.append("participant_info=set")
            
            if updates:
                logger.debug(f"Attempt fields updated: {', '.join(updates)}")
            
            db.session.commit()
            logger.info(f"✅ Attempt updated successfully: attempt_id={attempt_id}")
            return attempt, None
        except Exception as e:
            logger.error(f"💥 Attempt update failed: attempt_id={attempt_id}, error={str(e)}", exc_info=True)
            db.session.rollback()
            raise
    
    def get_attempt(self, attempt_id, include_answers=True):
        """Get an attempt by ID"""
        
        logger.debug(f"🔍 Fetching attempt: attempt_id={attempt_id}, include_answers={include_answers}")
        attempt = Attempt.query.get(attempt_id)
        if attempt:
            logger.debug(f"Attempt found: attempt_id={attempt_id}, status={attempt.status}")
        else:
            logger.warning(f"⚠️ Attempt not found: attempt_id={attempt_id}")
        return attempt
    
    def get_quiz_attempts(self, quiz_id, user_id=None):
        """Get all attempts for a quiz (owner only)"""
        
        logger.debug(f"🔍 Fetching attempts for quiz: quiz_id={quiz_id}, user_id={user_id}")
        
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            logger.warning(f"⚠️ Quiz not found: quiz_id={quiz_id}")
            return []
        
        # Check ownership
        if user_id and quiz.creator_id != user_id:
            logger.warning(f"⚠️ Access denied: user_id={user_id} is not owner of quiz_id={quiz_id}")
            return []
        
        attempts = Attempt.query.filter_by(quiz_id=quiz_id).order_by(Attempt.started_at.desc()).all()
        logger.info(f"Found {len(attempts)} attempt(s) for quiz_id={quiz_id}")
        return attempts

