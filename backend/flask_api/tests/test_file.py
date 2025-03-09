import pytest
import os
import json
import pandas as pd
from io import BytesIO
from werkzeug.datastructures import FileStorage

@pytest.mark.file
class TestFileOperations:
    """Test file upload, download, and transformation operations"""

    @pytest.fixture
    def test_csv(self):
        """Create a test CSV file"""
        data = pd.DataFrame({
            'A': range(1, 6),
            'B': range(10, 15),
            'C': ['a', 'b', 'c', 'd', 'e']
        })
        csv_buffer = BytesIO()
        data.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)
        return FileStorage(
            stream=csv_buffer,
            filename='test.csv',
            content_type='text/csv'
        )

    @pytest.fixture
    def test_json(self):
        """Create a test JSON file"""
        data = {
            'parameters': [
                {'id': 'param1', 'value': 10},
                {'id': 'param2', 'value': 20}
            ],
            'metadata': {
                'version': '1.0',
                'timestamp': '2025-03-09T00:00:00Z'
            }
        }
        json_buffer = BytesIO(json.dumps(data).encode())
        return FileStorage(
            stream=json_buffer,
            filename='test.json',
            content_type='application/json'
        )

    def test_file_upload(self, client, test_csv):
        """Test file upload endpoint"""
        response = client.post(
            '/file/upload',
            data={
                'file': test_csv,
                'metadata': json.dumps({
                    'description': 'Test CSV file',
                    'tags': ['test', 'csv']
                })
            },
            content_type='multipart/form-data'
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'filename' in data
        assert 'metadata' in data
        assert data['metadata']['original_filename'] == 'test.csv'

    def test_file_download(self, client, test_csv, upload_dir):
        """Test file download endpoint"""
        # First upload a file
        upload_response = client.post(
            '/file/upload',
            data={'file': test_csv},
            content_type='multipart/form-data'
        )
        upload_data = json.loads(upload_response.data)
        filename = upload_data['filename']

        # Then download it
        response = client.get(f'/file/download/{filename}')
        assert response.status_code == 200
        assert response.headers['Content-Type'] == 'text/csv'
        assert 'attachment' in response.headers['Content-Disposition']

    def test_file_transformation(self, client, test_csv):
        """Test file transformation endpoint"""
        transform_data = {
            'operations': [
                {
                    'type': 'filter',
                    'column': 'A',
                    'condition': 'greater_than',
                    'value': 2
                },
                {
                    'type': 'sort',
                    'column': 'B',
                    'ascending': True
                }
            ],
            'output_format': 'json'
        }

        response = client.post(
            '/file/transform',
            data={
                'file': test_csv,
                'transform_data': json.dumps(transform_data)
            },
            content_type='multipart/form-data'
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'output_filename' in data
        assert data['row_count'] > 0

    def test_file_list(self, client, test_csv, test_json):
        """Test file listing endpoint"""
        # Upload multiple files
        client.post(
            '/file/upload',
            data={'file': test_csv},
            content_type='multipart/form-data'
        )
        client.post(
            '/file/upload',
            data={'file': test_json},
            content_type='multipart/form-data'
        )

        # List files
        response = client.get('/file/list')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'files' in data
        assert len(data['files']) >= 2
        assert all('filename' in f for f in data['files'])
        assert all('size' in f for f in data['files'])

    def test_file_deletion(self, client, test_csv):
        """Test file deletion endpoint"""
        # First upload a file
        upload_response = client.post(
            '/file/upload',
            data={'file': test_csv},
            content_type='multipart/form-data'
        )
        upload_data = json.loads(upload_response.data)
        filename = upload_data['filename']

        # Then delete it
        response = client.delete(f'/file/delete/{filename}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'File deleted successfully'

        # Verify file is gone
        response = client.get(f'/file/download/{filename}')
        assert response.status_code == 404

    def test_invalid_file_type(self, client):
        """Test upload with invalid file type"""
        invalid_file = FileStorage(
            stream=BytesIO(b'invalid data'),
            filename='test.exe',
            content_type='application/octet-stream'
        )

        response = client.post(
            '/file/upload',
            data={'file': invalid_file},
            content_type='multipart/form-data'
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['code'] == 'INVALID_FILE_TYPE'

    def test_missing_file(self, client):
        """Test upload without file"""
        response = client.post(
            '/file/upload',
            data={},
            content_type='multipart/form-data'
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['code'] == 'FILE_MISSING'

    def test_complex_transformation(self, client, test_csv):
        """Test complex file transformation operations"""
        transform_data = {
            'operations': [
                {
                    'type': 'filter',
                    'column': 'A',
                    'condition': 'greater_than',
                    'value': 2
                },
                {
                    'type': 'aggregate',
                    'group_by': 'C',
                    'function': {
                        'B': 'mean'
                    }
                },
                {
                    'type': 'sort',
                    'column': 'B',
                    'ascending': False
                }
            ],
            'output_format': 'json'
        }

        response = client.post(
            '/file/transform',
            data={
                'file': test_csv,
                'transform_data': json.dumps(transform_data)
            },
            content_type='multipart/form-data'
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'output_filename' in data
        assert 'row_count' in data
        assert 'column_count' in data

    @pytest.mark.integration
    def test_large_file_handling(self, client):
        """Test handling of large files"""
        # Create a large DataFrame
        large_data = pd.DataFrame({
            'A': range(10000),
            'B': range(10000),
            'C': ['data'] * 10000
        })
        
        csv_buffer = BytesIO()
        large_data.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)
        
        large_file = FileStorage(
            stream=csv_buffer,
            filename='large_test.csv',
            content_type='text/csv'
        )

        # Test upload
        response = client.post(
            '/file/upload',
            data={'file': large_file},
            content_type='multipart/form-data'
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['metadata']['file_size'] > 100000  # Should be > 100KB

    @pytest.mark.integration
    def test_concurrent_operations(self, client, test_csv):
        """Test concurrent file operations"""
        import threading
        import queue

        results = queue.Queue()
        
        def upload_and_transform():
            try:
                # Upload
                upload_response = client.post(
                    '/file/upload',
                    data={'file': test_csv},
                    content_type='multipart/form-data'
                )
                assert upload_response.status_code == 200
                
                # Transform
                transform_data = {
                    'operations': [
                        {
                            'type': 'filter',
                            'column': 'A',
                            'condition': 'greater_than',
                            'value': 2
                        }
                    ],
                    'output_format': 'json'
                }
                
                transform_response = client.post(
                    '/file/transform',
                    data={
                        'file': test_csv,
                        'transform_data': json.dumps(transform_data)
                    },
                    content_type='multipart/form-data'
                )
                assert transform_response.status_code == 200
                
                results.put(True)
            except Exception as e:
                results.put(e)

        # Start multiple threads
        threads = []
        for _ in range(3):
            thread = threading.Thread(target=upload_and_transform)
            thread.start()
            threads.append(thread)

        # Wait for all threads
        for thread in threads:
            thread.join()

        # Check results
        while not results.empty():
            result = results.get()
            assert result is True
