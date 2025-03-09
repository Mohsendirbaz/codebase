import pytest
import json
import csv
import io
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..export import (
    ExportManager,
    ExportFormat,
    ExportJob,
    ExportError,
    DataFormatter,
    FileExporter
)

class TestExport:
    """Test export utilities"""

    @pytest.fixture
    def export_manager(self):
        """Create export manager instance"""
        return ExportManager(
            config={
                'export_path': '/tmp/exports',
                'max_file_size': 1024 * 1024 * 10,  # 10MB
                'supported_formats': ['json', 'csv', 'xlsx']
            }
        )

    @pytest.fixture
    def data_formatter(self):
        """Create data formatter instance"""
        return DataFormatter()

    @pytest.fixture
    def file_exporter(self):
        """Create file exporter instance"""
        return FileExporter()

    @pytest.fixture
    def sample_data(self):
        """Create sample data for testing"""
        return [
            {
                'id': 1,
                'name': 'John Doe',
                'email': 'john@example.com',
                'created_at': datetime.now().isoformat()
            },
            {
                'id': 2,
                'name': 'Jane Smith',
                'email': 'jane@example.com',
                'created_at': datetime.now().isoformat()
            }
        ]

    def test_json_export(self, export_manager, sample_data):
        """Test JSON export format"""
        # Create export job
        job = export_manager.create_export_job(
            data=sample_data,
            format=ExportFormat.JSON,
            options={'pretty': True}
        )

        # Execute export
        result = export_manager.execute_export(job)

        # Verify export
        assert result.success
        exported_data = json.loads(result.content)
        assert len(exported_data) == 2
        assert exported_data[0]['name'] == 'John Doe'
        assert 'created_at' in exported_data[0]

    def test_csv_export(self, export_manager, sample_data):
        """Test CSV export format"""
        # Create export job
        job = export_manager.create_export_job(
            data=sample_data,
            format=ExportFormat.CSV,
            options={'delimiter': ','}
        )

        # Execute export
        result = export_manager.execute_export(job)

        # Verify export
        assert result.success
        csv_reader = csv.DictReader(io.StringIO(result.content))
        rows = list(csv_reader)
        assert len(rows) == 2
        assert rows[0]['name'] == 'John Doe'
        assert 'email' in rows[0]

    def test_excel_export(self, export_manager, sample_data):
        """Test Excel export format"""
        # Create export job
        job = export_manager.create_export_job(
            data=sample_data,
            format=ExportFormat.XLSX,
            options={'sheet_name': 'Users'}
        )

        # Execute export
        result = export_manager.execute_export(job)

        # Verify export
        assert result.success
        assert result.content.startswith(b'PK')  # Excel file signature
        assert len(result.content) > 0

    def test_data_formatting(self, data_formatter):
        """Test data formatting"""
        # Test input data
        data = {
            'date': datetime.now(),
            'amount': 1234.5678,
            'status': True
        }

        # Format data
        formatted = data_formatter.format_data(
            data,
            date_format='%Y-%m-%d',
            number_format='%.2f'
        )

        assert isinstance(formatted['date'], str)
        assert formatted['amount'] == '1234.57'
        assert formatted['status'] == 'Yes'

    def test_export_filtering(self, export_manager, sample_data):
        """Test export data filtering"""
        # Create export job with filter
        job = export_manager.create_export_job(
            data=sample_data,
            format=ExportFormat.JSON,
            filters=[
                ('name', 'contains', 'John')
            ]
        )

        # Execute export
        result = export_manager.execute_export(job)

        # Verify filtered data
        exported_data = json.loads(result.content)
        assert len(exported_data) == 1
        assert exported_data[0]['name'] == 'John Doe'

    def test_export_transformation(self, export_manager, sample_data):
        """Test export data transformation"""
        def transform_func(item):
            return {
                'full_name': item['name'],
                'contact': item['email']
            }

        # Create export job with transformation
        job = export_manager.create_export_job(
            data=sample_data,
            format=ExportFormat.JSON,
            transform=transform_func
        )

        # Execute export
        result = export_manager.execute_export(job)

        # Verify transformed data
        exported_data = json.loads(result.content)
        assert 'full_name' in exported_data[0]
        assert 'contact' in exported_data[0]
        assert 'name' not in exported_data[0]

    def test_large_data_export(self, export_manager):
        """Test large data export handling"""
        # Generate large dataset
        large_data = [
            {'id': i, 'value': f'test{i}'}
            for i in range(10000)
        ]

        # Create export job
        job = export_manager.create_export_job(
            data=large_data,
            format=ExportFormat.JSON,
            options={'chunk_size': 1000}
        )

        # Execute export
        result = export_manager.execute_export(job)

        assert result.success
        assert result.chunks > 1
        assert job.progress == 100

    def test_export_error_handling(self, export_manager):
        """Test export error handling"""
        # Test invalid format
        with pytest.raises(ExportError):
            export_manager.create_export_job(
                data=[],
                format='invalid_format'
            )

        # Test invalid data
        with pytest.raises(ExportError):
            export_manager.create_export_job(
                data=None,
                format=ExportFormat.JSON
            )

    def test_async_export(self, export_manager, sample_data):
        """Test asynchronous export"""
        # Create async export job
        job = export_manager.create_export_job(
            data=sample_data,
            format=ExportFormat.JSON,
            async_export=True
        )

        # Start export
        export_manager.start_export(job)

        # Check status
        assert job.status in ['pending', 'processing', 'completed']
        
        # Wait for completion
        result = export_manager.wait_for_completion(job)
        assert result.success

    def test_export_compression(self, export_manager, sample_data):
        """Test export compression"""
        # Create export job with compression
        job = export_manager.create_export_job(
            data=sample_data,
            format=ExportFormat.JSON,
            compression='gzip'
        )

        # Execute export
        result = export_manager.execute_export(job)

        assert result.success
        assert result.compressed
        assert len(result.content) < len(json.dumps(sample_data))

    def test_export_metadata(self, export_manager, sample_data):
        """Test export metadata handling"""
        # Create export job with metadata
        job = export_manager.create_export_job(
            data=sample_data,
            format=ExportFormat.JSON,
            metadata={
                'creator': 'test_user',
                'description': 'Test export'
            }
        )

        # Execute export
        result = export_manager.execute_export(job)

        assert result.success
        assert result.metadata['creator'] == 'test_user'
        assert result.metadata['record_count'] == 2
        assert 'created_at' in result.metadata

    def test_export_validation(self, export_manager):
        """Test export validation"""
        # Test schema validation
        schema = {
            'required': ['id', 'name'],
            'properties': {
                'id': {'type': 'integer'},
                'name': {'type': 'string'}
            }
        }

        valid_data = [{'id': 1, 'name': 'Test'}]
        invalid_data = [{'id': 'invalid', 'name': 'Test'}]

        # Valid data should export successfully
        job = export_manager.create_export_job(
            data=valid_data,
            format=ExportFormat.JSON,
            schema=schema
        )
        result = export_manager.execute_export(job)
        assert result.success

        # Invalid data should raise error
        with pytest.raises(ExportError):
            export_manager.create_export_job(
                data=invalid_data,
                format=ExportFormat.JSON,
                schema=schema
            )
