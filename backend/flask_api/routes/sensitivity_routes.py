from flask import Blueprint, request, jsonify
# Use local mocked marshmallow instead of the real package
from marshmallow.marshmallow import Schema, fields, validate  
import os
import sys

# Add necessary paths
current_dir = os.path.dirname(os.path.abspath(__file__))
flask_api_dir = os.path.dirname(current_dir)
if flask_api_dir not in sys.path:
    sys.path.insert(0, flask_api_dir)

# Direct imports
from utils.validation import validate_json_payload
from utils.sensitivity_utils import SensitivityAnalyzer
from utils.price_utils import PriceAnalyzer
from utils.efficacy_utils import EfficacyAnalyzer
from websocket import emit_calculation_progress
import logging
import uuid

logger = logging.getLogger(__name__)

sensitivity_bp = Blueprint('sensitivity', __name__)

# Schema definitions
class ParameterSchema(Schema):
    id = fields.Str(required=True)
    name = fields.Str(required=True)
    type = fields.Str(required=True, validate=validate.OneOf(['numeric', 'categorical', 'boolean']))
    range = fields.Dict(
        keys=fields.Str(),
        values=fields.Float(),
        required=True
    )
    steps = fields.Int(required=True, validate=validate.Range(min=2, max=100))

class AnalysisRequestSchema(Schema):
    parameter = fields.Nested(ParameterSchema, required=True)
    type = fields.Str(required=True, validate=validate.OneOf(['multipoint', 'monte_carlo']))
    config = fields.Dict(required=True)

class MonteCarloRequestSchema(Schema):
    parameters = fields.List(fields.Nested(ParameterSchema), required=True)
    iterations = fields.Int(required=True, validate=validate.Range(min=100, max=10000))
    config = fields.Dict(required=True)

class EfficacyRequestSchema(Schema):
    sensitivity_data = fields.Dict(required=True)
    price_data = fields.Dict(required=True)
    validation_data = fields.Dict(required=False)

@sensitivity_bp.route('/analyze', methods=['POST'])
@validate_json_payload(AnalysisRequestSchema)
def analyze_sensitivity(validated_data):
    """Analyze parameter sensitivity"""
    try:
        analysis_id = str(uuid.uuid4())
        analyzer = SensitivityAnalyzer()

        def progress_callback(progress, results):
            emit_calculation_progress(analysis_id, {
                'step': int(progress * 100),
                'status': 'running',
                'results': results
            })

        parameter = validated_data['parameter']
        config = validated_data['config']

        # Prepare evaluation function
        def evaluate_parameter(value):
            # This would typically call your model or simulation
            # For now, we'll use a simple quadratic function
            baseline = (parameter['range']['max'] + parameter['range']['min']) / 2
            return -(value - baseline) ** 2  # Negative quadratic for maximization

        # Run analysis
        result = analyzer.analyze_parameter(
            parameter_id=parameter['id'],
            baseline_value=(parameter['range']['max'] + parameter['range']['min']) / 2,
            range_min=parameter['range']['min'],
            range_max=parameter['range']['max'],
            steps=parameter['steps'],
            evaluation_func=evaluate_parameter,
            monte_carlo_iterations=config.get('monte_carlo_iterations', 1000)
        )

        # Cleanup
        analyzer.cleanup()

        return jsonify({
            'analysis_id': analysis_id,
            'parameter_id': parameter['id'],
            'results': {
                'sensitivity_curve': result.sensitivity_curve,
                'elasticity': result.elasticity,
                'impact_score': result.impact_score,
                'confidence_intervals': result.confidence_intervals,
                'metadata': result.metadata
            }
        })

    except Exception as e:
        logger.error(f"Error in sensitivity analysis: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Analysis failed',
            'message': str(e)
        }), 500

@sensitivity_bp.route('/monte-carlo', methods=['POST'])
@validate_json_payload(MonteCarloRequestSchema)
def run_monte_carlo(validated_data):
    """Run Monte Carlo simulation"""
    try:
        analysis_id = str(uuid.uuid4())
        analyzer = SensitivityAnalyzer()

        def progress_callback(progress, results):
            emit_calculation_progress(analysis_id, {
                'step': int(progress * 100),
                'status': 'running',
                'results': results
            })

        parameters = validated_data['parameters']
        iterations = validated_data['iterations']
        config = validated_data['config']

        results = analyzer.analyze_multiple_parameters(
            parameters=parameters,
            evaluation_func=lambda x: x,  # Replace with actual evaluation function
            progress_callback=progress_callback
        )

        # Cleanup
        analyzer.cleanup()

        return jsonify({
            'analysis_id': analysis_id,
            'results': {
                param_id: {
                    'sensitivity_curve': result.sensitivity_curve,
                    'elasticity': result.elasticity,
                    'impact_score': result.impact_score,
                    'confidence_intervals': result.confidence_intervals,
                    'metadata': result.metadata
                }
                for param_id, result in results.items()
            }
        })

    except Exception as e:
        logger.error(f"Error in Monte Carlo simulation: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Simulation failed',
            'message': str(e)
        }), 500

@sensitivity_bp.route('/derivatives/<parameter>', methods=['GET'])
def get_derivatives(parameter):
    """Get derivative data for specific parameter"""
    try:
        version = request.args.get('version')
        extension = request.args.get('extension')

        analyzer = SensitivityAnalyzer()
        
        # This would typically load historical data and calculate derivatives
        # For now, we'll return dummy data
        derivatives = {
            'first_order': [-0.5, -0.3, 0.0, 0.3, 0.5],
            'second_order': [-0.1, -0.05, 0.0, 0.05, 0.1],
            'cross_effects': {
                'param1': 0.2,
                'param2': -0.1
            }
        }

        # Cleanup
        analyzer.cleanup()

        return jsonify({
            'parameter': parameter,
            'version': version,
            'derivatives': derivatives,
            'metadata': {
                'timestamp': str(uuid.uuid1()),
                'version': version,
                'extension': extension
            }
        })

    except Exception as e:
        logger.error(f"Error getting derivatives: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to get derivatives',
            'message': str(e)
        }), 500

@sensitivity_bp.route('/efficacy', methods=['POST'])
@validate_json_payload(EfficacyRequestSchema)
def calculate_efficacy(validated_data):
    """Calculate efficacy metrics"""
    try:
        analyzer = EfficacyAnalyzer()
        
        metrics = analyzer.calculate_efficacy_metrics(
            sensitivity_data=validated_data['sensitivity_data'],
            price_data=validated_data['price_data'],
            validation_data=validated_data.get('validation_data')
        )

        # Cleanup
        analyzer.cleanup()

        return jsonify({
            'overall_score': metrics.overall_score,
            'confidence_score': metrics.confidence_score,
            'stability_score': metrics.stability_score,
            'accuracy_metrics': metrics.accuracy_metrics,
            'performance_metrics': metrics.performance_metrics,
            'validation_results': metrics.validation_results,
            'metadata': metrics.metadata
        })

    except Exception as e:
        logger.error(f"Error calculating efficacy: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Efficacy calculation failed',
            'message': str(e)
        }), 500

@sensitivity_bp.errorhandler(Exception)
def handle_error(error):
    """Global error handler for sensitivity routes"""
    logger.error(f"Unhandled error in sensitivity routes: {str(error)}", exc_info=True)
    return jsonify({
        'error': 'Internal server error',
        'message': str(error)
    }), 500
