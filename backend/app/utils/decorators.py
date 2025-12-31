from functools import wraps

import jwt
from flask import request, jsonify, current_app

from app.models.user import User


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            token = token.split(' ')[1] if ' ' in token else token  # Remove 'Bearer ' prefix if present
            data = jwt.decode(token, current_app.config['JWT_SECRET'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid'}), 401
        except Exception as e:
            return jsonify({'message': 'Token validation failed'}), 401

        return f(current_user, *args, **kwargs)

    return decorated


def optional_token(f):
    """Decorator for routes that work with or without authentication"""

    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        current_user = None

        if token:
            try:
                token = token.split(' ')[1] if ' ' in token else token
                data = jwt.decode(token, current_app.config['JWT_SECRET'], algorithms=['HS256'])
                current_user = User.query.get(data['user_id'])
            except:
                pass  # Continue without user if token is invalid

        return f(current_user, *args, **kwargs)

    return decorated
