import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..security import (
    SecurityManager,
    CSRFProtection,
    XSSFilter,
    SecurityHeaders,
    RateLimiter,
    SecurityError,
    IPBlocker
)

class TestSecurity:
    """Test security utilities"""

    @pytest.fixture
    def security_manager(self):
        """Create security manager instance"""
        return SecurityManager(
            config={
                'csrf_enabled': True,
                'xss_protection': True,
                'rate_limiting': True,
                'secure_headers': True,
                'ip_blocking': True
            }
        )

    @pytest.fixture
    def csrf_protection(self):
        """Create CSRF protection instance"""
        return CSRFProtection(
            secret_key='test_secret',
            token_expiry=3600
        )

    @pytest.fixture
    def xss_filter(self):
        """Create XSS filter instance"""
        return XSSFilter(
            mode='strict',
            allowed_tags=['b', 'i', 'u']
        )

    def test_csrf_token_generation(self, csrf_protection):
        """Test CSRF token generation and validation"""
        # Generate token
        token = csrf_protection.generate_token()
        assert token is not None
        assert len(token) > 32  # Should be reasonably long

        # Validate token
        assert csrf_protection.validate_token(token)

        # Test invalid token
        assert not csrf_protection.validate_token('invalid_token')

    def test_csrf_double_submit_cookie(self, csrf_protection):
        """Test CSRF double submit cookie pattern"""
        # Generate token pair
        token, cookie = csrf_protection.generate_token_pair()

        # Validate pair
        assert csrf_protection.validate_token_pair(token, cookie)

        # Test mismatched pair
        assert not csrf_protection.validate_token_pair(token, 'wrong_cookie')

    def test_xss_filtering(self, xss_filter):
        """Test XSS filtering"""
        # Test clean content
        clean_html = "<b>Bold</b> and <i>italic</i>"
        filtered = xss_filter.clean(clean_html)
        assert filtered == clean_html

        # Test malicious content
        malicious_html = "<script>alert('xss')</script><b>Content</b>"
        filtered = xss_filter.clean(malicious_html)
        assert "<script>" not in filtered
        assert "<b>Content</b>" in filtered

    def test_security_headers(self, security_manager):
        """Test security headers"""
        # Get security headers
        headers = security_manager.get_security_headers()

        # Verify essential headers
        assert 'X-Content-Type-Options' in headers
        assert 'X-Frame-Options' in headers
        assert 'X-XSS-Protection' in headers
        assert 'Content-Security-Policy' in headers
        assert 'Strict-Transport-Security' in headers

        # Verify header values
        assert headers['X-Frame-Options'] == 'DENY'
        assert headers['X-Content-Type-Options'] == 'nosniff'

    def test_rate_limiting(self, security_manager):
        """Test rate limiting"""
        limiter = security_manager.rate_limiter
        client_ip = '127.0.0.1'

        # Test within limits
        for _ in range(10):
            assert limiter.check_rate_limit(client_ip)

        # Test exceeding limits
        limiter.set_limit(client_ip, max_requests=5, window=60)
        for _ in range(5):
            assert limiter.check_rate_limit(client_ip)
        assert not limiter.check_rate_limit(client_ip)

    def test_ip_blocking(self, security_manager):
        """Test IP blocking"""
        blocker = security_manager.ip_blocker
        ip = '192.168.1.1'

        # Test IP blocking
        blocker.block_ip(ip, reason='suspicious activity')
        assert blocker.is_blocked(ip)

        # Test IP block expiration
        blocker.block_ip(ip, duration=timedelta(seconds=1))
        time.sleep(1.1)
        assert not blocker.is_blocked(ip)

    def test_content_security_policy(self, security_manager):
        """Test Content Security Policy configuration"""
        # Configure CSP
        csp = security_manager.configure_csp({
            'default-src': ["'self'"],
            'script-src': ["'self'", 'trusted-scripts.com'],
            'style-src': ["'self'", 'trusted-styles.com'],
            'img-src': ['*']
        })

        # Verify CSP header
        assert "default-src 'self'" in csp
        assert "script-src 'self' trusted-scripts.com" in csp
        assert "style-src 'self' trusted-styles.com" in csp
        assert "img-src *" in csp

    def test_secure_cookie_settings(self, security_manager):
        """Test secure cookie settings"""
        # Get cookie settings
        settings = security_manager.get_cookie_settings()

        assert settings['secure'] is True
        assert settings['httponly'] is True
        assert settings['samesite'] == 'Strict'
        assert 'domain' in settings
        assert 'path' in settings

    def test_input_sanitization(self, security_manager):
        """Test input sanitization"""
        # Test HTML sanitization
        html_input = "<p onclick='alert(1)'>Text</p><script>evil()</script>"
        sanitized = security_manager.sanitize_html(html_input)
        assert 'onclick' not in sanitized
        assert '<script>' not in sanitized
        assert '<p>Text</p>' in sanitized

        # Test SQL injection prevention
        sql_input = "admin' OR '1'='1"
        sanitized = security_manager.sanitize_sql(sql_input)
        assert "'" not in sanitized
        assert "=" not in sanitized

    def test_security_audit_logging(self, security_manager):
        """Test security audit logging"""
        audit_logs = []

        def audit_handler(event):
            audit_logs.append(event)

        security_manager.set_audit_handler(audit_handler)

        # Trigger security events
        security_manager.log_security_event('csrf_failure', {'ip': '127.0.0.1'})
        security_manager.log_security_event('xss_attempt', {'input': '<script>'})

        assert len(audit_logs) == 2
        assert audit_logs[0]['type'] == 'csrf_failure'
        assert audit_logs[1]['type'] == 'xss_attempt'
        assert all('timestamp' in log for log in audit_logs)

    def test_security_response_headers(self, security_manager):
        """Test security response headers"""
        # Create mock response
        response = Mock()
        response.headers = {}

        # Apply security headers
        security_manager.apply_security_headers(response)

        # Verify headers
        headers = response.headers
        assert 'X-Content-Type-Options' in headers
        assert 'X-Frame-Options' in headers
        assert 'X-XSS-Protection' in headers
        assert 'Content-Security-Policy' in headers

    def test_trusted_proxies(self, security_manager):
        """Test trusted proxy configuration"""
        # Configure trusted proxies
        security_manager.set_trusted_proxies(['10.0.0.0/8', '192.168.1.0/24'])

        # Test proxy IP validation
        assert security_manager.is_trusted_proxy('10.0.0.1')
        assert security_manager.is_trusted_proxy('192.168.1.100')
        assert not security_manager.is_trusted_proxy('172.16.0.1')

    def test_security_middleware(self, security_manager):
        """Test security middleware"""
        # Create mock request
        request = Mock()
        request.headers = {'X-Forwarded-For': '127.0.0.1'}
        request.cookies = {}

        # Process request through middleware
        security_manager.process_request(request)

        # Verify security checks
        assert hasattr(request, 'csrf_token')
        assert hasattr(request, 'rate_limit_info')
        assert hasattr(request, 'security_context')
