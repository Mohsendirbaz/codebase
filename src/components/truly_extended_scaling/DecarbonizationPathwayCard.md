# DecarbonizationPathwayCard Component Documentation

## Overview
`DecarbonizationPathwayCard.js` is a React component that displays comprehensive information about a single decarbonization pathway in a card format. It's designed to be used in both list views and comparison views, providing detailed metrics and scores for each pathway.

## Component Structure

### Props
- **pathway** (Object, required): Core pathway data
  - `id` (String): Unique identifier for the pathway
  - `name` (String): Pathway name 
  - `description` (String): Detailed description
  - `category` (String): Pathway category classification
  - `isHardToDecarbonize` (Boolean): Indicates hard-to-decarbonize sectors
  - `inputs` (Object): Input parameters including water usage
  - `economics` (Object): Economic data including levelized costs
  - `carbonIntensity` (Number): CO₂ emissions per unit
  - `maturityLevel` (String): Technology readiness level
  - `readinessYear` (Number): Expected implementation year

- **metrics** (Object): Performance metrics
  - `costEffectiveness` (Number): Cost performance score (0-100)
  - `emissionReduction` (Number): Emission reduction score (0-100)
  - `implementationTimeframe` (Number): Timeline score (0-100)
  - `waterEfficiency` (Number): Water usage efficiency score (0-100)
  - `overallScore` (Number): Combined overall score (0-100)

- **isComparison** (Boolean): Indicates if card is in comparison view
- **isInComparison** (Boolean): Whether pathway is selected for comparison
- **onAddToComparison** (Function): Callback for adding to comparison
- **onRemoveFromComparison** (Function): Callback for removing from comparison

## Key Features

### 1. Header Section
- Displays pathway name with category badge
- Shows "Hard to Decarbonize" indicator when applicable
- Comparison action buttons (Add/Remove)

### 2. Metrics Display
Four key metric cards:
- **Cost Metric**: Levelized cost in $/kg H₂
- **Emissions Metric**: Carbon intensity in kg CO₂e/kg H₂  
- **Water Usage Metric**: Water consumption in gal/kg H₂
- **Readiness Metric**: Implementation year with maturity level badge

Each metric includes:
- Icon representation
- Numerical value with units
- Progress bar showing relative score
- Color-coded visual indicators

### 3. Overall Score Gauge
- SVG-based circular gauge visualization
- Displays score out of 100
- Only shown in non-comparison views
- Uses arc paths for smooth rendering

## Styling Dependencies
Requires corresponding CSS file: `./styles/DecarbonizationPathwayCard.css`

## Icon Dependencies
Uses FontAwesome icons:
- `faLeaf` - Emissions indicator
- `faIndustry` - Hard-to-decarbonize indicator
- `faWater` - Water usage indicator
- `faDollarSign` - Cost indicator
- `faClock` - Readiness/timeline indicator
- `faPlus`/`faMinus` - Comparison actions
- `faCircleInfo` - Overall score indicator

## Conditional Rendering
- Comparison buttons adapt based on `isInComparison` state
- Overall score gauge only displays in full view (not comparison)
- Empty description field gracefully omitted
- Handles missing metric data with fallback values

## Data Processing
- `formatScore()` - Rounds metric scores to integers
- Safely accesses nested object properties with fallbacks
- Formats decimal values to appropriate precision

## Usage Example
```jsx
<DecarbonizationPathwayCard
  pathway={pathwayData}
  metrics={calculatedMetrics}
  isComparison={false}
  isInComparison={selectedPathways.includes(pathwayData.id)}
  onAddToComparison={() => handleAddToComparison(pathwayData.id)}
  onRemoveFromComparison={() => handleRemoveFromComparison(pathwayData.id)}
/>
```