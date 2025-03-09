import pytest
import time
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..monitoring import (
    MonitoringManager,
    SystemMonitor,
    ResourceMonitor,
    AlertManager,
    MonitoringError,
    MetricsCollector
)

class TestMonitoring:
    """Test monitoring utilities"""

    @pytest.fixture
    def monitoring_manager(self):
        """Create monitoring manager instance"""
        return MonitoringManager(
            config={
                'collection_interval': 60,
                'retention_days': 30,
                'alert_threshold': 0.8
            }
        )

    @pytest.fixture
    def system_monitor(self):
        """Create system monitor instance"""
        return SystemMonitor(
            check_interval=1,
            metrics=['cpu', 'memory', 'disk']
        )

    @pytest.fixture
    def resource_monitor(self):
        """Create resource monitor instance"""
        return ResourceMonitor(
            resources=['database', 'cache', 'queue'],
            timeout=5
        )

    def test_system_metrics_collection(self, system_monitor):
        """Test system metrics collection"""
        with patch('psutil.cpu_percent', return_value=50.0), \
             patch('psutil.virtual_memory', return_value=Mock(percent=60.0)), \
             patch('psutil.disk_usage', return_value=Mock(percent=70.0)):

            # Collect metrics
            metrics = system_monitor.collect_metrics()

            assert 'cpu_usage' in metrics
            assert metrics['cpu_usage'] == 50.0
            assert 'memory_usage' in metrics
            assert metrics['memory_usage'] == 60.0
            assert 'disk_usage' in metrics
            assert metrics['disk_usage'] == 70.0

    def test_resource_monitoring(self, resource_monitor):
        """Test resource monitoring"""
        # Mock resource checks
        with patch.object(resource_monitor, 'check_resource') as mock_check:
            mock_check.return_value = {'status': 'healthy', 'latency': 0.1}

            # Check resources
            status = resource_monitor.check_resources()

            assert all(r['status'] == 'healthy' for r in status.values())
            assert mock_check.call_count == 3  # One for each resource

    def test_alert_generation(self, monitoring_manager):
        """Test alert generation"""
        alerts = []

        def alert_handler(alert):
            alerts.append(alert)

        monitoring_manager.on_alert(alert_handler)

        # Trigger alert condition
        monitoring_manager.check_threshold(
            metric='cpu_usage',
            value=90.0,
            threshold=80.0
        )

        assert len(alerts) == 1
        assert alerts[0]['metric'] == 'cpu_usage'
        assert alerts[0]['value'] == 90.0
        assert alerts[0]['threshold'] == 80.0

    def test_metrics_aggregation(self, monitoring_manager):
        """Test metrics aggregation"""
        # Add sample metrics
        metrics = [
            {'cpu_usage': 50.0, 'memory_usage': 60.0, 'timestamp': datetime.now()},
            {'cpu_usage': 60.0, 'memory_usage': 70.0, 'timestamp': datetime.now()},
            {'cpu_usage': 70.0, 'memory_usage': 80.0, 'timestamp': datetime.now()}
        ]

        for m in metrics:
            monitoring_manager.add_metrics(m)

        # Get aggregated metrics
        aggregated = monitoring_manager.get_aggregated_metrics()
        
        assert aggregated['cpu_usage']['avg'] == 60.0
        assert aggregated['memory_usage']['max'] == 80.0

    def test_monitoring_history(self, monitoring_manager):
        """Test monitoring history"""
        # Add historical data
        now = datetime.now()
        history = []
        
        for i in range(24):
            timestamp = now - timedelta(hours=i)
            metrics = {
                'cpu_usage': 50.0 + i,
                'timestamp': timestamp
            }
            history.append(metrics)
            monitoring_manager.add_metrics(metrics)

        # Query history
        results = monitoring_manager.get_metrics_history(
            metric='cpu_usage',
            start_time=now - timedelta(hours=12)
        )

        assert len(results) == 13  # Including current hour
        assert all(50.0 <= m['cpu_usage'] <= 73.0 for m in results)

    def test_resource_health_check(self, resource_monitor):
        """Test resource health checking"""
        def mock_resource_check(resource):
            if resource == 'database':
                return {'status': 'degraded', 'error': 'High latency'}
            return {'status': 'healthy'}

        with patch.object(resource_monitor, 'check_resource', side_effect=mock_resource_check):
            status = resource_monitor.check_resources()
            
            assert status['database']['status'] == 'degraded'
            assert status['cache']['status'] == 'healthy'
            assert status['queue']['status'] == 'healthy'

    def test_monitoring_thresholds(self, monitoring_manager):
        """Test monitoring thresholds"""
        # Configure thresholds
        thresholds = {
            'cpu_usage': {'warning': 70.0, 'critical': 90.0},
            'memory_usage': {'warning': 80.0, 'critical': 95.0}
        }
        monitoring_manager.set_thresholds(thresholds)

        # Test threshold checks
        status = monitoring_manager.check_thresholds({
            'cpu_usage': 85.0,
            'memory_usage': 75.0
        })

        assert status['cpu_usage'] == 'warning'
        assert status['memory_usage'] == 'normal'

    def test_alert_throttling(self, monitoring_manager):
        """Test alert throttling"""
        alerts = []

        def alert_handler(alert):
            alerts.append(alert)

        monitoring_manager.on_alert(alert_handler)
        monitoring_manager.set_alert_throttle(timedelta(seconds=1))

        # Trigger multiple alerts
        for _ in range(5):
            monitoring_manager.check_threshold(
                metric='cpu_usage',
                value=90.0,
                threshold=80.0
            )

        assert len(alerts) == 1  # Only first alert should be sent

        # Wait for throttle to expire
        time.sleep(1.1)
        monitoring_manager.check_threshold(
            metric='cpu_usage',
            value=90.0,
            threshold=80.0
        )
        assert len(alerts) == 2

    def test_metric_persistence(self, monitoring_manager):
        """Test metric persistence"""
        # Add metrics
        metrics = {
            'cpu_usage': 50.0,
            'memory_usage': 60.0,
            'timestamp': datetime.now()
        }
        monitoring_manager.add_metrics(metrics)

        # Save metrics
        monitoring_manager.save_metrics()

        # Load metrics
        loaded_metrics = monitoring_manager.load_metrics()
        assert len(loaded_metrics) > 0
        assert 'cpu_usage' in loaded_metrics[0]
        assert 'memory_usage' in loaded_metrics[0]

    def test_monitoring_cleanup(self, monitoring_manager):
        """Test monitoring data cleanup"""
        # Add old metrics
        old_time = datetime.now() - timedelta(days=40)
        old_metrics = {
            'cpu_usage': 50.0,
            'timestamp': old_time
        }
        monitoring_manager.add_metrics(old_metrics)

        # Run cleanup
        cleaned = monitoring_manager.cleanup_old_data(
            max_age=timedelta(days=30)
        )
        assert cleaned > 0

        # Verify cleanup
        history = monitoring_manager.get_metrics_history(
            metric='cpu_usage',
            start_time=old_time
        )
        assert len(history) == 0

    def test_custom_metric_collection(self, monitoring_manager):
        """Test custom metric collection"""
        # Define custom metric
        def collect_custom_metric():
            return {'custom_value': 42.0}

        monitoring_manager.register_collector(
            name='custom_metric',
            collector=collect_custom_metric
        )

        # Collect metrics
        metrics = monitoring_manager.collect_all_metrics()
        assert 'custom_value' in metrics

    def test_monitoring_export(self, monitoring_manager):
        """Test monitoring data export"""
        # Add sample data
        for i in range(24):
            monitoring_manager.add_metrics({
                'cpu_usage': 50.0 + i,
                'memory_usage': 60.0 + i,
                'timestamp': datetime.now() - timedelta(hours=i)
            })

        # Export data
        export_data = monitoring_manager.export_data(
            start_time=datetime.now() - timedelta(days=1),
            format='json'
        )

        assert len(export_data['metrics']) == 24
        assert 'metadata' in export_data
        assert 'export_time' in export_data['metadata']
