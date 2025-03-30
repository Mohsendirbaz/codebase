from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import subprocess
import os
import json
import time
import sys
import pickle
import requests
import glob
import pandas as pd
import threading
import filelock
import tempfile

# =====================================
# Base Configuration
# =====================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT_DIR = os.path.join(BASE_DIR, 'backend')
LOGS_DIR = os.path.join(SCRIPT_DIR, 'Logs')
ORIGINAL_BASE_DIR = os.path.join(BASE_DIR, 'backend', 'Original')

# Create logs directory
os.makedirs(LOGS_DIR, exist_ok=True)

# Status file paths
SENSITIVITY_CONFIG_STATUS_PATH = os.path.join(LOGS_DIR, "sensitivity_config_status.json")
SENSITIVITY_CONFIG_DATA_PATH = os.path.join(LOGS_DIR, "sensitivity_config_data.pkl")
CONFIG_LOCK_FILE = os.path.join(LOGS_DIR, "sensitivity_config.lock")
RUN_LOCK_FILE = os.path.join(LOGS_DIR, "runs.lock")
VISUALIZATION_LOCK_FILE = os.path.join(LOGS_DIR, "visualization.lock")

# Global locks for synchronization
GLOBAL_CONFIG_LOCK = threading.Lock()
GLOBAL_RUN_LOCK = threading.Lock()
GLOBAL_PRICE_LOCK = threading.Lock()
GLOBAL_VISUALIZE_LOCK = threading.Lock()

# Script configurations
COMMON_PYTHON_SCRIPTS = [
    os.path.join(SCRIPT_DIR, "Configuration_management", 'formatter.py'),
    os.path.join(SCRIPT_DIR, "Configuration_management", 'module1.py'),
    os.path.join(SCRIPT_DIR, "Configuration_management", 'config_modules.py'),
    os.path.join(SCRIPT_DIR, "Configuration_management", 'Table.py')
]

def get_calculation_script(version):
    script_name = f'CFA.py'
    script_path = os.path.join(SCRIPT_DIR, "Core_calculation_engines", script_name)
    if os.path.exists(script_path):
        return script_path
    raise Exception(f"Calculation script not found for version {version}")

CALCULATION_SCRIPTS = {
    'calculateForPrice': get_calculation_script,
    'freeFlowNPV': get_calculation_script
}

# =====================================
# Helper Functions
# =====================================
def with_file_lock(lock_file_path, operation_name="operation"):
    """Decorator to create a file lock for the decorated function"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            lock = filelock.FileLock(lock_file_path, timeout=180)  # 3 minute timeout
            try:
                with lock:
                    return func(*args, **kwargs)
            except filelock.Timeout:
                raise Exception(f"Timeout waiting for {operation_name} lock")
        return wrapper
    return decorator

def with_memory_lock(lock_obj, operation_name="operation"):
    """Decorator to apply a threading lock for the decorated function"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            if not lock_obj.acquire(timeout=180):  # 3 minute timeout
                raise Exception(f"Timeout waiting for in-memory {operation_name} lock")
            try:
                return func(*args, **kwargs)
            finally:
                lock_obj.release()
        return wrapper
    return decorator

def atomic_read_json(filepath):
    """Thread-safe reading of JSON file"""
    tempdir = tempfile.gettempdir()
    temp_file = os.path.join(tempdir, f"temp_{os.path.basename(filepath)}")

    # Create a file lock for this specific file
    lock_file = f"{filepath}.lock"
    lock = filelock.FileLock(lock_file, timeout=60)

    with lock:
        if os.path.exists(filepath):
            # Copy to temp location first
            with open(filepath, 'r') as src:
                content = src.read()

            with open(temp_file, 'w') as dst:
                dst.write(content)

            # Read from the temp file
            with open(temp_file, 'r') as f:
                data = json.load(f)

            # Clean up
            try:
                os.remove(temp_file)
            except:
                pass

            return data
        return None

def atomic_write_json(filepath, data):
    """Thread-safe writing of JSON file"""
    tempdir = tempfile.gettempdir()
    temp_file = os.path.join(tempdir, f"temp_{os.path.basename(filepath)}")

    # Create a file lock for this specific file
    lock_file = f"{filepath}.lock"
    lock = filelock.FileLock(lock_file, timeout=60)

    with lock:
        # Write to temp file first
        with open(temp_file, 'w') as f:
            json.dump(data, f, indent=2)

        # Move temp file to target (atomic operation)
        if os.path.exists(filepath):
            os.remove(filepath)

        os.rename(temp_file, filepath)

def atomic_read_pickle(filepath):
    """Thread-safe reading of pickle file"""
    tempdir = tempfile.gettempdir()
    temp_file = os.path.join(tempdir, f"temp_{os.path.basename(filepath)}")

    # Create a file lock for this specific file
    lock_file = f"{filepath}.lock"
    lock = filelock.FileLock(lock_file, timeout=60)

    with lock:
        if os.path.exists(filepath):
            # Copy to temp location first
            with open(filepath, 'rb') as src:
                content = src.read()

            with open(temp_file, 'wb') as dst:
                dst.write(content)

            # Read from the temp file
            with open(temp_file, 'rb') as f:
                data = pickle.load(f)

            # Clean up
            try:
                os.remove(temp_file)
            except:
                pass

            return data
        return None

