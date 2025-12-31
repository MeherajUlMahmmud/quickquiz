import bcrypt
import jwt
import logging
from datetime import datetime, timedelta
from app.extensions import db
from app.models.user import User
from flask import current_app

logger = logging.getLogger(__name__)

class AuthService:
    @staticmethod
    def hash_password(password):
        """Hash a password using bcrypt"""
        logger.debug("Hashing password")
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        logger.debug("Password hashed successfully")
        return hashed
    
    @staticmethod
    def verify_password(password, password_hash):
        """Verify a password against a hash"""
        logger.debug("Verifying password")
        is_valid = bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        logger.debug(f"Password verification result: {is_valid}")
        return is_valid
    
    @staticmethod
    def generate_token(user_id):
        """Generate a JWT token for a user"""
        logger.info(f"Generating JWT token for user_id={user_id}")
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(days=7),
            'iat': datetime.utcnow()
        }
        token = jwt.encode(payload, current_app.config['JWT_SECRET'], algorithm='HS256')
        logger.info(f"JWT token generated successfully for user_id={user_id}")
        return token
    
    def register(self, email, password, name):
        """Register a new user"""
        logger.info(f"🔐 Registering new user: email={email}, name={name}")
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            logger.warning(f"⚠️ Registration failed: User with email {email} already exists")
            return {'error': 'User with this email already exists'}, 400
        
        try:
            # Hash password
            logger.debug(f"Hashing password for new user")
            password_hash = self.hash_password(password)
            
            # Create user
            logger.debug(f"Creating user record in database")
            user = User(
                email=email,
                password_hash=password_hash,
                name=name
            )
            
            db.session.add(user)
            db.session.commit()
            logger.info(f"✅ User created successfully: user_id={user.id}, email={email}")
            
            # Generate token
            token = self.generate_token(user.id)
            
            logger.info(f"🎉 Registration completed successfully: user_id={user.id}, email={email}")
            return {
                'user': user.to_dict(),
                'token': token
            }, 201
        except Exception as e:
            logger.error(f"💥 Registration failed with exception: {str(e)}", exc_info=True)
            db.session.rollback()
            raise
    
    def login(self, email, password):
        """Login a user"""
        logger.info(f"🔑 Login attempt: email={email}")
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            logger.warning(f"⚠️ Login failed: User not found with email={email}")
            return {'error': 'Invalid email or password'}, 401
        
        logger.debug(f"User found: user_id={user.id}, verifying password")
        password_valid = self.verify_password(password, user.password_hash)
        
        if not password_valid:
            logger.warning(f"⚠️ Login failed: Invalid password for email={email}, user_id={user.id}")
            return {'error': 'Invalid email or password'}, 401
        
        # Generate token
        token = self.generate_token(user.id)
        
        logger.info(f"✅ Login successful: user_id={user.id}, email={email}")
        return {
            'user': user.to_dict(),
            'token': token
        }, 200

