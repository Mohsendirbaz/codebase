import pytest
from datetime import datetime
from unittest.mock import Mock, patch
from ..validation import (
    ValidationManager,
    Validator,
    ValidationRule,
    ValidationError,
    SchemaValidator,
    DataTransformer
)

class TestValidation:
    """Test validation utilities"""

    @pytest.fixture
    def validation_manager(self):
        """Create validation manager instance"""
        return ValidationManager(
            config={
                'strict_mode': True,
                'custom_types': {
                    'phone': r'^\+?1?\d{9,15}$'
                }
            }
        )

    @pytest.fixture
    def schema_validator(self):
        """Create schema validator instance"""
        return SchemaValidator()

    @pytest.fixture
    def data_transformer(self):
        """Create data transformer instance"""
        return DataTransformer()

    def test_basic_validation(self, validation_manager):
        """Test basic validation rules"""
        # Define validation rules
        rules = {
            'username': [
                ValidationRule('required'),
                ValidationRule('string'),
                ValidationRule('min_length', 3),
                ValidationRule('max_length', 20)
            ],
            'age': [
                ValidationRule('required'),
                ValidationRule('integer'),
                ValidationRule('min', 18)
            ]
        }

        # Valid data
        valid_data = {
            'username': 'testuser',
            'age': 25
        }
        assert validation_manager.validate(valid_data, rules)

        # Invalid data
        invalid_data = {
            'username': 'a',
            'age': 16
        }
        with pytest.raises(ValidationError) as exc_info:
            validation_manager.validate(invalid_data, rules)
        assert len(exc_info.value.errors) == 2

    def test_schema_validation(self, schema_validator):
        """Test schema validation"""
        # Define schema
        schema = {
            'type': 'object',
            'properties': {
                'id': {'type': 'integer'},
                'name': {'type': 'string'},
                'email': {'type': 'string', 'format': 'email'},
                'tags': {
                    'type': 'array',
                    'items': {'type': 'string'}
                }
            },
            'required': ['id', 'name', 'email']
        }

        # Valid data
        valid_data = {
            'id': 1,
            'name': 'Test User',
            'email': 'test@example.com',
            'tags': ['tag1', 'tag2']
        }
        assert schema_validator.validate(valid_data, schema)

        # Invalid data
        invalid_data = {
            'id': 'not_an_integer',
            'name': 123,
            'email': 'invalid_email'
        }
        with pytest.raises(ValidationError):
            schema_validator.validate(invalid_data, schema)

    def test_custom_validation_rules(self, validation_manager):
        """Test custom validation rules"""
        # Define custom rule
        def validate_even_number(value):
            if not isinstance(value, int) or value % 2 != 0:
                raise ValidationError('Value must be an even number')

        # Register custom rule
        validation_manager.register_rule('even_number', validate_even_number)

        # Test custom rule
        rules = {
            'number': [ValidationRule('even_number')]
        }

        assert validation_manager.validate({'number': 2}, rules)
        with pytest.raises(ValidationError):
            validation_manager.validate({'number': 3}, rules)

    def test_nested_validation(self, validation_manager):
        """Test nested object validation"""
        # Define nested rules
        rules = {
            'user': {
                'profile': {
                    'name': [
                        ValidationRule('required'),
                        ValidationRule('string')
                    ],
                    'address': {
                        'city': [ValidationRule('required')],
                        'zipcode': [ValidationRule('pattern', r'^\d{5}$')]
                    }
                }
            }
        }

        # Valid nested data
        valid_data = {
            'user': {
                'profile': {
                    'name': 'John Doe',
                    'address': {
                        'city': 'Test City',
                        'zipcode': '12345'
                    }
                }
            }
        }
        assert validation_manager.validate(valid_data, rules)

        # Invalid nested data
        invalid_data = {
            'user': {
                'profile': {
                    'name': 123,
                    'address': {
                        'city': '',
                        'zipcode': 'invalid'
                    }
                }
            }
        }
        with pytest.raises(ValidationError) as exc_info:
            validation_manager.validate(invalid_data, rules)
        assert len(exc_info.value.errors) == 3

    def test_data_transformation(self, data_transformer):
        """Test data transformation during validation"""
        # Define transformations
        transformations = {
            'name': str.strip,
            'age': int,
            'joined_at': lambda x: datetime.strptime(x, '%Y-%m-%d')
        }

        # Transform data
        input_data = {
            'name': '  John Doe  ',
            'age': '25',
            'joined_at': '2024-01-01'
        }

        result = data_transformer.transform(input_data, transformations)
        
        assert result['name'] == 'John Doe'
        assert isinstance(result['age'], int)
        assert isinstance(result['joined_at'], datetime)

    def test_conditional_validation(self, validation_manager):
        """Test conditional validation rules"""
        # Define conditional rules
        rules = {
            'payment_type': [ValidationRule('required')],
            'credit_card': [
                ValidationRule('required_if', field='payment_type', value='credit'),
                ValidationRule('pattern', r'^\d{16}$')
            ]
        }

        # Test with credit payment
        credit_data = {
            'payment_type': 'credit',
            'credit_card': '1234567890123456'
        }
        assert validation_manager.validate(credit_data, rules)

        # Test with other payment
        other_data = {
            'payment_type': 'cash'
        }
        assert validation_manager.validate(other_data, rules)

    def test_array_validation(self, validation_manager):
        """Test array validation"""
        # Define array rules
        rules = {
            'tags': [
                ValidationRule('array'),
                ValidationRule('min_items', 1),
                ValidationRule('max_items', 3),
                ValidationRule('unique_items')
            ]
        }

        # Valid array
        valid_data = {
            'tags': ['tag1', 'tag2']
        }
        assert validation_manager.validate(valid_data, rules)

        # Invalid array (duplicate items)
        invalid_data = {
            'tags': ['tag1', 'tag1', 'tag2']
        }
        with pytest.raises(ValidationError):
            validation_manager.validate(invalid_data, rules)

    def test_validation_messages(self, validation_manager):
        """Test custom validation messages"""
        # Define rules with custom messages
        rules = {
            'age': [
                ValidationRule('required', message='Age is required'),
                ValidationRule('integer', message='Age must be a number'),
                ValidationRule('min', 18, message='Must be 18 or older')
            ]
        }

        # Test custom messages
        with pytest.raises(ValidationError) as exc_info:
            validation_manager.validate({'age': 16}, rules)
        assert 'Must be 18 or older' in str(exc_info.value)

    def test_validation_context(self, validation_manager):
        """Test validation with context"""
        def validate_unique_username(value, context):
            existing_usernames = context.get('existing_usernames', [])
            if value in existing_usernames:
                raise ValidationError('Username already exists')

        # Register contextual rule
        validation_manager.register_rule('unique_username', validate_unique_username)

        # Define rules
        rules = {
            'username': [ValidationRule('unique_username')]
        }

        # Test with context
        context = {'existing_usernames': ['user1', 'user2']}
        
        assert validation_manager.validate({'username': 'newuser'}, rules, context)
        with pytest.raises(ValidationError):
            validation_manager.validate({'username': 'user1'}, rules, context)

    def test_validation_performance(self, validation_manager):
        """Test validation performance with large datasets"""
        # Create large dataset
        large_data = [
            {
                'id': i,
                'name': f'User {i}',
                'email': f'user{i}@example.com'
            }
            for i in range(1000)
        ]

        rules = {
            'id': [ValidationRule('required'), ValidationRule('integer')],
            'name': [ValidationRule('required'), ValidationRule('string')],
            'email': [ValidationRule('required'), ValidationRule('email')]
        }

        # Validate large dataset
        start_time = datetime.now()
        for item in large_data:
            validation_manager.validate(item, rules)
        duration = (datetime.now() - start_time).total_seconds()

        assert duration < 2.0  # Should validate 1000 items in under 2 seconds