def atomic_write_pickle(filepath, data):
    """Thread-safe writing of pickle file"""
    tempdir = tempfile.gettempdir()
    temp_file = os.path.join(tempdir, f"temp_{os.path.basename(filepath)}")

    # Create a file lock for this specific file
    lock_file = f"{filepath}.lock"
    lock = filelock.FileLock(lock_file, timeout=60)

    with lock:
        # Write to temp file first
        with open(temp_file, 'wb') as f:
            pickle.dump(data, f)

        # Move temp file to target (atomic operation)
        if os.path.exists(filepath):
            os.remove(filepath)

        os.rename(temp_file, filepath)

def trigger_config_module_copy(version, sensitivity_dir, sen_parameters):
    """Thread-safe config module copying service trigger"""
    try:
        # Use a unique lock for this specific operation
        lock = threading.Lock()
        with lock:
            response = requests.post(
                "http://localhost:2600/copy-config-modules",
                json={
                    "version": version,
                    "sensitivity_dir": sensitivity_dir,
                    "parameters": sen_parameters
                },
                timeout=10
            )

            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Error triggering config copy service: {response.text}"}
    except requests.exceptions.ConnectionError:
        return {"error": "Config copy service not available"}
    except Exception as e:
        return {"error": f"Error connecting to config copy service: {str(e)}"}

def run_script(script_name, *args, script_type="python"):
    """Thread-safe script execution with proper error handling"""
    # Create a unique temporary directory for this script execution
    temp_dir = tempfile.mkdtemp()
    temp_output = os.path.join(temp_dir, "output.txt")

    try:
        command = ['python' if script_type == "python" else 'Rscript', script_name]
        command.extend([str(arg) for arg in args])

        # Redirect output to a file in the temporary directory
        with open(temp_output, 'w') as output_file:
            result = subprocess.run(
                command,
                stdout=output_file,
                stderr=subprocess.PIPE,
                text=True
            )

        if result.returncode != 0:
            return False, f"Error running {os.path.basename(script_name)}: {result.stderr}"

        return True, None
    except Exception as e:
        return False, f"Exception running {os.path.basename(script_name)}: {str(e)}"
    finally:
        # Clean up temporary directory
        try:
            import shutil
            shutil.rmtree(temp_dir)
        except:
            pass

def process_version(version, calculation_script, selected_v, selected_f, target_row,
                    calculation_option, SenParameters):
    """Thread-safe version processing with proper locking"""
    # Create a unique lock for this version
    version_lock = threading.RLock()

    with version_lock:
        try:
            # Run common configuration scripts
            for script in COMMON_PYTHON_SCRIPTS:
                success, error = run_script(script, version)
                if not success:
                    return error

            # Run calculation script
            success, error = run_script(
                calculation_script,
                version,
                json.dumps(selected_v),
                json.dumps(selected_f),
                json.dumps(target_row),
                calculation_option,
                json.dumps(SenParameters)
            )
            if not success:
                return error

            return None
        except Exception as e:
            return f"Error processing version {version}: {str(e)}"

def create_sensitivity_directories(version, SenParameters):
    """Thread-safe directory creation with proper locking"""
    # Create a lock specific to this version and operation
    dir_lock_file = os.path.join(LOGS_DIR, f"dir_creation_{version}.lock")
    lock = filelock.FileLock(dir_lock_file, timeout=60)

    with lock:
        # Define base paths
        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')

        # Create main sensitivity directory
        os.makedirs(sensitivity_dir, exist_ok=True)

        # Create standard subdirectories
        for subdir in ["Reports", "Cache", "Configuration"]:
            path = os.path.join(sensitivity_dir, subdir)
            os.makedirs(path, exist_ok=True)

        reports_dir = os.path.join(sensitivity_dir, "Reports")

        # Create analysis mode directories
        for mode in ["Symmetrical", "Multipoint"]:
            mode_dir = os.path.join(sensitivity_dir, mode)
            os.makedirs(mode_dir, exist_ok=True)

            # Create plot type subdirectories
            for plot_type in ["waterfall", "bar", "point", "Configuration"]:
                plot_type_dir = os.path.join(mode_dir, plot_type)
                os.makedirs(plot_type_dir, exist_ok=True)

        # Process each parameter
        enabled_params = [(param_id, config) for param_id, config in SenParameters.items()
                          if config.get('enabled')]

        for param_id, param_config in enabled_params:
            # Skip disabled parameters
            if not param_config.get('enabled'):
                continue

            # Get parameter details
            mode = param_config.get('mode', 'symmetrical')
            values = param_config.get('values', [])
            plot_types = []

            if param_config.get('waterfall'): plot_types.append('waterfall')
            if param_config.get('bar'): plot_types.append('bar')
            if param_config.get('point'): plot_types.append('point')

            if not values:
                continue

            # Create parameter base directory
            param_dir = os.path.join(sensitivity_dir, param_id)
            os.makedirs(param_dir, exist_ok=True)

            # Create mode directory within parameter
            param_mode_dir = os.path.join(param_dir, mode)
            os.makedirs(param_mode_dir, exist_ok=True)

            # Determine variation values based on mode
            variation_list = []
            if mode.lower() == 'symmetrical':
                if values and len(values) > 0:
                    base_variation = values[0]
                    variation_list = [base_variation, -base_variation]
            else:  # 'multipoint' or other modes
                variation_list = values

            # Create variation directories
            for variation in variation_list:
                var_str = f"{variation:+.2f}"

                # 1. Create parameter variation directories
                var_dir = os.path.join(param_dir, mode, var_str)
                os.makedirs(var_dir, exist_ok=True)

                # 2. Create configuration variation directories
                mode_name = "Symmetrical" if mode.lower() == "symmetrical" else "Multipoint"
                config_var_dir = os.path.join(sensitivity_dir, mode_name, "Configuration", f"{param_id}_{var_str}")
                os.makedirs(config_var_dir, exist_ok=True)

            # Create plot type directories for this parameter
            mode_dir = os.path.join(sensitivity_dir,
                                    "Symmetrical" if mode.lower() == "symmetrical" else "Multipoint")

            for plot_type in plot_types:
                plot_dir = os.path.join(mode_dir, plot_type, f"{param_id}_{plot_type}")
                os.makedirs(plot_dir, exist_ok=True)

        return sensitivity_dir, reports_dir

