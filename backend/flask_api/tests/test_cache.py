import pytest
import time
from datetime import datetime, timedelta
from ..cache import (
    Cache,
    CacheError,
    MemoryCache,
    RedisCache,
    CacheKey,
    cache_decorator
)

class TestCache:
    """Test caching utilities"""

    @pytest.fixture
    def memory_cache(self):
        """Create memory cache instance"""
        return MemoryCache()

    @pytest.fixture
    def redis_cache(self):
        """Create Redis cache instance"""
        return RedisCache(host='localhost', port=6379, db=0)

    def test_memory_cache_operations(self, memory_cache):
        """Test basic memory cache operations"""
        # Test set and get
        memory_cache.set('test_key', 'test_value')
        assert memory_cache.get('test_key') == 'test_value'

        # Test missing key
        assert memory_cache.get('nonexistent') is None

        # Test default value
        assert memory_cache.get('nonexistent', 'default') == 'default'

        # Test expiration
        memory_cache.set('expire_key', 'expire_value', expire=1)
        assert memory_cache.get('expire_key') == 'expire_value'
        time.sleep(1.1)
        assert memory_cache.get('expire_key') is None

    def test_redis_cache_operations(self, redis_cache):
        """Test basic Redis cache operations"""
        # Test set and get
        redis_cache.set('test_key', 'test_value')
        assert redis_cache.get('test_key') == 'test_value'

        # Test missing key
        assert redis_cache.get('nonexistent') is None

        # Test default value
        assert redis_cache.get('nonexistent', 'default') == 'default'

        # Test expiration
        redis_cache.set('expire_key', 'expire_value', expire=1)
        assert redis_cache.get('expire_key') == 'expire_value'
        time.sleep(1.1)
        assert redis_cache.get('expire_key') is None

    def test_cache_complex_types(self, memory_cache):
        """Test caching of complex data types"""
        # Test dictionary
        data_dict = {'key': 'value', 'nested': {'inner': 'value'}}
        memory_cache.set('dict_key', data_dict)
        assert memory_cache.get('dict_key') == data_dict

        # Test list
        data_list = [1, 2, {'key': 'value'}]
        memory_cache.set('list_key', data_list)
        assert memory_cache.get('list_key') == data_list

        # Test datetime
        now = datetime.now()
        memory_cache.set('date_key', now)
        assert memory_cache.get('date_key') == now

        # Test custom object
        class TestObject:
            def __init__(self, value):
                self.value = value
            
            def __eq__(self, other):
                return isinstance(other, TestObject) and self.value == other.value

        obj = TestObject('test')
        memory_cache.set('obj_key', obj)
        assert memory_cache.get('obj_key') == obj

    def test_cache_key_generation(self):
        """Test cache key generation"""
        # Test basic key
        key1 = CacheKey('prefix', 'value')
        assert str(key1) == 'prefix:value'

        # Test multiple parts
        key2 = CacheKey('prefix', 'part1', 'part2')
        assert str(key2) == 'prefix:part1:part2'

        # Test with different types
        key3 = CacheKey('prefix', 123, True)
        assert str(key3) == 'prefix:123:true'

        # Test with None
        key4 = CacheKey('prefix', None)
        assert str(key4) == 'prefix:none'

    def test_cache_decorator(self, memory_cache):
        """Test cache decorator"""
        call_count = 0

        @cache_decorator(memory_cache, expire=10)
        def expensive_function(arg1, arg2):
            nonlocal call_count
            call_count += 1
            return arg1 + arg2

        # First call should execute function
        result1 = expensive_function(1, 2)
        assert result1 == 3
        assert call_count == 1

        # Second call should use cache
        result2 = expensive_function(1, 2)
        assert result2 == 3
        assert call_count == 1  # Shouldn't increment

        # Different arguments should execute function
        result3 = expensive_function(2, 3)
        assert result3 == 5
        assert call_count == 2

    def test_cache_clear(self, memory_cache):
        """Test cache clearing"""
        # Set multiple values
        memory_cache.set('key1', 'value1')
        memory_cache.set('key2', 'value2')
        memory_cache.set('other_key', 'value3')

        # Clear specific pattern
        memory_cache.clear('key*')
        assert memory_cache.get('key1') is None
        assert memory_cache.get('key2') is None
        assert memory_cache.get('other_key') == 'value3'

        # Clear all
        memory_cache.clear()
        assert memory_cache.get('other_key') is None

    def test_cache_multi_operations(self, memory_cache):
        """Test multi-key operations"""
        # Set multiple
        items = {
            'key1': 'value1',
            'key2': 'value2',
            'key3': 'value3'
        }
        memory_cache.set_many(items)

        # Get multiple
        results = memory_cache.get_many(['key1', 'key2', 'nonexistent'])
        assert results == {
            'key1': 'value1',
            'key2': 'value2',
            'nonexistent': None
        }

        # Delete multiple
        memory_cache.delete_many(['key1', 'key3'])
        assert memory_cache.get('key1') is None
        assert memory_cache.get('key2') == 'value2'
        assert memory_cache.get('key3') is None

    def test_cache_error_handling(self, memory_cache):
        """Test cache error handling"""
        # Test invalid expiration
        with pytest.raises(CacheError):
            memory_cache.set('key', 'value', expire=-1)

        # Test invalid key type
        with pytest.raises(CacheError):
            memory_cache.set(123, 'value')  # Key must be string

        # Test serialization error
        class UnserializableObject:
            def __getstate__(self):
                raise TypeError("Cannot serialize")

        with pytest.raises(CacheError):
            memory_cache.set('key', UnserializableObject())

    def test_cache_statistics(self, memory_cache):
        """Test cache statistics"""
        # Record initial stats
        initial_stats = memory_cache.stats()

        # Perform operations
        memory_cache.set('key1', 'value1')
        memory_cache.get('key1')
        memory_cache.get('nonexistent')
        memory_cache.set('key2', 'value2', expire=1)
        time.sleep(1.1)  # Let key2 expire
        memory_cache.get('key2')

        # Check updated stats
        stats = memory_cache.stats()
        assert stats['sets'] == initial_stats['sets'] + 2
        assert stats['hits'] == initial_stats['hits'] + 1
        assert stats['misses'] == initial_stats['misses'] + 2
        assert stats['expired'] == initial_stats['expired'] + 1

    def test_cache_namespacing(self, memory_cache):
        """Test cache namespacing"""
        # Create namespaced keys
        ns1 = CacheKey('namespace1')
        ns2 = CacheKey('namespace2')

        # Set values in different namespaces
        memory_cache.set(ns1('key'), 'value1')
        memory_cache.set(ns2('key'), 'value2')

        # Values should be separate
        assert memory_cache.get(ns1('key')) == 'value1'
        assert memory_cache.get(ns2('key')) == 'value2'

        # Clear one namespace
        memory_cache.clear(ns1('*'))
        assert memory_cache.get(ns1('key')) is None
        assert memory_cache.get(ns2('key')) == 'value2'

    def test_cache_concurrency(self, memory_cache):
        """Test concurrent cache access"""
        import threading
        import queue

        results = queue.Queue()
        
        def worker(worker_id):
            try:
                # Each worker sets and gets its own key
                key = f'worker_{worker_id}'
                memory_cache.set(key, worker_id)
                value = memory_cache.get(key)
                assert value == worker_id
                results.put(True)
            except Exception as e:
                results.put(e)

        # Start multiple threads
        threads = []
        for i in range(10):
            thread = threading.Thread(target=worker, args=(i,))
            thread.start()
            threads.append(thread)

        # Wait for all threads
        for thread in threads:
            thread.join()

        # Check results
        while not results.empty():
            result = results.get()
            assert result is True
