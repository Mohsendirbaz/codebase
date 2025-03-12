import os
import sys

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Import the app directly from app.py
from app import create_app

if __name__ == '__main__':
    # Create the app
    app = create_app()
    
    # Run with standard Flask run method instead of socketio.run
    host = os.environ.get('FLASK_HOST', '127.0.0.1')  # Use localhost instead of 0.0.0.0
    port = int(os.environ.get('FLASK_PORT', 8080))    # Use port 8080 instead of 5000
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    print(f"Starting Flask app on {host}:{port} (debug={debug})")
    app.run(host=host, port=port, debug=debug)
