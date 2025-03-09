import pytest
import time
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..retry import (
    RetryManager,
    RetryStrategy,
    RetryPolicy,
    RetryError,
    BackoffStrategy,
    CircuitBreaker
)

class TestRetry:
    """Test retry utilities"""

    @pytest.fixture
    def retry_manager(self):
        """Create retry manager instance"""
        return RetryManager(
            config={
                'default_max_attempts': 3,
                'default_delay': 1,
                'default_backoff': 'exponential',
                'jitter': True
            }
        )

    @pytest.fixture
    def retry_strategy(self):
        """Create retry strategy instance"""
        return RetryStrategy(
            max_attempts=3,
            delay=0.1,
            exceptions=[ValueError, ConnectionError]
        )

    @pytest.fixture
    def circuit_breaker(self):
        """Create circuit breaker instance"""
        return CircuitBreaker(
            failure_threshold=3,
            reset_timeout=1,
            half_open_timeout=0.5
        )

    def test_basic_retry(self, retry_manager):
        """Test basic retry functionality"""
        attempts = []

        def flaky_operation():
            attempts.append(datetime.now())
            if len(attempts) < 3:
                raise ValueError("Temporary failure")
            return "success"

        # Execute with retry
        result = retry_manager.execute(
            flaky_operation,
            max_attempts=3,
            delay=0.1
        )

        assert result == "success"
        assert len(attempts) == 3

    def test_retry_backoff(self, retry_manager):
        """Test retry backoff strategies"""
        attempts = []

        def failing_operation():
            attempts.append(datetime.now())
            raise ValueError("Always fails")

        # Test exponential backoff
        with pytest.raises(RetryError):
            retry_manager.execute(
                failing_operation,
                max_attempts=3,
                backoff=BackoffStrategy.EXPONENTIAL,
                base_delay=0.1
            )

        # Verify increasing delays
        delays = [
            (attempts[i+1] - attempts[i]).total_seconds()
            for i in range(len(attempts)-1)
        ]
        assert delays[1] > delays[0]  # Second delay should be longer

    def test_retry_conditions(self, retry_strategy):
        """Test retry conditions"""
        successes = []
        failures = []

        def conditional_operation(should_succeed):
            if should_succeed:
                successes.append(datetime.now())
                return "success"
            failures.append(datetime.now())
            raise ValueError("Expected failure")

        # Test successful case
        result = retry_strategy.execute(
            lambda: conditional_operation(True)
        )
        assert result == "success"
        assert len(successes) == 1
        assert len(failures) == 0

        # Test failure case
        with pytest.raises(RetryError):
            retry_strategy.execute(
                lambda: conditional_operation(False)
            )
        assert len(failures) == 3  # Max attempts

    def test_circuit_breaker(self, circuit_breaker):
        """Test circuit breaker functionality"""
        def unstable_operation():
            if circuit_breaker.failure_count >= 3:
                return "recovered"
            raise ConnectionError("Service unavailable")

        # Trigger circuit breaker
        for _ in range(3):
            try:
                circuit_breaker.execute(unstable_operation)
            except ConnectionError:
                pass

        assert circuit_breaker.state == 'open'

        # Wait for reset timeout
        time.sleep(1.1)
        
        # Should be in half-open state
        assert circuit_breaker.state == 'half-open'

        # Successful operation should close circuit
        result = circuit_breaker.execute(lambda: "success")
        assert result == "success"
        assert circuit_breaker.state == 'closed'

    def test_retry_with_fallback(self, retry_manager):
        """Test retry with fallback functionality"""
        def main_operation():
            raise ValueError("Main operation failed")

        def fallback_operation():
            return "fallback"

        # Execute with fallback
        result = retry_manager.execute_with_fallback(
            main_operation,
            fallback_operation,
            max_attempts=2
        )

        assert result == "fallback"

    def test_retry_decorators(self, retry_manager):
        """Test retry decorators"""
        attempts = []

        @retry_manager.retry(max_attempts=3, delay=0.1)
        def decorated_operation():
            attempts.append(datetime.now())
            if len(attempts) < 3:
                raise ValueError("Temporary failure")
            return "success"

        result = decorated_operation()
        assert result == "success"
        assert len(attempts) == 3

    def test_retry_async(self, retry_manager):
        """Test async retry functionality"""
        import asyncio

        async def async_operation():
            await asyncio.sleep(0.1)
            raise ValueError("Async failure")

        # Execute async operation with retry
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        with pytest.raises(RetryError):
            loop.run_until_complete(
                retry_manager.execute_async(
                    async_operation,
                    max_attempts=2
                )
            )

    def test_retry_events(self, retry_manager):
        """Test retry event handling"""
        events = []

        def event_handler(event):
            events.append(event)

        retry_manager.on_retry(event_handler)

        def failing_operation():
            raise ValueError("Operation failed")

        # Execute with retry
        with pytest.raises(RetryError):
            retry_manager.execute(
                failing_operation,
                max_attempts=2
            )

        assert len(events) == 2
        assert all(e['type'] == 'retry' for e in events)
        assert all('attempt' in e for e in events)

    def test_retry_timeout(self, retry_manager):
        """Test retry timeout functionality"""
        def slow_operation():
            time.sleep(0.5)
            return "completed"

        # Execute with timeout
        with pytest.raises(RetryError) as exc_info:
            retry_manager.execute(
                slow_operation,
                max_attempts=2,
                timeout=0.1
            )
        assert "timeout" in str(exc_info.value).lower()

    def test_retry_statistics(self, retry_manager):
        """Test retry statistics collection"""
        def flaky_operation():
            if retry_manager.stats['attempts'] < 2:
                raise ValueError("Temporary failure")
            return "success"

        # Execute with stats collection
        result = retry_manager.execute(
            flaky_operation,
            max_attempts=3,
            collect_stats=True
        )

        assert result == "success"
        assert retry_manager.stats['attempts'] == 3
        assert retry_manager.stats['failures'] == 2
        assert retry_manager.stats['success'] == 1

    def test_custom_retry_strategy(self, retry_manager):
        """Test custom retry strategy"""
        class CustomStrategy(RetryStrategy):
            def should_retry(self, attempt, exception):
                return attempt < 2 and isinstance(exception, ValueError)

            def get_delay(self, attempt):
                return 0.1 * attempt

        strategy = CustomStrategy()
        attempts = []

        def test_operation():
            attempts.append(datetime.now())
            raise ValueError("Test failure")

        # Execute with custom strategy
        with pytest.raises(RetryError):
            retry_manager.execute(
                test_operation,
                strategy=strategy
            )

        assert len(attempts) == 2
