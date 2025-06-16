# UsageIndicator Component

## Overview
The `UsageIndicator` component provides a visual representation of how frequently a configuration has been used. It features dynamic styling based on usage levels, tooltip integration, and both full and compact display modes.

## Component Architecture

### Props Interface
```javascript
{
  count: number,        // Number of times configuration has been used
  compact: boolean      // Whether to render compact version (default: false)
}
```

## Core Features

### 1. Usage Level Classification
The component categorizes usage into five distinct levels:

```javascript
const getUsageLevel = (count) => {
  if (count >= 100) return 'very-high';  // 100+ uses
  if (count >= 50) return 'high';        // 50-99 uses
  if (count >= 20) return 'medium';      // 20-49 uses
  if (count >= 5) return 'low';          // 5-19 uses
  return 'very-low';                      // 0-4 uses
};
```

### 2. Display Modes

#### Full Version
Default display mode showing:
- Chart bar icon
- Numeric count
- Tooltip on hover

#### Compact Version
Streamlined display for list views:
- Fire icon only
- No count display
- Tooltip shows full information

### 3. Tooltip Integration
Uses react-tooltip for enhanced UX:
```javascript
// Unique ID generation for tooltip binding
const tooltipId = `usage-tooltip-${Math.random().toString(36).substring(2, 9)}`;
```

## Visual Design

### Icon Selection
- **Full Mode**: ChartBarIcon - represents data/statistics
- **Compact Mode**: FireIcon - indicates "hot" or popular items

### Dynamic Styling
CSS classes change based on usage level:
- `.very-low`: Subtle, muted appearance
- `.low`: Slightly more prominent
- `.medium`: Moderate emphasis
- `.high`: Strong visual presence
- `.very-high`: Maximum visual impact

## Component Variations

### Full Version Structure
```jsx
<div className={`usage-indicator ${usageLevel}`}>
  <ChartBarIcon className="usage-icon" />
  <span className="usage-count">{count}</span>
  <Tooltip id={tooltipId} />
</div>
```

### Compact Version Structure
```jsx
<span className={`usage-indicator-compact ${usageLevel}`}>
  <FireIcon className="usage-icon" />
</span>
<Tooltip id={tooltipId} />
```

## Tooltip Content

### Full Version
"This configuration has been used {count} times"

### Compact Version
"Used {count} times"

## CSS Architecture

### Class Naming
```css
.usage-indicator          // Full version container
.usage-indicator-compact  // Compact version container
.usage-icon              // Icon styling
.usage-count            // Count number styling
```

### Usage Level Modifiers
Each usage level applies specific styling:
```css
.usage-indicator.very-low   // Minimal emphasis
.usage-indicator.low        // Low emphasis
.usage-indicator.medium     // Medium emphasis
.usage-indicator.high       // High emphasis
.usage-indicator.very-high  // Maximum emphasis
```

## Usage Examples

### In a Card Component
```jsx
<div className="item-card">
  <h3>{item.name}</h3>
  <UsageIndicator count={item.usageCount} />
</div>
```

### In a List View
```jsx
<div className="item-list-row">
  <span>{item.name}</span>
  <UsageIndicator count={item.usageCount} compact />
</div>
```

### With Custom Styling
```jsx
<div className="custom-container">
  <UsageIndicator 
    count={analytics.totalUses} 
    compact={isNarrowView}
  />
</div>
```

## Accessibility Features

1. **Tooltip Support**: Provides context for visual indicators
2. **Semantic HTML**: Uses appropriate elements
3. **Color Independence**: Not solely reliant on color
4. **Icon Meaning**: Icons provide additional context

## Performance Considerations

1. **Minimal Re-renders**: No internal state
2. **Efficient ID Generation**: One-time calculation
3. **Lightweight Icons**: SVG icons from Heroicons
4. **Conditional Rendering**: Mode-specific rendering

## Integration Points

### With Heroicons
- Consistent icon library usage
- Optimized SVG icons
- Tree-shakeable imports

### With React Tooltip
- Dynamic tooltip binding
- Unique IDs prevent conflicts
- Lazy tooltip rendering

## Best Practices Demonstrated

1. **Pure Component**: No side effects
2. **Single Responsibility**: Only shows usage
3. **Flexible API**: Compact mode for different contexts
4. **Progressive Enhancement**: Works without tooltips

## Styling Strategies

### Visual Hierarchy
Usage levels create natural visual hierarchy:
- Very high usage items stand out
- Low usage items remain visible but subdued

### Responsive Design
- Compact mode for space-constrained layouts
- Full mode for detailed views
- Adapts to container constraints

## Use Cases

### 1. Library Browsing
Show popularity of configurations in browse mode

### 2. Search Results
Quick visual indicator of item popularity

### 3. Analytics Dashboard
Display usage metrics at a glance

### 4. Item Comparisons
Compare relative popularity between items

## Potential Enhancements

1. **Animated Transitions**: Animate count changes
2. **Click Actions**: Navigate to usage details
3. **Relative Scaling**: Show usage relative to max
4. **Time-based Views**: Recent vs all-time usage
5. **User Segmentation**: Show usage by user type
6. **Sparkline Integration**: Mini usage graph
7. **Customizable Thresholds**: Configurable levels

## Component Benefits

1. **Immediate Understanding**: Visual usage levels
2. **Space Efficient**: Compact mode for lists
3. **Consistent Styling**: Unified visual language
4. **Flexible Display**: Adapts to context
5. **Enhanced UX**: Tooltips provide details

## Edge Cases Handled

1. **Zero Usage**: Shows very-low styling
2. **Very High Usage**: Capped visual emphasis
3. **Missing Count**: Defaults would show 0
4. **Tooltip Conflicts**: Unique IDs prevent issues