# DecarbonizationPathwayCard.js - Decarbonization Pathway Display Component

## Overview

`DecarbonizationPathwayCard.js` displays detailed information about decarbonization pathways in a visually rich card format. It supports multiple view modes (standard, comparison, carousel) and provides comprehensive metrics visualization for sustainability assessment.

## Architecture

### Core Features
- Multi-mode display (standard, comparison, carousel)
- Metrics visualization with progress bars
- Overall score gauge visualization
- Action buttons for import, compare, and save
- Responsive design for different contexts

### Component Modes
1. **Standard Mode**: Full feature display with all metrics
2. **Comparison Mode**: Streamlined for side-by-side comparison
3. **Carousel Mode**: Compact view for carousel display

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pathway` | Object | Required | Pathway data object |
| `metrics` | Object | `{}` | Calculated metrics for the pathway |
| `isComparison` | Boolean | `false` | Comparison view mode |
| `isInComparison` | Boolean | `false` | Whether pathway is selected for comparison |
| `onAddToComparison` | Function | - | Add to comparison callback |
| `onRemoveFromComparison` | Function | - | Remove from comparison callback |
| `onImport` | Function | - | Import pathway callback |
| `onAddToPersonal` | Function | - | Add to personal library callback |
| `isCarouselItem` | Boolean | `false` | Carousel display mode |

## Data Structure

### Pathway Object
```javascript
{
  name: string,
  description: string,
  category: string,
  isHardToDecarbonize: boolean,
  economics: {
    "Real Levelized Cost ($/kg H₂)": number
  },
  carbonIntensity: number,
  inputs: {
    "Water Total (gal)": number
  },
  readinessYear: number,
  maturityLevel: string
}
```

### Metrics Object
```javascript
{
  costEffectiveness: number,      // 0-100
  emissionReduction: number,      // 0-100
  waterEfficiency: number,        // 0-100
  implementationTimeframe: number, // 0-100
  overallScore: number           // 0-100
}
```

## Key Components

### 1. Header Section
```javascript
<div className="pathway-card-header">
  <div className="pathway-card-title">
    <h3>{pathway.name}</h3>
    {/* Badges for category and hard-to-decarbonize indicator */}
  </div>
</div>
```

Features:
- Pathway name display
- Category badge with color coding
- "Hard to Decarbonize" indicator
- Context-aware action buttons

### 2. Metrics Display

#### Cost Metric
- Icon: Dollar sign
- Value: Levelized cost per kg H₂
- Progress bar: Cost effectiveness score

#### Emissions Metric
- Icon: Leaf
- Value: Carbon intensity (kg CO₂e/kg H₂)
- Progress bar: Emission reduction score

#### Water Usage Metric
- Icon: Water drop
- Value: Water consumption (gal/kg H₂)
- Progress bar: Water efficiency score

#### Readiness Metric
- Icon: Clock
- Value: Implementation year
- Badge: Maturity level
- Progress bar: Implementation timeframe score

### 3. Overall Score Gauge

SVG-based gauge visualization:
```javascript
<svg viewBox="0 0 100 50" className="gauge">
  <path d="M10,50 A40,40 0 1,1 90,50" className="gauge-background"/>
  <path d="M10,50 A40,40 0 1,1 90,50" className="gauge-fill"
        strokeDasharray={`${0.8 * metrics.overallScore}, 100`}/>
</svg>
```

Features:
- Semi-circular gauge
- Dynamic fill based on score
- Centered score display
- 0-100 scale

### 4. Action Buttons

#### Standard Mode Actions
- **Import**: Primary action to import pathway
- **Compare/Remove**: Toggle comparison selection
- **Save**: Add to personal library

#### Comparison Mode Actions
- Compact button layout
- Icon-only display
- Tooltips for clarity

#### Carousel Mode Actions
- Footer-positioned buttons
- Simplified layout
- Focus on import and save

## Icons Used

Font Awesome icons for visual clarity:
- `faLeaf`: Environmental metrics
- `faIndustry`: Industrial indicators
- `faWater`: Water usage
- `faDollarSign`: Cost metrics
- `faClock`: Timeline/readiness
- `faPlus/faMinus`: Add/remove actions
- `faCheck`: Confirmation/import
- `faFolder`: Save to library

## CSS Classes

### Container Classes
- `.decarbonization-pathway-card`: Main container
- `.comparison-card`: Comparison mode modifier
- `.carousel-card`: Carousel mode modifier

### Section Classes
- `.pathway-card-header`: Header area
- `.pathway-card-description`: Description text
- `.pathway-metrics`: Metrics grid
- `.overall-score`: Score gauge section

### Metric Classes
- `.metric-card`: Individual metric container
- `.metric-icon`: Icon wrapper
- `.metric-content`: Value and progress
- `.metric-score-bar`: Progress bar container
- `.metric-score-fill`: Progress bar fill

## Visual Features

### Progress Bars
```javascript
<div className="metric-score-bar">
  <div 
    className="metric-score-fill" 
    style={{ width: `${formatScore(metrics.value)}%` }}
  />
</div>
```

### Badge Styling
- Category badges with color coding
- Maturity level indicators
- "Hard to Decarbonize" special badge

### Responsive Design
- Adapts to container width
- Conditional content display
- Mode-specific layouts

## Best Practices

1. **Data Validation**
   - Check for null pathway data
   - Provide fallback values ("N/A")
   - Format numeric values appropriately

2. **Performance**
   - Conditional rendering based on mode
   - Efficient score calculations
   - Minimal re-renders

3. **User Experience**
   - Clear visual hierarchy
   - Intuitive metric display
   - Accessible action buttons

## Integration

- Works with DecarbonizationLibrary component
- Supports PathwayComparisonChart integration
- Compatible with carousel components
- Integrates with personal library system

This component provides a comprehensive and visually appealing way to present decarbonization pathway information, making complex sustainability data accessible and actionable for users.