# Flask API with WebSocket Support

This Flask API provides real-time analysis capabilities through WebSocket connections and RESTful endpoints for the Model Zone application.

## Features

- Real-time sensitivity analysis with progress updates
- WebSocket-based communication for long-running calculations
- RESTful endpoints for price and sensitivity data
- Automatic retry mechanisms for failed operations
- Comprehensive logging system
- Environment-based configuration

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the `flask_api` directory:
```env
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
SECRET_KEY=your-secret-key-here
```

## Running the Server

Start the server using:
```bash
python start_backend.py
```

The server will start with WebSocket support on the configured host and port.

## API Endpoints

### Sensitivity Analysis

- `POST /sensitivity/analyze`
  - Analyze parameter sensitivity
  - Requires parameter configuration in request body
  - Returns analysis results with confidence intervals

- `POST /sensitivity/monte-carlo`
  - Run Monte Carlo simulations
  - Accepts simulation parameters and iteration count
  - Returns probability distributions

- `GET /sensitivity/derivatives/<parameter>`
  - Get derivative data for specific parameter
  - Supports version and extension query parameters
  - Returns derivative calculations with metadata

- `POST /sensitivity/efficacy`
  - Calculate efficacy metrics
  - Requires sensitivity and price data
  - Returns combined efficacy scores

### Price Analysis

- `GET /price/data`
  - Get price data for specific model version
  - Supports version and extension query parameters
  - Returns comprehensive price metrics

- `POST /price/comparison`
  - Compare prices between model variants
  - Accepts base version and variant configurations
  - Returns detailed comparison metrics

- `POST /price/impact`
  - Calculate parameter impact on pricing
  - Requires base price and parameter changes
  - Returns impact analysis results

## WebSocket Events

### Client to Server

- `start_analysis`
  ```typescript
  {
    analysis_id: string;
    type: 'sensitivity' | 'monte_carlo' | 'optimization';
    parameters: any[];
    total_steps: number;
  }
  ```

- `update_progress`
  ```typescript
  {
    analysis_id: string;
    step: number;
    status: 'running' | 'complete' | 'error';
    results?: any;
    error?: string;
  }
  ```

- `cancel_analysis`
  ```typescript
  {
    analysis_id: string;
  }
  ```

### Server to Client

- `analysis_started`
  ```typescript
  {
    analysis_id: string;
    status: 'started';
    timestamp: string;
  }
  ```

- `progress_update`
  ```typescript
  {
    analysis_id: string;
    progress: number;
    step: number;
    total_steps: number;
    status: string;
    time_remaining: number | null;
    has_errors: boolean;
    latest_results: any;
  }
  ```

- `analysis_complete`
  ```typescript
  {
    analysis_id: string;
    status: 'complete' | 'error';
    results: any;
    errors: string[];
    timestamp: string;
  }
  ```

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 400: Bad Request (invalid parameters)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error

WebSocket errors are emitted as error events:
```typescript
{
  type: 'error';
  message: string;
  code?: string;
  details?: any;
}
```

## Logging

Logs are stored in the `logs` directory:
- `flask_api.log`: Main application log
- Rotated automatically at 1MB
- Keeps 10 backup files

Log levels:
- INFO: Normal operations
- WARNING: Potential issues
- ERROR: Operation failures
- DEBUG: Detailed debugging (when FLASK_DEBUG=True)

## Development

1. Enable debug mode in `.env`:
```env
FLASK_DEBUG=True
```

2. Run tests:
```bash
pytest tests/
```

3. Check code style:
```bash
flake8 .
black .
mypy .
```

## Production Deployment

1. Update `.env` for production:
```env
FLASK_ENV=production
FLASK_DEBUG=False
```

2. Use Gunicorn with eventlet worker:
```bash
gunicorn --worker-class eventlet -w 1 'flask_api.app:create_app()'
```

3. Configure reverse proxy (e.g., Nginx) for WebSocket support:
```nginx
location /socket.io {
    proxy_pass http://localhost:5000/socket.io;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
}
```

## Security Considerations

1. Set a strong SECRET_KEY in production
2. Enable CORS only for trusted origins
3. Rate limit WebSocket connections
4. Validate all input data
5. Use HTTPS in production
6. Monitor server resources
7. Implement authentication for sensitive operations
