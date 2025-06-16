# Draggable Scaling Item Component

## Overview
A sophisticated drag-and-drop component that enables reorderable scaling items with integrated checkbox controls. Built with React DnD and Framer Motion for smooth animations and intuitive user interactions.

## Architecture

### Component Structure
- **Type**: React Functional Component
- **Libraries**: react-dnd, framer-motion
- **Pattern**: Drag-and-drop with animation

### Dependencies
- `useDrag`: Enables dragging functionality
- `useDrop`: Handles drop zone behavior
- `motion`: Provides smooth animations

## Core Features

### 1. Drag and Drop
- **Item Type**: 'scaling-item'
- **Hover Detection**: Middle-point algorithm
- **Position Updates**: Real-time index changes
- **Visual Feedback**: Opacity change when dragging

### 2. Checkbox Integration
- **V Checkboxes**: Process value toggles
- **R Checkboxes**: Revenue value toggles
- **Conditional Rendering**: Only when keys exist
- **State Binding**: Connected to parent state

### 3. Animation Effects
- **Layout Animation**: Smooth position transitions
- **Entry Animation**: Fade in with slide up
- **Exit Animation**: Fade out with slide up
- **Duration**: 0.2s transitions

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `item` | object | Item data with id, vKey, rKey |
| `index` | number | Current position in list |
| `moveItem` | function | Position update callback |
| `V` | object | V toggle states |
| `R` | object | R toggle states |
| `toggleV` | function | V toggle handler |
| `toggleR` | function | R toggle handler |
| `...props` | any | Additional props passed through |

## Drag and Drop Logic

### Drop Zone Configuration
```javascript
hover(item, monitor) {
    // Get hover boundaries
    const hoverMiddleY = (rect.bottom - rect.top) / 2;
    
    // Determine if should move
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
    
    // Execute move
    moveItem(dragIndex, hoverIndex);
}
```

### Drag Source Configuration
- Collects dragging state
- Provides item data
- Tracks drag status

## UI Components

### Checkbox Section
- **Structure**: Grouped checkboxes
- **Labels**: Dynamic key display
- **States**: 'on'/'off' toggle
- **Styling**: Custom checkbox class

### Motion Container
- **Ref Binding**: Combined drag/drop ref
- **Layout Animation**: Position changes
- **Opacity**: 0.5 when dragging
- **Data Attributes**: Handler ID tracking

## Animation Specifications

### Initial State
```javascript
initial={{ opacity: 0, y: 20 }}
```

### Animate State
```javascript
animate={{ opacity: 1, y: 0 }}
```

### Exit State
```javascript
exit={{ opacity: 0, y: -20 }}
```

### Transition
```javascript
transition={{ duration: 0.2 }}
```

## CSS Classes

### Component Classes
- `.checkbox-section`: Checkbox container
- `.checkbox-group`: Individual checkbox set
- `.checkbox-label`: Label text
- `.custom-checkbox`: Styled checkbox input

## Usage Pattern

### Parent Component Integration
```jsx
<DraggableScalingItem
    item={scalingItem}
    index={itemIndex}
    moveItem={handleMoveItem}
    V={vStates}
    R={rStates}
    toggleV={handleToggleV}
    toggleR={handleToggleR}
>
    {/* Child content */}
</DraggableScalingItem>
```

### Move Item Handler
```javascript
const handleMoveItem = (dragIndex, hoverIndex) => {
    const dragItem = items[dragIndex];
    const newItems = [...items];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, dragItem);
    setItems(newItems);
};
```

## Performance Considerations
- Ref optimization for drag/drop
- Conditional rendering for checkboxes
- Efficient hover calculations
- Minimal re-renders with layout animation

## Accessibility
- Checkbox labels for screen readers
- Keyboard navigation support
- Visual feedback for drag states
- Semantic HTML structure