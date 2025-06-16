# Auth Utils Module Documentation

## Overview

The `authUtils.js` module provides authentication and user profile management utilities for the process economics library system. It integrates with Firebase Auth and Firestore to handle user authentication, profile creation, and preference management.

## Core Functions

### getCurrentUserId()

**Purpose**: Retrieves the current user's unique identifier.

**Returns**: `string` - User ID

**Behavior**:
- In development/test mode: Returns `'test-user-123'`
- With authenticated user: Returns Firebase user UID
- Without authenticated user: Returns temporary ID with format `'temp-[random]'`

**Example**:
```javascript
const userId = getCurrentUserId();
console.log(userId); // 'abc123def456' or 'test-user-123' or 'temp-x7k9m2p'
```

### ensureAuthenticated()

**Purpose**: Ensures a user is authenticated before performing operations. Uses anonymous authentication if no user is signed in.

**Returns**: `Promise<string>` - User ID

**Behavior**:
1. Checks if user is already authenticated
2. If not, signs in anonymously
3. Creates/updates user profile
4. Returns the user ID

**Example**:
```javascript
try {
  const userId = await ensureAuthenticated();
  // User is now authenticated and profile exists
  console.log('Authenticated as:', userId);
} catch (error) {
  console.error('Authentication failed:', error);
}
```

### getUserProfile(userId)

**Purpose**: Retrieves user profile data from Firestore.

**Parameters**:
- `userId` (string): The user's unique identifier

**Returns**: `Promise<Object|null>` - User profile data or null if not found

**Profile Schema**:
```javascript
{
  id: string,
  createdAt: Timestamp,
  lastActive: Timestamp,
  isAnonymous: boolean,
  preferences: {
    defaultLibraryView: 'grid' | 'list',
    defaultSorting: 'dateAdded' | 'name' | 'type',
    showUsageStats: boolean
  }
}
```

**Example**:
```javascript
const profile = await getUserProfile(userId);
if (profile) {
  console.log('User preferences:', profile.preferences);
}
```

### updateUserPreferences(userId, preferences)

**Purpose**: Updates user preferences in their profile.

**Parameters**:
- `userId` (string): The user's unique identifier
- `preferences` (Object): Updated preference object

**Returns**: `Promise<boolean>` - Success status

**Example**:
```javascript
const success = await updateUserPreferences(userId, {
  defaultLibraryView: 'list',
  defaultSorting: 'name',
  showUsageStats: false
});
```

## Internal Functions

### ensureUserProfile(userId)

**Purpose**: Creates user profile if it doesn't exist, updates lastActive timestamp if it does.

**Behavior**:
1. Checks if user profile exists in Firestore
2. If not, creates new profile with default preferences
3. Creates library metadata document
4. Updates lastActive timestamp on existing profiles

**Created Documents**:
- `user_profiles/{userId}` - Main user profile
- `personal_library_metadata/{userId}` - Library organization metadata

## Data Structures

### User Profile Schema

```javascript
{
  id: string,                    // User's unique identifier
  createdAt: Timestamp,          // Profile creation timestamp
  lastActive: Timestamp,         // Last activity timestamp
  isAnonymous: boolean,          // Whether user is anonymous
  preferences: {
    defaultLibraryView: string,  // 'grid' or 'list'
    defaultSorting: string,      // Sorting preference
    showUsageStats: boolean      // Display usage statistics
  }
}
```

### Library Metadata Schema

```javascript
{
  shelves: string[],      // Array of shelf names (default: ['favorites'])
  createdAt: Timestamp,   // Metadata creation timestamp
  lastUpdated: Timestamp  // Last update timestamp
}
```

## Integration Patterns

### 1. Component Integration

```javascript
import { ensureAuthenticated, getUserProfile } from './utils/authUtils';

const LibraryComponent = () => {
  const [userId, setUserId] = useState(null);
  const [userPrefs, setUserPrefs] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const id = await ensureAuthenticated();
      const profile = await getUserProfile(id);
      setUserId(id);
      setUserPrefs(profile?.preferences);
    };
    initAuth();
  }, []);

  // Use userId and preferences...
};
```

### 2. Service Integration

```javascript
import { getCurrentUserId } from './utils/authUtils';

const libraryService = {
  saveItem: async (item) => {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'personal_libraries', userId, 'items', item.id);
    await setDoc(docRef, {
      ...item,
      userId,
      savedAt: serverTimestamp()
    });
  }
};
```

### 3. Preference-Based Rendering

```javascript
import { getUserProfile, updateUserPreferences } from './utils/authUtils';

const ViewToggle = ({ userId }) => {
  const [view, setView] = useState('grid');

  useEffect(() => {
    getUserProfile(userId).then(profile => {
      setView(profile?.preferences?.defaultLibraryView || 'grid');
    });
  }, [userId]);

  const toggleView = async () => {
    const newView = view === 'grid' ? 'list' : 'grid';
    await updateUserPreferences(userId, { defaultLibraryView: newView });
    setView(newView);
  };

  return <button onClick={toggleView}>Switch to {view === 'grid' ? 'List' : 'Grid'}</button>;
};
```

## Use Cases and Examples

### 1. Anonymous User Flow
```javascript
// User visits library without signing in
const userId = await ensureAuthenticated(); // Creates anonymous user
// User can save configurations, create shelves, etc.
// Data persists even after browser refresh
```

### 2. Test Environment Setup
```javascript
// In development/test mode
process.env.REACT_APP_USE_MOCK_DATA = 'true';
const userId = getCurrentUserId(); // Always returns 'test-user-123'
// Consistent user ID for testing
```

### 3. User Preference Management
```javascript
// Load user's saved view preference
const profile = await getUserProfile(userId);
const viewMode = profile?.preferences?.defaultLibraryView || 'grid';

// Update preference when user changes setting
await updateUserPreferences(userId, {
  ...profile.preferences,
  showUsageStats: true
});
```

## Error Handling

The module includes error handling for:
- Failed anonymous authentication
- Firestore read/write errors
- Missing user profiles
- Network connectivity issues

Errors are logged to console but don't throw to prevent app crashes.

## Security Considerations

1. **Anonymous Authentication**: Provides basic user isolation without requiring sign-up
2. **User Isolation**: Each user can only access their own data
3. **Firestore Rules**: Should be configured to enforce user-based access control
4. **Test Mode**: Uses fixed user ID in development for consistent testing

## Related Modules

- `libraryService.js` - Uses auth utils for user-specific operations
- `usageTrackingService.js` - Tracks usage per authenticated user
- `LibrarySystem.js` - Main component that initializes authentication
- Firebase SDK - Underlying authentication and database services