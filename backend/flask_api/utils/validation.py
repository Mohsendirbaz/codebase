from typing import Any, Dict, List, Optional, Union, TypeVar, Callable
from functools import wraps
from flask import request, jsonify
from marshmallow import Schema, ValidationError
import json
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')

class ValidationError(Exception):
    """Custom validation error that includes error details"""
    def __init__(self, message: str, errors: Optional[Dict[str, List[str]]] = None):
        super().__init__(message)
        self.message = message
        self.errors = errors or {}

def validate_json_payload(schema_cls: Schema) -> Callable:
    """Decorator to validate JSON payload against a Marshmallow schema"""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({
                    'error': 'Content-Type must be application/json',
                    'code': 'INVALID_CONTENT_TYPE'
                }), 400

            try:
                json_data = request.get_json()
                schema = schema_cls()
                validated_data = schema.load(json_data)
                return f(*args, validated_data=validated_data, **kwargs)
            except ValidationError as err:
                logger.warning(f"Validation error: {err.messages}")
                return jsonify({
                    'error': 'Invalid request data',
                    'details': err.messages,
                    'code': 'VALIDATION_ERROR'
                }), 400
            except json.JSONDecodeError:
                return jsonify({
                    'error': 'Invalid JSON format',
                    'code': 'INVALID_JSON'
                }), 400
            except Exception as e:
                logger.error(f"Unexpected error during validation: {str(e)}")
                return jsonify({
                    'error': 'Internal server error',
                    'code': 'INTERNAL_ERROR'
                }), 500
        return wrapper
    return decorator

def validate_websocket_message(schema_cls: Schema) -> Callable:
    """Decorator to validate WebSocket message data"""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapper(message: Dict[str, Any], *args, **kwargs):
            try:
                schema = schema_cls()
                validated_data = schema.load(message)
                return f(validated_data, *args, **kwargs)
            except ValidationError as err:
                logger.warning(f"WebSocket message validation error: {err.messages}")
                return {
                    'type': 'error',
                    'error': 'Invalid message data',
                    'details': err.messages,
                    'code': 'VALIDATION_ERROR'
                }
            except Exception as e:
                logger.error(f"Unexpected error during WebSocket validation: {str(e)}")
                return {
                    'type': 'error',
                    'error': 'Internal server error',
                    'code': 'INTERNAL_ERROR'
                }
        return wrapper
    return decorator

def validate_analysis_parameters(parameters: Dict[str, Any]) -> Union[Dict[str, Any], Dict[str, List[str]]]:
    """Validate analysis parameters"""
    errors: Dict[str, List[str]] = {}
    
    # Required fields
    required_fields = ['type', 'config']
    for field in required_fields:
        if field not in parameters:
            errors[field] = [f"{field} is required"]
    
    if errors:
        return {'errors': errors}
        
    # Validate analysis type
    valid_types = ['sensitivity', 'monte_carlo', 'optimization']
    if parameters['type'] not in valid_types:
        errors['type'] = [f"Invalid analysis type. Must be one of: {', '.join(valid_types)}"]
    
    # Validate configuration
    config = parameters.get('config', {})
    if not isinstance(config, dict):
        errors['config'] = ["Configuration must be an object"]
    else:
        # Validate based on analysis type
        if parameters['type'] == 'sensitivity':
            if 'parameter' not in config:
                errors['config.parameter'] = ["Parameter configuration is required"]
            if 'steps' in config and not isinstance(config['steps'], int):
                errors['config.steps'] = ["Steps must be an integer"]
            if 'range' in config:
                range_config = config['range']
                if not isinstance(range_config, dict):
                    errors['config.range'] = ["Range must be an object"]
                else:
                    if 'min' not in range_config or 'max' not in range_config:
                        errors['config.range'] = ["Range must include min and max values"]
                    elif not isinstance(range_config['min'], (int, float)) or not isinstance(range_config['max'], (int, float)):
                        errors['config.range'] = ["Range min and max must be numbers"]
                    elif range_config['min'] >= range_config['max']:
                        errors['config.range'] = ["Range min must be less than max"]
        
        elif parameters['type'] == 'monte_carlo':
            if 'iterations' not in config:
                errors['config.iterations'] = ["Number of iterations is required"]
            elif not isinstance(config['iterations'], int) or config['iterations'] <= 0:
                errors['config.iterations'] = ["Iterations must be a positive integer"]
            if 'parameters' not in config or not isinstance(config['parameters'], list):
                errors['config.parameters'] = ["Parameters must be an array"]
        
        elif parameters['type'] == 'optimization':
            if 'objective' not in config:
                errors['config.objective'] = ["Optimization objective is required"]
            if 'constraints' not in config or not isinstance(config['constraints'], list):
                errors['config.constraints'] = ["Constraints must be an array"]
    
    if errors:
        return {'errors': errors}
    
    return parameters

def validate_version(version: str) -> bool:
    """Validate version string format"""
    import re
    version_pattern = r'^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$'
    return bool(re.match(version_pattern, version))

def sanitize_parameter_name(name: str) -> str:
    """Sanitize parameter names to prevent injection"""
    import re
    # Remove any characters that aren't alphanumeric, underscore, or hyphen
    sanitized = re.sub(r'[^a-zA-Z0-9_-]', '', name)
    # Ensure it starts with a letter
    if sanitized and not sanitized[0].isalpha():
        sanitized = 'p_' + sanitized
    return sanitized

def validate_date_range(start_date: str, end_date: str) -> tuple[bool, Optional[str]]:
    """Validate date range format and logic"""
    from datetime import datetime
    try:
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        if end < start:
            return False, "End date must be after start date"
        return True, None
    except ValueError:
        return False, "Invalid date format. Use YYYY-MM-DD"

def validate_file_extension(filename: str, allowed_extensions: set) -> bool:
    """Validate file extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def validate_numeric_range(value: float, min_value: float, max_value: float) -> bool:
    """Validate numeric value within range"""
    return min_value <= value <= max_value

def validate_batch_size(size: int, max_size: int = 1000) -> bool:
    """Validate batch size"""
    return isinstance(size, int) and 1 <= size <= max_size
