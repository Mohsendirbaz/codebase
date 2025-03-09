import pytest
import os
from base64 import b64encode, b64decode
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..encryption import (
    EncryptionManager,
    AESCipher,
    RSACipher,
    KeyManager,
    EncryptionError,
    KeyRotator
)

class TestEncryption:
    """Test encryption utilities"""

    @pytest.fixture
    def encryption_manager(self):
        """Create encryption manager instance"""
        return EncryptionManager(
            config={
                'default_algorithm': 'AES-256-GCM',
                'key_rotation_days': 30,
                'key_storage': 'memory'
            }
        )

    @pytest.fixture
    def aes_cipher(self):
        """Create AES cipher instance"""
        key = os.urandom(32)  # 256-bit key
        return AESCipher(key)

    @pytest.fixture
    def rsa_cipher(self):
        """Create RSA cipher instance"""
        return RSACipher(
            key_size=2048,
            public_exponent=65537
        )

    @pytest.fixture
    def key_manager(self):
        """Create key manager instance"""
        return KeyManager(
            storage_path=':memory:',
            master_key_env='TEST_MASTER_KEY'
        )

    def test_aes_encryption(self, aes_cipher):
        """Test AES encryption and decryption"""
        # Test data
        plaintext = b"sensitive data"

        # Encrypt
        ciphertext = aes_cipher.encrypt(plaintext)
        assert ciphertext != plaintext
        assert len(ciphertext) > len(plaintext)

        # Decrypt
        decrypted = aes_cipher.decrypt(ciphertext)
        assert decrypted == plaintext

    def test_rsa_encryption(self, rsa_cipher):
        """Test RSA encryption and decryption"""
        # Generate key pair
        rsa_cipher.generate_key_pair()

        # Test data
        plaintext = b"sensitive data"

        # Encrypt with public key
        ciphertext = rsa_cipher.encrypt(plaintext)
        assert ciphertext != plaintext

        # Decrypt with private key
        decrypted = rsa_cipher.decrypt(ciphertext)
        assert decrypted == plaintext

    def test_key_rotation(self, encryption_manager):
        """Test encryption key rotation"""
        # Create test data
        data = b"test data"

        # Encrypt with current key
        encrypted = encryption_manager.encrypt(data)
        current_key_id = encryption_manager.get_current_key_id()

        # Rotate key
        encryption_manager.rotate_keys()
        new_key_id = encryption_manager.get_current_key_id()

        assert new_key_id != current_key_id

        # Should still be able to decrypt with old key
        decrypted = encryption_manager.decrypt(encrypted)
        assert decrypted == data

    def test_key_management(self, key_manager):
        """Test key management"""
        # Generate new key
        key_id = key_manager.generate_key()
        
        # Retrieve key
        key = key_manager.get_key(key_id)
        assert len(key) == 32  # 256-bit key

        # List active keys
        active_keys = key_manager.list_active_keys()
        assert key_id in active_keys

        # Archive key
        key_manager.archive_key(key_id)
        assert key_id not in key_manager.list_active_keys()
        assert key_id in key_manager.list_archived_keys()

    def test_encryption_with_aad(self, encryption_manager):
        """Test encryption with additional authenticated data"""
        plaintext = b"sensitive data"
        aad = b"metadata"

        # Encrypt with AAD
        ciphertext = encryption_manager.encrypt_with_aad(plaintext, aad)

        # Decrypt with correct AAD
        decrypted = encryption_manager.decrypt_with_aad(ciphertext, aad)
        assert decrypted == plaintext

        # Decrypt with incorrect AAD should fail
        with pytest.raises(EncryptionError):
            encryption_manager.decrypt_with_aad(ciphertext, b"wrong_aad")

    def test_key_derivation(self, encryption_manager):
        """Test key derivation"""
        # Derive key from password
        password = "secure_password"
        salt = os.urandom(16)
        
        key1 = encryption_manager.derive_key(password, salt)
        key2 = encryption_manager.derive_key(password, salt)
        
        assert key1 == key2
        assert len(key1) == 32  # 256-bit key

        # Different salt should produce different key
        key3 = encryption_manager.derive_key(password, os.urandom(16))
        assert key1 != key3

    def test_encrypted_file_storage(self, encryption_manager):
        """Test encrypted file storage"""
        data = b"file contents"
        filename = "test.enc"

        # Write encrypted file
        encryption_manager.write_encrypted_file(filename, data)

        # Read encrypted file
        decrypted = encryption_manager.read_encrypted_file(filename)
        assert decrypted == data

    def test_encryption_contexts(self, encryption_manager):
        """Test encryption contexts"""
        # Create encryption context
        context = {
            'user_id': '123',
            'purpose': 'test'
        }

        data = b"context sensitive data"

        # Encrypt with context
        encrypted = encryption_manager.encrypt_with_context(data, context)

        # Decrypt with correct context
        decrypted = encryption_manager.decrypt_with_context(encrypted, context)
        assert decrypted == data

        # Decrypt with wrong context should fail
        wrong_context = context.copy()
        wrong_context['user_id'] = '456'
        with pytest.raises(EncryptionError):
            encryption_manager.decrypt_with_context(encrypted, wrong_context)

    def test_key_backup_restore(self, key_manager):
        """Test key backup and restore"""
        # Generate some keys
        key_ids = [key_manager.generate_key() for _ in range(3)]

        # Backup keys
        backup = key_manager.backup_keys("backup_password")
        
        # Clear keys
        key_manager.clear_all_keys()
        assert len(key_manager.list_active_keys()) == 0

        # Restore from backup
        key_manager.restore_keys(backup, "backup_password")
        
        restored_keys = key_manager.list_active_keys()
        assert all(kid in restored_keys for kid in key_ids)

    def test_encryption_performance(self, encryption_manager):
        """Test encryption performance"""
        # Generate large test data
        data = os.urandom(1024 * 1024)  # 1MB

        # Measure encryption time
        start_time = datetime.now()
        encrypted = encryption_manager.encrypt(data)
        encryption_time = (datetime.now() - start_time).total_seconds()

        # Measure decryption time
        start_time = datetime.now()
        decrypted = encryption_manager.decrypt(encrypted)
        decryption_time = (datetime.now() - start_time).total_seconds()

        assert decrypted == data
        assert encryption_time < 1.0  # Should be reasonably fast
        assert decryption_time < 1.0

    def test_key_rotation_schedule(self, key_manager):
        """Test key rotation scheduling"""
        # Create key with rotation schedule
        key_id = key_manager.generate_key(
            rotation_period=timedelta(days=30)
        )

        # Check rotation status
        status = key_manager.check_rotation_status(key_id)
        assert not status['needs_rotation']

        # Simulate key age
        key_manager.override_key_creation_time(
            key_id,
            datetime.now() - timedelta(days=31)
        )

        status = key_manager.check_rotation_status(key_id)
        assert status['needs_rotation']
        assert status['days_until_rotation'] < 0

    def test_encryption_audit(self, encryption_manager):
        """Test encryption audit logging"""
        audit_logs = []

        def audit_handler(event):
            audit_logs.append(event)

        encryption_manager.set_audit_handler(audit_handler)

        # Perform encryption operations
        data = b"audit test data"
        encrypted = encryption_manager.encrypt(data)
        decrypted = encryption_manager.decrypt(encrypted)

        assert len(audit_logs) == 2  # One event each for encrypt and decrypt
        assert audit_logs[0]['operation'] == 'encrypt'
        assert audit_logs[1]['operation'] == 'decrypt'
        assert all('timestamp' in log for log in audit_logs)
