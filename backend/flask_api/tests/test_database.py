import pytest
from datetime import datetime
from unittest.mock import Mock, patch
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from ..database import (
    DatabaseManager,
    Model,
    QueryBuilder,
    DatabaseError,
    Transaction,
    Migration
)

class TestDatabase:
    """Test database utilities"""

    @pytest.fixture
    def db_manager(self):
        """Create database manager instance"""
        return DatabaseManager(
            config={
                'url': 'sqlite:///:memory:',
                'pool_size': 5,
                'max_overflow': 10,
                'echo': False
            }
        )

    @pytest.fixture
    def query_builder(self):
        """Create query builder instance"""
        return QueryBuilder()

    @pytest.fixture
    def test_model(self):
        """Create test model class"""
        class User(Model):
            __tablename__ = 'users'
            
            id = Model.Column(Model.Integer, primary_key=True)
            name = Model.Column(Model.String(50))
            email = Model.Column(Model.String(100), unique=True)
            created_at = Model.Column(Model.DateTime, default=datetime.utcnow)

        return User

    def test_database_connection(self, db_manager):
        """Test database connection management"""
        # Test connection establishment
        with db_manager.connect() as conn:
            result = conn.execute(text('SELECT 1')).scalar()
            assert result == 1

        # Test connection pool
        connections = []
        for _ in range(3):
            conn = db_manager.get_connection()
            connections.append(conn)
            
        assert len(connections) == 3
        for conn in connections:
            conn.close()

    def test_model_operations(self, db_manager, test_model):
        """Test model CRUD operations"""
        # Create tables
        db_manager.create_tables([test_model])

        # Create session
        session = db_manager.create_session()

        # Create user
        user = test_model(
            name='Test User',
            email='test@example.com'
        )
        session.add(user)
        session.commit()

        # Read user
        retrieved = session.query(test_model).first()
        assert retrieved.name == 'Test User'
        assert retrieved.email == 'test@example.com'

        # Update user
        retrieved.name = 'Updated User'
        session.commit()
        updated = session.query(test_model).first()
        assert updated.name == 'Updated User'

        # Delete user
        session.delete(updated)
        session.commit()
        assert session.query(test_model).count() == 0

    def test_query_builder(self, query_builder, test_model):
        """Test query builder functionality"""
        # Build complex query
        query = (query_builder
                .select(test_model)
                .where(test_model.name.like('%Test%'))
                .order_by(test_model.created_at.desc())
                .limit(10)
                .build())

        # Verify query components
        assert 'SELECT' in str(query)
        assert 'WHERE' in str(query)
        assert 'ORDER BY' in str(query)
        assert 'LIMIT' in str(query)

    def test_transaction_management(self, db_manager, test_model):
        """Test transaction management"""
        db_manager.create_tables([test_model])
        session = db_manager.create_session()

        # Test successful transaction
        with Transaction(session) as transaction:
            user = test_model(name='Transaction User')
            session.add(user)

        assert session.query(test_model).count() == 1

        # Test failed transaction
        try:
            with Transaction(session) as transaction:
                user = test_model(name='Failed User')
                session.add(user)
                raise Exception('Rollback test')
        except Exception:
            pass

        assert session.query(test_model).count() == 1  # Still 1 after rollback

    def test_migration_management(self, db_manager):
        """Test database migration management"""
        # Create migration
        migration = Migration(
            'add_users_table',
            up="""
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY,
                    name TEXT,
                    email TEXT
                )
            """,
            down="DROP TABLE users"
        )

        # Apply migration
        db_manager.apply_migration(migration)
        
        # Verify table exists
        with db_manager.connect() as conn:
            result = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
            )).scalar()
            assert result == 'users'

        # Rollback migration
        db_manager.rollback_migration(migration)
        
        # Verify table is dropped
        with db_manager.connect() as conn:
            result = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
            )).scalar()
            assert result is None

    def test_connection_error_handling(self, db_manager):
        """Test database connection error handling"""
        # Test with invalid connection URL
        with pytest.raises(DatabaseError):
            DatabaseManager(config={'url': 'invalid://url'})

        # Test connection timeout
        with patch('sqlalchemy.create_engine') as mock_create_engine:
            mock_create_engine.side_effect = Exception('Connection timeout')
            with pytest.raises(DatabaseError):
                db_manager.connect()

    def test_query_error_handling(self, db_manager, test_model):
        """Test query error handling"""
        db_manager.create_tables([test_model])
        session = db_manager.create_session()

        # Test unique constraint violation
        user1 = test_model(email='test@example.com')
        user2 = test_model(email='test@example.com')  # Same email
        
        session.add(user1)
        session.commit()
        
        session.add(user2)
        with pytest.raises(DatabaseError):
            session.commit()

    def test_bulk_operations(self, db_manager, test_model):
        """Test bulk database operations"""
        db_manager.create_tables([test_model])
        session = db_manager.create_session()

        # Bulk insert
        users = [
            test_model(name=f'User{i}', email=f'user{i}@example.com')
            for i in range(100)
        ]
        
        session.bulk_save_objects(users)
        session.commit()

        assert session.query(test_model).count() == 100

        # Bulk update
        session.query(test_model).filter(
            test_model.name.like('User%')
        ).update({'name': text("'Updated' || name")})
        session.commit()

        assert session.query(test_model).filter(
            test_model.name.like('Updated%')
        ).count() == 100

    def test_connection_pooling(self, db_manager):
        """Test database connection pooling"""
        # Get multiple connections
        connections = []
        for _ in range(7):  # More than pool_size (5)
            try:
                conn = db_manager.get_connection()
                connections.append(conn)
            except DatabaseError as e:
                assert len(connections) == 5  # Should fail after pool is exhausted
                break

        # Return connections to pool
        for conn in connections:
            conn.close()

        # Should be able to get a connection again
        conn = db_manager.get_connection()
        assert conn is not None
        conn.close()

    def test_model_relationships(self, db_manager):
        """Test model relationships"""
        class Post(Model):
            __tablename__ = 'posts'
            id = Model.Column(Model.Integer, primary_key=True)
            user_id = Model.Column(Model.Integer, Model.ForeignKey('users.id'))
            title = Model.Column(Model.String(100))
            user = Model.relationship('User', back_populates='posts')

        class User(Model):
            __tablename__ = 'users'
            id = Model.Column(Model.Integer, primary_key=True)
            name = Model.Column(Model.String(50))
            posts = Model.relationship('Post', back_populates='user')

        # Create tables
        db_manager.create_tables([User, Post])
        session = db_manager.create_session()

        # Create related records
        user = User(name='Test User')
        post = Post(title='Test Post')
        user.posts.append(post)

        session.add(user)
        session.commit()

        # Query relationships
        retrieved_user = session.query(User).first()
        assert len(retrieved_user.posts) == 1
        assert retrieved_user.posts[0].title == 'Test Post'

    def test_query_optimization(self, db_manager, test_model):
        """Test query optimization"""
        db_manager.create_tables([test_model])
        session = db_manager.create_session()

        # Add test data
        for i in range(100):
            user = test_model(name=f'User{i}', email=f'user{i}@example.com')
            session.add(user)
        session.commit()

        # Test eager loading
        query = session.query(test_model).options(
            db_manager.joinedload('posts')
        )
        assert 'JOIN' in str(query)

        # Test query execution plan
        plan = db_manager.explain_query(query)
        assert plan is not None
