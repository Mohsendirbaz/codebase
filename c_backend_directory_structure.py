import json
import os
from datetime import datetime

def analyze_backend_directory(backend_path, output_path):
    """
    Creates a JSON file representing the directory structure of the backend,
    excluding the Original folder.
    """
    directory_structure = {
        "project_name": "Backend Structure",
        "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "version": 1,
        "directories": {}
    }

    # Walk through the directory
    for root, dirs, files in os.walk(backend_path):
        # Skip the Original folder and its contents
        if "Original" in root:
            continue
            
        # Get relative path from backend directory
        rel_path = os.path.relpath(root, backend_path)
        if rel_path == ".":
            continue
            
        # Add directory to structure
        directory_structure["directories"][rel_path] = {
            "files": [os.path.join(rel_path, f) for f in files],
            "import_count": len(files)  # Simple count of files as import count
        }

    # Write the output JSON file
    with open(output_path, 'w') as f:
        json.dump(directory_structure, f, indent=2)

def main():
    # Use relative paths
    backend_path = os.path.join(os.path.dirname(__file__), "backend")
    output_path = os.path.join(backend_path, "c_backend_directory_structure.json")
    
    try:
        analyze_backend_directory(backend_path, output_path)
        print(f"Directory structure analysis complete. Output saved to {output_path}")
    except Exception as e:
        print(f"Error during analysis: {str(e)}")

if __name__ == "__main__":
    main()
