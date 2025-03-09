import pytest
from flask import Flask, url_for
from ..app import create_app, register_blueprints, configure_logging, setup_error_handlers
from ..routes.sensitivity_routes import sensitivity_bp
from ..routes.price_routes import price_bp
from ..routes.file_routes import file_bp

class TestApp:
    """Test Flask application configuration and initialization"""

    def test_app_creation(self):
        """Test basic app creation and configuration"""
        app = create_app()
        assert isinstance(app, Flask)
        assert app.config['TESTING'] is False
        
        # Test with testing config
        test_app = create_app({'TESTING': True})
        assert test_app.config['TESTING'] is True

    def test_blueprint_registration(self):
        """Test blueprint registration"""
        app = create_app({'TESTING': True})
        
        # Check that blueprints are registered
        assert sensitivity_bp.name in app.blueprints
        assert price_bp.name in app.blueprints
        assert file_bp.name in app.blueprints

        # Check blueprint URLs
        with app.test_request_context():
            assert url_for('sensitivity.analyze_sensitivity') == '/sensitivity/analyze'
            assert url_for('price.calculate_price_impact') == '/price/impact'
            assert url_for('file.upload_file') == '/file/upload'

    def test_error_handlers(self):
        """Test error handler registration"""
        app = create_app({'TESTING': True})
        
        with app.test_client() as client:
            # Test 404 handler
            response = client.get('/nonexistent')
            assert response.status_code == 404
            data = response.get_json()
            assert 'error' in data
            assert data['code'] == 'NOT_FOUND'

            # Test 405 handler
            response = client.post('/file/list')  # GET only endpoint
            assert response.status_code == 405
            data = response.get_json()
            assert 'error' in data
            assert data['code'] == 'METHOD_NOT_ALLOWED'

    def test_config_loading(self):
        """Test configuration loading"""
        # Test default config
        app = create_app()
        assert app.config['UPLOAD_FOLDER'] == 'uploads'
        assert app.config['MAX_CONTENT_LENGTH'] == 16 * 1024 * 1024  # 16MB
        
        # Test custom config
        custom_config = {
            'UPLOAD_FOLDER': 'custom_uploads',
            'MAX_CONTENT_LENGTH': 32 * 1024 * 1024,
            'CUSTOM_SETTING': 'test'
        }
        app = create_app(custom_config)
        assert app.config['UPLOAD_FOLDER'] == 'custom_uploads'
        assert app.config['MAX_CONTENT_LENGTH'] == 32 * 1024 * 1024
        assert app.config['CUSTOM_SETTING'] == 'test'

    def test_logging_configuration(self, tmp_path):
        """Test logging configuration"""
        import logging
        import os

        # Create test log directory
        log_dir = tmp_path / 'logs'
        os.makedirs(log_dir)

        # Configure app with test log directory
        app = create_app({
            'TESTING': True,
            'LOG_DIR': str(log_dir),
            'LOG_LEVEL': 'DEBUG'
        })

        # Test log file creation
        log_file = log_dir / 'flask_api.log'
        assert log_file.exists()

        # Test log level
        logger = logging.getLogger('flask_api')
        assert logger.level == logging.DEBUG

    def test_cors_configuration(self):
        """Test CORS configuration"""
        app = create_app({
            'TESTING': True,
            'CORS_ORIGINS': ['http://localhost:3000']
        })

        with app.test_client() as client:
            response = client.get(
                '/file/list',
                headers={'Origin': 'http://localhost:3000'}
            )
            assert response.headers.get('Access-Control-Allow-Origin') == 'http://localhost:3000'

    def test_websocket_configuration(self):
        """Test WebSocket configuration"""
        app = create_app({
            'TESTING': True,
            'WS_PING_INTERVAL': 25,
            'WS_PING_TIMEOUT': 60
        })

        assert app.config['WS_PING_INTERVAL'] == 25
        assert app.config['WS_PING_TIMEOUT'] == 60

    @pytest.mark.integration
    def test_full_app_integration(self):
        """Test full application integration"""
        app = create_app({'TESTING': True})
        
        with app.test_client() as client:
            # Test sensitivity analysis endpoint
            response = client.post(
                '/sensitivity/analyze',
                json={
                    'parameter': {
                        'id': 'test_param',
                        'name': 'Test Parameter',
                        'type': 'numeric',
                        'range': {'min': 0, 'max': 100},
                        'steps': 10
                    },
                    'type': 'multipoint',
                    'config': {}
                }
            )
            assert response.status_code == 200
            data = response.get_json()
            assert 'analysis_id' in data

            # Test price impact endpoint
            response = client.post(
                '/price/impact',
                json={
                    'base_price': 100.0,
                    'parameters': [
                        {
                            'id': 'param1',
                            'weight': 0.7,
                            'sensitivity': 0.5
                        }
                    ]
                }
            )
            assert response.status_code == 200
            data = response.get_json()
            assert 'optimized_price' in data

            # Test file listing endpoint
            response = client.get('/file/list')
            assert response.status_code == 200
            data = response.get_json()
            assert 'files' in data

    def test_environment_configuration(self, monkeypatch):
        """Test environment-based configuration"""
        # Test development environment
        monkeypatch.setenv('FLASK_ENV', 'development')
        app = create_app()
        assert app.config['DEBUG'] is True
        assert app.config['TESTING'] is False

        # Test production environment
        monkeypatch.setenv('FLASK_ENV', 'production')
        app = create_app()
        assert app.config['DEBUG'] is False
        assert app.config['TESTING'] is False

        # Test testing environment
        monkeypatch.setenv('FLASK_ENV', 'testing')
        app = create_app()
        assert app.config['DEBUG'] is False
        assert app.config['TESTING'] is True

    def test_static_file_serving(self):
        """Test static file serving configuration"""
        app = create_app({'TESTING': True})
        
        with app.test_client() as client:
            # Test favicon
            response = client.get('/favicon.ico')
            assert response.status_code in (200, 404)  # Depending on if favicon exists

            # Test static folder configuration
            assert app.static_folder == 'static'
            assert app.static_url_path == '/static'

    def test_request_size_limits(self):
        """Test request size limits"""
        app = create_app({
            'TESTING': True,
            'MAX_CONTENT_LENGTH': 1024  # 1KB limit for testing
        })
        
        with app.test_client() as client:
            # Test small request
            response = client.post(
                '/file/upload',
                data={'file': (b'x' * 512, 'test.txt')}
            )
            assert response.status_code != 413  # Not a request entity too large error

            # Test large request
            response = client.post(
                '/file/upload',
                data={'file': (b'x' * 2048, 'test.txt')}  # 2KB
            )
            assert response.status_code == 413  # Request entity too large
