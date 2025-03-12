from flask import Blueprint, request, jsonify
import os
import json

# Create blueprint
theme_routes = Blueprint('theme_routes', __name__)

@theme_routes.route('/api/save-theme', methods=['POST'])
def save_theme():
    """Endpoint to save theme CSS file to the styles directory."""
    try:
        # Get data from request
        data = request.get_json()
        if not data or 'content' not in data or 'filename' not in data:
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
            
        # Extract data
        filename = data['filename']
        content = data['content']
        
        # Ensure filename is safe and has proper extension
        if not filename.endswith('.css'):
            filename += '.css'
        
        # Define path (relative to project root)
        styles_path = os.path.join('src', 'styles')
        file_path = os.path.join(styles_path, filename)
        
        # Ensure styles directory exists
        os.makedirs(styles_path, exist_ok=True)
        
        # Write content to file
        with open(file_path, 'w') as f:
            f.write(content)
            
        return jsonify({
            'success': True,
            'message': f'Theme successfully saved to {filename}',
            'path': file_path
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error saving theme: {str(e)}'
        }), 500
