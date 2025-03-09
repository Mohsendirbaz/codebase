import pytest
import json
import time
from unittest.mock import Mock
from flask_socketio import SocketIOTestClient

@pytest.mark.websocket
class TestWebSocket:
    """Test WebSocket functionality"""

    @pytest.fixture
    def analysis_data(self, sample_data):
        """Create sample analysis data"""
        return {
            'analysis_id': 'test_analysis',
            'type': 'sensitivity',
            'parameters': sample_data['sensitivity']['parameter'],
            'total_steps': 5
        }

    def test_websocket_connection(self, socketio_client):
        """Test WebSocket connection establishment"""
        assert socketio_client.is_connected()
        
        received = socketio_client.get_received()
        assert any(
            event['name'] == 'connection_status' and
            event['args'][0]['status'] == 'connected'
            for event in received
        )

    def test_start_analysis(self, socketio_client, analysis_data):
        """Test starting analysis via WebSocket"""
        socketio_client.emit('start_analysis', analysis_data)
        
        received = socketio_client.get_received()
        assert any(
            event['name'] == 'analysis_started' and
            event['args'][0]['analysis_id'] == analysis_data['analysis_id']
            for event in received
        )

    def test_progress_updates(self, socketio_client, analysis_data):
        """Test receiving progress updates"""
        socketio_client.emit('start_analysis', analysis_data)
        socketio_client.get_received()  # Clear initial messages

        # Send progress updates
        for i in range(5):
            progress_data = {
                'analysis_id': analysis_data['analysis_id'],
                'step': i + 1,
                'status': 'running' if i < 4 else 'complete',
                'results': {'value': i}
            }
            socketio_client.emit('update_progress', progress_data)
            
            received = socketio_client.get_received()
            assert len(received) > 0
            
            progress_event = next(
                (event for event in received if event['name'] == 'progress_update'),
                None
            )
            assert progress_event is not None
            
            update_data = progress_event['args'][0]
            assert update_data['analysis_id'] == analysis_data['analysis_id']
            assert update_data['step'] == i + 1
            assert 'progress' in update_data
            assert update_data['latest_results'] == {'value': i}

    def test_analysis_completion(self, socketio_client, analysis_data):
        """Test analysis completion notification"""
        socketio_client.emit('start_analysis', analysis_data)
        socketio_client.get_received()  # Clear initial messages

        # Send completion update
        completion_data = {
            'analysis_id': analysis_data['analysis_id'],
            'step': 5,
            'status': 'complete',
            'results': {'final_value': 100}
        }
        socketio_client.emit('update_progress', completion_data)
        
        received = socketio_client.get_received()
        complete_event = next(
            (event for event in received if event['name'] == 'analysis_complete'),
            None
        )
        
        assert complete_event is not None
        complete_data = complete_event['args'][0]
        assert complete_data['analysis_id'] == analysis_data['analysis_id']
        assert complete_data['status'] == 'complete'
        assert 'results' in complete_data

    def test_error_handling(self, socketio_client, analysis_data):
        """Test error handling in WebSocket communication"""
        socketio_client.emit('start_analysis', analysis_data)
        socketio_client.get_received()  # Clear initial messages

        # Send error update
        error_data = {
            'analysis_id': analysis_data['analysis_id'],
            'step': 3,
            'status': 'error',
            'error': 'Test error message'
        }
        socketio_client.emit('update_progress', error_data)
        
        received = socketio_client.get_received()
        error_event = next(
            (event for event in received if event['name'] == 'error'),
            None
        )
        
        assert error_event is not None
        error_data = error_event['args'][0]
        assert 'message' in error_data
        assert error_data['code'] == 'INTERNAL_ERROR'

    def test_analysis_cancellation(self, socketio_client, analysis_data):
        """Test analysis cancellation"""
        socketio_client.emit('start_analysis', analysis_data)
        socketio_client.get_received()  # Clear initial messages

        # Send cancellation request
        socketio_client.emit('cancel_analysis', {
            'analysis_id': analysis_data['analysis_id']
        })
        
        received = socketio_client.get_received()
        cancel_event = next(
            (event for event in received if event['name'] == 'analysis_cancelled'),
            None
        )
        
        assert cancel_event is not None
        cancel_data = cancel_event['args'][0]
        assert cancel_data['analysis_id'] == analysis_data['analysis_id']
        assert 'timestamp' in cancel_data

    @pytest.mark.integration
    def test_long_running_analysis(self, socketio_client, analysis_data):
        """Test long-running analysis with multiple updates"""
        socketio_client.emit('start_analysis', analysis_data)
        socketio_client.get_received()  # Clear initial messages

        # Simulate long-running analysis
        total_steps = 10
        for i in range(total_steps):
            progress_data = {
                'analysis_id': analysis_data['analysis_id'],
                'step': i + 1,
                'status': 'running',
                'results': {
                    'iteration': i + 1,
                    'value': i * 10,
                    'intermediate_result': f'Step {i + 1} complete'
                }
            }
            socketio_client.emit('update_progress', progress_data)
            time.sleep(0.1)  # Simulate processing time
            
            received = socketio_client.get_received()
            assert any(
                event['name'] == 'progress_update' and
                event['args'][0]['step'] == i + 1
                for event in received
            )

        # Send completion
        completion_data = {
            'analysis_id': analysis_data['analysis_id'],
            'step': total_steps,
            'status': 'complete',
            'results': {
                'final_value': total_steps * 10,
                'summary': 'Analysis complete'
            }
        }
        socketio_client.emit('update_progress', completion_data)
        
        received = socketio_client.get_received()
        assert any(
            event['name'] == 'analysis_complete' and
            event['args'][0]['status'] == 'complete'
            for event in received
        )

    def test_concurrent_analyses(self, socketio_client, analysis_data):
        """Test handling multiple concurrent analyses"""
        analysis_ids = [f"analysis_{i}" for i in range(3)]
        
        # Start multiple analyses
        for analysis_id in analysis_ids:
            data = analysis_data.copy()
            data['analysis_id'] = analysis_id
            socketio_client.emit('start_analysis', data)
        
        received = socketio_client.get_received()
        started_analyses = [
            event['args'][0]['analysis_id']
            for event in received
            if event['name'] == 'analysis_started'
        ]
        assert set(started_analyses) == set(analysis_ids)

        # Update each analysis
        for analysis_id in analysis_ids:
            progress_data = {
                'analysis_id': analysis_id,
                'step': 1,
                'status': 'running',
                'results': {'value': 0}
            }
            socketio_client.emit('update_progress', progress_data)
        
        received = socketio_client.get_received()
        updated_analyses = [
            event['args'][0]['analysis_id']
            for event in received
            if event['name'] == 'progress_update'
        ]
        assert set(updated_analyses) == set(analysis_ids)

    @pytest.mark.integration
    def test_reconnection_handling(self, socketio_client, analysis_data):
        """Test WebSocket reconnection handling"""
        # Start analysis
        socketio_client.emit('start_analysis', analysis_data)
        socketio_client.get_received()

        # Simulate disconnection
        socketio_client.disconnect()
        assert not socketio_client.is_connected()

        # Reconnect
        socketio_client.connect()
        assert socketio_client.is_connected()

        # Verify connection status
        received = socketio_client.get_received()
        assert any(
            event['name'] == 'connection_status' and
            event['args'][0]['status'] == 'connected'
            for event in received
        )

        # Continue analysis
        progress_data = {
            'analysis_id': analysis_data['analysis_id'],
            'step': 1,
            'status': 'running',
            'results': {'value': 0}
        }
        socketio_client.emit('update_progress', progress_data)
        
        received = socketio_client.get_received()
        assert any(
            event['name'] == 'progress_update' and
            event['args'][0]['analysis_id'] == analysis_data['analysis_id']
            for event in received
        )
