import threading
import time
from state import (
    PAYLOAD_REGISTERED, BASELINE_COMPLETED, CONFIG_COMPLETED, 
    RUNS_COMPLETED, PIPELINE_ACTIVE
)

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
