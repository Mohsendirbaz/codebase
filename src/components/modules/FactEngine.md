# FactEngine Component Documentation

## Overview
`FactEngine` is an interactive React component that displays educational facts with user engagement features. It provides a dynamic fact generation system with voting, pinning functionality, and persistent storage through localStorage.

## Purpose
This component serves as an educational tool that:
- Displays random educational facts to users
- Tracks user agreement through voting
- Allows users to pin favorite facts
- Persists data across sessions
- Provides an engaging, gamified learning experience

## Key Features

### 1. Fact Management
- Random fact generation from unpinned pool
- Fact pinning/unpinning functionality
- Agreement tracking with vote counts
- Persistent storage via localStorage

### 2. User Interface
- Collapsible container with state persistence
- Animated fact transitions
- Visual feedback for user interactions
- Separate sections for current and pinned facts

### 3. Data Persistence
- localStorage integration for facts and UI state
- Cross-component synchronization via custom events
- Fallback data for initialization failures

## Component Structure

### State Management
```javascript
const [facts, setFacts] = useState([]);
const [currentFact, setCurrentFact] = useState(null);
const [isCollapsed, setIsCollapsed] = useState(
  localStorage.getItem(FACT_COLLAPSED_KEY) === 'true'
);
const [isNewFact, setIsNewFact] = useState(false);
```

### Storage Keys
```javascript
const FACT_STORAGE_KEY = 'teaSpaceFacts';
const FACT_COLLAPSED_KEY = 'factEngineCollapsed';
```

## Data Structure

### Fact Object Schema
```javascript
{
  id: number,              // Unique identifier
  text: string,            // The educational fact text
  agrees: number,          // Vote count
  isPinned: boolean        // Pin status
}
```

### Fallback Facts
```javascript
[
  {
    id: 1,
    text: "Financially literate people are less likely to get cheated",
    agrees: 0,
    isPinned: false
  },
  {
    id: 2,
    text: "Higher mathematical skills translates to higher incomes",
    agrees: 0,
    isPinned: false
  }
]
```

## Core Functionality

### 1. Fact Loading
- Attempts to load from localStorage first
- Falls back to `/src/data/teaSpaceFacts.json`
- Uses hardcoded facts if all else fails
- Saves initial facts to localStorage

### 2. Random Fact Generation
```javascript
const generateRandomFact = useCallback(() => {
  // Prioritizes unpinned facts
  const unpinnedFacts = facts.filter(fact => !fact.isPinned);
  
  if (unpinnedFacts.length === 0) {
    // Falls back to all facts if all are pinned
  } else {
    // Selects random unpinned fact
  }
  
  // Triggers animation
  setIsNewFact(true);
  setTimeout(() => setIsNewFact(false), 500);
}, [facts]);
```

### 3. Pin/Unpin Logic
- Pinning a fact increments its agree count
- Unpinning doesn't affect the count
- Updates localStorage immediately

### 4. Event System
Listens for admin panel updates:
```javascript
window.addEventListener('factsUpdated', handleFactsUpdated);
```

## User Interface Components

### Header Section
- Displays "TeaSpace Fact Engine" title
- Toggle button for collapse/expand
- Click handler for state persistence

### Current Fact Card
- Displays randomly selected fact
- Shows agree count with icon
- Conditional button (Agree & Pin / Unpin)
- Animation class for transitions

### Generate Button
- Triggers new random fact selection
- Always visible below current fact

### Pinned Facts Section
- Only visible when facts are pinned
- Shows all pinned facts in cards
- Each card has unpin functionality

## Styling

### CSS Classes
- `.fact-engine-container`: Main wrapper
- `.fact-engine-header`: Collapsible header
- `.fact-engine-toggle`: Collapse indicator
- `.fact-engine-body`: Content container
- `.fact-card`: Individual fact display
- `.new-fact`: Animation class
- `.pinned`: Pinned fact modifier

### Visual Elements
- 👍 Agree count icon
- ▼ Collapse toggle indicator
- 📌 Pinned fact indicator (in admin)

## Integration Points

### localStorage Synchronization
- Saves facts on every update
- Persists collapsed state
- Enables data sharing across sessions

### Custom Events
- Listens for `factsUpdated` events
- Enables real-time updates from admin panel
- Maintains synchronization across components

### External Data Source
- Attempts to load from JSON file
- Path: `/src/data/teaSpaceFacts.json`
- Provides initial fact database

## Usage Example
```javascript
import FactEngine from './components/modules/FactEngine';

function App() {
  return (
    <div className="app">
      <FactEngine />
    </div>
  );
}
```

## Best Practices

### Performance
1. Uses `useCallback` for fact generation
2. Implements proper cleanup for event listeners
3. Efficient state updates with functional setters

### User Experience
1. Provides immediate visual feedback
2. Persists user preferences
3. Graceful fallbacks for data loading

### Data Management
1. Validates data before storage
2. Handles edge cases (all facts pinned)
3. Maintains data integrity across updates

## Dependencies
- React (useState, useEffect, useCallback)
- Browser localStorage API
- Custom CSS styling (HCSS.css)

## Related Components
- **FactEngineAdmin**: Administrative interface for managing facts
- Shares storage keys and event system
- Provides CRUD operations for facts

## Event Communication

### factsUpdated Event
```javascript
// Expected event structure
{
  detail: {
    facts: Array<Fact>
  }
}
```

## Error Handling
- Graceful fallback for fetch failures
- Console error logging for debugging
- Always provides functional component

## Accessibility Considerations
- Keyboard navigation support needed
- Screen reader announcements for updates
- Focus management for interactions

## Future Enhancements
1. Categories for facts
2. Search functionality
3. Share fact feature
4. Animation preferences
5. Fact submission by users
6. Statistics dashboard
7. Export/import fact sets