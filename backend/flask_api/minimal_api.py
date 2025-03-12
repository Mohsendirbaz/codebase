from flask import Flask, jsonify

# Create a minimal app
app = Flask(__name__)

# Configure CORS 
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    return response

# Add a health check endpoint
@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy'}), 200

# Add other basic endpoints
@app.route('/sensitivity/status')
def sensitivity_status():
    return jsonify({'status': 'Sensitivity module is configured but disabled due to missing dependencies'}), 200

@app.route('/price/status')
def price_status():
    return jsonify({'status': 'Price module is configured but disabled due to missing dependencies'}), 200

@app.route('/file/status')
def file_status():
    return jsonify({'status': 'File module is configured but disabled due to missing dependencies'}), 200

@app.route('/')
def index():
    return jsonify({
        'message': 'API server is running',
        'available_endpoints': [
            '/health', 
            '/sensitivity/status',
            '/price/status',
            '/file/status'
        ]
    }), 200

# Run the server if executed directly
if __name__ == '__main__':
    print("Starting minimal Flask API on 127.0.0.1:8080")
    app.run(host='127.0.0.1', port=8080, debug=True)
