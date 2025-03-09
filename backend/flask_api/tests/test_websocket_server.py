import pytest
import json
import time
from unittest.mock import Mock, patch
from flask import Flask
from flask_socketio import SocketIO
from ..websocket import (
    handle_connect,
    handle_disconnect,
    handle_start_analysis,
    handle_update_progress,
    handle_cancel_analysis,
    emit_calculation_progress
)

@pytest.fixture
def app():
    """Create test Flask application"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'test-key'
    app.config['TESTING'] = True
    return app

@pytest.fixture
def socketio(app):
    """Create test SocketIO instance"""
    return SocketIO(app, async_mode='threading')

@pytest.fixture
def mock_analysis_manager():
    """Create mock analysis manager"""
    return Mock()

class TestWebSocketServer:
    """Test WebSocket server implementation"""

    def test_connection_handling(self, socketio):
        """Test connection and disconnection handling"""
        client = socketio.test_client()
        
        # Test connection
        assert client.is_connected()
        received = client.get_received()
        assert any(
            event['name'] == 'connection_status' and
            event['args'][0]['status'] == 'connected'
            for event in received
        )

        # Test disconnection
        client.disconnect()
        assert not client.is_connected()

    def test_analysis_lifecycle(self, socketio, mock_analysis_manager):
        """Test complete analysis lifecycle"""
        client = socketio.test_client()
        
        with patch('flask_socketio.emit') as mock_emit:
            # Start analysis
            analysis_data = {
                'analysis_id': 'test_analysis',
                'type': 'sensitivity',
                'parameters': {
                    'param1': {'range': [0, 100]}
                }
            }
            client.emit('start_analysis', analysis_data)
            
            # Verify start handling
            mock_emit.assert_any_call(
                'analysis_started',
                {'analysis_id': 'test_analysis', 'status': 'started'},
                room=client.sid
            )

            # Send progress updates
            for i in range(5):
                progress_data = {
                    'analysis_id': 'test_analysis',
                    'step': i + 1,
                    'status': 'running',
                    'results': {'value': i}
                }
                client.emit('update_progress', progress_data)
                
                # Verify progress handling
                mock_emit.assert_any_call(
                    'progress_update',
                    {
                        'analysis_id': 'test_analysis',
                        'step': i + 1,
                        'progress': (i + 1) * 20,
                        'latest_results': {'value': i}
                    },
                    room=client.sid
                )

            # Send completion
            completion_data = {
                'analysis_id': 'test_analysis',
                'step': 5,
                'status': 'complete',
                'results': {'final_value': 100}
            }
            client.emit('update_progress', completion_data)
            
            # Verify completion handling
            mock_emit.assert_any_call(
                'analysis_complete',
                {
                    'analysis_id': 'test_analysis',
                    'status': 'complete',
                    'results': {'final_value': 100}
                },
                room=client.sid
            )

    def test_error_handling(self, socketio):
        """Test error handling in WebSocket communication"""
        client = socketio.test_client()
        
        with patch('flask_socketio.emit') as mock_emit:
            # Test invalid analysis data
            invalid_data = {
                'analysis_id': 'test_analysis',
                'type': 'invalid'
            }
            client.emit('start_analysis', invalid_data)
            
            # Verify error handling
            mock_emit.assert_any_call(
                'error',
                {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid analysis type'
                },
                room=client.sid
            )

            # Test missing analysis ID
            invalid_data = {
                'type': 'sensitivity'
            }
            client.emit('start_analysis', invalid_data)
            
            # Verify error handling
            mock_emit.assert_any_call(
                'error',
                {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Analysis ID is required'
                },
                room=client.sid
            )

    def test_analysis_cancellation(self, socketio, mock_analysis_manager):
        """Test analysis cancellation"""
        client = socketio.test_client()
        
        with patch('flask_socketio.emit') as mock_emit:
            # Start analysis
            analysis_data = {
                'analysis_id': 'test_analysis',
                'type': 'sensitivity',
                'parameters': {}
            }
            client.emit('start_analysis', analysis_data)
            
            # Cancel analysis
            client.emit('cancel_analysis', {
                'analysis_id': 'test_analysis'
            })
            
            # Verify cancellation handling
            mock_emit.assert_any_call(
                'analysis_cancelled',
                {
                    'analysis_id': 'test_analysis',
                    'timestamp': mock_emit.call_args[0][1]['timestamp']
                },
                room=client.sid
            )

    def test_room_isolation(self, socketio):
        """Test that events are properly isolated to rooms"""
        client1 = socketio.test_client()
        client2 = socketio.test_client()
        
        # Start analysis for client1
        analysis_data = {
            'analysis_id': 'test_analysis',
            'type': 'sensitivity',
            'parameters': {}
        }
        client1.emit('start_analysis', analysis_data)
        
        # Check that only client1 received the start event
        received1 = client1.get_received()
        received2 = client2.get_received()
        
        assert any(
            event['name'] == 'analysis_started' and
            event['args'][0]['analysis_id'] == 'test_analysis'
            for event in received1
        )
        assert not any(
            event['name'] == 'analysis_started'
            for event in received2
        )

    @pytest.mark.integration
    def test_concurrent_analyses(self, socketio):
        """Test handling multiple concurrent analyses"""
        client = socketio.test_client()
        analysis_ids = ['analysis_1', 'analysis_2', 'analysis_3']
        
        with patch('flask_socketio.emit') as mock_emit:
            # Start multiple analyses
            for analysis_id in analysis_ids:
                client.emit('start_analysis', {
                    'analysis_id': analysis_id,
                    'type': 'sensitivity',
                    'parameters': {}
                })
                time.sleep(0.1)  # Small delay to ensure order

            # Verify each analysis was started
            start_events = [
                call[0][1]['analysis_id']
                for call in mock_emit.call_args_list
                if call[0][0] == 'analysis_started'
            ]
            assert set(start_events) == set(analysis_ids)

            # Update each analysis
            for analysis_id in analysis_ids:
                client.emit('update_progress', {
                    'analysis_id': analysis_id,
                    'step': 1,
                    'status': 'running',
                    'results': {}
                })

            # Verify updates were handled
            update_events = [
                call[0][1]['analysis_id']
                for call in mock_emit.call_args_list
                if call[0][0] == 'progress_update'
            ]
            assert set(update_events) == set(analysis_ids)

    def test_emit_calculation_progress(self, socketio):
        """Test progress emission utility function"""
        client = socketio.test_client()
        
        with patch('flask_socketio.emit') as mock_emit:
            # Test progress emission
            emit_calculation_progress('test_analysis', {
                'step': 5,
                'total_steps': 10,
                'status': 'running',
                'results': {'value': 42}
            })
            
            # Verify emission
            mock_emit.assert_called_with(
                'progress_update',
                {
                    'analysis_id': 'test_analysis',
                    'step': 5,
                    'progress': 50,
                    'status': 'running',
                    'latest_results': {'value': 42}
                },
                broadcast=True
            )

    def test_reconnection_handling(self, socketio):
        """Test handling of client reconnections"""
        client = socketio.test_client()
        
        # Start analysis
        analysis_data = {
            'analysis_id': 'test_analysis',
            'type': 'sensitivity',
            'parameters': {}
        }
        client.emit('start_analysis', analysis_data)
        
        # Simulate disconnection
        client.disconnect()
        
        # Reconnect
        client.connect()
        
        # Verify reconnection status
        received = client.get_received()
        assert any(
            event['name'] == 'connection_status' and
            event['args'][0]['status'] == 'connected'
            for event in received
        )
