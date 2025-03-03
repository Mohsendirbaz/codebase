"""
Start Enhanced Sensitivity Server

This script starts the enhanced sensitivity analysis server.
"""

import os
import sys
import logging
from enhanced_sensitivity_flask_server import app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'enhanced_sensitivity.log'))
    ]
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    try:
        logger.info("Starting Enhanced Sensitivity Server on port 27890")
        app.run(host='0.0.0.0', port=27890, debug=True)
    except Exception as e:
        logger.error(f"Error starting server: {str(e)}")
