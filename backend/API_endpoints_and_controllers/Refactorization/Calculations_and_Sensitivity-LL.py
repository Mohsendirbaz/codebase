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
import functools

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
PAYLOAD_LOCK_FILE = os.path.join(LOGS_DIR, "payload.lock")
BASELINE_LOCK_FILE = os.path.join(LOGS_DIR, "baseline.lock")

# Global locks for synchronization
GLOBAL_CONFIG_LOCK = threading.Lock()
GLOBAL_RUN_LOCK = threading.Lock()
GLOBAL_PRICE_LOCK = threading.Lock()
GLOBAL_VISUALIZE_LOCK = threading.Lock()
GLOBAL_PAYLOAD_LOCK = threading.Lock()
GLOBAL_BASELINE_LOCK = threading.Lock()

# Event flags for pipeline execution control
PAYLOAD_REGISTERED = threading.Event()
BASELINE_COMPLETED = threading.Event()
CONFIG_COMPLETED = threading.Event()
RUNS_COMPLETED = threading.Event()

# Timeout for waiting (in seconds)
WAIT_TIMEOUT = 600  # 10 minutes

# Pipeline active flag (holds all routes except the active one)
PIPELINE_ACTIVE = threading.Event()

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
# Pipeline Control Functions
# =====================================
def reset_execution_pipeline():
    """Reset all execution pipeline events to initial state"""
    PAYLOAD_REGISTERED.clear()
    BASELINE_COMPLETED.clear()
    CONFIG_COMPLETED.clear()
    RUNS_COMPLETED.clear()
    PIPELINE_ACTIVE.clear()

def initialize_pipeline():
    """Initialize the pipeline and set it to active"""
    reset_execution_pipeline()
    PIPELINE_ACTIVE.set()
    return time.strftime("%Y%m%d_%H%M%S")

def cancel_pipeline_after_timeout(timeout_seconds=1800):
    """Cancel the pipeline after a timeout"""
    def timeout_handler():
        # Wait for timeout
        time.sleep(timeout_seconds)
        # If pipeline is still active, reset it
        if PIPELINE_ACTIVE.is_set():
            reset_execution_pipeline()
            print(f"Pipeline automatically reset after {timeout_seconds}s timeout")

    # Start timeout thread
    timer_thread = threading.Thread(target=timeout_handler)
    timer_thread.daemon = True
    timer_thread.start()
    return timer_thread

# =====================================
# Helper Functions
# =====================================
def with_file_lock(lock_file_path, operation_name="operation"):
    """Decorator to create a file lock for the decorated function"""
    def decorator(func):
        @functools.wraps(func)
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
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if not lock_obj.acquire(timeout=180):  # 3 minute timeout
                raise Exception(f"Timeout waiting for in-memory {operation_name} lock")
            try:
                return func(*args, **kwargs)
            finally:
                lock_obj.release()
        return wrapper
    return decorator

