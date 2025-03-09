import pytest
import numpy as np
from ..utils.sensitivity_utils import SensitivityAnalyzer, SensitivityResult

class TestSensitivityUtils:
    """Test sensitivity analysis utilities"""

    @pytest.fixture
    def analyzer(self):
        """Create sensitivity analyzer instance"""
        return SensitivityAnalyzer(worker_threads=2)

    @pytest.fixture
    def sample_parameters(self):
        """Create sample analysis parameters"""
        return {
            'id': 'test_param',
            'baseline_value': 50.0,
            'range_min': 0.0,
            'range_max': 100.0,
            'steps': 5
        }

    def test_analyze_parameter(self, analyzer, sample_parameters):
        """Test single parameter analysis"""
        def evaluation_func(value):
            """Simple quadratic evaluation function"""
            return -(value - 50) ** 2  # Maximum at 50

        result = analyzer.analyze_parameter(
            parameter_id=sample_parameters['id'],
            baseline_value=sample_parameters['baseline_value'],
            range_min=sample_parameters['range_min'],
            range_max=sample_parameters['range_max'],
            steps=sample_parameters['steps'],
            evaluation_func=evaluation_func
        )

        assert isinstance(result, SensitivityResult)
        assert result.parameter_id == sample_parameters['id']
        assert result.baseline_value == sample_parameters['baseline_value']
        assert len(result.sensitivity_curve) == sample_parameters['steps']
        assert isinstance(result.elasticity, float)
        assert isinstance(result.impact_score, float)
        assert isinstance(result.confidence_score, float)
        assert len(result.confidence_intervals) == sample_parameters['steps']

    def test_calculate_elasticity(self, analyzer):
        """Test elasticity calculation"""
        baseline = 50.0
        test_points = np.array([0, 25, 50, 75, 100])
        results = np.array([0, 25, 50, 75, 100])  # Linear relationship

        elasticity = analyzer._calculate_elasticity(
            baseline,
            test_points,
            results
        )

        assert isinstance(elasticity, float)
        assert abs(elasticity - 1.0) < 0.1  # Should be close to 1 for linear relationship

    def test_calculate_impact_score(self, analyzer):
        """Test impact score calculation"""
        results = [0, 25, 50, 75, 100]
        baseline = 50.0

        impact_score = analyzer._calculate_impact_score(
            results,
            baseline
        )

        assert isinstance(impact_score, float)
        assert 0 <= impact_score <= 1

    def test_monte_carlo_simulation(self, analyzer):
        """Test Monte Carlo simulation"""
        baseline = 50.0
        test_points = np.array([0, 25, 50, 75, 100])
        results = np.array([0, 25, 50, 75, 100])
        iterations = 100

        simulation_results = analyzer._monte_carlo_simulation(
            baseline,
            test_points,
            results,
            iterations
        )

        assert 'intervals' in simulation_results
        assert 'confidence_score' in simulation_results
        assert len(simulation_results['intervals']) == len(test_points)
        assert 0 <= simulation_results['confidence_score'] <= 1

    def test_analyze_multiple_parameters(self, analyzer):
        """Test multiple parameter analysis"""
        parameters = [
            {
                'id': 'param1',
                'baseline': 50.0,
                'range': {'min': 0.0, 'max': 100.0},
                'steps': 5
            },
            {
                'id': 'param2',
                'baseline': 75.0,
                'range': {'min': 50.0, 'max': 100.0},
                'steps': 5
            }
        ]

        def evaluation_func(value):
            return -(value - 50) ** 2

        progress_updates = []
        def progress_callback(progress, result):
            progress_updates.append((progress, result))

        results = analyzer.analyze_multiple_parameters(
            parameters,
            evaluation_func,
            progress_callback
        )

        assert len(results) == len(parameters)
        assert all(isinstance(result, SensitivityResult) for result in results.values())
        assert len(progress_updates) == len(parameters)
        assert all(0 <= progress <= 100 for progress, _ in progress_updates)

    def test_error_handling(self, analyzer, sample_parameters):
        """Test error handling in analysis"""
        def failing_func(value):
            raise ValueError("Test error")

        with pytest.raises(Exception):
            analyzer.analyze_parameter(
                parameter_id=sample_parameters['id'],
                baseline_value=sample_parameters['baseline_value'],
                range_min=sample_parameters['range_min'],
                range_max=sample_parameters['range_max'],
                steps=sample_parameters['steps'],
                evaluation_func=failing_func
            )

    def test_parallel_execution(self, analyzer, sample_parameters):
        """Test parallel execution of analysis"""
        import time

        def slow_evaluation(value):
            time.sleep(0.1)  # Simulate computation
            return value

        start_time = time.time()
        result = analyzer.analyze_parameter(
            parameter_id=sample_parameters['id'],
            baseline_value=sample_parameters['baseline_value'],
            range_min=sample_parameters['range_min'],
            range_max=sample_parameters['range_max'],
            steps=10,  # More steps to test parallelization
            evaluation_func=slow_evaluation
        )
        end_time = time.time()

        # Should be faster than sequential execution (10 * 0.1 = 1 second)
        assert end_time - start_time < 1.0
        assert len(result.sensitivity_curve) == 10

    @pytest.mark.parametrize('test_input,expected_trend', [
        # Linear increasing
        (lambda x: x, 'increasing'),
        # Linear decreasing
        (lambda x: -x, 'decreasing'),
        # Quadratic
        (lambda x: -(x - 50) ** 2, 'nonlinear'),
        # Constant
        (lambda x: 1.0, 'constant')
    ])
    def test_different_relationships(self, analyzer, sample_parameters, test_input, expected_trend):
        """Test analysis with different functional relationships"""
        result = analyzer.analyze_parameter(
            parameter_id=sample_parameters['id'],
            baseline_value=sample_parameters['baseline_value'],
            range_min=sample_parameters['range_min'],
            range_max=sample_parameters['range_max'],
            steps=sample_parameters['steps'],
            evaluation_func=test_input
        )

        # Verify results based on relationship type
        if expected_trend == 'increasing':
            assert result.elasticity > 0
        elif expected_trend == 'decreasing':
            assert result.elasticity < 0
        elif expected_trend == 'constant':
            assert abs(result.elasticity) < 0.1
            assert result.impact_score < 0.1

    def test_resource_cleanup(self, analyzer):
        """Test resource cleanup"""
        analyzer.analyze_parameter(
            parameter_id='test',
            baseline_value=50.0,
            range_min=0.0,
            range_max=100.0,
            steps=5,
            evaluation_func=lambda x: x
        )
        
        analyzer.cleanup()
        assert analyzer.executor._shutdown

    def test_confidence_interval_calculation(self, analyzer, sample_parameters):
        """Test confidence interval calculation"""
        def noisy_evaluation(value):
            """Evaluation function with noise"""
            return value + np.random.normal(0, 5)

        result = analyzer.analyze_parameter(
            parameter_id=sample_parameters['id'],
            baseline_value=sample_parameters['baseline_value'],
            range_min=sample_parameters['range_min'],
            range_max=sample_parameters['range_max'],
            steps=sample_parameters['steps'],
            evaluation_func=noisy_evaluation,
            monte_carlo_iterations=1000
        )

        # Check confidence intervals
        for interval in result.confidence_intervals:
            assert interval['lower'] <= interval['value'] <= interval['upper']
            assert interval['upper'] - interval['lower'] > 0  # Non-zero width

    def test_metadata_generation(self, analyzer, sample_parameters):
        """Test metadata generation in results"""
        result = analyzer.analyze_parameter(
            parameter_id=sample_parameters['id'],
            baseline_value=sample_parameters['baseline_value'],
            range_min=sample_parameters['range_min'],
            range_max=sample_parameters['range_max'],
            steps=sample_parameters['steps'],
            evaluation_func=lambda x: x
        )

        assert 'analysis_timestamp' in result.metadata
        assert result.metadata['steps'] == sample_parameters['steps']
        assert 'monte_carlo_iterations' in result.metadata
        assert 'range' in result.metadata
