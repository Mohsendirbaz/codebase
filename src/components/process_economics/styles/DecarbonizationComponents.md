# DecarbonizationComponents.css Documentation

## Overview
This stylesheet defines the visual design system for decarbonization-related components in the process economics module. It focuses on pathway visualization, comparison charts, and timeline displays with a clean, modern aesthetic.

## Visual Design System

### Color Palette
The decarbonization components use a semantic color system for different pathway categories:

```css
/* Pathway Category Colors */
.renewable        { background-color: #10b981; }  /* Green - renewable energy */
.low-carbon       { background-color: #3b82f6; }  /* Blue - low carbon solutions */
.fossil           { background-color: #6b7280; }  /* Gray - fossil fuels */
.emerging         { background-color: #f59e0b; }  /* Amber - emerging technologies */
.hydrogen         { background-color: #8b5cf6; }  /* Purple - hydrogen technologies */
.carbon-capture   { background-color: #0891b2; }  /* Cyan - carbon capture */
.electrification  { background-color: #ec4899; }  /* Pink - electrification */
```

### Metric-Specific Colors
```css
.cost-metric      { background-color: #0891b2; }  /* Cyan - cost metrics */
.emissions-metric { background-color: #16a34a; }  /* Green - emissions */
.water-metric     { background-color: #3b82f6; }  /* Blue - water usage */
.readiness-metric { background-color: #f59e0b; }  /* Amber - technology readiness */
```

## Layout Patterns

### Main Container Structure
```css
.decarbonization-library {
  padding: 1.5rem;
  background-color: var(--gray-50);
  height: 100%;
  overflow-y: auto;
}
```
- Full height container with light background
- Scrollable content area
- Consistent padding for content spacing

### Panel Layout
```css
.decarbonization-pathway-panel {
  height: calc(100vh - 16rem);
  display: flex;
  flex-direction: column;
}
```
- Flexible panel system with header/content separation
- Dynamic height calculation for viewport adaptation
- Vertical stack layout for organized content flow

### Grid Systems

#### List View Grid
```css
.pathway-list-header,
.pathway-list-item {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 1fr 1.5fr;
  gap: 0.5rem;
}
```
- Responsive grid layout for tabular data
- Proportional column sizing for optimal content display
- Consistent gap spacing between columns

#### Metrics Grid
```css
.pathway-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}
```
- Two-column layout for metric cards
- Equal column distribution
- Generous gap for visual breathing room

## Component-Specific Styles

### Pathway Cards
```css
.decarbonization-pathway-card {
  background-color: white;
  border-radius: var(--border-radius);
  border: 1px solid var(--gray-200);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: all var(--transition-speed);
}
```
- Clean card design with subtle borders
- Flexible height to accommodate varying content
- Smooth transitions for interactive states

### Category Indicators
```css
.pathway-category-indicator {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
}
```
- Circular badge design for category identification
- Centered content with bold typography
- Compact size for inline usage

### Metric Cards
```css
.metric-card {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: var(--gray-50);
  border-radius: var(--border-radius);
  border: 1px solid var(--gray-200);
}
```
- Horizontal layout with icon and content
- Subtle background differentiation
- Consistent border treatment

## Responsive Design Approaches

### Breakpoint Strategy
The stylesheet implements a mobile-first responsive design with three main breakpoints:

#### Large Screens (> 1200px)
- Full grid layouts maintained
- All columns visible in list views

#### Medium Screens (992px - 1200px)
```css
@media (max-width: 1200px) {
  .comparison-charts {
    grid-template-columns: 1fr;
  }
  .pathway-metrics {
    grid-template-columns: 1fr;
  }
}
```
- Single column layouts for better readability
- Stacked metric cards

#### Tablets (768px - 992px)
```css
@media (max-width: 992px) {
  .pathway-list-header,
  .pathway-list-item {
    grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
  }
  .pathway-header-water,
  .pathway-item-water {
    display: none;
  }
}
```
- Reduced grid columns
- Hide less critical information (water metrics)

#### Mobile (< 768px)
```css
@media (max-width: 768px) {
  .pathway-list-header,
  .pathway-list-item {
    grid-template-columns: 2fr 1fr 1fr 1.5fr;
  }
}
```
- Further column reduction
- Priority on essential information

#### Small Mobile (< 576px)
```css
@media (max-width: 576px) {
  .pathway-list-header,
  .pathway-list-item {
    grid-template-columns: 2fr 1fr 1.5fr;
  }
}
```
- Minimal column display
- Focus on name, cost, and actions

## Animation and Transitions

### Standard Transitions
```css
transition: all var(--transition-speed);
transition: background-color var(--transition-speed);
```
- Consistent timing for all transitions
- Smooth state changes for better UX

### Progress Animations
```css
.chart-bar {
  transition: width 0.5s;
}
```
- Longer duration for chart animations
- Creates visual emphasis on data changes

## CSS Variables and Theming

### Core Variables Used
- `--gray-50` to `--gray-200`: Background and border colors
- `--border-radius`, `--border-radius-md`: Consistent corner rounding
- `--shadow`: Standard shadow effects
- `--transition-speed`: Animation timing

### Theme Integration
The component relies on CSS custom properties for theming, allowing easy customization through the parent theme system.

## Key Class Hierarchies

### Panel Hierarchy
```
.decarbonization-pathway-panel
  ├── .pathway-panel-header
  ├── .pathway-panel-content
  │   ├── .pathway-list-view
  │   │   ├── .pathway-list-header
  │   │   └── .pathway-list
  │   │       └── .pathway-list-item
  │   └── .decarbonization-pathway-card
  │       ├── .pathway-card-header
  │       └── .pathway-metrics
  │           └── .metric-card
```

### Timeline Component Structure
```
.decarbonization-timeline
  ├── .maturity-progress-bar
  │   └── .maturity-progress-fill
  └── .years-progress-bar
      └── .years-progress-fill
```

### Comparison Chart Structure
```
.pathway-comparison-chart
  └── .chart-bar-container
      └── .chart-bar-wrapper
          └── .chart-bar
```

## Special Features

### Hard-to-Decarbonize Indicator
```css
.chart-bar.hard-to-decarbonize {
  background-color: #e74c3c !important;
}
```
- Red color override for critical pathways
- Important flag ensures visibility

### Progress Bars
```css
.maturity-progress-bar,
.years-progress-bar {
  position: relative;
  height: 0.5rem;
  background-color: var(--gray-200);
  border-radius: 0.25rem;
  margin-top: 1.5rem;
}
```
- Thin progress indicators
- Rounded ends for modern appearance
- Consistent spacing from content above

## Best Practices

1. **Semantic Color Usage**: Colors are chosen based on meaning (green for renewable, gray for fossil)
2. **Responsive Hiding**: Less critical information is progressively hidden on smaller screens
3. **Flexible Layouts**: Grid and flexbox used appropriately for different layout needs
4. **Consistent Spacing**: Gap utilities and padding create visual rhythm
5. **Accessible Design**: Sufficient color contrast and clear visual hierarchies