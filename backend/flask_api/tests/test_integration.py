import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..integration import (
    IntegrationManager,
    ServiceConnector,
    DataTransformer,
    IntegrationError,
    WebhookHandler,
    APIClient
)

class TestIntegration:
    """Test integration utilities"""

    @pytest.fixture
    def integration_manager(self):
        """Create integration manager instance"""
        return IntegrationManager(
            config={
                'service_registry': 'memory',
                'max_retries': 3,
                'timeout': 30,
                'async_enabled': True
            }
        )

    @pytest.fixture
    def service_connector(self):
        """Create service connector instance"""
        return ServiceConnector(
            base_url='https://api.example.com',
            auth_type='bearer',
            timeout=10
        )

    @pytest.fixture
    def webhook_handler(self):
        """Create webhook handler instance"""
        return WebhookHandler(
            secret_key='test_secret',
            verify_signature=True
        )

    def test_service_registration(self, integration_manager):
        """Test service registration"""
        # Register service
        service_config = {
            'name': 'test_service',
            'url': 'https://test.service.com',
            'auth': {
                'type': 'bearer',
                'token': 'test_token'
            }
        }
        integration_manager.register_service(service_config)

        # Verify registration
        service = integration_manager.get_service('test_service')
        assert service['name'] == 'test_service'
        assert service['url'] == 'https://test.service.com'
        assert service['auth']['type'] == 'bearer'

    def test_api_request(self, service_connector):
        """Test API request handling"""
        with patch('requests.request') as mock_request:
            mock_request.return_value.status_code = 200
            mock_request.return_value.json.return_value = {'data': 'test'}

            # Make API request
            response = service_connector.request(
                method='GET',
                endpoint='/api/test',
                params={'key': 'value'}
            )

            assert response.status_code == 200
            assert response.json()['data'] == 'test'
            mock_request.assert_called_once()

    def test_data_transformation(self, integration_manager):
        """Test data transformation"""
        transformer = DataTransformer()

        # Define transformation rules
        rules = {
            'user': {
                'map': {
                    'id': 'user_id',
                    'name': 'full_name',
                    'email': 'email_address'
                },
                'defaults': {
                    'status': 'active'
                }
            }
        }

        # Transform data
        input_data = {
            'user_id': 123,
            'full_name': 'Test User',
            'email_address': 'test@example.com'
        }

        result = transformer.transform(input_data, rules)
        assert result['id'] == 123
        assert result['name'] == 'Test User'
        assert result['email'] == 'test@example.com'
        assert result['status'] == 'active'

    def test_webhook_handling(self, webhook_handler):
        """Test webhook handling"""
        # Create test payload
        payload = {'event': 'test_event', 'data': {'key': 'value'}}
        signature = webhook_handler.generate_signature(payload)

        # Verify webhook
        assert webhook_handler.verify_webhook(payload, signature)

        # Test invalid signature
        assert not webhook_handler.verify_webhook(payload, 'invalid_signature')

    def test_error_handling(self, service_connector):
        """Test integration error handling"""
        with patch('requests.request') as mock_request:
            mock_request.side_effect = ConnectionError("Connection failed")

            # Test error handling
            with pytest.raises(IntegrationError) as exc_info:
                service_connector.request('GET', '/api/test')
            assert "Connection failed" in str(exc_info.value)

    def test_async_integration(self, integration_manager):
        """Test asynchronous integration"""
        import asyncio

        async def async_operation():
            await asyncio.sleep(0.1)
            return {'status': 'completed'}

        # Execute async operation
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            integration_manager.execute_async(async_operation)
        )

        assert result['status'] == 'completed'

    def test_service_health_check(self, integration_manager):
        """Test service health checking"""
        with patch('requests.get') as mock_get:
            mock_get.return_value.status_code = 200
            mock_get.return_value.json.return_value = {'status': 'healthy'}

            # Check service health
            status = integration_manager.check_service_health('test_service')
            assert status['status'] == 'healthy'

    def test_rate_limiting(self, service_connector):
        """Test rate limiting for integrations"""
        # Configure rate limits
        service_connector.set_rate_limit(
            max_requests=2,
            window_seconds=1
        )

        with patch('requests.request') as mock_request:
            mock_request.return_value.status_code = 200

            # Make requests within limit
            service_connector.request('GET', '/api/test')
            service_connector.request('GET', '/api/test')

            # Third request should be delayed
            start_time = datetime.now()
            service_connector.request('GET', '/api/test')
            duration = (datetime.now() - start_time).total_seconds()

            assert duration >= 1  # Should have waited for rate limit window

    def test_circuit_breaker(self, service_connector):
        """Test circuit breaker pattern"""
        # Configure circuit breaker
        service_connector.configure_circuit_breaker(
            failure_threshold=2,
            reset_timeout=1
        )

        with patch('requests.request') as mock_request:
            # Simulate failures
            mock_request.side_effect = ConnectionError("Failed")

            # Should break circuit after threshold
            for _ in range(2):
                try:
                    service_connector.request('GET', '/api/test')
                except IntegrationError:
                    pass

            # Circuit should be open
            with pytest.raises(IntegrationError) as exc_info:
                service_connector.request('GET', '/api/test')
            assert "Circuit breaker open" in str(exc_info.value)

    def test_data_validation(self, integration_manager):
        """Test integration data validation"""
        # Define schema
        schema = {
            'type': 'object',
            'required': ['id', 'name'],
            'properties': {
                'id': {'type': 'integer'},
                'name': {'type': 'string'},
                'email': {'type': 'string', 'format': 'email'}
            }
        }

        # Test valid data
        valid_data = {'id': 1, 'name': 'Test', 'email': 'test@example.com'}
        assert integration_manager.validate_data(valid_data, schema)

        # Test invalid data
        invalid_data = {'name': 'Test', 'email': 'invalid'}
        with pytest.raises(IntegrationError):
            integration_manager.validate_data(invalid_data, schema)

    def test_service_discovery(self, integration_manager):
        """Test service discovery"""
        # Register services
        services = [
            {'name': 'service1', 'type': 'api', 'url': 'http://service1.com'},
            {'name': 'service2', 'type': 'queue', 'url': 'http://service2.com'}
        ]
        for service in services:
            integration_manager.register_service(service)

        # Discover services by type
        api_services = integration_manager.discover_services(type='api')
        assert len(api_services) == 1
        assert api_services[0]['name'] == 'service1'

        queue_services = integration_manager.discover_services(type='queue')
        assert len(queue_services) == 1
        assert queue_services[0]['name'] == 'service2'
