# CalculationMonitorRun CSS Documentation

## Overview
`CalculationMonitorRun.css` provides specialized styling for the calculation execution phase within the CalculationMonitor component. This stylesheet focuses on the visual representation of running calculations, progress tracking, and calculation details display.

## Component Scope
All styles are scoped under `.calculation-monitor` to ensure they only apply within the CalculationMonitor component context.

## Version Monitor Enhancement
- `.calculation-monitor .version-monitor`
  - Green left border (4px solid #4CAF50) indicating active state
  - Smooth transition (0.3s ease) for state changes

## Calculation Step Display

### Step Container
- `.calculation-monitor .calculation-step`
  - Light blue background (rgba(33, 150, 243, 0.1))
  - 8px padding for content spacing
  - 4px border radius for rounded corners
  - 10px top margin for separation
  - 3px blue left border (#2196F3) for emphasis

## Progress Tracking

### Progress Container
- `.calculation-monitor .progress-container`
  - 12px vertical margin for spacing

### Progress Label
- `.calculation-monitor .progress-label`
  - 12px font size for compact display
  - 4px bottom margin
  - Gray text color (#555) for secondary information

### Progress Bar
- `.calculation-monitor .progress-bar`
  - 8px height for visibility
  - Light gray background (#e0e0e0)
  - 4px border radius for rounded edges
  - Hidden overflow to contain fill

### Progress Fill
- `.calculation-monitor .progress-bar-fill`
  - 100% height to fill container
  - Green background (#4CAF50) for positive feedback
  - Smooth width transition (0.3s ease) for animated progress

## Calculation Details Section

### Details Container
- `.calculation-monitor .calculation-details`
  - 15px top margin for separation
  - Dashed top border (1px, rgba(0, 0, 0, 0.1))
  - 10px top padding

### Details Header
- `.calculation-monitor .calculation-details h5`
  - 14px font size
  - No top margin, 8px bottom margin
  - Blue text color (#2196F3) for consistency

### Details Content
- `.calculation-monitor .details-container`
  - 150px maximum height with scroll
  - Auto vertical scroll for overflow
  - 5px right padding for scrollbar spacing
  - 12px font size for readability

## Dark Theme Overrides

### Calculation Step (Dark)
- `.dark-theme .calculation-monitor .calculation-step`
  - Darker blue background (rgba(33, 150, 243, 0.05))
  - Darker blue border (#1976D2)

### Progress Elements (Dark)
- `.dark-theme .calculation-monitor .progress-label`
  - Lighter gray text (#aaa) for contrast

- `.dark-theme .calculation-monitor .progress-bar`
  - Dark gray background (#444)

### Details (Dark)
- `.dark-theme .calculation-monitor .calculation-details h5`
  - Lighter blue text (#64B5F6) for visibility

- `.dark-theme .calculation-monitor .details-container`
  - Light gray text (#ddd) for readability

## Visual Hierarchy

1. **Active State**: Green border on version monitor
2. **Current Step**: Blue-tinted background with border
3. **Progress**: Visual bar with percentage fill
4. **Details**: Scrollable area with condensed information

## Color Palette

### Light Theme
- Active Green: #4CAF50
- Step Blue: #2196F3
- Background Blue: rgba(33, 150, 243, 0.1)
- Progress Background: #e0e0e0
- Text Gray: #555
- Border Gray: rgba(0, 0, 0, 0.1)

### Dark Theme
- Step Blue Dark: #1976D2
- Background Blue Dark: rgba(33, 150, 243, 0.05)
- Progress Background Dark: #444
- Text Light Blue: #64B5F6
- Text Light Gray: #aaa, #ddd

## Usage Context
This stylesheet complements the main CalculationMonitor.css and is specifically designed for the `handleRun` function's UI requirements, providing:
- Clear visual feedback during calculations
- Progress indication
- Organized display of calculation details
- Consistent theming support