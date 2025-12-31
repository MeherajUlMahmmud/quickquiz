import logging
import secrets
import string

from app.extensions import db
from app.models.quiz import Quiz, QuizSettings

logger = logging.getLogger(__name__)


class QuizService:
    @staticmethod
    def generate_share_code():
        """Generate a unique share code"""
        logger.debug("Generating unique share code")
        alphabet = string.ascii_uppercase + string.digits
        attempts = 0
        while True:
            attempts += 1
            code = ''.join(secrets.choice(alphabet) for _ in range(8))
            if not Quiz.query.filter_by(share_code=code).first():
                logger.debug(f"Share code generated after {attempts} attempt(s): {code}")
                return code
            if attempts > 10:
                logger.warning(f"Share code generation taking too long ({attempts} attempts)")

    def create_quiz(self, creator_id, title, description=None, is_survey=False,
                    requires_login=False, settings=None):
        """Create a new quiz"""

        logger.info(f"📝 Creating quiz: creator_id={creator_id}, title={title}, is_survey={is_survey}")

        try:
            share_code = self.generate_share_code()
            logger.debug(f"Generated share_code={share_code}")

            quiz = Quiz(
                creator_id=creator_id,
                title=title,
                description=description,
                is_survey=is_survey,
                requires_login=requires_login,
                share_code=share_code
            )

            db.session.add(quiz)
            db.session.flush()
            logger.debug(f"Quiz created with id={quiz.id}")

            # Create settings
            quiz_settings = QuizSettings(
                quiz_id=quiz.id,
                allow_ai_evaluation=settings.get('allow_ai_evaluation', False) if settings else False,
                time_limit=settings.get('time_limit') if settings else None,
                show_results_immediately=settings.get('show_results_immediately', True) if settings else True,
                allow_retake=settings.get('allow_retake', False) if settings else False,
                randomize_question_order=settings.get('randomize_question_order', False) if settings else False,
                randomize_answer_options=settings.get('randomize_answer_options', False) if settings else False,
                enable_anti_cheating=settings.get('enable_anti_cheating', False) if settings else False
            )

            if settings and settings.get('custom_fields'):
                quiz_settings.set_custom_fields(settings['custom_fields'])
                logger.debug(f"Custom fields set for quiz_id={quiz.id}")

            db.session.add(quiz_settings)
            db.session.commit()

            logger.info(f"✅ Quiz created successfully: quiz_id={quiz.id}, share_code={share_code}")
            return quiz
        except Exception as e:
            logger.error(f"💥 Quiz creation failed: {str(e)}", exc_info=True)
            db.session.rollback()
            raise

    def update_quiz(self, quiz, title=None, description=None, is_survey=None,
                    requires_login=None, settings=None):
        """Update a quiz"""

        logger.info(f"✏️ Updating quiz: quiz_id={quiz.id}")

        try:
            updates = []
            if title is not None:
                quiz.title = title
                updates.append(f"title={title}")
            if description is not None:
                quiz.description = description
                updates.append(f"description={'set' if description else 'cleared'}")
            if is_survey is not None:
                quiz.is_survey = is_survey
                updates.append(f"is_survey={is_survey}")
            if requires_login is not None:
                quiz.requires_login = requires_login
                updates.append(f"requires_login={requires_login}")

            if updates:
                logger.debug(f"Quiz fields updated: {', '.join(updates)}")

            if settings and quiz.settings:
                setting_updates = []
                if 'allow_ai_evaluation' in settings:
                    quiz.settings.allow_ai_evaluation = settings['allow_ai_evaluation']
                    setting_updates.append(f"allow_ai_evaluation={settings['allow_ai_evaluation']}")
                if 'time_limit' in settings:
                    quiz.settings.time_limit = settings['time_limit']
                    setting_updates.append(f"time_limit={settings['time_limit']}")
                if 'show_results_immediately' in settings:
                    quiz.settings.show_results_immediately = settings['show_results_immediately']
                    setting_updates.append(f"show_results_immediately={settings['show_results_immediately']}")
                if 'allow_retake' in settings:
                    quiz.settings.allow_retake = settings['allow_retake']
                    setting_updates.append(f"allow_retake={settings['allow_retake']}")
                if 'randomize_question_order' in settings:
                    quiz.settings.randomize_question_order = settings['randomize_question_order']
                    setting_updates.append(f"randomize_question_order={settings['randomize_question_order']}")
                if 'randomize_answer_options' in settings:
                    quiz.settings.randomize_answer_options = settings['randomize_answer_options']
                    setting_updates.append(f"randomize_answer_options={settings['randomize_answer_options']}")
                if 'enable_anti_cheating' in settings:
                    quiz.settings.enable_anti_cheating = settings['enable_anti_cheating']
                    setting_updates.append(f"enable_anti_cheating={settings['enable_anti_cheating']}")
                if 'custom_fields' in settings:
                    quiz.settings.set_custom_fields(settings['custom_fields'])
                    setting_updates.append("custom_fields=set")

                if setting_updates:
                    logger.debug(f"Quiz settings updated: {', '.join(setting_updates)}")

            db.session.commit()
            logger.info(f"✅ Quiz updated successfully: quiz_id={quiz.id}")
            return quiz
        except Exception as e:
            logger.error(f"💥 Quiz update failed: quiz_id={quiz.id}, error={str(e)}", exc_info=True)
            db.session.rollback()
            raise

    def get_quiz_by_id(self, quiz_id):
        """Get a quiz by ID"""

        logger.debug(f"🔍 Fetching quiz by id: quiz_id={quiz_id}")
        quiz = Quiz.query.get(quiz_id)
        if quiz:
            logger.debug(f"Quiz found: quiz_id={quiz_id}, title={quiz.title}")
        else:
            logger.warning(f"⚠️ Quiz not found: quiz_id={quiz_id}")
        return quiz

    def get_quiz_by_share_code(self, share_code):
        """Get a quiz by share code"""

        logger.debug(f"🔍 Fetching quiz by share_code: share_code={share_code}")
        quiz = Quiz.query.filter_by(share_code=share_code).first()
        if quiz:
            logger.debug(f"Quiz found: quiz_id={quiz.id}, share_code={share_code}")
        else:
            logger.warning(f"⚠️ Quiz not found: share_code={share_code}")
        return quiz

    def get_user_quizzes(self, user_id):
        """Get all quizzes created by a user"""

        logger.debug(f"🔍 Fetching quizzes for user: user_id={user_id}")
        quizzes = Quiz.query.filter_by(creator_id=user_id).order_by(Quiz.created_at.desc()).all()
        logger.info(f"Found {len(quizzes)} quiz(es) for user_id={user_id}")
        return quizzes

    def delete_quiz(self, quiz):
        """Delete a quiz"""

        quiz_id = quiz.id
        logger.info(f"🗑️ Deleting quiz: quiz_id={quiz_id}, title={quiz.title}")
        try:
            db.session.delete(quiz)
            db.session.commit()
            logger.info(f"✅ Quiz deleted successfully: quiz_id={quiz_id}")
        except Exception as e:
            logger.error(f"💥 Quiz deletion failed: quiz_id={quiz_id}, error={str(e)}", exc_info=True)
            db.session.rollback()
            raise
