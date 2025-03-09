from flask import Blueprint, request, jsonify, send_file
import logging
import os
import mimetypes
from pathlib import Path
import traceback
import urllib.parse

# Configure logger
logger = logging.getLogger(__name__)

file_bp = Blueprint('file', __name__)

@file_bp.route('/', methods=['GET'])
def get_file():
    """
    Get a file from the file system
    
    Query Parameters:
    - path: Path to the file (required)
    """
    try:
        file_path = request.args.get('path')
        
        if not file_path:
            return jsonify({"error": "Path parameter is required"}), 400
        
        # Security check - prevent path traversal
        decoded_path = urllib.parse.unquote(file_path)
        if '..' in decoded_path:
            return jsonify({"error": "Path traversal not allowed"}), 403
        
        path = Path(decoded_path)
        
        if not path.exists():
            return jsonify({"error": f"File not found: {decoded_path}"}), 404
        
        if not path.is_file():
            return jsonify({"error": f"Not a file: {decoded_path}"}), 400
        
        # Determine mimetype
        mimetype, _ = mimetypes.guess_type(path)
        if mimetype is None:
            if path.suffix == '.csv':
                mimetype = 'text/csv'
            else:
                mimetype = 'application/octet-stream'
        
        # Log the file access
        logger.info(f"Serving file: {decoded_path}")
        
        # Send the file
        return send_file(path, mimetype=mimetype)
    
    except Exception as e:
        logger.error(f"Error serving file: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@file_bp.route('/list', methods=['GET'])
def list_files():
    """
    List files in a directory
    
    Query Parameters:
    - path: Path to the directory (required)
    - recursive: Whether to list files recursively (optional, default: false)
    """
    try:
        dir_path = request.args.get('path')
        recursive = request.args.get('recursive', 'false').lower() == 'true'
        
        if not dir_path:
            return jsonify({"error": "Path parameter is required"}), 400
        
        # Security check - prevent path traversal
        decoded_path = urllib.parse.unquote(dir_path)
        if '..' in decoded_path:
            return jsonify({"error": "Path traversal not allowed"}), 403
        
        path = Path(decoded_path)
        
        if not path.exists():
            return jsonify({"error": f"Directory not found: {decoded_path}"}), 404
        
        if not path.is_dir():
            return jsonify({"error": f"Not a directory: {decoded_path}"}), 400
        
        # List files
        files = []
        
        if recursive:
            for p in path.glob('**/*'):
                files.append({
                    "path": str(p.relative_to(path)),
                    "is_dir": p.is_dir(),
                    "size": p.stat().st_size if p.is_file() else 0,
                    "last_modified": p.stat().st_mtime
                })
        else:
            for p in path.iterdir():
                files.append({
                    "path": p.name,
                    "is_dir": p.is_dir(),
                    "size": p.stat().st_size if p.is_file() else 0,
                    "last_modified": p.stat().st_mtime
                })
        
        # Log the directory listing
        logger.info(f"Listed directory: {decoded_path}")
        
        return jsonify({
            "path": dir_path,
            "files": files
        })
    
    except Exception as e:
        logger.error(f"Error listing directory: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@file_bp.route('/exists', methods=['GET'])
def check_file_exists():
    """
    Check if a file exists
    
    Query Parameters:
    - path: Path to the file or directory (required)
    """
    try:
        check_path = request.args.get('path')
        
        if not check_path:
            return jsonify({"error": "Path parameter is required"}), 400
        
        # Security check - prevent path traversal
        decoded_path = urllib.parse.unquote(check_path)
        if '..' in decoded_path:
            return jsonify({"error": "Path traversal not allowed"}), 403
        
        path = Path(decoded_path)
        
        # Check existence
        exists = path.exists()
        
        # Get additional details if file exists
        is_file = exists and path.is_file()
        is_dir = exists and path.is_dir()
        
        # Log the check
        logger.info(f"Checked existence: {decoded_path}, result: {exists}")
        
        return jsonify({
            "path": check_path,
            "exists": exists,
            "is_file": is_file,
            "is_dir": is_dir,
            "size": path.stat().st_size if exists and is_file else 0,
            "last_modified": path.stat().st_mtime if exists else 0
        })
    
    except Exception as e:
        logger.error(f"Error checking file existence: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
