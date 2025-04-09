from flask import Flask
from flask_cors import CORS
import os
import threading
import filelock

# Import blueprints
from blueprints.health import health_bp
from blueprints.payload import payload_bp
from blueprints.baseline import baseline_bp
from blueprints.sensitivity import sensitivity_bp
from blueprints.runs import runs_bp

# Import middleware
from middleware import check_endpoint_availability

# Import pipeline reset function
from pipeline import reset_execution_pipeline

# Import configuration
from config import LOGS_DIR, CONFIG_LOCK_FILE, RUN_LOCK_FILE, VISUALIZATION_LOCK_FILE, PAYLOAD_LOCK_FILE, BASELINE_LOCK_FILE

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    CORS(app)
    
    # Register middleware
    app.before_request(check_endpoint_availability)
    
    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(payload_bp)
    app.register_blueprint(baseline_bp)
    app.register_blueprint(sensitivity_bp)
    app.register_blueprint(runs_bp)
    
    return app

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
    
    # Create and run the application
    app = create_app()
    app.run(debug=True, host='127.0.0.1', port=2500)
