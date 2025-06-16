# Tooltip Component

## Overview
An animated tooltip component that displays additional information on hover. Built with Framer Motion for smooth animations and provides a reusable interface for contextual help throughout the application.

## Architecture

### Component Structure
- **Type**: React Functional Component
- **Animation**: Framer Motion
- **Pattern**: Hover-triggered overlay

### Dependencies
- React hooks (useState, useRef)
- Framer Motion (motion, AnimatePresence)
- HCSS styles

## Core Features

### 1. Hover Interaction
- Mouse enter: Show tooltip
- Mouse leave: Hide tooltip
- Container-based detection

### 2. Smooth Animations
- **Entry**: Fade in + slide up
- **Exit**: Fade out + slide down
- **Duration**: 0.2 seconds

### 3. Flexible Content
- Accepts any React node as content
- Wraps any children elements
- Dynamic positioning

## Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `content` | React.ReactNode | Yes | Content displayed in tooltip |
| `children` | React.ReactNode | Yes | Elements that trigger tooltip |

## Animation Specifications

### Initial State
```javascript
initial={{ opacity: 0, y: 10 }}
```
- Invisible (opacity: 0)
- Positioned 10px below

### Animate State
```javascript
animate={{ opacity: 1, y: 0 }}
```
- Fully visible
- Natural position

### Exit State
```javascript
exit={{ opacity: 0, y: 10 }}
```
- Fade out
- Slide down effect

## Usage Examples

### Basic Text Tooltip
```jsx
<Tooltip content="This is helpful information">
    <button>Hover me</button>
</Tooltip>
```

### Complex Content
```jsx
<Tooltip content={
    <div>
        <h4>Advanced Info</h4>
        <p>Detailed explanation here</p>
    </div>
}>
    <InfoIcon />
</Tooltip>
```

### Multiple Elements
```jsx
<Tooltip content="Group tooltip">
    <div>
        <span>Element 1</span>
        <span>Element 2</span>
    </div>
</Tooltip>
```

## CSS Classes

### Container Structure
- `.tooltip-container`: Wrapper element
- `.tooltip`: Tooltip content box

### Styling Considerations
- Position relative container
- Absolute positioned tooltip
- Z-index management
- Responsive sizing

## State Management

### Visibility Control
```javascript
const [isVisible, setIsVisible] = useState(false);
```
- Boolean state for show/hide
- Event-driven updates
- Clean state transitions

### Ref Usage
```javascript
const tooltipRef = useRef(null);
```
- DOM reference for positioning
- Future enhancement ready
- Performance optimization

## Best Practices

### Content Guidelines
- Keep text concise
- Use for supplementary info
- Avoid critical information
- Consider mobile users

### Performance
- Lightweight animations
- Conditional rendering
- Minimal re-renders
- Efficient event handlers

### Accessibility
- Consider keyboard users
- Add ARIA attributes
- Ensure color contrast
- Test screen readers

## Integration Benefits
- Consistent help system
- Reusable across components
- Smooth user experience
- Easy implementation
- Flexible content support