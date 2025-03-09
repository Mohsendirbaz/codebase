import pytest
import gzip
import zlib
import lzma
import json
from io import BytesIO
from unittest.mock import Mock, patch
from ..compression import (
    CompressionManager,
    GzipCompressor,
    DeflateCompressor,
    LZMACompressor,
    CompressionError,
    CompressionLevel
)

class TestCompression:
    """Test compression utilities"""

    @pytest.fixture
    def compression_manager(self):
        """Create compression manager instance"""
        return CompressionManager(
            config={
                'default_algorithm': 'gzip',
                'compression_level': CompressionLevel.BALANCED,
                'min_size': 1024  # Only compress if size > 1KB
            }
        )

    @pytest.fixture
    def gzip_compressor(self):
        """Create gzip compressor instance"""
        return GzipCompressor(
            compression_level=6
        )

    @pytest.fixture
    def sample_data(self):
        """Create sample data for compression tests"""
        return {
            'text': 'A' * 1000,  # Highly compressible
            'numbers': list(range(1000)),
            'nested': {
                'key1': 'value1' * 100,
                'key2': 'value2' * 100
            }
        }

    def test_basic_compression(self, compression_manager, sample_data):
        """Test basic compression functionality"""
        # Compress data
        data = json.dumps(sample_data).encode('utf-8')
        compressed = compression_manager.compress(data)

        # Verify compression
        assert len(compressed) < len(data)

        # Decompress and verify
        decompressed = compression_manager.decompress(compressed)
        assert json.loads(decompressed.decode('utf-8')) == sample_data

    def test_gzip_compression(self, gzip_compressor):
        """Test gzip compression"""
        # Test data
        data = b'test data' * 1000

        # Compress
        compressed = gzip_compressor.compress(data)
        assert len(compressed) < len(data)

        # Decompress
        decompressed = gzip_compressor.decompress(compressed)
        assert decompressed == data

        # Verify gzip format
        assert compressed.startswith(b'\x1f\x8b')  # gzip magic number

    def test_compression_levels(self, compression_manager):
        """Test different compression levels"""
        data = b'test data' * 1000

        # Test different compression levels
        sizes = {}
        for level in [CompressionLevel.FAST, CompressionLevel.BALANCED, CompressionLevel.MAX]:
            compression_manager.set_compression_level(level)
            compressed = compression_manager.compress(data)
            sizes[level] = len(compressed)

        # Higher compression levels should generally yield smaller sizes
        assert sizes[CompressionLevel.MAX] <= sizes[CompressionLevel.BALANCED]
        assert sizes[CompressionLevel.BALANCED] <= sizes[CompressionLevel.FAST]

    def test_streaming_compression(self, gzip_compressor):
        """Test streaming compression"""
        # Create sample stream
        stream = BytesIO()
        
        # Write compressed data in chunks
        with gzip_compressor.compress_stream(stream) as compressor:
            for i in range(10):
                chunk = f'chunk{i}'.encode('utf-8') * 100
                compressor.write(chunk)

        # Read and decompress
        stream.seek(0)
        decompressed = gzip_compressor.decompress(stream.read())
        
        assert b'chunk0' in decompressed
        assert b'chunk9' in decompressed

    def test_compression_threshold(self, compression_manager):
        """Test compression threshold"""
        small_data = b'small'  # Below threshold
        large_data = b'large' * 1000  # Above threshold

        # Small data shouldn't be compressed
        result_small = compression_manager.compress_if_beneficial(small_data)
        assert result_small == small_data  # Unchanged

        # Large data should be compressed
        result_large = compression_manager.compress_if_beneficial(large_data)
        assert len(result_large) < len(large_data)

    def test_multiple_algorithms(self, compression_manager):
        """Test different compression algorithms"""
        data = b'test data' * 1000

        # Test with different algorithms
        algorithms = ['gzip', 'deflate', 'lzma']
        results = {}

        for algo in algorithms:
            compression_manager.set_algorithm(algo)
            compressed = compression_manager.compress(data)
            decompressed = compression_manager.decompress(compressed)
            
            results[algo] = {
                'compressed_size': len(compressed),
                'decompressed': decompressed
            }

        # Verify all algorithms work
        for algo in algorithms:
            assert results[algo]['decompressed'] == data

    def test_compression_headers(self, compression_manager):
        """Test compression headers handling"""
        data = b'test data' * 1000

        # Compress with headers
        compressed = compression_manager.compress(
            data,
            include_headers=True
        )

        # Extract algorithm from header
        algorithm = compression_manager.get_algorithm_from_header(compressed)
        assert algorithm == compression_manager.default_algorithm

        # Decompress using header information
        decompressed = compression_manager.decompress_with_headers(compressed)
        assert decompressed == data

    def test_compression_error_handling(self, compression_manager):
        """Test compression error handling"""
        # Test invalid data
        with pytest.raises(CompressionError):
            compression_manager.decompress(b'invalid compressed data')

        # Test invalid algorithm
        with pytest.raises(CompressionError):
            compression_manager.set_algorithm('invalid_algorithm')

    def test_parallel_compression(self, compression_manager):
        """Test parallel compression"""
        data_chunks = [b'chunk' * 1000 for _ in range(10)]

        # Compress chunks in parallel
        compressed_chunks = compression_manager.compress_parallel(data_chunks)
        assert len(compressed_chunks) == len(data_chunks)
        assert all(len(c) < len(d) for c, d in zip(compressed_chunks, data_chunks))

        # Decompress in parallel
        decompressed_chunks = compression_manager.decompress_parallel(compressed_chunks)
        assert decompressed_chunks == data_chunks

    def test_compression_dictionary(self, compression_manager):
        """Test compression with dictionary"""
        # Create dictionary from sample data
        dictionary = compression_manager.create_dictionary([
            b'common phrase 1',
            b'common phrase 2',
            b'common phrase 3'
        ])

        # Compress with dictionary
        data = b'common phrase 1 and common phrase 2'
        compressed_with_dict = compression_manager.compress_with_dictionary(
            data,
            dictionary
        )
        compressed_without_dict = compression_manager.compress(data)

        # Should be more efficient with dictionary
        assert len(compressed_with_dict) < len(compressed_without_dict)

    def test_adaptive_compression(self, compression_manager):
        """Test adaptive compression"""
        # Configure adaptive compression
        compression_manager.enable_adaptive_compression(
            min_ratio=0.8,
            fallback_algorithm='deflate'
        )

        # Test with highly compressible data
        compressible = b'a' * 1000
        compressed = compression_manager.compress(compressible)
        assert len(compressed) < len(compressible) * 0.8

        # Test with incompressible data (random bytes)
        import os
        incompressible = os.urandom(1000)
        result = compression_manager.compress(incompressible)
        # Should use fallback algorithm or minimal compression
        assert len(result) <= len(incompressible) * 1.1

    def test_compression_stats(self, compression_manager):
        """Test compression statistics"""
        data = b'test data' * 1000

        # Compress with stats
        stats = compression_manager.compress_with_stats(data)

        assert 'original_size' in stats
        assert 'compressed_size' in stats
        assert 'compression_ratio' in stats
        assert 'algorithm' in stats
        assert 'compression_time' in stats
        assert stats['compression_ratio'] < 1.0
