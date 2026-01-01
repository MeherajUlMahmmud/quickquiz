from flask import Flask, request
import os
import logging
import sys
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv
from flask_cors import CORS
from app.extensions import db, migrate

load_dotenv()


def setup_logging(app):
    """Configure application logging following industry standards."""
    # Determine log level from environment
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    log_format = os.getenv('LOG_FORMAT', 'json')  # 'json' or 'text'

    # Set root logger level
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level, logging.INFO))

    # Remove default handlers
    root_logger.handlers = []

    # Import CustomFormatter from logger module
    from app.utils.logger import CustomFormatter
    
    # Create formatters
    if log_format == 'json':
        # JSON formatter for structured logging (industry standard)
        import json as json_module
        from datetime import datetime

        class JSONFormatter(CustomFormatter):
            def format(self, record):
                # Call parent to set trace_id and relativepath
                super().format(record)
                
                # Get trace_id from record (set by CustomFormatter)
                trace_id = getattr(record, 'trace_id', 'N/A')
                
                log_data = {
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'level': record.levelname,
                    'logger': record.name,
                    'message': record.getMessage(),
                    'trace_id': trace_id,
                }

                # Add extra fields if present
                if hasattr(record, 'type'):
                    log_data['type'] = record.type
                if hasattr(record, 'request_id'):
                    log_data['request_id'] = record.request_id
                if hasattr(record, 'method'):
                    log_data['method'] = record.method
                if hasattr(record, 'path'):
                    log_data['path'] = record.path
                if hasattr(record, 'status_code'):
                    log_data['status_code'] = record.status_code
                if hasattr(record, 'duration_ms'):
                    log_data['duration_ms'] = record.duration_ms
                if hasattr(record, 'remote_addr'):
                    log_data['remote_addr'] = record.remote_addr
                if hasattr(record, 'user_agent'):
                    log_data['user_agent'] = record.user_agent
                if hasattr(record, 'error_type'):
                    log_data['error_type'] = record.error_type
                if hasattr(record, 'error_message'):
                    log_data['error_message'] = record.error_message
                if hasattr(record, 'metadata'):
                    log_data['metadata'] = record.metadata

                # Add exception info if present
                if record.exc_info:
                    log_data['exception'] = self.formatException(
                        record.exc_info)

                return json_module.dumps(log_data)

        formatter = JSONFormatter()
    else:
        # Text formatter for development - automatically includes trace_id
        formatter = CustomFormatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(trace_id)s] - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )

    # Console handler (stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level, logging.INFO))
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # File handler (optional, for production)
    log_file = os.getenv('LOG_FILE')
    if log_file:
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(getattr(logging, log_level, logging.INFO))
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

    # Set specific logger levels
    logging.getLogger('werkzeug').setLevel(
        logging.WARNING)  # Reduce Flask's default logging
    logging.getLogger('sqlalchemy.engine').setLevel(
        logging.WARNING)  # Reduce SQLAlchemy logging


def create_app(config_name='development'):
    app = Flask(__name__)

    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        'DATABASE_URL', 'sqlite:///quickquiz.db',
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET'] = os.getenv('JWT_SECRET', 'your-secret-key')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-flask-secret-key')
    app.config['GROQ_API_KEY'] = os.getenv('GROQ_API_KEY', '')
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Configure CORS - simplified and more reliable
    allowed_origins = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')
    
    # Parse origins
    if allowed_origins == '*':
        cors_origins = '*'
        cors_credentials = False
    else:
        cors_origins = [origin.strip() for origin in allowed_origins.split(',') if origin.strip()]
        cors_credentials = True
    
    # CRITICAL: Handle OPTIONS FIRST, before CORS initialization
    # This ensures OPTIONS requests are handled before anything else can block them
    @app.before_request
    def handle_options_first():
        """Handle OPTIONS requests FIRST, before any other middleware"""
        if request.method == 'OPTIONS':
            from flask import Response
            origin = request.headers.get('Origin')
            
            # Check if origin is allowed
            is_allowed = False
            allow_origin = None
            
            if cors_origins == '*':
                is_allowed = True
                allow_origin = '*'
            elif isinstance(cors_origins, list) and origin:
                origin_normalized = origin.lower().rstrip('/')
                for allowed in cors_origins:
                    if origin_normalized == allowed.lower().rstrip('/'):
                        is_allowed = True
                        allow_origin = origin
                        break
            
            if is_allowed and allow_origin:
                response = Response()
                response.status_code = 200
                response.headers['Access-Control-Allow-Origin'] = allow_origin
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Request-ID, Accept, Origin'
                response.headers['Access-Control-Max-Age'] = '3600'
                if cors_credentials:
                    response.headers['Access-Control-Allow-Credentials'] = 'true'
                return response
    
    # Initialize CORS - disable automatic_options since we handle it manually above
    CORS(
        app,
        origins=cors_origins,
        supports_credentials=cors_credentials,
        allow_headers=['Content-Type', 'Authorization', 'X-Request-ID', 'Accept', 'Origin'],
        expose_headers=['X-Request-ID', 'X-Response-Time'],
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        vary_header=True,
        automatic_options=False  # We handle OPTIONS manually above
    )

    # Setup logging
    setup_logging(app)

    # Setup request logging middleware
    from app.utils.logger import setup_request_logging
    setup_request_logging(app)

    # Register blueprints
    from app.routes import auth, quizzes, questions, attempts
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(quizzes.bp, url_prefix='/api/quizzes')
    app.register_blueprint(questions.bp, url_prefix='/api/questions')
    app.register_blueprint(attempts.bp, url_prefix='/api/attempts')


    # Add after_request handler to ensure CORS headers on all responses
    # This runs after logger's after_request (Flask executes in reverse order)
    @app.after_request
    def add_cors_headers(response):
        """Ensure CORS headers are present on all responses"""
        origin = request.headers.get('Origin')
        
        if origin:
            # Check if origin is allowed
            is_allowed = False
            allow_origin = None
            
            if cors_origins == '*':
                is_allowed = True
                allow_origin = '*'
            elif isinstance(cors_origins, list):
                origin_normalized = origin.lower().rstrip('/')
                for allowed in cors_origins:
                    allowed_normalized = allowed.lower().rstrip('/')
                    if origin_normalized == allowed_normalized:
                        is_allowed = True
                        allow_origin = origin
                        break
            
            if is_allowed and allow_origin:
                # Add/overwrite CORS headers
                response.headers['Access-Control-Allow-Origin'] = allow_origin
                if cors_credentials:
                    response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        return response

    return app