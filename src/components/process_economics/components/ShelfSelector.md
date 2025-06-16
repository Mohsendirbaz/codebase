# ShelfSelector Component

## Overview
The `ShelfSelector` component provides a visual interface for selecting and managing library shelves. It supports both system shelves (All Items, Favorites) and custom user-created shelves, with drag-and-drop functionality and inline editing capabilities.

## Component Architecture

### Props Interface
```javascript
{
  shelves: Array,             // List of shelf names
  selectedShelf: string,      // Currently selected shelf
  onSelectShelf: Function,    // Callback for shelf selection
  onRemoveShelf: Function,    // Callback for shelf deletion
  editingShelf: string,       // Shelf currently being edited
  setEditingShelf: Function,  // Control editing state
  onRenameShelf: Function,    // Callback for shelf rename
  onDrop: Function           // Callback for drag-drop operations
}
```

### State Management
- `newShelfName`: Local state for rename input value

## Core Features

### 1. Shelf Categories

#### Special System Shelves
Fixed shelves with special functionality:
```javascript
const specialShelves = [
  {
    id: 'all',
    name: 'All Items',
    icon: Squares2X2Icon
  },
  {
    id: 'favorites', 
    name: 'Favorites',
    icon: StarIcon
  }
];
```

#### Custom User Shelves
- Dynamically created by users
- Support rename and delete operations
- Folder icon visual indicator

### 2. Drag and Drop System

#### Drop Zone Implementation
Each shelf acts as a drop zone:
```javascript
onDragOver={handleDragOver}
onDrop={(e) => handleShelfDrop(e, shelfName)}
```

#### Drop Handling
```javascript
const handleShelfDrop = (e, shelfName) => {
  e.preventDefault();
  onDrop(shelfName);
};
```

### 3. Inline Editing System

#### Edit Activation
- Click pencil icon to start editing
- Input field replaces shelf name
- Auto-focus for immediate typing

#### Edit Completion
Multiple ways to complete edit:
1. **Blur**: Click outside to save
2. **Enter**: Confirm with Enter key
3. **Escape**: Cancel with Escape key

```javascript
onKeyDown={(e) => {
  if (e.key === 'Enter') {
    // Save if changed and non-empty
  } else if (e.key === 'Escape') {
    setEditingShelf(null);
  }
}}
```

### 4. Shelf Management Actions

#### Rename Logic
- Validates non-empty names
- Checks for actual changes
- Propagates to parent component

#### Delete Protection
- Cannot delete system shelves
- Confirmation handled by parent
- Visual remove button on hover

## Component Structure

```
ShelfSelector
├── Shelves List
│   ├── Special Shelves Section
│   │   ├── All Items
│   │   └── Favorites
│   ├── Divider (conditional)
│   └── Custom Shelves Section
│       └── Custom Shelf Items
│           ├── Shelf Icon
│           ├── Shelf Name/Input
│           └── Action Buttons
│               ├── Edit Button
│               └── Delete Button
```

## UI Interactions

### 1. Selection States
- Visual highlight for selected shelf
- Click to select functionality
- Maintains selection during operations

### 2. Hover Effects
- Action buttons appear on hover
- Visual feedback for interactivity
- Cursor changes for clickable areas

### 3. Animation
Uses Framer Motion for custom shelves:
```javascript
initial={{ opacity: 0, x: -20 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -20 }}
transition={{ duration: 0.2 }}
```

## Event Handling

### Click Event Management
```javascript
onClick={(e) => e.stopPropagation()}
```
Prevents event bubbling for:
- Edit input clicks
- Action button clicks
- Maintaining focus during edit

### Keyboard Support
- Tab navigation through shelves
- Enter/Escape in edit mode
- Full keyboard accessibility

## Visual Design

### Icon System
- Special shelves have unique icons
- Custom shelves use folder icon
- Action icons (pencil, trash)

### Layout Structure
- Vertical list layout
- Clear section separation
- Consistent spacing and alignment

### Conditional Rendering
Divider only shows when custom shelves exist:
```javascript
{shelves.length > 0 && 
 shelves.some(shelf => !['all', 'favorites'].includes(shelf)) && (
  <div className="shelf-divider">
    <span>Custom Shelves</span>
  </div>
)}
```

## CSS Architecture

### Class Hierarchy
```css
.shelf-selector          // Root container
.shelves-list           // Main list wrapper
.special-shelves        // System shelves section
.shelf-item             // Individual shelf
.shelf-item.selected    // Selected state
.shelf-item.custom      // Custom shelf variant
.shelf-main             // Icon and name container
.shelf-actions          // Action buttons container
```

### State Classes
- `.selected`: Active shelf highlighting
- `.custom`: Styling for user shelves
- Hover states for interactive elements

## Accessibility Features

1. **Semantic Structure**: Logical HTML hierarchy
2. **Keyboard Navigation**: Full keyboard support
3. **Focus Management**: Auto-focus on edit
4. **Title Attributes**: Descriptive tooltips
5. **Event Handling**: Proper click target sizes

## Integration Examples

### Basic Usage
```jsx
<ShelfSelector 
  shelves={['Research', 'Projects', 'Archive']}
  selectedShelf="all"
  onSelectShelf={setActiveShelf}
  onRemoveShelf={handleDeleteShelf}
  editingShelf={editingShelfName}
  setEditingShelf={setEditingShelfName}
  onRenameShelf={handleRenameShelf}
  onDrop={handleItemDrop}
/>
```

### With Drag and Drop
```javascript
const handleItemDrop = (shelfName) => {
  if (draggedItem) {
    moveItemToShelf(draggedItem.id, shelfName);
  }
};
```

## Best Practices Demonstrated

1. **Separation of Concerns**: UI logic separated from data
2. **Controlled Components**: Edit state managed by parent
3. **Event Delegation**: Efficient event handling
4. **Defensive Programming**: Safe array filtering
5. **Composition**: Combines multiple UI patterns

## Performance Optimizations

1. **Conditional Rendering**: Only render what's needed
2. **Event Handler Reuse**: Shared handler functions
3. **Minimal State**: Only essential local state
4. **Efficient Filtering**: Single-pass array operations

## Edge Cases Handled

1. **Empty Shelves Array**: Shows only special shelves
2. **No Custom Shelves**: Hides divider
3. **Edit Cancellation**: Proper state cleanup
4. **Drag Over System Shelves**: Allows drops on all shelves

## Potential Enhancements

1. **Shelf Icons**: Custom icons per shelf
2. **Shelf Ordering**: Drag to reorder shelves
3. **Nested Shelves**: Hierarchical organization
4. **Shelf Sharing**: Collaboration features
5. **Bulk Selection**: Multi-select operations
6. **Search Filter**: Find shelves quickly
7. **Shelf Metadata**: Description, creation date
8. **Access Control**: Public/private shelves