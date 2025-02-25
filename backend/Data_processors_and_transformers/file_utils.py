"""
Provides utility functions for managing batch versions and finding files across microservices.

find_versions(directory: str) -> List[str]:
    Extracts version numbers from batch folders in the given directory.

find_files(base_path: str, version: str, extension: str) -> List[Dict]:
    Scans the version directory for files with the specified extension across albums.
"""
"""Core utilities for batch version management and file operations across microservices"""
import os
import logging
from typing import List, Dict

def find_versions(directory: str) -> List[str]:
    # Extracts version numbers from batch folders (format: "Batch(version)")
    return [name.split("(")[1].split(")")[0] for name in os.listdir(directory)
            if name.startswith("Batch(") and name.endswith(")")] if os.path.exists(directory) else []

def find_files(base_path: str, version: str, extension: str) -> List[Dict]:
    # Scans version directory for specified file types across albums
    version_path = f"{base_path}/Batch({version})/Results({version})/"
    files = []
    
    if not os.path.exists(version_path):
        logging.warning(f"Version path not found: {version_path}")
        return files
        
    for album in [d for d in os.listdir(version_path) if os.path.isdir(os.path.join(version_path, d))]:
        album_path = os.path.join(version_path, album)
        if not os.path.exists(album_path): continue
            
        for file in [f for f in os.listdir(album_path) if f.lower().endswith(extension)]:
            files.append({"name": file, "path": os.path.join(album_path, file), "album": album})
            logging.info(f"Found {extension} file: {file} in {album}")
            
    return files