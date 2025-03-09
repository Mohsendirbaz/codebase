import pytest
import json
from flask import Flask
from werkzeug.exceptions import NotFound, MethodNotAllowed, BadRequest
from ..app import create_app, setup_error_handlers

class TestErrorHandling:
    """Test Flask application error handling"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = create_app({'TESTING': True})
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_404_handler(self, client):
        """Test handling of 404 Not Found errors"""
        response = client.get('/nonexistent/endpoint')
        assert response.status_code == 404
        data = json.loads(response.data)
        assert data['error'] == 'Not Found'
        assert data['code'] == 'NOT_FOUND'
        assert 'message' in data

    def test_405_handler(self, client):
        """Test handling of 405 Method Not Allowed errors"""
        # Try POST on a GET-only endpoint
        response = client.post('/file/list')
        assert response.status_code == 405
        data = json.loads(response.data)
        assert data['error'] == 'Method Not Allowed'
        assert data['code'] == 'METHOD_NOT_ALLOWED'
        assert 'message' in data

    def test_400_handler(self, client):
        """Test handling of 400 Bad Request errors"""
        # Send invalid JSON
        response = client.post(
            '/sensitivity/analyze',
            data='invalid json',
            content_type='application/json'
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['error'] == 'Invalid JSON format'
        assert data['code'] == 'INVALID_JSON'

    def test_validation_error_handler(self, client):
        """Test handling of validation errors"""
        # Send incomplete data
        response = client.post(
            '/sensitivity/analyze',
            json={'incomplete': 'data'},
            content_type='application/json'
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['code'] == 'VALIDATION_ERROR'
        assert 'details' in data

    def test_internal_server_error_handler(self, app, client):
        """Test handling of internal server errors"""
        # Create an endpoint that raises an exception
        @app.route('/test-error')
        def test_error():
            raise ValueError("Test error")

        response = client.get('/test-error')
        assert response.status_code == 500
        data = json.loads(response.data)
        assert data['error'] == 'Internal server error'
        assert data['code'] == 'INTERNAL_ERROR'

    def test_file_size_limit_error(self, client):
        """Test handling of file size limit exceeded error"""
        # Create a large file that exceeds the limit
        large_data = b'x' * (16 * 1024 * 1024 + 1)  # Slightly larger than 16MB
        
        response = client.post(
            '/file/upload',
            data={
                'file': (large_data, 'large_file.txt')
            },
            content_type='multipart/form-data'
        )
        
        assert response.status_code == 413
        data = json.loads(response.data)
        assert data['code'] == 'FILE_TOO_LARGE'

    def test_invalid_content_type(self, client):
        """Test handling of invalid content type"""
        response = client.post(
            '/sensitivity/analyze',
            data='some data',
            content_type='text/plain'
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['code'] == 'INVALID_CONTENT_TYPE'

    def test_websocket_error(self, app):
        """Test WebSocket error handling"""
        socketio_client = app.config['SOCKETIO'].test_client(app)
        
        # Send invalid analysis data
        socketio_client.emit('start_analysis', {
            'invalid': 'data'
        })
        
        received = socketio_client.get_received()
        error_event = next(
            (event for event in received if event['name'] == 'error'),
            None
        )
        
        assert error_event is not None
        assert error_event['args'][0]['code'] == 'VALIDATION_ERROR'

    def test_error_logging(self, app, caplog):
        """Test error logging"""
        client = app.test_client()
        
        # Create an endpoint that raises an exception
        @app.route('/test-logging-error')
        def test_logging_error():
            raise ValueError("Test logging error")

        # Make request and check logs
        with caplog.at_level('ERROR'):
            client.get('/test-logging-error')
            
        assert any(
            'Test logging error' in record.message
            for record in caplog.records
        )

    def test_custom_error_response(self, app, client):
        """Test custom error response format"""
        # Create an endpoint with custom error
        @app.route('/custom-error')
        def custom_error():
            error_response = {
                'error': 'Custom Error',
                'code': 'CUSTOM_ERROR',
                'details': {
                    'reason': 'Test custom error handling',
                    'suggestion': 'This is a test'
                }
            }
            return error_response, 400

        response = client.get('/custom-error')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['code'] == 'CUSTOM_ERROR'
        assert 'details' in data

    def test_error_chain_handling(self, app, client):
        """Test handling of chained errors"""
        # Create nested error scenario
        @app.route('/nested-error')
        def nested_error():
            try:
                try:
                    raise ValueError("Inner error")
                except ValueError as e:
                    raise RuntimeError("Middle error") from e
            except RuntimeError as e:
                raise BadRequest("Outer error") from e

        response = client.get('/nested-error')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['code'] == 'BAD_REQUEST'
        assert 'error_chain' in data

    @pytest.mark.parametrize('status_code,expected_code', [
        (400, 'BAD_REQUEST'),
        (401, 'UNAUTHORIZED'),
        (403, 'FORBIDDEN'),
        (404, 'NOT_FOUND'),
        (405, 'METHOD_NOT_ALLOWED'),
        (408, 'REQUEST_TIMEOUT'),
        (413, 'FILE_TOO_LARGE'),
        (415, 'UNSUPPORTED_MEDIA_TYPE'),
        (429, 'TOO_MANY_REQUESTS'),
        (500, 'INTERNAL_ERROR'),
        (502, 'BAD_GATEWAY'),
        (503, 'SERVICE_UNAVAILABLE'),
        (504, 'GATEWAY_TIMEOUT')
    ])
    def test_standard_http_errors(self, app, client, status_code, expected_code):
        """Test handling of standard HTTP errors"""
        @app.route(f'/error-{status_code}')
        def generate_error():
            return '', status_code

        response = client.get(f'/error-{status_code}')
        assert response.status_code == status_code
        data = json.loads(response.data)
        assert data['code'] == expected_code
