import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..events import (
    EventManager,
    Event,
    EventHandler,
    EventBus,
    EventError,
    EventFilter
)

class TestEvents:
    """Test events utilities"""

    @pytest.fixture
    def event_manager(self):
        """Create event manager instance"""
        return EventManager(
            config={
                'storage_type': 'memory',
                'max_listeners': 100,
                'async_dispatch': True,
                'retry_policy': {
                    'max_retries': 3,
                    'delay': 1
                }
            }
        )

    @pytest.fixture
    def event_bus(self):
        """Create event bus instance"""
        return EventBus()

    @pytest.fixture
    def test_event(self):
        """Create test event instance"""
        return Event(
            name='test_event',
            data={'test_key': 'test_value'},
            timestamp=datetime.now()
        )

    def test_basic_event_handling(self, event_manager):
        """Test basic event handling"""
        received_events = []

        # Create event handler
        @event_manager.on('test_event')
        def handle_test_event(event):
            received_events.append(event)

        # Emit event
        event = Event('test_event', {'message': 'Hello'})
        event_manager.emit(event)

        # Verify handler was called
        assert len(received_events) == 1
        assert received_events[0].name == 'test_event'
        assert received_events[0].data['message'] == 'Hello'

    def test_event_filtering(self, event_manager):
        """Test event filtering"""
        matched_events = []

        # Create filter
        event_filter = EventFilter(
            pattern='user.*',
            conditions={
                'user_id': lambda x: x.startswith('admin')
            }
        )

        # Register filtered handler
        @event_manager.on('user.login', filter=event_filter)
        def handle_admin_login(event):
            matched_events.append(event)

        # Emit events
        event_manager.emit(Event('user.login', {'user_id': 'admin1'}))
        event_manager.emit(Event('user.login', {'user_id': 'user1'}))
        event_manager.emit(Event('other.event', {'user_id': 'admin2'}))

        assert len(matched_events) == 1
        assert matched_events[0].data['user_id'] == 'admin1'

    def test_async_event_handling(self, event_manager):
        """Test asynchronous event handling"""
        import asyncio

        async def async_handler(event):
            await asyncio.sleep(0.1)
            return event.data['value'] * 2

        # Register async handler
        event_manager.on('async_event', handler=async_handler)

        # Emit event and get result
        event = Event('async_event', {'value': 21})
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            event_manager.emit_async(event)
        )

        assert result[0] == 42

    def test_event_error_handling(self, event_manager):
        """Test event error handling"""
        errors = []

        def error_handler(event, error):
            errors.append((event, error))

        # Register error handler
        event_manager.on_error(error_handler)

        # Register handler that raises exception
        @event_manager.on('error_event')
        def failing_handler(event):
            raise ValueError('Test error')

        # Emit event
        event = Event('error_event', {})
        event_manager.emit(event)

        assert len(errors) == 1
        assert isinstance(errors[0][1], ValueError)
        assert str(errors[0][1]) == 'Test error'

    def test_event_bus_routing(self, event_bus):
        """Test event bus routing"""
        routes = []

        # Create handlers for different channels
        @event_bus.subscribe('channel1')
        def handle_channel1(event):
            routes.append(('channel1', event))

        @event_bus.subscribe('channel2')
        def handle_channel2(event):
            routes.append(('channel2', event))

        # Publish events to different channels
        event_bus.publish('channel1', Event('event1', {}))
        event_bus.publish('channel2', Event('event2', {}))

        assert len(routes) == 2
        assert routes[0][0] == 'channel1'
        assert routes[1][0] == 'channel2'

    def test_event_persistence(self, event_manager):
        """Test event persistence"""
        # Enable persistence
        event_manager.enable_persistence()

        # Emit some events
        events = [
            Event('test1', {'seq': 1}),
            Event('test2', {'seq': 2}),
            Event('test3', {'seq': 3})
        ]
        for event in events:
            event_manager.emit(event)

        # Retrieve event history
        history = event_manager.get_event_history()
        assert len(history) == 3
        assert [e.data['seq'] for e in history] == [1, 2, 3]

    def test_event_replay(self, event_manager):
        """Test event replay functionality"""
        received = []

        @event_manager.on('replay_event')
        def handle_replay(event):
            received.append(event)

        # Record some events
        original_events = [
            Event('replay_event', {'value': i})
            for i in range(3)
        ]
        for event in original_events:
            event_manager.emit(event)

        # Clear received events
        received.clear()

        # Replay events
        event_manager.replay_events('replay_event')
        assert len(received) == 3
        assert [e.data['value'] for e in received] == [0, 1, 2]

    def test_event_aggregation(self, event_manager):
        """Test event aggregation"""
        # Create aggregator
        aggregator = event_manager.create_aggregator(
            name='test_aggregator',
            window=timedelta(seconds=1),
            group_by='category'
        )

        # Emit events
        events = [
            Event('purchase', {'category': 'A', 'amount': 100}),
            Event('purchase', {'category': 'B', 'amount': 200}),
            Event('purchase', {'category': 'A', 'amount': 150})
        ]
        for event in events:
            event_manager.emit(event)

        # Get aggregated results
        results = aggregator.get_results()
        assert results['A']['total_amount'] == 250
        assert results['B']['total_amount'] == 200

    def test_event_correlation(self, event_manager):
        """Test event correlation"""
        correlated_events = []

        # Create correlation rule
        rule = event_manager.correlate(
            events=['request', 'response'],
            condition=lambda e1, e2: e1.data['id'] == e2.data['id'],
            timeout=1
        )

        @rule.on_match
        def handle_correlation(events):
            correlated_events.append(events)

        # Emit correlated events
        event_manager.emit(Event('request', {'id': '123', 'type': 'GET'}))
        event_manager.emit(Event('response', {'id': '123', 'status': 200}))

        assert len(correlated_events) == 1
        assert len(correlated_events[0]) == 2
        assert correlated_events[0][0].data['type'] == 'GET'
        assert correlated_events[0][1].data['status'] == 200

    def test_event_patterns(self, event_manager):
        """Test event pattern matching"""
        pattern_matches = []

        # Create pattern matcher
        pattern = event_manager.create_pattern([
            ('start', {}),
            ('middle', {'value': lambda x: x > 0}),
            ('end', {})
        ])

        @pattern.on_match
        def handle_pattern(events):
            pattern_matches.append(events)

        # Emit matching sequence
        event_manager.emit(Event('start', {}))
        event_manager.emit(Event('middle', {'value': 42}))
        event_manager.emit(Event('end', {}))

        assert len(pattern_matches) == 1
        assert len(pattern_matches[0]) == 3
        assert pattern_matches[0][1].data['value'] == 42

    def test_event_scheduling(self, event_manager):
        """Test event scheduling"""
        scheduled_events = []

        @event_manager.on('scheduled_event')
        def handle_scheduled(event):
            scheduled_events.append(event)

        # Schedule future event
        future_time = datetime.now() + timedelta(seconds=1)
        event_manager.schedule_event(
            Event('scheduled_event', {}),
            trigger_time=future_time
        )

        # Wait for event
        import time
        time.sleep(1.1)

        assert len(scheduled_events) == 1
        assert scheduled_events[0].name == 'scheduled_event'
