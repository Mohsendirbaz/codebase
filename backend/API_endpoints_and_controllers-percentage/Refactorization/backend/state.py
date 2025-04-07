import threading

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

# Pipeline active flag (holds all routes except the active one)
PIPELINE_ACTIVE = threading.Event()
