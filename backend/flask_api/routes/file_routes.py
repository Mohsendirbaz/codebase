from flask import Blueprint, request, jsonify, send_file
from marshmallow import Schema, fields, validate
import os
import sys

# Add necessary paths
current_dir = os.path.dirname(os.path.abspath(__file__))
flask_api_dir = os.path.dirname(current_dir)
if flask_api_dir not in sys.path:
    sys.path.insert(0, flask_api_dir)

# Direct imports
from utils.validation import validate_json_payload, validate_file_extension
from werkzeug.utils import secure_filename
import os
import json
import logging
import uuid
from datetime import datetime
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

file_bp = Blueprint('file', __name__)

# Configuration
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
ALLOWED_EXTENSIONS = {'csv', 'json', 'xlsx'}
MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16777216))  # 16MB default

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Schema definitions
class FileMetadataSchema(Schema):
    filename = fields.Str(required=True)
    file_type = fields.Str(required=True)
    description = fields.Str(required=False)
    tags = fields.List(fields.Str(), required=False)

class DataTransformSchema(Schema):
    operations = fields.List(fields.Dict(), required=True)
    output_format = fields.Str(required=True, validate=validate.OneOf(['csv', 'json', 'xlsx']))

@file_bp.route('/upload', methods=['POST'])
def upload_file():
    """Upload a file with metadata"""
    try:
        if 'file' not in request.files:
            return jsonify({
                'error': 'No file provided',
                'code': 'FILE_MISSING'
            }), 400

        file = request.files['file']
        if not file.filename:
            return jsonify({
                'error': 'No filename provided',
                'code': 'FILENAME_MISSING'
            }), 400

        if not validate_file_extension(file.filename, ALLOWED_EXTENSIONS):
            return jsonify({
                'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}',
                'code': 'INVALID_FILE_TYPE'
            }), 400

        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        filename = secure_filename(f"{timestamp}_{unique_id}_{file.filename}")
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        # Save file
        file.save(filepath)

        # Parse metadata if provided
        metadata = {}
        if 'metadata' in request.form:
            try:
                metadata = json.loads(request.form['metadata'])
            except json.JSONDecodeError:
                logger.warning("Invalid metadata JSON provided")

        # Add system metadata
        metadata.update({
            'upload_timestamp': datetime.now().isoformat(),
            'file_size': os.path.getsize(filepath),
            'original_filename': file.filename,
            'stored_filename': filename
        })

        return jsonify({
            'message': 'File uploaded successfully',
            'filename': filename,
            'metadata': metadata
        })

    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'File upload failed',
            'message': str(e)
        }), 500

@file_bp.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    """Download a file"""
    try:
        filepath = os.path.join(UPLOAD_FOLDER, secure_filename(filename))
        
        if not os.path.exists(filepath):
            return jsonify({
                'error': 'File not found',
                'code': 'FILE_NOT_FOUND'
            }), 404

        return send_file(
            filepath,
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'File download failed',
            'message': str(e)
        }), 500

@file_bp.route('/transform', methods=['POST'])
@validate_json_payload(DataTransformSchema)
def transform_data(validated_data):
    """Transform data file according to specified operations"""
    try:
        if 'file' not in request.files:
            return jsonify({
                'error': 'No file provided',
                'code': 'FILE_MISSING'
            }), 400

        file = request.files['file']
        operations = validated_data['operations']
        output_format = validated_data['output_format']

        # Read input file
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith('.xlsx'):
            df = pd.read_excel(file)
        elif file.filename.endswith('.json'):
            df = pd.read_json(file)
        else:
            return jsonify({
                'error': 'Unsupported file format',
                'code': 'INVALID_FORMAT'
            }), 400

        # Apply transformations
        for operation in operations:
            op_type = operation.get('type')
            if op_type == 'filter':
                column = operation.get('column')
                condition = operation.get('condition')
                value = operation.get('value')
                
                if condition == 'equals':
                    df = df[df[column] == value]
                elif condition == 'greater_than':
                    df = df[df[column] > value]
                elif condition == 'less_than':
                    df = df[df[column] < value]
                
            elif op_type == 'aggregate':
                group_by = operation.get('group_by')
                agg_func = operation.get('function')
                df = df.groupby(group_by).agg(agg_func).reset_index()
                
            elif op_type == 'sort':
                column = operation.get('column')
                ascending = operation.get('ascending', True)
                df = df.sort_values(column, ascending=ascending)

        # Generate output filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_filename = f"transformed_{timestamp}.{output_format}"
        output_path = os.path.join(UPLOAD_FOLDER, output_filename)

        # Save transformed data
        if output_format == 'csv':
            df.to_csv(output_path, index=False)
        elif output_format == 'xlsx':
            df.to_excel(output_path, index=False)
        elif output_format == 'json':
            df.to_json(output_path, orient='records')

        return jsonify({
            'message': 'Data transformed successfully',
            'output_filename': output_filename,
            'row_count': len(df),
            'column_count': len(df.columns),
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'operations_applied': len(operations)
            }
        })

    except Exception as e:
        logger.error(f"Error transforming data: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Data transformation failed',
            'message': str(e)
        }), 500

@file_bp.route('/list', methods=['GET'])
def list_files():
    """List available files with metadata"""
    try:
        files = []
        for filename in os.listdir(UPLOAD_FOLDER):
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.isfile(filepath):
                files.append({
                    'filename': filename,
                    'size': os.path.getsize(filepath),
                    'modified': datetime.fromtimestamp(
                        os.path.getmtime(filepath)
                    ).isoformat(),
                    'type': os.path.splitext(filename)[1][1:],
                })

        return jsonify({
            'files': files,
            'total_count': len(files),
            'metadata': {
                'timestamp': datetime.now().isoformat()
            }
        })

    except Exception as e:
        logger.error(f"Error listing files: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to list files',
            'message': str(e)
        }), 500

@file_bp.route('/delete/<filename>', methods=['DELETE'])
def delete_file(filename):
    """Delete a file"""
    try:
        filepath = os.path.join(UPLOAD_FOLDER, secure_filename(filename))
        
        if not os.path.exists(filepath):
            return jsonify({
                'error': 'File not found',
                'code': 'FILE_NOT_FOUND'
            }), 404

        os.remove(filepath)
        
        return jsonify({
            'message': 'File deleted successfully',
            'filename': filename,
            'metadata': {
                'timestamp': datetime.now().isoformat()
            }
        })

    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'File deletion failed',
            'message': str(e)
        }), 500

@file_bp.errorhandler(Exception)
def handle_error(error):
    """Global error handler for file routes"""
    logger.error(f"Unhandled error in file routes: {str(error)}", exc_info=True)
    return jsonify({
        'error': 'Internal server error',
        'message': str(error)
    }), 500
