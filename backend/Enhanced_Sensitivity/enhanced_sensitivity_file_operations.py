"""
Enhanced Sensitivity File Operations

This module provides utility functions for file operations, logging, etc.,
and helper functions for JSON manipulation.
"""

import os
import json
import shutil
import logging
import csv
import sys
from pathlib import Path

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

def ensure_directory_exists(directory_path):
    """
    Ensure that a directory exists, creating it if necessary.
    
    Args:
        directory_path (str): Path to the directory
        
    Returns:
        str: Path to the directory
    """
    os.makedirs(directory_path, exist_ok=True)
    logger.info(f"Ensured directory exists: {directory_path}")
    return directory_path

def copy_file(source_path, destination_path):
    """
    Copy a file from source to destination.
    
    Args:
        source_path (str): Path to the source file
        destination_path (str): Path to the destination file
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Ensure the destination directory exists
        destination_dir = os.path.dirname(destination_path)
        ensure_directory_exists(destination_dir)
        
        # Copy the file
        shutil.copy2(source_path, destination_path)
        logger.info(f"Copied file: {source_path} -> {destination_path}")
        return True
        
    except Exception as e:
        logger.error(f"Error copying file {source_path} to {destination_path}: {str(e)}")
        return False

def copy_directory(source_dir, destination_dir):
    """
    Copy a directory and its contents from source to destination.
    
    Args:
        source_dir (str): Path to the source directory
        destination_dir (str): Path to the destination directory
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Ensure the destination directory exists
        ensure_directory_exists(os.path.dirname(destination_dir))
        
        # Copy the directory
        shutil.copytree(source_dir, destination_dir)
        logger.info(f"Copied directory: {source_dir} -> {destination_dir}")
        return True
        
    except Exception as e:
        logger.error(f"Error copying directory {source_dir} to {destination_dir}: {str(e)}")
        return False

def load_json_file(file_path):
    """
    Load a JSON file.
    
    Args:
        file_path (str): Path to the JSON file
        
    Returns:
        dict: JSON data, or None if an error occurred
    """
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        logger.info(f"Loaded JSON file: {file_path}")
        return data
        
    except Exception as e:
        logger.error(f"Error loading JSON file {file_path}: {str(e)}")
        return None

def save_json_file(file_path, data, indent=4):
    """
    Save data to a JSON file.
    
    Args:
        file_path (str): Path to the JSON file
        data (dict): Data to save
        indent (int, optional): Indentation level. Defaults to 4.
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Ensure the directory exists
        ensure_directory_exists(os.path.dirname(file_path))
        
        # Save the data
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=indent)
        logger.info(f"Saved JSON file: {file_path}")
        return True
        
    except Exception as e:
        logger.error(f"Error saving JSON file {file_path}: {str(e)}")
        return False

def load_csv_file(file_path):
    """
    Load a CSV file.
    
    Args:
        file_path (str): Path to the CSV file
        
    Returns:
        list: List of rows, or None if an error occurred
    """
    try:
        with open(file_path, 'r') as f:
            reader = csv.reader(f)
            rows = list(reader)
        logger.info(f"Loaded CSV file: {file_path}")
        return rows
        
    except Exception as e:
        logger.error(f"Error loading CSV file {file_path}: {str(e)}")
        return None

def save_csv_file(file_path, rows):
    """
    Save rows to a CSV file.
    
    Args:
        file_path (str): Path to the CSV file
        rows (list): List of rows to save
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Ensure the directory exists
        ensure_directory_exists(os.path.dirname(file_path))
        
        # Save the rows
        with open(file_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(rows)
        logger.info(f"Saved CSV file: {file_path}")
        return True
        
    except Exception as e:
        logger.error(f"Error saving CSV file {file_path}: {str(e)}")
        return False

def find_files_by_extension(directory, extension):
    """
    Find all files with a specific extension in a directory.
    
    Args:
        directory (str): Path to the directory
        extension (str): File extension to find (e.g., ".json")
        
    Returns:
        list: List of file paths
    """
    try:
        files = []
        for root, _, filenames in os.walk(directory):
            for filename in filenames:
                if filename.endswith(extension):
                    files.append(os.path.join(root, filename))
        logger.info(f"Found {len(files)} files with extension {extension} in {directory}")
        return files
        
    except Exception as e:
        logger.error(f"Error finding files with extension {extension} in {directory}: {str(e)}")
        return []

def find_files_by_pattern(directory, pattern):
    """
    Find all files matching a specific pattern in a directory.
    
    Args:
        directory (str): Path to the directory
        pattern (str): File pattern to find (e.g., "*_config_module_*.json")
        
    Returns:
        list: List of file paths
    """
    try:
        files = list(Path(directory).glob(pattern))
        logger.info(f"Found {len(files)} files matching pattern {pattern} in {directory}")
        return [str(file) for file in files]
        
    except Exception as e:
        logger.error(f"Error finding files matching pattern {pattern} in {directory}: {str(e)}")
        return []

def modify_json_property(file_path, property_name, new_value):
    """
    Modify a property in a JSON file.
    
    Args:
        file_path (str): Path to the JSON file
        property_name (str): Name of the property to modify
        new_value: New value for the property
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Load the JSON file
        data = load_json_file(file_path)
        if data is None:
            return False
            
        # Modify the property
        data[property_name] = new_value
        
        # Save the JSON file
        return save_json_file(file_path, data)
        
    except Exception as e:
        logger.error(f"Error modifying property {property_name} in {file_path}: {str(e)}")
        return False

def extract_value_from_csv(file_path, row_label, column_index=1):
    """
    Extract a value from a CSV file based on a row label.
    
    Args:
        file_path (str): Path to the CSV file
        row_label (str): Label of the row to find
        column_index (int, optional): Index of the column to extract. Defaults to 1.
        
    Returns:
        str: Extracted value, or None if not found
    """
    try:
        # Load the CSV file
        rows = load_csv_file(file_path)
        if rows is None:
            return None
            
        # Find the row with the specified label
        for row in rows:
            if len(row) > column_index and row[0] == row_label:
                return row[column_index]
                
        logger.warning(f"Row with label {row_label} not found in {file_path}")
        return None
        
    except Exception as e:
        logger.error(f"Error extracting value from {file_path}: {str(e)}")
        return None

# Example usage
if __name__ == "__main__":
    # Example directory
    example_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Ensure directory exists
    ensure_directory_exists(os.path.join(example_dir, "Example"))
    
    # Create example JSON data
    example_data = {
        "name": "Example",
        "value": 42,
        "nested": {
            "key": "value"
        }
    }
    
    # Save example JSON file
    json_path = os.path.join(example_dir, "Example", "example.json")
    save_json_file(json_path, example_data)
    
    # Load example JSON file
    loaded_data = load_json_file(json_path)
    print(f"Loaded data: {loaded_data}")
    
    # Modify example JSON file
    modify_json_property(json_path, "value", 43)
    
    # Load modified JSON file
    modified_data = load_json_file(json_path)
    print(f"Modified data: {modified_data}")
    
    # Find JSON files
    json_files = find_files_by_extension(example_dir, ".json")
    print(f"JSON files: {json_files}")
