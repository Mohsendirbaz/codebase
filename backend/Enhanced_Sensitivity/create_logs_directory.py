"""
Create Logs Directory

This script creates the Logs directory for the enhanced sensitivity server.
"""

import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def create_logs_directory():
    """Create the Logs directory."""
    try:
        # Get the directory of this script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Create Logs directory
        logs_dir = os.path.join(script_dir, "Logs")
        os.makedirs(logs_dir, exist_ok=True)
        
        logger.info(f"Created Logs directory: {logs_dir}")
        
        # Create a .gitkeep file to ensure the directory is tracked by git
        gitkeep_file = os.path.join(logs_dir, ".gitkeep")
        with open(gitkeep_file, 'w') as f:
            f.write("# This file ensures the Logs directory is tracked by git\n")
            
        logger.info(f"Created .gitkeep file: {gitkeep_file}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error creating Logs directory: {str(e)}")
        return False

if __name__ == "__main__":
    create_logs_directory()
