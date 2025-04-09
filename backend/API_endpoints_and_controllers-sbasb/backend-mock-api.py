"""
Flask API for serving plot data and images.
This API provides endpoints for accessing plot metadata and image files.
"""

from flask import Flask, jsonify, send_file, request
import os
import json
from flask_cors import CORS
import logging
import re

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Base directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ORIGINAL_DIR = os.path.join(BASE_DIR, 'backend', 'Original')

@app.route('/api/plots/<version>', methods=['GET'])
def get_plots(version):
    """
    Get all plots for a specific version.
    
    Args:
        version (str): The version number
        
    Returns:
        list: A list of plot objects with metadata
    """
    try:
        logger.info(f"Fetching plots for version {version}")
        
        # Define the results directory for this version
        results_dir = os.path.join(ORIGINAL_DIR, f'Batch({version})', f'Results({version})')
        
        if not os.path.exists(results_dir):
            logger.warning(f"Results directory not found: {results_dir}")
            return jsonify([])
            
        # Find all plot directories (excluding Sensitivity for regular plots)
        plot_dirs = []
        for root, dirs, files in os.walk(results_dir):
            # Skip Sensitivity directory for regular plots
            if 'Sensitivity' in root:
                continue
                
            # Look for PNG files
            for file in files:
                if file.endswith('.png'):
                    plot_dirs.append(os.path.relpath(os.path.join(root, file), results_dir))
        
        # Parse plot directories into structured data
        plots = []
        for plot_path in plot_dirs:
            # Extract category and group from path
            path_parts = plot_path.split(os.path.sep)
            
            # Default category and group if path structure is simple
            if len(path_parts) <= 1:
                category = "General"
                group = "Default"
            else:
                # Use parent folder as group and grandparent as category if available
                group = path_parts[-2] if len(path_parts) > 1 else "Default"
                category = path_parts[-3] if len(path_parts) > 2 else "Main"
            
            # Clean up names
            category = category.replace('_', ' ').title()
            group = group.replace('_', ' ').title()
            
            # Extract plot title from filename
            filename = os.path.basename(plot_path)
            title = os.path.splitext(filename)[0].replace('_', ' ').title()
            
            # Create full path for the image
            full_path = os.path.join(results_dir, plot_path)
            
            plots.append({
                'path': full_path,
                'category': category,
                'group': group,
                'title': title,
                'filename': filename
            })
        
        logger.info(f"Found {len(plots)} plots for version {version}")
        return jsonify(plots)
        
    except Exception as e:
        logger.exception(f"Error fetching plots: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/plots/<version>/<category>/<group>', methods=['GET'])
def get_plots_by_group(version, category, group):
    """
    Get plots for a specific version, category and group.
    
    Args:
        version (str): The version number
        category (str): The plot category
        group (str): The plot group
        
    Returns:
        list: A list of plot objects with metadata
    """
    try:
        logger.info(f"Fetching plots for version {version}, category {category}, group {group}")
        
        # Get all plots first
        all_plots = json.loads(get_plots(version).data)
        
        # Clean up category and group names for comparison
        clean_category = category.replace('-', ' ').lower()
        clean_group = group.replace('-', ' ').lower()
        
        # Filter plots by category and group
        filtered_plots = [
            plot for plot in all_plots 
            if plot['category'].lower() == clean_category 
            and plot['group'].lower() == clean_group
        ]
        
        logger.info(f"Found {len(filtered_plots)} plots matching criteria")
        return jsonify(filtered_plots)
        
    except Exception as e:
        logger.exception(f"Error fetching plots by group: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/sensitivity-plots/<version>', methods=['GET'])
def get_sensitivity_plots(version):
    """
    Get all sensitivity plots for a specific version.
    
    Args:
        version (str): The version number
        
    Returns:
        list: A list of sensitivity plot objects with metadata
    """
    try:
        logger.info(f"Fetching sensitivity plots for version {version}")
        
        # Define the sensitivity directory for this version
        results_dir = os.path.join(ORIGINAL_DIR, f'Batch({version})', f'Results({version})')
        sensitivity_dir = os.path.join(results_dir, 'Sensitivity')
        
        if not os.path.exists(sensitivity_dir):
            logger.warning(f"Sensitivity directory not found: {sensitivity_dir}")
            return jsonify([])
            
        # Find all plot files in the sensitivity directory
        plot_files = []
        for root, _, files in os.walk(sensitivity_dir):
            for file in files:
                if file.endswith('.png'):
                    plot_files.append(os.path.join(root, file))
        
        # Parse plot files into structured data
        plots = []
        for plot_path in plot_files:
            # Determine if plot is from Symmetrical or Multipoint mode
            if 'Symmetrical' in plot_path:
                mode = 'Symmetrical'
            elif 'Multipoint' in plot_path:
                mode = 'Multipoint'
            else:
                mode = 'Other'
                
            # Extract plot type
            plot_type_match = re.search(r'/(waterfall|bar|point)/', plot_path)
            plot_type = plot_type_match.group(1).title() if plot_type_match else 'Unknown'
            
            # Extract parameter ID
            param_match = re.search(r'[/_](S\d+)[/_]', plot_path)
            parameter = param_match.group(1) if param_match else 'Unknown'
            
            # Extract comparison parameter
            compare_match = re.search(r'[/_](S\d+)_(S\d+)[/_]', plot_path)
            comparison = compare_match.group(2) if compare_match else None
            
            # Determine category and group
            category = f"{parameter} Analysis"
            group = f"{plot_type} Plots"
            
            # Extract plot title from filename
            filename = os.path.basename(plot_path)
            title_parts = os.path.splitext(filename)[0].split('_')
            
            # Create a readable title
            if len(title_parts) >= 3:
                title = f"{title_parts[0].title()} Plot: {parameter}"
                if comparison:
                    title += f" vs {comparison}"
            else:
                title = filename.replace('_', ' ').title()
            
            # Extract description based on filename parts
            description = None
            if plot_type == 'Waterfall':
                description = f"Waterfall plot showing impact of {parameter} variations"
            elif plot_type == 'Bar':
                description = f"Bar chart comparing {parameter} sensitivity across scenarios"
            elif plot_type == 'Point':
                description = f"Point plot showing relationship between {parameter} and outcomes"
            
            plots.append({
                'path': plot_path,
                'category': category,
                'group': group,
                'title': title,
                'parameter': parameter,
                'comparison': comparison,
                'plotType': plot_type,
                'mode': mode,
                'description': description,
                'filename': filename
            })
        
        logger.info(f"Found {len(plots)} sensitivity plots for version {version}")
        return jsonify(plots)
        
    except Exception as e:
        logger.exception(f"Error fetching sensitivity plots: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/sensitivity-plots/<version>/<parameter>', methods=['GET'])
def get_sensitivity_plots_by_parameter(version, parameter):
    """
    Get sensitivity plots for a specific parameter.
    
    Args:
        version (str): The version number
        parameter (str): The parameter ID (e.g., S10)
        
    Returns:
        list: A list of sensitivity plot objects for the parameter
    """
    try:
        logger.info(f"Fetching sensitivity plots for version {version}, parameter {parameter}")
        
        # Get all sensitivity plots
        all_plots = json.loads(get_sensitivity_plots(version).data)
        
        # Filter by parameter
        parameter_plots = [plot for plot in all_plots if plot['parameter'] == parameter]
        
        logger.info(f"Found {len(parameter_plots)} plots for parameter {parameter}")
        return jsonify(parameter_plots)
        
    except Exception as e:
        logger.exception(f"Error fetching parameter plots: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/sensitivity-plots/<version>/<parameter>/<plot_type>', methods=['GET'])
def get_sensitivity_plots_by_type(version, parameter, plot_type):
    """
    Get sensitivity plots for a specific parameter and plot type.
    
    Args:
        version (str): The version number
        parameter (str): The parameter ID (e.g., S10)
        plot_type (str): The plot type (waterfall, bar, point)
        
    Returns:
        list: A list of sensitivity plot objects for the parameter and type
    """
    try:
        logger.info(f"Fetching {plot_type} plots for version {version}, parameter {parameter}")
        
        # Get plots for the parameter
        parameter_plots = json.loads(get_sensitivity_plots_by_parameter(version, parameter).data)
        
        # Normalize plot type for comparison
        normalized_type = plot_type.lower()
        
        # Filter by plot type
        type_plots = [
            plot for plot in parameter_plots 
            if plot['plotType'].lower() == normalized_type
        ]
        
        logger.info(f"Found {len(type_plots)} {plot_type} plots for parameter {parameter}")
        return jsonify(type_plots)
        
    except Exception as e:
        logger.exception(f"Error fetching plot type: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/images/<path:image_path>', methods=['GET'])
def get_image(image_path):
    """
    Serve an image file.
    
    Args:
        image_path (str): The path to the image relative to the base directory
        
    Returns:
        Response: The image file
    """
    try:
        # Construct the full path to the image
        full_path = os.path.join(ORIGINAL_DIR, image_path)
        
        if not os.path.exists(full_path):
            logger.warning(f"Image not found: {full_path}")
            return jsonify({"error": "Image not found"}), 404
            
        return send_file(full_path, mimetype='image/png')
        
    except Exception as e:
        logger.exception(f"Error serving image: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5008)