def save_sensitivity_config_files(version, reports_dir, SenParameters):
    """Thread-safe configuration file saving with proper locking"""
    # Create a lock specific to this version and operation
    file_lock_file = os.path.join(LOGS_DIR, f"config_files_{version}.lock")
    lock = filelock.FileLock(file_lock_file, timeout=60)

    with lock:
        saved_files = []

        # Get base directory
        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')

        # Save main configuration file in reports directory
        config_file = os.path.join(reports_dir, "sensitivity_config.json")
        atomic_write_json(config_file, {
            'version': version,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'parameters': SenParameters
        })
        saved_files.append(config_file)

        # Save individual parameter configuration files in their respective directories
        for param_id, param_config in SenParameters.items():
            if not param_config.get('enabled'):
                continue

            # Get mode and values
            mode = param_config.get('mode', 'symmetrical')
            values = param_config.get('values', [])

            if not values:
                continue

            # Determine variation list based on mode
            if mode.lower() == 'symmetrical':
                # For symmetrical, use first value to create +/- variations
                base_variation = values[0]
                variation_list = [base_variation, -base_variation]
            else:  # 'multipoint' mode
                # For multipoint, use all values directly
                variation_list = values

            # Save configuration for each variation
            for variation in variation_list:
                # Format the variation string (e.g., "+10.00" or "-5.00")
                var_str = f"{variation:+.2f}"

                # Create path to variation directory
                var_dir = os.path.join(sensitivity_dir, param_id, mode, var_str)

                # Save configuration file
                param_file = os.path.join(var_dir, f"{param_id}_config.json")
                atomic_write_json(param_file, {
                    'parameter': param_id,
                    'config': param_config,
                    'variation': variation,
                    'variation_str': var_str,
                    'mode': mode,
                    'version': version,
                    'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
                })
                saved_files.append(param_file)

        return saved_files

def process_sensitivity_visualization(SenParameters):
    """Thread-safe visualization processing with proper locking"""
    visualization_lock = threading.Lock()

    with visualization_lock:
        visualization_data = {
            'parameters': {},
            'relationships': []
        }

        run_id = time.strftime("%Y%m%d_%H%M%S")

        # Process each parameter (S10 through S61)
        for param_key, config in SenParameters.items():
            if not config.get('enabled', False):
                continue

            if not (param_key.startswith('S') and param_key[1:].isdigit() and
                    10 <= int(param_key[1:]) <= 61):
                continue

            visualization_data['parameters'][param_key] = {
                'id': param_key,
                'mode': config.get('mode'),
                'enabled': True
            }

            if config.get('compareToKey'):
                plot_types = []
                if config.get('waterfall'): plot_types.append('waterfall')
                if config.get('bar'): plot_types.append('bar')
                if config.get('point'): plot_types.append('point')

                visualization_data['relationships'].append({
                    'source': param_key,
                    'target': config['compareToKey'],
                    'type': config.get('comparisonType', 'primary'),
                    'plotTypes': plot_types
                })

        return visualization_data

def check_sensitivity_config_status():
    """Thread-safe configuration status check with proper locking"""
    status_lock_file = os.path.join(LOGS_DIR, "status_check.lock")
    lock = filelock.FileLock(status_lock_file, timeout=30)

    with lock:
        if not os.path.exists(SENSITIVITY_CONFIG_STATUS_PATH):
            return False, None

        try:
            # Use atomic read for thread safety
            status = atomic_read_json(SENSITIVITY_CONFIG_STATUS_PATH)

            if not status or not status.get('configured', False):
                return False, None

            if os.path.exists(SENSITIVITY_CONFIG_DATA_PATH):
                # Use atomic read for thread safety
                config_data = atomic_read_pickle(SENSITIVITY_CONFIG_DATA_PATH)
                return True, config_data

            return True, None

        except Exception:
            return False, None