def with_pipeline_check(required_event=None, next_event=None, operation_name="operation"):
    """Decorator to check pipeline status and validate required events"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Check if pipeline is active
            if not PIPELINE_ACTIVE.is_set():
                return jsonify({
                    "error": "Pipeline is not active",
                    "status": "inactive",
                    "message": "Initialize pipeline first with /register_payload"
                }), 409

            # Check if required event is set
            if required_event is not None and not required_event.is_set():
                return jsonify({
                    "error": f"Cannot execute {operation_name} - prerequisite step not completed",
                    "status": "blocked",
                    "message": f"This endpoint requires a prior step to complete first"
                }), 409

            # Execute the function
            result = func(*args, **kwargs)

            # Set next event if successful and provided
            if next_event is not None and isinstance(result, tuple) and result[1] == 200:
                next_event.set()

            return result
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

# =====================================
# Flask Application Initialization
# =====================================
app = Flask(__name__)
CORS(app)

# Middleware to check if endpoint is allowed
@app.before_request
def check_endpoint_availability():
    # List of endpoints that should always be accessible
    always_accessible = [
        '/health',
        '/register_payload',
        '/status'
    ]

    # Get the current path
    path = request.path

    # Check if we're in active pipeline mode but not on an always accessible endpoint
    if PIPELINE_ACTIVE.is_set() and path not in always_accessible:
        # Allow baseline_calculation only if payload is registered but baseline not completed
        if path == '/baseline_calculation':
            if PAYLOAD_REGISTERED.is_set() and not BASELINE_COMPLETED.is_set():
                return None  # Allow request to proceed
            return jsonify({
                "error": "Baseline calculation cannot be executed at this time",
                "status": "incorrect_sequence",
                "message": "Register payload first or baseline already completed"
            }), 409

        # Allow sensitivity/configure only if baseline is completed but config not completed
        elif path == '/sensitivity/configure':
            if BASELINE_COMPLETED.is_set() and not CONFIG_COMPLETED.is_set():
                return None  # Allow request to proceed
            return jsonify({
                "error": "Sensitivity configuration cannot be executed at this time",
                "status": "incorrect_sequence",
                "message": "Complete baseline calculation first"
            }), 409

        # Allow runs only if config is completed but runs not completed
        elif path == '/runs':
            if CONFIG_COMPLETED.is_set() and not RUNS_COMPLETED.is_set():
                return None  # Allow request to proceed
            return jsonify({
                "error": "Runs cannot be executed at this time",
                "status": "incorrect_sequence",
                "message": "Complete sensitivity configuration first"
            }), 409

        # Block all other endpoints during active pipeline
        else:
            return jsonify({
                "error": "Endpoint temporarily unavailable",
                "status": "pipeline_active",
                "message": "Pipeline is active and only specific endpoints are available"
            }), 503

    # Allow access to always accessible endpoints or when pipeline is not active
    return None

# =====================================
# Pipeline Status Endpoint
# =====================================
@app.route('/status', methods=['GET'])
def get_pipeline_status():
    """Get current pipeline execution status"""
    status = {
        "pipeline_active": PIPELINE_ACTIVE.is_set(),
        "steps": {
            "payload_registered": PAYLOAD_REGISTERED.is_set(),
            "baseline_completed": BASELINE_COMPLETED.is_set(),
            "config_completed": CONFIG_COMPLETED.is_set(),
            "runs_completed": RUNS_COMPLETED.is_set()
        },
        "current_step": "none",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    # Determine current step
    if PIPELINE_ACTIVE.is_set():
        if not PAYLOAD_REGISTERED.is_set():
            status["current_step"] = "register_payload"
        elif not BASELINE_COMPLETED.is_set():
            status["current_step"] = "baseline_calculation"
        elif not CONFIG_COMPLETED.is_set():
            status["current_step"] = "sensitivity_configure"
        elif not RUNS_COMPLETED.is_set():
            status["current_step"] = "runs"
        else:
            status["current_step"] = "complete"

    return jsonify(status)

# =====================================
# Register Payload Endpoint
# =====================================
@app.route('/register_payload', methods=['POST'])
@with_file_lock(PAYLOAD_LOCK_FILE, "payload registration")
@with_memory_lock(GLOBAL_PAYLOAD_LOCK, "payload registration")
def register_payload():
    """Register payload and initialize pipeline"""
    try:
        # Initialize new pipeline (resets all events)
        run_id = initialize_pipeline()

        # Start timeout timer to automatically reset pipeline after 30 minutes
        cancel_pipeline_after_timeout(1800)

        data = request.get_json()
        if not data:
            PIPELINE_ACTIVE.clear()  # Reset pipeline active flag
            return jsonify({"error": "No data provided"}), 400

        # Store payload data
        payload_path = os.path.join(LOGS_DIR, f"payload_{run_id}.json")
        atomic_write_json(payload_path, data)

        # Set payload registered event
        PAYLOAD_REGISTERED.set()

        return jsonify({
            "status": "success",
            "message": "Payload registered successfully and pipeline initialized",
            "runId": run_id,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "next_step": "/baseline_calculation"
        }), 200
    except Exception as e:
        # Reset pipeline on error
        reset_execution_pipeline()
        return jsonify({
            "error": f"Error registering payload: {str(e)}",
            "status": "failed"
        }), 500
    # =====================================
# Baseline Calculation Endpoint
# =====================================
@app.route('/baseline_calculation', methods=['POST'], endpoint='baseline_calc_endpoint')
@with_file_lock(BASELINE_LOCK_FILE, "baseline calculation")
@with_memory_lock(GLOBAL_BASELINE_LOCK, "baseline calculation")
@with_pipeline_check(required_event=PAYLOAD_REGISTERED, next_event=BASELINE_COMPLETED, operation_name="baseline calculation")
def baseline_calculation():
    """Perform baseline calculation without sensitivity variations"""
    try:
        data = request.get_json()
        run_id = data.get('runId')

        # If no runtime data provided but runId is present, try to load from stored payload
        if run_id and (not data.get('selectedVersions') or not data.get('selectedCalculationOption')):
            payload_path = os.path.join(LOGS_DIR, f"payload_{run_id}.json")
            if os.path.exists(payload_path):
                stored_data = atomic_read_json(payload_path)
                if stored_data:
                    data.update(stored_data)

        # Extract configuration
        version = data.get('selectedVersions', [1])[0]
        selectedV = data.get('selectedV', {f'V{i+1}': 'off' for i in range(10)})
        selectedF = data.get('selectedF', {f'F{i+1}': 'off' for i in range(5)})
        calculation_option = data.get('selectedCalculationOption', 'freeFlowNPV')
        target_row = int(data.get('targetRow', 20))

        # Get calculation script
        calculation_script_func = CALCULATION_SCRIPTS.get(calculation_option)
        if not calculation_script_func:
            BASELINE_COMPLETED.clear()  # Reset baseline completion flag
            return jsonify({
                "error": f"No script found for calculation mode: {calculation_option}",
                "status": "error"
            }), 400

        calculation_script = calculation_script_func(version)

        # Execute configuration management scripts first
        for script in COMMON_PYTHON_SCRIPTS:
            script_name = os.path.basename(script)

            result = subprocess.run(
                ['python', script, str(version)],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                error_msg = f"Script execution failed: {script_name}\nError: {result.stderr}"
                BASELINE_COMPLETED.clear()  # Reset baseline completion flag
                return jsonify({
                    "error": error_msg,
                    "status": "error"
                }), 500

            time.sleep(0.5)  # Ensure proper sequencing

        # Run baseline calculation
        start_time = time.time()
        result = subprocess.run(
            [
                'python',
                calculation_script,
                str(version),
                json.dumps(selectedV),
                json.dumps(selectedF),
                str(target_row),
                calculation_option,
                '{}'  # Empty SenParameters for baseline
            ],
            capture_output=True,
            text=True
        )

        execution_time = time.time() - start_time

        if result.returncode != 0:
            error_msg = f"Baseline calculation failed: {result.stderr}"
            BASELINE_COMPLETED.clear()  # Reset baseline completion flag
            return jsonify({
                "error": error_msg,
                "status": "error"
            }), 500

        # Store calculation result
        result_path = os.path.join(LOGS_DIR, f"baseline_result_{run_id}.json")
        atomic_write_json(result_path, {
            "version": version,
            "calculationOption": calculation_option,
            "targetRow": target_row,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "executionTime": execution_time,
            "stdout": result.stdout,
            "returnCode": result.returncode
        })

        # BASELINE_COMPLETED event is set by the decorator

        return jsonify({
            "status": "success",
            "message": "Baseline calculation completed successfully",
            "runId": run_id,
            "version": version,
            "executionTime": f"{execution_time:.2f}s",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "next_step": "/sensitivity/configure"
        }), 200
    except Exception as e:
        # Don't clear event flag here - let the decorator handle it
        return jsonify({
            "error": f"Error during baseline calculation: {str(e)}",
            "status": "error"
        }), 500

# =====================================
# Sensitivity Configuration Endpoint
# =====================================
@app.route('/sensitivity/configure', methods=['POST'], endpoint='sensitivity_configure_endpoint')
@with_file_lock(CONFIG_LOCK_FILE, "sensitivity configuration")
@with_memory_lock(GLOBAL_CONFIG_LOCK, "sensitivity configuration")
@with_pipeline_check(required_event=BASELINE_COMPLETED, next_event=CONFIG_COMPLETED, operation_name="sensitivity configuration")
def configure_sensitivity():
    """Generate and save sensitivity configurations"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        run_id = data.get('runId')

        # If no runtime data provided but runId is present, try to load from stored payload
        if run_id and (not data.get('selectedVersions') or not data.get('SenParameters')):
            payload_path = os.path.join(LOGS_DIR, f"payload_{run_id}.json")
            if os.path.exists(payload_path):
                stored_data = atomic_read_json(payload_path)
                if stored_data:
                    data.update(stored_data)

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
        start_time = time.time()
        sensitivity_dir, config_dir = create_sensitivity_directories(version, config['SenParameters'])

        # Save configuration files with thread-safe function
        saved_files = save_sensitivity_config_files(version, config_dir, config['SenParameters'])

        # Save configuration status using atomic write
        atomic_write_json(SENSITIVITY_CONFIG_STATUS_PATH, {
            'configured': True,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'runId': run_id,
            'version': version,
            'configDir': config_dir,
            'sensitivityDir': sensitivity_dir
        })

        # Save configuration data using atomic write
        atomic_write_pickle(SENSITIVITY_CONFIG_DATA_PATH, config)

        # CONFIG_COMPLETED event is set by the decorator

        execution_time = time.time() - start_time

        return jsonify({
            "status": "success",
            "message": "Sensitivity configurations generated and saved successfully",
            "runId": run_id,
            "configDir": config_dir,
            "sensitivityDir": sensitivity_dir,
            "savedFiles": len(saved_files),
            "executionTime": f"{execution_time:.2f}s",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "next_step": "/runs"
        }), 200

    except Exception as e:
        # Don't clear event flag here - let the decorator handle it

        # Update configuration status to indicate failure using atomic write
        atomic_write_json(SENSITIVITY_CONFIG_STATUS_PATH, {
            'configured': False,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'runId': run_id if 'run_id' in locals() else time.strftime("%Y%m%d_%H%M%S"),
            'error': str(e)
        })

        return jsonify({
            "error": f"Error generating sensitivity configurations: {str(e)}",
            "status": "error"
        }), 500

