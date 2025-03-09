import pytest
import json
from unittest.mock import Mock, patch
from ..documentation import (
    DocumentationManager,
    APIDocGenerator,
    SchemaGenerator,
    DocError,
    MarkdownGenerator,
    ExampleGenerator
)

class TestDocumentation:
    """Test documentation utilities"""

    @pytest.fixture
    def doc_manager(self):
        """Create documentation manager instance"""
        return DocumentationManager(
            config={
                'output_path': '/tmp/docs',
                'template_path': 'templates/docs',
                'api_version': 'v1'
            }
        )

    @pytest.fixture
    def api_doc_generator(self):
        """Create API documentation generator instance"""
        return APIDocGenerator(
            title="Test API",
            description="API documentation for testing",
            version="1.0.0"
        )

    @pytest.fixture
    def schema_generator(self):
        """Create schema generator instance"""
        return SchemaGenerator()

    def test_api_endpoint_documentation(self, api_doc_generator):
        """Test API endpoint documentation generation"""
        # Add endpoint documentation
        api_doc_generator.add_endpoint(
            path='/api/v1/users',
            method='GET',
            summary='List users',
            description='Retrieve a list of system users',
            parameters=[
                {
                    'name': 'page',
                    'in': 'query',
                    'type': 'integer',
                    'description': 'Page number'
                }
            ],
            responses={
                '200': {
                    'description': 'Successful response',
                    'schema': {'$ref': '#/definitions/UserList'}
                }
            }
        )

        # Generate documentation
        docs = api_doc_generator.generate()
        
        assert 'paths' in docs
        assert '/api/v1/users' in docs['paths']
        assert 'get' in docs['paths']['/api/v1/users']
        assert docs['paths']['/api/v1/users']['get']['summary'] == 'List users'

    def test_schema_documentation(self, schema_generator):
        """Test schema documentation generation"""
        # Define model schema
        user_schema = {
            'type': 'object',
            'properties': {
                'id': {'type': 'integer'},
                'username': {'type': 'string'},
                'email': {'type': 'string', 'format': 'email'},
                'role': {'type': 'string', 'enum': ['user', 'admin']}
            },
            'required': ['username', 'email']
        }

        # Generate schema documentation
        docs = schema_generator.generate_schema_docs(
            name='User',
            schema=user_schema
        )

        assert 'User' in docs
        assert 'properties' in docs['User']
        assert 'required' in docs['User']
        assert len(docs['User']['required']) == 2

    def test_markdown_generation(self, doc_manager):
        """Test Markdown documentation generation"""
        # Add documentation content
        doc_manager.add_section(
            title='Getting Started',
            content="""
            # Getting Started
            
            This guide will help you get started with the API.
            
            ## Installation
            
            ```bash
            pip install my-api
            ```
            """
        )

        # Generate markdown
        markdown = doc_manager.generate_markdown()
        
        assert '# Getting Started' in markdown
        assert '## Installation' in markdown
        assert '```bash' in markdown
        assert 'pip install my-api' in markdown

    def test_example_generation(self, api_doc_generator):
        """Test example code generation"""
        # Add endpoint with examples
        api_doc_generator.add_endpoint(
            path='/api/v1/auth/login',
            method='POST',
            examples={
                'curl': '''
                curl -X POST https://api.example.com/v1/auth/login \\
                    -H "Content-Type: application/json" \\
                    -d '{"username": "test", "password": "password"}'
                ''',
                'python': '''
                import requests
                
                response = requests.post(
                    'https://api.example.com/v1/auth/login',
                    json={'username': 'test', 'password': 'password'}
                )
                '''
            }
        )

        # Generate documentation
        docs = api_doc_generator.generate()
        
        assert 'examples' in docs['paths']['/api/v1/auth/login']['post']
        assert 'curl' in docs['paths']['/api/v1/auth/login']['post']['examples']
        assert 'python' in docs['paths']['/api/v1/auth/login']['post']['examples']

    def test_documentation_validation(self, doc_manager):
        """Test documentation validation"""
        # Test valid documentation
        valid_doc = {
            'title': 'Valid Doc',
            'content': 'Valid content',
            'metadata': {'version': '1.0.0'}
        }
        assert doc_manager.validate_doc(valid_doc)

        # Test invalid documentation
        invalid_doc = {
            'title': '',  # Empty title
            'content': None  # Missing content
        }
        with pytest.raises(DocError):
            doc_manager.validate_doc(invalid_doc)

    def test_api_versioning_documentation(self, api_doc_generator):
        """Test API versioning documentation"""
        # Add versioned endpoints
        for version in ['v1', 'v2']:
            api_doc_generator.add_endpoint(
                path=f'/api/{version}/users',
                method='GET',
                version=version,
                summary=f'{version} users endpoint'
            )

        # Generate versioned documentation
        v1_docs = api_doc_generator.generate(version='v1')
        v2_docs = api_doc_generator.generate(version='v2')

        assert '/api/v1/users' in v1_docs['paths']
        assert '/api/v2/users' in v2_docs['paths']

    def test_documentation_search(self, doc_manager):
        """Test documentation search functionality"""
        # Add searchable content
        doc_manager.add_section(
            title='Authentication',
            content='Authentication using JWT tokens',
            tags=['auth', 'security']
        )
        doc_manager.add_section(
            title='Rate Limiting',
            content='API rate limiting rules',
            tags=['security']
        )

        # Search documentation
        results = doc_manager.search('authentication')
        assert len(results) == 1
        assert results[0]['title'] == 'Authentication'

        # Search by tag
        results = doc_manager.search_by_tag('security')
        assert len(results) == 2

    def test_documentation_export(self, doc_manager):
        """Test documentation export"""
        # Add content
        doc_manager.add_section(
            title='API Reference',
            content='API documentation'
        )

        # Export to different formats
        html = doc_manager.export('html')
        assert '<html>' in html
        assert 'API Reference' in html

        pdf = doc_manager.export('pdf')
        assert len(pdf) > 0
        assert pdf.startswith(b'%PDF')

    def test_interactive_examples(self, api_doc_generator):
        """Test interactive example generation"""
        # Add interactive example
        api_doc_generator.add_interactive_example(
            endpoint='/api/v1/users',
            method='POST',
            request_body={
                'username': 'test_user',
                'email': 'test@example.com'
            },
            response_body={
                'id': 1,
                'username': 'test_user',
                'email': 'test@example.com'
            }
        )

        # Generate documentation
        docs = api_doc_generator.generate()
        
        assert 'examples' in docs['paths']['/api/v1/users']['post']
        assert 'interactive' in docs['paths']['/api/v1/users']['post']['examples']

    def test_documentation_templates(self, doc_manager):
        """Test documentation template rendering"""
        # Add template
        template = """
        # {{title}}
        
        {{description}}
        
        ## Endpoints
        {% for endpoint in endpoints %}
        - {{endpoint.method}} {{endpoint.path}}
        {% endfor %}
        """

        # Render template
        content = doc_manager.render_template(
            template,
            {
                'title': 'API Documentation',
                'description': 'Test API documentation',
                'endpoints': [
                    {'method': 'GET', 'path': '/users'},
                    {'method': 'POST', 'path': '/users'}
                ]
            }
        )

        assert 'API Documentation' in content
        assert 'GET /users' in content
        assert 'POST /users' in content

    def test_documentation_metadata(self, doc_manager):
        """Test documentation metadata handling"""
        # Add documentation with metadata
        doc_manager.add_section(
            title='API Guide',
            content='Guide content',
            metadata={
                'author': 'Test Author',
                'created_at': '2025-03-09',
                'tags': ['guide', 'api']
            }
        )

        # Generate documentation with metadata
        docs = doc_manager.generate()
        
        assert 'metadata' in docs
        assert docs['metadata']['author'] == 'Test Author'
        assert 'created_at' in docs['metadata']
        assert 'tags' in docs['metadata']
