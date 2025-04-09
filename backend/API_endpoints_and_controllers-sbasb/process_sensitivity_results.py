#!/usr/bin/env python
"""
Process Sensitivity Results - Fixed Version

This script processes sensitivity results with proper path handling:
1. Uses absolute paths from the start
2. Validates all paths before use
3. Handles both symmetrical and multipoint variations
4. Proper error logging and reporting
"""

import os
import sys
import time
import logging
import subprocess
import pandas as pd
import glob
from datetime import datetime
import pickle
from typing import Optional

# Configure absolute paths at startup
try:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
    ORIGINAL_DIR = os.path.join(BACKEND_DIR, 'Original')
    LOGS_DIR = os.path.join(BACKEND_DIR, 'Logs')
    CORE_ENGINES_DIR = os.path.join(BACKEND_DIR, 'Core_calculation_engines')

    # Ensure required directories exist
    os.makedirs(LOGS_DIR, exist_ok=True)

    # Add to Python path
    sys.path.append(BACKEND_DIR)
    from Sensitivity_File_Manager import SensitivityFileManager
except Exception as e:
    print(f"Fatal initialization error: {str(e)}")
    sys.exit(1)

# Constants
CONFIG_DATA_PATH = os.path.join(LOGS_DIR, "sensitivity_config_data.pkl")

# Logger setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(LOGS_DIR, "SENSITIVITY_RESULTS.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('sensitivity_results')

def validate_path(path: str, description: str) -> str:
    """Validate a path exists or raise exception."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"{description} not found at: {path}")
    return path

def load_config_data() -> dict:
    """Load sensitivity configuration data with validation."""
    try:
        validate_path(CONFIG_DATA_PATH, "Config data file")
        with open(CONFIG_DATA_PATH, 'rb') as f:
            return pickle.load(f)
    except Exception as e:
        logger.error(f"Config load failed: {str(e)}", exc_info=True)
        raise

def get_calculation_script() -> str:
    """Get validated path to CFA-b.py."""
    script_path = os.path.join(CORE_ENGINES_DIR, "CFA-b.py")
    return validate_path(script_path, "Calculation script")

def find_economic_summary(version: int, param_id: str, variation: float) -> str:
    """Find economic summary file with validation."""
    var_str = f"{variation:+.2f}"
    search_patterns = [
        os.path.join(ORIGINAL_DIR, f'Batch({version})', f'Results({version})',
                     'Sensitivity', param_id, '*', var_str, 'Economic_Summary*.csv'),
        os.path.join(ORIGINAL_DIR, f'Batch({version})', f'Results({version})',
                     'Sensitivity', 'Multipoint', 'Configuration',
                     f'{param_id}_{var_str}', 'Economic_Summary*.csv'),
        os.path.join(ORIGINAL_DIR, f'Batch({version})', f'Results({version})',
                     'Sensitivity', 'Symmetrical', 'Configuration',
                     f'{param_id}_{var_str}', 'Economic_Summary*.csv')
    ]

    for pattern in search_patterns:
        matches = glob.glob(pattern)
        if matches:
            return validate_path(matches[0], "Economic summary file")
    raise FileNotFoundError(f"No summary found for {param_id} {var_str}")

def extract_metric_value(summary_file: str, metric_name: str) -> float:
    """Extract metric from CSV with validation."""
    try:
        df = pd.read_csv(validate_path(summary_file, "Summary file"))
        row = df[df['Metric'] == metric_name]
        if row.empty:
            raise ValueError(f"Metric '{metric_name}' not found")
        return float(row.iloc[0, 1])
    except Exception as e:
        logger.error(f"Metric extraction failed: {str(e)}")
        raise

def process_variation(version: int, param_id: str, mode: str, variation: float, compare_to_key: str) -> dict:
    """Process a single parameter variation with full path validation."""
    var_str = f"{variation:+.2f}"
    mode_dir = 'symmetrical' if mode.lower() == 'symmetrical' else 'multiple'

    config_dir = os.path.join(
        ORIGINAL_DIR, f'Batch({version})', f'Results({version})',
        'Sensitivity', param_id, mode_dir, var_str
    )

    try:
        config_files = glob.glob(os.path.join(config_dir, f"{version}_config_module_*.json"))
        if not config_files:
            raise FileNotFoundError(f"No config files in {config_dir}")

        script_path = get_calculation_script()
        results = {'success': 0, 'errors': 0}

        for config_file in config_files:
            try:
                result = subprocess.run(
                    ['python', script_path, str(version), '-c', config_file,
                     '--sensitivity', param_id, str(variation), compare_to_key],
                    capture_output=True, text=True, timeout=300
                )
                if result.returncode == 0:
                    results['success'] += 1
                else:
                    results['errors'] += 1
                    logger.error(f"Processing failed for {config_file}: {result.stderr}")
            except subprocess.TimeoutExpired:
                results['errors'] += 1
                logger.error(f"Timeout processing {config_file}")
            except Exception as e:
                results['errors'] += 1
                logger.error(f"Error processing {config_file}: {str(e)}")

        summary_file = find_economic_summary(version, param_id, variation)
        price = extract_metric_value(summary_file, 'Average Selling Price (Project Life Cycle)')

        return {
            'variation': variation,
            'status': 'completed' if results['success'] > 0 else 'error',
            'values': {
                'price': price,
                'modules_processed': results['success'],
                'modules_failed': results['errors']
            }
        }
    except Exception as e:
        logger.error(f"Variation processing failed: {str(e)}")
        return {
            'variation': variation,
            'status': 'error',
            'error': str(e)
        }

def process_parameter(version: int, param_id: str, param_config: dict) -> Optional[dict]:
    """Process all variations for a single parameter."""
    if not param_config.get('enabled'):
        logger.info(f"Skipping disabled parameter: {param_id}")
        return None

    mode = param_config.get('mode', 'symmetrical')
    values = param_config.get('values', [])
    compare_to_key = param_config.get('compareToKey', 'S13')

    if not values:
        logger.warning(f"No values for parameter {param_id}")
        return None

    variations = [values[0], -values[0]] if mode.lower() == 'symmetrical' else values

    result_data = {
        'parameter': param_id,
        'compare_to_key': compare_to_key,
        'mode': mode.lower(),
        'version': version,
        'timestamp': datetime.now().isoformat(),
        'variations': []
    }

    for variation in variations:
        result_data['variations'].append(
            process_variation(version, param_id, mode, variation, compare_to_key)
        )
        time.sleep(1)  # Rate limiting

    return result_data

def store_results(version: int, param_id: str, result_data: dict) -> dict:
    """Store results with validation."""
    try:
        file_manager = SensitivityFileManager(ORIGINAL_DIR)
        return file_manager.store_calculation_result(
            version=version,
            param_id=param_id,
            result_data=result_data,
            mode=result_data.get('mode', 'multiple'),
            compare_to_key=result_data.get('compare_to_key', 'S13')
        )
    except Exception as e:
        logger.error(f"Storage failed for {param_id}: {str(e)}")
        return {'status': 'error', 'error': str(e)}

def main():
    if len(sys.argv) < 2:
        print("Usage: python process_sensitivity_results.py <version> [max_wait_minutes]")
        sys.exit(1)

    version = int(sys.argv[1])
    max_wait = float(sys.argv[2]) if len(sys.argv) >= 3 else 30

    try:
        logger.info(f"Starting processing for version {version}")
        config_data = load_config_data()

        for param_id, param_config in config_data.get('SenParameters', {}).items():
            result_data = process_parameter(version, param_id, param_config)
            if result_data:
                store_results(version, param_id, result_data)

        logger.info("Processing completed successfully")
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
