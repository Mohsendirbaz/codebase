import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..versioning import (
    VersionManager,
    Version,
    VersionControl,
    VersionError,
    ChangeSet,
    MigrationManager
)

class TestVersioning:
    """Test versioning utilities"""

    @pytest.fixture
    def version_manager(self):
        """Create version manager instance"""
        return VersionManager(
            config={
                'storage_path': ':memory:',
                'max_versions': 10,
                'auto_cleanup': True
            }
        )

    @pytest.fixture
    def version_control(self):
        """Create version control instance"""
        return VersionControl()

    @pytest.fixture
    def migration_manager(self):
        """Create migration manager instance"""
        return MigrationManager()

    def test_version_creation(self, version_manager):
        """Test version creation"""
        # Create version
        version = version_manager.create_version(
            name='v1.0.0',
            description='Initial version',
            changes=[
                {'type': 'add', 'path': '/api/v1/users'},
                {'type': 'modify', 'path': '/api/v1/auth'}
            ]
        )

        assert version.name == 'v1.0.0'
        assert version.description == 'Initial version'
        assert len(version.changes) == 2
        assert version.created_at is not None
        assert version.status == 'created'

    def test_version_activation(self, version_manager):
        """Test version activation"""
        # Create and activate version
        version = version_manager.create_version(name='v1.0.0')
        version_manager.activate_version(version.id)

        # Verify activation
        active_version = version_manager.get_active_version()
        assert active_version.id == version.id
        assert active_version.status == 'active'

    def test_version_rollback(self, version_manager):
        """Test version rollback"""
        # Create versions
        v1 = version_manager.create_version(name='v1.0.0')
        v2 = version_manager.create_version(name='v1.1.0')
        version_manager.activate_version(v2.id)

        # Rollback to v1
        version_manager.rollback_to_version(v1.id)
        
        active_version = version_manager.get_active_version()
        assert active_version.id == v1.id
        assert active_version.status == 'active'
        assert version_manager.get_version(v2.id).status == 'inactive'

    def test_change_set_management(self, version_control):
        """Test change set management"""
        # Create change set
        change_set = version_control.create_change_set([
            {
                'type': 'add',
                'path': '/api/v1/users',
                'data': {'method': 'POST'}
            },
            {
                'type': 'delete',
                'path': '/api/v1/legacy'
            }
        ])

        assert len(change_set.changes) == 2
        assert change_set.status == 'pending'

        # Apply change set
        version_control.apply_change_set(change_set.id)
        assert change_set.status == 'applied'

        # Revert change set
        version_control.revert_change_set(change_set.id)
        assert change_set.status == 'reverted'

    def test_version_dependencies(self, version_manager):
        """Test version dependencies"""
        # Create dependent versions
        v1 = version_manager.create_version(name='v1.0.0')
        v2 = version_manager.create_version(
            name='v1.1.0',
            dependencies=[v1.id]
        )

        # Verify dependencies
        assert version_manager.check_dependencies(v2.id)
        assert not version_manager.check_dependencies(v1.id)

        # Test dependency violation
        with pytest.raises(VersionError):
            version_manager.delete_version(v1.id)  # Can't delete with dependent version

    def test_version_migration(self, migration_manager):
        """Test version migration"""
        # Define migration steps
        def migrate_up(context):
            context['executed_steps'].append('up')

        def migrate_down(context):
            context['executed_steps'].append('down')

        # Create migration
        context = {'executed_steps': []}
        migration = migration_manager.create_migration(
            'test_migration',
            up=migrate_up,
            down=migrate_down
        )

        # Execute migration
        migration_manager.execute_migration(migration.id, context)
        assert context['executed_steps'] == ['up']

        # Rollback migration
        migration_manager.rollback_migration(migration.id, context)
        assert context['executed_steps'] == ['up', 'down']

    def test_version_validation(self, version_manager):
        """Test version validation"""
        # Test valid version
        valid_version = {
            'name': 'v1.0.0',
            'description': 'Valid version',
            'changes': [{'type': 'add', 'path': '/test'}]
        }
        assert version_manager.validate_version(valid_version)

        # Test invalid version
        invalid_version = {
            'name': 'invalid version',  # Invalid format
            'changes': 'not a list'  # Invalid type
        }
        with pytest.raises(VersionError):
            version_manager.validate_version(invalid_version)

    def test_version_conflict_detection(self, version_control):
        """Test version conflict detection"""
        # Create conflicting changes
        change1 = version_control.create_change_set([
            {'type': 'modify', 'path': '/test', 'data': {'value': 1}}
        ])
        change2 = version_control.create_change_set([
            {'type': 'modify', 'path': '/test', 'data': {'value': 2}}
        ])

        # Detect conflicts
        conflicts = version_control.detect_conflicts([change1, change2])
        assert len(conflicts) == 1
        assert conflicts[0]['path'] == '/test'

    def test_version_history(self, version_manager):
        """Test version history tracking"""
        # Create version history
        versions = []
        for i in range(3):
            version = version_manager.create_version(
                name=f'v1.{i}.0',
                description=f'Version 1.{i}.0'
            )
            version_manager.activate_version(version.id)
            versions.append(version)

        # Get version history
        history = version_manager.get_version_history()
        assert len(history) == 3
        assert [v.name for v in history] == ['v1.2.0', 'v1.1.0', 'v1.0.0']

    def test_version_cleanup(self, version_manager):
        """Test version cleanup"""
        # Create old versions
        old_date = datetime.now() - timedelta(days=30)
        for i in range(5):
            version = version_manager.create_version(name=f'old_v{i}')
            version.created_at = old_date

        # Run cleanup
        cleaned = version_manager.cleanup_old_versions(
            max_age=timedelta(days=7)
        )
        assert cleaned == 5

    def test_version_metadata(self, version_manager):
        """Test version metadata handling"""
        # Create version with metadata
        metadata = {
            'author': 'test_user',
            'review_status': 'approved',
            'deployment_env': 'staging'
        }
        version = version_manager.create_version(
            name='v1.0.0',
            metadata=metadata
        )

        # Verify metadata
        assert version.metadata['author'] == 'test_user'
        assert version.metadata['review_status'] == 'approved'

        # Update metadata
        version_manager.update_version_metadata(
            version.id,
            {'deployment_env': 'production'}
        )
        updated = version_manager.get_version(version.id)
        assert updated.metadata['deployment_env'] == 'production'

    def test_version_branching(self, version_control):
        """Test version branching"""
        # Create main version
        main = version_control.create_branch('main')
        version_control.create_version('v1.0.0', branch=main)

        # Create feature branch
        feature = version_control.create_branch('feature', parent=main)
        feature_version = version_control.create_version(
            'v1.1.0-feature',
            branch=feature
        )

        # Merge feature to main
        version_control.merge_branch(feature, main)
        main_versions = version_control.get_branch_versions(main)
        assert len(main_versions) == 2
        assert feature_version.id in [v.id for v in main_versions]
