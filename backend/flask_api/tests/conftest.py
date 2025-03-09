import pytest
import os
import tempfile
import shutil
from ..app import create_app
from ..websocket import socketio

@pytest.fixture
def app():
    """Create application for the tests."""
    # Create temp directory for file uploads during tests
    test_upload_dir = tempfile.mkdtemp()
    
    # Test config
    test_config = {
        'TESTING': True,
        'UPLOAD_FOLDER': test_upload_dir,
        'MAX_CONTENT_LENGTH': 1024 * 1024,  # 1MB for testing
        'SECRET_KEY': 'test-key',
        'WS_PING_INTERVAL': 1,
        'WS_PING_TIMEOUT': 2,
        'WORKER_THREADS': 2
    }
    
    # Create app with test config
    app = create_app(test_config)
    
    # Initialize SocketIO with test mode
    socketio.init_app(app, async_mode='threading')
    
    yield app
    
    # Cleanup after tests
    shutil.rmtree(test_upload_dir)

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

@pytest.fixture
def socketio_client(app):
    """Create test client for WebSocket."""
    return socketio.test_client(app)

@pytest.fixture
def runner(app):
    """Create test runner."""
    return app.test_cli_runner()

@pytest.fixture
def upload_dir(app):
    """Get upload directory path."""
    return app.config['UPLOAD_FOLDER']

@pytest.fixture
def sample_data():
    """Create sample data for tests."""
    return {
        'sensitivity': {
            'parameter': {
                'id': 'test_param',
                'name': 'Test Parameter',
                'type': 'numeric',
                'range': {'min': 0, 'max': 100},
                'steps': 10
            },
            'type': 'multipoint',
            'config': {
                'monte_carlo_iterations': 100
            }
        },
        'price': {
            'base_price': 100.0,
            'parameters': [
                {
                    'id': 'param1',
                    'weight': 0.7,
                    'sensitivity': 0.5
                }
            ],
            'market_data': {
                'competitor_prices': [95.0, 105.0, 110.0]
            }
        },
        'efficacy': {
            'sensitivity_data': {
                'points': [
                    {'value': i, 'result': i * 2}
                    for i in range(5)
                ],
                'predictions': [i * 2 for i in range(5)]
            },
            'price_data': {
                'points': [
                    {'price': 100 + i * 10}
                    for i in range(5)
                ]
            }
        }
    }

@pytest.fixture
def mock_db(app):
    """Create mock database for tests."""
    class MockDB:
        def __init__(self):
            self.data = {}
            self.analysis_results = {}
            self.file_metadata = {}
        
        def save_analysis(self, analysis_id, data):
            self.analysis_results[analysis_id] = data
        
        def get_analysis(self, analysis_id):
            return self.analysis_results.get(analysis_id)
        
        def save_file_metadata(self, filename, metadata):
            self.file_metadata[filename] = metadata
        
        def get_file_metadata(self, filename):
            return self.file_metadata.get(filename)
    
    return MockDB()

@pytest.fixture
def mock_websocket(monkeypatch):
    """Mock WebSocket functionality."""
    class MockWebSocket:
        def __init__(self):
            self.emitted = []
        
        def emit(self, event, data):
            self.emitted.append((event, data))
    
    mock_ws = MockWebSocket()
    monkeypatch.setattr('flask_socketio.emit', mock_ws.emit)
    return mock_ws

@pytest.fixture
def cleanup_files():
    """Cleanup any test files after each test."""
    yield
    # Cleanup code here
    test_files = [
        f for f in os.listdir('.')
        if f.startswith('test_') and f.endswith(('.csv', '.json', '.xlsx'))
    ]
    for file in test_files:
        try:
            os.remove(file)
        except OSError:
            pass

def pytest_configure(config):
    """Configure pytest."""
    config.addinivalue_line(
        "markers",
        "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers",
        "slow: mark test as slow running"
    )

def pytest_collection_modifyitems(config, items):
    """Modify test collection."""
    if not config.getoption("--run-slow"):
        skip_slow = pytest.mark.skip(reason="need --run-slow option to run")
        for item in items:
            if "slow" in item.keywords:
                item.add_marker(skip_slow)

def pytest_addoption(parser):
    """Add custom command line options."""
    parser.addoption(
        "--run-slow",
        action="store_true",
        default=False,
        help="run slow tests"
    )
    parser.addoption(
        "--integration",
        action="store_true",
        default=False,
        help="run integration tests"
    )
