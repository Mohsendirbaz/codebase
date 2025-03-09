import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import logging
from scipy import stats
from concurrent.futures import ThreadPoolExecutor
import os

logger = logging.getLogger(__name__)

@dataclass
class SensitivityResult:
    parameter_id: str
    baseline_value: float
    sensitivity_curve: List[Dict[str, float]]
    elasticity: float
    impact_score: float
    confidence_score: float
    confidence_intervals: List[Dict[str, float]]
    metadata: Dict[str, Any]

class SensitivityAnalyzer:
    def __init__(self, worker_threads: int = None):
        """Initialize the sensitivity analyzer"""
        self.worker_threads = worker_threads or int(os.getenv('WORKER_THREADS', 4))
        self.executor = ThreadPoolExecutor(max_workers=self.worker_threads)

    def analyze_parameter(
        self,
        parameter_id: str,
        baseline_value: float,
        range_min: float,
        range_max: float,
        steps: int,
        evaluation_func: callable,
        monte_carlo_iterations: int = 1000
    ) -> SensitivityResult:
        """Perform comprehensive sensitivity analysis for a parameter"""
        try:
            # Generate test points
            test_points = np.linspace(range_min, range_max, steps)
            
            # Evaluate parameter values in parallel
            futures = [
                self.executor.submit(evaluation_func, point)
                for point in test_points
            ]
            results = [future.result() for future in futures]

            # Calculate sensitivity curve
            sensitivity_curve = [
                {"value": float(point), "result": float(result)}
                for point, result in zip(test_points, results)
            ]

            # Calculate elasticity
            elasticity = self._calculate_elasticity(
                baseline_value, 
                test_points, 
                results
            )

            # Calculate impact score
            impact_score = self._calculate_impact_score(
                results,
                baseline_value
            )

            # Perform Monte Carlo simulation
            confidence_data = self._monte_carlo_simulation(
                baseline_value,
                test_points,
                results,
                monte_carlo_iterations
            )

            return SensitivityResult(
                parameter_id=parameter_id,
                baseline_value=float(baseline_value),
                sensitivity_curve=sensitivity_curve,
                elasticity=float(elasticity),
                impact_score=float(impact_score),
                confidence_score=float(confidence_data['confidence_score']),
                confidence_intervals=confidence_data['intervals'],
                metadata={
                    'analysis_timestamp': str(np.datetime64('now')),
                    'steps': steps,
                    'monte_carlo_iterations': monte_carlo_iterations,
                    'range': {
                        'min': float(range_min),
                        'max': float(range_max)
                    }
                }
            )

        except Exception as e:
            logger.error(f"Error in sensitivity analysis: {str(e)}", exc_info=True)
            raise

    def _calculate_elasticity(
        self,
        baseline_value: float,
        test_points: np.ndarray,
        results: List[float]
    ) -> float:
        """Calculate elasticity (% change in output / % change in input)"""
        try:
            # Convert to numpy arrays for vectorized operations
            points = np.array(test_points)
            values = np.array(results)
            
            # Calculate percentage changes
            input_pct_change = (points - baseline_value) / baseline_value
            output_pct_change = (values - values[len(values)//2]) / values[len(values)//2]
            
            # Calculate elasticity using linear regression
            slope, _, _, _, _ = stats.linregress(input_pct_change, output_pct_change)
            
            return slope

        except Exception as e:
            logger.error(f"Error calculating elasticity: {str(e)}", exc_info=True)
            return 0.0

    def _calculate_impact_score(
        self,
        results: List[float],
        baseline_value: float
    ) -> float:
        """Calculate impact score based on result variation"""
        try:
            values = np.array(results)
            baseline_idx = len(values) // 2
            
            # Calculate relative changes from baseline
            relative_changes = np.abs(values - values[baseline_idx]) / values[baseline_idx]
            
            # Calculate weighted impact score
            weights = np.exp(-np.abs(np.arange(len(values)) - baseline_idx))
            impact_score = np.sum(relative_changes * weights) / np.sum(weights)
            
            return min(1.0, impact_score)  # Normalize to [0, 1]

        except Exception as e:
            logger.error(f"Error calculating impact score: {str(e)}", exc_info=True)
            return 0.0

    def _monte_carlo_simulation(
        self,
        baseline_value: float,
        test_points: np.ndarray,
        results: List[float],
        iterations: int
    ) -> Dict[str, Any]:
        """Perform Monte Carlo simulation for confidence intervals"""
        try:
            # Convert to numpy arrays
            points = np.array(test_points)
            values = np.array(results)
            
            # Calculate standard deviation of residuals
            z = np.polyfit(points, values, 2)
            p = np.poly1d(z)
            residuals = values - p(points)
            std_dev = np.std(residuals)
            
            # Run Monte Carlo iterations
            simulations = []
            for _ in range(iterations):
                noise = np.random.normal(0, std_dev, len(points))
                simulated_values = p(points) + noise
                simulations.append(simulated_values)
            
            simulations = np.array(simulations)
            
            # Calculate confidence intervals
            confidence_intervals = []
            for i in range(len(points)):
                lower, upper = np.percentile(simulations[:, i], [2.5, 97.5])
                confidence_intervals.append({
                    "value": float(points[i]),
                    "lower": float(lower),
                    "upper": float(upper)
                })
            
            # Calculate confidence score
            baseline_idx = len(points) // 2
            confidence_range = np.abs(
                simulations[:, baseline_idx] - values[baseline_idx]
            ) / values[baseline_idx]
            confidence_score = 1.0 - min(1.0, np.mean(confidence_range))
            
            return {
                'intervals': confidence_intervals,
                'confidence_score': confidence_score
            }

        except Exception as e:
            logger.error(f"Error in Monte Carlo simulation: {str(e)}", exc_info=True)
            return {
                'intervals': [],
                'confidence_score': 0.0
            }

    def analyze_multiple_parameters(
        self,
        parameters: List[Dict[str, Any]],
        evaluation_func: callable,
        progress_callback: Optional[callable] = None
    ) -> Dict[str, SensitivityResult]:
        """Analyze multiple parameters with progress tracking"""
        results = {}
        total_parameters = len(parameters)
        
        try:
            for i, param in enumerate(parameters):
                result = self.analyze_parameter(
                    parameter_id=param['id'],
                    baseline_value=param['baseline'],
                    range_min=param['range']['min'],
                    range_max=param['range']['max'],
                    steps=param.get('steps', 10),
                    evaluation_func=evaluation_func
                )
                
                results[param['id']] = result
                
                if progress_callback:
                    progress = ((i + 1) / total_parameters) * 100
                    progress_callback(progress, result)
            
            return results

        except Exception as e:
            logger.error(f"Error in multiple parameter analysis: {str(e)}", exc_info=True)
            raise

    def cleanup(self):
        """Cleanup resources"""
        self.executor.shutdown(wait=True)
