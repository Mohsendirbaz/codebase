from flask import Blueprint, request, jsonify, send_file, Response
import os
import json
import time
from datetime import datetime
from pathlib import Path

# Import our custom modules
from sensitivity_integration import sensitivity_integration
from sensitivity_analysis_manager import sensitivity_manager
from sensitivity_logging import get_api_logger

# Get logger from centralized logging
logger = get_api_logger()

updated_sensitivity_routes = Blueprint('updated_sensitivity_routes', __name__)

@updated_sensitivity_routes.route('/sensitivity/run', methods=['POST'])
def run_sensitivity_analysis():
    """
    Standalone endpoint to run sensitivity analysis for a specific version.
    This is useful for running sensitivity analysis separately from the main calculation.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        version = data.get('version')
        if not version:
            return jsonify({"error": "No version specified"}), 400
            
        sensitivity_params = data.get('senParameters', {})
        
        # Run the analysis
        start_time = time.time()
        results = sensitivity_integration.process_sensitivity_request(
            version, sensitivity_params
        )
        
        # Add timing information
        processing_time = time.time() - start_time
        results["processing_time"] = f"{processing_time:.2f}s"
        
        return jsonify(results)
        
    except Exception as e:
        logger.error(f"Error running sensitivity analysis: {str(e)}")
        return jsonify({"error": str(e)}), 500

@updated_sensitivity_routes.route('/sensitivity/symmetrical', methods=['POST'])
def handle_symmetrical_analysis():
    """
    Enhanced endpoint for symmetrical sensitivity analysis.
    Uses the sensitivity manager for improved processing.
    """
    try:
        data = request.json
        param_id = data.get('param_id')
        if not param_id or not param_id.startswith('S') or not param_id[1:].isdigit():
            return jsonify({"error": "Invalid parameter ID format"}), 400

        variation = data.get('values', [None])[0]
        if variation is None:
            return jsonify({"error": "No variation percentage provided"}), 400

        compare_to_key = data.get('compareToKey')
        if not compare_to_key:
            return jsonify({"error": "No comparison parameter provided"}), 400

        version = data["version"]
        comparison_type = data.get('comparisonType', 'primary')
        
        # Ensure sensitivity directories exist before any processing
        try:
            logger.info(f"Ensuring sensitivity directories exist for version {version}")
            created_dirs = sensitivity_manager.ensure_sensitivity_directories(version)
            logger.info(f"Created/verified sensitivity directories: {list(created_dirs.keys())}")
        except Exception as e:
            error_msg = f"Error creating sensitivity directories: {str(e)}"
            logger.error(error_msg)
            return jsonify({"error": error_msg}), 500
        
        # Generate configurations using the manager
        configs = sensitivity_manager.generate_sensitivity_configs(
            version, param_id, 'symmetrical', [variation]
        )
        
        # Process requested plot types
        plot_types = []
        if data.get('waterfall'): plot_types.append('waterfall')
        if data.get('bar'): plot_types.append('bar')
        if data.get('point'): plot_types.append('point')
        
        # Create dummy result data for demonstration
        result_data = {
            "param_id": param_id,
            "variation": variation,
            "npv": 1000000 * (1 + variation/100),  # Dummy calculation
            "irr": 0.15 * (1 + variation/200),     # Dummy calculation
        }
        
        # Store the result
        result_path = sensitivity_manager.store_calculation_result(
            version, param_id, compare_to_key, result_data, 'symmetrical'
        )
        
        # Generate plots (in a real implementation, this would call actual plotting functions)
        plot_paths = []
        for plot_type in plot_types:
            plot_path = sensitivity_manager.generate_plot(
                version, param_id, compare_to_key, 'symmetrical', 
                plot_type, comparison_type, result_path
            )
            plot_paths.append(str(plot_path))
        
        return jsonify({
            "status": "success",
            "message": "Symmetrical analysis processed",
            "configs": configs,
            "result_path": str(result_path),
            "plot_paths": plot_paths
        })

    except Exception as e:
        logger.error(f"Error in symmetrical analysis: {str(e)}")
        return jsonify({"error": str(e)}), 500

@updated_sensitivity_routes.route('/sensitivity/multipoint', methods=['POST'])
def handle_multipoint_analysis():
    """
    Enhanced endpoint for multipoint sensitivity analysis.
    Uses the sensitivity manager for improved processing.
    """
    try:
        data = request.json
        param_id = data.get('param_id')
        if not param_id or not param_id.startswith('S') or not param_id[1:].isdigit():
            return jsonify({"error": "Invalid parameter ID format"}), 400

        variations = data.get('values', [])
        if not variations:
            return jsonify({"error": "No variation points provided"}), 400

        compare_to_key = data.get('compareToKey')
        if not compare_to_key:
            return jsonify({"error": "No comparison parameter provided"}), 400

        version = data["version"]
        comparison_type = data.get('comparisonType', 'primary')
        
        # Ensure sensitivity directories exist before any processing
        try:
            logger.info(f"Ensuring sensitivity directories exist for version {version}")
            created_dirs = sensitivity_manager.ensure_sensitivity_directories(version)
            logger.info(f"Created/verified sensitivity directories: {list(created_dirs.keys())}")
        except Exception as e:
            error_msg = f"Error creating sensitivity directories: {str(e)}"
            logger.error(error_msg)
            return jsonify({"error": error_msg}), 500
        
        # Generate configurations using the manager
        configs = sensitivity_manager.generate_sensitivity_configs(
            version, param_id, 'multipoint', variations
        )
        
        # Process requested plot types
        plot_types = []
        if data.get('waterfall'): plot_types.append('waterfall')
        if data.get('bar'): plot_types.append('bar')
        if data.get('point'): plot_types.append('point')
        
        # Create dummy result data for demonstration
        result_data = {
            "param_id": param_id,
            "variations": variations,
            "results": [
                {
                    "variation": var,
                    "npv": 1000000 * (1 + var/100),  # Dummy calculation
                    "irr": 0.15 * (1 + var/200),     # Dummy calculation
                }
                for var in variations
            ]
        }
        
        # Store the result
        result_path = sensitivity_manager.store_calculation_result(
            version, param_id, compare_to_key, result_data, 'multipoint'
        )
        
        # Generate plots (in a real implementation, this would call actual plotting functions)
        plot_paths = []
        for plot_type in plot_types:
            plot_path = sensitivity_manager.generate_plot(
                version, param_id, compare_to_key, 'multipoint', 
                plot_type, comparison_type, result_path
            )
            plot_paths.append(str(plot_path))
        
        return jsonify({
            "status": "success",
            "message": "Multipoint analysis processed",
            "configs": configs,
            "result_path": str(result_path),
            "plot_paths": plot_paths
        })

    except Exception as e:
        logger.error(f"Error in multipoint analysis: {str(e)}")
        return jsonify({"error": str(e)}), 500

@updated_sensitivity_routes.route('/sensitivity/albums/<version>', methods=['GET'])
def get_sensitivity_albums(version):
    """
    Get all available sensitivity analysis albums for a version.
    This consolidates both plot and HTML albums in one response.
    """
    try:
        version_int = int(version)
        
        # Ensure sensitivity directories exist before any processing
        try:
            logger.info(f"Ensuring sensitivity directories exist for version {version_int}")
            created_dirs = sensitivity_manager.ensure_sensitivity_directories(version_int)
            logger.info(f"Created/verified sensitivity directories: {list(created_dirs.keys())}")
        except Exception as e:
            error_msg = f"Error creating sensitivity directories: {str(e)}"
            logger.error(error_msg)
            return jsonify({"error": error_msg}), 500
        
        # Paths to the album directories
        base_dir = sensitivity_integration.original_dir
        results_dir = base_dir / f"Batch({version})" / f"Results({version})"
        plot_albums_dir = results_dir / "SensitivityPlots"
        html_albums_dir = results_dir / "SensitivityHTML"
        
        albums = {
            "version": version,
            "timestamp": datetime.now().isoformat(),
            "plot_albums": [],
            "html_albums": []
        }
        
        # Get plot albums
        if os.path.exists(plot_albums_dir):
            for album_name in os.listdir(plot_albums_dir):
                album_dir = plot_albums_dir / album_name
                if os.path.isdir(album_dir):
                    # Look for metadata file
                    metadata_file = album_dir / "metadata.json"
                    if os.path.exists(metadata_file):
                        with open(metadata_file, 'r') as f:
                            metadata = json.load(f)
                    else:
                        # Create basic metadata if file doesn't exist
                        metadata = {
                            "display_name": album_name.replace("_", " "),
                            "files": [f for f in os.listdir(album_dir) if f.lower().endswith('.png')]
                        }
                    
                    # Add album information
                    albums["plot_albums"].append({
                        "name": album_name,
                        "path": str(album_dir.relative_to(base_dir)),
                        "metadata": metadata,
                        "file_count": len(metadata.get("files", []))
                    })
        
        # Get HTML albums
        if os.path.exists(html_albums_dir):
            for album_name in os.listdir(html_albums_dir):
                album_dir = html_albums_dir / album_name
                if os.path.isdir(album_dir):
                    # Look for metadata file
                    metadata_file = album_dir / "metadata.json"
                    if os.path.exists(metadata_file):
                        with open(metadata_file, 'r') as f:
                            metadata = json.load(f)
                    else:
                        # Create basic metadata if file doesn't exist
                        metadata = {
                            "display_name": album_name.replace("_", " "),
                            "files": [f for f in os.listdir(album_dir) if f.lower().endswith('.html')]
                        }
                    
                    # Add album information
                    albums["html_albums"].append({
                        "name": album_name,
                        "path": str(album_dir.relative_to(base_dir)),
                        "metadata": metadata,
                        "file_count": len(metadata.get("files", []))
                    })
        
        return jsonify(albums)
        
    except Exception as e:
        logger.error(f"Error retrieving sensitivity albums: {str(e)}")
        return jsonify({"error": str(e)}), 500

@updated_sensitivity_routes.route('/sensitivity/plots/<version>/<album_name>', methods=['GET'])
def get_sensitivity_plots(version, album_name):
    """
    Get all plots in a specific sensitivity album.
    """
    try:
        version_int = int(version)
        
        # Ensure sensitivity directories exist before any processing
        try:
            logger.info(f"Ensuring sensitivity directories exist for version {version_int}")
            created_dirs = sensitivity_manager.ensure_sensitivity_directories(version_int)
            logger.info(f"Created/verified sensitivity directories: {list(created_dirs.keys())}")
        except Exception as e:
            error_msg = f"Error creating sensitivity directories: {str(e)}"
            logger.error(error_msg)
            return jsonify({"error": error_msg}), 500
        
        base_dir = sensitivity_integration.original_dir
        album_dir = base_dir / f"Batch({version})" / f"Results({version})" / "SensitivityPlots" / album_name
        
        if not os.path.exists(album_dir):
            return jsonify({"error": f"Album {album_name} not found"}), 404
        
        # Get metadata
        metadata_file = album_dir / "metadata.json"
        if os.path.exists(metadata_file):
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
        else:
            metadata = {
                "display_name": album_name.replace("_", " ")
            }
        
        # Get plots
        plots = []
        for file_name in os.listdir(album_dir):
            if file_name.lower().endswith('.png'):
                file_path = album_dir / file_name
                
                # Extract parameter info if possible
                param_match = None
                if "_vs_" in file_name:
                    parts = file_name.split("_vs_")
                    if len(parts) == 2:
                        param_id = parts[0]
                        remaining = parts[1].split("_")
                        if len(remaining) >= 1:
                            compare_to = remaining[0].split(".")[0]  # Remove extension
                            param_match = {
                                "param_id": param_id,
                                "compare_to": compare_to
                            }
                
                # Add plot information
                plots.append({
                    "name": file_name,
                    "path": str(file_path.relative_to(base_dir)),
                    "url": f"/images/Original/{file_path.relative_to(base_dir)}",
                    "size": os.path.getsize(file_path),
                    "param_info": param_match
                })
        
        response = {
            "version": version,
            "album": album_name,
            "metadata": metadata,
            "plots": plots
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error retrieving sensitivity plots: {str(e)}")
        return jsonify({"error": str(e)}), 500

@updated_sensitivity_routes.route('/sensitivity/html/<version>/<album_name>', methods=['GET'])
def get_sensitivity_html(version, album_name):
    """
    Get all HTML files in a specific sensitivity album.
    """
    try:
        version_int = int(version)
        
        # Ensure sensitivity directories exist before any processing
        try:
            logger.info(f"Ensuring sensitivity directories exist for version {version_int}")
            created_dirs = sensitivity_manager.ensure_sensitivity_directories(version_int)
            logger.info(f"Created/verified sensitivity directories: {list(created_dirs.keys())}")
        except Exception as e:
            error_msg = f"Error creating sensitivity directories: {str(e)}"
            logger.error(error_msg)
            return jsonify({"error": error_msg}), 500
        
        base_dir = sensitivity_integration.original_dir
        album_dir = base_dir / f"Batch({version})" / f"Results({version})" / "SensitivityHTML" / album_name
        
        if not os.path.exists(album_dir):
            return jsonify({"error": f"Album {album_name} not found"}), 404
        
        # Get metadata
        metadata_file = album_dir / "metadata.json"
        if os.path.exists(metadata_file):
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
        else:
            metadata = {
                "display_name": album_name.replace("_", " ")
            }
        
        # Get HTML files
        html_files = []
        for file_name in os.listdir(album_dir):
            if file_name.lower().endswith('.html'):
                file_path = album_dir / file_name
                
                try:
                    # Read the content
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Extract parameter info if possible
                    param_match = None
                    if "_vs_" in file_name:
                        parts = file_name.split("_vs_")
                        if len(parts) == 2:
                            param_id = parts[0]
                            remaining = parts[1].split("_")
                            if len(remaining) >= 1:
                                compare_to = remaining[0].split(".")[0]  # Remove extension
                                param_match = {
                                    "param_id": param_id,
                                    "compare_to": compare_to
                                }
                    
                    # Add file information
                    html_files.append({
                        "name": file_name,
                        "path": str(file_path.relative_to(base_dir)),
                        "url": f"/Original/{file_path.relative_to(base_dir)}",
                        "content": content,  # Include the content directly
                        "size": os.path.getsize(file_path),
                        "param_info": param_match
                    })
                except Exception as e:
                    logger.error(f"Error reading HTML file {file_path}: {str(e)}")
        
        response = {
            "version": version,
            "album": album_name,
            "metadata": metadata,
            "html_files": html_files
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error retrieving sensitivity HTML: {str(e)}")
        return jsonify({"error": str(e)}), 500

@updated_sensitivity_routes.route('/sensitivity/results/<version>', methods=['GET'])
def get_sensitivity_results(version):
    """
    Get consolidated results of all sensitivity analyses for a version.
    """
    try:
        version_int = int(version)
        
        # Ensure sensitivity directories exist before any processing
        try:
            logger.info(f"Ensuring sensitivity directories exist for version {version_int}")
            created_dirs = sensitivity_manager.ensure_sensitivity_directories(version_int)
            logger.info(f"Created/verified sensitivity directories: {list(created_dirs.keys())}")
        except Exception as e:
            error_msg = f"Error creating sensitivity directories: {str(e)}"
            logger.error(error_msg)
            return jsonify({"error": error_msg}), 500
        
        # Use the manager to organize results
        organized_results = sensitivity_manager.organize_sensitivity_results(version_int)
        return jsonify(organized_results)
        
    except Exception as e:
        logger.error(f"Error retrieving sensitivity results: {str(e)}")
        return jsonify({"error": str(e)}), 500

@updated_sensitivity_routes.route('/sensitivity/plot/<version>/<path:plot_path>', methods=['GET'])
def serve_sensitivity_plot(version, plot_path):
    """
    Serve a specific sensitivity plot file.
    """
    try:
        version_int = int(version)
        
        # Ensure sensitivity directories exist before any processing
        try:
            logger.info(f"Ensuring sensitivity directories exist for version {version_int}")
            created_dirs = sensitivity_manager.ensure_sensitivity_directories(version_int)
            logger.info(f"Created/verified sensitivity directories: {list(created_dirs.keys())}")
        except Exception as e:
            error_msg = f"Error creating sensitivity directories: {str(e)}"
            logger.error(error_msg)
            return jsonify({"error": error_msg}), 500
        
        base_dir = sensitivity_integration.original_dir
        full_path = base_dir / plot_path
        
        if not os.path.exists(full_path):
            return jsonify({"error": "Plot file not found"}), 404
            
        return send_file(str(full_path), mimetype='image/png')
        
    except Exception as e:
        logger.error(f"Error serving plot file: {str(e)}")
        return jsonify({"error": str(e)}), 500

@updated_sensitivity_routes.route('/sensitivity/visualization', methods=['GET'])
def get_sensitivity_visualization():
    """
    Get visualization data for sensitivity analysis.
    """
    try:
        version = request.args.get('version', '1')
        version_int = int(version)
        
        # Ensure sensitivity directories exist before any processing
        try:
            logger.info(f"Ensuring sensitivity directories exist for version {version_int}")
            created_dirs = sensitivity_manager.ensure_sensitivity_directories(version_int)
            logger.info(f"Created/verified sensitivity directories: {list(created_dirs.keys())}")
        except Exception as e:
            error_msg = f"Error creating sensitivity directories: {str(e)}"
            logger.error(error_msg)
            return jsonify({"error": error_msg}), 500
        
        organized_results = sensitivity_manager.organize_sensitivity_results(version_int)
        return jsonify(organized_results)
        
    except Exception as e:
        logger.error(f"Error retrieving sensitivity visualization: {str(e)}")
        return jsonify({"error": str(e)}), 500
