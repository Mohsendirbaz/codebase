import pytest
import numpy as np
from ..utils.price_utils import PriceAnalyzer, PriceAnalysisResult

class TestPriceUtils:
    """Test price analysis utilities"""

    @pytest.fixture
    def analyzer(self):
        """Create price analyzer instance"""
        return PriceAnalyzer(worker_threads=2)

    @pytest.fixture
    def sample_parameters(self):
        """Create sample price parameters"""
        return [
            {
                'id': 'param1',
                'weight': 0.7,
                'sensitivity': 0.5,
                'uncertainty': 0.1
            },
            {
                'id': 'param2',
                'weight': 0.3,
                'sensitivity': 0.3,
                'uncertainty': 0.2
            }
        ]

    @pytest.fixture
    def sample_market_data(self):
        """Create sample market data"""
        return {
            'competitor_prices': [95.0, 100.0, 105.0, 110.0],
            'market_share': {
                'competitor1': 0.3,
                'competitor2': 0.4,
                'our_product': 0.3
            },
            'elasticity_data': {
                'short_term': -1.2,
                'long_term': -0.8
            }
        }

    def test_analyze_price_impact(self, analyzer, sample_parameters, sample_market_data):
        """Test price impact analysis"""
        result = analyzer.analyze_price_impact(
            base_price=100.0,
            parameters=sample_parameters,
            market_data=sample_market_data
        )

        assert isinstance(result, PriceAnalysisResult)
        assert result.base_price == 100.0
        assert isinstance(result.optimized_price, float)
        assert isinstance(result.price_elasticity, float)
        assert isinstance(result.revenue_impact, float)
        assert isinstance(result.confidence_interval, tuple)
        assert isinstance(result.market_position, dict)
        assert isinstance(result.sensitivity_metrics, dict)

    def test_optimize_price(self, analyzer, sample_parameters):
        """Test price optimization"""
        result = analyzer._optimize_price(
            base_price=100.0,
            parameters=sample_parameters,
            constraints={
                'min_price': 80.0,
                'max_price': 120.0
            }
        )

        assert isinstance(result, float)
        assert 80.0 <= result <= 120.0

    def test_calculate_price_elasticity(self, analyzer, sample_parameters):
        """Test price elasticity calculation"""
        elasticity = analyzer._calculate_price_elasticity(
            base_price=100.0,
            optimized_price=110.0,
            parameters=sample_parameters
        )

        assert isinstance(elasticity, float)
        assert elasticity < 0  # Price elasticity should typically be negative

    def test_calculate_revenue_impact(self, analyzer):
        """Test revenue impact calculation"""
        revenue_impact = analyzer._calculate_revenue_impact(
            base_price=100.0,
            optimized_price=110.0,
            elasticity=-1.2
        )

        assert isinstance(revenue_impact, float)
        assert -1.0 <= revenue_impact <= 1.0  # Should be a reasonable percentage change

    def test_calculate_confidence_interval(self, analyzer, sample_parameters):
        """Test confidence interval calculation"""
        interval = analyzer._calculate_confidence_interval(
            base_price=100.0,
            optimized_price=110.0,
            parameters=sample_parameters
        )

        assert isinstance(interval, tuple)
        assert len(interval) == 2
        assert interval[0] < interval[1]
        assert interval[0] <= 110.0 <= interval[1]

    def test_analyze_market_position(self, analyzer, sample_market_data):
        """Test market position analysis"""
        position = analyzer._analyze_market_position(
            optimized_price=105.0,
            market_data=sample_market_data
        )

        assert isinstance(position, dict)
        assert 'percentile' in position
        assert 'relative_position' in position
        assert 'market_share_estimate' in position
        assert 0 <= position['percentile'] <= 100
        assert 0 <= position['market_share_estimate'] <= 1

    def test_calculate_sensitivity_metrics(self, analyzer, sample_parameters):
        """Test sensitivity metrics calculation"""
        metrics = analyzer._calculate_sensitivity_metrics(
            base_price=100.0,
            parameters=sample_parameters
        )

        assert isinstance(metrics, dict)
        assert all(f"{param['id']}_impact" in metrics for param in sample_parameters)
        assert sum(metrics.values()) == pytest.approx(1.0)

    def test_error_handling(self, analyzer):
        """Test error handling in price analysis"""
        with pytest.raises(Exception):
            analyzer.analyze_price_impact(
                base_price=-100.0,  # Invalid negative price
                parameters=[],
                market_data={}
            )

    def test_constraint_handling(self, analyzer, sample_parameters):
        """Test price optimization with different constraints"""
        # Test with tight constraints
        result1 = analyzer._optimize_price(
            base_price=100.0,
            parameters=sample_parameters,
            constraints={'min_price': 95.0, 'max_price': 105.0}
        )
        assert 95.0 <= result1 <= 105.0

        # Test with loose constraints
        result2 = analyzer._optimize_price(
            base_price=100.0,
            parameters=sample_parameters,
            constraints={'min_price': 50.0, 'max_price': 150.0}
        )
        assert 50.0 <= result2 <= 150.0

    @pytest.mark.parametrize('market_scenario,expected_trend', [
        # Competitive market (prices close to base)
        ({'competitor_prices': [95, 100, 105]}, 'competitive'),
        # Premium market (prices above base)
        ({'competitor_prices': [120, 130, 140]}, 'premium'),
        # Budget market (prices below base)
        ({'competitor_prices': [70, 80, 90]}, 'budget')
    ])
    def test_market_scenarios(self, analyzer, sample_parameters, market_scenario, expected_trend):
        """Test price analysis in different market scenarios"""
        result = analyzer.analyze_price_impact(
            base_price=100.0,
            parameters=sample_parameters,
            market_data=market_scenario
        )

        if expected_trend == 'competitive':
            assert 90 <= result.optimized_price <= 110
        elif expected_trend == 'premium':
            assert result.optimized_price > 110
        elif expected_trend == 'budget':
            assert result.optimized_price < 90

    def test_resource_cleanup(self, analyzer):
        """Test resource cleanup"""
        analyzer.analyze_price_impact(
            base_price=100.0,
            parameters=[{
                'id': 'test',
                'weight': 1.0,
                'sensitivity': 1.0
            }],
            market_data={'competitor_prices': [100.0]}
        )
        
        analyzer.cleanup()
        assert analyzer.executor._shutdown

    def test_parallel_optimization(self, analyzer, sample_parameters):
        """Test parallel optimization performance"""
        import time

        # Create larger parameter set
        many_parameters = sample_parameters * 5  # 10 parameters

        start_time = time.time()
        result = analyzer.analyze_price_impact(
            base_price=100.0,
            parameters=many_parameters,
            market_data={'competitor_prices': [100.0]}
        )
        end_time = time.time()

        assert end_time - start_time < 2.0  # Should be relatively fast
        assert isinstance(result, PriceAnalysisResult)
        assert len(result.sensitivity_metrics) == len(many_parameters)
