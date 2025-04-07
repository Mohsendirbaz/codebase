from flask import Blueprint, jsonify, request
import requests
import time
from state import (
    PIPELINE_ACTIVE, PAYLOAD_REGISTERED, BASELINE_COMPLETED,
    CONFIG_COMPLETED, RUNS_COMPLETED
)

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
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
