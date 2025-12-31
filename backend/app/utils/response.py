"""
Utility class for formatting standardized API responses.
All API responses follow a consistent structure with status, message, and data.
"""
from typing import Any, Optional, Dict

from flask import jsonify


class ResponseStatus:
    """Response status constants"""
    SUCCESS = "SUCCESS"
    FAIL = "FAIL"


class ResponseFormatter:
    """Utility class for formatting API responses"""

    @staticmethod
    def success(data: Any = None, message: str = "Operation completed successfully", status_code: int = 200) -> tuple:
        """
        Format a successful response.
        
        Args:
            data: The response data (can be any JSON-serializable type)
            message: Success message
            status_code: HTTP status code (default: 200)
            
        Returns:
            Tuple of (jsonify response, status_code)
        """
        response = {
            "status": ResponseStatus.SUCCESS,
            "message": message,
            "data": data
        }
        return jsonify(response), status_code

    @staticmethod
    def error(message: str, data: Optional[Any] = None, status_code: int = 400) -> tuple:
        """
        Format an error response.
        
        Args:
            message: Error message
            data: Optional error details or additional data
            status_code: HTTP status code (default: 400)
            
        Returns:
            Tuple of (jsonify response, status_code)
        """
        response = {
            "status": ResponseStatus.FAIL,
            "message": message,
            "data": data
        }
        return jsonify(response), status_code

    @staticmethod
    def validation_error(errors: Dict[str, Any], message: str = "Validation failed") -> tuple:
        """
        Format a validation error response.
        
        Args:
            errors: Dictionary of validation errors (typically from Marshmallow)
            message: Error message
            
        Returns:
            Tuple of (jsonify response, status_code 400)
        """
        return ResponseFormatter.error(
            message=message,
            data={"errors": errors},
            status_code=400
        )

    @staticmethod
    def not_found(resource: str = "Resource", message: Optional[str] = None) -> tuple:
        """
        Format a not found error response.
        
        Args:
            resource: Name of the resource that was not found
            message: Optional custom message
            
        Returns:
            Tuple of (jsonify response, status_code 404)
        """
        if message is None:
            message = f"{resource} not found"
        return ResponseFormatter.error(
            message=message,
            status_code=404
        )

    @staticmethod
    def unauthorized(message: str = "Unauthorized access") -> tuple:
        """
        Format an unauthorized error response.
        
        Args:
            message: Error message
            
        Returns:
            Tuple of (jsonify response, status_code 403)
        """
        return ResponseFormatter.error(
            message=message,
            status_code=403
        )

    @staticmethod
    def created(data: Any = None, message: str = "Resource created successfully") -> tuple:
        """
        Format a successful creation response.
        
        Args:
            data: The created resource data
            message: Success message
            
        Returns:
            Tuple of (jsonify response, status_code 201)
        """
        return ResponseFormatter.success(
            data=data,
            message=message,
            status_code=201
        )

    @staticmethod
    def server_error(message: str = "An internal server error occurred", data: Optional[Any] = None) -> tuple:
        """
        Format a server error response.
        
        Args:
            message: Error message
            data: Optional error details
            
        Returns:
            Tuple of (jsonify response, status_code 500)
        """
        return ResponseFormatter.error(
            message=message,
            data=data,
            status_code=500
        )