# =====================================
# Run Calculations Endpoint
# =====================================
@app.route('/runs', methods=['POST'], endpoint='runs_endpoint')
@with_file_lock(RUN_LOCK_FILE, "calculation runs")
@with_memory_lock(GLOBAL_RUN_LOCK, "calculation runs")
@with_pipeline_check(required_event=CONFIG_COMPLETED, next_event=RUNS_COMPLETED, operation_name="calculation runs")
def run_calculations():
    """Execute sensitivity calculations based on configured parameters"""
    run_id = time.strftime("%Y%m%d_%H%M%S")

    try:
        data = request.get_json()
        provided_run_id = data.get('runId')
        if provided_run_id:
            run_id = provided_run_id

        # Check if sensitivity configurations have been generated using thread-safe function
        is_configured, saved_config = check_sensitivity_config_status()

        # If sensitivity configurations haven't been generated, return an error
        if not is_configured:
            return jsonify({
                "error": "Sensitivity configurations must be generated first",
                "message": "Please call /sensitivity/configure endpoint to generate and save sensitivity configurations before running calculations",
                "status": "error"
            }), 400

        # Use the saved configuration data if available, otherwise use the request data
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
                "status": "error"
            }), 400

        # Start timing
        start_time = time.time()

        # Step 1: Trigger the config module copy service BEFORE sensitivity calculations
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

        # Step 2: Process sensitivity parameters if enabled
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

                            # Get calculation script
                            calculation_script_func = CALCULATION_SCRIPTS.get(config['calculationOption'])
                            if not calculation_script_func:
                                continue

                            calculation_script = calculation_script_func(version)

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
                                            try:
                                                subprocess.run(
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
                                                    text=True,
                                                    timeout=300  # 5 minute timeout
                                                )
                                            except subprocess.TimeoutExpired:
                                                continue
            except Exception:
                pass

        # Calculate total execution time
        total_time = time.time() - start_time

        # RUNS_COMPLETED event is set by the decorator

        # Return success response with timing information
        return jsonify({
            "status": "success",
            "message": "Sensitivity calculations completed successfully",
            "runId": run_id,
            "version": version,
            "timing": {
                "total": f"{total_time:.2f}s",
                "parameters_processed": len(enabled_params)
            },
            "configCopy": copy_service_result,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "next_step": "Pipeline complete"
        }), 200

    except Exception as e:
        # Don't clear event flag here - let the decorator handle it
        return jsonify({
            "error": f"Error during sensitivity calculations: {str(e)}",
            "status": "error",
            "runId": run_id
        }), 500

