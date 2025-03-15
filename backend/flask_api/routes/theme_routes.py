from flask import Blueprint, request, jsonify, current_app, make_response
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

@theme_routes.route('/api/theme/save', methods=['POST'])
def save_theme():
    """
    Save theme CSS to file
    
    Accepts:
        JSON with 'css' property containing CSS content
    
    Returns:
        Success: {"success": True}
        Error: {"success": False, "message": "Error message"}
    """
    try:
        # Get the CSS content from the request
        data = request.json
        if not data or 'css' not in data:
            return jsonify({"success": False, "message": "Missing CSS content"}), 400
            
        css_content = data['css']
        
        # Determine the file path
        styles_folder = os.path.join('src', 'styles')
        
        # Create the styles folder if it doesn't exist
        os.makedirs(styles_folder, exist_ok=True)
        
        # Path to the creative theme file
        theme_file = os.path.join(styles_folder, 'creative-theme.css')
        
        # Write the CSS content to the file
        with open(theme_file, 'w') as f:
            f.write(css_content)
        
        logger.info(f"Theme saved successfully to {theme_file}")
        return jsonify({"success": True}), 200
    
    except Exception as e:
        logger.exception(f"Error saving theme: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@theme_routes.route('/api/css-registry/apply', methods=['POST'])
def apply_css_to_files():
    """
    Apply CSS to selected files in L_1_HomePage.CSS directory.
    Process CSS to:
    1. Ensure theme variables are used consistently
    2. Convert gradient references to use var(--gradient-primary) if color values are similar
    3. Add comments for better maintainability
    
    Accepts:
        JSON with 'files' array of filenames and 'cssCode' string
    
    Returns:
        Success: {"success": True}
        Error: {"success": False, "message": "Error message"}
    """
    try:
        # Get data from request
        data = request.json
        if not data or 'files' not in data or 'cssCode' not in data:
            return jsonify({"success": False, "message": "Missing required fields"}), 400
            
        files = data['files']
        css_code = data['cssCode']
        
        if not files or not isinstance(files, list):
            return jsonify({"success": False, "message": "Files must be an array"}), 400
            
        if not css_code or not isinstance(css_code, str):
            return jsonify({"success": False, "message": "CSS code must be a string"}), 400
        
        # Determine the CSS directory path
        css_folder = os.path.join('src', 'L_1_HomePage.CSS')
        
        # Check if directory exists
        if not os.path.exists(css_folder):
            return jsonify({"success": False, "message": f"Directory {css_folder} not found"}), 404
        
        # Load theme variables
        theme_vars = {}
        try:
            # Try to open the creative theme file to extract variables
            with open(os.path.join('src', 'styles', 'creative-theme.css'), 'r') as f:
                theme_css = f.read()
                
            # Extract color variables from the theme
            color_var_pattern = re.compile(r'--([a-z0-9-]+):\s*([^;]+);')
            for match in color_var_pattern.finditer(theme_css):
                var_name, var_value = match.groups()
                theme_vars[var_name] = var_value.strip()
                
            logger.info(f"Loaded {len(theme_vars)} theme variables")
        except Exception as e:
            logger.warning(f"Could not load theme variables: {str(e)}")
        
        # Define common root variables to match against
        root_vars = [
            '--primary-color', '--secondary-color', '--text-color', '--background-color',
            '--card-background', '--border-color', '--success-color', '--danger-color',
            '--warning-color', '--info-color', '--text-secondary', '--gradient-primary',
            '--model-color-', '--model-spacing-', '--model-shadow-', '--model-font-size-',
            '--model-border-radius-'
        ]
        
        # Process gradient strings - replace with variable if matches theme gradient
        def process_gradients(css_text):
            gradient_pattern = re.compile(r'(linear-gradient\([^)]+\))')
            
            # Get theme gradient if available
            theme_gradient = theme_vars.get('gradient-primary', '')
            
            def replace_gradient(match):
                gradient = match.group(1)
                
                # If this gradient is similar to theme gradient, suggest using the variable
                # For simplicity, we'll just check if it contains similar colors
                if theme_gradient and any(color in gradient for color in re.findall(r'#[a-f0-9]{3,6}', theme_gradient)):
                    return f"var(--gradient-primary) /* Original: {gradient} */"
                
                return gradient
            
            return gradient_pattern.sub(replace_gradient, css_text)
        
        # Process each selected file
        for filename in files:
            file_path = os.path.join(css_folder, filename)
            
            # Check if file exists
            if not os.path.exists(file_path):
                logger.warning(f"File {file_path} not found, skipping")
                continue
            
            # Read the existing file
            with open(file_path, 'r') as f:
                existing_css = f.read()
            
            # Process the CSS code
            processed_css = process_gradients(css_code)
            
            # Create a processed version of the CSS
            css_rules_output = []
            
            # Parse the CSS
            try:
                # Parse the CSS to be added
                parsed_css = cssutils.parseString(processed_css)
                
                # If the user didn't wrap their CSS in a selector, normalize it
                if not processed_css.strip().startswith(':root') and '{' in processed_css:
                    # Process each rule in the CSS
                    for rule in parsed_css:
                        if isinstance(rule, cssutils.css.CSSStyleRule):
                            # Look through each property to suggest theme variables
                            for prop in rule.style:
                                prop_name = prop.name.lower()
                                prop_value = prop.value
                                
                                # Check color properties for potential theme variable substitution
                                if any(color_prop in prop_name for color_prop in ['color', 'background', 'border', 'fill', 'stroke']):
                                    for var_name, var_value in theme_vars.items():
                                        if var_value.lower() == prop_value.lower() and f"--{var_name}" in root_vars:
                                            # Add a comment suggesting the variable
                                            prop.value = f"{prop_value} /* Consider using var(--{var_name}) */"
                                            break
                            
                            # Add the rule to our output
                            css_rules_output.append(rule.cssText.decode('utf-8'))
                    
                    # Join all rules
                    processed_css = '\n'.join(css_rules_output)
                    
            except Exception as e:
                logger.warning(f"Error parsing CSS: {str(e)}. Using original CSS.")
            
            # Append the processed CSS to the existing file
            with open(file_path, 'a') as f:
                f.write(f"\n\n/* Added by Theme Configurator - {filename} */\n{processed_css}\n")
            
            logger.info(f"CSS applied to {file_path}")
        
        return jsonify({"success": True}), 200
    
    except Exception as e:
        logger.exception(f"Error applying CSS: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
