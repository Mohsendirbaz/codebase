import pytest
import json
import csv
import io
from datetime import datetime
from unittest.mock import Mock, patch
from ..importer import (
    ImportManager,
    ImportFormat,
    ImportJob,
    ImportError,
    DataValidator,
    DataTransformer
)

class TestImport:
    """Test import utilities"""

    @pytest.fixture
    def import_manager(self):
        """Create import manager instance"""
        return ImportManager(
            config={
                'import_path': '/tmp/imports',
                'max_file_size': 1024 * 1024 * 10,  # 10MB
                'supported_formats': ['json', 'csv', 'xlsx']
            }
        )

    @pytest.fixture
    def data_validator(self):
        """Create data validator instance"""
        return DataValidator()

    @pytest.fixture
    def data_transformer(self):
        """Create data transformer instance"""
        return DataTransformer()

    @pytest.fixture
    def sample_json_data(self):
        """Create sample JSON data"""
        return json.dumps([
            {
                'id': 1,
                'name': 'John Doe',
                'email': 'john@example.com',
                'age': 30
            },
            {
                'id': 2,
                'name': 'Jane Smith',
                'email': 'jane@example.com',
                'age': 25
            }
        ])

    @pytest.fixture
    def sample_csv_data(self):
        """Create sample CSV data"""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['id', 'name', 'email', 'age'])
        writer.writerow(['1', 'John Doe', 'john@example.com', '30'])
        writer.writerow(['2', 'Jane Smith', 'jane@example.com', '25'])
        return output.getvalue()

    def test_json_import(self, import_manager, sample_json_data):
        """Test JSON import format"""
        # Create import job
        job = import_manager.create_import_job(
            data=sample_json_data,
            format=ImportFormat.JSON
        )

        # Execute import
        result = import_manager.execute_import(job)

        # Verify import
        assert result.success
        assert len(result.imported_data) == 2
        assert result.imported_data[0]['name'] == 'John Doe'
        assert result.record_count == 2

    def test_csv_import(self, import_manager, sample_csv_data):
        """Test CSV import format"""
        # Create import job
        job = import_manager.create_import_job(
            data=sample_csv_data,
            format=ImportFormat.CSV,
            options={'delimiter': ','}
        )

        # Execute import
        result = import_manager.execute_import(job)

        # Verify import
        assert result.success
        assert len(result.imported_data) == 2
        assert result.imported_data[0]['name'] == 'John Doe'
        assert result.imported_data[0]['age'] == '30'

    def test_data_validation(self, data_validator):
        """Test data validation"""
        # Define schema
        schema = {
            'type': 'object',
            'required': ['id', 'name', 'email'],
            'properties': {
                'id': {'type': 'integer'},
                'name': {'type': 'string'},
                'email': {'type': 'string', 'format': 'email'},
                'age': {'type': 'integer', 'minimum': 0}
            }
        }

        # Valid data
        valid_data = {
            'id': 1,
            'name': 'John Doe',
            'email': 'john@example.com',
            'age': 30
        }
        assert data_validator.validate(valid_data, schema)

        # Invalid data
        invalid_data = {
            'id': 'invalid',
            'name': 'John Doe',
            'email': 'invalid-email'
        }
        with pytest.raises(ImportError):
            data_validator.validate(invalid_data, schema)

    def test_data_transformation(self, data_transformer):
        """Test data transformation"""
        # Define transformation rules
        rules = {
            'name': lambda x: x.upper(),
            'age': lambda x: int(x),
            'active': lambda x: bool(x)
        }

        # Transform data
        data = {
            'name': 'John Doe',
            'age': '30',
            'active': 1
        }
        transformed = data_transformer.transform(data, rules)

        assert transformed['name'] == 'JOHN DOE'
        assert isinstance(transformed['age'], int)
        assert isinstance(transformed['active'], bool)

    def test_import_filtering(self, import_manager, sample_json_data):
        """Test import data filtering"""
        # Create import job with filter
        job = import_manager.create_import_job(
            data=sample_json_data,
            format=ImportFormat.JSON,
            filters=[
                ('age', 'greater_than', 25)
            ]
        )

        # Execute import
        result = import_manager.execute_import(job)

        # Verify filtered data
        assert len(result.imported_data) == 1
        assert result.imported_data[0]['name'] == 'John Doe'

    def test_large_file_import(self, import_manager):
        """Test large file import handling"""
        # Generate large dataset
        large_data = []
        for i in range(10000):
            large_data.append({
                'id': i,
                'value': f'test{i}'
            })

        # Create import job
        job = import_manager.create_import_job(
            data=json.dumps(large_data),
            format=ImportFormat.JSON,
            options={'chunk_size': 1000}
        )

        # Execute import
        result = import_manager.execute_import(job)

        assert result.success
        assert result.chunks_processed > 1
        assert result.record_count == 10000

    def test_import_error_handling(self, import_manager):
        """Test import error handling"""
        # Test invalid format
        with pytest.raises(ImportError):
            import_manager.create_import_job(
                data='invalid data',
                format='invalid_format'
            )

        # Test invalid JSON
        with pytest.raises(ImportError):
            import_manager.create_import_job(
                data='invalid json',
                format=ImportFormat.JSON
            )

    def test_duplicate_handling(self, import_manager, sample_json_data):
        """Test duplicate record handling"""
        # Create import job with duplicate handling
        job = import_manager.create_import_job(
            data=sample_json_data,
            format=ImportFormat.JSON,
            options={
                'duplicate_handling': 'skip',
                'unique_key': 'id'
            }
        )

        # Execute import twice
        result1 = import_manager.execute_import(job)
        result2 = import_manager.execute_import(job)

        assert result1.success
        assert result2.success
        assert result2.skipped_records == 2

    def test_data_enrichment(self, import_manager, sample_json_data):
        """Test data enrichment during import"""
        def enrich_data(record):
            record['full_name'] = f"{record['name']}"
            record['import_date'] = datetime.now().isoformat()
            return record

        # Create import job with enrichment
        job = import_manager.create_import_job(
            data=sample_json_data,
            format=ImportFormat.JSON,
            transform=enrich_data
        )

        # Execute import
        result = import_manager.execute_import(job)

        assert result.success
        assert 'full_name' in result.imported_data[0]
        assert 'import_date' in result.imported_data[0]

    def test_import_dry_run(self, import_manager, sample_json_data):
        """Test import dry run"""
        # Create import job with dry run
        job = import_manager.create_import_job(
            data=sample_json_data,
            format=ImportFormat.JSON,
            dry_run=True
        )

        # Execute import
        result = import_manager.execute_import(job)

        assert result.success
        assert result.dry_run
        assert len(result.validation_results) > 0
        assert result.would_import == 2

    def test_import_progress_tracking(self, import_manager, sample_json_data):
        """Test import progress tracking"""
        progress_updates = []

        def progress_callback(current, total, status):
            progress_updates.append((current, total))

        # Create import job with progress tracking
        job = import_manager.create_import_job(
            data=sample_json_data,
            format=ImportFormat.JSON,
            progress_callback=progress_callback
        )

        # Execute import
        result = import_manager.execute_import(job)

        assert result.success
        assert len(progress_updates) > 0
        assert progress_updates[-1][0] == progress_updates[-1][1]  # Complete