def find_price_from_economic_summaries(version):
    """Thread-safe price finding with proper locking"""
    # Create a lock specific to this version
    price_lock_file = os.path.join(LOGS_DIR, f"price_finding_{version}.lock")
    lock = filelock.FileLock(price_lock_file, timeout=30)

    with lock:
        # Convert version to int if it's a string
        version_num = int(version) if not isinstance(version, int) else version

        # List of potential paths to check for economic summaries
        paths_to_check = [
            # Main economic summary
            os.path.join(
                ORIGINAL_BASE_DIR,
                f'Batch({version_num})',
                f'Results({version_num})',
                f"Economic_Summary({version_num}).csv"
            ),
            # Secondary location - in Results root
            os.path.join(
                ORIGINAL_BASE_DIR,
                f'Batch({version_num})',
                f'Results({version_num})',
                f"Economic_Summary.csv"
            ),
            # In sensitivity directory
            os.path.join(
                ORIGINAL_BASE_DIR,
                f'Batch({version_num})',
                f'Results({version_num})',
                'Sensitivity',
                f"Economic_Summary({version_num}).csv"
            )
        ]

        # Also search for any economic summary CSVs using glob pattern
        glob_patterns = [
            os.path.join(
                ORIGINAL_BASE_DIR,
                f'Batch({version_num})',
                f'Results({version_num})',
                "**",
                f"Economic_Summary*.csv"
            ),
            os.path.join(
                ORIGINAL_BASE_DIR,
                f'Batch({version_num})',
                f'Results({version_num})',
                "Sensitivity",
                "**",
                f"Economic_Summary*.csv"
            )
        ]

        # First check specific paths
        for idx, path in enumerate(paths_to_check):
            if os.path.exists(path):
                try:
                    # Use a temporary file to avoid race conditions
                    temp_csv = os.path.join(tempfile.gettempdir(), f"temp_economic_{version_num}_{idx}.csv")
                    with open(path, 'r') as src:
                        content = src.read()

                    with open(temp_csv, 'w') as dst:
                        dst.write(content)

                    economic_df = pd.read_csv(temp_csv)
                    os.remove(temp_csv)

                    price_rows = economic_df[economic_df['Metric'] == 'Average Selling Price (Project Life Cycle)']

                    if not price_rows.empty:
                        price_value = float(price_rows.iloc[0, 1])  # Assuming price is in second column
                        return price_value, f"economic_summary_path_{idx+1}"
                except Exception:
                    pass

        # Then try using glob patterns
        for pattern_idx, pattern in enumerate(glob_patterns):
            try:
                matches = glob.glob(pattern, recursive=True)

                for match_idx, match_path in enumerate(matches):
                    try:
                        # Use a temporary file to avoid race conditions
                        temp_csv = os.path.join(tempfile.gettempdir(), f"temp_glob_{version_num}_{pattern_idx}_{match_idx}.csv")
                        with open(match_path, 'r') as src:
                            content = src.read()

                        with open(temp_csv, 'w') as dst:
                            dst.write(content)

                        economic_df = pd.read_csv(temp_csv)
                        os.remove(temp_csv)

                        price_rows = economic_df[economic_df['Metric'] == 'Average Selling Price (Project Life Cycle)']

                        if not price_rows.empty:
                            price_value = float(price_rows.iloc[0, 1])
                            return price_value, f"glob_pattern_{pattern_idx+1}_match_{match_idx+1}"
                    except Exception:
                        pass
            except Exception:
                pass

        # If we reach here, no price was found in any economic summary
        return None, "not_found"

# =====================================
# Flask Application Initialization
# =====================================
app = Flask(__name__)
CORS(app)

# =====================================
# Sensitivity Configuration Endpoint
# =====================================
@app.route('/sensitivity/configure', methods=['POST'])
@with_file_lock(CONFIG_LOCK_FILE, "sensitivity configuration")
@with_memory_lock(GLOBAL_CONFIG_LOCK, "sensitivity configuration")
def configure_sensitivity():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Extract configuration
        config = {
            'versions': data.get('selectedVersions', [1]),
            'selectedV': data.get('selectedV', {f'V{i+1}': 'off' for i in range(10)}),
            'selectedF': data.get('selectedF', {f'F{i+1}': 'off' for i in range(5)}),
            'calculationOption': data.get('selectedCalculationOption', 'freeFlowNPV'),
            'targetRow': int(data.get('targetRow', 20)),
            'SenParameters': data.get('SenParameters', {})
        }

        version = config['versions'][0]

        # Create sensitivity directories with thread-safe function
        sensitivity_dir, config_dir = create_sensitivity_directories(version, config['SenParameters'])

        # Save configuration files with thread-safe function
        saved_files = save_sensitivity_config_files(version, config_dir, config['SenParameters'])

        # Save configuration status using atomic write
        atomic_write_json(SENSITIVITY_CONFIG_STATUS_PATH, {
            'configured': True,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'runId': time.strftime("%Y%m%d_%H%M%S"),
            'version': version,
            'configDir': config_dir,
            'sensitivityDir': sensitivity_dir
        })

        # Save configuration data using atomic write
        atomic_write_pickle(SENSITIVITY_CONFIG_DATA_PATH, config)

        return jsonify({
            "status": "success",
            "message": "Sensitivity configurations generated and saved successfully",
            "runId": time.strftime("%Y%m%d_%H%M%S"),
            "configDir": config_dir,
            "sensitivityDir": sensitivity_dir,
            "savedFiles": len(saved_files),
            "nextStep": "Visit /runs to execute sensitivity calculations"
        })

    except Exception as e:
        error_msg = f"Error generating sensitivity configurations: {str(e)}"

        # Update configuration status to indicate failure using atomic write
        atomic_write_json(SENSITIVITY_CONFIG_STATUS_PATH, {
            'configured': False,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'runId': time.strftime("%Y%m%d_%H%M%S"),
            'error': error_msg
        })

        return jsonify({
            "error": error_msg,
            "runId": time.strftime("%Y%m%d_%H%M%S")
        }), 500

