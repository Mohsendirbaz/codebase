import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..session import (
    SessionManager,
    Session,
    SessionStore,
    SessionError,
    RedisSessionStore,
    MemorySessionStore
)

class TestSession:
    """Test session utilities"""

    @pytest.fixture
    def session_manager(self):
        """Create session manager instance"""
        return SessionManager(
            config={
                'store_type': 'memory',
                'session_timeout': 3600,
                'cleanup_interval': 300,
                'max_sessions': 10000
            }
        )

    @pytest.fixture
    def memory_store(self):
        """Create memory session store instance"""
        return MemorySessionStore()

    @pytest.fixture
    def redis_store(self):
        """Create Redis session store instance"""
        with patch('redis.Redis') as mock_redis:
            store = RedisSessionStore(
                host='localhost',
                port=6379,
                db=0
            )
            yield store

    def test_session_creation(self, session_manager):
        """Test session creation and retrieval"""
        # Create session
        user_data = {'user_id': '123', 'role': 'user'}
        session = session_manager.create_session(user_data)

        assert session.id is not None
        assert session.data == user_data
        assert session.is_valid()

        # Retrieve session
        retrieved = session_manager.get_session(session.id)
        assert retrieved.data == user_data

    def test_session_expiration(self, session_manager):
        """Test session expiration"""
        # Create session with short timeout
        session = session_manager.create_session(
            {'user_id': '123'},
            timeout=1
        )

        assert session.is_valid()

        # Wait for expiration
        import time
        time.sleep(1.1)

        # Session should be expired
        assert not session.is_valid()
        with pytest.raises(SessionError):
            session_manager.get_session(session.id)

    def test_session_data_management(self, session_manager):
        """Test session data management"""
        # Create session
        session = session_manager.create_session({'counter': 0})

        # Update data
        session.data['counter'] += 1
        session_manager.save_session(session)

        # Verify update
        updated = session_manager.get_session(session.id)
        assert updated.data['counter'] == 1

        # Delete data
        session_manager.delete_session(session.id)
        with pytest.raises(SessionError):
            session_manager.get_session(session.id)

    def test_session_store_operations(self, memory_store):
        """Test session store operations"""
        # Create session data
        session_id = 'test_session'
        session_data = {'test_key': 'test_value'}

        # Save to store
        memory_store.save(session_id, session_data)

        # Load from store
        loaded_data = memory_store.load(session_id)
        assert loaded_data == session_data

        # Delete from store
        memory_store.delete(session_id)
        assert memory_store.load(session_id) is None

    def test_redis_session_store(self, redis_store):
        """Test Redis session store"""
        with patch('redis.Redis') as mock_redis:
            instance = mock_redis.return_value
            instance.get.return_value = b'{"test_key": "test_value"}'
            instance.set.return_value = True

            # Save session
            redis_store.save('test_session', {'test_key': 'test_value'})
            
            # Load session
            data = redis_store.load('test_session')
            assert data['test_key'] == 'test_value'

            # Verify Redis calls
            instance.set.assert_called_once()
            instance.get.assert_called_once_with('test_session')

    def test_session_cleanup(self, session_manager):
        """Test session cleanup"""
        # Create expired sessions
        expired_time = datetime.now() - timedelta(hours=2)
        
        for i in range(3):
            session = session_manager.create_session({'user_id': f'user{i}'})
            session.last_accessed = expired_time
            session_manager.save_session(session)

        # Run cleanup
        cleaned = session_manager.cleanup_expired_sessions()
        assert cleaned == 3

        # Verify sessions are removed
        active_sessions = session_manager.get_active_sessions()
        assert len(active_sessions) == 0

    def test_session_activity_tracking(self, session_manager):
        """Test session activity tracking"""
        # Create session
        session = session_manager.create_session({'user_id': '123'})
        initial_access = session.last_accessed

        # Wait briefly
        import time
        time.sleep(0.1)

        # Access session
        session_manager.get_session(session.id)
        assert session.last_accessed > initial_access

    def test_concurrent_sessions(self, session_manager):
        """Test concurrent session handling"""
        user_id = 'user123'
        
        # Set max concurrent sessions
        session_manager.set_max_concurrent_sessions(2)

        # Create sessions
        session1 = session_manager.create_session({'user_id': user_id})
        session2 = session_manager.create_session({'user_id': user_id})
        
        # Third session should cause first to be invalidated
        session3 = session_manager.create_session({'user_id': user_id})

        assert not session_manager.is_valid_session(session1.id)
        assert session_manager.is_valid_session(session2.id)
        assert session_manager.is_valid_session(session3.id)

    def test_session_events(self, session_manager):
        """Test session event handling"""
        events = []

        def event_handler(event):
            events.append(event)

        session_manager.on_session_event(event_handler)

        # Trigger session events
        session = session_manager.create_session({'user_id': '123'})
        session_manager.delete_session(session.id)

        assert len(events) == 2
        assert events[0]['type'] == 'created'
        assert events[1]['type'] == 'deleted'

    def test_session_data_validation(self, session_manager):
        """Test session data validation"""
        # Define validation rules
        def validate_user_data(data):
            return 'user_id' in data and isinstance(data['user_id'], str)

        session_manager.set_data_validator(validate_user_data)

        # Test valid data
        valid_session = session_manager.create_session({'user_id': '123'})
        assert valid_session.is_valid()

        # Test invalid data
        with pytest.raises(SessionError):
            session_manager.create_session({'invalid_key': 'value'})

    def test_session_serialization(self, session_manager):
        """Test session serialization"""
        # Create session with complex data
        complex_data = {
            'user_id': '123',
            'preferences': {
                'theme': 'dark',
                'notifications': True
            },
            'last_login': datetime.now()
        }

        session = session_manager.create_session(complex_data)
        
        # Retrieve and verify data
        retrieved = session_manager.get_session(session.id)
        assert retrieved.data['user_id'] == complex_data['user_id']
        assert retrieved.data['preferences'] == complex_data['preferences']
        assert isinstance(retrieved.data['last_login'], datetime)

    def test_session_store_failover(self, session_manager):
        """Test session store failover"""
        # Configure backup store
        backup_store = MemorySessionStore()
        session_manager.set_backup_store(backup_store)

        # Simulate primary store failure
        with patch.object(session_manager.store, 'save', side_effect=Exception('Store failure')):
            # Should failover to backup store
            session = session_manager.create_session({'user_id': '123'})
            assert session.id in backup_store.sessions

        # Verify session can still be retrieved
        retrieved = session_manager.get_session(session.id)
        assert retrieved.data['user_id'] == '123'
