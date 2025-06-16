# DecarbonizationTargetTimeline Component Documentation

## Overview
The `DecarbonizationTargetTimeline` is a visualization component that displays the technology maturity level and commercial readiness timeline for decarbonization pathways. It provides an intuitive visual representation of where a technology stands in its development cycle and when it's expected to be commercially viable.

## Purpose
- Visualize technology maturity levels from research to mature stages
- Display commercial readiness timeline with key milestone years
- Show progress towards 2030 and 2050 climate targets
- Provide clear visual indicators for past, present, and future milestones

## Key Features

### 1. Maturity Level Visualization
- Progress bar showing current maturity stage
- Six defined maturity levels with visual markers
- Active state highlighting for current level
- Percentage-based progress calculation

### 2. Timeline Visualization
- Year-based progress bar from 2020 to 2050
- Key milestone markers at 5-year intervals
- Visual distinction between past and future years
- Active indicator for readiness year

### 3. Climate Target Indicators
- 2030 target marker (30% emissions reduction)
- 2050 target marker (Net Zero Emissions)
- Visual connection to global climate goals

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `maturityLevel` | `String` | No | Current maturity level of the technology |
| `readinessYear` | `Number` | No | Year when technology will be commercially ready |

## Maturity Levels

The component recognizes six maturity levels in order:

1. **research** - Early research phase
2. **pilot** - Small-scale pilot testing
3. **demonstration** - Larger demonstration projects
4. **early-commercial** - Initial commercial deployment
5. **commercial** - Full commercial availability
6. **mature** - Mature, widely deployed technology

## Component Structure

### 1. Maturity Section
```javascript
<div className="timeline-maturity">
  <div className="maturity-label">
    Technology Maturity: <span className={`maturity-value ${maturityLevel}`}>
      {maturityLevel}
    </span>
  </div>
  <div className="maturity-progress-bar">
    {/* Progress bar and markers */}
  </div>
</div>
```

### 2. Timeline Section
```javascript
<div className="timeline-years">
  <div className="years-label">
    Commercial Readiness: <span className="year-value">{readinessYear}</span>
  </div>
  <div className="years-progress-bar">
    {/* Year markers and progress */}
  </div>
</div>
```

### 3. Climate Targets Section
```javascript
<div className="timeline-targets">
  <div className="target-marker" style={{ left: '33%' }}>
    <div className="target-label">2030 Target</div>
    <div className="target-description">30% emissions reduction</div>
  </div>
  {/* 2050 target marker */}
</div>
```

## Progress Calculations

### Maturity Progress
```javascript
const maturityIndex = maturityLevels.indexOf(maturityLevel);
const progress = maturityIndex >= 0 
  ? (maturityIndex / (maturityLevels.length - 1)) * 100 
  : 0;
```

### Timeline Progress
```javascript
// Progress from 2020 to 2050 (30-year span)
width: `${Math.max(0, Math.min(100, ((readinessYear - 2020) / 30) * 100))}%`
```

## Styling
Component uses dedicated CSS: `./styles/DecarbonizationTargetTimeline.css`

Key style classes:
- `.decarbonization-timeline`: Main container
- `.maturity-progress-bar`: Maturity level progress bar
- `.maturity-marker`: Individual maturity level markers
- `.year-marker`: Timeline year markers
- `.target-marker`: Climate target indicators
- `.past` / `.future`: Visual distinction for timeline periods

## Visual States

### Maturity Markers
- Normal state: Gray/neutral
- Active state: Highlighted with color
- Includes dot indicator and label

### Year Markers
- Past years: Dimmed appearance
- Current year vicinity: Normal appearance
- Future years: Slightly emphasized
- Active readiness year: Highlighted

### Target Markers
- Fixed position at 33% (2030) and 83% (2050)
- Includes vertical line and description
- Always visible for context

## Usage Examples

### Basic Usage
```javascript
<DecarbonizationTargetTimeline 
  maturityLevel="demonstration"
  readinessYear={2027}
/>
```

### In Context (Detail View)
```javascript
<div className="pathway-details">
  <h3>Implementation Timeline</h3>
  <DecarbonizationTargetTimeline 
    maturityLevel={pathway.maturityLevel}
    readinessYear={pathway.readinessYear}
  />
</div>
```

### With Conditional Rendering
```javascript
{pathway.maturityLevel && (
  <DecarbonizationTargetTimeline 
    maturityLevel={pathway.maturityLevel}
    readinessYear={pathway.readinessYear}
  />
)}
```

## Responsive Design
The component uses percentage-based positioning for all markers, ensuring proper scaling across different screen sizes. The timeline adapts to container width while maintaining relative positions.

## Accessibility Features
- Clear text labels for all visual elements
- Semantic HTML structure
- Color not used as sole indicator (includes text labels)
- Proper contrast ratios for readability

## Integration with Parent Components
Typically used within:
- `DecarbonizationPathwayPanel` (detail view)
- `DecarbonizationPathwayCard` (expanded view)
- Any pathway analysis component

## Performance Considerations
- Pure functional component with no internal state
- Minimal re-renders (only on prop changes)
- Efficient CSS-based animations
- No external dependencies beyond React

## Customization Options

While the component doesn't expose these as props, it can be extended to support:
1. Custom year ranges
2. Different target milestones
3. Alternative maturity level definitions
4. Color theming through CSS variables
5. Animation controls

## Future Enhancements

1. **Interactive Features**
   - Hover tooltips with additional information
   - Click handlers for timeline elements
   - Zoom functionality for detailed view

2. **Data Visualization**
   - Show uncertainty ranges for readiness year
   - Display confidence levels for projections
   - Add trend lines for technology adoption

3. **Customization**
   - Configurable milestone years
   - Custom maturity level definitions
   - Theme support for different industries

4. **Integration**
   - Connect to real-time project tracking
   - Show related technologies on timeline
   - Link to detailed project information