from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import shutil
import threading

app = Flask(__name__)
CORS(app)

# Define the base directory of the project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, 'Original')

# Ensure the upload directory exists
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

lock = threading.Lock()

def run_formatter_for_extension(version, extension):
    """
    Run formatter directly for the batch extension.
    
    Args:
        version: The original version number
        extension: The extension number
    
    Returns:
        Dictionary with status and message
    """
    try:
        # Get the path to the formatter extension script
        formatter_extension_path = os.path.join(BASE_DIR, "backend", "Configuration_management", "formatter_extension.py")
        
        if not os.path.exists(formatter_extension_path):
            return {
                "status": "error",
                "message": f"Formatter extension script not found at {formatter_extension_path}"
            }
            
        # Change to the Configuration_management directory to match direct execution behavior
        config_mgmt_dir = os.path.join(BASE_DIR, "backend", "Configuration_management")
        
        # Create the command to run the formatter with the correct arguments
        # Use the script name directly since we'll be executing from its directory
        command = f"cd {config_mgmt_dir} && python formatter_extension.py {version} {extension}"
        
        # Execute the command
        proc = os.popen(command)
        output = proc.read()
        proc.close()
        
        # Check if the command was successful by looking for the output file
        batch_dir = os.path.join(UPLOAD_DIR, f'Batch({version}.{extension})')
        config_file = os.path.join(batch_dir, f'ConfigurationPlotSpec({version})', f'configurations({version}).py')
        
        if os.path.exists(config_file):
            return {
                "status": "success",
                "message": f"Formatter for extension ({version}.{extension}) run successfully"
            }
        else:
            return {
                "status": "error",
                "message": f"Formatter ran but did not create configuration file at {config_file}"
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error running formatter extension: {str(e)}"
        }

def run_module1_for_extension(version, extension):
    """
    Run module1 directly for the batch extension.
    
    Args:
        version: The original version number
        extension: The extension number
    
    Returns:
        Dictionary with status and message
    """
    try:
        from pathlib import Path
        
        # Get the path to the module1 extension script
        module1_path = os.path.join(BASE_DIR, "backend", "Configuration_management", "module1_extension.py")
        
        if not os.path.exists(module1_path):
            return {
                "status": "error",
                "message": f"Module1 extension script not found at {module1_path}"
            }
        
        # Ensure the batch directories exist
        batch_dir = Path(UPLOAD_DIR) / f"Batch({version}.{extension})"
        config_dir = batch_dir / f"ConfigurationPlotSpec({version})"
        results_dir = batch_dir / f"Results({version})"
        
        # Make sure these directories exist
        config_dir.mkdir(parents=True, exist_ok=True)
        results_dir.mkdir(parents=True, exist_ok=True)
        
        # Change to the Configuration_management directory to match direct execution behavior
        config_mgmt_dir = os.path.join(BASE_DIR, "backend", "Configuration_management")
        
        # Create a command to run the module1_extension script with the correct arguments
        command = f"cd {config_mgmt_dir} && python module1_extension.py {version} {extension}"
        
        # Execute the command
        proc = os.popen(command)
        output = proc.read()
        proc.close()
            
        return {
            "status": "success",
            "message": f"Configuration file created for batch extension ({version}.{extension})"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error running module1 extension: {str(e)}"
        }

def run_update_config_extension(version, extension):
    """
    Run the update_config_modules_with_CFA_extension script for the batch extension.
    
    Args:
        version: The original version number
        extension: The extension number
    
    Returns:
        Dictionary with status and message
    """
    try:
        # Path to the extension update_config script
        update_config_extension_path = os.path.join(BASE_DIR, "backend", "Configuration_management", "update_config_modules_with_CFA_extension.py")
        
        # Check if script exists
        if not os.path.exists(update_config_extension_path):
            return {
                "status": "error",
                "message": f"Update config extension script not found at {update_config_extension_path}"
            }
        
        # Change to the Configuration_management directory to match direct execution behavior
        config_mgmt_dir = os.path.join(BASE_DIR, "backend", "Configuration_management")
        
        # Command to run the script with version and extension as arguments
        command = f"cd {config_mgmt_dir} && python update_config_modules_with_CFA_extension.py {version} {extension}"
        
        # Execute the command
        proc = os.popen(command)
        output = proc.read()
        proc.close()
        
        return {
            "status": "success",
            "message": f"Update config extension for ({version}.{extension}) run successfully"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error running update config extension: {str(e)}"
        }

