import pytest
from unittest.mock import Mock, patch
from flask import Flask, request, Response
from werkzeug.test import EnvironBuilder
from ..middleware import (
    MiddlewareManager,
    Middleware,
    RequestMiddleware,
    ResponseMiddleware,
    MiddlewareError
)

class TestMiddleware:
    """Test middleware utilities"""

    @pytest.fixture
    def app(self):
        """Create Flask application instance"""
        app = Flask(__name__)
        
        @app.route('/test')
        def test_route():
            return {'message': 'test'}
            
        return app

    @pytest.fixture
    def middleware_manager(self, app):
        """Create middleware manager instance"""
        return MiddlewareManager(
            app,
            config={
                'enabled': True,
                'order': ['auth', 'logging', 'cors']
            }
        )

    def test_basic_middleware(self, middleware_manager, app):
        """Test basic middleware execution"""
        # Create test middleware
        class TestMiddleware(Middleware):
            def process_request(self, request):
                request.custom_attr = 'test_value'
                return request

            def process_response(self, response):
                response.headers['X-Custom'] = 'test_header'
                return response

        # Register middleware
        middleware_manager.add_middleware(TestMiddleware())

        # Create test request
        with app.test_client() as client:
            response = client.get('/test')
            
            assert response.status_code == 200
            assert response.headers['X-Custom'] == 'test_header'

    def test_middleware_order(self, middleware_manager):
        """Test middleware execution order"""
        execution_order = []

        class FirstMiddleware(Middleware):
            def process_request(self, request):
                execution_order.append('first')
                return request

        class SecondMiddleware(Middleware):
            def process_request(self, request):
                execution_order.append('second')
                return request

        # Register middlewares
        middleware_manager.add_middleware(FirstMiddleware())
        middleware_manager.add_middleware(SecondMiddleware())

        # Process request
        builder = EnvironBuilder(path='/test')
        request = builder.get_request()
        middleware_manager.process_request(request)

        assert execution_order == ['first', 'second']

    def test_request_modification(self, middleware_manager, app):
        """Test request modification in middleware"""
        class HeaderMiddleware(RequestMiddleware):
            def process_request(self, request):
                request.headers['X-Custom-Header'] = 'test_value'
                return request

        middleware_manager.add_middleware(HeaderMiddleware())

        with app.test_request_context('/test', headers={'Original': 'value'}):
            middleware_manager.process_request(request)
            assert request.headers['X-Custom-Header'] == 'test_value'
            assert request.headers['Original'] == 'value'

    def test_response_modification(self, middleware_manager):
        """Test response modification in middleware"""
        class ResponseHeaderMiddleware(ResponseMiddleware):
            def process_response(self, response):
                response.headers['X-Response-Header'] = 'modified'
                return response

        middleware_manager.add_middleware(ResponseHeaderMiddleware())

        response = Response('Test')
        modified = middleware_manager.process_response(response)
        
        assert modified.headers['X-Response-Header'] == 'modified'

    def test_middleware_error_handling(self, middleware_manager, app):
        """Test middleware error handling"""
        class ErrorMiddleware(Middleware):
            def process_request(self, request):
                raise MiddlewareError('Test error')

        middleware_manager.add_middleware(ErrorMiddleware())

        with app.test_client() as client:
            response = client.get('/test')
            assert response.status_code == 500

    def test_conditional_middleware(self, middleware_manager, app):
        """Test conditional middleware execution"""
        class ConditionalMiddleware(Middleware):
            def should_process(self, request):
                return 'api' in request.path

            def process_request(self, request):
                request.custom_attr = 'processed'
                return request

        middleware_manager.add_middleware(ConditionalMiddleware())

        with app.test_request_context('/api/test'):
            middleware_manager.process_request(request)
            assert hasattr(request, 'custom_attr')

        with app.test_request_context('/public/test'):
            middleware_manager.process_request(request)
            assert not hasattr(request, 'custom_attr')

    def test_middleware_chaining(self, middleware_manager):
        """Test middleware chaining"""
        modifications = []

        class ChainMiddleware1(Middleware):
            def process_request(self, request):
                modifications.append(1)
                return request

            def process_response(self, response):
                modifications.append(4)
                return response

        class ChainMiddleware2(Middleware):
            def process_request(self, request):
                modifications.append(2)
                return request

            def process_response(self, response):
                modifications.append(3)
                return response

        middleware_manager.add_middleware(ChainMiddleware1())
        middleware_manager.add_middleware(ChainMiddleware2())

        # Process request and response
        builder = EnvironBuilder(path='/test')
        request = builder.get_request()
        response = Response('Test')

        middleware_manager.process_request(request)
        middleware_manager.process_response(response)

        assert modifications == [1, 2, 3, 4]

    def test_async_middleware(self, middleware_manager):
        """Test async middleware execution"""
        import asyncio

        class AsyncMiddleware(Middleware):
            async def process_request(self, request):
                await asyncio.sleep(0.1)
                request.async_processed = True
                return request

        middleware_manager.add_middleware(AsyncMiddleware())

        # Process async request
        builder = EnvironBuilder(path='/test')
        request = builder.get_request()
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(middleware_manager.process_request_async(request))
        
        assert hasattr(request, 'async_processed')

    def test_middleware_context(self, middleware_manager, app):
        """Test middleware context sharing"""
        class ContextMiddleware(Middleware):
            def process_request(self, request):
                request.context = {'user_id': '123'}
                return request

            def process_response(self, response):
                response.headers['X-User-Id'] = request.context.get('user_id')
                return response

        middleware_manager.add_middleware(ContextMiddleware())

        with app.test_client() as client:
            response = client.get('/test')
            assert response.headers['X-User-Id'] == '123'

    def test_middleware_removal(self, middleware_manager):
        """Test middleware removal"""
        class RemovableMiddleware(Middleware):
            def process_request(self, request):
                request.processed = True
                return request

        middleware = RemovableMiddleware()
        middleware_manager.add_middleware(middleware)
        
        # Process request with middleware
        builder = EnvironBuilder(path='/test')
        request = builder.get_request()
        middleware_manager.process_request(request)
        assert hasattr(request, 'processed')

        # Remove middleware and process again
        middleware_manager.remove_middleware(middleware)
        request = builder.get_request()
        middleware_manager.process_request(request)
        assert not hasattr(request, 'processed')

    def test_middleware_state(self, middleware_manager):
        """Test middleware state management"""
        class StatefulMiddleware(Middleware):
            def __init__(self):
                self.request_count = 0

            def process_request(self, request):
                self.request_count += 1
                request.count = self.request_count
                return request

        middleware = StatefulMiddleware()
        middleware_manager.add_middleware(middleware)

        # Process multiple requests
        builder = EnvironBuilder(path='/test')
        for _ in range(3):
            request = builder.get_request()
            middleware_manager.process_request(request)
            assert request.count == middleware.request_count
