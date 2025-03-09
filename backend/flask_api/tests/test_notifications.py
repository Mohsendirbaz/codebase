import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..notifications import (
    NotificationManager,
    NotificationChannel,
    EmailNotifier,
    PushNotifier,
    NotificationError,
    NotificationTemplate
)

class TestNotifications:
    """Test notifications utilities"""

    @pytest.fixture
    def notification_manager(self):
        """Create notification manager instance"""
        return NotificationManager(
            config={
                'default_channel': 'email',
                'async_delivery': True,
                'retry_attempts': 3,
                'batch_size': 100
            }
        )

    @pytest.fixture
    def email_notifier(self):
        """Create email notifier instance"""
        return EmailNotifier(
            smtp_config={
                'host': 'smtp.test.com',
                'port': 587,
                'username': 'test',
                'password': 'test'
            }
        )

    @pytest.fixture
    def push_notifier(self):
        """Create push notifier instance"""
        return PushNotifier(
            provider='firebase',
            api_key='test_key'
        )

    def test_basic_notification(self, notification_manager):
        """Test basic notification sending"""
        # Create notification
        notification = {
            'recipient': 'user@example.com',
            'subject': 'Test Notification',
            'content': 'This is a test notification',
            'channel': 'email'
        }

        with patch('smtplib.SMTP') as mock_smtp:
            # Send notification
            result = notification_manager.send(notification)
            
            assert result['status'] == 'sent'
            assert result['recipient'] == 'user@example.com'
            mock_smtp.return_value.send_message.assert_called_once()

    def test_notification_templates(self, notification_manager):
        """Test notification templates"""
        # Create template
        template = NotificationTemplate(
            name='welcome_email',
            subject='Welcome {name}',
            content='Hello {name}, welcome to our service!'
        )
        notification_manager.register_template(template)

        # Send templated notification
        data = {'name': 'Test User'}
        result = notification_manager.send_template(
            'welcome_email',
            'user@example.com',
            data
        )

        assert result['subject'] == 'Welcome Test User'
        assert 'Hello Test User' in result['content']

    def test_push_notification(self, push_notifier):
        """Test push notification delivery"""
        with patch('requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {'message_id': '123'}

            # Send push notification
            result = push_notifier.send({
                'token': 'device_token',
                'title': 'Test Push',
                'body': 'Test message',
                'data': {'type': 'test'}
            })

            assert result['status'] == 'sent'
            assert result['message_id'] == '123'
            mock_post.assert_called_once()

    def test_notification_channels(self, notification_manager):
        """Test multiple notification channels"""
        # Register channels
        channels = {
            'email': Mock(spec=EmailNotifier),
            'push': Mock(spec=PushNotifier)
        }
        for name, channel in channels.items():
            notification_manager.register_channel(name, channel)

        # Send to multiple channels
        notification = {
            'recipient': 'user@example.com',
            'subject': 'Multi-channel Test',
            'content': 'Test content',
            'channels': ['email', 'push']
        }
        notification_manager.send(notification)

        # Verify all channels were used
        for channel in channels.values():
            channel.send.assert_called_once()

    def test_notification_batching(self, notification_manager):
        """Test notification batching"""
        notifications = [
            {
                'recipient': f'user{i}@example.com',
                'subject': 'Batch Test',
                'content': f'Test content {i}'
            }
            for i in range(5)
        ]

        with patch.object(notification_manager, '_send_batch') as mock_send:
            # Send batch
            notification_manager.send_batch(notifications)
            
            mock_send.assert_called_once()
            batch = mock_send.call_args[0][0]
            assert len(batch) == 5

    def test_notification_retry(self, notification_manager):
        """Test notification retry mechanism"""
        notification = {
            'recipient': 'user@example.com',
            'subject': 'Retry Test',
            'content': 'Test content'
        }

        with patch.object(notification_manager, '_send_single') as mock_send:
            # Simulate failures then success
            mock_send.side_effect = [
                NotificationError("Temporary failure"),
                NotificationError("Temporary failure"),
                {'status': 'sent'}
            ]

            result = notification_manager.send(notification)
            assert result['status'] == 'sent'
            assert mock_send.call_count == 3

    def test_notification_scheduling(self, notification_manager):
        """Test notification scheduling"""
        # Schedule future notification
        scheduled_time = datetime.now() + timedelta(hours=1)
        notification = {
            'recipient': 'user@example.com',
            'subject': 'Scheduled Test',
            'content': 'Test content',
            'scheduled_time': scheduled_time
        }

        # Schedule notification
        schedule_id = notification_manager.schedule(notification)
        
        # Verify scheduled notification
        scheduled = notification_manager.get_scheduled(schedule_id)
        assert scheduled['scheduled_time'] == scheduled_time
        assert scheduled['status'] == 'pending'

    def test_notification_preferences(self, notification_manager):
        """Test notification preferences"""
        # Set user preferences
        preferences = {
            'email': {
                'enabled': True,
                'frequency': 'immediate'
            },
            'push': {
                'enabled': False
            }
        }
        notification_manager.set_user_preferences('user123', preferences)

        # Send notification respecting preferences
        notification = {
            'recipient': 'user123',
            'subject': 'Test',
            'content': 'Test content',
            'channels': ['email', 'push']
        }
        result = notification_manager.send_with_preferences(notification)

        assert 'email' in result['sent_channels']
        assert 'push' not in result['sent_channels']

    def test_notification_templates_validation(self, notification_manager):
        """Test notification template validation"""
        # Test invalid template
        with pytest.raises(NotificationError):
            NotificationTemplate(
                name='invalid',
                subject='Welcome {name',  # Missing closing brace
                content='Hello {name}'
            )

        # Test missing required variable
        template = NotificationTemplate(
            name='test',
            subject='Welcome {name}',
            content='Hello {name}'
        )
        with pytest.raises(NotificationError):
            template.render({})  # Missing 'name' variable

    def test_notification_delivery_status(self, notification_manager):
        """Test notification delivery status tracking"""
        # Send notification with tracking
        notification = {
            'recipient': 'user@example.com',
            'subject': 'Status Test',
            'content': 'Test content',
            'track_status': True
        }

        with patch('smtplib.SMTP'):
            result = notification_manager.send(notification)
            status = notification_manager.get_status(result['notification_id'])

            assert status['delivered'] is True
            assert 'delivery_time' in status
            assert 'attempts' in status

    def test_notification_aggregation(self, notification_manager):
        """Test notification aggregation"""
        # Create multiple notifications
        notifications = [
            {
                'recipient': 'user@example.com',
                'subject': f'Test {i}',
                'content': f'Content {i}',
                'category': 'test'
            }
            for i in range(3)
        ]

        # Enable aggregation
        notification_manager.enable_aggregation(
            rules={
                'test': {
                    'aggregate_by': 'category',
                    'max_age': timedelta(hours=1)
                }
            }
        )

        # Send notifications
        for notification in notifications:
            notification_manager.send(notification)

        # Get aggregated notification
        aggregated = notification_manager.get_aggregated('user@example.com')
        assert len(aggregated['notifications']) == 3
        assert aggregated['subject'] == 'Test Notifications (3)'
