# CalculationMonitor CSS Documentation

## Overview
`CalculationMonitor.css` provides styling for the calculation monitoring interface that tracks and displays real-time calculation progress, version statuses, and sensitivity analysis logs. The design emphasizes clear visual status indicators and organized data presentation.

## Component Structure

### Main Container
- `.calculation-monitor`: Primary container with card-like appearance
  - 20px top margin
  - 15px padding
  - 8px border radius (using `--model-border-radius-md`)
  - Light background (#f5f5f5 or `--card-background`)
  - Medium shadow effect (`--model-shadow-md`)

### Header
- `h3`: Section title styling
  - No top margin, 15px bottom margin
  - Primary color text (#2196F3 or `--primary-color`)
  - 18px font size (`--model-font-size-lg`)
  - Bottom border separator (1px solid)
  - 8px bottom padding

### Data States

#### No Data State
- `.no-data`: Empty state message
  - Italic font style
  - Secondary text color (#666 or `--text-secondary`)
  - Centered text alignment
  - 20px vertical padding

#### Data Container
- `.monitor-data`: Flexible grid for version monitors
  - Flexbox with wrap
  - 15px gap between items

## Version Monitor Cards

### Base Card
- `.version-monitor`: Individual monitor cards
  - Flex: 1 with 250px minimum width
  - 12px padding
  - 6px border radius (`--model-border-radius-sm`)
  - White background (`--card-background`)
  - 0.3s ease transitions
  - 4px left border (color varies by status)

### Status Variants
Different border colors indicate monitor states:

1. **Default**: Gray border (#ccc)
2. **Connecting**: Yellow/warning (#FFC107)
3. **Connected**: Blue/info (#2196F3)
4. **Active**: Green/success (#4CAF50)
5. **Error**: Red/danger (#F44336)
6. **Complete**: Light green background overlay

### Monitor Components

#### Status Display
- `.monitor-status`: Status indicator row
  - Flex display with center alignment
  - 10px bottom margin

- `.status-indicator`: Animated status dot
  - 10px × 10px circle
  - 8px right margin
  - Color matches monitor state
  - Pulse animation for connecting/active states

- `.status-text`: Status description
  - 14px font size (`--model-font-size-sm`)
  - Secondary text color (#555)

#### Monitor Details
- `.monitor-details`: Additional information section
  - 10px top margin and padding
  - Dashed top border separator

- `.detail-row`: Individual detail lines
  - 6px bottom margin
  - 14px font size
  - Primary text color (#333)

#### Success Message
- `.success-message`: Completion notification
  - 10px top margin
  - 8px padding
  - Light green background (20% opacity)
  - 4px border radius
  - Bold green text (#388E3C)
  - Centered alignment

## Sensitivity Log Section

### Container
- `.sensitivity-log`: Log display area
  - 15px top margin
  - 10px top padding
  - Dashed top border

### Log Header
- `h5`: Section title
  - No top margin, 10px bottom
  - 14px font size
  - Success color text (#81C784)

### Log Display
- `.log-container`: Scrollable log area
  - 200px maximum height
  - Auto vertical scroll
  - Dark background (20% black opacity)
  - 4px border radius
  - 5px padding
  - Monospace font family

### Log Entries
- `.log-entry`: Individual log lines
  - 3px/5px padding
  - 3px bottom margin
  - 2px border radius
  - Flex display with wrap
  - 3px left border (color by type)

#### Log Entry Types
1. **Info**: Blue theme
   - Background: 10% blue opacity
   - Border: #2196F3

2. **Warning**: Yellow theme
   - Background: 10% yellow opacity
   - Border: #FFC107

3. **Error**: Red theme
   - Background: 10% red opacity
   - Border: #F44336

### Log Components
- `.log-timestamp`: Time display
  - Gray text (#999)
  - 8px right margin
  - 10px font size

- `.log-level`: Severity indicator
  - Bold font weight
  - 8px right margin
  - Color matches entry type

- `.log-message`: Main message text
  - Light text color (#ccc)
  - Flex: 1 for remaining space
  - Word-break for long content

## Animations

### Pulse Animation
```css
@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}
```
Used for active status indicators to show ongoing processes.

## CSS Custom Properties

### Layout
- `--model-border-radius-md`: 8px
- `--model-border-radius-sm`: 6px/4px
- `--model-shadow-md`: Medium shadow depth

### Colors
- `--card-background`: Component backgrounds
- `--primary-color`: Headers and emphasis
- `--text-primary`: Main text
- `--text-secondary`: Supporting text
- `--border-color`: Separators
- `--success-color`: Positive states
- `--info-color`: Informational states
- `--warning-color`: Caution states
- `--danger-color`: Error states

### Typography
- `--model-font-size-lg`: 18px
- `--model-font-size-md`: 16px
- `--model-font-size-sm`: 14px
- `--model-font-size-xs`: 12px
- `--model-font-family-mono`: Monospace fonts

### Theme-Specific
- `--model-color-success-light`: Light success variations
- `--model-color-primary-light`: Light primary variations
- `--model-color-danger-light`: Light danger variations
- `--model-color-background-alt-dark`: Dark mode backgrounds
- `--model-color-border-dark`: Dark mode borders

## Responsive Design
- Version monitors use flexbox with wrap
- Minimum width ensures readability
- Log container has max-height with scroll
- Detail rows wrap for long content