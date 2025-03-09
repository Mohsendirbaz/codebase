import pytest
import os
from pathlib import Path
from flask import Flask
from ..app import create_app, load_config

class TestConfig:
    """Test Flask application configuration management"""

    @pytest.fixture
    def temp_config_dir(self, tmp_path):
        """Create temporary configuration directory"""
        config_dir = tmp_path / 'config'
        config_dir.mkdir()
        return config_dir

    def test_default_config(self):
        """Test default configuration values"""
        app = create_app()
        
        # Test core Flask settings
        assert app.config['TESTING'] is False
        assert app.config['DEBUG'] is False
        assert isinstance(app.config['SECRET_KEY'], str)
        
        # Test custom settings
        assert app.config['UPLOAD_FOLDER'] == 'uploads'
        assert app.config['MAX_CONTENT_LENGTH'] == 16 * 1024 * 1024  # 16MB
        assert isinstance(app.config['ALLOWED_EXTENSIONS'], set)

    def test_testing_config(self):
        """Test testing configuration"""
        app = create_app({'TESTING': True})
        
        assert app.config['TESTING'] is True
        assert app.config['WS_PING_INTERVAL'] == 1
        assert app.config['WS_PING_TIMEOUT'] == 2

    def test_production_config(self):
        """Test production configuration"""
        app = create_app({
            'ENV': 'production',
            'SECRET_KEY': 'production-key'
        })
        
        assert app.config['ENV'] == 'production'
        assert app.config['DEBUG'] is False
        assert app.config['TESTING'] is False
        assert app.config['SECRET_KEY'] == 'production-key'

    def test_development_config(self):
        """Test development configuration"""
        app = create_app({
            'ENV': 'development',
            'DEBUG': True
        })
        
        assert app.config['ENV'] == 'development'
        assert app.config['DEBUG'] is True
        assert app.config['TESTING'] is False

    def test_config_from_file(self, temp_config_dir):
        """Test loading configuration from file"""
        config_file = temp_config_dir / 'config.py'
        config_file.write_text("""
TESTING = True
DEBUG = True
SECRET_KEY = 'test-key'
CUSTOM_SETTING = 'test-value'
""")

        app = create_app()
        app.config.from_pyfile(str(config_file))
        
        assert app.config['TESTING'] is True
        assert app.config['DEBUG'] is True
        assert app.config['SECRET_KEY'] == 'test-key'
        assert app.config['CUSTOM_SETTING'] == 'test-value'

    def test_config_from_env(self):
        """Test loading configuration from environment variables"""
        os.environ['FLASK_ENV'] = 'development'
        os.environ['FLASK_DEBUG'] = '1'
        os.environ['SECRET_KEY'] = 'env-key'
        os.environ['UPLOAD_FOLDER'] = 'custom-uploads'
        
        app = create_app()
        
        assert app.config['ENV'] == 'development'
        assert app.config['DEBUG'] is True
        assert app.config['SECRET_KEY'] == 'env-key'
        assert app.config['UPLOAD_FOLDER'] == 'custom-uploads'

    def test_websocket_config(self):
        """Test WebSocket configuration"""
        app = create_app({
            'WS_PING_INTERVAL': 25,
            'WS_PING_TIMEOUT': 60,
            'WS_MAX_CONNECTIONS': 100,
            'WS_MAX_RECONNECT_ATTEMPTS': 5
        })
        
        assert app.config['WS_PING_INTERVAL'] == 25
        assert app.config['WS_PING_TIMEOUT'] == 60
        assert app.config['WS_MAX_CONNECTIONS'] == 100
        assert app.config['WS_MAX_RECONNECT_ATTEMPTS'] == 5

    def test_logging_config(self):
        """Test logging configuration"""
        app = create_app({
            'LOG_LEVEL': 'DEBUG',
            'LOG_FILE': 'app.log',
            'LOG_MAX_BYTES': 1048576,
            'LOG_BACKUP_COUNT': 10
        })
        
        assert app.config['LOG_LEVEL'] == 'DEBUG'
        assert app.config['LOG_FILE'] == 'app.log'
        assert app.config['LOG_MAX_BYTES'] == 1048576
        assert app.config['LOG_BACKUP_COUNT'] == 10

    def test_cors_config(self):
        """Test CORS configuration"""
        origins = ['http://localhost:3000', 'https://example.com']
        app = create_app({
            'CORS_ORIGINS': origins,
            'CORS_METHODS': ['GET', 'POST'],
            'CORS_HEADERS': ['Content-Type']
        })
        
        assert app.config['CORS_ORIGINS'] == origins
        assert 'GET' in app.config['CORS_METHODS']
        assert 'POST' in app.config['CORS_METHODS']
        assert 'Content-Type' in app.config['CORS_HEADERS']

    def test_file_upload_config(self):
        """Test file upload configuration"""
        app = create_app({
            'UPLOAD_FOLDER': 'custom-uploads',
            'MAX_CONTENT_LENGTH': 32 * 1024 * 1024,
            'ALLOWED_EXTENSIONS': {'pdf', 'doc'}
        })
        
        assert app.config['UPLOAD_FOLDER'] == 'custom-uploads'
        assert app.config['MAX_CONTENT_LENGTH'] == 32 * 1024 * 1024
        assert app.config['ALLOWED_EXTENSIONS'] == {'pdf', 'doc'}

    def test_config_override(self):
        """Test configuration value override precedence"""
        # Set environment variable
        os.environ['SECRET_KEY'] = 'env-key'
        
        # Create config file
        config_file = Path('instance/config.py')
        config_file.parent.mkdir(exist_ok=True)
        config_file.write_text("SECRET_KEY = 'file-key'")
        
        # Create app with direct config
        app = create_app({'SECRET_KEY': 'direct-key'})
        
        # Direct config should take precedence
        assert app.config['SECRET_KEY'] == 'direct-key'
        
        # Clean up
        config_file.unlink()
        config_file.parent.rmdir()

    def test_invalid_config(self):
        """Test handling of invalid configuration"""
        with pytest.raises(ValueError):
            create_app({'MAX_CONTENT_LENGTH': 'invalid'})
        
        with pytest.raises(ValueError):
            create_app({'LOG_LEVEL': 'INVALID_LEVEL'})

    def test_sensitive_config(self):
        """Test handling of sensitive configuration values"""
        app = create_app({
            'SECRET_KEY': 'sensitive-key',
            'DATABASE_URL': 'postgresql://user:pass@localhost/db'
        })
        
        # Sensitive values should not appear in debug output
        assert 'sensitive-key' not in str(app.config)
        assert 'postgresql://user:pass' not in str(app.config)

    def test_config_update(self):
        """Test dynamic configuration updates"""
        app = create_app()
        
        # Update config
        app.config.update(
            TESTING=True,
            CUSTOM_VALUE='dynamic'
        )
        
        assert app.config['TESTING'] is True
        assert app.config['CUSTOM_VALUE'] == 'dynamic'

    def test_config_namespacing(self):
        """Test configuration namespacing"""
        app = create_app({
            'SENSITIVITY': {
                'MAX_PARAMETERS': 10,
                'DEFAULT_STEPS': 5
            },
            'PRICE': {
                'MIN_VALUE': 0,
                'MAX_VALUE': 1000
            }
        })
        
        assert app.config['SENSITIVITY']['MAX_PARAMETERS'] == 10
        assert app.config['SENSITIVITY']['DEFAULT_STEPS'] == 5
        assert app.config['PRICE']['MIN_VALUE'] == 0
        assert app.config['PRICE']['MAX_VALUE'] == 1000
