# unified-tooltip-css.css Documentation

## Overview

The unified-tooltip-css.css file is an extensive, sophisticated tooltip system that provides a comprehensive solution for displaying contextual information across various data types. This highly modular system supports multiple tooltip variants including value tooltips, environmental data, geographic information, energy grid details, and risk assessments.

## Architecture Summary

### Core Architecture
```
.unified-tooltip-container (Wrapper)
└── .unified-tooltip (Main Tooltip)
    ├── Position Classes (.tooltip-top/.bottom/.left/.right)
    ├── .tooltip-header
    │   ├── h4 (Title)
    │   └── Badges (.confidence-badge/.compliance-badge/.status-indicator)
    ├── Content Sections (Multiple Variants)
    │   ├── .tooltip-value-section
    │   ├── .tooltip-metadata
    │   ├── .tooltip-description
    │   ├── .tooltip-benchmarks
    │   ├── .tooltip-alternatives
    │   ├── .tooltip-decarbonization
    │   ├── .tooltip-coordinates
    │   ├── .tooltip-risks
    │   ├── .tooltip-climate-projections
    │   ├── .tooltip-energy-grid
    │   └── .tooltip-generic-content
    └── :after (Directional Arrow)
```

### Tooltip Variants

1. **Base Tooltip** - Standard information display
2. **Value Tooltip** - Numerical data with comparisons
3. **Geographic Tooltip** - Location-based information
4. **Environmental Tooltip** - Climate and risk data
5. **Energy Grid Tooltip** - Power generation details
6. **Generic Tooltip** - Simplified content display

## Visual Design Patterns

### Core Styling Foundation

#### Base Tooltip Design
```css
Background: #fff (white)
Border-radius: 6px
Box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15)
Padding: 12px
Z-index: 9999 (highest layer)
```

#### Typography System
- **Primary Text**: 14px, #333
- **Headers**: 
  - h4: 15px, 600 weight
  - h5: 13px, 600 weight
- **Secondary Text**: 12px, #666
- **Small Text**: 11px for labels and notes

### Positioning System

#### Directional Arrows
The tooltip uses CSS pseudo-elements for directional indicators:

```css
Arrow Dimensions: 8px × 8px triangle
Colors: Matches tooltip background (#fff)
Positioning: Centered on respective edge
```

**Four Position Variants:**
1. **Top**: Arrow points down from bottom edge
2. **Bottom**: Arrow points up from top edge
3. **Left**: Arrow points right from right edge
4. **Right**: Arrow points left from left edge

### Badge & Status System

