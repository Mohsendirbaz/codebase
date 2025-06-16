# ItemCard.js - Library Item Display Component

## Overview

`ItemCard.js` is a feature-rich component that displays individual library items in the Process Economics system. It supports both grid and list view modes, handles user interactions, tracks usage statistics, and provides comprehensive item management functionality.

## Architecture

### Core Features
- Dual view modes (grid and list)
- Usage tracking integration
- Favorite/star functionality
- Shelf organization
- Share functionality
- Delete capability (personal items)
- Animated interactions with Framer Motion

### State Management
```javascript
const [showDetails, setShowDetails] = useState(false);
const [showMenu, setShowMenu] = useState(false);
const [showShelfSelector, setShowShelfSelector] = useState(false);
const [showShareModal, setShowShareModal] = useState(false);
const [usageStats, setUsageStats] = useState(null);
```

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `item` | Object | Required | Library item data |
| `onImport` | Function | Required | Import callback |
| `onToggleFavorite` | Function | - | Toggle favorite status |
| `onMoveToShelf` | Function | - | Move item to shelf |
| `shelves` | Array | `[]` | Available shelves |
| `isPersonal` | Boolean | `false` | Personal library indicator |
| `onAddToPersonal` | Function | - | Add to personal library |
| `viewMode` | String | `'grid'` | Display mode ('grid' or 'list') |

## Item Structure

### Expected Item Data
```javascript
{
  id: string,
  name: string,
  category: string,
  description: string,
  configuration: {
    currentState: {
      scalingGroups: Array
    },
    metadata: {
      scalingType: string
    }
  },
  tags: Array<string>,
  modeler: string,
  shelf: string,
  isFavorite: boolean
}
```

## Key Features

### 1. Complexity Calculation
```javascript
const groupCount = item.configuration.currentState.scalingGroups.length;
const complexity = 
  groupCount <= 2 ? 'Simple' :
  groupCount <= 5 ? 'Medium' : 'Complex';
```

### 2. Usage Tracking
All major interactions are tracked:
- **Import**: When configuration is imported
- **View**: When details modal is opened
- **Share**: When share modal is opened

### 3. View Modes

#### Grid View
- Card-based layout
- Hover animations
- Compact metadata display
- Visual hierarchy

#### List View
- Horizontal layout
- More information visible
- Inline actions
- Efficient scanning

### 4. Interactive Elements

#### Action Buttons
- **Import**: Primary action with icon
- **Share**: Generate shareable links
- **Menu**: Additional options dropdown

#### Menu Options
- **Personal Library**: Delete, Move to shelf
- **General Library**: Add to personal

#### Favorite Toggle
- Star icon (outline/filled)
- Only in personal library
- Instant visual feedback

### 5. Modals

#### Item Details Modal
- Full item information
- Detailed configuration view
- Import from modal

#### Share Modal
- Copy link functionality
- Social sharing options
- Usage tracking

#### Shelf Selector
- Move items between shelves
- Create new shelves
- Remove from shelf

## Visual Design

### Icons Used
- `ArrowDownTrayIcon`: Import action
- `StarIcon`: Favorite indicator
- `ShareIcon`: Share functionality
- `EllipsisHorizontalIcon`: More options
- `FolderIcon`: Shelf/folder operations
- `TrashIcon`: Delete action
- `ChartBarIcon`: Analytics

### CSS Classes

#### Container Classes
- `.item-card`: Grid view container
- `.item-list-view`: List view container
- `.item-card-header`: Header section
- `.item-card-body`: Main content
- `.item-card-actions`: Action buttons

#### State Classes
- `.favorite-button`: Star toggle
- `.complexity-badge`: Complexity indicator
- `.item-tag`: Tag pills
- `.primary`: Primary action styling

## Usage Statistics

### Loading Stats
```javascript
useEffect(() => {
  const loadUsageStats = async () => {
    const stats = await usageTracker.getItemUsageStats(item.id);
    setUsageStats(stats);
  };
}, [item.id]);
```

### Display Integration
- Usage indicator shows total uses
- Helps identify popular items
- Influences item ranking

## Service Integration

### Library Service
```javascript
import { deleteFromPersonalLibrary } from '../services/libraryService';
```

### Usage Tracking
```javascript
import { usageTracker } from '../services/usageTrackingService';
```

### Authentication
```javascript
import { getCurrentUserId } from '../utils/authUtils';
```

## Animations

### Hover Effect (Grid View)
```javascript
<motion.div 
  whileHover={{ y: -5, transition: { duration: 0.2 } }}
>
```
- Subtle lift on hover
- Smooth transition
- Visual feedback

## Best Practices

1. **Performance**
   - Lazy load usage statistics
   - Optimize re-renders with proper state management
   - Use CSS transitions for simple animations

2. **User Experience**
   - Clear visual hierarchy
   - Consistent action placement
   - Immediate feedback for actions

3. **Error Handling**
   - Confirm destructive actions
   - Show error messages
   - Graceful fallbacks

## Accessibility

- Keyboard navigation support
- Descriptive button titles
- Focus management in modals
- Semantic HTML structure

This component provides a comprehensive interface for interacting with library items, balancing information density with usability across different view modes and device sizes.