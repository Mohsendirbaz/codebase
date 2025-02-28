# album_organizer.py
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

def organize_plot_albums(base_dir=None):
    """
    Organizes PNG plots into standardized album directories that are compatible
    with the Front_Subtab_Plot.py server.
    """
    # Determine base directory
    if not base_dir:
        # Same path logic as in the main scripts
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
        
        # Look for AnnotatedStaticPlots directories
        plot_dirs = [d for d in os.listdir(results_dir) 
                     if os.path.isdir(os.path.join(results_dir, d)) and 
                     "_AnnotatedStaticPlots" in d]
        
        if not plot_dirs:
            logger.info(f"No plot directories found for version {version}")
            continue
        
        # Process each plot directory
        for plot_dir_name in plot_dirs:
            plot_dir = os.path.join(results_dir, plot_dir_name)
            
            # Extract the versions identifier from the directory name
            versions_id_match = re.match(r"(.+)_AnnotatedStaticPlots", plot_dir_name)
            if not versions_id_match:
                logger.warning(f"Invalid plot directory format: {plot_dir_name}")
                continue
                
            versions_id = versions_id_match.group(1)
            
            # Create standardized album categories based on plot types
            png_files = [f for f in os.listdir(plot_dir) if f.lower().endswith('.png')]
            
            # Group files by type
            file_groups = {}
            for png_file in png_files:
                # Extract plot type from filename
                plot_type_match = re.match(r"aggregated_(.+)_" + re.escape(versions_id) + r"\.png", png_file)
                if not plot_type_match:
                    logger.warning(f"Cannot extract plot type from filename: {png_file}")
                    continue
                    
                plot_type = plot_type_match.group(1)
                if plot_type not in file_groups:
                    file_groups[plot_type] = []
                file_groups[plot_type].append(png_file)
            
            # Create category albums
            for plot_type, files in file_groups.items():
                # Create standardized album name:
                # Format: versions_id_PlotType
                album_name = f"{versions_id}_PlotType_{plot_type}"
                album_dir = os.path.join(results_dir, album_name)
                
                # Create album directory
                os.makedirs(album_dir, exist_ok=True)
                logger.info(f"Created album directory: {album_dir}")
                
                # Copy files to album
                for png_file in files:
                    src_path = os.path.join(plot_dir, png_file)
                    dest_path = os.path.join(album_dir, png_file)
                    shutil.copy2(src_path, dest_path)
                    logger.info(f"Copied {png_file} to album {album_name}")
    
    logger.info("Album organization completed successfully")
    return True

if __name__ == "__main__":
    organize_plot_albums()