#### Badge Types
1. **Confidence Badges**
   - High: Green (#e6f7e6 bg, #2e7d32 text)
   - Medium: Amber (#fff8e1 bg, #ff8f00 text)
   - Low: Red (#fce4ec bg, #d32f2f text)

2. **Compliance Badges**
   - Compliant: Green scheme
   - Warning: Amber scheme
   - Non-compliant: Red scheme

3. **Asset Type Badges**
   - Standard: Blue (#e3f2fd bg, #1976d2 text)
   - Hard-to-decarbonize: Purple (#f3e5f5 bg, #7b1fa2 text)

#### Badge Styling
```css
Padding: 2px 8px
Border-radius: 12px
Font-size: 11px
Font-weight: 600
Text-transform: uppercase
```

## Component-Specific Sections

### Value Section
Primary numerical display area:
```css
.tooltip-value-section {
  background: #f9f9f9
  border-radius: 4px
  padding: 8px
  Primary value: 16px, bold
}
```

### Benchmark Visualization
Complex benchmark comparison system:

#### Visual Bar Component
```css
.tooltip-benchmark-bar {
  height: 6px
  background: #eee
  Position indicators:
    - Current (Blue #2196f3)
    - Best Practice (Green #4caf50)
    - Average (Orange #ff9800)
    - Innovation (Purple #9c27b0)
}
```

#### Indicator Styling
- 8px circular indicators
- Positioned with transform for centering
- Z-index layering for overlap handling

### Metadata Rows
Consistent key-value pair display:
```css
.metadata-row {
  flex layout
  Label: 38% width, #666 color
  Value: 62% width, 500 weight
  Font-size: 12px
}
```

### Risk Assessment Display

#### Risk Grid System
```css
.risks-grid {
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 8px
}
```

#### Risk Indicators
Three-tier risk visualization:
1. **High Risk**
   - Background: #ffebee
   - Border: #ffcdd2
   - Text: #d32f2f

2. **Medium Risk**
   - Background: #fff8e1
   - Border: #ffe082
   - Text: #ff8f00

3. **Low Risk**
   - Background: #e8f5e9
   - Border: #c8e6c9
   - Text: #2e7d32

### Energy Grid Visualization

#### Carbon Intensity Scale
```css
.scale-bar {
  height: 6px
  background: linear-gradient(to right, #4caf50, #ffeb3b, #f44336)
  Visual representation from clean to dirty energy
}
```

#### Energy Source Bars
Color-coded energy type visualization:
- Coal: #616161 (dark gray)
- Natural Gas: #ff9800 (orange)
- Nuclear: #7b1fa2 (purple)
- Hydro: #2196f3 (blue)
- Solar: #fdd835 (yellow)
- Wind: #4caf50 (green)
- Biomass: #8d6e63 (brown)
- Geothermal: #f44336 (red)

### Geographic Information

#### Coordinate Display
```css
.tooltip-coordinates {
  background: #f5f5f5
  border-radius: 4px
  padding: 8px
}
```

#### Location Metadata Grid
```css
.location-metadata {
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 6px
  font-size: 12px
}
```

### Decarbonization Pathway

#### Visual Timeline
```css
.pathway-visualization {
  flex layout
  .pathway-point: centered text
  .pathway-line: 2px gray connector
  Shows progression over time
}
```

## Advanced Features

### Scrollable Content
```css
.alternatives-list {
  max-height: 150px
  overflow-y: auto
}

.tooltip-risks-detailed {
  max-height: 200px
  overflow-y: auto
}
```

### Compliance Status Details
Three-state compliance visualization:
```css
.compliant: Green left border (#4caf50)
.warning: Orange left border (#ff9800)
.non-compliant: Red left border (#f44336)
Background colors complement border colors
```

### Alternative Options Display
```css
.alternative-item {
  background: #f5f5f5
  border-radius: 4px
  padding: 8px
  Includes name, intensity, and details
}
```

## Responsive Behavior

While not explicitly defined in media queries, the tooltip system is designed for flexibility:
- **Fixed maximum widths** prevent overflow
- **Scrollable sections** for long content
- **Flexible grid layouts** adapt to content
- **Z-index management** ensures visibility

## Visual Hierarchy

1. **Primary**: Headers and primary values (largest, bold)
2. **Secondary**: Badges and key metrics (colored, emphasized)
3. **Tertiary**: Metadata and descriptions (standard size)
4. **Quaternary**: Notes and supplementary info (smallest, muted)

## Performance Considerations

- **Single shadow layer** for depth (avoiding multiple shadows)
- **Simple color fills** over complex gradients (except scale bars)
- **Overflow handling** prevents layout breaking
- **Fixed positioning calculations** minimize reflow

## Accessibility Features

- **High contrast ratios** between text and backgrounds
- **Color not sole indicator** (text labels accompany all states)
- **Sufficient padding** for touch targets
- **Clear visual hierarchy** guides reading order

## Integration Notes

This tooltip system integrates with:
- **Position calculation engines** for smart placement
- **Data visualization components** for contextual display
- **Theme systems** through CSS variables
- **State management** for dynamic content
- **Responsive frameworks** for adaptive behavior

## Usage Patterns

The unified tooltip supports multiple use cases:
1. **Hover information** for data points
2. **Click-triggered details** for complex data
3. **Contextual help** for UI elements
4. **Progressive disclosure** of information layers
5. **Comparison displays** for benchmarking