from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app.services.auth_service import AuthService
from app.utils.decorators import token_required
from app.utils.validators import RegisterSchema, LoginSchema
from marshmallow import ValidationError

bp = Blueprint('auth', __name__)
auth_service = AuthService()

@bp.route('/register', methods=['POST'])
@cross_origin()
def register():
    try:
        schema = RegisterSchema()
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    
    result, status_code = auth_service.register(
        data['email'],
        data['password'],
        data['name']
    )
    
    if 'error' in result:
        return jsonify(result), status_code
    
    return jsonify(result), status_code

@bp.route('/login', methods=['POST'])
@cross_origin()
def login():
    try:
        schema = LoginSchema()
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    
    result, status_code = auth_service.login(
        data['email'],
        data['password']
    )
    
    if 'error' in result:
        return jsonify(result), status_code
    
    return jsonify(result), status_code

@bp.route('/me', methods=['GET'])
@cross_origin()
@token_required
def get_current_user(current_user):
    return jsonify(current_user.to_dict()), 200

