# ImportExportPanel Component Documentation

## Component Overview
The ImportExportPanel component provides comprehensive import/export functionality for process economics configurations. It handles file imports, configuration saving to library, and navigation to the library browser.

### Core Functionality
- **File import**: Import JSON configuration files with validation
- **Configuration saving**: Save current configuration to personal library
- **Shelf management**: Load and display user's library shelves
- **Library navigation**: Quick access to browse library
- **Modal integration**: SaveToLibraryModal for detailed save operations

### Dependencies
- React (useState, useRef)
- @heroicons/react (UI icons)
- SaveToLibraryModal (child component)
- libraryService (saveConfiguration, getMyLibraryShelves)
- authUtils (getCurrentUserId)

## Architecture Summary

### Level 1: Component Entry and Props
```
ImportExportPanel({ currentConfiguration, filterKeyword, generateUniqueId, userId })
├─ Import/export interface for configurations
├─ Shelf-aware saving functionality
└─ File validation and parsing
```

### Level 2: State Management
```
State Architecture:
├─ showSaveModal: Modal visibility control
├─ userShelves: User's library shelf list
├─ isLoadingShelves: Shelf loading state
└─ fileInputRef: Hidden file input reference
```

### Level 3: Functional Architecture
```
Core Functions:
├─ handleOpenSaveModal()
│  ├─ Validate current configuration
│  ├─ Load user shelves
│  └─ Display save modal
├─ handleImportFile(event)
│  ├─ Read file content
│  ├─ Parse JSON
│  ├─ Validate configuration structure
│  └─ Open save modal with imported config
├─ handleOpenSaveModalWithConfig(config)
│  ├─ Load user shelves
│  └─ Display save modal
└─ handleSaveToLibrary(saveData)
   ├─ Generate blockchain ID
   ├─ Prepare item metadata
   ├─ Save to library service
   └─ Show success feedback
```

### Level 4: UI Structure
```
Component Layout:
├─ Hidden File Input
│  └─ JSON file type restriction
├─ Action Buttons Panel
│  ├─ Import File Button
│  │  └─ Triggers file input
│  ├─ Save Current Button
│  │  └─ Opens save modal
│  └─ Browse Library Button
│     └─ External navigation
└─ SaveToLibraryModal (Conditional)
   ├─ onClose handler
   ├─ onSave handler
   ├─ User shelves data
   └─ Default type from filterKeyword
```

## Key Features

### 1. Configuration Validation
Robust validation ensures imported files have required structure:
```javascript
if (!importedConfig.version || !importedConfig.metadata || !importedConfig.currentState) {
  alert('Invalid configuration file. The file format is not recognized.');
  return;
}
```

### 2. Blockchain ID Generation
Each saved configuration receives a unique blockchain ID:
```javascript
const uniqueId = generateUniqueId();
```

### 3. Shelf Management
Dynamic loading of user's library shelves for organized storage:
```javascript
const shelves = await getMyLibraryShelves(userId);
setUserShelves(shelves);
```

### 4. File Input Reset
Ensures clean state after file selection:
```javascript
if (fileInputRef.current) {
  fileInputRef.current.value = '';
}
```

### 5. Error Handling
Comprehensive error handling for all operations:
- File reading errors
- JSON parsing errors
- Validation failures
- Save operation failures

## Technical Implementation Details

### File Import Process
1. User clicks "Import File" button
2. Hidden file input triggered
3. FileReader reads selected file
4. JSON parsing with error handling
5. Configuration validation
6. Save modal opened with imported data

### Save Data Structure
```javascript
const newItem = {
  id: uniqueId,
  name: saveData.name,
  description: saveData.description,
  category: saveData.category,
  modeler: saveData.modeler,
  tags: saveData.tags,
  shelf: saveData.shelf === 'none' ? null : saveData.shelf,
  dateAdded: new Date().toISOString(),
  configuration: currentConfiguration
};
```

### Button States
- Save Current button disabled when no configuration exists
- Visual feedback through button styling
- Loading states during async operations

## Usage Example
```jsx
<ImportExportPanel 
  currentConfiguration={currentConfig}
  filterKeyword="process"
  generateUniqueId={() => generateBlockchainId()}
  userId={currentUser.id}
/>
```

## CSS Classes and Styling
- `.import-export-panel`: Main container
- `.panel-actions`: Button group container
- `.action-button`: Standard button styling
- `.action-button.primary`: Primary action emphasis
- `.action-icon`: Icon styling within buttons

## Error Messages
- "No configuration to save" - When attempting to save without configuration
- "Invalid configuration file" - When imported file structure is invalid
- "Error parsing file" - When JSON parsing fails
- "Error reading file" - When file read operation fails
- "Error saving configuration" - When save operation fails