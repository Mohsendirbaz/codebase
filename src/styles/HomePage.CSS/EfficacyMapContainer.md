# EfficacyMapContainer.css Documentation

## Overview
The EfficacyMapContainer.css file defines styling for a comprehensive efficacy mapping interface component. This sophisticated module handles capacity visualization, configuration space display, and interactive overlay panels with responsive design considerations.

## Architecture Summary

### Component Hierarchy
```
.efficacy-map-container
├── .map-header
│   ├── h2 (title)
│   └── .map-description
├── .capacity-summary
│   ├── h3 (with .capacity-button)
│   └── .capacity-items
│       └── .capacity-item
│           ├── .capacity-label
│           ├── .capacity-value
│           └── .capacity-bar
│               └── .capacity-fill
├── .configuration-space-info
│   ├── .configuration-formula
│   └── .total-space
├── .map-content
├── .exclusion-note
│   ├── h4
│   ├── p
│   └── ul > li
└── Overlay Panels
    ├── .conflict-panel-overlay
    └── .capacity-panel-overlay
```

## Visual Design Patterns

### Container Architecture
The main container employs a neumorphic design pattern:
- **Background**: Uses CSS variable `--card-background`
- **Border Radius**: Large radius via `--neu-border-radius-lg`
- **Shadow**: Medium depth shadow `--neu-shadow-md`
- **Spacing**: Generous 24px padding with bottom margin

### Layout Systems

#### Grid-Based Capacity Display
```css
.capacity-items {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
```
- Flexible grid system for capacity metrics
- Minimum item width of 200px
- Responsive wrapping behavior
- Consistent 16px gap between items

#### Hierarchical Information Structure
1. **Primary Level**: Map header with title and description
2. **Secondary Level**: Capacity summary with interactive elements
3. **Tertiary Level**: Individual capacity items with visual indicators
4. **Supporting Level**: Configuration info and exclusion notes

### Visual Components

#### Capacity Visualization System
Each capacity item features:
- **Label**: Font-weight 500 for emphasis
- **Value**: Large font size (`--model-font-size-lg`), bold weight
- **Progress Bar**: 
  - Height: 8px
  - Background: Border color for contrast
  - Fill: Animated width transitions (0.3s ease)
  - Rounded corners (4px)

#### Interactive Elements

##### Capacity Button
```css
.capacity-button {
  background-color: #4caf50;  /* Material green */
  color: white;
  padding: 8px 12px;
  transition: background-color on hover
}
```
- Clear action color (green)
- Hover state: Darker shade (#45a049)
- Compact padding for inline placement

##### Overlay Panels
- **Positioning**: Fixed, full-screen coverage
- **Background**: Semi-transparent black (rgba(0, 0, 0, 0.5))
- **Layout**: Flexbox centered content
- **Animation**: fadeIn effect (0.3s ease)
- **Z-index**: 1000 for proper stacking

### Color Scheme and Visual Hierarchy

#### Primary Colors
```css
Configuration Space: #e8f5e9 (light green background)
Information Blocks: #f8f9fa (light gray)
Emphasis: #e91e63 (pink for total space)
Action: #4caf50 (green for buttons)
Information: #2196f3 (blue for notes)
```

#### Typography System
- **Headers**: Variable sizes using CSS custom properties
- **Body Text**: Secondary color for descriptions
- **Code/Formula**: Monospace font (Courier New)
- **Emphasis**: Bold weight for important values

### Special Features

#### Configuration Space Display
- Light green background for visibility
- Monospace font for formula display
- Pink highlighting for total space value
- 1.1em size increase for emphasis

#### Exclusion Note Design
- Blue accent system (#2196f3)
- Left border (4px) for visual weight
- Light blue background (10% opacity)
- Structured content with headers and lists

### Responsive Design Strategy

#### Mobile Breakpoint (max-width: 768px)
1. **Container Adjustments**
   - Reduced padding (16px from 24px)
   
2. **Layout Changes**
   - Capacity items: Switch to column layout
   - Items: Full width (100% min-width)
   
3. **Overlay Modifications**
   - Reduced padding (10px from 20px)
   
4. **Header Adaptations**
   - Flex direction changes to column
   - Button moves below text with 8px margin

### Animation and Transitions

#### Performance-Optimized Animations
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```
- Simple opacity animation for overlays
- Hardware-accelerated transforms
- Smooth transitions on capacity bars

### CSS Variables Integration
The file extensively uses CSS custom properties for theming:
- `--card-background`: Base background color
- `--neu-border-radius-lg/md`: Consistent border radius
- `--neu-shadow-md/sm`: Shadow depth variations
- `--text-color/--text-secondary`: Typography colors
- `--border-color`: Consistent border styling
- `--model-font-size-*`: Typography scale

## Accessibility Considerations
- High contrast between text and backgrounds
- Clear visual hierarchy through size and weight
- Interactive elements with visible hover states
- Sufficient tap targets for mobile devices

## Performance Features
- Efficient flexbox layouts
- Minimal paint operations with transform animations
- Optimized selector specificity
- Responsive images through proper containment