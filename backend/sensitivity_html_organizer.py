import os
import shutil
from pathlib import Path
import re
import json
from datetime import datetime

# Import centralized logging
from sensitivity_logging import get_html_logger

# Get logger from centralized logging
logger = get_html_logger()

def organize_sensitivity_html(base_dir=None):
    """
    Organizes HTML files related to sensitivity analysis into standardized 
    album directories for easier frontend consumption.
    
    Args:
        base_dir: Optional base directory path. If not provided, uses default path.
        
    Returns:
        dict: Statistics about the organization process
    """
    # Determine base directory
    if not base_dir:
        # Use same path logic as in the main scripts
        backend_dir = Path(os.path.dirname(os.path.abspath(__file__)))
        base_dir = backend_dir.parent / 'public' / 'Original'
    
    if not os.path.exists(base_dir):
        logger.error(f"Base directory does not exist: {base_dir}")
        return {"error": f"Base directory does not exist: {base_dir}"}
    
    # Get all version directories
    logger.info(f"Scanning for version directories in {base_dir}")
    batches = [d for d in os.listdir(base_dir) if d.startswith("Batch(") and d.endswith(")")]
    
    if not batches:
        logger.warning("No batch directories found")
        return {"error": "No batch directories found"}
    
    # Track statistics
    stats = {
        "versions_processed": 0,
        "html_files_organized": 0,
        "albums_created": 0,
        "errors": []
    }
    
    for batch in batches:
        # Extract version number
        version_match = re.match(r"Batch\((\d+)\)", batch)
        if not version_match:
            logger.warning(f"Invalid batch directory format: {batch}")
            stats["errors"].append(f"Invalid batch directory format: {batch}")
            continue
            
        version = version_match.group(1)
        results_dir = os.path.join(base_dir, batch, f"Results({version})")
        
        if not os.path.exists(results_dir):
            logger.warning(f"Results directory not found: {results_dir}")
            stats["errors"].append(f"Results directory not found: {results_dir}")
            continue
        
        # Look for Sensitivity directory
        sensitivity_dir = os.path.join(results_dir, "Sensitivity")
        if not os.path.exists(sensitivity_dir):
            logger.info(f"No Sensitivity directory found for version {version}")
            continue
        
        # Create HTML albums directory
        html_albums_dir = os.path.join(results_dir, "SensitivityHTML")
        os.makedirs(html_albums_dir, exist_ok=True)
        
        # Process different analysis modes
        for mode in ["Symmetrical", "Multipoint"]:
            mode_dir = os.path.join(sensitivity_dir, mode)
            if not os.path.exists(mode_dir):
                continue
                
            # Process HTML files in this mode directory
            html_files = []
            for root, _, files in os.walk(mode_dir):
                for file in files:
                    if file.lower().endswith('.html'):
                        html_files.append((os.path.join(root, file), file))
            
            if not html_files:
                logger.info(f"No HTML files found in {mode_dir}")
                continue
            
            # Create a mode-specific album
            album_name = f"HTML_Sensitivity_{mode}"
            album_dir = os.path.join(html_albums_dir, album_name)
            os.makedirs(album_dir, exist_ok=True)
            stats["albums_created"] += 1
            
            # Copy HTML files to the album
            for file_path, file_name in html_files:
                # Extract parameter info from filename if possible
                param_match = re.match(r"(.+)_vs_(.+)_(.+)\.html", file_name)
                if param_match:
                    param_id = param_match.group(1)
                    compare_to = param_match.group(2)
                    plot_type = param_match.group(3)
                    
                    # Create a better name for the file
                    new_name = f"{param_id}_vs_{compare_to}_{plot_type}.html"
                else:
                    new_name = file_name
                
                dest_path = os.path.join(album_dir, new_name)
                if not os.path.exists(dest_path) or os.path.getmtime(file_path) > os.path.getmtime(dest_path):
                    shutil.copy2(file_path, dest_path)
                    logger.info(f"Copied {file_name} to album {album_name} as {new_name}")
                    stats["html_files_organized"] += 1
            
            # Create metadata file for the album
            metadata = {
                "version": version,
                "mode": mode,
                "files": [os.path.basename(f[0]) for f in html_files],
                "display_name": f"Sensitivity Analysis - {mode} - HTML Reports",
                "organized_at": datetime.now().isoformat()
            }
            
            with open(os.path.join(album_dir, "metadata.json"), 'w') as f:
                json.dump(metadata, f, indent=2)
        
        stats["versions_processed"] += 1
    
    # Log summary statistics
    logger.info(f"Sensitivity HTML organization complete: {stats['versions_processed']} versions, "
                f"{stats['albums_created']} albums, {stats['html_files_organized']} HTML files organized")
    return stats

if __name__ == "__main__":
    organize_sensitivity_html()