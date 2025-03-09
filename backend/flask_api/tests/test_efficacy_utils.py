import pytest
import numpy as np
from ..utils.efficacy_utils import EfficacyAnalyzer, EfficacyMetrics

class TestEfficacyUtils:
    """Test efficacy analysis utilities"""

    @pytest.fixture
    def analyzer(self):
        """Create efficacy analyzer instance"""
        return EfficacyAnalyzer(worker_threads=2)

    @pytest.fixture
    def sample_sensitivity_data(self):
        """Create sample sensitivity analysis data"""
        return {
            'points': [
                {'value': i, 'result': i * 2}
                for i in range(5)
            ],
            'predictions': [i * 2 for i in range(5)],
            'iterations': [
                {'error': 1.0 - i * 0.2}
                for i in range(5)
            ],
            'computation_time': 1.5
        }

    @pytest.fixture
    def sample_price_data(self):
        """Create sample price analysis data"""
        return {
            'points': [
                {'price': 100 + i * 10}
                for i in range(5)
            ]
        }

    @pytest.fixture
    def sample_validation_data(self):
        """Create sample validation data"""
        return {
            'actual_values': [i * 2 for i in range(5)],
            'trends': ['increasing'] * 5
        }

    def test_calculate_efficacy_metrics(self, analyzer, sample_sensitivity_data,
                                     sample_price_data, sample_validation_data):
        """Test comprehensive efficacy metrics calculation"""
        metrics = analyzer.calculate_efficacy_metrics(
            sensitivity_data=sample_sensitivity_data,
            price_data=sample_price_data,
            validation_data=sample_validation_data
        )

        assert isinstance(metrics, EfficacyMetrics)
        assert 0 <= metrics.overall_score <= 1
        assert 0 <= metrics.confidence_score <= 1
        assert 0 <= metrics.stability_score <= 1
        assert isinstance(metrics.accuracy_metrics, dict)
        assert isinstance(metrics.performance_metrics, dict)
        assert isinstance(metrics.validation_results, dict)
        assert isinstance(metrics.metadata, dict)

    def test_calculate_accuracy_metrics(self, analyzer, sample_sensitivity_data,
                                     sample_price_data, sample_validation_data):
        """Test accuracy metrics calculation"""
        metrics = analyzer._calculate_accuracy_metrics(
            sensitivity_data=sample_sensitivity_data,
            price_data=sample_price_data,
            validation_data=sample_validation_data
        )

        assert isinstance(metrics, dict)
        assert 'mae' in metrics
        assert 'rmse' in metrics
        assert 'r_squared' in metrics
        assert 'consistency' in metrics
        assert 'price_alignment' in metrics
        assert all(0 <= v <= 1 for v in metrics.values())

    def test_calculate_performance_metrics(self, analyzer, sample_sensitivity_data,
                                        sample_price_data):
        """Test performance metrics calculation"""
        metrics = analyzer._calculate_performance_metrics(
            sensitivity_data=sample_sensitivity_data,
            price_data=sample_price_data
        )

        assert isinstance(metrics, dict)
        assert 'convergence_rate' in metrics
        assert 'value_range' in metrics
        assert 'value_std' in metrics
        assert 'points_per_second' in metrics

    def test_calculate_stability_score(self, analyzer, sample_sensitivity_data,
                                    sample_price_data):
        """Test stability score calculation"""
        score = analyzer._calculate_stability_score(
            sensitivity_data=sample_sensitivity_data,
            price_data=sample_price_data
        )

        assert isinstance(score, float)
        assert 0 <= score <= 1

    def test_calculate_confidence_score(self, analyzer):
        """Test confidence score calculation"""
        score = analyzer._calculate_confidence_score(
            accuracy_metrics={'r_squared': 0.8, 'consistency': 0.9},
            performance_metrics={'convergence_rate': 0.1},
            stability_score=0.85
        )

        assert isinstance(score, float)
        assert 0 <= score <= 1

    def test_validate_results(self, analyzer, sample_sensitivity_data,
                            sample_price_data, sample_validation_data):
        """Test results validation"""
        validation = analyzer._validate_results(
            sensitivity_data=sample_sensitivity_data,
            price_data=sample_price_data,
            validation_data=sample_validation_data
        )

        assert isinstance(validation, dict)
        assert 'prediction_metrics' in validation
        assert 'statistical_tests' in validation
        assert 'trend_accuracy' in validation

    def test_calculate_overall_score(self, analyzer):
        """Test overall score calculation"""
        score = analyzer._calculate_overall_score(
            accuracy_metrics={'r_squared': 0.8, 'consistency': 0.9},
            performance_metrics={'convergence_rate': 0.1, 'value_std': 0.2},
            stability_score=0.85,
            confidence_score=0.9
        )

        assert isinstance(score, float)
        assert 0 <= score <= 1

    def test_error_handling(self, analyzer):
        """Test error handling in efficacy analysis"""
        with pytest.raises(Exception):
            analyzer.calculate_efficacy_metrics(
                sensitivity_data={},  # Invalid empty data
                price_data={},
                validation_data={}
            )

    @pytest.mark.parametrize('validation_scenario,expected_accuracy', [
        # Perfect prediction
        ({'actual_values': [1, 2, 3], 'predictions': [1, 2, 3]}, 1.0),
        # Poor prediction
        ({'actual_values': [1, 2, 3], 'predictions': [3, 2, 1]}, 0.0),
        # Moderate prediction
        ({'actual_values': [1, 2, 3], 'predictions': [1.1, 2.1, 3.1]}, 0.9)
    ])
    def test_validation_scenarios(self, analyzer, validation_scenario, expected_accuracy):
        """Test different validation scenarios"""
        validation_data = {
            'actual_values': validation_scenario['actual_values']
        }
        sensitivity_data = {
            'predictions': validation_scenario['predictions'],
            'points': [{'value': v} for v in validation_scenario['predictions']]
        }
        price_data = {'points': [{'price': 100}]}

        metrics = analyzer.calculate_efficacy_metrics(
            sensitivity_data=sensitivity_data,
            price_data=price_data,
            validation_data=validation_data
        )

        assert abs(metrics.accuracy_metrics.get('r_squared', 0) - expected_accuracy) < 0.2

    def test_resource_cleanup(self, analyzer):
        """Test resource cleanup"""
        analyzer.calculate_efficacy_metrics(
            sensitivity_data={'points': [], 'predictions': []},
            price_data={'points': []},
            validation_data={'actual_values': []}
        )
        
        analyzer.cleanup()
        assert analyzer.executor._shutdown

    def test_parallel_processing(self, analyzer, sample_sensitivity_data,
                               sample_price_data, sample_validation_data):
        """Test parallel processing performance"""
        import time

        # Create larger dataset
        large_sensitivity_data = {
            'points': sample_sensitivity_data['points'] * 20,
            'predictions': sample_sensitivity_data['predictions'] * 20,
            'iterations': sample_sensitivity_data['iterations'] * 20,
            'computation_time': sample_sensitivity_data['computation_time']
        }
        large_price_data = {
            'points': sample_price_data['points'] * 20
        }
        large_validation_data = {
            'actual_values': sample_validation_data['actual_values'] * 20,
            'trends': sample_validation_data['trends'] * 20
        }

        start_time = time.time()
        metrics = analyzer.calculate_efficacy_metrics(
            sensitivity_data=large_sensitivity_data,
            price_data=large_price_data,
            validation_data=large_validation_data
        )
        end_time = time.time()

        assert end_time - start_time < 2.0  # Should be relatively fast
        assert isinstance(metrics, EfficacyMetrics)
        assert len(metrics.validation_results.get('prediction_metrics', {})) > 0

    def test_metadata_generation(self, analyzer, sample_sensitivity_data,
                               sample_price_data):
        """Test metadata generation"""
        metrics = analyzer.calculate_efficacy_metrics(
            sensitivity_data=sample_sensitivity_data,
            price_data=sample_price_data
        )

        assert 'analysis_timestamp' in metrics.metadata
        assert 'data_points' in metrics.metadata
        assert metrics.metadata['data_points'] == len(sample_sensitivity_data['points'])
        assert 'validation_performed' in metrics.metadata
