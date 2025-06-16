# DeleteConfirmationModal Component Documentation

## Overview
The `DeleteConfirmationModal` is a confirmation dialog component that appears when users attempt to delete a scaling group. It provides detailed information about the deletion impact and offers multiple options for handling cascading effects on dependent scaling groups.

## Purpose
- Prevent accidental deletion of scaling groups
- Inform users about cascading effects on dependent groups
- Provide options for handling mathematical relationships after deletion
- Maintain data integrity in the scaling calculation chain

## Key Features

### 1. Impact Visualization
- Shows the scaling group to be deleted
- Lists all affected subsequent groups
- Displays item counts for each affected group
- Provides clear visual warnings

### 2. Deletion Options
Three distinct approaches for handling cascading effects:
- **Adjust calculations**: Recalculate all subsequent groups
- **Preserve values**: Keep current values but break mathematical chain
- **Reset to base**: Revert subsequent groups to original values

### 3. User Guidance
- Clear descriptions for each option
- Impact statements explaining consequences
- Help section with context about scaling chains
- Visual indicators (icons) for warnings and information

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `Boolean` | Yes | Controls modal visibility |
| `onClose` | `Function` | Yes | Callback when modal is closed/cancelled |
| `groupToDelete` | `Object` | Yes | The scaling group to be deleted |
| `affectedGroups` | `Array` | No | Array of groups affected by deletion |
| `onConfirm` | `Function` | Yes | Callback with selected option when confirmed |

### Group Object Structure
```javascript
{
  id: string,        // Unique identifier
  name: string,      // Display name
  items: Array       // Array of items in the group
}
```

## Component Architecture

### State Management
- `selectedOption`: Currently selected deletion option (default: 'adjust')

### Deletion Options Configuration
```javascript
const options = [
  { 
    id: 'adjust', 
    label: 'Delete and adjust calculations', 
    description: 'Recalculate all subsequent groups...',
    impact: 'Values in all subsequent groups will change...'
  },
  { 
    id: 'preserve', 
    label: 'Delete and preserve current values', 
    description: 'Keep the current calculated values...',
    impact: 'Mathematical relationships will be broken...'
  },
  { 
    id: 'reset', 
    label: 'Delete and reset to base values', 
    description: 'Reset all subsequent groups...',
    impact: 'All subsequent groups will revert...'
  }
];
```

## UI Structure

### 1. Modal Header
```javascript
<div className="modal-header warning">
  <ExclamationTriangleIcon className="warning-icon" />
  <h2>Confirm Scaling Group Deletion</h2>
</div>
```
- Warning icon for visual emphasis
- Clear title indicating action

### 2. Content Sections

#### Deletion Warning
```javascript
<p className="delete-warning">
  You are about to delete the scaling group <strong>{groupToDelete.name}</strong>.
</p>
```

#### Affected Groups Display
Shows impacted groups when cascading effects exist:
```javascript
<div className="affected-groups">
  <h3>This will affect {affectedGroups.length} subsequent scaling group(s):</h3>
  <ul className="affected-groups-list">
    {/* List of affected groups with item counts */}
  </ul>
</div>
```

#### Deletion Options
Interactive radio button selection:
```javascript
<div className="deletion-options">
  <h3>How would you like to handle the remaining calculations?</h3>
  <div className="options-list">
    {/* Radio button options with descriptions */}
  </div>
</div>
```

#### Help Section
Contextual information about scaling chains:
```javascript
<div className="help-section">
  <QuestionMarkCircleIcon className="help-icon" />
  <p className="help-text">
    Scaling groups form a chain of calculations...
  </p>
</div>
```

### 3. Action Buttons
```javascript
<div className="modal-actions">
  <button className="cancel-button" onClick={onClose}>Cancel</button>
  <button className="confirm-button warning" onClick={handleConfirm}>
    Delete Group
  </button>
</div>
```

## Behavior Flow

### 1. Opening the Modal
```javascript
// Parent component
const [modalOpen, setModalOpen] = useState(false);
const [groupToDelete, setGroupToDelete] = useState(null);

const handleDeleteClick = (group) => {
  setGroupToDelete(group);
  setModalOpen(true);
};
```

### 2. Option Selection
- Default selection is 'adjust' (safest option)
- Users can click option cards or radio buttons
- Visual feedback shows selected option

### 3. Confirmation
```javascript
const handleConfirm = () => {
  onConfirm(selectedOption);  // Pass selected option to parent
  onClose();                  // Close the modal
};
```

### 4. Cancellation
- Clicking "Cancel" or outside modal (if implemented)
- No changes are made to data

## Styling Patterns

The component uses several CSS classes for consistent styling:
- `.modal-overlay`: Full-screen backdrop
- `.delete-confirmation-modal`: Main modal container
- `.warning`: Red/orange styling for warnings
- `.affected-group-item`: Individual group display
- `.option-item.selected`: Highlighted selected option

## Animation

Uses Framer Motion for smooth entrance:
```javascript
<motion.div 
  className="delete-confirmation-modal"
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 50 }}
>
```

## Usage Example

```javascript
function ScalingGroupManager() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  
  const handleDeleteGroup = (group) => {
    const affected = getAffectedGroups(group.id);
    setGroupToDelete({ ...group, affectedGroups: affected });
    setDeleteModalOpen(true);
  };
  
  const handleConfirmDelete = (option) => {
    switch(option) {
      case 'adjust':
        deleteAndRecalculate(groupToDelete.id);
        break;
      case 'preserve':
        deleteAndPreserve(groupToDelete.id);
        break;
      case 'reset':
        deleteAndReset(groupToDelete.id);
        break;
    }
  };
  
  return (
    <>
      {/* Scaling groups UI */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        groupToDelete={groupToDelete}
        affectedGroups={groupToDelete?.affectedGroups || []}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
```

## Edge Cases Handled

1. **No Affected Groups**: Shows different message when deletion won't affect other groups
2. **Null Group**: Returns null if `groupToDelete` is not provided
3. **Empty Items**: Handles groups with no items gracefully

## Accessibility Features

- Proper heading hierarchy (h2, h3)
- Radio buttons with labels
- Clear action button labels
- Icon usage supplemented with text
- Keyboard navigation support (via native form elements)

## Integration Considerations

### Parent Component Requirements
1. Track which group is being deleted
2. Calculate affected groups before showing modal
3. Implement the three deletion strategies
4. Handle modal state (open/close)

### Data Flow
```
Parent Component
    ↓ (groupToDelete, affectedGroups)
DeleteConfirmationModal
    ↓ (selectedOption via onConfirm)
Parent Component (executes deletion strategy)
```

## Future Enhancements

1. **Undo Functionality**
   - Add "Undo" option after deletion
   - Store deletion history

2. **Preview Mode**
   - Show preview of changes for each option
   - Visual diff of before/after states

3. **Batch Operations**
   - Support deleting multiple groups
   - Show combined impact analysis

4. **Export Before Delete**
   - Option to export affected data
   - Automatic backup creation

5. **Custom Options**
   - Allow parent to define custom handling options
   - Plugin architecture for deletion strategies