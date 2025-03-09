import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import logging
from scipy import optimize, stats
from concurrent.futures import ThreadPoolExecutor
import os

logger = logging.getLogger(__name__)

@dataclass
class PriceAnalysisResult:
    version: str
    base_price: float
    optimized_price: float
    price_elasticity: float
    revenue_impact: float
    confidence_interval: Tuple[float, float]
    market_position: Dict[str, float]
    sensitivity_metrics: Dict[str, float]
    metadata: Dict[str, Any]

class PriceAnalyzer:
    def __init__(self, worker_threads: int = None):
        """Initialize the price analyzer"""
        self.worker_threads = worker_threads or int(os.getenv('WORKER_THREADS', 4))
        self.executor = ThreadPoolExecutor(max_workers=self.worker_threads)

    def analyze_price_impact(
        self,
        base_price: float,
        parameters: List[Dict[str, Any]],
        market_data: Optional[Dict[str, Any]] = None,
        constraints: Optional[Dict[str, Any]] = None
    ) -> PriceAnalysisResult:
        """Analyze price impact with parameter changes"""
        try:
            # Calculate optimized price
            optimized_price = self._optimize_price(
                base_price,
                parameters,
                constraints
            )

            # Calculate price elasticity
            elasticity = self._calculate_price_elasticity(
                base_price,
                optimized_price,
                parameters
            )

            # Calculate revenue impact
            revenue_impact = self._calculate_revenue_impact(
                base_price,
                optimized_price,
                elasticity
            )

            # Calculate confidence intervals
            confidence_interval = self._calculate_confidence_interval(
                base_price,
                optimized_price,
                parameters
            )

            # Analyze market position
            market_position = self._analyze_market_position(
                optimized_price,
                market_data
            ) if market_data else {}

            # Calculate sensitivity metrics
            sensitivity_metrics = self._calculate_sensitivity_metrics(
                base_price,
                parameters
            )

            return PriceAnalysisResult(
                version=str(np.datetime64('now')),
                base_price=float(base_price),
                optimized_price=float(optimized_price),
                price_elasticity=float(elasticity),
                revenue_impact=float(revenue_impact),
                confidence_interval=(
                    float(confidence_interval[0]),
                    float(confidence_interval[1])
                ),
                market_position=market_position,
                sensitivity_metrics=sensitivity_metrics,
                metadata={
                    'analysis_timestamp': str(np.datetime64('now')),
                    'parameter_count': len(parameters),
                    'constraints_applied': bool(constraints),
                    'market_data_used': bool(market_data)
                }
            )

        except Exception as e:
            logger.error(f"Error in price analysis: {str(e)}", exc_info=True)
            raise

    def _optimize_price(
        self,
        base_price: float,
        parameters: List[Dict[str, Any]],
        constraints: Optional[Dict[str, Any]] = None
    ) -> float:
        """Optimize price based on parameters and constraints"""
        try:
            # Define objective function for optimization
            def objective(price):
                total_impact = 0
                for param in parameters:
                    weight = param.get('weight', 1.0)
                    sensitivity = param.get('sensitivity', 1.0)
                    total_impact += weight * sensitivity * (price - base_price)
                return -total_impact  # Negative for maximization

            # Define constraint bounds
            bounds = [(base_price * 0.5, base_price * 2.0)]  # Default bounds
            if constraints:
                min_price = constraints.get('min_price', base_price * 0.5)
                max_price = constraints.get('max_price', base_price * 2.0)
                bounds = [(float(min_price), float(max_price))]

            # Optimize price
            result = optimize.minimize(
                objective,
                x0=[base_price],
                bounds=bounds,
                method='L-BFGS-B'
            )

            return result.x[0]

        except Exception as e:
            logger.error(f"Error optimizing price: {str(e)}", exc_info=True)
            return base_price

    def _calculate_price_elasticity(
        self,
        base_price: float,
        optimized_price: float,
        parameters: List[Dict[str, Any]]
    ) -> float:
        """Calculate price elasticity of demand"""
        try:
            # Calculate weighted average elasticity
            total_weight = 0
            weighted_elasticity = 0

            for param in parameters:
                weight = param.get('weight', 1.0)
                sensitivity = param.get('sensitivity', 1.0)
                
                # Calculate point elasticity
                price_change = (optimized_price - base_price) / base_price
                demand_change = -sensitivity * price_change  # Assume linear demand response
                
                if abs(price_change) > 1e-6:  # Avoid division by zero
                    point_elasticity = demand_change / price_change
                    weighted_elasticity += weight * point_elasticity
                    total_weight += weight

            return weighted_elasticity / total_weight if total_weight > 0 else -1.0

        except Exception as e:
            logger.error(f"Error calculating price elasticity: {str(e)}", exc_info=True)
            return -1.0

    def _calculate_revenue_impact(
        self,
        base_price: float,
        optimized_price: float,
        elasticity: float
    ) -> float:
        """Calculate revenue impact of price change"""
        try:
            price_change = (optimized_price - base_price) / base_price
            demand_change = elasticity * price_change
            
            # Calculate revenue change using mid-point formula
            new_revenue = optimized_price * (1 + demand_change)
            base_revenue = base_price
            
            revenue_impact = (new_revenue - base_revenue) / base_revenue
            return revenue_impact

        except Exception as e:
            logger.error(f"Error calculating revenue impact: {str(e)}", exc_info=True)
            return 0.0

    def _calculate_confidence_interval(
        self,
        base_price: float,
        optimized_price: float,
        parameters: List[Dict[str, Any]],
        confidence_level: float = 0.95
    ) -> Tuple[float, float]:
        """Calculate confidence interval for optimized price"""
        try:
            # Calculate standard error
            variances = []
            for param in parameters:
                sensitivity = param.get('sensitivity', 1.0)
                uncertainty = param.get('uncertainty', 0.1)
                variances.append((sensitivity * uncertainty * base_price) ** 2)

            std_error = np.sqrt(np.sum(variances))
            
            # Calculate confidence interval
            z_score = stats.norm.ppf((1 + confidence_level) / 2)
            margin = z_score * std_error
            
            return (optimized_price - margin, optimized_price + margin)

        except Exception as e:
            logger.error(f"Error calculating confidence interval: {str(e)}", exc_info=True)
            return (optimized_price * 0.9, optimized_price * 1.1)

    def _analyze_market_position(
        self,
        optimized_price: float,
        market_data: Dict[str, Any]
    ) -> Dict[str, float]:
        """Analyze market position relative to competitors"""
        try:
            competitor_prices = market_data.get('competitor_prices', [])
            if not competitor_prices:
                return {}

            prices = np.array(competitor_prices)
            
            return {
                'percentile': float(stats.percentileofscore(prices, optimized_price)),
                'relative_position': float((optimized_price - np.mean(prices)) / np.std(prices)),
                'market_share_estimate': float(1 / (1 + np.exp(np.mean(prices) - optimized_price)))
            }

        except Exception as e:
            logger.error(f"Error analyzing market position: {str(e)}", exc_info=True)
            return {}

    def _calculate_sensitivity_metrics(
        self,
        base_price: float,
        parameters: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Calculate sensitivity metrics for parameters"""
        try:
            metrics = {}
            total_sensitivity = sum(p.get('sensitivity', 1.0) for p in parameters)

            for param in parameters:
                param_id = param.get('id', 'unknown')
                sensitivity = param.get('sensitivity', 1.0)
                weight = param.get('weight', 1.0)
                
                metrics[f"{param_id}_impact"] = float(
                    sensitivity * weight / total_sensitivity
                )

            return metrics

        except Exception as e:
            logger.error(f"Error calculating sensitivity metrics: {str(e)}", exc_info=True)
            return {}

    def cleanup(self):
        """Cleanup resources"""
        self.executor.shutdown(wait=True)
