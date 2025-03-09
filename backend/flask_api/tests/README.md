# Flask API Testing Suite

This directory contains the testing infrastructure for the Flask API, including unit tests, integration tests, and WebSocket tests.

## Setup

1. Create and activate a test virtual environment:
```bash
# Create test environment
python tests/setup_test_env.py --clean

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Unix/macOS:
source .venv/bin/activate
```

2. Install test dependencies:
```bash
pip install -r tests/requirements-test.txt
```

## Running Tests

### Basic Test Execution
```bash
# Run all tests
python tests/run_tests.py

# Run specific test file
python tests/run_tests.py tests/test_api.py

# Run tests with specific marker
python tests/run_tests.py -m "integration"
```

### Test Options

- `-v`, `--verbose`: Verbose output
- `-vv`, `--very-verbose`: Very verbose output
- `-q`, `--no-summary`: Quiet output (no summary)
- `-i`, `--integration`: Run integration tests
- `--run-slow`: Run slow tests
- `-c`, `--coverage`: Generate coverage report
- `--html`: Generate HTML coverage report

### Running Specific Test Types

```bash
# Run unit tests only
python tests/run_tests.py -m "unit"

# Run API tests only
python tests/run_tests.py -m "api"

# Run WebSocket tests only
python tests/run_tests.py -m "websocket"

# Run sensitivity analysis tests
python tests/run_tests.py -m "sensitivity"

# Run price analysis tests
python tests/run_tests.py -m "price"

# Run efficacy tests
python tests/run_tests.py -m "efficacy"
```

## Test Structure

```
tests/
├── conftest.py              # Pytest configuration and fixtures
├── pytest.ini              # Pytest settings
├── requirements-test.txt    # Test dependencies
├── run_tests.py            # Test runner script
├── setup_test_env.py       # Environment setup script
├── data/                   # Test data files
│   ├── test_sensitivity.json
│   └── test_price.json
├── reports/                # Test reports
│   ├── coverage/          # Coverage reports
│   ├── test_results/      # Test results
│   ├── benchmarks/        # Performance benchmarks
│   └── logs/              # Test logs
└── uploads/               # Test file uploads
    └── test/             # Test upload directory
```

## Test Categories

### Unit Tests
- Test individual components in isolation
- Fast execution
- No external dependencies
- Located in `test_*.py` files with `@pytest.mark.unit`

### Integration Tests
- Test component interactions
- May require external services
- Located in `test_*.py` files with `@pytest.mark.integration`
- Slower execution

### API Tests
- Test HTTP endpoints
- Verify request/response handling
- Located in `test_api.py`
- Marked with `@pytest.mark.api`

### WebSocket Tests
- Test real-time communication
- Verify event handling
- Located in `test_websocket.py`
- Marked with `@pytest.mark.websocket`

### File Operation Tests
- Test file uploads/downloads
- Test file transformations
- Located in `test_file.py`
- Marked with `@pytest.mark.file`

## Writing Tests

### Test Fixtures
Common fixtures are available in `conftest.py`:
- `app`: Flask application instance
- `client`: Flask test client
- `socketio_client`: SocketIO test client
- `upload_dir`: Test upload directory
- `sample_data`: Sample test data
- `mock_db`: Mock database
- `mock_websocket`: WebSocket mock

### Example Test
```python
import pytest

@pytest.mark.api
def test_sensitivity_analysis(client, sample_data):
    """Test sensitivity analysis endpoint"""
    response = client.post(
        '/sensitivity/analyze',
        json=sample_data['sensitivity'],
        content_type='application/json'
    )
    assert response.status_code == 200
    data = response.get_json()
    assert 'analysis_id' in data
```

## Coverage Reports

Coverage reports are generated in HTML and terminal formats:

```bash
# Generate coverage report
python tests/run_tests.py -c

# Generate HTML coverage report
python tests/run_tests.py -c --html
```

Reports are saved in:
- Terminal output: Basic coverage statistics
- HTML: `reports/coverage/[timestamp]/index.html`
- XML: `reports/coverage/coverage.xml`

## Continuous Integration

The test suite is configured for CI/CD:
- GitHub Actions configuration in `.github/workflows/`
- Tox configuration in `tox.ini`
- Coverage requirements in `pytest.ini`

## Best Practices

1. **Test Organization**
   - Use appropriate markers
   - Follow naming conventions
   - Group related tests

2. **Test Independence**
   - Tests should be independent
   - Clean up after tests
   - Use fixtures for setup/teardown

3. **Assertions**
   - Use descriptive assertions
   - Check both positive and negative cases
   - Verify edge cases

4. **Mocking**
   - Mock external dependencies
   - Use fixture factories
   - Verify mock interactions

5. **Documentation**
   - Document test purpose
   - Explain complex test setups
   - Update README when adding features

## Troubleshooting

### Common Issues

1. **WebSocket Connection Errors**
   - Check if Flask server is running
   - Verify WebSocket URL
   - Check CORS settings

2. **Test Database Issues**
   - Clean test database
   - Check permissions
   - Verify connections

3. **File Operation Errors**
   - Check directory permissions
   - Clean test directories
   - Verify file paths

### Debug Mode

Enable debug mode for detailed logging:
```bash
python tests/run_tests.py -vv --tb=long
```

## Contributing

1. Write tests for new features
2. Update existing tests when modifying features
3. Maintain test documentation
4. Run full test suite before committing
5. Review coverage reports
