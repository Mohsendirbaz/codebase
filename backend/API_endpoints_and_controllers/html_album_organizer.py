# html_album_organizer.py
import os
import shutil
import logging
from pathlib import Path
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

def organize_html_albums(base_dir=None):
    """
    Organizes HTML plot files into standardized album directories that are compatible
    with the Front_Subtab_HTML.py server.
    """
    # Determine base directory
    if not base_dir:
        # Use same path logic as in the main scripts
        backend_dir = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        base_dir = backend_dir.parent / 'public' / 'Original'
    
    if not os.path.exists(base_dir):
        logger.error(f"Base directory does not exist: {base_dir}")
        return False
    
    # Get all version directories
    logger.info(f"Scanning for version directories in {base_dir}")
    batches = [d for d in os.listdir(base_dir) if d.startswith("Batch(") and d.endswith(")")]
    
    if not batches:
        logger.warning("No batch directories found")
        return False
    
    for batch in batches:
        # Extract version number
        version_match = re.match(r"Batch\((\d+)\)", batch)
        if not version_match:
            logger.warning(f"Invalid batch directory format: {batch}")
            continue
            
        version = version_match.group(1)
        results_dir = os.path.join(base_dir, batch, f"Results({version})")
        
        if not os.path.exists(results_dir):
            logger.warning(f"Results directory not found: {results_dir}")
            continue
        
        # Find HTML plot directories (v*_*_Plot)
        plot_dirs = [d for d in os.listdir(results_dir) 
                     if os.path.isdir(os.path.join(results_dir, d)) and 
                     (d.startswith("v") and "_Plot" in d)]
        
        if not plot_dirs:
            logger.info(f"No HTML plot directories found for version {version}")
            continue
        
        # Process each plot directory
        for plot_dir_name in plot_dirs:
            plot_dir = os.path.join(results_dir, plot_dir_name)
            
            # Extract the metric name and versions identifier from directory name
            dir_match = re.match(r"v(\d+_\d+)_(.+)_Plot", plot_dir_name)
            if not dir_match:
                dir_match = re.match(r"v(\d+_\d+)_(.+)", plot_dir_name)
                if not dir_match:
                    logger.warning(f"Invalid plot directory format: {plot_dir_name}")
                    continue
                    
            versions_id = dir_match.group(1)
            plot_type = dir_match.group(2)
            
            # Find HTML files in the directory
            html_files = [f for f in os.listdir(plot_dir) if f.lower().endswith('.html')]
            
            if not html_files:
                logger.info(f"No HTML files found in {plot_dir}")
                continue
            
            # Create standardized album name:
            # Format: HTML_v{versions_id}_{plot_type}
            album_name = f"HTML_v{versions_id}_{plot_type}"
            album_dir = os.path.join(results_dir, album_name)
            
            # Create album directory
            os.makedirs(album_dir, exist_ok=True)
            logger.info(f"Created HTML album directory: {album_dir}")
            
            # Copy files to album
            for html_file in html_files:
                src_path = os.path.join(plot_dir, html_file)
                dest_path = os.path.join(album_dir, html_file)
                
                # Only copy if file doesn't exist or is different
                if not os.path.exists(dest_path) or os.path.getsize(src_path) != os.path.getsize(dest_path):
                    shutil.copy2(src_path, dest_path)
                    logger.info(f"Copied {html_file} to album {album_name}")
                else:
                    logger.info(f"File {html_file} already exists in album {album_name}, skipping")
            
            # Create a metadata file to help with frontend rendering
            metadata_path = os.path.join(album_dir, "album_metadata.json")
            with open(metadata_path, 'w') as f:
                import json
                metadata = {
                    "versions": versions_id.split('_'),
                    "plot_type": plot_type,
                    "display_name": f"{plot_type.replace('_', ' ')} for versions [{versions_id.replace('_', ', ')}]",
                    "html_files": html_files
                }
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Created metadata file for album {album_name}")
    
    logger.info("HTML album organization completed successfully")
    return True

if __name__ == "__main__":
    organize_html_albums()