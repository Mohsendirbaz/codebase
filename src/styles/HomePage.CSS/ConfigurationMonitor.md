# ConfigurationMonitor.css - Configuration Monitor Panel Styles

## Overview

`ConfigurationMonitor.css` provides the styling for the financial configuration monitoring panel with a collapsible sidebar design. It features neumorphic styling, smooth transitions, and a comprehensive parameter display system.

## Architecture

### Layout System
- **Fixed Width Panel**: 480px when expanded, 50px when collapsed
- **Full Height**: Utilizes 100% container height
- **Border Separation**: Right border for visual separation
- **Rounded Corners**: Using neumorphic border radius

### State Management
```css
.config-monitor-c.collapsed {
  width: 50px;
  opacity: 0.8;
}

.config-monitor-c.expanded {
  width: 480px;
  opacity: 1;
}
```

## Core Components

### Main Container
```css
.config-monitor-c {
  position: relative;
  height: 100%;
  transition: height var(--neu-transition-medium), 
              width var(--neu-transition-medium), 
              opacity var(--neu-transition-medium);
  background-color: var(--card-background);
  border-right: 1px solid var(--border-color);
  overflow: hidden;
  width: 480px;
  box-shadow: var(--neu-shadow-md);
  border-radius: var(--neu-border-radius-lg);
}
```

**Features**:
- Smooth transitions for collapse/expand
- Neumorphic shadow effects
- Theme-aware background colors

### Header Section
```css
.config-header-c {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--neu-gradient-basic);
  border-bottom: 1px solid var(--border-color);
}
```

### Content Area
```css
.config-content-c {
  padding: 16px;
  overflow-y: auto;
  height: calc(100% - 56px);
}
```
**Note**: Height calculation accounts for header (56px)

## Interactive Elements

### Toggle Button
```css
.toggle-button {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: var(--text-color);
  display: flex;
  align-items: center;
  transition: transform var(--neu-transition-fast);
  position: absolute;
  right: 16px;
  top: 12px;
}

.toggle-button:hover {
  transform: scale(1.1);
}
```

### Search Input
```css
.search-input {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 2px solid var(--border-color);
  border-radius: var(--neu-border-radius-md);
  background: var(--neu-background);
  color: var(--text-color);
  font-size: var(--model-font-size-md);
  transition: all var(--neu-transition-fast);
  box-shadow: var(--neu-shadow-sm);
}

.search-input:focus {
  outline: none;
  box-shadow: var(--neu-pressed-shadow);
  border-color: var(--primary-color);
}
```

## Parameter Display System

The CSS file includes extensive styling for parameter display including:
- Parameter groups with expandable sections
- Baseline and customized value displays
- Time-segmented parameter visualization
- Delete functionality styling
- Customized value tables

## CSS Variables Used

### Spacing & Layout
- `--neu-border-radius-md`: Medium border radius
- `--neu-border-radius-lg`: Large border radius

### Colors
- `--card-background`: Panel background
- `--border-color`: Border colors
- `--text-color`: Text color
- `--primary-color`: Primary accent
- `--neu-gradient-basic`: Header gradient

### Effects
- `--neu-shadow-sm`: Small shadow
- `--neu-shadow-md`: Medium shadow
- `--neu-pressed-shadow`: Focus state shadow
- `--neu-transition-fast`: Fast transitions
- `--neu-transition-medium`: Medium transitions

## Design Patterns

### 1. Collapsible Sidebar
- Smooth width transition
- Opacity change for visual feedback
- Maintained border separation

### 2. Neumorphic Elements
- Soft shadows for depth
- Gradient backgrounds
- Pressed states for inputs

### 3. Responsive Search
- Flexible width with minimum constraint
- Wrap capability for narrow views
- Focus state highlighting

## Responsive Behavior

- **Minimum Widths**: Search input (200px), filter (160px)
- **Flexible Layout**: Search filters wrap on small screens
- **Scrollable Content**: Vertical scrolling for parameter lists

## Accessibility Features

- Clear focus states
- High contrast text
- Hover feedback
- Keyboard navigation support

## Performance Optimizations

- CSS transitions instead of JavaScript animations
- Efficient shadow usage
- Minimal repaints during collapse/expand

## Integration Notes

This stylesheet works closely with:
- `ConfigurationMonitor.js` component
- Theme system CSS variables
- Neumorphic design system

## Best Practices

1. **Use CSS Variables**: Leverage theme variables for consistency
2. **Maintain Transitions**: Keep smooth animations for state changes
3. **Preserve Accessibility**: Ensure focus states remain visible
4. **Test Collapse States**: Verify content doesn't overflow when collapsed

The configuration monitor provides a sophisticated parameter management interface with smooth interactions and clear visual hierarchy.