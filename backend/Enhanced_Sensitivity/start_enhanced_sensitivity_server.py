#!/usr/bin/env python
"""
Start Enhanced Sensitivity Server

This script starts the enhanced sensitivity Flask server.
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

if __name__ == '__main__':
    try:
        # Get port from command line arguments
        port = int(sys.argv[1]) if len(sys.argv) > 1 else 25007
        
        # Start server
        logger.info(f"Starting enhanced sensitivity server on port {port}")
        app.run(host='0.0.0.0', port=port, debug=True)
        
    except Exception as e:
        logger.error(f"Error starting enhanced sensitivity server: {str(e)}")
        sys.exit(1)