def create_batch_extension(version, extension):
    """
    Create a batch extension directory and copy configuration files.
    
    Args:
        version: The original version number
        extension: The extension number
    
    Returns:
        Dictionary with status and message
    """
    with lock:
        try:
            # Create directory path with version.extension format
            batch_extension_dir = os.path.join(UPLOAD_DIR, f'Batch({version}.{extension})')
            config_extension_dir = os.path.join(batch_extension_dir, f'ConfigurationPlotSpec({version})')
            results_dir = os.path.join(batch_extension_dir, f'Results({version})')
            
            # Create the directories if they don't exist
            if not os.path.exists(config_extension_dir):
                os.makedirs(config_extension_dir)
            
            if not os.path.exists(results_dir):
                os.makedirs(results_dir)
            
            # Source file to copy
            source_path = os.path.join(UPLOAD_DIR, f'Batch({version})/ConfigurationPlotSpec({version})/U_configurations({version}).py')
            
            # Check if source file exists
            if not os.path.exists(source_path):
                return {
                    "status": "error",
                    "message": f"Source file for version {version} not found"
                }
            
            # Copy the file to the new directory with the proper path structure
            dest_path = os.path.join(config_extension_dir, f'U_configurations({version}).py')
            shutil.copy2(source_path, dest_path)
            
            return {
                "status": "success",
                "message": f"Batch extension ({version}.{extension}) created successfully with adapted scripts"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error creating batch extension: {str(e)}"
            }

def remove_batch_extension(version, extension):
    """
    Remove a batch extension directory.
    
    Args:
        version: The original version number
        extension: The extension number
    
    Returns:
        Dictionary with status and message
    """
    with lock:
        try:
            # Build the path to the batch extension directory
            extension_dir = os.path.join(UPLOAD_DIR, f'Batch({version}.{extension})')
            
            # Check if directory exists
            if not os.path.exists(extension_dir):
                return {
                    "status": "error",
                    "message": f"Batch extension ({version}.{extension}) does not exist"
                }
            
            # Remove the directory and its contents
            shutil.rmtree(extension_dir)
            
            return {
                "status": "success",
                "message": f"Batch extension ({version}.{extension}) removed successfully"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error removing batch extension: {str(e)}"
            }

@app.route('/create_batch_extension', methods=['POST'])
def create_batch_extension_route():
    try:
        data = request.json
        version = data.get('version')
        extension = data.get('extension')
        
        # Validate inputs
        if not version or not extension:
            return jsonify({"error": "Version and extension are required"}), 400
        
        # Create the batch extension
        result = create_batch_extension(version, extension)
        
        if result["status"] == "success":
            # Execute the three scripts in order: formatter, module, then update
            
            # 1. Run formatter_extension script
            formatter_result = run_formatter_for_extension(version, extension)
            if formatter_result["status"] != "success":
                print(f"Warning: Formatter extension failed: {formatter_result['message']}")
                # Continue despite warning
            
            # 2. Run module1_extension script
            module1_result = run_module1_for_extension(version, extension)
            if module1_result["status"] != "success":
                print(f"Warning: Module1 extension failed: {module1_result['message']}")
                # Continue despite warning
            
            # 3. Run update_config_modules_with_CFA_extension script
            update_config_result = run_update_config_extension(version, extension)
            if update_config_result["status"] != "success":
                print(f"Warning: Update config extension failed: {update_config_result['message']}")
                # Continue despite warning
            
            return jsonify({
                "message": result["message"],
                "version": version,
                "extension": extension
            }), 200
        else:
            return jsonify({
                "error": result["message"]
            }), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/remove_batch_extension', methods=['POST'])
def remove_batch_extension_route():
    try:
        data = request.json
        version = data.get('version')
        extension = data.get('extension')
        
        # Validate inputs
        if not version or not extension:
            return jsonify({"error": "Version and extension are required"}), 400
        
        # Remove the batch extension
        result = remove_batch_extension(version, extension)
        
        if result["status"] == "success":
            return jsonify({
                "message": result["message"],
                "version": version,
                "extension": extension
            }), 200
        else:
            return jsonify({
                "error": result["message"]
            }), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8002)  # Use a different port than the other APIs
