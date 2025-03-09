import pytest
import json
import io
from flask import url_for
from ..app import create_app

class TestRoutes:
    """Test Flask application route handlers"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = create_app({'TESTING': True})
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_sensitivity_analysis_route(self, client):
        """Test sensitivity analysis endpoint"""
        response = client.post(
            '/sensitivity/analyze',
            json={
                'parameter': {
                    'id': 'test_param',
                    'name': 'Test Parameter',
                    'type': 'numeric',
                    'range': {'min': 0, 'max': 100},
                    'steps': 5
                },
                'type': 'multipoint',
                'config': {}
            }
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'analysis_id' in data
        assert 'status' in data
        assert data['status'] == 'started'

    def test_price_impact_route(self, client):
        """Test price impact analysis endpoint"""
        response = client.post(
            '/price/impact',
            json={
                'base_price': 100.0,
                'parameters': [
                    {
                        'id': 'param1',
                        'weight': 0.7,
                        'sensitivity': 0.5
                    }
                ]
            }
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'optimized_price' in data
        assert 'impact_metrics' in data

    def test_file_upload_route(self, client):
        """Test file upload endpoint"""
        data = {
            'file': (io.BytesIO(b'test data'), 'test.csv'),
            'metadata': json.dumps({
                'description': 'Test file',
                'tags': ['test', 'csv']
            })
        }

        response = client.post(
            '/file/upload',
            data=data,
            content_type='multipart/form-data'
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'filename' in data
        assert 'metadata' in data

    def test_file_download_route(self, client):
        """Test file download endpoint"""
        # First upload a file
        upload_data = {
            'file': (io.BytesIO(b'test data'), 'test.csv')
        }
        upload_response = client.post(
            '/file/upload',
            data=upload_data,
            content_type='multipart/form-data'
        )
        filename = json.loads(upload_response.data)['filename']

        # Then download it
        response = client.get(f'/file/download/{filename}')
        assert response.status_code == 200
        assert response.data == b'test data'
        assert 'attachment' in response.headers['Content-Disposition']

    def test_file_list_route(self, client):
        """Test file listing endpoint"""
        # Upload some files first
        files = [
            ('test1.csv', b'data1'),
            ('test2.csv', b'data2')
        ]

        for filename, data in files:
            client.post(
                '/file/upload',
                data={'file': (io.BytesIO(data), filename)},
                content_type='multipart/form-data'
            )

        # Get file listing
        response = client.get('/file/list')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'files' in data
        assert len(data['files']) >= len(files)

    def test_analysis_status_route(self, client):
        """Test analysis status endpoint"""
        # Start an analysis
        start_response = client.post(
            '/sensitivity/analyze',
            json={
                'parameter': {
                    'id': 'test_param',
                    'type': 'numeric',
                    'range': {'min': 0, 'max': 100},
                    'steps': 5
                }
            }
        )
        analysis_id = json.loads(start_response.data)['analysis_id']

        # Check status
        response = client.get(f'/analysis/status/{analysis_id}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'status' in data
        assert 'progress' in data

    def test_batch_analysis_route(self, client):
        """Test batch analysis endpoint"""
        response = client.post(
            '/analysis/batch',
            json={
                'analyses': [
                    {
                        'type': 'sensitivity',
                        'parameter': {
                            'id': 'param1',
                            'range': {'min': 0, 'max': 100}
                        }
                    },
                    {
                        'type': 'price',
                        'base_price': 100.0,
                        'parameters': [{'id': 'param1', 'weight': 0.5}]
                    }
                ]
            }
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'batch_id' in data
        assert 'analysis_ids' in data
        assert len(data['analysis_ids']) == 2

    def test_analysis_results_route(self, client):
        """Test analysis results endpoint"""
        # Start an analysis
        start_response = client.post(
            '/sensitivity/analyze',
            json={
                'parameter': {
                    'id': 'test_param',
                    'type': 'numeric',
                    'range': {'min': 0, 'max': 100},
                    'steps': 5
                }
            }
        )
        analysis_id = json.loads(start_response.data)['analysis_id']

        # Get results
        response = client.get(f'/analysis/results/{analysis_id}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'results' in data
        assert 'metadata' in data

    def test_file_transform_route(self, client):
        """Test file transformation endpoint"""
        # Upload a file
        upload_data = {
            'file': (io.BytesIO(b'col1,col2\n1,2\n3,4'), 'data.csv')
        }
        upload_response = client.post(
            '/file/upload',
            data=upload_data,
            content_type='multipart/form-data'
        )
        filename = json.loads(upload_response.data)['filename']

        # Transform file
        transform_data = {
            'operations': [
                {
                    'type': 'filter',
                    'column': 'col1',
                    'condition': 'greater_than',
                    'value': 1
                }
            ],
            'output_format': 'json'
        }

        response = client.post(
            f'/file/transform/{filename}',
            json=transform_data
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'transformed_file' in data
        assert 'operations_applied' in data

    def test_analysis_cancel_route(self, client):
        """Test analysis cancellation endpoint"""
        # Start an analysis
        start_response = client.post(
            '/sensitivity/analyze',
            json={
                'parameter': {
                    'id': 'test_param',
                    'type': 'numeric',
                    'range': {'min': 0, 'max': 100},
                    'steps': 5
                }
            }
        )
        analysis_id = json.loads(start_response.data)['analysis_id']

        # Cancel analysis
        response = client.post(f'/analysis/cancel/{analysis_id}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'cancelled'

    def test_route_authentication(self, client):
        """Test route authentication requirements"""
        # Test protected route without authentication
        response = client.get('/admin/status')
        assert response.status_code == 401

        # Test with authentication
        headers = {'Authorization': 'Bearer test-token'}
        response = client.get('/admin/status', headers=headers)
        assert response.status_code == 200

    def test_route_rate_limiting(self, client):
        """Test route rate limiting"""
        # Make multiple requests in quick succession
        responses = []
        for _ in range(10):
            response = client.get('/file/list')
            responses.append(response)

        # Check if rate limiting was applied
        assert any(r.status_code == 429 for r in responses)

    def test_route_error_handling(self, client):
        """Test route error handling"""
        # Test invalid JSON
        response = client.post(
            '/sensitivity/analyze',
            data='invalid json',
            content_type='application/json'
        )
        assert response.status_code == 400

        # Test missing required field
        response = client.post(
            '/sensitivity/analyze',
            json={'incomplete': 'data'}
        )
        assert response.status_code == 400

        # Test invalid parameter
        response = client.post(
            '/sensitivity/analyze',
            json={
                'parameter': {
                    'id': 'test',
                    'range': {'min': 100, 'max': 0}  # Invalid range
                }
            }
        )
        assert response.status_code == 400
