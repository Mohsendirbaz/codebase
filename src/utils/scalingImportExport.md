# scalingImportExport.js

## Overview

The `scalingImportExport.js` module provides comprehensive import/export functionality for scaling configurations in the application. It handles multiple configuration formats, ensures backward compatibility, and manages the serialization and deserialization of complex scaling group data structures.

## Architecture

### High-Level Architecture
```
scalingImportExport.js
├── Export System
│   ├── Configuration Serialization
│   ├── Metadata Generation
│   └── File Download Handler
└── Import System
    ├── File Reading
    ├── Format Detection
    ├── Legacy Format Support
    └── Configuration Processing
```

### Module Dependencies
- `./scalingUtils`: Provides `processImportedConfiguration` for data validation and processing

## Core Features

### 1. Configuration Export
- Serializes complete scaling configuration to JSON
- Includes comprehensive metadata
- Supports cumulative calculation tracking
- Generates timestamped filenames
- Handles browser download mechanics

### 2. Configuration Import
- Supports multiple configuration format versions
- Backward compatibility with legacy formats
- Format detection and migration
- Scaling type compatibility checking
- Error handling and user feedback

### 3. Version Management
- Current version: 1.2.0 (Enhanced cumulative support)
- Supports legacy format (no version)
- Supports version 1.1.0
- Automatic format migration

## Main Exports

### `exportConfiguration(scalingGroups, protectedTabs, selectedGroup, historyEntries, itemExpressions, filterKeyword, tabConfigs)`

Exports the complete scaling configuration to a downloadable JSON file.

#### Parameters:
- `scalingGroups` (Array): Array of scaling group objects
- `protectedTabs` (Set): Set of protected tab IDs
- `selectedGroup` (number): Currently selected group index
- `historyEntries` (Array): History entries for undo/redo functionality
- `itemExpressions` (Object): Expression mappings for items
- `filterKeyword` (string): Current scaling type filter
- `tabConfigs` (Array): Tab configuration data

#### Returns:
- `boolean`: True if export successful, false otherwise

#### Export Data Structure:
```javascript
{
  version: "1.2.0",
  metadata: {
    exportDate: ISO timestamp,
    exportedBy: "ScalingModule",
    description: string,
    scalingType: string
  },
  currentState: {
    selectedGroupIndex: number,
    scalingGroups: Array<EnhancedScalingGroup>,
    protectedTabs: Array<string>,
    itemExpressions: Object,
    tabConfigs: Array<TabConfig>
  },
  history: Array<HistoryEntry>
}
```

#### Enhanced Scaling Group Structure:
```javascript
{
  ...originalGroupProperties,
  isCumulative: boolean,        // Indicates if group uses cumulative calculations
  sourceGroupIndex: number|null  // References the source group for base values
}
```

### `importConfiguration(file, filterKeyword, onSuccess, onError)`

Imports a scaling configuration from a file with format detection and validation.

#### Parameters:
- `file` (File): The file object to import
- `filterKeyword` (string): Current scaling type filter for compatibility checking
- `onSuccess` (Function): Callback for successful import
- `onError` (Function): Callback for import errors

#### Success Callback Data:
```javascript
{
  groups: Array<ProcessedScalingGroup>,
  protectedTabs: Set<string>,
  tabConfigs: Array<TabConfig>|null,
  fileName: string
}
```

## Format Support

### Legacy Format (No Version)
```javascript
{
  groups: Array<ScalingGroup>,
  protectedTabs: Array<string>
  // No tabConfigs support
}
```

### Version 1.1.0
```javascript
{
  version: "1.1.0",
  currentState: {
    scalingGroups: Array<ScalingGroup>,
    protectedTabs: Array<string>,
    tabConfigs: Array<TabConfig>
  }
  // No metadata or history
}
```

### Version 1.2.0 (Current)
```javascript
{
  version: "1.2.0",
  metadata: {
    exportDate: string,
    exportedBy: string,
    description: string,
    scalingType: string
  },
  currentState: {
    selectedGroupIndex: number,
    scalingGroups: Array<EnhancedScalingGroup>,
    protectedTabs: Array<string>,
    itemExpressions: Object,
    tabConfigs: Array<TabConfig>
  },
  history: Array<HistoryEntry>
}
```

## Implementation Details

### Export Process

1. **Data Preparation**
   - Enhance scaling groups with cumulative flags
   - Convert Set to Array for protectedTabs
   - Include current selection state

