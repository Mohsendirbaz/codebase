"""
Utilities for calculating efficacy metrics from sensitivity and price data
"""

import logging
import numpy as np
from typing import Dict, Any, List, Optional

# Configure logger
logger = logging.getLogger(__name__)

def calculate_efficacy_metrics(
        sensitivity_data: Dict[str, Any],
        price_data: Dict[str, Any]
    ) -> Dict[str, Any]:
    """
    Calculate efficacy metrics from sensitivity data and price data
    
    Args:
        sensitivity_data (Dict): Sensitivity data with parameters and derivatives
            Should have:
            - parameters: List of parameter names
            - derivatives: List of objects with parameter name and impact data
        price_data (Dict): Price data with average selling price
            Should have:
            - averageSellingPrice: Average selling price
    
    Returns:
        Dict: Calculated efficacy metrics
    """
    logger.info("Calculating efficacy metrics")
    
    # Extract average selling price
    avg_price = price_data.get('averageSellingPrice', 0)
    if not avg_price or avg_price <= 0:
        logger.warning("Average selling price is zero or negative, can't calculate efficacy")
        return {
            "score": 0,
            "sensitivity": 0,
            "elasticity": 0,
            "parameterImpacts": []
        }
    
    # Extract derivatives
    derivatives = sensitivity_data.get('derivatives', [])
    if not derivatives:
        logger.warning("No derivatives data provided, can't calculate efficacy")
        return {
            "score": 0,
            "sensitivity": 0,
            "elasticity": 0,
            "parameterImpacts": []
        }
    
    # Calculate parameter impacts
    parameter_impacts = []
    
    for derivative in derivatives:
        param_name = derivative.get('parameter', '')
        impact_data = derivative.get('data', [])
        
        if not impact_data:
            continue
        
        # Calculate average absolute impact
        impacts = [abs(point.get('impact', 0)) for point in impact_data]
        if not impacts:
            continue
        
        avg_impact = sum(impacts) / len(impacts)
        
        # Calculate price impact and elasticity
        price_impact = avg_impact * avg_price
        elasticity = price_impact / avg_price if avg_price > 0 else 0
        
        # Calculate impact level
        if elasticity > 0.8:
            impact_level = "high"
        elif elasticity > 0.3:
            impact_level = "medium"
        else:
            impact_level = "low"
        
        # Add to parameter impacts
        parameter_impacts.append({
            "parameter": param_name,
            "priceImpact": price_impact,
            "elasticity": elasticity,
            "impactLevel": impact_level
        })
    
    # Sort parameter impacts by price impact (descending)
    parameter_impacts.sort(key=lambda x: abs(x.get('priceImpact', 0)), reverse=True)
    
    # Calculate overall metrics
    total_impact = sum(param.get('priceImpact', 0) for param in parameter_impacts)
    max_impact = max((abs(param.get('priceImpact', 0)) for param in parameter_impacts), default=0)
    
    # Calculate overall score, sensitivity, and elasticity
    score = total_impact / avg_price if avg_price > 0 else 0
    sensitivity = max_impact / avg_price if avg_price > 0 else 0
    elasticity = score / len(parameter_impacts) if parameter_impacts else 0
    
    # Determine overall efficacy level
    if score > 0.5:
        efficacy_level = "high"
    elif score > 0.2:
        efficacy_level = "medium"
    else:
        efficacy_level = "low"
    
    # Determine market implications
    if efficacy_level == "high":
        market_implications = "Highly responsive to parameter changes, suggesting flexible pricing strategies"
    elif efficacy_level == "medium":
        market_implications = "Moderately responsive to parameter changes, balanced pricing approach recommended"
    else:
        market_implications = "Low responsiveness to parameter changes, consider value-based pricing"
    
    return {
        "score": score,
        "sensitivity": sensitivity,
        "elasticity": elasticity,
        "efficacyLevel": efficacy_level,
        "marketImplications": market_implications,
        "parameterImpacts": parameter_impacts
    }

