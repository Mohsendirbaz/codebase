import pytest
import os
import logging
import json
from pathlib import Path
from ..app import create_app, configure_logging

class TestLogging:
    """Test Flask application logging configuration"""

    @pytest.fixture
    def temp_log_dir(self, tmp_path):
        """Create temporary log directory"""
        log_dir = tmp_path / 'logs'
        log_dir.mkdir()
        return log_dir

    @pytest.fixture
    def app(self, temp_log_dir):
        """Create test Flask application with logging"""
        app = create_app({
            'TESTING': True,
            'LOG_DIR': str(temp_log_dir),
            'LOG_LEVEL': 'DEBUG',
            'LOG_MAX_BYTES': 1024,
            'LOG_BACKUP_COUNT': 3
        })
        return app

    def test_log_directory_creation(self, temp_log_dir):
        """Test log directory is created if it doesn't exist"""
        # Remove log directory
        os.rmdir(temp_log_dir)
        assert not temp_log_dir.exists()

        # Create app (which should recreate log directory)
        app = create_app({
            'TESTING': True,
            'LOG_DIR': str(temp_log_dir),
            'LOG_LEVEL': 'DEBUG'
        })

        assert temp_log_dir.exists()
        assert temp_log_dir.is_dir()

    def test_log_file_creation(self, app, temp_log_dir):
        """Test log files are created"""
        log_files = [
            'flask_api.log',
            'websocket.log',
            'analysis.log',
            'error.log'
        ]

        for log_file in log_files:
            log_path = temp_log_dir / log_file
            assert log_path.exists()
            assert log_path.is_file()

    def test_log_levels(self, app, temp_log_dir, caplog):
        """Test different logging levels"""
        logger = logging.getLogger('flask_api')

        with caplog.at_level(logging.DEBUG):
            logger.debug("Debug message")
            logger.info("Info message")
            logger.warning("Warning message")
            logger.error("Error message")
            logger.critical("Critical message")

        # Check log file content
        log_path = temp_log_dir / 'flask_api.log'
        log_content = log_path.read_text()

        assert "Debug message" in log_content
        assert "Info message" in log_content
        assert "Warning message" in log_content
        assert "Error message" in log_content
        assert "Critical message" in log_content

    def test_log_rotation(self, app, temp_log_dir):
        """Test log file rotation"""
        logger = logging.getLogger('flask_api')
        log_path = temp_log_dir / 'flask_api.log'

        # Write enough data to trigger rotation
        large_message = 'x' * 512  # 512 bytes
        for _ in range(3):  # Write enough to create multiple log files
            logger.info(large_message)

        # Check for rotated log files
        assert log_path.exists()
        assert any(
            f.name.startswith('flask_api.log.')
            for f in temp_log_dir.iterdir()
        )

    def test_error_logging(self, app, temp_log_dir):
        """Test error logging configuration"""
        client = app.test_client()
        error_log_path = temp_log_dir / 'error.log'

        # Generate some errors
        client.get('/nonexistent')  # 404
        client.post('/file/list')   # 405
        
        error_log_content = error_log_path.read_text()
        assert "404 Not Found" in error_log_content
        assert "405 Method Not Allowed" in error_log_content

    def test_websocket_logging(self, app, temp_log_dir):
        """Test WebSocket logging configuration"""
        websocket_log_path = temp_log_dir / 'websocket.log'
        socketio_client = app.config['SOCKETIO'].test_client(app)

        # Generate some WebSocket activity
        socketio_client.emit('start_analysis', {
            'analysis_id': 'test',
            'type': 'sensitivity'
        })

        websocket_log_content = websocket_log_path.read_text()
        assert "WebSocket" in websocket_log_content
        assert "start_analysis" in websocket_log_content

    def test_analysis_logging(self, app, temp_log_dir):
        """Test analysis logging configuration"""
        analysis_log_path = temp_log_dir / 'analysis.log'
        client = app.test_client()

        # Trigger some analysis
        client.post(
            '/sensitivity/analyze',
            json={
                'parameter': {
                    'id': 'test_param',
                    'name': 'Test Parameter',
                    'type': 'numeric',
                    'range': {'min': 0, 'max': 100},
                    'steps': 5
                },
                'type': 'multipoint',
                'config': {}
            }
        )

        analysis_log_content = analysis_log_path.read_text()
        assert "Analysis" in analysis_log_content
        assert "test_param" in analysis_log_content

    def test_log_format(self, app, temp_log_dir):
        """Test log message format"""
        logger = logging.getLogger('flask_api')
        logger.info("Test message")

        log_path = temp_log_dir / 'flask_api.log'
        log_content = log_path.read_text().strip()
        
        # Check log format components
        assert '[INFO]' in log_content
        assert 'Test message' in log_content
        assert 'test_logging.py' in log_content

    def test_json_logging(self, app, temp_log_dir):
        """Test structured JSON logging"""
        logger = logging.getLogger('flask_api')
        
        # Log structured data
        logger.info('Structured log', extra={
            'data': {
                'user_id': 123,
                'action': 'test',
                'parameters': {'key': 'value'}
            }
        })

        log_path = temp_log_dir / 'flask_api.log'
        log_content = log_path.read_text()
        
        # Verify JSON structure in log
        assert '"user_id": 123' in log_content
        assert '"action": "test"' in log_content
        assert '"parameters"' in log_content

    def test_log_filtering(self, app, temp_log_dir):
        """Test log filtering configuration"""
        # Configure filter to exclude certain messages
        class TestFilter(logging.Filter):
            def filter(self, record):
                return 'exclude' not in record.msg

        logger = logging.getLogger('flask_api')
        logger.addFilter(TestFilter())

        # Log messages
        logger.info("Include this message")
        logger.info("exclude this message")

        log_path = temp_log_dir / 'flask_api.log'
        log_content = log_path.read_text()

        assert "Include this message" in log_content
        assert "exclude this message" not in log_content

    def test_log_handlers(self, app):
        """Test log handler configuration"""
        logger = logging.getLogger('flask_api')
        
        # Check handler types
        handler_types = [type(h) for h in logger.handlers]
        assert logging.FileHandler in handler_types
        
        # Check handler levels
        assert any(h.level == logging.DEBUG for h in logger.handlers)
        assert any(h.level == logging.ERROR for h in logger.handlers)

    def test_environment_specific_logging(self, temp_log_dir):
        """Test environment-specific logging configuration"""
        # Test production config
        prod_app = create_app({
            'ENV': 'production',
            'LOG_DIR': str(temp_log_dir),
            'LOG_LEVEL': 'WARNING'
        })
        assert logging.getLogger('flask_api').level == logging.WARNING

        # Test development config
        dev_app = create_app({
            'ENV': 'development',
            'LOG_DIR': str(temp_log_dir),
            'LOG_LEVEL': 'DEBUG'
        })
        assert logging.getLogger('flask_api').level == logging.DEBUG
