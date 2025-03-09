#!/usr/bin/env python
"""
Startup script for the Flask API backend
This script starts the Flask API server for supporting the ModelZone component
with sensitivity analysis and price efficacy features
"""

import os
import sys
import subprocess
import time
import logging
import argparse
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend/flask_api/startup.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def check_requirements():
    """Check if required packages are installed"""
    logger.info("Checking required packages...")
    
    requirements_path = Path('backend/flask_api/requirements.txt')
    
    if not requirements_path.exists():
        logger.error(f"Requirements file not found at {requirements_path}")
        return False
    
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'install', '-r', str(requirements_path)],
            check=True,
            capture_output=True,
            text=True
        )
        logger.info("Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install requirements: {e}")
        logger.error(f"Error output: {e.stderr}")
        return False

def start_flask_server(host="0.0.0.0", port=5000, debug=True):
    """Start the Flask API server"""
    logger.info(f"Starting Flask API server on {host}:{port}...")
    
    # Check if app.py exists
    app_path = Path('backend/flask_api/app.py')
    if not app_path.exists():
        logger.error(f"Flask app not found at {app_path}")
        return None
    
    # Set environment variables
    env = os.environ.copy()
    env['FLASK_APP'] = str(app_path)
    env['FLASK_ENV'] = 'development' if debug else 'production'
    
    # Start Flask server
    try:
        flask_process = subprocess.Popen(
            [sys.executable, '-m', 'flask', 'run', '--host', host, '--port', str(port)],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait a bit to ensure the server starts
        time.sleep(2)
        
        # Check if process is still running
        if flask_process.poll() is not None:
            stdout, stderr = flask_process.communicate()
            logger.error(f"Flask server failed to start: {stderr}")
            return None
        
        logger.info(f"Flask API server started (PID: {flask_process.pid})")
        return flask_process
    
    except Exception as e:
        logger.error(f"Error starting Flask server: {e}")
        return None

def main():
    """Main function to start all servers"""
    parser = argparse.ArgumentParser(description='Start the ModelZone backend server')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind the server to')
    parser.add_argument('--port', type=int, default=5000, help='Port to bind the server to')
    parser.add_argument('--no-check', action='store_true', help='Skip requirements check')
    parser.add_argument('--production', action='store_true', help='Run in production mode')
    
    args = parser.parse_args()
    
    logger.info("Starting the ModelZone backend...")
    
    # Check requirements
    if not args.no_check:
        if not check_requirements():
            logger.error("Failed to install requirements. Exiting.")
            return 1
    
    # Start Flask server
    flask_process = start_flask_server(
        host=args.host,
        port=args.port,
        debug=not args.production
    )
    
    if not flask_process:
        logger.error("Failed to start Flask server. Exiting.")
        return 1
    
    logger.info("All servers started successfully!")
    logger.info(f"API server available at http://{args.host}:{args.port}/")
    
    try:
        # Wait for Flask server to exit
        stdout, stderr = flask_process.communicate()
        
        if flask_process.returncode != 0:
            logger.error(f"Flask server exited with error: {stderr}")
            return 1
        
    except KeyboardInterrupt:
        logger.info("Shutting down servers...")
        
        # Terminate Flask server
        try:
            flask_process.terminate()
            flask_process.wait(timeout=5)
            logger.info("Flask server shut down")
        except subprocess.TimeoutExpired:
            flask_process.kill()
            logger.info("Flask server killed")
        
        logger.info("All servers shut down")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
