import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..analytics import (
    AnalyticsManager,
    EventTracker,
    UserAnalytics,
    AnalyticsError,
    MetricsAggregator,
    TimeSeriesAnalyzer
)

class TestAnalytics:
    """Test analytics utilities"""

    @pytest.fixture
    def analytics_manager(self):
        """Create analytics manager instance"""
        return AnalyticsManager(
            config={
                'storage': {
                    'type': 'sqlite',
                    'path': ':memory:'
                },
                'batch_size': 100,
                'flush_interval': 60
            }
        )

    @pytest.fixture
    def event_tracker(self):
        """Create event tracker instance"""
        return EventTracker(
            batch_size=100,
            auto_flush=True
        )

    @pytest.fixture
    def user_analytics(self):
        """Create user analytics instance"""
        return UserAnalytics()

    def test_event_tracking(self, event_tracker):
        """Test event tracking"""
        # Track event
        event = {
            'event_type': 'page_view',
            'page': '/dashboard',
            'user_id': 'user123',
            'timestamp': datetime.now().isoformat()
        }
        event_tracker.track(event)

        # Verify event batch
        batch = event_tracker.get_current_batch()
        assert len(batch) == 1
        assert batch[0]['event_type'] == 'page_view'
        assert batch[0]['user_id'] == 'user123'

    def test_batch_processing(self, event_tracker):
        """Test event batch processing"""
        # Fill batch
        for i in range(100):
            event_tracker.track({
                'event_type': 'test_event',
                'index': i
            })

        # Mock storage
        mock_storage = Mock()
        event_tracker.storage = mock_storage

        # Trigger flush
        event_tracker.flush()

        # Verify storage call
        mock_storage.store_events.assert_called_once()
        stored_events = mock_storage.store_events.call_args[0][0]
        assert len(stored_events) == 100

    def test_user_session_analytics(self, user_analytics):
        """Test user session analytics"""
        # Record session events
        session_id = user_analytics.start_session('user123')
        
        user_analytics.track_session_event(session_id, {
            'type': 'page_view',
            'page': '/home'
        })
        user_analytics.track_session_event(session_id, {
            'type': 'button_click',
            'element': 'signup_button'
        })

        # End session
        session_data = user_analytics.end_session(session_id)

        # Verify session data
        assert session_data['user_id'] == 'user123'
        assert len(session_data['events']) == 2
        assert session_data['duration'] > 0

    def test_metrics_aggregation(self, analytics_manager):
        """Test metrics aggregation"""
        # Add test data
        analytics_manager.track_metric('response_time', 100)
        analytics_manager.track_metric('response_time', 200)
        analytics_manager.track_metric('response_time', 150)

        # Get aggregated metrics
        metrics = analytics_manager.get_metrics('response_time')
        
        assert metrics['count'] == 3
        assert metrics['avg'] == 150
        assert metrics['min'] == 100
        assert metrics['max'] == 200

    def test_time_series_analysis(self, analytics_manager):
        """Test time series analysis"""
        # Add time series data
        base_time = datetime.now()
        for i in range(24):
            analytics_manager.track_metric(
                'users_online',
                50 + i,
                timestamp=base_time + timedelta(hours=i)
            )

        # Get time series analysis
        analysis = analytics_manager.analyze_time_series(
            'users_online',
            interval='1h',
            period='24h'
        )

        assert len(analysis['points']) == 24
        assert 'trend' in analysis
        assert 'peak_time' in analysis

    def test_user_behavior_analysis(self, user_analytics):
        """Test user behavior analysis"""
        # Track user actions
        user_analytics.track_user_action('user123', {
            'action': 'feature_usage',
            'feature': 'search',
            'timestamp': datetime.now().isoformat()
        })

        # Get user behavior analysis
        analysis = user_analytics.analyze_user_behavior('user123')
        
        assert 'feature_usage' in analysis
        assert 'search' in analysis['feature_usage']
        assert 'frequency' in analysis

    def test_funnel_analysis(self, analytics_manager):
        """Test funnel analysis"""
        # Define funnel steps
        funnel_steps = [
            'view_product',
            'add_to_cart',
            'start_checkout',
            'complete_purchase'
        ]

        # Track funnel events
        user_id = 'user123'
        for step in funnel_steps[:-1]:  # User drops off before last step
            analytics_manager.track_funnel_step(user_id, step)

        # Analyze funnel
        funnel_data = analytics_manager.analyze_funnel(funnel_steps)
        
        assert funnel_data['completion_rate'] < 100
        assert funnel_data['dropoff_step'] == 'complete_purchase'
        assert len(funnel_data['steps']) == len(funnel_steps)

    def test_cohort_analysis(self, analytics_manager):
        """Test cohort analysis"""
        # Track user registrations and actions
        base_date = datetime.now() - timedelta(days=30)
        
        # Cohort 1 (Day 1)
        for user_id in range(100, 110):
            analytics_manager.track_user_registration(
                str(user_id),
                timestamp=base_date
            )
            # Track some user actions
            analytics_manager.track_user_action(str(user_id), {
                'action': 'login',
                'timestamp': base_date + timedelta(days=7)
            })

        # Get cohort analysis
        analysis = analytics_manager.analyze_cohorts(
            period='30d',
            interval='1w'
        )

        assert len(analysis['cohorts']) > 0
        assert 'retention_rates' in analysis
        assert 'engagement_metrics' in analysis

    def test_real_time_analytics(self, analytics_manager):
        """Test real-time analytics processing"""
        with patch.object(analytics_manager, 'process_real_time_event') as mock_process:
            # Track real-time event
            analytics_manager.track_real_time({
                'event_type': 'user_action',
                'action': 'click',
                'timestamp': datetime.now().isoformat()
            })

            # Verify immediate processing
            mock_process.assert_called_once()
            event = mock_process.call_args[0][0]
            assert event['event_type'] == 'user_action'

    def test_analytics_export(self, analytics_manager):
        """Test analytics data export"""
        # Track some events
        for i in range(10):
            analytics_manager.track_event({
                'event_type': 'test_event',
                'index': i
            })

        # Export data
        export_data = analytics_manager.export_data(
            start_date=datetime.now() - timedelta(days=1),
            end_date=datetime.now(),
            format='json'
        )

        # Verify export
        data = json.loads(export_data)
        assert len(data['events']) == 10
        assert 'metadata' in data

    def test_custom_metrics(self, analytics_manager):
        """Test custom metrics calculation"""
        # Define custom metric
        def engagement_score(events):
            return sum(1 for e in events if e['type'] == 'engagement')

        analytics_manager.register_custom_metric(
            'engagement_score',
            engagement_score
        )

        # Track events
        analytics_manager.track_event({
            'type': 'engagement',
            'action': 'comment'
        })
        analytics_manager.track_event({
            'type': 'engagement',
            'action': 'share'
        })

        # Calculate custom metric
        score = analytics_manager.calculate_custom_metric('engagement_score')
        assert score == 2

    def test_analytics_filtering(self, analytics_manager):
        """Test analytics data filtering"""
        # Track events with different properties
        analytics_manager.track_event({
            'type': 'purchase',
            'amount': 100,
            'category': 'electronics'
        })
        analytics_manager.track_event({
            'type': 'purchase',
            'amount': 50,
            'category': 'books'
        })

        # Filter events
        filtered = analytics_manager.filter_events({
            'type': 'purchase',
            'amount_gt': 75
        })

        assert len(filtered) == 1
        assert filtered[0]['category'] == 'electronics'
