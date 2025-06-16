# libraryService.js - Library Data Management Service

## Overview

`libraryService.js` provides the data access layer for the Process Economics Library system. It handles all Firebase Firestore operations for personal and general libraries, including CRUD operations, shelf management, and configuration storage with built-in mock data fallback support.

## Architecture

### Core Features
- Firebase Firestore integration
- Mock data fallback for development
- Personal and general library management
- Shelf system for organization
- Configuration persistence
- Timestamp tracking

### Dependencies
```javascript
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db, useMockFirebase } from '../../../firebase/config';
import { getMockData } from './mockDataService';
```

## Core Functions

### 1. Library Retrieval

#### getPersonalLibrary(userId)
```javascript
export const getPersonalLibrary = async (userId) => {
  // Returns user's personal library items
  // Ordered by dateAdded (newest first)
  // Falls back to mock data if needed
}
```

**Features**:
- User-specific filtering
- Chronological ordering
- Error handling with fallback

#### getGeneralLibrary()
```javascript
export const getGeneralLibrary = async () => {
  // Returns public/shared library items
  // Available to all users
  // Ordered by dateAdded
}
```

### 2. Library Updates

#### updatePersonalLibrary(userId, items)
```javascript
export const updatePersonalLibrary = async (userId, items) => {
  // Updates user's entire library
  // Updates metadata timestamp
  // Batch updates all items
}
```

**Process**:
1. Update library metadata timestamp
2. Iterate through items
3. Update each item with timestamp
4. Return success status

### 3. Shelf Management

#### getMyLibraryShelves(userId)
```javascript
export const getMyLibraryShelves = async (userId) => {
  // Returns array of shelf names
  // Creates default 'favorites' if none exist
  // Initializes metadata if needed
}
```

**Default Behavior**:
- Always includes 'favorites' shelf
- Creates metadata document if missing
- Returns empty array on error

#### createShelf(userId, shelfName)
```javascript
export const createShelf = async (userId, shelfName) => {
  // Adds new shelf to user's collection
  // Prevents duplicate shelf names
  // Updates metadata timestamp
}
```

**Validation**:
- Checks for existing shelf names
- Maintains shelf uniqueness
- Preserves existing shelves

#### removeShelf(userId, shelfName)
```javascript
export const removeShelf = async (userId, shelfName) => {
  // Removes shelf from metadata
  // Updates all items on that shelf
  // Protected shelves: 'favorites'
}
```

**Cascade Operations**:
1. Remove shelf from metadata
2. Find all items on shelf
3. Clear shelf assignment
4. Update timestamps

#### renameShelf(userId, oldName, newName)
```javascript
export const renameShelf = async (userId, oldName, newName) => {
  // Renames shelf in metadata
  // Updates all affected items
  // Validates new name availability
}
```

### 4. Item Management

#### toggleFavorite(userId, itemId)
```javascript
export const toggleFavorite = async (userId, itemId) => {
  // Toggles favorite status
  // Updates isFavorite field
  // Maintains timestamp
}
```

#### moveToShelf(userId, itemId, shelfName)
```javascript
export const moveToShelf = async (userId, itemId, shelfName) => {
  // Moves item to specified shelf
  // Handles 'all' as null shelf
  // Auto-favorites if moved to favorites
}
```

**Special Cases**:
- 'all' shelf = no shelf (null)
- 'favorites' shelf sets isFavorite = true

#### deleteFromPersonalLibrary(userId, itemId)
```javascript
export const deleteFromPersonalLibrary = async (userId, itemId) => {
  // Permanently removes item
  // No soft delete
  // Returns success status
}
```

### 5. Configuration Storage

#### saveToPersonalLibrary(item, userId, shelf)
```javascript
export const saveToPersonalLibrary = async (item, userId, shelf = null) => {
  // Saves general item to personal library
  // Checks for duplicates by sourceId
  // Updates existing or creates new
}
```

**Duplicate Handling**:
- Checks sourceId for existing items
- Updates if exists
- Creates new with UUID if not

**Data Structure**:
```javascript
{
  id: uuidv4(),
  userId: string,
  sourceId: string,        // Original item ID
  name: string,
  description: string,
  category: string,
  tags: Array,
  modeler: string,
  shelf: string | null,
  isFavorite: boolean,
  configuration: Object,
  dateAdded: Timestamp,
  lastUpdated: Timestamp
}
```

#### saveConfiguration(userId, item)
```javascript
export const saveConfiguration = async (userId, item) => {
  // Direct configuration save
  // Uses provided item ID
  // Full item replacement
}
```

## Data Models

### Personal Library Item
```javascript
{
  id: string,              // Unique identifier
  userId: string,          // Owner ID
  sourceId?: string,       // Reference to general library
  name: string,           // Display name
  description: string,    // Item description
  category: string,       // Category classification
  tags: string[],         // Searchable tags
  modeler?: string,       // Creator name
  shelf?: string,         // Assigned shelf
  isFavorite: boolean,    // Favorite status
  configuration: {        // Full configuration data
    currentState: Object,
    metadata: Object
  },
  dateAdded: Timestamp,   // Creation date
  lastUpdated: Timestamp  // Last modification
}
```

### Library Metadata
```javascript
{
  userId: string,         // User identifier
  shelves: string[],      // Available shelves
  createdAt: Timestamp,   // Account creation
  lastUpdated: Timestamp  // Last activity
}
```

## Firebase Collections

### Collections Used
1. **personal_library**: User-specific items
2. **general_library**: Shared/public items
3. **personal_library_metadata**: User preferences

### Query Patterns
```javascript
// User's items by shelf
query(collection(db, 'personal_library'),
  where('userId', '==', userId),
  where('shelf', '==', shelfName)
)

// Recent additions
query(collection(db, 'personal_library'),
  where('userId', '==', userId),
  orderBy('dateAdded', 'desc')
)
```

## Error Handling

### Fallback Strategy
1. Try Firebase operation
2. Catch any errors
3. Log error details
4. Return mock data or safe default
5. Ensure UI continues functioning

### Common Error Scenarios
- Network connectivity issues
- Firebase quota exceeded
- Permission denied
- Document not found
- Invalid data format

## Mock Data Support

### Development Mode
```javascript
if (useMockFirebase) {
  return getMockData('collectionName', params);
}
```

### Benefits
- Offline development
- Consistent test data
- No Firebase costs
- Faster development cycles

## Best Practices

1. **Always use timestamps**
   - serverTimestamp() for consistency
   - Track creation and updates

2. **Validate inputs**
   - Check required fields
   - Prevent invalid operations
   - Sanitize user input

3. **Handle errors gracefully**
   - Provide fallbacks
   - Log for debugging
   - User-friendly messages

4. **Optimize queries**
   - Use indexes
   - Limit result sets
   - Batch operations when possible

## Performance Considerations

- Use compound queries sparingly
- Implement pagination for large datasets
- Cache frequently accessed data
- Minimize document reads
- Batch writes when updating multiple items

This service provides a robust, scalable foundation for library data management with proper error handling and development support.