import unittest
import json
import os
import tempfile
import pandas as pd
import numpy as np
from datetime import datetime
from flask_socketio import SocketIOTestClient
from ..app import create_app
from ..websocket import socketio

class FlaskAPITestCase(unittest.TestCase):
    def setUp(self):
        """Set up test environment"""
        self.app = create_app({'TESTING': True})
        self.client = self.app.test_client()
        self.socketio_client = SocketIOTestClient(self.app, socketio)
        
        # Create temporary upload directory
        self.temp_dir = tempfile.mkdtemp()
        self.app.config['UPLOAD_FOLDER'] = self.temp_dir

    def tearDown(self):
        """Clean up test environment"""
        # Remove temporary files
        for root, dirs, files in os.walk(self.temp_dir):
            for file in files:
                os.remove(os.path.join(root, file))
        os.rmdir(self.temp_dir)

    def test_sensitivity_analysis(self):
        """Test sensitivity analysis endpoint"""
        data = {
            'parameter': {
                'id': 'test_param',
                'name': 'Test Parameter',
                'type': 'numeric',
                'range': {
                    'min': 0,
                    'max': 100
                },
                'steps': 10
            },
            'type': 'multipoint',
            'config': {
                'monte_carlo_iterations': 1000
            }
        }

        response = self.client.post(
            '/sensitivity/analyze',
            json=data,
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertIn('analysis_id', result)
        self.assertIn('results', result)

    def test_price_impact(self):
        """Test price impact calculation endpoint"""
        data = {
            'base_price': 100.0,
            'parameters': [
                {
                    'id': 'param1',
                    'weight': 0.7,
                    'sensitivity': 0.5
                }
            ],
            'market_data': {
                'competitor_prices': [95.0, 105.0, 110.0]
            }
        }

        response = self.client.post(
            '/price/impact',
            json=data,
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertIn('optimized_price', result)
        self.assertIn('metrics', result)

    def test_file_upload_and_transform(self):
        """Test file upload and transformation endpoints"""
        # Create test CSV file
        df = pd.DataFrame({
            'A': range(1, 6),
            'B': range(10, 15)
        })
        
        with tempfile.NamedTemporaryFile(suffix='.csv') as temp_file:
            df.to_csv(temp_file.name, index=False)
            temp_file.seek(0)
            
            # Test file upload
            response = self.client.post(
                '/file/upload',
                data={
                    'file': (temp_file, 'test.csv'),
                    'metadata': json.dumps({
                        'description': 'Test file'
                    })
                },
                content_type='multipart/form-data'
            )

            self.assertEqual(response.status_code, 200)
            upload_result = json.loads(response.data)
            filename = upload_result['filename']

            # Test file transformation
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

            response = self.client.post(
                '/file/transform',
                data={
                    'file': (temp_file, 'test.csv'),
                    'transform_data': json.dumps(transform_data)
                },
                content_type='multipart/form-data'
            )

            self.assertEqual(response.status_code, 200)
            result = json.loads(response.data)
            self.assertIn('output_filename', result)

    def test_websocket_analysis_progress(self):
        """Test WebSocket analysis progress updates"""
        # Connect to WebSocket
        self.socketio_client.connect()
        
        # Start analysis
        analysis_id = 'test_analysis'
        self.socketio_client.emit('start_analysis', {
            'analysis_id': analysis_id,
            'type': 'sensitivity',
            'parameters': [],
            'total_steps': 5
        })

        # Receive connection status
        received = self.socketio_client.get_received()
        self.assertTrue(any(
            event['name'] == 'connection_status'
            for event in received
        ))

        # Send progress updates
        for i in range(5):
            self.socketio_client.emit('update_progress', {
                'analysis_id': analysis_id,
                'step': i + 1,
                'status': 'running' if i < 4 else 'complete',
                'results': {'value': i}
            })

            # Check progress updates
            received = self.socketio_client.get_received()
            self.assertTrue(any(
                event['name'] == 'progress_update'
                for event in received
            ))

        # Disconnect
        self.socketio_client.disconnect()

    def test_efficacy_calculation(self):
        """Test efficacy metrics calculation"""
        data = {
            'sensitivity_data': {
                'points': [
                    {'value': i, 'result': i * 2}
                    for i in range(5)
                ],
                'predictions': [i * 2 for i in range(5)]
            },
            'price_data': {
                'points': [
                    {'price': 100 + i * 10}
                    for i in range(5)
                ]
            },
            'validation_data': {
                'actual_values': [i * 2 for i in range(5)]
            }
        }

        response = self.client.post(
            '/sensitivity/efficacy',
            json=data,
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertIn('overall_score', result)
        self.assertIn('confidence_score', result)
        self.assertIn('accuracy_metrics', result)

    def test_error_handling(self):
        """Test error handling for invalid requests"""
        # Test invalid sensitivity analysis request
        response = self.client.post(
            '/sensitivity/analyze',
            json={'invalid': 'data'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)

        # Test invalid file upload
        response = self.client.post(
            '/file/upload',
            data={},
            content_type='multipart/form-data'
        )
        self.assertEqual(response.status_code, 400)

        # Test invalid file download
        response = self.client.get('/file/download/nonexistent.file')
        self.assertEqual(response.status_code, 404)

if __name__ == '__main__':
    unittest.main()
