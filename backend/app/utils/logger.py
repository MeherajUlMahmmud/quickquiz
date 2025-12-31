"""
Request logging middleware following industry standards.
Logs HTTP requests with structured data including request IDs, timing, and metadata.
"""
import json
import logging
import time
import uuid
from contextvars import ContextVar
from pathlib import Path

from flask import request, g, has_request_context

# Context variable for trace_id
trace_id_context = ContextVar('trace_id', default=None)

# Determine the project root directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

logger = logging.getLogger(__name__)


class CustomFormatter(logging.Formatter):
    """Custom formatter that automatically adds trace_id and relative paths."""

    def format(self, record):
        # Convert the pathname to a relative path
        if record.pathname:
            try:
                record.relativepath = str(Path(record.pathname).relative_to(PROJECT_ROOT))
            except ValueError:
                # If path is outside project root, use full path
                record.relativepath = record.pathname
        else:
            record.relativepath = record.pathname

        # Add trace_id from context
        trace_id = trace_id_context.get()
        if trace_id:
            # Use short version (first 8 chars) for readability
            record.trace_id = trace_id[:8] if len(trace_id) > 8 else trace_id
        else:
            record.trace_id = 'N/A'

        return super().format(record)


def generate_request_id():
    """Generate a unique request ID for tracing."""
    return str(uuid.uuid4())


def get_client_ip():
    """Extract client IP address from request."""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    else:
        return request.remote_addr or 'unknown'


def sanitize_headers(headers):
    """Remove sensitive headers from logging."""
    sensitive_headers = ['authorization', 'cookie', 'x-api-key', 'x-auth-token']
    sanitized = {}
    for key, value in headers.items():
        if key.lower() in sensitive_headers:
            sanitized[key] = '***REDACTED***'
        else:
            sanitized[key] = value
    return sanitized


