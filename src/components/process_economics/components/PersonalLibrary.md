# PersonalLibrary Component

## Overview
The `PersonalLibrary` component is a comprehensive library management system that allows users to organize saved configurations into custom shelves. It provides full CRUD operations for shelves, drag-and-drop functionality for organizing items, and real-time synchronization with the backend.

## Component Architecture

### Props Interface
```javascript
{
  items: Array,              // Array of library items
  setItems: Function,        // State setter for items
  onImportConfiguration: Function,  // Callback for importing a configuration
  userId: string,            // User identifier for backend operations
  isSearchView: boolean      // Simplified view mode for search results
}
```

### State Management
- `selectedShelf`: Currently active shelf filter
- `shelves`: Array of available shelf names
- `isAddingShelf`: Toggle for shelf creation form
- `newShelfName`: Input value for new shelf name
- `editingShelf`: Name of shelf being edited
- `draggedItem`: Item being dragged for reorganization

## Core Features

### 1. Shelf Management System
The component implements a complete shelf management system with:

#### Default Shelves
- **All Items**: Shows all items in the library
- **Favorites**: Shows only items marked as favorites

#### Custom Shelves
- Users can create unlimited custom shelves
- Shelves are extracted from item data on mount
- Names must be unique and non-empty

### 2. CRUD Operations

#### Create Shelf
```javascript
const handleAddShelf = async () => {
  // Validates shelf name
  // Checks for duplicates
  // Updates local state
  // Persists to backend via createShelf()
}
```

#### Rename Shelf
- Inline editing with keyboard support (Enter/Escape)
- Validation prevents duplicate names
- Updates all items on that shelf
- Maintains selection state after rename

#### Delete Shelf
- Confirmation dialog prevents accidental deletion
- Items remain in library (shelf property set to null)
- Cannot delete system shelves (All/Favorites)
- Redirects to "All Items" if current shelf deleted

### 3. Drag and Drop System
The component implements a complete drag-and-drop system for organizing items:

```javascript
// Drag initiation
handleDragStart(item) → setDraggedItem(item)

// Drop handling
handleDrop(shelfName) → Updates item.shelf property

// Visual feedback
onDragOver(e) → e.preventDefault()
```

### 4. Item Organization

#### Filtering Logic
```javascript
const filteredItems = items.filter(item => {
  if (selectedShelf === 'all') return true;
  if (selectedShelf === 'favorites') return item.isFavorite;
  return item.shelf === selectedShelf;
});
```

#### Item Actions
- **Toggle Favorite**: Mark/unmark items as favorites
- **Move to Shelf**: Assign items to specific shelves
- **Drag to Reorganize**: Visual organization via drag-and-drop

## Component Views

### 1. Full Library View
When `isSearchView` is false, displays:
- Left sidebar with shelf selector
- Main content area with filtered items
- Add shelf button with inline form
- Empty state messaging

### 2. Search Results View
When `isSearchView` is true, displays:
- Simplified grid of items
- No shelf management interface
- Streamlined for search results display

## Integration with Services

### Backend Synchronization
All operations are persisted through the `libraryService`:

```javascript
// Shelf operations
await createShelf(userId, shelfName)
await renameShelf(userId, oldName, newName)
await removeShelf(userId, shelfName)

// Item updates
await updatePersonalLibrary(userId, updatedItems)
```

### Real-time Updates
- Local state updates immediately for responsiveness
- Backend calls are made asynchronously
- Error handling maintains consistency

## Animation and UX

### Motion Effects
Uses Framer Motion for smooth transitions:
- Shelf items fade in with horizontal slide
- Drag operations use `layoutId` for smooth repositioning
- AnimatePresence manages exit animations

### User Feedback
- Visual selection states for active shelf
- Hover effects on interactive elements
- Loading states during async operations
- Confirmation dialogs for destructive actions

## Component Structure

```
PersonalLibrary
├── Shelf Management Section
│   ├── Special Shelves (All/Favorites)
│   ├── Custom Shelves List
│   └── Add Shelf Form
└── Content Area
    ├── Section Header
    ├── Items Grid
    │   └── ItemCard (with drag capability)
    └── Empty State
```

## Error Handling

### Validation
- Shelf names must be non-empty
- Duplicate shelf names are prevented
- System shelves cannot be modified

### User Notifications
- Alert dialogs for validation errors
- Confirmation prompts for deletions
- Success/failure feedback for operations

## Performance Considerations

1. **Shelf Extraction**: Uses Set to efficiently extract unique shelf names
2. **Filtering**: Single-pass filter operation for performance
3. **Drag Operations**: Lightweight state updates during drag
4. **Batch Updates**: Groups related operations when possible

## Accessibility Features

- Keyboard navigation for shelf selection
- ARIA labels for interactive elements
- Focus management in forms
- Semantic HTML structure

## Best Practices Demonstrated

1. **Separation of Concerns**: UI logic separated from data persistence
2. **Optimistic Updates**: UI updates before backend confirmation
3. **Error Recovery**: Graceful handling of failed operations
4. **Progressive Enhancement**: Core functionality works without animations

## Usage Example

```jsx
<PersonalLibrary 
  items={userLibraryItems}
  setItems={setUserLibraryItems}
  onImportConfiguration={handleImport}
  userId={currentUser.id}
  isSearchView={false}
/>
```

## Future Enhancement Opportunities

1. **Bulk Operations**: Select multiple items for batch moves
2. **Shelf Sharing**: Share custom shelves with other users
3. **Sort Options**: Custom sorting within shelves
4. **Shelf Icons**: Custom icons for visual distinction
5. **Nested Shelves**: Hierarchical organization support