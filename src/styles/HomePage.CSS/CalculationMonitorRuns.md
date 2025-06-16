# CalculationMonitorRuns.css Documentation

## Overview
This stylesheet specifically handles the styling for the calculation runs monitoring functionality, particularly focused on sensitivity analysis visualization and progress tracking within the CalculationMonitor component.

## Component Structure
The styles are scoped to `.calculation-monitor` to ensure proper encapsulation and avoid conflicts with other components.

## Core Sections

### 1. Sensitivity Monitor Container
```css
.calculation-monitor .version-monitor.sensitivity
```
- **Purpose**: Visual distinction for sensitivity analysis runs
- **Border**: 4px solid purple accent (#9C27B0)
- **Transition**: Smooth 0.3s ease for state changes
- **Visual Hierarchy**: Creates immediate recognition of sensitivity calculations

### 2. Payload Details Section
```css
.calculation-monitor .payload-details
```
- **Layout**: 
  - Top margin: 15px for separation
  - Dashed border top for visual break
  - Subtle purple background (5% opacity)
- **Styling**:
  - Border radius: 4px for modern appearance
  - Padding: 10px for content breathing room
- **Purpose**: Displays detailed information about calculation payloads

### 3. Sensitivity Step Visualization
```css
.calculation-monitor .sensitivity-step
```
- **Background**: Light purple (10% opacity)
- **Border**: Left accent border (3px) in theme purple
- **Spacing**: 8px padding, 10px top margin
- **Function**: Individual step tracking in multi-step sensitivity analysis

### 4. Progress Tracking System

#### Progress Container
```css
.calculation-monitor .sensitivity-progress-container
```
- **Spacing**: 12px vertical margin
- **Purpose**: Houses progress bar and labels

#### Progress Label
```css
.calculation-monitor .sensitivity-progress-label
```
- **Layout**: Flexbox with space-between
- **Typography**: 12px font size
- **Color**: Mid-gray (#555)
- **Function**: Shows progress text and percentage

#### Progress Bar
```css
.calculation-monitor .sensitivity-progress-bar
.calculation-monitor .sensitivity-progress-bar-fill
```
- **Bar Container**:
  - Height: 8px
  - Background: Light gray (#e0e0e0)
  - Border radius: 4px
  - Overflow: hidden for clean fill animation
- **Fill Bar**:
  - Background: Theme purple (#9C27B0)
  - Transition: Smooth width animation (0.3s)

### 5. Parameter List Display
```css
.calculation-monitor .parameter-list
.calculation-monitor .parameter-item
```
- **List Styling**:
  - Top margin: 10px
  - Font size: 12px for dense information
- **Item Styling**:
  - Vertical padding: 4px
  - Dotted bottom border
  - Last item border removed

## Dark Theme Support

### Enhanced Visibility Adjustments
The dark theme overrides maintain visual hierarchy while ensuring readability:

1. **Payload Details**:
   - Background opacity reduced to 3%
   - Prevents overwhelming dark backgrounds

2. **Headings**:
   - Color changed to lighter purple (#CE93D8)
   - Maintains accent while improving contrast

3. **Sensitivity Steps**:
   - Background opacity reduced to 5%
   - Border color darkened (#7B1FA2)

4. **Progress Elements**:
   - Label color: Light gray (#aaa)
   - Progress bar background: Dark gray (#444)

5. **Borders**:
   - Parameter item borders use white with 10% opacity
   - Maintains visual separation without harshness

## Responsive Considerations
While no explicit media queries are defined, the component uses:
- Flexible spacing with margins
- Percentage-based backgrounds
- Relative font sizes

## Animation & Transitions
- Progress bar fill: 0.3s ease for smooth updates
- Container transitions: 0.3s ease for state changes

## Color Palette
| Element | Light Theme | Dark Theme | Purpose |
|---------|------------|------------|---------|
| Primary Accent | #9C27B0 | #CE93D8 | Sensitivity indicator |
| Secondary Accent | #9C27B0 | #7B1FA2 | Borders and emphasis |
| Background | rgba(156, 39, 176, 0.05-0.1) | rgba(156, 39, 176, 0.03-0.05) | Subtle highlighting |
| Text | #555 | #aaa | Secondary information |
| Progress Bar | #e0e0e0 | #444 | Track background |

## Usage Context
This stylesheet is designed to work in conjunction with:
- CalculationMonitor.js component
- Real-time calculation status updates
- Multi-step sensitivity analysis workflows
- Progress tracking visualizations

## Best Practices
1. Maintain the purple color scheme for sensitivity-related elements
2. Use subtle opacity variations for layered information
3. Ensure dark theme maintains sufficient contrast
4. Keep animations smooth but not distracting
5. Use dotted borders for secondary visual separation

## Performance Notes
- Transitions are kept to 0.3s for responsiveness
- Opacity-based backgrounds are GPU-accelerated
- No complex selectors or expensive CSS operations