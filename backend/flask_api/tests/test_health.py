import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..health import (
    HealthManager,
    HealthCheck,
    HealthStatus,
    HealthError,
    ServiceCheck,
    MetricsCheck
)

class TestHealth:
    """Test health check utilities"""

    @pytest.fixture
    def health_manager(self):
        """Create health manager instance"""
        return HealthManager(
            config={
                'check_interval': 60,
                'timeout': 30,
                'history_size': 100
            }
        )

    @pytest.fixture
    def service_check(self):
        """Create service check instance"""
        return ServiceCheck(
            name='database',
            endpoint='postgresql://localhost:5432',
            timeout=5
        )

    @pytest.fixture
    def metrics_check(self):
        """Create metrics check instance"""
        return MetricsCheck(
            name='system_metrics',
            thresholds={
                'cpu_usage': 80,
                'memory_usage': 90,
                'disk_usage': 85
            }
        )

    def test_basic_health_check(self, health_manager):
        """Test basic health check execution"""
        # Add simple check
        def check_function():
            return True, "Service is healthy"

        health_manager.add_check(
            name='test_check',
            check=check_function
        )

        # Run health check
        result = health_manager.run_checks()
        assert result.status == HealthStatus.HEALTHY
        assert len(result.checks) == 1
        assert result.checks[0].name == 'test_check'
        assert result.checks[0].success

    def test_service_health_check(self, health_manager, service_check):
        """Test service health check"""
        with patch('socket.socket') as mock_socket:
            # Mock successful connection
            mock_socket.return_value.connect_ex.return_value = 0
            
            # Add service check
            health_manager.add_service_check(service_check)
            result = health_manager.run_checks()

            assert result.status == HealthStatus.HEALTHY
            assert result.checks[0].name == 'database'

            # Mock failed connection
            mock_socket.return_value.connect_ex.return_value = 1
            result = health_manager.run_checks()

            assert result.status == HealthStatus.UNHEALTHY
            assert "Connection failed" in result.checks[0].message

    def test_metrics_health_check(self, health_manager, metrics_check):
        """Test metrics health check"""
        # Mock system metrics
        with patch('psutil.cpu_percent', return_value=70.0), \
             patch('psutil.virtual_memory', return_value=Mock(percent=85.0)), \
             patch('psutil.disk_usage', return_value=Mock(percent=80.0)):

            # Add metrics check
            health_manager.add_metrics_check(metrics_check)
            result = health_manager.run_checks()

            assert result.status == HealthStatus.HEALTHY
            assert result.checks[0].name == 'system_metrics'
            assert all(m['status'] == 'ok' for m in result.checks[0].metrics)

            # Test threshold violation
            with patch('psutil.cpu_percent', return_value=95.0):
                result = health_manager.run_checks()
                assert result.status == HealthStatus.DEGRADED
                assert any(m['status'] == 'warning' for m in result.checks[0].metrics)

    def test_dependency_health_check(self, health_manager):
        """Test dependency health checks"""
        # Mock dependency services
        dependencies = {
            'redis': 'redis://localhost:6379',
            'elasticsearch': 'http://localhost:9200'
        }

        for service, url in dependencies.items():
            check = ServiceCheck(name=service, endpoint=url)
            health_manager.add_dependency_check(check)

        with patch('socket.socket') as mock_socket:
            # All dependencies healthy
            mock_socket.return_value.connect_ex.return_value = 0
            result = health_manager.run_checks()
            assert result.status == HealthStatus.HEALTHY
            assert len(result.checks) == len(dependencies)

            # One dependency unhealthy
            def mock_connect_ex(addr):
                return 0 if 'redis' in str(addr) else 1
            mock_socket.return_value.connect_ex.side_effect = mock_connect_ex
            
            result = health_manager.run_checks()
            assert result.status == HealthStatus.DEGRADED

    def test_health_history(self, health_manager):
        """Test health check history"""
        def alternating_check():
            alternating_check.healthy = not getattr(alternating_check, 'healthy', True)
            return alternating_check.healthy, "Status changed"

        health_manager.add_check('alternating', alternating_check)

        # Run multiple checks
        history = []
        for _ in range(5):
            result = health_manager.run_checks()
            history.append(result.status)

        # Verify history
        stored_history = health_manager.get_check_history()
        assert len(stored_history) == 5
        assert stored_history == history

    def test_custom_health_check(self, health_manager):
        """Test custom health check implementation"""
        class CustomCheck(HealthCheck):
            def check(self):
                return self.success("Custom check passed")

        custom_check = CustomCheck(name='custom')
        health_manager.add_check_instance(custom_check)

        result = health_manager.run_checks()
        assert result.status == HealthStatus.HEALTHY
        assert result.checks[0].name == 'custom'

    def test_health_check_timeout(self, health_manager):
        """Test health check timeout"""
        def slow_check():
            import time
            time.sleep(2)
            return True, "Slow check completed"

        health_manager.add_check('slow', slow_check, timeout=1)
        result = health_manager.run_checks()

        assert result.status == HealthStatus.DEGRADED
        assert "timeout" in result.checks[0].message.lower()

    def test_composite_health_check(self, health_manager):
        """Test composite health check"""
        # Create composite check with multiple components
        components = {
            'web': lambda: (True, "Web OK"),
            'api': lambda: (True, "API OK"),
            'db': lambda: (False, "DB Error")
        }

        for name, check in components.items():
            health_manager.add_check(name, check)

        result = health_manager.run_checks()
        assert result.status == HealthStatus.DEGRADED
        assert len(result.checks) == len(components)
        assert any(not c.success for c in result.checks)

    def test_health_check_notifications(self, health_manager):
        """Test health check notifications"""
        notifications = []

        def notification_handler(status, message):
            notifications.append((status, message))

        health_manager.on_status_change(notification_handler)

        # Trigger status changes
        def failing_check():
            return False, "Service down"

        health_manager.add_check('failing', failing_check)
        health_manager.run_checks()

        assert len(notifications) == 1
        assert notifications[0][0] == HealthStatus.UNHEALTHY

    def test_health_metrics_aggregation(self, health_manager, metrics_check):
        """Test health metrics aggregation"""
        # Add multiple metric checks
        health_manager.add_metrics_check(metrics_check)
        health_manager.add_metrics_check(MetricsCheck(
            name='additional_metrics',
            thresholds={'custom_metric': 50}
        ))

        # Run checks and get aggregated metrics
        health_manager.run_checks()
        metrics = health_manager.get_aggregated_metrics()

        assert 'cpu_usage' in metrics
        assert 'memory_usage' in metrics
        assert 'custom_metric' in metrics

    def test_health_check_scheduling(self, health_manager):
        """Test health check scheduling"""
        check_runs = []

        def scheduled_check():
            check_runs.append(datetime.now())
            return True, "Scheduled check ran"

        # Schedule check
        health_manager.schedule_check(
            'scheduled',
            scheduled_check,
            interval=timedelta(seconds=1)
        )

        # Let it run a few times
        import time
        time.sleep(2.5)

        assert len(check_runs) >= 2
        for i in range(1, len(check_runs)):
            diff = check_runs[i] - check_runs[i-1]
            assert diff.total_seconds() >= 1

    def test_health_check_recovery(self, health_manager):
        """Test health check recovery handling"""
        failure_count = 0
        recovery_notifications = []

        def unstable_check():
            nonlocal failure_count
            failure_count += 1
            return failure_count > 2, "Service stabilizing"

        def on_recovery(check_name):
            recovery_notifications.append(check_name)

        health_manager.on_recovery(on_recovery)
        health_manager.add_check('unstable', unstable_check)

        # Run checks until recovery
        for _ in range(4):
            health_manager.run_checks()

        assert len(recovery_notifications) == 1
        assert recovery_notifications[0] == 'unstable'
