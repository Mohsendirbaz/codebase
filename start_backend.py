import os
import sys
import logging
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv
import eventlet
eventlet.monkey_patch()

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from backend.flask_api.app import create_app, run_app

def setup_logging():
    """Configure logging for the application"""
    # Create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.makedirs('logs')

    # Configure file handler
    file_handler = RotatingFileHandler(
        'logs/flask_api.log',
        maxBytes=1024 * 1024,  # 1MB
        backupCount=10
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)

    # Configure console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    console_handler.setLevel(logging.INFO)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)

    # Configure specific loggers
    loggers = [
        'werkzeug',
        'flask_api',
        'engineio',
        'socketio'
    ]
    
    for logger_name in loggers:
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.INFO)
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

def load_environment():
    """Load environment variables"""
    # Load .env file if it exists
    env_path = os.path.join(os.path.dirname(__file__), 'backend', 'flask_api', '.env')
    load_dotenv(env_path)

    # Set default values for required environment variables
    os.environ.setdefault('FLASK_ENV', 'development')
    os.environ.setdefault('FLASK_DEBUG', 'False')
    os.environ.setdefault('FLASK_HOST', '0.0.0.0')
    os.environ.setdefault('FLASK_PORT', '5000')
    os.environ.setdefault('SECRET_KEY', 'dev')

def main():
    """Main entry point for the application"""
    try:
        # Setup logging
        setup_logging()
        logger = logging.getLogger(__name__)
        logger.info('Starting Flask API server...')

        # Load environment variables
        load_environment()
        
        # Create and configure the Flask application
        app = create_app()
        
        # Log startup configuration
        logger.info(f"Environment: {os.getenv('FLASK_ENV')}")
        logger.info(f"Debug mode: {os.getenv('FLASK_DEBUG')}")
        logger.info(f"Host: {os.getenv('FLASK_HOST')}")
        logger.info(f"Port: {os.getenv('FLASK_PORT')}")
        
        # Run the application
        run_app(app)
        
    except Exception as e:
        logger.error(f'Error starting server: {str(e)}', exc_info=True)
        sys.exit(1)

if __name__ == '__main__':
    main()
