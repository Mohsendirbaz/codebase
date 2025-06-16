# ErrorBoundary Component Documentation

## Overview

The `ErrorBoundary` component is a React error boundary implementation that provides graceful error handling for React component trees. It catches JavaScript errors anywhere in its child component tree, logs those errors, and displays a fallback UI instead of crashing the entire application.

## Architecture

### Component Type
- **Class Component**: Utilizes React's class component architecture to access error boundary lifecycle methods
- **Error Boundary Pattern**: Implements React's error boundary pattern for production-ready error handling

### Core Features

1. **Error Catching**: Captures errors during rendering, in lifecycle methods, and in constructors
2. **Error State Management**: Maintains error state with detailed error information
3. **Fallback UI**: Provides a user-friendly error display with expandable details
4. **Theme Support**: Integrates with CSS custom properties for consistent theming
5. **Recovery Mechanism**: Offers page reload functionality for error recovery

## Component Structure

### State Management
```javascript
state = {
  hasError: false,      // Boolean flag indicating error presence
  error: null,          // The actual error object
  errorInfo: null       // Additional error information (component stack)
}
```

### Lifecycle Methods

#### `getDerivedStateFromError(error)`
- **Purpose**: Updates state to trigger fallback UI rendering
- **Static Method**: Called during the "render" phase
- **Returns**: State update object `{ hasError: true }`

#### `componentDidCatch(error, errorInfo)`
- **Purpose**: Logs errors and captures detailed error information
- **Called During**: "Commit" phase (after DOM updates)
- **Side Effects**: 
  - Updates component state with error details
  - Logs error to console for debugging

## UI Components

### Error Display Structure
1. **Container**: Styled div with padding, margin, and themed colors
2. **Error Heading**: Prominent "Something went wrong" message
3. **Collapsible Details**: 
   - Summary element with clickable interaction
   - Error message display
   - Component stack trace in formatted pre element
4. **Recovery Button**: Page reload functionality

### Styling Integration

The component uses CSS custom properties for theming:
- `--model-color-surface`: Background color
- `--model-color-border`: Border color
- `--model-color-text`: Primary text color
- `--model-color-error`: Error text color
- `--model-color-primary`: Primary action color
- `--model-color-text-secondary`: Secondary text color
- `--model-color-background`: Code block background

## Usage Pattern

```javascript
import ErrorBoundary from './utils/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponentTree />
    </ErrorBoundary>
  );
}
```

## Export

- **Default Export**: The component is exported as the default export
- **Import**: `import ErrorBoundary from './utils/ErrorBoundary'`

## Integration Points

### Parent Components
- Should wrap high-level components or entire application sections
- Can be nested for granular error handling

### Child Components
- All child components are rendered through `this.props.children`
- Errors in any child component will bubble up to this boundary

### Theme System
- Integrates with application's CSS variable theme system
- Provides fallback colors for each themed property

## Error Recovery Strategy

1. **Immediate Display**: Shows error UI immediately upon error detection
2. **User Information**: Provides clear error indication without technical jargon
3. **Developer Details**: Includes expandable technical details for debugging
4. **Manual Recovery**: Reload button for user-initiated recovery

## Best Practices

1. **Placement**: Place at strategic points in component tree (not around every component)
2. **Multiple Boundaries**: Use multiple error boundaries for different UI sections
3. **Error Logging**: The component logs to console; consider adding error reporting service
4. **User Experience**: The fallback UI maintains application styling consistency

## Limitations

1. Does not catch errors in:
   - Event handlers
   - Asynchronous code (setTimeout, promises)
   - Server-side rendering
   - Errors thrown in the error boundary itself

2. Only catches errors in child components, not siblings or parents

## Future Enhancement Opportunities

1. **Error Reporting**: Integration with error tracking services (Sentry, etc.)
2. **Error Recovery**: Automatic retry mechanisms
3. **Error Context**: Additional context about what the user was doing
4. **Custom Fallback**: Prop-based custom error UI components