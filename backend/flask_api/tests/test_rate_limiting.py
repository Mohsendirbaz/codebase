import pytest
import time
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..rate_limiting import (
    RateLimiter,
    TokenBucket,
    SlidingWindow,
    RateLimitError,
    RateLimitStore,
    LimitRule
)

class TestRateLimiting:
    """Test rate limiting utilities"""

    @pytest.fixture
    def rate_limiter(self):
        """Create rate limiter instance"""
        return RateLimiter(
            config={
                'default_limit': 100,
                'window_size': 3600,
                'store_type': 'memory'
            }
        )

    @pytest.fixture
    def token_bucket(self):
        """Create token bucket instance"""
        return TokenBucket(
            capacity=10,
            refill_rate=1,
            refill_time=1  # 1 token per second
        )

    @pytest.fixture
    def sliding_window(self):
        """Create sliding window instance"""
        return SlidingWindow(
            window_size=60,  # 60 seconds
            max_requests=30
        )

    def test_basic_rate_limiting(self, rate_limiter):
        """Test basic rate limiting functionality"""
        client_id = 'test_client'
        
        # Make requests within limit
        for _ in range(5):
            assert rate_limiter.allow_request(client_id)

        # Verify request count
        assert rate_limiter.get_request_count(client_id) == 5

    def test_token_bucket_algorithm(self, token_bucket):
        """Test token bucket rate limiting algorithm"""
        # Initial tokens should be at capacity
        assert token_bucket.tokens == 10

        # Use some tokens
        for _ in range(5):
            assert token_bucket.consume()
        assert token_bucket.tokens == 5

        # Wait for refill
        time.sleep(2)
        assert token_bucket.tokens > 5

    def test_sliding_window_algorithm(self, sliding_window):
        """Test sliding window rate limiting algorithm"""
        client_id = 'test_client'
        now = datetime.now()

        # Add requests in current window
        for _ in range(15):
            sliding_window.add_request(client_id, now)

        # Check request count
        count = sliding_window.get_request_count(client_id, now)
        assert count == 15

        # Move window forward
        future = now + timedelta(seconds=30)
        count = sliding_window.get_request_count(client_id, future)
        assert count < 15  # Some requests should have expired

    def test_rate_limit_rules(self, rate_limiter):
        """Test rate limit rules configuration"""
        # Configure rules
        rules = [
            LimitRule(
                name='api_basic',
                requests=100,
                window=3600,
                pattern=r'/api/v1/.*'
            ),
            LimitRule(
                name='api_strict',
                requests=10,
                window=60,
                pattern=r'/api/v1/sensitive/.*'
            )
        ]
        rate_limiter.set_rules(rules)

        # Test rule matching
        assert rate_limiter.get_matching_rule('/api/v1/users').name == 'api_basic'
        assert rate_limiter.get_matching_rule('/api/v1/sensitive/data').name == 'api_strict'

    def test_rate_limit_store(self):
        """Test rate limit storage"""
        store = RateLimitStore()
        client_id = 'test_client'
        window_start = datetime.now()

        # Store requests
        store.add_request(client_id, window_start)
        store.add_request(client_id, window_start + timedelta(seconds=1))

        # Get request count
        count = store.get_request_count(client_id, window_start, timedelta(seconds=60))
        assert count == 2

        # Clean old requests
        store.cleanup(window_start + timedelta(minutes=5))
        count = store.get_request_count(client_id, window_start, timedelta(seconds=60))
        assert count == 0

    def test_rate_limit_exceeded(self, rate_limiter):
        """Test rate limit exceeded handling"""
        client_id = 'test_client'
        rate_limiter.set_limit(client_id, max_requests=5, window=60)

        # Use up limit
        for _ in range(5):
            assert rate_limiter.allow_request(client_id)

        # Next request should be denied
        with pytest.raises(RateLimitError) as exc_info:
            rate_limiter.allow_request(client_id)
        assert "Rate limit exceeded" in str(exc_info.value)

    def test_rate_limit_reset(self, rate_limiter):
        """Test rate limit reset functionality"""
        client_id = 'test_client'
        
        # Use some requests
        for _ in range(5):
            rate_limiter.allow_request(client_id)

        # Reset limits
        rate_limiter.reset_limits(client_id)
        assert rate_limiter.get_request_count(client_id) == 0

    def test_distributed_rate_limiting(self, rate_limiter):
        """Test distributed rate limiting"""
        with patch('redis.Redis') as mock_redis:
            mock_redis.return_value.incr.return_value = 1
            mock_redis.return_value.expire.return_value = True

            # Configure distributed store
            rate_limiter.use_distributed_store(
                store_type='redis',
                connection_params={'host': 'localhost', 'port': 6379}
            )

            # Test rate limiting
            client_id = 'test_client'
            assert rate_limiter.allow_request(client_id)
            mock_redis.return_value.incr.assert_called_once()

    def test_rate_limit_groups(self, rate_limiter):
        """Test rate limit groups"""
        # Configure group limits
        rate_limiter.set_group_limit(
            'premium_users',
            max_requests=1000,
            window=3600
        )
        rate_limiter.set_group_limit(
            'basic_users',
            max_requests=100,
            window=3600
        )

        # Add users to groups
        rate_limiter.add_to_group('user1', 'premium_users')
        rate_limiter.add_to_group('user2', 'basic_users')

        # Test limits
        assert rate_limiter.get_limit('user1')['max_requests'] == 1000
        assert rate_limiter.get_limit('user2')['max_requests'] == 100

    def test_rate_limit_bursting(self, token_bucket):
        """Test rate limit bursting behavior"""
        # Initial burst
        burst_success = all(token_bucket.consume() for _ in range(10))
        assert burst_success

        # Should be depleted
        assert not token_bucket.consume()

        # Wait for partial refill
        time.sleep(2)
        assert token_bucket.consume()  # Should have at least 2 tokens

    def test_rate_limit_headers(self, rate_limiter):
        """Test rate limit header generation"""
        client_id = 'test_client'
        rate_limiter.set_limit(client_id, max_requests=10, window=60)

        # Use some requests
        for _ in range(3):
            rate_limiter.allow_request(client_id)

        # Get headers
        headers = rate_limiter.get_rate_limit_headers(client_id)
        
        assert 'X-RateLimit-Limit' in headers
        assert headers['X-RateLimit-Limit'] == '10'
        assert 'X-RateLimit-Remaining' in headers
        assert headers['X-RateLimit-Remaining'] == '7'
        assert 'X-RateLimit-Reset' in headers

    def test_rate_limit_monitoring(self, rate_limiter):
        """Test rate limit monitoring"""
        events = []

        def limit_handler(event):
            events.append(event)

        rate_limiter.on_limit_exceeded(limit_handler)

        # Trigger limit exceeded
        client_id = 'test_client'
        rate_limiter.set_limit(client_id, max_requests=1, window=60)
        
        rate_limiter.allow_request(client_id)  # First request ok
        try:
            rate_limiter.allow_request(client_id)  # Second request exceeds
        except RateLimitError:
            pass

        assert len(events) == 1
        assert events[0]['client_id'] == client_id
        assert 'timestamp' in events[0]

    def test_dynamic_rate_limiting(self, rate_limiter):
        """Test dynamic rate limit adjustment"""
        client_id = 'test_client'
        
        # Start with basic limit
        rate_limiter.set_limit(client_id, max_requests=10, window=60)

        # Simulate high error rate
        for _ in range(5):
            rate_limiter.record_error(client_id)

        # Limit should be reduced
        rate_limiter.adjust_limits_by_error_rate(threshold=0.3)
        new_limit = rate_limiter.get_limit(client_id)
        assert new_limit['max_requests'] < 10
