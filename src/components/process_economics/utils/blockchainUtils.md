# Blockchain Utils Module Documentation

## Overview

The `blockchainUtils.js` module provides blockchain-inspired utilities for generating unique identifiers, creating verifiable hashes, and ensuring data integrity for process economics configurations. It uses SHA-256 hashing to create tamper-evident identifiers and verification mechanisms.

## Dependencies

- `js-sha256` - SHA-256 hashing library for JavaScript

## Core Functions

### generateUniqueId()

**Purpose**: Generates a unique, blockchain-like identifier using timestamp and random data.

**Returns**: `string` - 16-character hexadecimal hash

**Algorithm**:
1. Captures current timestamp in milliseconds
2. Generates random alphanumeric string
3. Combines timestamp and random data
4. Creates SHA-256 hash
5. Returns first 16 characters

**Example**:
```javascript
const id = generateUniqueId();
console.log(id); // "a7f3b2c4d5e6f789"
```

**Use Cases**:
- Creating unique configuration IDs
- Generating item identifiers in the library
- Creating transaction-like records

### verifyHash(configuration, hash)

**Purpose**: Verifies if a given hash matches a configuration's content.

**Parameters**:
- `configuration` (Object): Configuration object with currentState and metadata
- `hash` (string): Hash to verify against

**Returns**: `boolean` - True if hash is valid

**Verification Process**:
1. Extracts scaling group IDs from configuration
2. Extracts export date and scaling type from metadata
3. Creates deterministic string representation
4. Generates verification hash
5. Compares first 16 characters

**Example**:
```javascript
const isValid = verifyHash(configuration, "a7f3b2c4d5e6f789");
if (isValid) {
  console.log("Configuration integrity verified");
}
```

### hashConfiguration(configuration)

**Purpose**: Generates a deterministic hash for a configuration object.

**Parameters**:
- `configuration` (Object): Configuration object to hash

**Returns**: `string` - 16-character hash of the configuration

**Configuration Structure Expected**:
```javascript
{
  currentState: {
    scalingGroups: [
      { id: 'group1', ... },
      { id: 'group2', ... }
    ]
  },
  metadata: {
    exportDate: '2024-01-15T10:30:00Z',
    scalingType: 'centralScaling'
  }
}
```

**Example**:
```javascript
const configHash = hashConfiguration(myConfig);
console.log(configHash); // "b8a4c5d6e7f8g9h0"
```

### createSearchableToken(configuration)

**Purpose**: Creates a human-readable token for easy configuration identification and search.

**Parameters**:
- `configuration` (Object): Configuration object

**Returns**: `string` - Searchable token in format `{type}-{count}-{timestamp}`

**Token Format**: `[scalingType]-[groupCount]-[timestamp]`
- `scalingType`: Type of scaling (e.g., 'mixed', 'central', 'extended')
- `groupCount`: Number of scaling groups
- `timestamp`: Last 4 characters of base-36 timestamp

**Example**:
```javascript
const token = createSearchableToken(configuration);
console.log(token); // "mixed-5-x7k9"
```

## Integration Patterns

### 1. Configuration Export with Hash

```javascript
import { hashConfiguration, generateUniqueId } from './utils/blockchainUtils';

const exportConfiguration = (config) => {
  const exportData = {
    id: generateUniqueId(),
    hash: hashConfiguration(config),
    configuration: config,
    exportedAt: new Date().toISOString()
  };
  
  return exportData;
};
```

### 2. Configuration Import with Verification

```javascript
import { verifyHash } from './utils/blockchainUtils';

const importConfiguration = (exportData) => {
  const { configuration, hash } = exportData;
  
  if (!verifyHash(configuration, hash)) {
    throw new Error('Configuration integrity check failed');
  }
  
  // Safe to import
  return processConfiguration(configuration);
};
```

### 3. Searchable Library Implementation

```javascript
import { createSearchableToken } from './utils/blockchainUtils';

const saveToLibrary = async (configuration) => {
  const item = {
    id: generateUniqueId(),
    token: createSearchableToken(configuration),
    hash: hashConfiguration(configuration),
    configuration,
    savedAt: new Date()
  };
  
  await libraryService.saveItem(item);
  return item;
};

// Search by token
const searchByToken = (searchTerm) => {
  return library.filter(item => 
    item.token.includes(searchTerm)
  );
};
```

### 4. Configuration Sharing via Hash

```javascript
const shareConfiguration = (config) => {
  const hash = hashConfiguration(config);
  const shareUrl = `${baseUrl}/shared/${hash}`;
  
  // Save to shared configurations
  saveSharedConfig(hash, config);
  
  return {
    url: shareUrl,
    hash: hash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  };
};
```

## Use Cases and Examples

### 1. Configuration Integrity Tracking

```javascript
// Track configuration changes
const configHistory = [];

const updateConfiguration = (config) => {
  const snapshot = {
    timestamp: new Date(),
    hash: hashConfiguration(config),
    config: { ...config }
  };
  
  configHistory.push(snapshot);
  
  // Detect if configuration changed
  if (configHistory.length > 1) {
    const prev = configHistory[configHistory.length - 2];
    if (prev.hash !== snapshot.hash) {
      console.log('Configuration modified');
    }
  }
};
```

### 2. Duplicate Detection

```javascript
const isDuplicate = (newConfig, existingConfigs) => {
  const newHash = hashConfiguration(newConfig);
  
  return existingConfigs.some(config => 
    hashConfiguration(config) === newHash
  );
};
```

### 3. Configuration Versioning

```javascript
const versionedConfig = {
  id: generateUniqueId(),
  version: 1,
  hash: hashConfiguration(config),
  parentHash: null,
  configuration: config,
  createdAt: new Date()
};

// Create new version
const createNewVersion = (parentConfig, updatedConfig) => {
  return {
    id: generateUniqueId(),
    version: parentConfig.version + 1,
    hash: hashConfiguration(updatedConfig),
    parentHash: parentConfig.hash,
    configuration: updatedConfig,
    createdAt: new Date()
  };
};
```

## Security Considerations

1. **Hash Truncation**: Uses 16 characters of SHA-256 for readability, not cryptographic security
2. **Deterministic Hashing**: Same configuration always produces same hash
3. **No Salt**: Hashes are not salted, making them predictable for same input
4. **Integrity, Not Security**: Designed for integrity checking, not secure authentication

## Best Practices

1. **Consistent Data**: Ensure configuration objects have consistent structure before hashing
2. **Hash Storage**: Store hashes alongside configurations for quick verification
3. **Token Usage**: Use tokens for user-facing search, hashes for integrity
4. **Version Control**: Track hash changes to maintain configuration history

## Related Modules

- `libraryService.js` - Uses blockchain utils for configuration storage
- `ScalingGroupsPreview.js` - Displays hash/token information
- `ImportExportPanel.js` - Uses hashing for export/import verification
- `SaveToLibraryModal.js` - Generates unique IDs for saved items