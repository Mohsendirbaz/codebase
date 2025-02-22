import os
import json
import pandas as pd
import sys
import importlib.util
import shutil
from common_utils import property_mapping  # Import the property_mapping
import logging

#Define the base directory for your uploads and batches
uploads_dir = r"C:\Users\Mohse\OneDrive\Documents\GitHub\TeaSpace\backend\Original"

# Initialize logging
log_file_path = os.path.join(os.getcwd(), 'module.log')
logging.basicConfig(filename=log_file_path, level=logging.INFO, format='%(asctime)s %(message)s')

# Function to apply property mapping to the ID column in the filtered value intervals
def apply_property_mapping(filtered_value_intervals):
    mapped_intervals = []
    for interval in filtered_value_intervals:
        interval_id = interval[0]
        if interval_id in property_mapping:
            # Create a new list from the tuple and replace the ID
            interval_list = list(interval)
            interval_list[0] = property_mapping[interval_id]
            # Convert the list back to a tuple and add to the mapped intervals list
            mapped_intervals.append(tuple(interval_list))
        else:
            # If no mapping is found, keep the original interval
            mapped_intervals.append(interval)
    return mapped_intervals

# Function to apply filtered values from JSON and build the config matrix
# Customized Quantities which fall at the edge of intervals are only applied to the intervals leading up to the interval.
def apply_filtered_values_and_build_matrix(config_received, filtered_values_json):

    filtered_values = [json.loads(item) for item in filtered_values_json]

    # Add the extracted config value to filtered_value_intervals with a default entry
    filtered_value_intervals = []
    logging.info(f"filtered_values: {filtered_values}")  # 
    # Process the filtered values and create the unique start and end years list
    start_end_points = set()
    start_end_points.update([1, config_received.plantLifetimeAmount1])
    general_year_sorted_list = list(range(1, config_received.plantLifetimeAmount1 + 2))
    logging.info(f"general_year_sorted_list: {general_year_sorted_list}")  # 
    for value in filtered_values:
        if isinstance(value, dict) and 'filteredValue' in value:
            fv = value['filteredValue']
            if 'id' in fv and 'value' in fv and 'start' in fv and 'end' in fv:
                start_year = int(fv['start'])  # Directly use 'start' value from JSON
                end_year = int(fv['end'])      # Directly use 'end' value from JSON
                start_end_points.update([start_year, end_year])  # collects interval points
                logging.info(f"start_end_points: {start_end_points}")  # 
                if 'remarks' in fv:
                    filtered_value_intervals.append((fv['id'], start_year, end_year, fv['value'], fv['remarks']))
                else:
                    filtered_value_intervals.append((fv['id'], start_year, end_year, fv['value']))

    # Sort the start and end points and create the intervals
    sorted_points = sorted(start_end_points)
    logging.info(f"sorted_points: {sorted_points}")  #
    intervals = [(sorted_points[i], sorted_points[i + 1]) for i in range(len(sorted_points) - 1)]
    general_intervals=[(general_year_sorted_list[i], general_year_sorted_list[i + 1]) for i in range(len(general_year_sorted_list) - 1)]
    logging.info(f"general_intervals: {general_intervals}")  # 
    logging.info(f"intervals: {intervals}")  # 
    # Create the config matrix and initialize with the extracted config value
    config_matrix = []
   
    for start, end in intervals:
        length = end - start  # No need to add 1 here because end is already inclusive
        config_matrix.append({
            'start': start,
            'end': end,  # Store the actual end year
            'length': length+1,
            'filtered_values': []  # Initialize an empty list for filtered values
        })
    
    general_config_matrix = []
    for start, end in general_intervals:
        length = end - start  # No need to add 1 here because end is already inclusive
        general_config_matrix.append({
            'start': start,
            'end': end-1,  # Store the actual end year
            'length': length,
            'filtered_values': []  # Initialize an empty list for filtered values
        })

    # Populate the config matrix with the filtered values
    for fv_tuple in filtered_value_intervals:
        fv_id = fv_tuple[0]
        hs = fv_tuple[1]
        he = fv_tuple[2]
        value = fv_tuple[3]
        remarks = fv_tuple[4] if len(fv_tuple) > 4 else None
        logging.info(f"fv_tuple: {fv_tuple[1]}")  # 
        for row in config_matrix:
            if hs > row['end']:
                continue  # Skip this row, as the start year of the interval is later than the end year of the row
            if he < row['start']:
                continue  # Skip this row, as the end year of the interval is earlier than the start year of the row
            
            # Construct the item as a dictionary
            item = {"id": fv_id, "value": value}
            if remarks:
                item["remarks"] = remarks
            
            # Add the item to the filtered_values list for this row
            row['filtered_values'].append(item)
    

    # Populate the config matrix with the filtered values
    for fv_tuple in filtered_value_intervals:
        fv_id = fv_tuple[0]
        hs = fv_tuple[1]
        he = fv_tuple[2]
        value = fv_tuple[3]
        remarks = fv_tuple[4] if len(fv_tuple) > 4 else None
        logging.info(f"fv_tuple: {fv_tuple[1]}")  # 
        for row in general_config_matrix:
            if hs > row['end']:
                continue  # Skip this row, as the start year of the interval is later than the end year of the row
            if he < row['start']:
                continue  # Skip this row, as the end year of the interval is earlier than the start year of the row
            
            # Construct the item as a dictionary
            item = {"id": fv_id, "value": value}
            if remarks:
                item["remarks"] = remarks
            
            # Add the item to the filtered_values list for this row
            row['filtered_values'].append(item)



    # Convert the filtered_values list to a valid JSON format
    for row in config_matrix:
        row['filtered_values'] = json.dumps(row['filtered_values'], indent=None)  # Ensure valid JSON format with double quotes
    
     # Convert the filtered_values list to a valid JSON format
    for row in general_config_matrix:
        row['filtered_values'] = json.dumps(row['filtered_values'], indent=None)  # Ensure valid JSON format with double quotes
    # Apply the property mapping to the filtered value intervals
    filtered_value_intervals = apply_property_mapping(filtered_value_intervals)

    return config_matrix, sorted_points, filtered_value_intervals, general_config_matrix

