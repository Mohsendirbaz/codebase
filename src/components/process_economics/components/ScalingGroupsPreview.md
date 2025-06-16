# ScalingGroupsPreview Component

## Overview
The `ScalingGroupsPreview` component provides a tabbed interface for previewing scaling groups with horizontal navigation. It displays scaling configurations in an organized, navigable format with support for viewing individual group details and their associated items.

## Component Architecture

### Props Interface
```javascript
{
  scalingGroups: Array  // Array of scaling group objects
}
```

### State Management
- `selectedGroup`: Currently selected group index (0-based)

### Scaling Group Structure
```javascript
{
  id: string,           // Unique identifier
  name: string,         // Group display name
  items: Array<{        // Array of scaling items
    id: string,
    label: string,
    operation: string,  // e.g., 'multiply', 'add'
    scalingFactor: number
  }>
}
```

## Core Features

### 1. Navigation System

#### Horizontal Navigation
- Previous/Next arrow buttons
- Disabled states at boundaries
- Visual feedback for navigation limits

#### Tab-Based Selection
- Headless UI Tab.Group integration
- Direct tab clicking for group selection
- Active tab highlighting

### 2. Empty State Handling
Graceful handling when no scaling groups exist:
```javascript
if (!scalingGroups || scalingGroups.length === 0) {
  return <div className="no-scaling-groups">No scaling groups available</div>;
}
```

### 3. Group Display System

#### Group Information
- Group name with fallback to indexed naming
- Item count and details
- Operation type and scaling factors

#### Item Rendering
Each scaling item displays:
- Item label or indexed fallback
- Operation name (default: 'multiply')
- Scaling factor value (default: 1)

## Component Structure

```
ScalingGroupsPreview
├── Navigation Controls
│   ├── Previous Button
│   ├── Tab Group
│   │   ├── Tab List
│   │   └── Tab Panels
│   └── Next Button
└── Position Indicator
    ├── Current Position
    └── Total Count
```

## UI Components

### 1. Navigation Buttons
```javascript
<button 
  className="nav-button prev"
  onClick={goToPreviousGroup}
  disabled={selectedGroup === 0}
  aria-label="Previous scaling group"
>
```

Features:
- Chevron icons for direction
- Disabled state styling
- ARIA labels for accessibility

### 2. Tab System
Uses Headless UI for accessible tabs:
- Controlled component pattern
- Dynamic class application
- Smooth transitions between panels

### 3. Group Details Panel
Each panel contains:
- Group name header
- Items list with operation details
- Empty state for groups without items

## Styling Architecture

### CSS Classes
```css
.scaling-groups-preview     // Root container
.scaling-groups-navigation  // Navigation wrapper
.nav-button                // Navigation buttons
.scaling-groups-tabs       // Tab list container
.scaling-group-tab         // Individual tab
.scaling-group-panel       // Content panel
.scaling-groups-indicator  // Position indicator
```

### Visual States
- `.nav-button:disabled`: Grayed out navigation
- `.scaling-group-tab-selected`: Active tab styling
- Hover states for interactive elements

## Data Handling

### Fallback Values
Robust handling of incomplete data:

```javascript
// Group name fallback
{group.name || `Group ${index + 1}`}

// Item label fallback
{item.label || `Item ${itemIndex + 1}`}

// Operation defaults
{item.operation || 'multiply'}
{item.scalingFactor || 1}
```

### Empty States
- No scaling groups message
- No items in group message
- Consistent messaging for user clarity

## Navigation Logic

### Previous Navigation
```javascript
const goToPreviousGroup = () => {
  setSelectedGroup((prev) => (prev > 0 ? prev - 1 : prev));
};
```

### Next Navigation
```javascript
const goToNextGroup = () => {
  setSelectedGroup((prev) => 
    (prev < scalingGroups.length - 1 ? prev + 1 : prev)
  );
};
```

## Accessibility Features

1. **ARIA Labels**: Descriptive labels for screen readers
2. **Keyboard Navigation**: Tab system supports keyboard
3. **Focus Management**: Proper focus handling in tabs
4. **Disabled States**: Clear visual and semantic disabled states

## Usage Example

```jsx
const scalingGroups = [
  {
    id: 'group1',
    name: 'Production Scaling',
    items: [
      {
        id: 'item1',
        label: 'Capacity',
        operation: 'multiply',
        scalingFactor: 1.5
      }
    ]
  }
];

<ScalingGroupsPreview scalingGroups={scalingGroups} />
```

## Integration Points

### With Parent Components
- Receives scaling groups from parent
- No callbacks needed (read-only component)
- Self-contained navigation state

### With Headless UI
- Uses Tab components for accessibility
- Controlled component pattern
- Semantic HTML structure

## Performance Considerations

1. **Minimal Re-renders**: State changes are localized
2. **Conditional Rendering**: Only active panel renders
3. **No Unnecessary Computations**: Simple index-based logic

## Component Behavior

### State Persistence
- Selected group resets on scaling groups change
- Navigation bounds automatically adjust
- No memory of previous selections

### Edge Cases
1. **Empty Array**: Shows "no groups" message
2. **Single Group**: Navigation buttons disabled
3. **Missing Properties**: Fallbacks prevent errors
4. **Large Groups**: Scrollable content area

## Best Practices Demonstrated

1. **Defensive Programming**: Null checks and fallbacks
2. **Accessibility First**: ARIA labels and semantic HTML
3. **Component Composition**: Uses Headless UI components
4. **Clean State Management**: Single source of truth

## Styling Features

### Responsive Design
- Fluid width adaptation
- Mobile-friendly navigation
- Touch-friendly button sizes

### Visual Hierarchy
- Clear group separation
- Emphasized current selection
- Subdued disabled states

## Potential Enhancements

1. **Search/Filter**: Find specific groups or items
2. **Bulk Actions**: Apply operations to multiple groups
3. **Drag to Reorder**: Reorganize groups
4. **Export/Import**: Save group configurations
5. **Comparison View**: Side-by-side group comparison
6. **Keyboard Shortcuts**: Arrow keys for navigation
7. **Group Templates**: Predefined scaling patterns

## Component Benefits

1. **Clear Organization**: Groups are easily navigable
2. **Information Density**: Compact yet informative
3. **User Control**: Direct navigation options
4. **Visual Feedback**: Clear state indicators
5. **Accessibility**: Keyboard and screen reader friendly