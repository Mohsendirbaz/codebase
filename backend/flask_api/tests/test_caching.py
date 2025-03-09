import pytest
import time
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..caching import (
    CacheManager,
    MemoryCache,
    RedisCache,
    CacheError,
    CacheKey,
    CachePolicy
)

class TestCaching:
    """Test caching utilities"""

    @pytest.fixture
    def cache_manager(self):
        """Create cache manager instance"""
        return CacheManager(
            config={
                'default_ttl': 300,
                'max_size': 1000,
                'eviction_policy': 'lru'
            }
        )

    @pytest.fixture
    def memory_cache(self):
        """Create memory cache instance"""
        return MemoryCache(
            max_size=100,
            ttl=60
        )

    @pytest.fixture
    def redis_cache(self):
        """Create Redis cache instance"""
        with patch('redis.Redis') as mock_redis:
            cache = RedisCache(
                host='localhost',
                port=6379,
                ttl=60
            )
            yield cache

    def test_basic_caching(self, cache_manager):
        """Test basic cache operations"""
        # Set cache entry
        cache_manager.set('test_key', 'test_value')
        
        # Get cache entry
        value = cache_manager.get('test_key')
        assert value == 'test_value'

        # Delete cache entry
        cache_manager.delete('test_key')
        assert cache_manager.get('test_key') is None

    def test_cache_expiration(self, memory_cache):
        """Test cache entry expiration"""
        # Set cache entry with short TTL
        memory_cache.set('expire_key', 'expire_value', ttl=1)
        
        # Verify value exists
        assert memory_cache.get('expire_key') == 'expire_value'
        
        # Wait for expiration
        time.sleep(1.1)
        assert memory_cache.get('expire_key') is None

    def test_cache_policy(self, cache_manager):
        """Test cache policies"""
        policy = CachePolicy(
            max_size=2,
            eviction='lru'
        )
        cache_manager.set_policy(policy)

        # Fill cache
        cache_manager.set('key1', 'value1')
        cache_manager.set('key2', 'value2')
        
        # Add another entry, should evict oldest
        cache_manager.set('key3', 'value3')
        
        assert cache_manager.get('key1') is None  # Evicted
        assert cache_manager.get('key2') == 'value2'
        assert cache_manager.get('key3') == 'value3'

    def test_cache_decorators(self, cache_manager):
        """Test cache decorators"""
        call_count = 0

        @cache_manager.cached(ttl=60)
        def expensive_operation(param):
            nonlocal call_count
            call_count += 1
            return f"result_{param}"

        # First call should execute
        result1 = expensive_operation("test")
        assert result1 == "result_test"
        assert call_count == 1

        # Second call should use cache
        result2 = expensive_operation("test")
        assert result2 == "result_test"
        assert call_count == 1  # No additional execution

    def test_redis_cache(self, redis_cache):
        """Test Redis cache implementation"""
        with patch('redis.Redis') as mock_redis:
            instance = mock_redis.return_value
            instance.get.return_value = b'"test_value"'
            instance.set.return_value = True

            # Set and get cache entry
            redis_cache.set('redis_key', 'test_value')
            value = redis_cache.get('redis_key')

            assert value == 'test_value'
            instance.set.assert_called_once()
            instance.get.assert_called_once_with('redis_key')

    def test_cache_invalidation(self, cache_manager):
        """Test cache invalidation"""
        # Set multiple cache entries
        cache_manager.set('key1', 'value1', tags=['tag1'])
        cache_manager.set('key2', 'value2', tags=['tag1'])
        cache_manager.set('key3', 'value3', tags=['tag2'])

        # Invalidate by tag
        cache_manager.invalidate_by_tag('tag1')

        assert cache_manager.get('key1') is None
        assert cache_manager.get('key2') is None
        assert cache_manager.get('key3') == 'value3'

    def test_cache_statistics(self, cache_manager):
        """Test cache statistics collection"""
        # Perform cache operations
        cache_manager.set('stats_key1', 'value1')
        cache_manager.get('stats_key1')  # Hit
        cache_manager.get('nonexistent')  # Miss

        # Get statistics
        stats = cache_manager.get_statistics()
        
        assert stats['hits'] == 1
        assert stats['misses'] == 1
        assert stats['size'] == 1

    def test_cache_serialization(self, cache_manager):
        """Test cache value serialization"""
        # Test complex object
        test_obj = {
            'number': 42,
            'string': 'test',
            'datetime': datetime.now(),
            'list': [1, 2, 3]
        }

        # Cache object
        cache_manager.set('complex_key', test_obj)
        
        # Retrieve object
        cached_obj = cache_manager.get('complex_key')
        assert cached_obj['number'] == test_obj['number']
        assert cached_obj['string'] == test_obj['string']
        assert isinstance(cached_obj['datetime'], datetime)
        assert cached_obj['list'] == test_obj['list']

    def test_cache_middleware(self, cache_manager):
        """Test cache middleware"""
        @cache_manager.cached_response(ttl=60)
        def api_response():
            return {'data': 'test_response'}

        # First call
        response1 = api_response()
        assert response1['data'] == 'test_response'

        # Cached call
        response2 = api_response()
        assert response2['data'] == 'test_response'
        assert response2 is response1  # Same object reference

    def test_cache_patterns(self, cache_manager):
        """Test cache key patterns"""
        # Set values with pattern
        cache_manager.set('user:1:profile', 'profile1')
        cache_manager.set('user:2:profile', 'profile2')
        cache_manager.set('user:1:settings', 'settings1')

        # Find keys by pattern
        user1_keys = cache_manager.find_keys('user:1:*')
        assert len(user1_keys) == 2
        assert 'user:1:profile' in user1_keys
        assert 'user:1:settings' in user1_keys

    def test_cache_bulk_operations(self, cache_manager):
        """Test bulk cache operations"""
        # Bulk set
        items = {
            'bulk1': 'value1',
            'bulk2': 'value2',
            'bulk3': 'value3'
        }
        cache_manager.set_many(items)

        # Bulk get
        results = cache_manager.get_many(['bulk1', 'bulk2', 'bulk3'])
        assert len(results) == 3
        assert all(key in results for key in items)

        # Bulk delete
        cache_manager.delete_many(['bulk1', 'bulk2'])
        assert cache_manager.get('bulk1') is None
        assert cache_manager.get('bulk3') == 'value3'

    def test_cache_events(self, cache_manager):
        """Test cache events"""
        events = []

        def event_handler(event):
            events.append(event)

        cache_manager.on_eviction(event_handler)

        # Fill cache to trigger eviction
        for i in range(1000):
            cache_manager.set(f'event_key_{i}', f'value_{i}')

        assert len(events) > 0
        assert 'key' in events[0]
        assert 'reason' in events[0]

    def test_cache_persistence(self, cache_manager):
        """Test cache persistence"""
        # Set cache entries
        cache_manager.set('persist1', 'value1')
        cache_manager.set('persist2', 'value2')

        # Save cache state
        cache_manager.save_state('/tmp/cache.dump')

        # Clear cache
        cache_manager.clear()
        assert cache_manager.get('persist1') is None

        # Restore cache state
        cache_manager.load_state('/tmp/cache.dump')
        assert cache_manager.get('persist1') == 'value1'
        assert cache_manager.get('persist2') == 'value2'
