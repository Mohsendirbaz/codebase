import os
import shutil
from pathlib import Path
import re
import json
from datetime import datetime

# Import centralized logging
from sensitivity_logging import get_plots_logger

# Get logger from centralized logging
logger = get_plots_logger()

def organize_sensitivity_plots(base_dir=None):
    """
    Organizes plot files related to sensitivity analysis into standardized 
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
        "plots_organized": 0,
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
        
        # Create plot albums directory
        plot_albums_dir = os.path.join(results_dir, "SensitivityPlots")
        os.makedirs(plot_albums_dir, exist_ok=True)
        
        # Process different analysis modes
        for mode in ["Symmetrical", "Multipoint"]:
            mode_dir = os.path.join(sensitivity_dir, mode)
            if not os.path.exists(mode_dir):
                continue
            
            # Process different plot types
            for plot_type in ["waterfall", "bar", "point"]:
                plot_type_dir = os.path.join(mode_dir, plot_type)
                
                # If the specific subdirectory doesn't exist, look for plots directly in the mode directory
                if not os.path.exists(plot_type_dir):
                    plot_type_dir = mode_dir
                
                # Find all PNG files of this plot type
                png_files = []
                for root, _, files in os.walk(plot_type_dir):
                    for file in files:
                        if file.lower().endswith('.png') and plot_type in file.lower():
                            png_files.append((os.path.join(root, file), file))
                
                if not png_files:
                    continue
                
                # Create album for this plot type
                album_name = f"Sensitivity_{mode}_{plot_type}"
                album_dir = os.path.join(plot_albums_dir, album_name)
                os.makedirs(album_dir, exist_ok=True)
                stats["albums_created"] += 1
                
                # Process each plot file
                for file_path, file_name in png_files:
                    # Extract parameter info from filename
                    param_match = re.match(r"(.+)_([^_]+)_([^_]+)_(.+)\.png", file_name)
                    if param_match:
                        # Extracted components (may vary depending on naming convention)
                        # In this case: plot_type_paramID_compareToKey_comparisonType.png
                        extracted_plot_type = param_match.group(1)
                        param_id = param_match.group(2)
                        compare_to = param_match.group(3)
                        comparison_type = param_match.group(4)
                        
                        # Create a standardized name
                        new_name = f"{param_id}_vs_{compare_to}_{comparison_type}.png"
                    else:
                        # If pattern doesn't match, keep original name
                        new_name = file_name
                    
                    # Copy the file to the album directory
                    dest_path = os.path.join(album_dir, new_name)
                    if not os.path.exists(dest_path) or os.path.getmtime(file_path) > os.path.getmtime(dest_path):
                        shutil.copy2(file_path, dest_path)
                        logger.info(f"Copied {file_name} to album {album_name} as {new_name}")
                        stats["plots_organized"] += 1
                
                # Create metadata file for the album
                metadata = {
                    "version": version,
                    "mode": mode,
                    "plot_type": plot_type,
                    "files": [os.path.basename(f[0]) for f in png_files],
                    "display_name": f"Sensitivity Analysis - {mode} - {plot_type.capitalize()} Plots",
                    "organized_at": datetime.now().isoformat()
                }
                
                with open(os.path.join(album_dir, "metadata.json"), 'w') as f:
                    json.dump(metadata, f, indent=2)
        
        stats["versions_processed"] += 1
    
    # Log summary statistics
    logger.info(f"Sensitivity plot organization complete: {stats['versions_processed']} versions, "
                f"{stats['albums_created']} albums, {stats['plots_organized']} plots organized")
    return stats

if __name__ == "__main__":
    organize_sensitivity_plots()