from flask import Blueprint, request, jsonify, send_file
import logging
import os
import subprocess
import json
from datetime import datetime
from Sensitivity_File_Manager import SensitivityFileManager

sensitivity_routes = Blueprint('sensitivity_routes', __name__)
base_dir = r"C:\Users\md8w7\OneDrive University of Missouri\Desktop\ImportantFiles\Milestone4\backend\Original"
file_manager = SensitivityFileManager(base_dir)

@sensitivity_routes.route('/sensitivity/symmetrical', methods=['POST'])
def handle_symmetrical_analysis():
    """Processes symmetrical sensitivity analysis."""
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
        
        # Execute the sensitivity calculation script
        calculation_script = os.path.join(base_dir, "Core_calculation_engines", "sensitivity_calculator.py")
        calc_result = subprocess.run(
            [
                'python',
                calculation_script,
                str(version),
                param_id,
                str(variation),
                compare_to_key
            ],
            capture_output=True,
            text=True
        )
        
        if calc_result.returncode != 0:
            raise Exception(f"Sensitivity calculation failed: {calc_result.stderr}")
            
        # Parse and store calculation results
        calculation_data = json.loads(calc_result.stdout)
        result_path = file_manager.store_calculation_result(
            version=version,
            param_id=param_id,
            result_data=calculation_data,
            mode='symmetrical'
        )
        
        # Generate requested plots
        plot_types = []
        if data.get('waterfall'): plot_types.append('waterfall')
        if data.get('bar'): plot_types.append('bar')
        if data.get('point'): plot_types.append('point')

        sensitivity_dir = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity',
            'Symmetrical'
        )
        
        for plot_type in plot_types:
            plot_name = f"{plot_type}_{param_id}_{compare_to_key}_{comparison_type}"
            plot_path = os.path.join(sensitivity_dir, f"{plot_name}.png")
            
            script_path = os.path.join(base_dir, "Visualization_generators", f"generate_{plot_type}_plot.py")
            result = subprocess.run(
                [
                    'python',
                    script_path,
                    str(version),
                    param_id,
                    str(variation),
                    compare_to_key,
                    comparison_type,
                    result_path  # Pass the calculation results path to the plot generator
                ],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                raise Exception(f"Plot generation failed for {plot_type}: {result.stderr}")

        return jsonify({
            "status": "success",
            "message": "Symmetrical analysis completed",
            "directory": sensitivity_dir,
            "results_path": result_path
        })

    except Exception as e:
        logging.error(f"Error in symmetrical analysis: {str(e)}")
        return jsonify({"error": str(e)}), 500

@sensitivity_routes.route('/sensitivity/multipoint', methods=['POST'])
def handle_multipoint_analysis():
    """Processes multiple point sensitivity analysis."""
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
        
        # Execute the sensitivity calculation script
        calculation_script = os.path.join(base_dir, "Core_calculation_engines", "sensitivity_calculator.py")
        calc_result = subprocess.run(
            [
                'python',
                calculation_script,
                str(version),
                param_id,
                json.dumps(variations),
                compare_to_key
            ],
            capture_output=True,
            text=True
        )
        
        if calc_result.returncode != 0:
            raise Exception(f"Sensitivity calculation failed: {calc_result.stderr}")
            
        # Parse and store calculation results
        calculation_data = json.loads(calc_result.stdout)
        result_path = file_manager.store_calculation_result(
            version=version,
            param_id=param_id,
            result_data=calculation_data,
            mode='multipoint'
        )
        
        # Generate requested plots
        plot_types = []
        if data.get('waterfall'): plot_types.append('waterfall')
        if data.get('bar'): plot_types.append('bar')
        if data.get('point'): plot_types.append('point')

        sensitivity_dir = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity',
            'Multipoint'
        )
        
        for plot_type in plot_types:
            plot_name = f"{plot_type}_{param_id}_{compare_to_key}_{comparison_type}"
            plot_path = os.path.join(sensitivity_dir, f"{plot_name}.png")
            
            script_path = os.path.join(base_dir, "Visualization_generators", f"generate_{plot_type}_plot.py")
            result = subprocess.run(
                [
                    'python',
                    script_path,
                    str(version),
                    param_id,
                    json.dumps(variations),
                    compare_to_key,
                    comparison_type,
                    result_path  # Pass the calculation results path to the plot generator
                ],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                raise Exception(f"Plot generation failed for {plot_type}: {result.stderr}")

        return jsonify({
            "status": "success",
            "message": "Multipoint analysis completed",
            "directory": sensitivity_dir,
            "results_path": result_path
        })

    except Exception as e:
        logging.error(f"Error in multipoint analysis: {str(e)}")
        return jsonify({"error": str(e)}), 500

@sensitivity_routes.route('/sensitivity/generate-report', methods=['POST'])
def generate_analysis_report():
    """
    Generates a comprehensive analysis report for all processed sensitivity parameters.
    The endpoint expects a JSON payload containing version and parameters configuration.
    """
    try:
        data = request.json
        version = data.get('version')
        parameters_data = data.get('parameters', {})
        
        if not version:
            return jsonify({"error": "Version number is required"}), 400
            
        if not parameters_data:
            return jsonify({"error": "No parameter data provided"}), 400
        
        # Generate the report using SensitivityFileManager
        report_path = file_manager.create_analysis_report(
            version=version,
            parameters_data=parameters_data
        )
        
        # Convert report path to relative path for frontend
        relative_path = os.path.relpath(
            report_path,
            base_dir
        )
        
        return jsonify({
            "status": "success",
            "message": "Analysis report generated successfully",
            "report_path": relative_path
        })
        
    except Exception as e:
        logging.error(f"Error generating analysis report: {str(e)}")
        return jsonify({"error": str(e)}), 500

@sensitivity_routes.route('/sensitivity/plots/<mode>/<plot_type>', methods=['GET'])
def get_sensitivity_plot(mode, plot_type):
    """Retrieves a specific sensitivity plot."""
    try:
        param_id = request.args.get('param_id')
        compare_to_key = request.args.get('compareToKey')
        comparison_type = request.args.get('comparisonType', 'primary')
        version = request.args.get('version')

        if not all([param_id, compare_to_key, version]):
            return jsonify({"error": "Missing required parameters"}), 400

        plot_path = file_manager.get_plot_path(
            version=int(version),
            mode=mode,
            plot_type=plot_type,
            param_id=param_id,
            compare_to_key=compare_to_key,
            comparison_type=comparison_type
        )

        if not os.path.exists(plot_path):
            return jsonify({"error": "Plot not found"}), 404

        return send_file(plot_path, mimetype='image/png')

    except Exception as e:
        logging.error(f"Error retrieving plot: {str(e)}")
        return jsonify({"error": str(e)}), 500