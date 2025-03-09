import pytest
import jwt
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..authentication import (
    AuthenticationManager,
    JWTManager,
    OAuthProvider,
    AuthenticationError,
    TokenManager,
    UserSession
)

class TestAuthentication:
    """Test authentication utilities"""

    @pytest.fixture
    def auth_manager(self):
        """Create authentication manager instance"""
        return AuthenticationManager(
            config={
                'jwt_secret': 'test_secret',
                'token_expiry': 3600,
                'refresh_expiry': 86400,
                'session_store': 'memory'
            }
        )

    @pytest.fixture
    def jwt_manager(self):
        """Create JWT manager instance"""
        return JWTManager(
            secret_key='test_secret',
            algorithm='HS256'
        )

    @pytest.fixture
    def oauth_provider(self):
        """Create OAuth provider instance"""
        return OAuthProvider(
            client_id='test_client_id',
            client_secret='test_client_secret',
            redirect_uri='http://localhost/callback'
        )

    def test_basic_authentication(self, auth_manager):
        """Test basic authentication flow"""
        # Test credentials
        credentials = {
            'username': 'testuser',
            'password': 'testpass'
        }

        # Mock user verification
        with patch.object(auth_manager, 'verify_credentials', return_value=True):
            # Authenticate
            token = auth_manager.authenticate(credentials)
            
            assert token is not None
            assert 'access_token' in token
            assert 'refresh_token' in token

            # Verify token
            assert auth_manager.verify_token(token['access_token'])

    def test_jwt_operations(self, jwt_manager):
        """Test JWT token operations"""
        # Create payload
        payload = {
            'user_id': '123',
            'role': 'user',
            'exp': datetime.utcnow() + timedelta(hours=1)
        }

        # Generate token
        token = jwt_manager.generate_token(payload)
        assert token is not None

        # Verify token
        decoded = jwt_manager.verify_token(token)
        assert decoded['user_id'] == '123'
        assert decoded['role'] == 'user'

        # Test expired token
        expired_payload = payload.copy()
        expired_payload['exp'] = datetime.utcnow() - timedelta(hours=1)
        expired_token = jwt_manager.generate_token(expired_payload)
        
        with pytest.raises(jwt.ExpiredSignatureError):
            jwt_manager.verify_token(expired_token)

    def test_oauth_authentication(self, oauth_provider):
        """Test OAuth authentication flow"""
        # Mock OAuth endpoints
        with patch('requests.post') as mock_post:
            mock_post.return_value.json.return_value = {
                'access_token': 'oauth_token',
                'token_type': 'Bearer',
                'expires_in': 3600
            }

            # Exchange code for token
            token = oauth_provider.exchange_code('test_code')
            
            assert token['access_token'] == 'oauth_token'
            assert token['token_type'] == 'Bearer'

            # Get user info
            with patch('requests.get') as mock_get:
                mock_get.return_value.json.return_value = {
                    'id': '123',
                    'email': 'test@example.com'
                }
                
                user_info = oauth_provider.get_user_info(token['access_token'])
                assert user_info['email'] == 'test@example.com'

    def test_session_management(self, auth_manager):
        """Test user session management"""
        user_id = 'user123'
        
        # Create session
        session = auth_manager.create_session(user_id)
        assert session.is_active()
        
        # Verify session
        assert auth_manager.verify_session(session.id)
        
        # Invalidate session
        auth_manager.invalidate_session(session.id)
        assert not auth_manager.verify_session(session.id)

    def test_token_refresh(self, auth_manager):
        """Test token refresh mechanism"""
        # Create initial tokens
        initial_tokens = auth_manager.create_tokens('user123')
        
        # Wait briefly
        import time
        time.sleep(1)

        # Refresh token
        new_tokens = auth_manager.refresh_token(initial_tokens['refresh_token'])
        
        assert new_tokens['access_token'] != initial_tokens['access_token']
        assert auth_manager.verify_token(new_tokens['access_token'])

    def test_multi_factor_auth(self, auth_manager):
        """Test multi-factor authentication"""
        user_id = 'user123'

        # Generate MFA code
        mfa_code = auth_manager.generate_mfa_code(user_id)
        assert len(mfa_code) == 6  # Standard 6-digit code

        # Verify MFA code
        assert auth_manager.verify_mfa_code(user_id, mfa_code)

        # Test invalid code
        assert not auth_manager.verify_mfa_code(user_id, '000000')

    def test_rate_limiting(self, auth_manager):
        """Test authentication rate limiting"""
        # Configure rate limits
        auth_manager.set_rate_limit(max_attempts=3, window_seconds=60)

        # Simulate failed attempts
        for _ in range(3):
            with pytest.raises(AuthenticationError):
                auth_manager.authenticate({
                    'username': 'testuser',
                    'password': 'wrongpass'
                })

        # Next attempt should be blocked
        with pytest.raises(AuthenticationError) as exc_info:
            auth_manager.authenticate({
                'username': 'testuser',
                'password': 'testpass'
            })
        assert 'rate limit exceeded' in str(exc_info.value).lower()

    def test_password_hashing(self, auth_manager):
        """Test password hashing"""
        password = 'secure_password'

        # Hash password
        hashed = auth_manager.hash_password(password)
        assert hashed != password

        # Verify password
        assert auth_manager.verify_password(password, hashed)
        assert not auth_manager.verify_password('wrong_password', hashed)

    def test_token_blacklisting(self, auth_manager):
        """Test token blacklisting"""
        # Create token
        token = auth_manager.create_tokens('user123')
        
        # Blacklist token
        auth_manager.blacklist_token(token['access_token'])
        
        # Verify blacklisted token
        with pytest.raises(AuthenticationError):
            auth_manager.verify_token(token['access_token'])

    def test_authentication_events(self, auth_manager):
        """Test authentication event handling"""
        events = []

        def event_handler(event):
            events.append(event)

        auth_manager.on_auth_event(event_handler)

        # Trigger events
        auth_manager.authenticate({
            'username': 'testuser',
            'password': 'testpass'
        })
        auth_manager.logout('user123')

        assert len(events) == 2
        assert events[0]['type'] == 'login'
        assert events[1]['type'] == 'logout'

    def test_session_expiry(self, auth_manager):
        """Test session expiration"""
        # Create session with short expiry
        session = auth_manager.create_session(
            'user123',
            expires_in=timedelta(seconds=1)
        )
        
        assert auth_manager.verify_session(session.id)
        
        # Wait for expiration
        time.sleep(1.1)
        assert not auth_manager.verify_session(session.id)

    def test_concurrent_sessions(self, auth_manager):
        """Test concurrent session handling"""
        user_id = 'user123'
        
        # Configure max sessions
        auth_manager.set_max_concurrent_sessions(2)
        
        # Create sessions
        session1 = auth_manager.create_session(user_id)
        session2 = auth_manager.create_session(user_id)
        
        # Third session should invalidate first
        session3 = auth_manager.create_session(user_id)
        
        assert not auth_manager.verify_session(session1.id)
        assert auth_manager.verify_session(session2.id)
        assert auth_manager.verify_session(session3.id)