def calculate_combined_efficacy(
        base_efficacy: Dict[str, Any],
        variant_efficacies: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
    """
    Calculate combined efficacy metrics from multiple model variants
    
    Args:
        base_efficacy (Dict): Base model efficacy metrics
        variant_efficacies (List[Dict]): List of variant model efficacy metrics
    
    Returns:
        Dict: Combined efficacy metrics with comparison
    """
    logger.info(f"Calculating combined efficacy for base model and {len(variant_efficacies)} variants")
    
    if not base_efficacy:
        logger.warning("No base efficacy provided")
        return {}
    
    if not variant_efficacies:
        logger.warning("No variant efficacies provided")
        return base_efficacy
    
    # Extract base metrics
    base_score = base_efficacy.get('score', 0)
    base_sensitivity = base_efficacy.get('sensitivity', 0)
    base_elasticity = base_efficacy.get('elasticity', 0)
    base_parameter_impacts = base_efficacy.get('parameterImpacts', [])
    
    # Collect all parameter impacts across all variants
    all_parameters = set()
    for param_impact in base_parameter_impacts:
        all_parameters.add(param_impact.get('parameter', ''))
    
    for variant in variant_efficacies:
        for param_impact in variant.get('parameterImpacts', []):
            all_parameters.add(param_impact.get('parameter', ''))
    
    # Create parameter comparison map
    parameter_comparison = {}
    
    for param in all_parameters:
        # Find parameter in base model
        base_param = next((p for p in base_parameter_impacts if p.get('parameter') == param), None)
        
        # Collect variant data for this parameter
        variant_data = []
        for i, variant in enumerate(variant_efficacies):
            variant_params = variant.get('parameterImpacts', [])
            variant_param = next((p for p in variant_params if p.get('parameter') == param), None)
            
            if variant_param:
                variant_data.append({
                    "variantIndex": i,
                    "elasticity": variant_param.get('elasticity', 0),
                    "priceImpact": variant_param.get('priceImpact', 0),
                    "impactLevel": variant_param.get('impactLevel', 'low')
                })
        
        parameter_comparison[param] = {
            "base": base_param,
            "variants": variant_data
        }
    
    # Calculate average scores across variants
    variant_scores = [v.get('score', 0) for v in variant_efficacies]
    variant_sensitivities = [v.get('sensitivity', 0) for v in variant_efficacies]
    variant_elasticities = [v.get('elasticity', 0) for v in variant_efficacies]
    
    avg_variant_score = sum(variant_scores) / len(variant_scores) if variant_scores else 0
    avg_variant_sensitivity = sum(variant_sensitivities) / len(variant_sensitivities) if variant_sensitivities else 0
    avg_variant_elasticity = sum(variant_elasticities) / len(variant_elasticities) if variant_elasticities else 0
    
    # Calculate score differences
    score_diff = avg_variant_score - base_score
    sensitivity_diff = avg_variant_sensitivity - base_sensitivity
    elasticity_diff = avg_variant_elasticity - base_elasticity
    
    # Generate insights
    insights = []
    
    if abs(score_diff) > 0.1:
        direction = "higher" if score_diff > 0 else "lower"
        insights.append(f"Variants show {direction} overall price efficacy than base model")
    
    if abs(sensitivity_diff) > 0.1:
        direction = "more" if sensitivity_diff > 0 else "less"
        insights.append(f"Variants are {direction} sensitive to parameter changes")
    
    # Find parameters with biggest differences
    param_diffs = []
    for param, data in parameter_comparison.items():
        base_elasticity = data['base'].get('elasticity', 0) if data['base'] else 0
        variant_elasticities = [v.get('elasticity', 0) for v in data['variants']]
        avg_variant_elasticity = sum(variant_elasticities) / len(variant_elasticities) if variant_elasticities else 0
        diff = avg_variant_elasticity - base_elasticity
        
        param_diffs.append({
            "parameter": param,
            "difference": diff
        })
    
    param_diffs.sort(key=lambda x: abs(x.get('difference', 0)), reverse=True)
    
    for i, param_diff in enumerate(param_diffs[:3]):  # Top 3 differences
        if abs(param_diff.get('difference', 0)) > 0.1:
            param = param_diff.get('parameter', '')
            diff = param_diff.get('difference', 0)
            direction = "more" if diff > 0 else "less"
            insights.append(f"{param} parameter is {direction} influential in variants")
    
    return {
        "base": base_efficacy,
        "variants": variant_efficacies,
        "comparison": {
            "avgVariantScore": avg_variant_score,
            "avgVariantSensitivity": avg_variant_sensitivity,
            "avgVariantElasticity": avg_variant_elasticity,
            "scoreDifference": score_diff,
            "sensitivityDifference": sensitivity_diff,
            "elasticityDifference": elasticity_diff,
            "parameterComparison": parameter_comparison
        },
        "insights": insights
    }
