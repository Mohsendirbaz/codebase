import os
import sys

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, current_dir)
sys.path.insert(0, parent_dir)

# Import modules directly - not through package names
from app import create_app, run_app

if __name__ == '__main__':
    app = create_app()
    run_app(app)
