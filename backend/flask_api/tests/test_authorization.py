import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..authorization import (
    AuthorizationManager,
    Permission,
    Role,
    Policy,
    AuthorizationError,
    ResourceACL
)

class TestAuthorization:
    """Test authorization utilities"""

    @pytest.fixture
    def auth_manager(self):
        """Create authorization manager instance"""
        return AuthorizationManager(
            config={
                'policy_store': 'memory',
                'cache_ttl': 300,
                'strict_mode': True
            }
        )

    @pytest.fixture
    def test_role(self):
        """Create test role"""
        return Role(
            name='editor',
            permissions=[
                Permission('documents:read'),
                Permission('documents:write'),
                Permission('documents:delete', conditions=['owner'])
            ]
        )

    @pytest.fixture
    def test_policy(self):
        """Create test policy"""
        return Policy(
            name='document_access',
            effect='allow',
            actions=['read', 'write'],
            resources=['documents/*'],
            conditions={
                'ip_range': ['192.168.0.0/16'],
                'time_window': '09:00-17:00'
            }
        )

    def test_basic_authorization(self, auth_manager):
        """Test basic authorization checks"""
        # Set up permissions
        auth_manager.add_permission('documents:read')
        auth_manager.add_permission('documents:write')

        # Grant permission to user
        auth_manager.grant_permission('user1', 'documents:read')

        # Check permissions
        assert auth_manager.check_permission('user1', 'documents:read')
        assert not auth_manager.check_permission('user1', 'documents:write')

    def test_role_based_access(self, auth_manager, test_role):
        """Test role-based access control"""
        # Add role
        auth_manager.add_role(test_role)

        # Assign role to user
        auth_manager.assign_role('user1', 'editor')

        # Check role-based permissions
        assert auth_manager.check_permission('user1', 'documents:read')
        assert auth_manager.check_permission('user1', 'documents:write')
        
        # Check conditional permission
        context = {'user_id': 'user1', 'owner': True}
        assert auth_manager.check_permission('user1', 'documents:delete', context)

    def test_policy_evaluation(self, auth_manager, test_policy):
        """Test policy evaluation"""
        # Add policy
        auth_manager.add_policy(test_policy)

        # Test policy evaluation
        context = {
            'ip_address': '192.168.1.100',
            'request_time': '14:00'
        }

        assert auth_manager.evaluate_policy(
            'document_access',
            'read',
            'documents/123',
            context
        )

        # Test policy denial
        context['ip_address'] = '10.0.0.1'
        assert not auth_manager.evaluate_policy(
            'document_access',
            'read',
            'documents/123',
            context
        )

    def test_resource_acl(self, auth_manager):
        """Test resource ACL management"""
        resource_id = 'document123'
        acl = ResourceACL(resource_id)

        # Set ACL entries
        acl.add_entry('user1', ['read', 'write'])
        acl.add_entry('user2', ['read'])

        auth_manager.set_resource_acl(resource_id, acl)

        # Check ACL permissions
        assert auth_manager.check_resource_access('user1', 'read', resource_id)
        assert auth_manager.check_resource_access('user1', 'write', resource_id)
        assert auth_manager.check_resource_access('user2', 'read', resource_id)
        assert not auth_manager.check_resource_access('user2', 'write', resource_id)

    def test_hierarchical_roles(self, auth_manager):
        """Test hierarchical role inheritance"""
        # Create hierarchical roles
        admin_role = Role('admin', permissions=[Permission('*')])
        editor_role = Role('editor', permissions=[
            Permission('documents:read'),
            Permission('documents:write')
        ])
        viewer_role = Role('viewer', permissions=[Permission('documents:read')])

        # Set up hierarchy
        admin_role.add_child(editor_role)
        editor_role.add_child(viewer_role)

        auth_manager.add_role(admin_role)
        auth_manager.add_role(editor_role)
        auth_manager.add_role(viewer_role)

        # Assign roles
        auth_manager.assign_role('admin_user', 'admin')
        auth_manager.assign_role('editor_user', 'editor')
        auth_manager.assign_role('viewer_user', 'viewer')

        # Test permission inheritance
        assert auth_manager.check_permission('admin_user', 'documents:write')
        assert auth_manager.check_permission('editor_user', 'documents:write')
        assert not auth_manager.check_permission('viewer_user', 'documents:write')

    def test_dynamic_permissions(self, auth_manager):
        """Test dynamic permission resolution"""
        def check_time_window(context):
            if 'request_time' not in context:
                return False
            return 9 <= int(context['request_time'].split(':')[0]) <= 17

        # Add dynamic permission
        auth_manager.add_dynamic_permission(
            'time_restricted_access',
            check_time_window
        )

        # Test dynamic permission
        context = {'request_time': '14:00'}
        assert auth_manager.check_permission(
            'user1',
            'time_restricted_access',
            context
        )

        context = {'request_time': '20:00'}
        assert not auth_manager.check_permission(
            'user1',
            'time_restricted_access',
            context
        )

    def test_permission_wildcards(self, auth_manager):
        """Test wildcard permission matching"""
        # Grant wildcard permission
        auth_manager.grant_permission('user1', 'documents:*')

        # Test specific permissions
        assert auth_manager.check_permission('user1', 'documents:read')
        assert auth_manager.check_permission('user1', 'documents:write')
        assert auth_manager.check_permission('user1', 'documents:delete')

        # Test non-matching permissions
        assert not auth_manager.check_permission('user1', 'users:read')

    def test_temporary_permissions(self, auth_manager):
        """Test temporary permission grants"""
        # Grant temporary permission
        expiry = datetime.now() + timedelta(hours=1)
        auth_manager.grant_temporary_permission(
            'user1',
            'special_access',
            expiry
        )

        # Check permission
        assert auth_manager.check_permission('user1', 'special_access')

        # Simulate expiry
        with patch('datetime.datetime') as mock_datetime:
            mock_datetime.now.return_value = expiry + timedelta(minutes=1)
            assert not auth_manager.check_permission('user1', 'special_access')

    def test_group_permissions(self, auth_manager):
        """Test group-based permissions"""
        # Create group
        auth_manager.create_group('editors')
        auth_manager.add_group_permission('editors', 'documents:write')

        # Add users to group
        auth_manager.add_user_to_group('user1', 'editors')
        auth_manager.add_user_to_group('user2', 'editors')

        # Check group permissions
        assert auth_manager.check_permission('user1', 'documents:write')
        assert auth_manager.check_permission('user2', 'documents:write')

        # Remove user from group
        auth_manager.remove_user_from_group('user2', 'editors')
        assert not auth_manager.check_permission('user2', 'documents:write')

    def test_permission_conflicts(self, auth_manager):
        """Test permission conflict resolution"""
        # Set up conflicting permissions
        auth_manager.add_policy(Policy(
            name='allow_all',
            effect='allow',
            actions=['read'],
            resources=['documents/*']
        ))
        auth_manager.add_policy(Policy(
            name='deny_specific',
            effect='deny',
            actions=['read'],
            resources=['documents/secret']
        ))

        # Test conflict resolution (deny should take precedence)
        assert auth_manager.check_resource_access(
            'user1',
            'read',
            'documents/public'
        )
        assert not auth_manager.check_resource_access(
            'user1',
            'read',
            'documents/secret'
        )

    def test_authorization_audit(self, auth_manager):
        """Test authorization audit logging"""
        audit_logs = []

        def audit_handler(event):
            audit_logs.append(event)

        auth_manager.set_audit_handler(audit_handler)

        # Perform authorization checks
        auth_manager.check_permission('user1', 'test_permission')
        auth_manager.grant_permission('user1', 'new_permission')
        auth_manager.revoke_permission('user1', 'new_permission')

        assert len(audit_logs) == 3
        assert all('timestamp' in log for log in audit_logs)
        assert all('action' in log for log in audit_logs)
        assert all('user_id' in log for log in audit_logs)
