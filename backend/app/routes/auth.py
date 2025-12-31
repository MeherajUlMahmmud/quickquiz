from flask import Blueprint, request
from flask_cors import cross_origin
from marshmallow import ValidationError

from app.services.auth_service import AuthService
from app.utils.decorators import token_required
from app.utils.response import ResponseFormatter
from app.utils.validators import RegisterSchema, LoginSchema

bp = Blueprint('auth', __name__)
auth_service = AuthService()


@bp.route('/register', methods=['POST'])
@cross_origin()
def register():
    try:
        schema = RegisterSchema()
        data = schema.load(request.json)
    except ValidationError as err:
        return ResponseFormatter.validation_error(err.messages)

    result, status_code = auth_service.register(
        data['email'],
        data['password'],
        data['name']
    )

    if 'error' in result:
        return ResponseFormatter.error(
            message=result.get('error', 'Registration failed'),
            status_code=status_code
        )

    # Registration successful
    return ResponseFormatter.created(
        data=result,
        message="User registered successfully"
    )


@bp.route('/login', methods=['POST'])
@cross_origin()
def login():
    try:
        schema = LoginSchema()
        data = schema.load(request.json)
    except ValidationError as err:
        return ResponseFormatter.validation_error(err.messages)

    result, status_code = auth_service.login(
        data['email'],
        data['password']
    )

    if 'error' in result:
        return ResponseFormatter.error(
            message=result.get('error', 'Login failed'),
            status_code=status_code
        )

    # Login successful
    return ResponseFormatter.success(
        data=result,
        message="Login successful"
    )


@bp.route('/me', methods=['GET'])
@cross_origin()
@token_required
def get_current_user(current_user):
    return ResponseFormatter.success(
        data=current_user.to_dict(),
        message="User information retrieved successfully"
    )
