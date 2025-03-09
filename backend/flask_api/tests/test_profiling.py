import pytest
import time
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..profiling import (
    ProfilingManager,
    FunctionProfiler,
    MemoryProfiler,
    DatabaseProfiler,
    ProfilingError,
    ProfilingReport
)

class TestProfiling:
    """Test profiling utilities"""

    @pytest.fixture
    def profiling_manager(self):
        """Create profiling manager instance"""
        return ProfilingManager(
            config={
                'enabled': True,
                'sample_rate': 1.0,
                'trace_limit': 1000
            }
        )

    @pytest.fixture
    def function_profiler(self):
        """Create function profiler instance"""
        return FunctionProfiler(
            stats_path='/tmp/profile_stats'
        )

    @pytest.fixture
    def memory_profiler(self):
        """Create memory profiler instance"""
        return MemoryProfiler(
            threshold_mb=100
        )

    def test_function_profiling(self, function_profiler):
        """Test function execution profiling"""
        @function_profiler.profile
        def test_function():
            time.sleep(0.1)
            return "test result"

        # Execute profiled function
        result = test_function()
        stats = function_profiler.get_stats()

        assert result == "test result"
        assert 'test_function' in stats
        assert stats['test_function']['calls'] == 1
        assert stats['test_function']['time'] >= 0.1

    def test_memory_profiling(self, memory_profiler):
        """Test memory usage profiling"""
        @memory_profiler.profile
        def memory_intensive():
            # Simulate memory usage
            large_list = [0] * 1000000
            return len(large_list)

        # Execute and profile
        with memory_profiler.snapshot():
            result = memory_intensive()

        snapshot = memory_profiler.get_snapshot()
        assert result == 1000000
        assert snapshot['peak_memory'] > 0
        assert 'memory_intensive' in snapshot['allocations']

    def test_database_profiling(self):
        """Test database query profiling"""
        profiler = DatabaseProfiler()

        # Mock database query
        with patch('sqlalchemy.create_engine') as mock_engine:
            mock_engine.execute.return_value.elapsed = 0.1

            with profiler.profile_query() as query:
                query.execute("SELECT * FROM users")

            stats = profiler.get_query_stats()
            assert len(stats['queries']) == 1
            assert stats['queries'][0]['elapsed'] >= 0.1

    def test_profiling_sampling(self, profiling_manager):
        """Test profiling sampling rates"""
        calls = 0

        @profiling_manager.profile(sample_rate=0.5)
        def sampled_function():
            nonlocal calls
            calls += 1

        # Execute multiple times
        for _ in range(100):
            sampled_function()

        stats = profiling_manager.get_stats()
        assert 20 <= len(stats['profiles']) <= 80  # Roughly 50% sampling
        assert calls == 100  # All calls executed

    def test_profiling_context(self, profiling_manager):
        """Test profiling context manager"""
        with profiling_manager.profile_block('test_block'):
            time.sleep(0.1)

        stats = profiling_manager.get_stats()
        assert 'test_block' in stats['blocks']
        assert stats['blocks']['test_block']['duration'] >= 0.1

    def test_trace_collection(self, profiling_manager):
        """Test execution trace collection"""
        def nested_function():
            time.sleep(0.05)

        @profiling_manager.trace
        def traced_function():
            time.sleep(0.05)
            nested_function()

        # Execute traced function
        traced_function()
        trace = profiling_manager.get_trace()

        assert len(trace) >= 2  # At least two function calls
        assert trace[0]['function'] == 'traced_function'
        assert any(t['function'] == 'nested_function' for t in trace)

    def test_memory_leak_detection(self, memory_profiler):
        """Test memory leak detection"""
        leaks = []
        
        def leak_detector(allocation):
            leaks.append(allocation)

        memory_profiler.on_leak(leak_detector)

        def leaky_function():
            # Simulate memory leak
            global_list = []
            for _ in range(1000):
                global_list.append([0] * 1000)

        memory_profiler.check_leaks(leaky_function)
        assert len(leaks) > 0
        assert all(leak['size'] > 0 for leak in leaks)

    def test_profiling_report(self, profiling_manager):
        """Test profiling report generation"""
        # Collect some profiling data
        with profiling_manager.profile_block('block1'):
            time.sleep(0.1)
        with profiling_manager.profile_block('block2'):
            time.sleep(0.2)

        # Generate report
        report = profiling_manager.generate_report()
        
        assert isinstance(report, ProfilingReport)
        assert len(report.blocks) == 2
        assert report.blocks['block2']['duration'] > report.blocks['block1']['duration']
        assert 'summary' in report.to_dict()

    def test_performance_threshold(self, profiling_manager):
        """Test performance threshold monitoring"""
        threshold_violations = []

        def threshold_handler(violation):
            threshold_violations.append(violation)

        profiling_manager.on_threshold_violation(threshold_handler)
        profiling_manager.set_threshold('test_operation', max_duration=0.1)

        with profiling_manager.profile_block('test_operation'):
            time.sleep(0.2)

        assert len(threshold_violations) == 1
        assert threshold_violations[0]['operation'] == 'test_operation'
        assert threshold_violations[0]['duration'] >= 0.2

    def test_profiling_export(self, profiling_manager):
        """Test profiling data export"""
        # Collect profiling data
        for i in range(3):
            with profiling_manager.profile_block(f'block_{i}'):
                time.sleep(0.1 * (i + 1))

        # Export data
        export_data = profiling_manager.export_data(
            start_time=datetime.now() - timedelta(minutes=1),
            format='json'
        )

        assert len(export_data['blocks']) == 3
        assert all('duration' in block for block in export_data['blocks'].values())
        assert 'metadata' in export_data

    def test_cpu_profiling(self, function_profiler):
        """Test CPU usage profiling"""
        def cpu_intensive():
            # Simulate CPU-intensive operation
            result = 0
            for i in range(1000000):
                result += i
            return result

        # Profile CPU usage
        with function_profiler.profile_cpu() as cpu_profile:
            cpu_intensive()

        stats = cpu_profile.get_stats()
        assert stats['cpu_percent'] > 0
        assert 'cpu_intensive' in stats['functions']

    def test_profiling_aggregation(self, profiling_manager):
        """Test profiling data aggregation"""
        # Collect multiple profiles
        for _ in range(5):
            with profiling_manager.profile_block('repeated_operation'):
                time.sleep(0.1)

        # Get aggregated stats
        stats = profiling_manager.get_aggregated_stats('repeated_operation')
        
        assert stats['count'] == 5
        assert stats['avg_duration'] >= 0.1
        assert 'min_duration' in stats
        assert 'max_duration' in stats
