from flask import Blueprint, request, jsonify, make_response
import os
import re
import logging
import cssutils

# Create Blueprint for theme routes
theme_routes = Blueprint('theme_routes', __name__)

# Error handler for the blueprint
@theme_routes.errorhandler(Exception)
def handle_error(error):
    response = {
        "success": False,
        "message": str(error)
    }
    return make_response(jsonify(response), 500)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Setup cssutils logging
cssutils.log.setLevel(logging.WARNING)

# Get absolute path to project root (SF/)
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
styles_folder = os.path.join(project_root, 'src', 'styles')
css_registry_folder = os.path.join(project_root, 'src', 'HomePage.CSS')

def validate_filename(filename):
    """Prevent path traversal attacks and ensure valid CSS files"""
    if not filename.endswith('.css') or '../' in filename:
        raise ValueError(f"Invalid filename: {filename}")
    return filename

@theme_routes.route('/api/theme/current', methods=['GET', 'POST'])
def current_theme():
    """Handle current theme operations"""
    try:
        if request.method == 'GET':
            theme_file = os.path.join(styles_folder, 'creative-theme.css')
            if not os.path.exists(theme_file):
                return jsonify({"success": False, "message": "Theme not found"}), 404
            
            with open(theme_file, 'r') as f:
                return jsonify({"success": True, "css": f.read()}), 200

        if request.method == 'POST':
            data = request.json
            if not data:
                return jsonify({"success": False, "message": "Missing data"}), 400
            
            theme_file = os.path.join(styles_folder, 'creative-theme.css')
            css_content = ":root.creative-theme {\n"
            for key, value in data.items():
                if key.startswith('--'):
                    css_content += f"  {key}: {value};\n"
            css_content += "}\n"
            
            with open(theme_file, 'w') as f:
                f.write(css_content)
            
            logger.info(f"Theme updated via API: {theme_file}")
            return jsonify({"success": True}), 200

    except Exception as e:
        logger.exception(f"Current theme error: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@theme_routes.route('/api/theme/save', methods=['POST'])
def save_theme():
    """Save theme CSS to creative-theme.css"""
    try:
        data = request.json
        if not data or 'css' not in data:
            return jsonify({"success": False, "message": "Missing CSS content"}), 400
            
        css_content = data['css']
        os.makedirs(styles_folder, exist_ok=True)
        theme_file = os.path.join(styles_folder, 'creative-theme.css')
        
        # Validate CSS content
        if not css_content.startswith(':root.creative-theme'):
            raise ValueError("Invalid theme CSS format")
            
        with open(theme_file, 'w') as f:
            f.write(css_content)
        
        logger.info(f"Theme saved to {theme_file}")
        return jsonify({"success": True}), 200
    
    except Exception as e:
        logger.exception(f"Error saving theme: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@theme_routes.route('/api/css-registry/apply', methods=['POST'])
def apply_css_to_files():
    """Apply CSS to selected files in HomePage.CSS directory"""
    try:
        data = request.json
        if not data or 'files' not in data or 'cssCode' not in data:
            return jsonify({"success": False, "message": "Missing required fields"}), 400
            
        files = data['files']
        css_code = data['cssCode']
        
        if not os.path.isdir(css_registry_folder):
            return jsonify({"success": False, "message": f"Directory not found: {css_registry_folder}"}), 404

        # Load theme variables
        theme_vars = {}
        try:
            theme_file = os.path.join(styles_folder, 'creative-theme.css')
            with open(theme_file, 'r') as f:
                theme_css = f.read()
                color_var_pattern = re.compile(r'--([a-z0-9-]+):\s*([^;}]+)[;}]')
                theme_vars = {match[0]: match[1].strip() 
                            for match in color_var_pattern.findall(theme_css)}
        except Exception as e:
            logger.warning(f"Could not load theme variables: {str(e)}")

        # Process each selected file
        for filename in files:
            try:
                validate_filename(filename)
                file_path = os.path.join(css_registry_folder, filename)
                
                if not os.path.exists(file_path):
                    continue
            except Exception as e:
                logger.error(f"Error processing {filename}: {str(e)}")
                continue

                # Extract and append unique variables
                var_pattern = re.compile(r'--([a-z0-9-]+):\s*([^;}]+)[;}]')
                new_vars = {match[0]: match[1].strip() 
                          for match in var_pattern.findall(css_code)}
                          
                if not new_vars:
                    continue

                # Read existing variables
                with open(file_path, 'r') as f:
                    existing_content = f.read()
                existing_vars = {match[0]: match[1].strip() 
                               for match in var_pattern.findall(existing_content)}

                # Find new unique variables
                unique_vars = {k: v for k, v in new_vars.items() 
                             if k not in existing_vars and k in theme_vars}

                if unique_vars:
                    # Format new variables section
                    new_section = "\n".join([f"  --{k}: {v};" for k, v in unique_vars.items()])
                    append_content = (
                        f"\n\n/* Added by Theme Configurator - {filename} */\n"
                        f":root {{\n{new_section}\n}}\n"
                    )
                    
                    # Append to file
                    with open(file_path, 'a') as f:
                        f.write(append_content)
                        
                    logger.info(f"Added {len(unique_vars)} variables to {filename}")

        return jsonify({"success": True}), 200
    
    except Exception as e:
        logger.exception(f"Error applying CSS: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
