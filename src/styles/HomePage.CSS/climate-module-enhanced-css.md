# climate-module-enhanced-css.css Documentation

## Overview
This comprehensive stylesheet powers the enhanced climate module interface, featuring zone generation controls and cluster analysis capabilities. It provides a sophisticated two-panel layout with extensive customization options for climate-based zone management.

## Component Architecture
The styles create a dual-panel system for:
1. Zone Generation (grid-based and custom zones)
2. Cluster Analysis (data-driven zone clustering)

## Main Container
```css
.climate-module-enhanced
```
- **Design**: Clean white background with subtle borders
- **Border**: 1px solid #ddd for definition
- **Border radius**: 8px for modern appearance
- **Overflow**: Hidden for clean edges
- **Spacing**: 20px bottom margin for section separation

## Panel Layout System

### Enhanced Panels Container
```css
.climate-module-enhanced-panels
```
- **Layout**: CSS Grid with 2 equal columns
- **Gap**: 20px for visual breathing room
- **Background**: Light gray (#f5f5f5) for contrast
- **Borders**: Top and bottom for section definition
- **Padding**: 20px for content spacing

## Zone Generation Panel

### Panel Structure
```css
.climate-module-zone-panel,
.climate-module-cluster-panel
```
- **Appearance**: White background for content focus
- **Border**: 1px solid #e0e0e0 for subtle definition
- **Border radius**: 8px for consistency
- **Overflow**: Hidden for clean internal edges

### Panel Headers
```css
.zone-panel-header,
.cluster-panel-header
```
- **Layout**: Flexbox with space-between alignment
- **Background**: Subtle gray (#f9f9f9)
- **Border**: Bottom border for content separation
- **Padding**: 12px 16px for comfortable spacing
- **Typography**: 16px, 600 weight headings

### Mode Selection
```css
.zone-panel-modes,
.zone-panel-mode
```
- **Button Styling**:
  - Default: Transparent with gray border
  - Active: Green background (#4caf50) with white text
  - Padding: 6px 12px for click targets
  - Transition: 0.2s for smooth state changes
- **Layout**: Right-aligned with 8px spacing

### Zone Configuration Controls

#### Grid Options Layout
```css
.zone-grid-options,
.zone-grid-options-group
```
- **Structure**: Vertical flex with 16px gaps
- **Labels**: 500 weight, 14px size
- **Organization**: Logical grouping of related controls

#### Input Groups
```css
.grid-size-inputs,
.zone-size-inputs,
.grid-size-input,
.zone-size-input
```
- **Layout**: Horizontal flex with 12px gaps
- **Inputs**: 
  - 8px padding for comfort
  - Gray borders (#ddd)
  - 4px border radius
  - 14px font size
- **Labels**: Small (12px), gray (#666) for hierarchy

#### Shape Selection
```css
.zone-shape-options,
.zone-shape-option
```
- **Layout**: Equal distribution with flexbox
- **Interaction**:
  - Hover: Light gray background
  - Cursor: Pointer for clickability
  - Transition: Smooth background changes
- **Design**: Bordered containers with centered content

#### Shape Icons
```css
.shape-icon,
.shape-icon.square,
.shape-icon.hexagon,
.shape-icon.circle
```
- **Dimensions**: 24x24px visual indicators
- **Styles**:
  - Square: Green (#4caf50) with slight radius
  - Hexagon: Blue (#2196f3) with clip-path
  - Circle: Orange (#ff9800) fully rounded
- **Purpose**: Visual representation of zone shapes

### Action Buttons

#### Generate Zones Button
```css
.generate-zones-btn
```
- **Styling**: Green (#4caf50) with white text
- **Hover**: Darker green (#388e3c)
- **Padding**: 10px 16px for comfortable clicking
- **Typography**: 14px, 500 weight

#### Multi-Zone Navigation
```css
.go-to-multi-zone-btn
```
- **Styling**: Blue (#2196f3) with white text
- **Hover**: Darker blue (#1976d2)
- **Purpose**: Navigation to advanced zone editor

## Cluster Analysis Panel

### Toggle Switch
```css
.cluster-toggle-label,
.cluster-toggle-slider
```
- **Switch Design**:
  - 40x20px track with 10px radius
  - 16x16px white slider dot
  - Smooth 0.4s transitions
- **States**:
  - Off: Gray (#ccc) background
  - On: Green (#4caf50) background
  - Slider translation: 20px when active

### Cluster Options
```css
.cluster-options,
.cluster-option-group
```
- **Layout**: 2-column grid with 16px gaps
- **Controls**: Consistent with zone panel styling
- **Action Buttons**: Span full width (2 columns)

### Analysis Results
```css
.cluster-results,
.cluster-visualization
```
- **Results Container**:
  - Gray background (#f5f5f5)
  - 6px border radius
  - 16px padding and top margin
- **Visualization Box**:
  - White background for contrast
  - Subtle border (#eee)
  - Internal padding for content

### Disabled State
```css
.cluster-disabled,
.enable-cluster-btn
```
- **Content**: Centered text with left-aligned lists
- **Button**: Green CTA matching generate button style
- **Typography**: Gray (#666) for disabled state

## Responsive Design

### Mobile Breakpoint (≤768px)
```css
@media (max-width: 768px)
```
- **Panel Layout**: Single column stack
- **Cluster Options**: Single column
- **Shape Options**: Vertical stack
- **Action Buttons**: Full width

## Design System

### Color Palette
| Element | Color | Usage |
|---------|-------|-------|
| Primary Action | #4caf50 | Generate, Enable buttons |
| Secondary Action | #2196f3 | Navigation, Analysis |
| Hover States | #388e3c, #1976d2 | Darker variants |
| Backgrounds | #f5f5f5, #f9f9f9 | Section differentiation |
| Borders | #ddd, #e0e0e0, #eee | Hierarchy levels |
| Text | #333, #666 | Primary and secondary |

### Spacing System
- Small: 4px (input labels)
- Medium: 8px (general padding)
- Large: 16px (section spacing)
- Extra Large: 20px (panel gaps)

### Border System
- Standard: 1px solid for definition
- Radius: 4px (inputs), 6px (results), 8px (panels)
- Hierarchy through color intensity

## Interactive Elements

### State Transitions
- Buttons: 0.2s ease for responsiveness
- Toggle: 0.4s for smooth sliding
- Hover effects: Background color changes

### Visual Feedback
- Active states with color changes
- Hover states for all interactive elements
- Clear disabled states with reduced opacity

## Usage Guidelines

### Implementation Flow
1. User selects zone generation mode
2. Configures grid or navigates to custom
3. Enables cluster analysis if needed
4. Runs analysis and views results

### Best Practices
1. Maintain consistent spacing throughout
2. Use established color palette
3. Ensure all interactive elements have hover states
4. Keep transitions smooth but quick
5. Preserve visual hierarchy with borders and backgrounds

## Performance Considerations
- Efficient grid layouts over complex positioning
- Simple transitions without heavy animations
- Minimal use of shadows for performance
- Clip-path only for hexagon icon (small element)

## Accessibility Features
- Clear visual states for all controls
- Sufficient color contrast ratios
- Logical tab order through flexbox/grid
- Descriptive class names for screen readers
- Focus states inherited from native elements