# =====================================
# Pipeline Reset Endpoint
# =====================================
@app.route('/reset_pipeline', methods=['POST'])
def reset_pipeline():
    """Reset the execution pipeline and clear all event flags"""
    reset_execution_pipeline()
    return jsonify({
        "status": "success",
        "message": "Pipeline reset successfully",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    })

# =====================================
# Health Check Endpoint
# =====================================
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint that's always accessible"""
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
        "server": "sensitivity-analysis-server-with-pipeline-control",
        "version": "2.0.0",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "pipeline": {
            "active": PIPELINE_ACTIVE.is_set(),
            "payload_registered": PAYLOAD_REGISTERED.is_set(),
            "baseline_completed": BASELINE_COMPLETED.is_set(),
            "config_completed": CONFIG_COMPLETED.is_set(),
            "runs_completed": RUNS_COMPLETED.is_set()
        },
        "services": {
            "config_copy_service": config_copy_service_status
        }
    })

# =====================================
# Application Entry Point
# =====================================
if __name__ == '__main__':
    # Ensure all lock files are cleaned up on startup
    for lock_file in [CONFIG_LOCK_FILE, RUN_LOCK_FILE, VISUALIZATION_LOCK_FILE,
                      PAYLOAD_LOCK_FILE, BASELINE_LOCK_FILE]:
        if os.path.exists(lock_file):
            try:
                os.remove(lock_file)
            except:
                pass

    # Initialize event flags
    reset_execution_pipeline()

    app.run(debug=True, host='127.0.0.1', port=2500)