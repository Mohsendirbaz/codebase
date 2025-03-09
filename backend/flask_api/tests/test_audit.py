import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..audit import (
    AuditLogger,
    AuditEvent,
    AuditFilter,
    AuditError,
    AuditExporter,
    ComplianceReport
)

class TestAudit:
    """Test audit logging utilities"""

    @pytest.fixture
    def audit_logger(self):
        """Create audit logger instance"""
        return AuditLogger(
            config={
                'storage': {
                    'type': 'sqlite',
                    'path': ':memory:'
                },
                'retention_days': 90,
                'compliance_mode': True
            }
        )

    @pytest.fixture
    def audit_event(self):
        """Create sample audit event"""
        return AuditEvent(
            event_type='user_action',
            user_id='user123',
            action='data_access',
            resource='customer_records',
            timestamp=datetime.now(),
            metadata={
                'ip_address': '192.168.1.1',
                'user_agent': 'Mozilla/5.0'
            }
        )

    def test_audit_logging(self, audit_logger, audit_event):
        """Test basic audit logging"""
        # Log audit event
        audit_logger.log(audit_event)

        # Verify logged event
        events = audit_logger.get_events(
            event_type='user_action',
            user_id='user123'
        )
        assert len(events) == 1
        assert events[0].action == 'data_access'
        assert events[0].resource == 'customer_records'

    def test_audit_filtering(self, audit_logger):
        """Test audit event filtering"""
        # Log multiple events
        events = [
            AuditEvent(
                event_type='security',
                action='login',
                user_id='user1',
                timestamp=datetime.now()
            ),
            AuditEvent(
                event_type='data',
                action='export',
                user_id='user2',
                timestamp=datetime.now()
            )
        ]
        for event in events:
            audit_logger.log(event)

        # Filter events
        security_events = audit_logger.filter_events(
            event_type='security'
        )
        assert len(security_events) == 1
        assert security_events[0].action == 'login'

    def test_compliance_reporting(self, audit_logger):
        """Test compliance reporting"""
        # Log compliance-related events
        audit_logger.log(AuditEvent(
            event_type='data_access',
            action='view',
            user_id='user1',
            resource='sensitive_data',
            timestamp=datetime.now()
        ))

        # Generate compliance report
        report = ComplianceReport(audit_logger)
        summary = report.generate_summary(
            start_date=datetime.now() - timedelta(days=1),
            end_date=datetime.now()
        )

        assert 'data_access_events' in summary
        assert summary['compliance_status'] == 'compliant'

    def test_audit_retention(self, audit_logger):
        """Test audit log retention"""
        # Log old event
        old_event = AuditEvent(
            event_type='test',
            action='old_action',
            timestamp=datetime.now() - timedelta(days=100)
        )
        audit_logger.log(old_event)

        # Clean up old events
        cleaned = audit_logger.cleanup_old_events()
        assert cleaned > 0

        # Verify old event is removed
        events = audit_logger.get_events(event_type='test')
        assert len(events) == 0

    def test_audit_export(self, audit_logger, audit_event):
        """Test audit log export"""
        audit_logger.log(audit_event)

        # Export audit logs
        exporter = AuditExporter(audit_logger)
        export_data = exporter.export_logs(
            format='json',
            start_date=datetime.now() - timedelta(days=1)
        )

        # Verify export data
        data = json.loads(export_data)
        assert len(data['events']) == 1
        assert data['events'][0]['event_type'] == 'user_action'

    def test_audit_search(self, audit_logger):
        """Test audit log searching"""
        # Log events with searchable content
        events = [
            AuditEvent(
                event_type='document',
                action='edit',
                resource='doc1',
                metadata={'changes': 'content update'}
            ),
            AuditEvent(
                event_type='document',
                action='view',
                resource='doc2'
            )
        ]
        for event in events:
            audit_logger.log(event)

        # Search audit logs
        results = audit_logger.search('content update')
        assert len(results) == 1
        assert results[0].resource == 'doc1'

    def test_audit_aggregation(self, audit_logger):
        """Test audit log aggregation"""
        # Log multiple events
        for _ in range(5):
            audit_logger.log(AuditEvent(
                event_type='api_call',
                action='get_data',
                user_id='user1'
            ))
        for _ in range(3):
            audit_logger.log(AuditEvent(
                event_type='api_call',
                action='get_data',
                user_id='user2'
            ))

        # Get aggregated stats
        stats = audit_logger.get_stats(
            group_by='user_id',
            metric='count'
        )
        assert stats['user1'] == 5
        assert stats['user2'] == 3

    def test_audit_integrity(self, audit_logger, audit_event):
        """Test audit log integrity"""
        # Log event with integrity check
        audit_logger.log(audit_event)

        # Verify integrity
        assert audit_logger.verify_integrity(audit_event.id)

        # Test tampering detection
        with pytest.raises(AuditError):
            audit_logger.verify_integrity('invalid_id')

    def test_audit_encryption(self, audit_logger):
        """Test audit log encryption"""
        # Log sensitive event
        sensitive_event = AuditEvent(
            event_type='user_data',
            action='access',
            metadata={'ssn': '123-45-6789'}
        )
        audit_logger.log(sensitive_event)

        # Verify encryption
        stored_event = audit_logger.get_event(sensitive_event.id)
        assert 'ssn' not in str(stored_event.metadata)
        
        # Verify decryption with proper access
        decrypted = audit_logger.get_event(
            sensitive_event.id,
            decrypt=True
        )
        assert decrypted.metadata['ssn'] == '123-45-6789'

    def test_audit_user_tracking(self, audit_logger):
        """Test user activity tracking"""
        # Log user activities
        user_id = 'user123'
        activities = [
            ('login', 'success'),
            ('access_report', 'success'),
            ('logout', 'success')
        ]

        for action, status in activities:
            audit_logger.log(AuditEvent(
                event_type='user_activity',
                user_id=user_id,
                action=action,
                status=status
            ))

        # Get user activity timeline
        timeline = audit_logger.get_user_timeline(user_id)
        assert len(timeline) == 3
        assert [e.action for e in timeline] == ['login', 'access_report', 'logout']

    def test_audit_alerts(self, audit_logger):
        """Test audit alerting"""
        # Configure alert
        audit_logger.add_alert_rule(
            event_type='security',
            conditions={
                'action': 'failed_login',
                'threshold': 3,
                'window': 300  # 5 minutes
            }
        )

        # Trigger alert condition
        alerts = []
        audit_logger.on_alert = lambda alert: alerts.append(alert)

        for _ in range(4):
            audit_logger.log(AuditEvent(
                event_type='security',
                action='failed_login',
                user_id='user123'
            ))

        assert len(alerts) == 1
        assert alerts[0]['event_type'] == 'security'
        assert alerts[0]['action'] == 'failed_login'

    def test_audit_reporting(self, audit_logger):
        """Test audit reporting"""
        # Log various events
        event_types = ['security', 'data_access', 'system']
        for event_type in event_types:
            audit_logger.log(AuditEvent(
                event_type=event_type,
                action='test_action'
            ))

        # Generate report
        report = audit_logger.generate_report(
            start_date=datetime.now() - timedelta(days=1),
            end_date=datetime.now(),
            group_by='event_type'
        )

        assert len(report['summary']) == len(event_types)
        assert sum(item['count'] for item in report['summary']) == len(event_types)
        assert 'charts' in report
