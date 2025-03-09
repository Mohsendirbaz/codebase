import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import logging
from scipy import stats
from concurrent.futures import ThreadPoolExecutor
import os

logger = logging.getLogger(__name__)

@dataclass
class EfficacyMetrics:
    overall_score: float
    confidence_score: float
    stability_score: float
    accuracy_metrics: Dict[str, float]
    performance_metrics: Dict[str, float]
    validation_results: Dict[str, Any]
    metadata: Dict[str, Any]

class EfficacyAnalyzer:
    def __init__(self, worker_threads: int = None):
        """Initialize the efficacy analyzer"""
        self.worker_threads = worker_threads or int(os.getenv('WORKER_THREADS', 4))
        self.executor = ThreadPoolExecutor(max_workers=self.worker_threads)

    def calculate_efficacy_metrics(
        self,
        sensitivity_data: Dict[str, Any],
        price_data: Dict[str, Any],
        validation_data: Optional[Dict[str, Any]] = None
    ) -> EfficacyMetrics:
        """Calculate comprehensive efficacy metrics"""
        try:
            # Calculate accuracy metrics
            accuracy_metrics = self._calculate_accuracy_metrics(
                sensitivity_data,
                price_data,
                validation_data
            )

            # Calculate performance metrics
            performance_metrics = self._calculate_performance_metrics(
                sensitivity_data,
                price_data
            )

            # Calculate stability score
            stability_score = self._calculate_stability_score(
                sensitivity_data,
                price_data
            )

            # Calculate confidence score
            confidence_score = self._calculate_confidence_score(
                accuracy_metrics,
                performance_metrics,
                stability_score
            )

            # Perform validation if data is available
            validation_results = self._validate_results(
                sensitivity_data,
                price_data,
                validation_data
            ) if validation_data else {}

            # Calculate overall efficacy score
            overall_score = self._calculate_overall_score(
                accuracy_metrics,
                performance_metrics,
                stability_score,
                confidence_score
            )

            return EfficacyMetrics(
                overall_score=float(overall_score),
                confidence_score=float(confidence_score),
                stability_score=float(stability_score),
                accuracy_metrics=accuracy_metrics,
                performance_metrics=performance_metrics,
                validation_results=validation_results,
                metadata={
                    'analysis_timestamp': str(np.datetime64('now')),
                    'data_points': len(sensitivity_data.get('points', [])),
                    'validation_performed': bool(validation_data)
                }
            )

        except Exception as e:
            logger.error(f"Error calculating efficacy metrics: {str(e)}", exc_info=True)
            raise

    def _calculate_accuracy_metrics(
        self,
        sensitivity_data: Dict[str, Any],
        price_data: Dict[str, Any],
        validation_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, float]:
        """Calculate accuracy-related metrics"""
        try:
            metrics = {}
            
            # Calculate prediction error metrics
            if validation_data:
                predicted = np.array(sensitivity_data.get('predictions', []))
                actual = np.array(validation_data.get('actual_values', []))
                
                if len(predicted) > 0 and len(actual) > 0:
                    # Mean Absolute Error
                    metrics['mae'] = float(np.mean(np.abs(predicted - actual)))
                    
                    # Root Mean Square Error
                    metrics['rmse'] = float(np.sqrt(np.mean((predicted - actual) ** 2)))
                    
                    # R-squared
                    ss_res = np.sum((actual - predicted) ** 2)
                    ss_tot = np.sum((actual - np.mean(actual)) ** 2)
                    metrics['r_squared'] = float(1 - (ss_res / ss_tot))

            # Calculate consistency score
            sensitivity_points = sensitivity_data.get('points', [])
            if sensitivity_points:
                diffs = np.diff([p.get('value', 0) for p in sensitivity_points])
                metrics['consistency'] = float(1 - np.std(diffs) / np.mean(np.abs(diffs)))

            # Calculate price alignment score
            price_points = price_data.get('points', [])
            if price_points and sensitivity_points:
                correlation = np.corrcoef(
                    [p.get('value', 0) for p in sensitivity_points],
                    [p.get('price', 0) for p in price_points]
                )[0, 1]
                metrics['price_alignment'] = float(max(0, correlation))

            return metrics

        except Exception as e:
            logger.error(f"Error calculating accuracy metrics: {str(e)}", exc_info=True)
            return {}

    def _calculate_performance_metrics(
        self,
        sensitivity_data: Dict[str, Any],
        price_data: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calculate performance-related metrics"""
        try:
            metrics = {}
            
            # Calculate convergence rate
            iterations = sensitivity_data.get('iterations', [])
            if iterations:
                convergence_values = [it.get('error', 0) for it in iterations]
                if len(convergence_values) > 1:
                    convergence_rate = np.mean(np.diff(convergence_values))
                    metrics['convergence_rate'] = float(convergence_rate)

            # Calculate stability metrics
            sensitivity_points = sensitivity_data.get('points', [])
            if sensitivity_points:
                values = [p.get('value', 0) for p in sensitivity_points]
                metrics['value_range'] = float(max(values) - min(values))
                metrics['value_std'] = float(np.std(values))

            # Calculate efficiency metrics
            computation_time = sensitivity_data.get('computation_time', 0)
            if computation_time > 0:
                metrics['points_per_second'] = float(
                    len(sensitivity_points) / computation_time
                )

            return metrics

        except Exception as e:
            logger.error(f"Error calculating performance metrics: {str(e)}", exc_info=True)
            return {}

    def _calculate_stability_score(
        self,
        sensitivity_data: Dict[str, Any],
        price_data: Dict[str, Any]
    ) -> float:
        """Calculate stability score"""
        try:
            scores = []
            
            # Calculate sensitivity stability
            sensitivity_points = sensitivity_data.get('points', [])
            if sensitivity_points:
                values = [p.get('value', 0) for p in sensitivity_points]
                scores.append(1 / (1 + np.std(values) / np.mean(np.abs(values))))

            # Calculate price stability
            price_points = price_data.get('points', [])
            if price_points:
                prices = [p.get('price', 0) for p in price_points]
                scores.append(1 / (1 + np.std(prices) / np.mean(np.abs(prices))))

            # Calculate correlation stability
            if sensitivity_points and price_points:
                windows = np.array_split(range(len(sensitivity_points)), 4)
                correlations = []
                
                for window in windows:
                    if len(window) > 1:
                        correlation = np.corrcoef(
                            [sensitivity_points[i].get('value', 0) for i in window],
                            [price_points[i].get('price', 0) for i in window]
                        )[0, 1]
                        correlations.append(correlation)
                
                if correlations:
                    scores.append(1 - np.std(correlations))

            return float(np.mean(scores)) if scores else 0.5

        except Exception as e:
            logger.error(f"Error calculating stability score: {str(e)}", exc_info=True)
            return 0.5

    def _calculate_confidence_score(
        self,
        accuracy_metrics: Dict[str, float],
        performance_metrics: Dict[str, float],
        stability_score: float
    ) -> float:
        """Calculate confidence score"""
        try:
            scores = []
            
            # Add accuracy-based confidence
            if 'r_squared' in accuracy_metrics:
                scores.append(accuracy_metrics['r_squared'])
            if 'consistency' in accuracy_metrics:
                scores.append(accuracy_metrics['consistency'])

            # Add performance-based confidence
            if 'convergence_rate' in performance_metrics:
                scores.append(1 / (1 + abs(performance_metrics['convergence_rate'])))

            # Add stability-based confidence
            scores.append(stability_score)

            # Calculate weighted average
            weights = [0.4, 0.2, 0.2, 0.2]  # Adjust weights as needed
            weights = weights[:len(scores)]
            
            if weights:
                weights = np.array(weights) / sum(weights)
                return float(np.average(scores, weights=weights))
            
            return 0.5

        except Exception as e:
            logger.error(f"Error calculating confidence score: {str(e)}", exc_info=True)
            return 0.5

    def _validate_results(
        self,
        sensitivity_data: Dict[str, Any],
        price_data: Dict[str, Any],
        validation_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate results against validation data"""
        try:
            validation_results = {}
            
            # Validate predictions
            predicted = np.array(sensitivity_data.get('predictions', []))
            actual = np.array(validation_data.get('actual_values', []))
            
            if len(predicted) > 0 and len(actual) > 0:
                # Calculate prediction metrics
                validation_results['prediction_metrics'] = {
                    'mae': float(np.mean(np.abs(predicted - actual))),
                    'rmse': float(np.sqrt(np.mean((predicted - actual) ** 2))),
                    'mape': float(np.mean(np.abs((actual - predicted) / actual)) * 100)
                }

                # Perform statistical tests
                t_stat, p_value = stats.ttest_ind(predicted, actual)
                validation_results['statistical_tests'] = {
                    't_statistic': float(t_stat),
                    'p_value': float(p_value)
                }

            # Validate trends
            if 'trends' in validation_data:
                actual_trends = validation_data['trends']
                predicted_trends = sensitivity_data.get('trends', [])
                
                if predicted_trends:
                    trend_accuracy = sum(
                        1 for a, p in zip(actual_trends, predicted_trends)
                        if a == p
                    ) / len(actual_trends)
                    
                    validation_results['trend_accuracy'] = float(trend_accuracy)

            return validation_results

        except Exception as e:
            logger.error(f"Error validating results: {str(e)}", exc_info=True)
            return {}

    def _calculate_overall_score(
        self,
        accuracy_metrics: Dict[str, float],
        performance_metrics: Dict[str, float],
        stability_score: float,
        confidence_score: float
    ) -> float:
        """Calculate overall efficacy score"""
        try:
            components = []
            
            # Accuracy component
            if accuracy_metrics:
                accuracy_score = np.mean([
                    v for v in accuracy_metrics.values()
                    if isinstance(v, (int, float))
                ])
                components.append(accuracy_score)

            # Performance component
            if performance_metrics:
                perf_values = [
                    v for v in performance_metrics.values()
                    if isinstance(v, (int, float))
                ]
                if perf_values:
                    performance_score = 1 / (1 + np.mean(np.abs(perf_values)))
                    components.append(performance_score)

            # Stability component
            components.append(stability_score)

            # Confidence component
            components.append(confidence_score)

            # Calculate weighted average
            weights = [0.3, 0.2, 0.25, 0.25]  # Adjust weights as needed
            weights = weights[:len(components)]
            
            if weights:
                weights = np.array(weights) / sum(weights)
                return float(np.average(components, weights=weights))
            
            return 0.5

        except Exception as e:
            logger.error(f"Error calculating overall score: {str(e)}", exc_info=True)
            return 0.5

    def cleanup(self):
        """Cleanup resources"""
        self.executor.shutdown(wait=True)
