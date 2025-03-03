"""
Enhanced Sensitivity File Operations

This module provides utility functions for file operations related to sensitivity analysis.
"""

import os
import json
import csv
import logging
import re
import shutil

logger = logging.getLogger(__name__)

def ensure_directory_exists(directory_path):
    """
    Ensure that a directory exists, creating it if necessary.
    
    Args:
        directory_path (str): Path to directory
        
    Returns:
        str: Path to directory
    """
    os.makedirs(directory_path, exist_ok=True)
    return directory_path

def read_json_file(file_path, default=None):
    """
    Read a JSON file.
    
    Args:
        file_path (str): Path to JSON file
        default: Default value to return if file doesn't exist or is invalid
        
    Returns:
        dict: JSON data
    """
    try:
        if not os.path.exists(file_path):
            logger.warning(f"JSON file not found: {file_path}")
            return default
            
        with open(file_path, 'r') as f:
            return json.load(f)
            
    except Exception as e:
        logger.error(f"Error reading JSON file {file_path}: {str(e)}")
        return default

def write_json_file(file_path, data):
    """
    Write data to a JSON file.
    
    Args:
        file_path (str): Path to JSON file
        data: Data to write
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
            
        return True
        
    except Exception as e:
        logger.error(f"Error writing JSON file {file_path}: {str(e)}")
        return False

def read_csv_file(file_path, default=None):
    """
    Read a CSV file.
    
    Args:
        file_path (str): Path to CSV file
        default: Default value to return if file doesn't exist or is invalid
        
    Returns:
        list: List of rows
    """
    try:
        if not os.path.exists(file_path):
            logger.warning(f"CSV file not found: {file_path}")
            return default
            
        with open(file_path, 'r', newline='') as f:
            reader = csv.reader(f)
            return list(reader)
            
    except Exception as e:
        logger.error(f"Error reading CSV file {file_path}: {str(e)}")
        return default

def write_csv_file(file_path, data):
    """
    Write data to a CSV file.
    
    Args:
        file_path (str): Path to CSV file
        data: List of rows
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(data)
            
        return True
        
    except Exception as e:
        logger.error(f"Error writing CSV file {file_path}: {str(e)}")
        return False

def copy_file(source_path, dest_path):
    """
    Copy a file.
    
    Args:
        source_path (str): Path to source file
        dest_path (str): Path to destination file
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        if not os.path.exists(source_path):
            logger.warning(f"Source file not found: {source_path}")
            return False
            
        # Ensure directory exists
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        
        shutil.copy2(source_path, dest_path)
        return True
        
    except Exception as e:
        logger.error(f"Error copying file from {source_path} to {dest_path}: {str(e)}")
        return False

def get_file_modification_time(file_path):
    """
    Get file modification time.
    
    Args:
        file_path (str): Path to file
        
    Returns:
        float: Modification time (timestamp)
    """
    try:
        if not os.path.exists(file_path):
            logger.warning(f"File not found: {file_path}")
            return 0
            
        return os.path.getmtime(file_path)
        
    except Exception as e:
        logger.error(f"Error getting modification time for {file_path}: {str(e)}")
        return 0

def find_files_by_pattern(directory, pattern):
    """
    Find files matching a pattern in a directory.
    
    Args:
        directory (str): Directory to search
        pattern (str): Regex pattern to match
        
    Returns:
        list: List of matching file paths
    """
    try:
        if not os.path.exists(directory) or not os.path.isdir(directory):
            logger.warning(f"Directory not found: {directory}")
            return []
            
        matching_files = []
        pattern_re = re.compile(pattern)
        
        for root, dirs, files in os.walk(directory):
            for file in files:
                if pattern_re.match(file):
                    matching_files.append(os.path.join(root, file))
                    
        return matching_files
        
    except Exception as e:
        logger.error(f"Error finding files in {directory} with pattern {pattern}: {str(e)}")
        return []

def read_file_content(file_path, default=""):
    """
    Read content of a text file.
    
    Args:
        file_path (str): Path to file
        default (str): Default value to return if file doesn't exist or is invalid
        
    Returns:
        str: File content
    """
    try:
        if not os.path.exists(file_path):
            logger.warning(f"File not found: {file_path}")
            return default
            
        with open(file_path, 'r') as f:
            return f.read()
            
    except Exception as e:
        logger.error(f"Error reading file {file_path}: {str(e)}")
        return default

def write_file_content(file_path, content):
    """
    Write content to a text file.
    
    Args:
        file_path (str): Path to file
        content (str): Content to write
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w') as f:
            f.write(content)
            
        return True
        
    except Exception as e:
        logger.error(f"Error writing file {file_path}: {str(e)}")
        return False

def append_file_content(file_path, content):
    """
    Append content to a text file.
    
    Args:
        file_path (str): Path to file
        content (str): Content to append
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'a') as f:
            f.write(content)
            
        return True
        
    except Exception as e:
        logger.error(f"Error appending to file {file_path}: {str(e)}")
        return False

def delete_file(file_path):
    """
    Delete a file.
    
    Args:
        file_path (str): Path to file
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        if not os.path.exists(file_path):
            logger.warning(f"File not found: {file_path}")
            return False
            
        os.remove(file_path)
        return True
        
    except Exception as e:
        logger.error(f"Error deleting file {file_path}: {str(e)}")
        return False

def delete_directory(directory_path, recursive=False):
    """
    Delete a directory.
    
    Args:
        directory_path (str): Path to directory
        recursive (bool): Whether to delete recursively
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        if not os.path.exists(directory_path) or not os.path.isdir(directory_path):
            logger.warning(f"Directory not found: {directory_path}")
            return False
            
        if recursive:
            shutil.rmtree(directory_path)
        else:
            os.rmdir(directory_path)
            
        return True
        
    except Exception as e:
        logger.error(f"Error deleting directory {directory_path}: {str(e)}")
        return False
