from flask import Blueprint, request, jsonify
from marshmallow import Schema, fields, validate
from ..utils.validation import validate_json_payload
from ..utils.price_utils import PriceAnalyzer
from ..websocket import emit_calculation_progress
import logging
import uuid

logger = logging.getLogger(__name__)

price_bp = Blueprint('price', __name__)

# Schema definitions
class PriceParameterSchema(Schema):
    id = fields.Str(required=True)
    weight = fields.Float(required=True, validate=validate.Range(min=0, max=1))
    sensitivity = fields.Float(required=True)
    uncertainty = fields.Float(required=False, default=0.1)

class MarketDataSchema(Schema):
    competitor_prices = fields.List(fields.Float(), required=True)
    market_share = fields.Dict(keys=fields.Str(), values=fields.Float(), required=False)
    elasticity_data = fields.Dict(keys=fields.Str(), values=fields.Float(), required=False)

class PriceImpactRequestSchema(Schema):
    base_price = fields.Float(required=True, validate=validate.Range(min=0))
    parameters = fields.List(fields.Nested(PriceParameterSchema), required=True)
    market_data = fields.Nested(MarketDataSchema, required=False)
    constraints = fields.Dict(required=False)

class PriceComparisonRequestSchema(Schema):
    base_version = fields.Str(required=True)
    variants = fields.List(fields.Dict(), required=True)

@price_bp.route('/data', methods=['GET'])
def get_price_data():
    """Get price data for specific model version"""
    try:
        version = request.args.get('version')
        extension = request.args.get('extension')

        # This would typically load price data from a database
        # For now, we'll return dummy data
        price_data = {
            'base_price': 100.0,
            'current_price': 120.0,
            'price_history': [
                {'timestamp': '2025-01-01', 'price': 100.0},
                {'timestamp': '2025-02-01', 'price': 110.0},
                {'timestamp': '2025-03-01', 'price': 120.0}
            ],
            'metrics': {
                'average_price': 110.0,
                'price_volatility': 0.1,
                'price_trend': 'increasing'
            }
        }

        return jsonify({
            'version': version,
            'extension': extension,
            'price_data': price_data,
            'metadata': {
                'timestamp': str(uuid.uuid1()),
                'data_points': len(price_data['price_history'])
            }
        })

    except Exception as e:
        logger.error(f"Error getting price data: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to get price data',
            'message': str(e)
        }), 500

@price_bp.route('/comparison', methods=['POST'])
@validate_json_payload(PriceComparisonRequestSchema)
def compare_prices(validated_data):
    """Compare prices between model variants"""
    try:
        analyzer = PriceAnalyzer()
        base_version = validated_data['base_version']
        variants = validated_data['variants']

        # This would typically load and compare actual price data
        # For now, we'll generate comparison metrics
        comparisons = {}
        for variant in variants:
            variant_id = variant.get('id', 'unknown')
            comparisons[variant_id] = {
                'price_difference': 10.0,  # Example value
                'percentage_change': 0.1,   # Example value
                'impact_metrics': {
                    'revenue_impact': 0.05,
                    'market_share_impact': 0.02,
                    'competitive_position': 'improved'
                }
            }

        # Cleanup
        analyzer.cleanup()

        return jsonify({
            'base_version': base_version,
            'comparisons': comparisons,
            'metadata': {
                'timestamp': str(uuid.uuid1()),
                'variants_compared': len(variants)
            }
        })

    except Exception as e:
        logger.error(f"Error comparing prices: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Comparison failed',
            'message': str(e)
        }), 500

@price_bp.route('/impact', methods=['POST'])
@validate_json_payload(PriceImpactRequestSchema)
def calculate_price_impact(validated_data):
    """Calculate parameter impact on pricing"""
    try:
        analysis_id = str(uuid.uuid4())
        analyzer = PriceAnalyzer()

        def progress_callback(progress, results):
            emit_calculation_progress(analysis_id, {
                'step': int(progress * 100),
                'status': 'running',
                'results': results
            })

        result = analyzer.analyze_price_impact(
            base_price=validated_data['base_price'],
            parameters=validated_data['parameters'],
            market_data=validated_data.get('market_data'),
            constraints=validated_data.get('constraints')
        )

        # Cleanup
        analyzer.cleanup()

        return jsonify({
            'analysis_id': analysis_id,
            'base_price': float(result.base_price),
            'optimized_price': float(result.optimized_price),
            'metrics': {
                'price_elasticity': float(result.price_elasticity),
                'revenue_impact': float(result.revenue_impact),
                'confidence_interval': [
                    float(result.confidence_interval[0]),
                    float(result.confidence_interval[1])
                ]
            },
            'market_position': result.market_position,
            'sensitivity_metrics': result.sensitivity_metrics,
            'metadata': result.metadata
        })

    except Exception as e:
        logger.error(f"Error calculating price impact: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Impact calculation failed',
            'message': str(e)
        }), 500

@price_bp.errorhandler(Exception)
def handle_error(error):
    """Global error handler for price routes"""
    logger.error(f"Unhandled error in price routes: {str(error)}", exc_info=True)
    return jsonify({
        'error': 'Internal server error',
        'message': str(error)
    }), 500
