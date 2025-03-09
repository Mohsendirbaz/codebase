import pytest
import json
import time
from flask import Flask
from flask_socketio import SocketIO
from ..websocket import socketio, handle_connect, handle_disconnect
from ..app import create_app

class TestWebSocketIntegration:
    """Test WebSocket integration with Flask application"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = create_app({
            'TESTING': True,
            'SECRET_KEY': 'test-key',
            'WS_PING_INTERVAL': 1,
            'WS_PING_TIMEOUT': 2
        })
        return app

    @pytest.fixture
    def test_client(self, app):
        """Create test client"""
        return app.test_client()

    @pytest.fixture
    def socketio_client(self, app):
        """Create SocketIO test client"""
        return socketio.test_client(app)

    @pytest.fixture
    def sample_analysis_data(self):
        """Create sample analysis data"""
        return {
            'analysis_id': 'test_analysis',
            'type': 'sensitivity',
            'parameters': {
                'param1': {'range': [0, 100]},
                'param2': {'range': [0, 50]}
            },
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

    def test_analysis_lifecycle(self, socketio_client, sample_analysis_data):
        """Test complete analysis lifecycle via WebSocket"""
        # Start analysis
        socketio_client.emit('start_analysis', sample_analysis_data)
        
        received = socketio_client.get_received()
        assert any(
            event['name'] == 'analysis_started' and
            event['args'][0]['analysis_id'] == sample_analysis_data['analysis_id']
            for event in received
        )

        # Send progress updates
        for i in range(5):
            progress_data = {
                'analysis_id': sample_analysis_data['analysis_id'],
                'step': i + 1,
                'status': 'running' if i < 4 else 'complete',
                'results': {'value': i}
            }
            socketio_client.emit('update_progress', progress_data)
            
            received = socketio_client.get_received()
            progress_event = next(
                (event for event in received if event['name'] == 'progress_update'),
                None
            )
            assert progress_event is not None
            assert progress_event['args'][0]['step'] == i + 1

        # Verify completion
        received = socketio_client.get_received()
        assert any(
            event['name'] == 'analysis_complete'
            for event in received
        )

    def test_multiple_clients(self, app):
        """Test handling multiple WebSocket clients"""
        client1 = socketio.test_client(app)
        client2 = socketio.test_client(app)
        
        assert client1.is_connected()
        assert client2.is_connected()
        
        # Send message from client1
        client1.emit('start_analysis', {
            'analysis_id': 'analysis1',
            'type': 'sensitivity'
        })
        
        # Verify client1 receives response but client2 doesn't
        received1 = client1.get_received()
        received2 = client2.get_received()
        
        assert any(
            event['name'] == 'analysis_started' and
            event['args'][0]['analysis_id'] == 'analysis1'
            for event in received1
        )
        assert not any(
            event['name'] == 'analysis_started'
            for event in received2
        )

    def test_error_handling(self, socketio_client):
        """Test WebSocket error handling"""
        # Send invalid data
        socketio_client.emit('start_analysis', {
            'analysis_id': 'test',
            'type': 'invalid_type'
        })
        
        received = socketio_client.get_received()
        error_event = next(
            (event for event in received if event['name'] == 'error'),
            None
        )
        
        assert error_event is not None
        assert 'code' in error_event['args'][0]
        assert 'message' in error_event['args'][0]

    def test_disconnection_handling(self, socketio_client, sample_analysis_data):
        """Test handling of client disconnection"""
        # Start analysis
        socketio_client.emit('start_analysis', sample_analysis_data)
        socketio_client.get_received()  # Clear initial messages
        
        # Disconnect
        socketio_client.disconnect()
        assert not socketio_client.is_connected()
        
        # Reconnect
        socketio_client.connect()
        assert socketio_client.is_connected()
        
        received = socketio_client.get_received()
        assert any(
            event['name'] == 'connection_status' and
            event['args'][0]['status'] == 'connected'
            for event in received
        )

    def test_concurrent_analyses(self, socketio_client):
        """Test handling multiple concurrent analyses"""
        analyses = [
            {
                'analysis_id': f'analysis_{i}',
                'type': 'sensitivity',
                'parameters': {'param': {'range': [0, 100]}},
                'total_steps': 3
            }
            for i in range(3)
        ]
        
        # Start multiple analyses
        for analysis in analyses:
            socketio_client.emit('start_analysis', analysis)
            time.sleep(0.1)  # Small delay to ensure order
        
        # Verify all analyses were started
        received = socketio_client.get_received()
        started_analyses = [
            event['args'][0]['analysis_id']
            for event in received
            if event['name'] == 'analysis_started'
        ]
        
        assert len(started_analyses) == len(analyses)
        assert all(
            analysis['analysis_id'] in started_analyses
            for analysis in analyses
        )

    def test_progress_tracking(self, socketio_client, sample_analysis_data):
        """Test analysis progress tracking"""
        socketio_client.emit('start_analysis', sample_analysis_data)
        socketio_client.get_received()  # Clear initial messages
        
        # Send progress at different rates
        progress_points = [
            {'step': 1, 'delay': 0.1},
            {'step': 2, 'delay': 0.2},
            {'step': 3, 'delay': 0.1},
            {'step': 4, 'delay': 0.3},
            {'step': 5, 'delay': 0.1}
        ]
        
        for point in progress_points:
            time.sleep(point['delay'])
            socketio_client.emit('update_progress', {
                'analysis_id': sample_analysis_data['analysis_id'],
                'step': point['step'],
                'status': 'running',
                'results': {'step': point['step']}
            })
            
            received = socketio_client.get_received()
            assert any(
                event['name'] == 'progress_update' and
                event['args'][0]['step'] == point['step']
                for event in received
            )

    def test_analysis_cancellation(self, socketio_client, sample_analysis_data):
        """Test analysis cancellation"""
        # Start analysis
        socketio_client.emit('start_analysis', sample_analysis_data)
        socketio_client.get_received()  # Clear initial messages
        
        # Cancel analysis
        socketio_client.emit('cancel_analysis', {
            'analysis_id': sample_analysis_data['analysis_id']
        })
        
        received = socketio_client.get_received()
        cancel_event = next(
            (event for event in received if event['name'] == 'analysis_cancelled'),
            None
        )
        
        assert cancel_event is not None
        assert cancel_event['args'][0]['analysis_id'] == sample_analysis_data['analysis_id']

    def test_websocket_namespaces(self, app):
        """Test WebSocket namespace isolation"""
        client1 = socketio.test_client(app, namespace='/analysis')
        client2 = socketio.test_client(app, namespace='/monitoring')
        
        # Send message in analysis namespace
        client1.emit('start_analysis', {'analysis_id': 'test'}, namespace='/analysis')
        
        # Verify message isolation
        received1 = client1.get_received('/analysis')
        received2 = client2.get_received('/monitoring')
        
        assert len(received1) > 0
        assert len(received2) == 0
