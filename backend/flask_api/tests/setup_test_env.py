#!/usr/bin/env python3
import os
import sys
import subprocess
import venv
import argparse
import shutil
from pathlib import Path

def create_venv(venv_path):
    """Create a virtual environment"""
    print(f"Creating virtual environment at {venv_path}...")
    venv.create(venv_path, with_pip=True)

def get_venv_python(venv_path):
    """Get the path to the virtual environment's Python executable"""
    if sys.platform == 'win32':
        return os.path.join(venv_path, 'Scripts', 'python.exe')
    return os.path.join(venv_path, 'bin', 'python')

def get_venv_pip(venv_path):
    """Get the path to the virtual environment's pip executable"""
    if sys.platform == 'win32':
        return os.path.join(venv_path, 'Scripts', 'pip.exe')
    return os.path.join(venv_path, 'bin', 'pip')

def install_requirements(pip_path, requirements_file):
    """Install requirements using pip"""
    print(f"Installing requirements from {requirements_file}...")
    subprocess.run([
        pip_path, 'install', '-r', requirements_file,
        '--no-cache-dir', '--upgrade'
    ], check=True)

def setup_test_directories():
    """Create necessary test directories"""
    directories = [
        'reports',
        'reports/coverage',
        'reports/test_results',
        'reports/benchmarks',
        'reports/logs',
        'uploads',
        'uploads/test'
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"Created directory: {directory}")

def setup_test_data():
    """Set up test data files"""
    test_data_dir = 'tests/data'
    os.makedirs(test_data_dir, exist_ok=True)
    
    # Create sample test data files
    sample_data = {
        'test_sensitivity.json': {
            'parameter': {
                'id': 'test_param',
                'name': 'Test Parameter',
                'type': 'numeric',
                'range': {'min': 0, 'max': 100},
                'steps': 10
            }
        },
        'test_price.json': {
            'base_price': 100.0,
            'parameters': [
                {
                    'id': 'param1',
                    'weight': 0.7,
                    'sensitivity': 0.5
                }
            ]
        }
    }
    
    import json
    for filename, data in sample_data.items():
        filepath = os.path.join(test_data_dir, filename)
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Created test data file: {filepath}")

def configure_logging():
    """Configure logging for tests"""
    log_config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'standard': {
                'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
            },
        },
        'handlers': {
            'file': {
                'class': 'logging.FileHandler',
                'filename': 'reports/logs/test.log',
                'formatter': 'standard',
                'level': 'DEBUG',
            },
        },
        'loggers': {
            '': {
                'handlers': ['file'],
                'level': 'DEBUG',
                'propagate': True
            }
        }
    }
    
    import json
    with open('tests/logging_config.json', 'w') as f:
        json.dump(log_config, f, indent=2)
    print("Created logging configuration")

def main():
    parser = argparse.ArgumentParser(description='Set up test environment')
    parser.add_argument('--venv-path', default='.venv',
                      help='Path to create virtual environment')
    parser.add_argument('--clean', action='store_true',
                      help='Clean existing environment before setup')
    args = parser.parse_args()

    # Convert to absolute path
    venv_path = os.path.abspath(args.venv_path)

    # Clean if requested
    if args.clean and os.path.exists(venv_path):
        print(f"Cleaning existing environment at {venv_path}...")
        shutil.rmtree(venv_path)

    try:
        # Create virtual environment
        create_venv(venv_path)

        # Get paths
        pip_path = get_venv_pip(venv_path)
        requirements_file = os.path.join('tests', 'requirements-test.txt')

        # Install requirements
        install_requirements(pip_path, requirements_file)

        # Setup directories and data
        setup_test_directories()
        setup_test_data()
        configure_logging()

        print("\nTest environment setup complete!")
        print("\nTo activate the virtual environment:")
        if sys.platform == 'win32':
            print(f"    {venv_path}\\Scripts\\activate")
        else:
            print(f"    source {venv_path}/bin/activate")
        
        print("\nTo run tests:")
        print("    python tests/run_tests.py")

    except subprocess.CalledProcessError as e:
        print(f"Error during setup: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
