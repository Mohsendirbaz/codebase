import functools
import filelock
import threading
from flask import jsonify

# Import shared state
from state import (
    PAYLOAD_REGISTERED, BASELINE_COMPLETED, CONFIG_COMPLETED, 
    RUNS_COMPLETED, PIPELINE_ACTIVE
)

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
