import os
import json

# Define paths
uploads_dir = r"C:\Users\md8w7\OneDrive University of Missouri\Desktop\ImportantFiles\Milestone4\backend"
differences_dir = r"C:\Users\md8w7\OneDrive University of Missouri\Desktop\ImportantFiles\Milestone4\backend\Configuration_Differences"
os.makedirs(differences_dir, exist_ok=True)
# Versions to compare
version1 = "4"
version2 = "5"
# Function to load and parse the JSON-like 'filteredValues' from the configuration file
def load_configuration(version):
    config_file = os.path.join(uploads_dir, f'Batch({version})', f'ConfigurationPlotSpec({version})', f'U_configurations({version}).py')
    
    json_objects = []  # To hold multiple JSON objects in the file
    json_content = ""  # To accumulate each JSON object line by line
    found_json = False  # Flag to track if we've found a valid JSON object
    
    with open(config_file, 'r') as f:
        for line in f:
            stripped_line = line.strip()
            
            # Skip comments or metadata lines
            if not stripped_line or stripped_line.startswith("#") or "====" in stripped_line:
                continue
            
            # Accumulate JSON content and stop once a valid JSON object is complete
            json_content += stripped_line
            if stripped_line.endswith("}"):  # Assuming valid JSON ends with '}'
                try:
                    json_obj = json.loads(json_content)
                    json_objects.append(json_obj)  # Collect this valid JSON object
                    json_content = ""  # Reset for the next possible JSON object
                    found_json = True
                except json.JSONDecodeError:
                    # If there's a problem with the current JSON fragment, ignore and reset
                    json_content = ""
                    continue

    if not found_json:
        raise ValueError(f"No valid JSON content found in U_configurations({version}).py")
    
    # Search for 'filteredValues' in the parsed JSON objects
    for obj in json_objects:
        if 'filteredValues' in obj:
            return obj['filteredValues']

    # If 'filteredValues' not found in any JSON object
    raise ValueError(f"'filteredValues' not found in any JSON object in U_configurations({version}).py")

# Function to calculate differences between two configurations
def calculate_differences(config1, config2):
    differences = []

    # Convert the list of dictionaries to a dictionary with 'id' as key for easy comparison
    config1_dict = {item['id']: item['value'] for item in config1}
    config2_dict = {item['id']: item['value'] for item in config2}
    
    # Set of all keys (ids) to compare
    all_ids = set(config1_dict.keys()).union(config2_dict.keys())

    # Iterate over all unique ids
    for id in all_ids:
        value1 = config1_dict.get(id, None)
        value2 = config2_dict.get(id, None)

        if value1 != value2:
            if isinstance(value1, (int, float)) and isinstance(value2, (int, float)):
                value_difference = round(value2 - value1, 2)
                value_ratio = round(value2 / value1, 2) if value1 != 0 else "Infinity"
                value_percentage_difference = round(((value2 - value1) / value1) * 100, 2) if value1 != 0 else "Infinity"
                
                # Add a plus sign if the percentage difference is positive
                if value_percentage_difference != "Infinity" and value_percentage_difference > 0:
                    value_percentage_difference = f"+{value_percentage_difference}"

                differences.append({
                    'id': id,
                    'value_difference': value_difference,
                    'value_ratio': value_ratio,
                    'value_percentage_difference': value_percentage_difference
                })
            else:
                differences.append({
                    'id': id,
                    'value1': value1,
                    'value2': value2,
                    'difference': 'Non-numeric difference'
                })

        # If only one value exists, it's a new or removed item
        elif value1 is None and value2 is not None:
            differences.append({
                'id': id,
                'value': value2,  # New item
                'status': 'Added'
            })
        elif value1 is not None and value2 is None:
            differences.append({
                'id': id,
                'value': value1,  # Removed item
                'status': 'Removed'
            })

    return {'filteredValues': differences}

# Main function to compare configurations
def compare_configurations(version1, version2):
    config1 = load_configuration(version1)
    config2 = load_configuration(version2)
    differences = calculate_differences(config1, config2)

    # Save the differences to a file
    result_file_name = f'U_configurations({version1})-U_configurations({version2}).json'
    result_file_path = os.path.join(differences_dir, result_file_name)

    # Check if the file already exists and remove it if it does
    if os.path.exists(result_file_path):
        os.remove(result_file_path)
    
    with open(result_file_path, 'w') as f:
        json.dump(differences, f, indent=4)
    
    print(f"Differences saved to {result_file_path}")



# Run the comparison
compare_configurations(version1, version2)