# Function to empty the results folder without affecting the log directory
def empty_folder(folder_path):
    if os.path.exists(folder_path):
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)  # Remove the file or symbolic link
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)  # Remove the directory and its contents
            except Exception as e:
                print(f"Failed to delete {file_path}. Reason: {e}")

# Main function to test the list building and save intermediate results
def test_list_building(version, config_received):
    # Get filtered values from the config_received
    filtered_values_json = config_received.filtered_values_json

    # Apply filtered values and build the config matrix
    config_matrix, sorted_points, filtered_value_intervals, general_config_matrix = apply_filtered_values_and_build_matrix(config_received, filtered_values_json)

    # Create a results directory
    results_folder = os.path.join(code_files_path, f"Batch({version})", f"Results({version})")
    os.makedirs(results_folder, exist_ok=True)

    # Empty the results folder before creating new files
    empty_folder(results_folder)

    # Define file paths
    config_matrix_file = os.path.join(results_folder, f"Configuration_Matrix({version}).csv")
    sorted_points_file = os.path.join(results_folder, f"Sorted_Points({version}).csv")
    filtered_value_intervals_file = os.path.join(results_folder, f"Filtered_Value_Intervals({version}).csv")
    general_config_matrix_file = os.path.join(results_folder, f"General_Configuration_Matrix({version}).csv")
    # Save config matrix as a table for debugging
    config_matrix_df = pd.DataFrame(config_matrix)
    config_matrix_df.to_csv(config_matrix_file, index=False)
    
    # Save config matrix as a table for debugging
    general_config_matrix_df = pd.DataFrame(general_config_matrix)
    general_config_matrix_df.to_csv(general_config_matrix_file, index=False)
    # Save the sorted points and filtered value intervals for debugging
    sorted_points_df = pd.DataFrame(sorted_points, columns=["Points"])
    sorted_points_df.to_csv(sorted_points_file, index=False)

    # Save the filtered value intervals, ensuring the default entry is always included
    filtered_value_intervals_df = pd.DataFrame(filtered_value_intervals, columns=["ID", "Start", "End", "Value", "Remarks"])
    filtered_value_intervals_df.to_csv(filtered_value_intervals_file, index=False)

    # Print the intermediate results for verification
    print("Config Matrix:")
    print(config_matrix_df)
    print("Sorted Points:")
    print(sorted_points_df)
    print("Filtered Value Intervals:")
    print(filtered_value_intervals_df)

# Accept version as a command-line argument
version = sys.argv[1] if len(sys.argv) > 1 else 1

# Set the path to the directory containing the modules
code_files_path = r"C:\Users\Mohse\OneDrive\Documents\GitHub\TeaSpace\backend\Original"


if code_files_path not in sys.path:
    sys.path.append(code_files_path)

# Import configurations
config_file = os.path.join(code_files_path,  f"Batch({version})", f"ConfigurationPlotSpec({version})", f"configurations({version}).py")
spec = importlib.util.spec_from_file_location("config", config_file)
config_received = importlib.util.module_from_spec(spec)
spec.loader.exec_module(config_received)

# Run the test for list building
test_list_building(version, config_received)