2. **Metadata Generation**
   - Timestamp creation
   - Version stamping
   - Scaling type recording

3. **File Generation**
   - JSON stringification with formatting
   - Blob creation with proper MIME type
   - Dynamic filename generation

4. **Download Trigger**
   - Create temporary download link
   - Trigger browser download
   - Clean up resources

### Import Process

1. **File Reading**
   - FileReader API usage
   - Text content extraction
   - Error handling

2. **Format Detection**
   ```javascript
   const isLegacyFormat = importedData.groups && Array.isArray(importedData.groups);
   const isV11Format = importedData.version === "1.1.0";
   const isV12Format = importedData.version === "1.2.0";
   ```

3. **Data Extraction**
   - Format-specific data mapping
   - Default value handling
   - Structure normalization

4. **Compatibility Checking**
   - Scaling type validation
   - User confirmation for mismatches
   - Type assignment for older formats

5. **Processing and Validation**
   - Delegate to `processImportedConfiguration`
   - Mathematical integrity verification
   - Structure validation

## Usage Patterns

### Basic Export
```javascript
import { exportConfiguration } from './utils/scalingImportExport';

// Export current configuration
const success = exportConfiguration(
  scalingGroups,
  protectedTabs,
  selectedGroupIndex,
  history,
  expressions,
  'exponential',
  tabConfigs
);

if (success) {
  console.log('Configuration exported successfully');
}
```

### Basic Import
```javascript
import { importConfiguration } from './utils/scalingImportExport';

// Handle file input
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  
  importConfiguration(
    file,
    'exponential',
    (data) => {
      // Success handler
      setScalingGroups(data.groups);
      setProtectedTabs(data.protectedTabs);
      if (data.tabConfigs) {
        setTabConfigs(data.tabConfigs);
      }
    },
    (error) => {
      // Error handler
      alert(`Import failed: ${error}`);
    }
  );
};
```

### Advanced Import with Validation
```javascript
const handleImportWithValidation = (file) => {
  importConfiguration(
    file,
    currentScalingType,
    (data) => {
      // Additional validation
      const isValid = validateImportedData(data);
      
      if (isValid) {
        // Apply imported configuration
        applyConfiguration(data);
        
        // Log import for audit
        logConfigurationImport({
          fileName: data.fileName,
          groupCount: data.groups.length,
          timestamp: new Date()
        });
      }
    },
    (error) => {
      // Detailed error handling
      if (error.includes('Invalid format')) {
        showFormatError();
      } else if (error.includes('cancelled')) {
        // User cancelled, no action needed
      } else {
        showGenericError(error);
      }
    }
  );
};
```

## Integration Points

### 1. State Management Integration
- Updates global scaling state
- Manages protected tabs state
- Synchronizes tab configurations
- Maintains history for undo/redo

### 2. UI Integration
- File input handlers
- Progress indicators
- Success/error notifications
- Compatibility warnings

### 3. Validation Integration
- Leverages `processImportedConfiguration` for data validation
- Ensures mathematical consistency
- Validates cumulative relationships

### 4. Storage Integration
- Can be extended to support:
  - Local storage persistence
  - Cloud storage backends
  - Database serialization

## Error Handling

### Export Errors
- JSON serialization failures
- Browser download restrictions
- Memory limitations for large configurations

### Import Errors
- File reading failures
- Invalid JSON format
- Unsupported version
- Missing required fields
- Scaling type mismatches

### Error Messages
```javascript
// Common error scenarios
"No file selected"
"Error reading file"
"Invalid configuration format"
"Error processing import: [details]"
"Import cancelled by user"
```

## Security Considerations

### Input Validation
- JSON parsing in try-catch blocks
- Type checking for all imported data
- Sanitization of user-provided values
- Protection against malformed data

### File Handling
- Client-side only processing
- No server upload required
- Temporary URL cleanup
- Memory management for large files

## Performance Optimization

### Export Optimization
- Efficient JSON stringification
- Minimal object cloning
- Resource cleanup after download

### Import Optimization
- Streaming file reading for large files
- Progressive validation
- Early error detection
- Efficient format detection

## Future Enhancements

### Planned Features
1. **Compression Support**: Gzip compression for large configurations
2. **Partial Import**: Selective group/item importing
3. **Merge Capabilities**: Combine multiple configurations
4. **Cloud Sync**: Direct cloud storage integration
5. **Diff Visualization**: Show changes before import

### Format Evolution
- Maintain backward compatibility
- Version migration utilities
- Format validation schemas
- Automatic format updates