def get_request_body():
    """Safely extract and parse request body."""
    try:
        if request.is_json:
            return request.get_json(silent=True)
        elif request.data:
            # Try to parse as JSON, fallback to string
            try:
                return json.loads(request.data.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                body_str = request.data.decode('utf-8', errors='replace')
                # Truncate very long bodies
                if len(body_str) > 1000:
                    return body_str[:1000] + '... [truncated]'
                return body_str
        elif request.form:
            return dict(request.form)
        elif request.args:
            return dict(request.args)
    except Exception as e:
        return f'[Error reading body: {str(e)}]'
    return None


def get_response_body(response):
    """Safely extract response body for logging."""
    try:
        if response.data:
            # Try to parse as JSON
            try:
                body = json.loads(response.data.decode('utf-8'))
                # Sanitize sensitive fields
                if isinstance(body, dict):
                    sanitized = body.copy()
                    for key in ['password', 'token', 'secret', 'api_key', 'access_token']:
                        if key in sanitized:
                            sanitized[key] = '***REDACTED***'
                    return sanitized
                return body
            except (json.JSONDecodeError, UnicodeDecodeError):
                body_str = response.data.decode('utf-8', errors='replace')
                # Truncate very long bodies
                if len(body_str) > 1000:
                    return body_str[:1000] + '... [truncated]'
                return body_str
    except Exception:
        return '[Unable to read response body]'
    return None


def log_request_info():
    """Log incoming request information."""
    if not has_request_context():
        return

    # Skip logging for OPTIONS requests (CORS preflight)
    if request.method == 'OPTIONS':
        return

    # Generate or retrieve request ID
    request_id = request.headers.get('X-Request-ID') or generate_request_id()
    g.request_id = request_id
    g.request_start_time = time.time()

    # Set trace_id in context for automatic inclusion in all logs
    trace_id_context.set(request_id)

    # Get request body
    request_body = get_request_body()
    query_params = dict(request.args) if request.args else None

    # Prepare request metadata
    request_metadata = {
        'request_id': request_id,
        'method': request.method,
        'path': request.path,
        'full_url': request.url,
        'query_params': query_params,
        'request_body': request_body,
        'remote_addr': get_client_ip(),
        'user_agent': request.headers.get('User-Agent', 'unknown'),
        'content_type': request.headers.get('Content-Type'),
        'content_length': request.headers.get('Content-Length'),
        'headers': sanitize_headers(dict(request.headers)),
    }

    # Build comprehensive log message
    log_parts = [
        f"{request.method} {request.path}",
        f"from {get_client_ip()}",
    ]
    if query_params:
        log_parts.append(f"query={query_params}")
    if request_body:
        body_str = json.dumps(request_body) if isinstance(request_body, (dict, list)) else str(request_body)
        if len(body_str) > 200:
            body_str = body_str[:200] + '...'
        log_parts.append(f"body={body_str}")

    log_message = " | ".join(log_parts)

    # Log request with comprehensive details (trace_id automatically included by formatter)
    logger.info(
        log_message,
        extra={
            'type': 'http_request',
            'request_id': request_id,
            'method': request.method,
            'path': request.path,
            'remote_addr': get_client_ip(),
            'user_agent': request.headers.get('User-Agent', 'unknown'),
            'metadata': request_metadata
        }
    )


def log_response_info(response):
    """Log response information."""
    if not has_request_context():
        return response

    # Skip logging for OPTIONS requests (CORS preflight)
    if request.method == 'OPTIONS':
        return response

    # Calculate response time
    request_id = getattr(g, 'request_id', 'unknown')
    start_time = getattr(g, 'request_start_time', time.time())
    duration_ms = (time.time() - start_time) * 1000

    # Get response body (especially for errors)
    response_body = None
    if response.status_code >= 400:
        response_body = get_response_body(response)

    # Prepare response metadata
    response_metadata = {
        'request_id': request_id,
        'status_code': response.status_code,
        'duration_ms': round(duration_ms, 2),
        'content_length': response.headers.get('Content-Length'),
        'content_type': response.headers.get('Content-Type'),
        'response_body': response_body,
    }

    # Determine log level and status emoji based on status code
    if response.status_code >= 500:
        log_level = logging.ERROR
        status_emoji = "❌"
    elif response.status_code >= 400:
        log_level = logging.WARNING
        status_emoji = "⚠️"
    else:
        log_level = logging.INFO
        status_emoji = "✅"

    # Build comprehensive log message
    log_parts = [
        f"{status_emoji} {request.method} {request.path}",
        f"→ {response.status_code}",
        f"({round(duration_ms, 2)}ms)",
    ]

    if response_body:
        body_str = json.dumps(response_body) if isinstance(response_body, (dict, list)) else str(response_body)
        if len(body_str) > 300:
            body_str = body_str[:300] + '...'
        log_parts.append(f"response={body_str}")

    log_message = " | ".join(log_parts)

    # Log response with comprehensive details (trace_id automatically included by formatter)
    logger.log(
        log_level,
        log_message,
        extra={
            'type': 'http_response',
            'request_id': request_id,
            'method': request.method,
            'path': request.path,
            'status_code': response.status_code,
            'duration_ms': round(duration_ms, 2),
            'remote_addr': get_client_ip(),
            'metadata': response_metadata
        }
    )

    # Add request ID to response headers
    response.headers['X-Request-ID'] = request_id
    response.headers['X-Response-Time'] = f'{round(duration_ms, 2)}ms'

    return response


def log_exception(error):
    """Log exceptions with full context."""
    if not has_request_context():
        return

    request_id = getattr(g, 'request_id', 'unknown')
    start_time = getattr(g, 'request_start_time', time.time())
    duration_ms = (time.time() - start_time) * 1000

    # Get request body for context
    request_body = get_request_body()

    error_message = f"💥 EXCEPTION in {request.method} {request.path} | {type(error).__name__}: {str(error)} | ({round(duration_ms, 2)}ms)"

    # Log error (trace_id automatically included by formatter)
    logger.error(
        error_message,
        exc_info=True,
        extra={
            'type': 'http_exception',
            'request_id': request_id,
            'method': request.method,
            'path': request.path,
            'remote_addr': get_client_ip(),
            'duration_ms': round(duration_ms, 2),
            'error_type': type(error).__name__,
            'error_message': str(error),
            'request_body': request_body,
            'traceback': True
        }
    )


def setup_request_logging(app):
    """Set up request logging middleware for Flask app."""

    @app.before_request
    def before_request():
        log_request_info()

    @app.after_request
    def after_request(response):
        result = log_response_info(response)
        # Clear trace_id context after request is processed
        trace_id_context.set(None)
        return result

    # Log unhandled exceptions
    @app.teardown_request
    def teardown_request(exception):
        if exception is not None:
            log_exception(exception)
        # Clear trace_id context after request is processed
        trace_id_context.set(None)
