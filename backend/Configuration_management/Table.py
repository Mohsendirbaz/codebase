import sys
import json
import logging
import os
import pandas as pd

# Set pandas option to handle future behavior for downcasting
pd.set_option('future.no_silent_downcasting', True)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from Utility_functions.common_utils import property_mapping

log_file_path = os.path.join(os.getcwd(), 'Table.log')
logging.basicConfig(
    filename=log_file_path,
    filemode='w',
    level=logging.INFO,
    format='%(message)s'
)

def expand_vector_properties(properties, prop_name, vector):
    """Helper function to expand vector properties with numbered extensions."""
    if isinstance(vector, list):
        for i, value in enumerate(vector, 1):
            presentable_name = f"{property_mapping.get(prop_name, prop_name)}_{i}"
            properties.append({'Property Name': presentable_name, 'Value': value})
    return properties

def collect_properties_from_config_module(config_module):
    """Collect properties from a config module, properly handling vectors."""
    properties = []
    
    for prop in config_module.keys():
        if prop == 'variable_costsAmount4':
            properties = expand_vector_properties(properties, prop, config_module[prop])
        elif prop == 'amounts_per_unitAmount5':
            properties = expand_vector_properties(properties, prop, config_module[prop])
        else:
            presentable_name = property_mapping.get(prop, prop)
            properties.append({'Property Name': presentable_name, 'Value': config_module[prop]})
    
    return properties

def load_config_modules(results_folder, version):
    """Load all config modules from the results folder."""
    config_modules = []
    for file in os.listdir(results_folder):
        if file.startswith(f"{version}_config_module_") and file.endswith('.json'):
            file_path = os.path.join(results_folder, file)
            with open(file_path, 'r') as f:
                config_module = json.load(f)
                start_year = int(file.split('_')[-1].split('.')[0])
                config_modules.append((start_year, config_module))
    
    return sorted(config_modules, key=lambda x: x[0])

def build_and_save_table(version):
    code_files_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backend", "Original")
    results_folder = os.path.join(code_files_path, f'Batch({version})', f'Results({version})')
    
    # Load all config modules
    config_modules = load_config_modules(results_folder, version)
    if not config_modules:
        logging.error("No config modules found in results folder")
        return
    
    # Get properties from the first module to set up the DataFrame
    first_module_properties = collect_properties_from_config_module(config_modules[0][1])
    column_headers = [prop['Property Name'] for prop in first_module_properties]
    
    # Create DataFrame with all properties for each year
    plant_lifetime = config_modules[0][1].get('plantLifetimeAmount10', 0)
    df = pd.DataFrame(index=range(1, plant_lifetime + 1), columns=column_headers)
    
    # Fill the DataFrame with values from each config module
    for start_year, config_module in config_modules:
        properties = collect_properties_from_config_module(config_module)
        for prop in properties:
            df.loc[start_year, prop['Property Name']] = prop['Value']
    
    # Forward fill any missing values and handle deprecation warning
    df = df.ffill().infer_objects(copy=False)
    
    # Save the DataFrame
    save_path = os.path.join(results_folder, f"Variable_Table({version}).csv")
    df.to_csv(save_path, index_label='Year')
    logging.info(f"Table saved successfully to {save_path}")

def main(version):
    try:
        build_and_save_table(version)
    except Exception as e:
        logging.error(f"Error in main function: {str(e)}")

if __name__ == "__main__":
    version = sys.argv[1] if len(sys.argv) > 1 else 1
    main(version)
