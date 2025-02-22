import sys
import importlib.util
import logging
import os
from common_utils import property_mapping
import pandas as pd

log_file_path = os.path.join(os.getcwd(), 'Table.log')

# Configure logging
logging.basicConfig(
    filename=log_file_path,
    filemode='w',  # 'w' to overwrite the file every time the application starts
    level=logging.INFO,  # Control the minimum logging level
    format='%(message)s'  # Log only the message, no time or level info
)

def collect_properties(config_received):
    properties = []
    for prop in dir(config_received):

        if not prop.startswith('__'):
              
            presentable_name = property_mapping.get(prop, prop)
            value = getattr(config_received, prop)
            properties.append({'Property Name': presentable_name, 'Value': value})

    return properties
        
def load_filteredValues_build_table(config_received):
     
    plant_lifetime=getattr(config_received, 'plantLifetimeAmount1')
    properties=collect_properties(config_received)
    column_headers=[prop['Property Name'] for prop in properties]

    # Create an empty DataFrame with the collected columns and plant lifetime rows
    df = pd.DataFrame(index=range(plant_lifetime), columns=column_headers)
    
    # Save the DataFrame to a CSV file
    code_files_path = r"C:\Users\Mohse\OneDrive\Documents\GitHub\TeaSpace\backend\Original"
    save_path = os.path.join(code_files_path, f'Batch({version})', f'Results({version})', f"Variable_Table({version}).csv")
    df.to_csv(save_path, index=False)
             

def main(version):
    
    code_files_path = r"C:\Users\Mohse\OneDrive\Documents\GitHub\TeaSpace\backend\Original"

    # Import configurations
    config_file = os.path.join(code_files_path,  f"Batch({version})", f"ConfigurationPlotSpec({version})", f"configurations({version}).py")
    spec = importlib.util.spec_from_file_location("config", config_file)
    
    config_received = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(config_received)
    logging.basicConfig(filename=log_file_path, level=logging.INFO,  format='')
    
   
    
    load_filteredValues_build_table(config_received)

# Accept version as a command-line argument
if __name__ == "__main__":
    version = sys.argv[1] if len(sys.argv) > 1 else 1
    main(version)