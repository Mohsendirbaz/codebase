import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..metrics import (
    MetricsManager,
    Metric,
    Counter,
    Gauge,
    Histogram,
    Timer,
    MetricsError
)

class TestMetrics:
    """Test metrics utilities"""

    @pytest.fixture
    def metrics_manager(self):
        """Create metrics manager instance"""
        return MetricsManager(
            config={
                'storage_type': 'memory',
                'flush_interval': 60,
                'retention_days': 30,
                'tags': {'env': 'test'}
            }
        )

    @pytest.fixture
    def counter(self):
        """Create counter metric instance"""
        return Counter('test_counter', description='Test counter metric')

    @pytest.fixture
    def gauge(self):
        """Create gauge metric instance"""
        return Gauge('test_gauge', description='Test gauge metric')

    @pytest.fixture
    def histogram(self):
        """Create histogram metric instance"""
        return Histogram(
            'test_histogram',
            buckets=[0.1, 0.5, 1.0, 5.0],
            description='Test histogram metric'
        )

    def test_counter_operations(self, metrics_manager, counter):
        """Test counter metric operations"""
        # Register counter
        metrics_manager.register_metric(counter)

        # Increment counter
        counter.inc()
        assert counter.value == 1

        counter.inc(2)
        assert counter.value == 3

        # Decrement counter
        counter.dec()
        assert counter.value == 2

        # Reset counter
        counter.reset()
        assert counter.value == 0

    def test_gauge_operations(self, metrics_manager, gauge):
        """Test gauge metric operations"""
        # Register gauge
        metrics_manager.register_metric(gauge)

        # Set value
        gauge.set(5.0)
        assert gauge.value == 5.0

        # Increment
        gauge.inc(2.5)
        assert gauge.value == 7.5

        # Decrement
        gauge.dec(1.5)
        assert gauge.value == 6.0

        # Set to current time
        gauge.set_to_current_time()
        assert isinstance(gauge.value, float)

    def test_histogram_operations(self, metrics_manager, histogram):
        """Test histogram metric operations"""
        # Register histogram
        metrics_manager.register_metric(histogram)

        # Observe values
        values = [0.2, 0.7, 1.5, 3.0, 7.0]
        for value in values:
            histogram.observe(value)

        # Check bucket counts
        buckets = histogram.get_buckets()
        assert buckets[0.1] == 0
        assert buckets[0.5] == 1
        assert buckets[1.0] == 2
        assert buckets[5.0] == 4

        # Check statistics
        stats = histogram.get_statistics()
        assert stats['count'] == 5
        assert stats['sum'] == sum(values)
        assert 0.2 <= stats['min'] <= stats['max'] <= 7.0

    def test_timer_metric(self, metrics_manager):
        """Test timer metric"""
        timer = Timer('test_timer', description='Test timer metric')
        metrics_manager.register_metric(timer)

        # Time a block of code
        with timer.time():
            import time
            time.sleep(0.1)

        # Check recorded duration
        assert timer.value > 0
        assert isinstance(timer.value, float)

    def test_metric_labels(self, metrics_manager):
        """Test metric labeling"""
        # Create labeled counter
        counter = Counter(
            'http_requests_total',
            labels=['method', 'endpoint'],
            description='Total HTTP requests'
        )
        metrics_manager.register_metric(counter)

        # Increment with different labels
        counter.labels(method='GET', endpoint='/api/users').inc()
        counter.labels(method='POST', endpoint='/api/users').inc(2)

        # Check values
        assert counter.labels(method='GET', endpoint='/api/users').value == 1
        assert counter.labels(method='POST', endpoint='/api/users').value == 2

    def test_metrics_collection(self, metrics_manager):
        """Test metrics collection"""
        # Register multiple metrics
        metrics = {
            'requests': Counter('requests_total'),
            'latency': Histogram('request_latency', buckets=[0.1, 0.5, 1.0]),
            'memory': Gauge('memory_usage')
        }

        for metric in metrics.values():
            metrics_manager.register_metric(metric)

        # Record some values
        metrics['requests'].inc(5)
        metrics['latency'].observe(0.3)
        metrics['memory'].set(1024.0)

        # Collect all metrics
        collection = metrics_manager.collect()
        
        assert len(collection) == 3
        assert collection['requests_total']['value'] == 5
        assert 0.1 < collection['request_latency']['buckets'][0.5] <= 1
        assert collection['memory_usage']['value'] == 1024.0

    def test_metrics_export(self, metrics_manager, counter, histogram):
        """Test metrics export functionality"""
        # Register metrics
        metrics_manager.register_metric(counter)
        metrics_manager.register_metric(histogram)

        # Record some values
        counter.inc(10)
        histogram.observe(0.5)

        # Export to different formats
        prometheus = metrics_manager.export_prometheus()
        assert 'test_counter' in prometheus
        assert 'test_histogram' in prometheus

        json_export = metrics_manager.export_json()
        assert json_export['test_counter']['value'] == 10
        assert 0.5 in json_export['test_histogram']['observations']

    def test_metrics_aggregation(self, metrics_manager):
        """Test metrics aggregation"""
        # Create metrics for different services
        service_counters = {
            'service1': Counter('requests', labels=['service']),
            'service2': Counter('requests', labels=['service'])
        }

        for counter in service_counters.values():
            metrics_manager.register_metric(counter)

        # Record values
        service_counters['service1'].labels(service='service1').inc(5)
        service_counters['service2'].labels(service='service2').inc(3)

        # Aggregate metrics
        total = metrics_manager.aggregate('requests', 'sum')
        assert total == 8

    def test_metrics_retention(self, metrics_manager):
        """Test metrics retention"""
        counter = Counter('retained_metric')
        metrics_manager.register_metric(counter)

        # Record values with timestamps
        with patch('time.time') as mock_time:
            # Record old value
            mock_time.return_value = (datetime.now() - timedelta(days=40)).timestamp()
            counter.inc()

            # Record recent value
            mock_time.return_value = datetime.now().timestamp()
            counter.inc()

        # Clean up old metrics
        metrics_manager.cleanup_old_metrics(max_age_days=30)
        assert counter.value == 1  # Only recent value remains

    def test_metrics_validation(self, metrics_manager):
        """Test metrics validation"""
        # Test invalid metric name
        with pytest.raises(MetricsError):
            Counter('invalid-name')  # Hyphens not allowed

        # Test invalid label name
        with pytest.raises(MetricsError):
            Counter('test', labels=['invalid-label'])

        # Test duplicate metric registration
        counter = Counter('duplicate')
        metrics_manager.register_metric(counter)
        with pytest.raises(MetricsError):
            metrics_manager.register_metric(Counter('duplicate'))

    def test_metrics_reset(self, metrics_manager):
        """Test metrics reset"""
        # Register multiple metrics
        counter = Counter('test_counter')
        gauge = Gauge('test_gauge')
        metrics_manager.register_metric(counter)
        metrics_manager.register_metric(gauge)

        # Set values
        counter.inc(5)
        gauge.set(10.0)

        # Reset all metrics
        metrics_manager.reset_all()
        assert counter.value == 0
        assert gauge.value == 0.0

    def test_custom_metric(self, metrics_manager):
        """Test custom metric implementation"""
        class RatioMetric(Metric):
            def __init__(self, name, description=None):
                super().__init__(name, description)
                self._numerator = 0
                self._denominator = 0

            def update(self, numerator, denominator):
                self._numerator += numerator
                self._denominator += denominator

            @property
            def value(self):
                if self._denominator == 0:
                    return 0
                return self._numerator / self._denominator

        # Register and use custom metric
        ratio = RatioMetric('success_ratio', 'Success/total ratio')
        metrics_manager.register_metric(ratio)

        ratio.update(3, 5)  # 3 successes out of 5
        assert ratio.value == 0.6
