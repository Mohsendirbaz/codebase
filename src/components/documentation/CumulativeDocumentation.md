# Cumulative Documentation Component

## Overview
A specialized documentation component that explains the cumulative calculation system used in the scaling workflow. Provides visual examples and clear explanations of how values flow through sequential tabs.

## Architecture

### Component Structure
- **Type**: React Functional Component
- **Purpose**: Educational documentation display
- **Pattern**: Presentational component with callback

### Visual Design
- Structured documentation layout
- Interactive example flow diagram
- Clear mathematical progression
- Dismissible interface

## Core Features

### Documentation Content
1. **Conceptual Explanation**
   - Default scaling foundation
   - Sequential tab building
   - Automatic update propagation

2. **Visual Example**
   - Three-tab calculation flow
   - Base value progression
   - Operation display
   - Result tracking

### Example Flow Visualization
```
Default Tab → Second Tab → Third Tab
Base: 100     Base: 200    Base: 250
× 2           + 50         × 1.2
Result: 200   Result: 250  Result: 300
```

## Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onClose` | Function | Yes | Callback when documentation is dismissed |

## UI Elements

### Layout Structure
- **Container**: `.scaling-documentation`
- **Example Area**: `.scaling-documentation-example`
- **Flow Display**: `.example-flow`
- **Tab Cards**: `.example-tab`

### Content Sections
1. **Header**: "Understanding Cumulative Calculations"
2. **Explanation**: Ordered list of concepts
3. **Visual Example**: Interactive flow diagram
4. **Action**: Dismissal button

## Styling Classes

### Documentation Classes
- `.scaling-documentation`: Main wrapper
- `.scaling-documentation-example`: Example container
- `.example-flow`: Horizontal flow layout
- `.example-tab`: Individual calculation card
- `.example-arrow`: Flow direction indicator
- `.example-value`: Base value display
- `.example-op`: Operation display
- `.example-result`: Result display
- `.scaling-documentation-button`: Action button

## Educational Design

### Learning Flow
1. **Concept Introduction**: Text explanation
2. **Visual Reinforcement**: Example diagram
3. **Interactive Conclusion**: Dismissal action

### Key Teaching Points
- Sequential dependency
- Cumulative nature
- Automatic updates
- Mathematical continuity

## Integration Pattern

### Usage Example
```jsx
{showDocumentation && (
  <CumulativeDocumentation 
    onClose={() => setShowDocumentation(false)} 
  />
)}
```

### Placement Options
- Modal overlay
- Inline help section
- Sidebar panel
- Tooltip expansion

## Accessibility Features
- Clear heading structure
- Ordered list for steps
- Button with descriptive text
- Semantic HTML elements

## Best Practices
- Keep examples simple and clear
- Use consistent mathematical operations
- Provide realistic value progressions
- Ensure responsive layout