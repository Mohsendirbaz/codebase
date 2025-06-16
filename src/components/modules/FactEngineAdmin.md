# FactEngineAdmin Component Documentation

## Overview
`FactEngineAdmin` is a comprehensive administrative interface for managing the TeaSpace Fact Engine. It provides full CRUD (Create, Read, Update, Delete) operations for educational facts, along with vote management and real-time synchronization with the FactEngine component.

## Purpose
This admin component enables:
- Complete fact lifecycle management
- Vote count administration
- Real-time data synchronization
- Statistical overview of fact engagement
- Seamless integration with the FactEngine display component

## Key Features

### 1. Fact Management
- Add new educational facts
- Edit existing fact text
- Delete facts with confirmation
- View all facts in organized list

### 2. Vote Administration
- Reset individual fact votes
- Reset all votes globally
- Track total engagement metrics

### 3. Statistics Dashboard
- Total facts count
- Aggregate vote count
- Pinned facts tracking
- Visual summary cards

### 4. Real-time Synchronization
- localStorage integration
- Custom event broadcasting
- Cross-component updates

## Component Structure

### State Management
```javascript
const [facts, setFacts] = useState([]);
const [editingFactId, setEditingFactId] = useState(null);
const [editText, setEditText] = useState('');
const [newFactText, setNewFactText] = useState('');
```

### Refs
```javascript
const addFactInputRef = useRef(null);
const editFactInputRef = useRef(null);
```

## Data Management

### Storage Integration
- Uses same localStorage key as FactEngine: `'teaSpaceFacts'`
- Automatic synchronization on changes
- Storage event listener for multi-tab support

### Default Facts
```javascript
const defaultFacts = [
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
];
```

## Core Functionality

### 1. Adding Facts
```javascript
const handleAddFact = () => {
  // Validates input
  // Generates unique ID
  // Creates new fact object
  // Updates state and storage
  // Clears input and refocuses
};
```

### 2. Editing Facts
- In-line editing interface
- Temporary state management
- Save/Cancel options
- Auto-focus on edit mode

### 3. Vote Management
- Individual fact vote reset
- Global vote reset with confirmation
- Preserves pin status during reset

### 4. Event Broadcasting
```javascript
window.dispatchEvent(new CustomEvent('factsUpdated', { 
  detail: { facts }
}));
```

## User Interface Sections

### 1. Header Section
- Component title
- Global reset button
- Administrative controls

### 2. Statistics Summary
Three summary cards displaying:
- **Total Facts**: Current fact count
- **Total Agrees**: Sum of all votes
- **Pinned Facts**: Count of pinned items

### 3. Add Fact Form
- Textarea for fact input
- Character validation
- Submit button with state
- Auto-focus management

### 4. Fact List Management
- Displays all facts
- Edit/Delete controls per fact
- Vote count and pin status
- In-line editing capability

## UI States

### Normal View
- Fact text display
- Statistics (agrees, pin status)
- Action buttons (Edit, Reset Votes, Delete)

### Edit Mode
- Textarea with current text
- Save/Cancel buttons
- Disabled state management
- Focus management

## Styling

### CSS Classes
- `.fact-admin-container`: Main wrapper
- `.fact-admin-header`: Header section
- `.facts-summary`: Statistics cards
- `.summary-card`: Individual stat card
- `.add-fact-section`: New fact form
- `.facts-list-section`: Fact management area
- `.fact-admin-item`: Individual fact row
- `.fact-edit-form`: Edit mode container

### Visual Indicators
- 👍 Agree count icon
- 📌 Pinned status icon
- ➕ Add fact icon

## Event Handling

### Storage Events
```javascript
window.addEventListener('storage', (e) => {
  if (e.key === FACT_STORAGE_KEY && e.newValue !== null) {
    setFacts(JSON.parse(e.newValue));
  }
});
```

### Custom Events
- Broadcasts `factsUpdated` event
- Enables real-time synchronization
- Updates FactEngine component

## Validation & Confirmations

### Input Validation
- Trims whitespace
- Prevents empty submissions
- Maintains data integrity

### Deletion Confirmation
```javascript
if (window.confirm('Are you sure you want to delete this fact?')) {
  // Proceed with deletion
}
```

### Reset Confirmation
- Individual fact reset: No confirmation
- Global reset: Requires confirmation

## Integration Example

```javascript
import FactEngineAdmin from './components/modules/FactEngineAdmin';

function AdminPanel() {
  return (
    <div className="admin-section">
      <FactEngineAdmin />
    </div>
  );
}
```

## Best Practices

### Performance
1. Efficient state updates with functional setters
2. Proper cleanup of event listeners
3. Optimized re-renders with focused updates

### User Experience
1. Auto-focus for better workflow
2. Clear visual feedback
3. Confirmation for destructive actions
4. Inline editing for efficiency

### Data Integrity
1. Unique ID generation
2. Validation before operations
3. Synchronized storage updates

## Component Lifecycle

### Initialization
1. Load facts from localStorage
2. Set up event listeners
3. Initialize with defaults if needed

### Updates
1. State changes trigger storage updates
2. Storage updates broadcast events
3. Events update related components

### Cleanup
- Removes storage event listener
- Prevents memory leaks

## Error Handling
- Try-catch blocks for storage operations
- Fallback to default facts
- Console logging for debugging

## Accessibility Features
- Semantic HTML structure
- Button states for screen readers
- Focus management for keyboard users

## Security Considerations
- No XSS vulnerability in fact display
- Proper data sanitization needed
- Client-side storage limitations

## Related Components
- **FactEngine**: Display component
- Shares storage and event system
- Synchronized data updates

## Future Enhancements

1. **Bulk Operations**
   - Import/Export facts
   - Batch editing
   - Category management

2. **Advanced Features**
   - Fact scheduling
   - A/B testing support
   - Analytics integration

3. **UI Improvements**
   - Drag-and-drop ordering
   - Rich text editing
   - Preview mode

4. **Data Management**
   - Backup/Restore
   - Version history
   - Cloud synchronization