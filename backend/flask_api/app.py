from flask import Flask, jsonify
from flask_cors import CORS
import os
import logging
from routes.theme_routes import theme_routes

def create_app(config=None):
    """Create and configure the Flask application"""
    app = Flask(__name__, static_folder='../../src', static_url_path='')
    
    # Enable CORS with error handling
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register error handler for all exceptions
    @app.errorhandler(Exception)
    def handle_error(error):
        response = jsonify({
            "success": False,
            "message": str(error)
        })
        response.status_code = 500
        return response
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Apply configuration
    if config:
        app.config.from_mapping(config)
    
    # Register blueprints
    app.register_blueprint(theme_routes)
    
    # Create test route
    @app.route('/api/test', methods=['GET'])
    def test_route():
        return {'message': 'API is working'}
    
    return app

# Create application instance
app = create_app()

if __name__ == '__main__':
    # Run the app
    port = int(os.environ.get('PORT', 8010))
    app.run(host='0.0.0.0', port=port, debug=True)