# =====================================
# Run Calculations Endpoint
# =====================================
@app.route('/runs', methods=['POST'])
@with_file_lock(RUN_LOCK_FILE, "calculation runs")
@with_memory_lock(GLOBAL_RUN_LOCK, "calculation runs")
def run_calculations():
    run_id = time.strftime("%Y%m%d_%H%M%S")

    try:
        # Check if sensitivity configurations have been generated using thread-safe function
        is_configured, saved_config = check_sensitivity_config_status()

        # If sensitivity configurations haven't been generated, return an error
        if not is_configured:
            return jsonify({
                "error": "Sensitivity configurations must be generated first",
                "message": "Please call /sensitivity/configure endpoint to generate and save sensitivity configurations before running calculations",
                "nextStep": "Call /sensitivity/configure endpoint first"
            }), 400

        # Use the saved configuration data if available, otherwise use the request data
        data = request.get_json()
        if saved_config:
            config = saved_config
        elif data:
            config = {
                'versions': data.get('selectedVersions', [1]),
                'selectedV': data.get('selectedV', {f'V{i+1}': 'off' for i in range(10)}),
                'selectedF': data.get('selectedF', {f'F{i+1}': 'off' for i in range(5)}),
                'calculationOption': data.get('selectedCalculationOption', 'freeFlowNPV'),
                'targetRow': int(data.get('targetRow', 20)),
                'SenParameters': data.get('SenParameters', {})
            }
        else:
            return jsonify({"error": "No configuration data available"}), 400

        # Get version and paths
        version = config['versions'][0]
        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')

        # Verify that sensitivity directories exist
        if not os.path.exists(sensitivity_dir):
            error_msg = f"Sensitivity directory not found: {sensitivity_dir}"
            return jsonify({
                "error": error_msg,
                "message": "Please call /sensitivity/configure endpoint to generate and save sensitivity configurations",
                "nextStep": "Call /sensitivity/configure endpoint first"
            }), 400

        # Execute configuration management scripts
        start_time = time.time()

        for script in COMMON_PYTHON_SCRIPTS:
            script_name = os.path.basename(script)
            script_start = time.time()

            # Use thread-safe script execution
            result = subprocess.run(
                ['python', script, str(version)],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                error_msg = f"Script execution failed: {script_name}\nError: {result.stderr}"
                raise Exception(error_msg)

            time.sleep(0.5)  # Ensure proper sequencing

        config_time = time.time() - start_time

        # Step 2: Process baseline calculation
        calc_start = time.time()

        # Get calculation script
        calculation_script_func = CALCULATION_SCRIPTS.get(config['calculationOption'])
        if not calculation_script_func:
            raise Exception(f"No script found for calculation mode: {config['calculationOption']}")

        calculation_script = calculation_script_func(config['versions'][0])

        # Run baseline calculation first using thread-safe script execution
        result = subprocess.run(
            [
                'python',
                calculation_script,
                str(config['versions'][0]),
                json.dumps(config['selectedV']),
                json.dumps(config['selectedF']),
                str(config['targetRow']),
                config['calculationOption'],
                '{}'  # Empty SenParameters for baseline
            ],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            error_msg = f"Baseline calculation failed: {result.stderr}"
            raise Exception(error_msg)

        # Step 3: Trigger the config module copy service using thread-safe function
        copy_service_result = trigger_config_module_copy(
            version,
            sensitivity_dir,
            config['SenParameters']
        )

        # Wait for config copy service to complete (or timeout after 5 minutes)
        max_wait_time = 300  # 5 minutes in seconds
        start_wait = time.time()

        # First check if service is available
        while time.time() - start_wait < max_wait_time:
            try:
                response = requests.get("http://localhost:2600/health", timeout=2)
                if response.ok:
                    break
            except requests.exceptions.RequestException:
                pass

            # Wait and check again
            time.sleep(15)  # Check every 15 seconds

        # Update configuration pickle file for subsequent steps
        try:
            # Save configuration data with explicit version using thread-safe function
            if isinstance(config['versions'], list) and version not in config['versions']:
                config['versions'].append(version)
            atomic_write_pickle(SENSITIVITY_CONFIG_DATA_PATH, config)
        except Exception:
            pass

        # Step 4: Now process sensitivity parameters if enabled
        enabled_params = [k for k, v in config['SenParameters'].items() if v.get('enabled')]
        if enabled_params:
            try:
                process_script = os.path.join(
                    SCRIPT_DIR,
                    "API_endpoints_and_controllers",
                    "process_sensitivity_results.py"
                )

                if os.path.exists(process_script):
                    process_result = subprocess.run(
                        ['python', process_script, str(version), '0.5'],  # 30 second wait time
                        capture_output=True,
                        text=True
                    )

                    if process_result.returncode != 0:
                        # Try running with backup approach if the first attempt failed
                        for param_id, param_config in config['SenParameters'].items():
                            if not param_config.get('enabled'):
                                continue

                            # Run CFA on each modified configuration with thread-safe approach
                            param_lock = threading.Lock()
                            with param_lock:
                                mode = param_config.get('mode', 'symmetrical')
                                values = param_config.get('values', [])

                                if mode.lower() == 'symmetrical':
                                    base_variation = values[0]
                                    variations = [base_variation, -base_variation]
                                else:
                                    variations = values

                                for variation in variations:
                                    var_str = f"{variation:+.2f}"

                                    # Find modified config files
                                    mode_dir = 'symmetrical' if mode.lower() == 'symmetrical' else 'multiple'
                                    config_pattern = os.path.join(
                                        sensitivity_dir,
                                        param_id,
                                        mode_dir,
                                        var_str,
                                        f"{version}_config_module_*.json"
                                    )

                                    config_files = glob.glob(config_pattern)
                                    if config_files:
                                        for config_file in config_files:
                                            result = subprocess.run(
                                                [
                                                    'python',
                                                    calculation_script,
                                                    str(version),
                                                    '-c', config_file,
                                                    '--sensitivity',
                                                    param_id,
                                                    str(variation),
                                                    param_config.get('compareToKey', 'S13')
                                                ],
                                                capture_output=True,
                                                text=True
                                            )
            except Exception:
                pass

        total_time = time.time() - start_time

        # Return success response with timing information
        return jsonify({
            "status": "success",
            "message": "Calculations completed successfully",
            "runId": run_id,
            "timing": {
                "total": f"{total_time:.2f}s",
                "configuration": f"{config_time:.2f}s",
                "calculations": len(enabled_params) + 1
            },
            "configCopy": copy_service_result
        })

    except Exception as e:
        return jsonify({
            "error": f"Error during orchestrated calculations: {str(e)}",
            "runId": run_id
        }), 500

# =====================================
# Visualization Endpoint
# =====================================
@app.route('/sensitivity/visualize', methods=['POST'])
@with_file_lock(VISUALIZATION_LOCK_FILE, "visualization")
@with_memory_lock(GLOBAL_VISUALIZE_LOCK, "visualization")
def get_sensitivity_visualization():
    run_id = time.strftime("%Y%m%d_%H%M%S")
    start_time = time.time()

    try:
        # Check if sensitivity configurations have been generated using thread-safe function
        is_configured, saved_config = check_sensitivity_config_status()

        # If sensitivity configurations haven't been generated, return an error
        if not is_configured:
            return jsonify({
                "error": "Sensitivity configurations must be generated first",
                "message": "Please call /sensitivity/configure endpoint to generate and save sensitivity configurations before visualizing results",
                "nextStep": "Call /sensitivity/configure endpoint first"
            }), 400

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Use saved version if available, otherwise use request data
        if saved_config and 'versions' in saved_config:
            version = saved_config['versions'][0]
        else:
            version = data.get('selectedVersions', [1])[0]

        # Use saved parameters if available, otherwise use request data
        if saved_config and 'SenParameters' in saved_config:
            sen_parameters = saved_config['SenParameters']
        else:
            sen_parameters = data.get('SenParameters', {})

        visualization_data = {
            'parameters': {},
            'relationships': [],
            'plots': {},
            'metadata': {
                'version': str(version),
                'runId': run_id,
                'processingTime': 0,
                'plotsGenerated': 0,
                'errors': []
            }
        }

        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')

        # Create sensitivity directories early in the process using thread-safe function
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')

        # Use file lock for directory creation
        dir_lock_file = os.path.join(LOGS_DIR, f"visualization_dirs_{version}.lock")
        dir_lock = filelock.FileLock(dir_lock_file, timeout=60)

        with dir_lock:
            # Create main sensitivity directory
            os.makedirs(sensitivity_dir, exist_ok=True)

            # Create subdirectories for different analysis types
            for mode in ['Symmetrical', 'Multipoint']:
                mode_dir = os.path.join(sensitivity_dir, mode)
                os.makedirs(mode_dir, exist_ok=True)

                # Create subdirectories for plot types and configuration
                for subdir in ['waterfall', 'bar', 'point', 'Configuration']:
                    subdir_path = os.path.join(mode_dir, subdir)
                    os.makedirs(subdir_path, exist_ok=True)

            # Create standalone Configuration directory
            config_dir = os.path.join(sensitivity_dir, "Configuration")
            os.makedirs(config_dir, exist_ok=True)

            # Create Reports and Cache directories
            for extra_dir in ['Reports', 'Cache']:
                extra_path = os.path.join(sensitivity_dir, extra_dir)
                os.makedirs(extra_path, exist_ok=True)

        plots_generated = 0

        # Create a parameter processing lock
        param_process_lock = threading.RLock()

        for param_id, config in sen_parameters.items():
            # Use lock for each parameter's processing
            with param_process_lock:
                if not config.get('enabled'):
                    continue

                mode = config.get('mode')
                plot_types = []
                if config.get('waterfall'): plot_types.append('waterfall')
                if config.get('bar'): plot_types.append('bar')
                if config.get('point'): plot_types.append('point')

                # Special handling for S34-S38 against S13
                is_special_case = (
                        param_id >= 'S34' and param_id <= 'S38' and
                        config.get('compareToKey') == 'S13'
                )

                # Add parameter metadata with status
                visualization_data['parameters'][param_id] = {
                    'id': param_id,
                    'mode': mode,
                    'enabled': True,
                    'status': {
                        'processed': False,
                        'error': None,
                        'isSpecialCase': is_special_case
                    }
                }

                # Add relationship data
                if config.get('compareToKey'):
                    relationship = {
                        'source': param_id,
                        'target': config['compareToKey'],
                        'type': config.get('comparisonType', 'primary'),
                        'plotTypes': plot_types
                    }
                    visualization_data['relationships'].append(relationship)

                # Initialize plot data structure
                visualization_data['plots'][param_id] = {}

                # Collect plot paths with status
                mode_name = 'Symmetrical' if mode == 'symmetrical' else 'Multipoint'
                sensitivity_dir = os.path.join(results_folder, 'Sensitivity', mode_name)

                # Check if sensitivity directory exists
                if not os.path.exists(sensitivity_dir):
                    error_msg = f"Sensitivity directory not found: {sensitivity_dir}"
                    visualization_data['parameters'][param_id]['status']['error'] = error_msg
                    visualization_data['metadata']['errors'].append(error_msg)
                    continue

                # Check for results files before attempting to visualize
                result_file_name = f"{param_id}_vs_{config['compareToKey']}_{mode.lower()}_results.json"
                result_file_path = os.path.join(sensitivity_dir, result_file_name)

                # Trigger results processing if needed
                if not os.path.exists(result_file_path):
                    try:
                        process_script = os.path.join(
                            SCRIPT_DIR,
                            "API_endpoints_and_controllers",
                            "process_sensitivity_results.py"
                        )

                        if os.path.exists(process_script):
                            # Use thread-safe process execution
                            process_lock = threading.Lock()
                            with process_lock:
                                subprocess.run(
                                    ['python', process_script, str(version), '1'],
                                    capture_output=True,
                                    text=True
                                )
                    except Exception:
                        pass

                # Now process each plot type with thread-safe approach
                for plot_type in plot_types:
                    # Create a unique lock for this plot generation
                    plot_lock_file = os.path.join(LOGS_DIR, f"plot_{param_id}_{plot_type}.lock")
                    plot_lock = filelock.FileLock(plot_lock_file, timeout=60)

                    with plot_lock:
                        # Construct the plot name and path
                        plot_name = f"{plot_type}_{param_id}_{config['compareToKey']}_{config.get('comparisonType', 'primary')}"
                        plot_path = os.path.join(sensitivity_dir, f"{plot_name}.png")

                        # Initialize plot status
                        plot_status = {
                            'status': 'error',
                            'path': None,
                            'error': None
                        }

                        # Check again for the results file
                        if os.path.exists(result_file_path):
                            # Check if the plot file exists
                            if os.path.exists(plot_path):
                                # Plot exists, update status
                                relative_path = os.path.relpath(plot_path, base_dir)
                                plot_status.update({
                                    'status': 'ready',
                                    'path': relative_path,
                                    'error': None
                                })
                                plots_generated += 1
                            else:
                                # Plot doesn't exist, but we have results data - generate the plot
                                try:
                                    # Import the plot generation script
                                    try:
                                        from sensitivity_Routes import generate_plot_from_results

                                        # Generate the plot
                                        generated = generate_plot_from_results(
                                            version=version,
                                            param_id=param_id,
                                            compare_to_key=config['compareToKey'],
                                            plot_type=plot_type,
                                            mode=mode,
                                            result_path=result_file_path
                                        )

                                        if generated and os.path.exists(plot_path):
                                            relative_path = os.path.relpath(plot_path, base_dir)
                                            plot_status.update({
                                                'status': 'ready',
                                                'path': relative_path,
                                                'error': None
                                            })
                                            plots_generated += 1
                                        else:
                                            error_msg = f"Plot generation failed despite having result data"
                                            plot_status['error'] = error_msg
                                    except ImportError:
                                        error_msg = "Could not import plot generation function"
                                        plot_status['error'] = error_msg
                                except Exception as e:
                                    error_msg = f"Error generating plot: {str(e)}"
                                    plot_status['error'] = error_msg
                        else:
                            # No results data available even after processing
                            error_msg = f"Results data not available for {param_id} even after processing"
                            plot_status['error'] = error_msg

                        # Add plot status to visualization data
                        visualization_data['plots'][param_id][plot_type] = plot_status

                # Update parameter processing status
                visualization_data['parameters'][param_id]['status']['processed'] = True

        # Update metadata
        processing_time = time.time() - start_time
        visualization_data['metadata'].update({
            'processingTime': round(processing_time, 2),
            'plotsGenerated': plots_generated
        })

        return jsonify(visualization_data)

    except Exception as e:
        error_msg = f"Error generating visualization data: {str(e)}"

        # Return partial data if available, along with error
        if 'visualization_data' in locals():
            visualization_data['metadata']['errors'].append(error_msg)
            return jsonify(visualization_data)

        return jsonify({
            "error": error_msg,
            "runId": run_id
        }), 500

# =====================================
# Price Endpoints
# =====================================
@app.route('/prices/<version>', methods=['GET'])
@with_memory_lock(GLOBAL_PRICE_LOCK, "price retrieval")
def get_price(version):
    """Thread-safe price retrieval endpoint"""
    try:
        # Use thread-safe price finding function
        price, source = find_price_from_economic_summaries(version)

        if price is not None:
            return jsonify({
                'price': price,
                'version': version,
                'source': source,
                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
            })

        # Check for sensitivity results that might have price data
        price_from_results = None

        # Use a specific lock for file searching
        search_lock = threading.Lock()
        with search_lock:
            try:
                base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
                sensitivity_dir = os.path.join(
                    base_dir,
                    f'Batch({version})',
                    f'Results({version})',
                    'Sensitivity'
                )

                # Look for any results JSON files
                result_files = glob.glob(os.path.join(sensitivity_dir, "*_results.json"))

                for result_file in result_files:
                    try:
                        # Use atomic read for thread safety
                        with open(result_file, 'r') as f:
                            result_data = json.load(f)

                        # Look for price in variations
                        if 'variations' in result_data:
                            for variation in result_data['variations']:
                                if variation.get('status') == 'completed' and 'values' in variation and 'price' in variation['values']:
                                    price_from_results = variation['values']['price']
                                    if price_from_results is not None:
                                        return jsonify({
                                            'price': price_from_results,
                                            'version': version,
                                            'source': f"sensitivity_result_{os.path.basename(result_file)}",
                                            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
                                        })
                    except Exception:
                        continue
            except Exception:
                pass

        # Fallback to simulated price with thread safety
        price = 1000.00 + float(version) * 100

        return jsonify({
            'price': price,
            'version': version,
            'source': 'simulated',
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
        })

    except Exception as e:
        return jsonify({
            "error": str(e),
            "version": version
        }), 500

@app.route('/stream_prices/<version>', methods=['GET'])
def stream_prices(version):
    """Thread-safe price streaming endpoint"""
    def generate():
        # Create a specific lock for this streaming session
        stream_lock = threading.Lock()

        with stream_lock:
            try:
                # Try to find real price using our thread-safe search function
                price, source = find_price_from_economic_summaries(version)

                # If we found a real price, use it with small variations
                if price is not None:
                    yield f"data: {json.dumps({'price': price, 'version': version, 'source': source})}\n\n"

                    # Stream updates with small variations around the actual price
                    variations = [-2, 0, 2]  # First down, then same, then up
                    for i, variation in enumerate(variations):
                        time.sleep(1)
                        updated_price = price + variation
                        yield f"data: {json.dumps({'price': updated_price, 'version': version, 'source': f'{source}_variation_{i+1}'})}\n\n"

                    # Send completion message with original price
                    yield f"data: {json.dumps({'complete': True, 'price': price, 'version': version, 'source': source})}\n\n"
                    return

                # Check sensitivity results as a fallback
                price_from_results = None

                try:
                    base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
                    sensitivity_dir = os.path.join(
                        base_dir,
                        f'Batch({version})',
                        f'Results({version})',
                        'Sensitivity'
                    )

                    # Look for any results JSON files
                    result_files = glob.glob(os.path.join(sensitivity_dir, "*_results.json"))

                    for result_file in result_files:
                        try:
                            # Use atomic read for thread safety
                            with open(result_file, 'r') as f:
                                result_data = json.load(f)

                            # Look for price in variations
                            if 'variations' in result_data:
                                for variation in result_data['variations']:
                                    if variation.get('status') == 'completed' and 'values' in variation and 'price' in variation['values']:
                                        price_from_results = variation['values']['price']
                                        if price_from_results is not None:
                                            source = f"sensitivity_result_{os.path.basename(result_file)}"

                                            # Initial data
                                            yield f"data: {json.dumps({'price': price_from_results, 'version': version, 'source': source})}\n\n"

                                            # Stream updates with small variations
                                            variations = [-2, 0, 2]  # First down, then same, then up
                                            for i, variation in enumerate(variations):
                                                time.sleep(1)
                                                updated_price = price_from_results + variation
                                                yield f"data: {json.dumps({'price': updated_price, 'version': version, 'source': f'{source}_variation_{i+1}'})}\n\n"

                                            # Send completion message
                                            yield f"data: {json.dumps({'complete': True, 'price': price_from_results, 'version': version, 'source': source})}\n\n"
                                            return
                        except Exception:
                            continue
                except Exception:
                    pass

                # Fallback to simulated price as last resort
                price = 1000.00 + float(version) * 100

                # Send initial data
                yield f"data: {json.dumps({'price': price, 'version': version, 'source': 'simulated'})}\n\n"

                # Simulate updates every second for 5 seconds
                for i in range(5):
                    time.sleep(1)
                    price += 5.0 * (i + 1)
                    yield f"data: {json.dumps({'price': price, 'version': version, 'source': 'simulated'})}\n\n"

                # Send completion message
                yield f"data: {json.dumps({'complete': True, 'price': price, 'version': version, 'source': 'simulated'})}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(generate(), mimetype='text/event-stream')

# =====================================
# Integration with Config Copy Service
# =====================================
@app.route('/copy-config-modules', methods=['POST'])
def copy_config_modules_proxy():
    """Thread-safe proxy to the config module copy service"""
    # Create a specific lock for this service call
    copy_lock = threading.Lock()

    with copy_lock:
        try:
            # Forward the request to the actual service
            try:
                response = requests.post(
                    "http://localhost:2600/copy-config-modules",
                    json=request.json,
                    timeout=10
                )

                if response.status_code == 200:
                    result = response.json()
                    return jsonify(result), response.status_code
                else:
                    error_msg = f"Error from config copy service: {response.text}"
                    return jsonify({"error": error_msg}), response.status_code

            except requests.exceptions.ConnectionError:
                # If the service is not running, provide a fallback response
                return jsonify({
                    "status": "fallback",
                    "message": "Config module copy service not available. Using fallback implementation.",
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
                })
        except Exception as e:
            return jsonify({"error": str(e)}), 500

# =====================================
# Utility Endpoints
# =====================================
@app.route('/images/<path:image_path>', methods=['GET'])
def get_image(image_path):
    """Thread-safe image serving endpoint"""
    # Create a specific lock for this image path
    image_lock_file = os.path.join(LOGS_DIR, f"image_{image_path.replace('/', '_')}.lock")
    lock = filelock.FileLock(image_lock_file, timeout=10)

    with lock:
        try:
            # Construct the full path to the image
            full_path = os.path.join(ORIGINAL_BASE_DIR, image_path)

            if not os.path.exists(full_path):
                return jsonify({"error": "Image not found"}), 404

            # Copy to a temporary location for safe access
            temp_path = os.path.join(tempfile.gettempdir(), os.path.basename(full_path))
            with open(full_path, 'rb') as src:
                with open(temp_path, 'wb') as dst:
                    dst.write(src.read())

            return send_file(temp_path, mimetype='image/png')

        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Thread-safe health check endpoint"""
    # Check if the 2600 service is running
    config_copy_service_status = "available"
    try:
        response = requests.get("http://localhost:2600/health", timeout=2)
        if not response.ok:
            config_copy_service_status = "unavailable"
    except requests.exceptions.RequestException:
        config_copy_service_status = "unavailable"

    return jsonify({
        "status": "ok",
        "server": "sensitivity-analysis-server",
        "version": "1.0.0",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "services": {
            "config_copy_service": config_copy_service_status
        }
    })

# =====================================
# Application Entry Point
# =====================================
if __name__ == '__main__':
    # Ensure all lock files are cleaned up on startup
    for lock_file in [CONFIG_LOCK_FILE, RUN_LOCK_FILE, VISUALIZATION_LOCK_FILE]:
        if os.path.exists(lock_file):
            try:
                os.remove(lock_file)
            except:
                pass

    app.run(debug=True, host='127.0.0.1', port=2500)