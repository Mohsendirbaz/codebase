from flask import Flask
from flask_cors import CORS
from .websocket import socketio
from .routes.sensitivity_routes import sensitivity_bp
from .routes.price_routes import price_bp
from .routes.file_routes import file_bp
import logging
from logging.handlers import RotatingFileHandler
import os

def create_app(config=None):
    # Initialize Flask app
    app = Flask(__name__)
    
    # Configure logging
    if not app.debug:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler(
            'logs/flask_app.log', 
            maxBytes=10240, 
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Flask API startup')

    # Apply configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        CORS_HEADERS='Content-Type'
    )

    if config:
        app.config.update(config)

    # Initialize CORS
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "allow_headers": ["Content-Type"],
            "expose_headers": ["Content-Type"],
            "supports_credentials": True
        }
    })

    # Register blueprints
    app.register_blueprint(sensitivity_bp, url_prefix='/sensitivity')
    app.register_blueprint(price_bp, url_prefix='/price')
    app.register_blueprint(file_bp, url_prefix='/file')

    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return {'error': 'Resource not found'}, 404

    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500

    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy'}, 200

    # Initialize SocketIO with the app
    socketio.init_app(app, 
        cors_allowed_origins="*",
        async_mode='gevent',
        ping_timeout=60,
        ping_interval=25
    )

    return app

def run_app(app):
    """Run the application with SocketIO support"""
    host = os.environ.get('FLASK_HOST', '0.0.0.0')
    port = int(os.environ.get('FLASK_PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Run with SocketIO instead of regular Flask run
    socketio.run(app, host=host, port=port, debug=debug)

if __name__ == '__main__':
    app = create_app()
    run_app(app)
