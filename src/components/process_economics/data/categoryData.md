# categoryData.js - Process Economics Category Definitions

## Overview

`categoryData.js` provides comprehensive category definitions for the Process Economics Library system. It includes category lists, groupings, color mappings, and icon associations for both general process economics and specialized decarbonization pathways.

## Architecture

### Data Exports
1. **Category Lists**: Complete enumeration of all categories
2. **Category Groups**: Domain-based organization
3. **Visual Mappings**: Colors and icons for each category
4. **Decarbonization Specialization**: Separate category system for sustainability

## Core Data Structures

### 1. Categories Array
```javascript
export const categories = [
  'Capital Cost Estimation',
  'Operating Cost Models',
  // ... 40+ categories
]
```

**Total Categories**: 41 main categories covering all aspects of process economics

### 2. Category Groups
Organized into 7 main domains:

#### Cost Management
- Capital Cost Estimation
- Operating Cost Models
- Economic Analysis
- ROI Models
- Life Cycle Assessment

#### Process Engineering
- Equipment Sizing
- Material Balance
- Heat Balance
- Process Optimization
- Scale-up Models

#### Production Management
- Production Planning
- Capacity Planning
- Batch/Continuous Processing
- Inventory Management
- Supply Chain

#### Sustainability
- Energy Efficiency
- Carbon Footprint
- Waste Management
- Decarbonization Pathways
- Carbon Capture/Reduction

#### Project Lifecycle
- Conceptual Design
- FEED Models
- Detailed Engineering
- Project Management
- Commissioning

#### Operations
- Maintenance Planning
- Shutdown Planning
- Turnaround Models
- Utility Systems
- Retrofit Analysis

#### Analysis
- Sensitivity Analysis
- Risk Assessment
- Quality Control
- Regulatory Compliance

### 3. Color System

#### Color Palette
```javascript
{
  blue: '#3b82f6',    // Financial/Design
  green: '#10b981',   // Sustainability
  purple: '#8b5cf6',  // Process/Production
  amber: '#f59e0b',   // Analysis/Maintenance
  red: '#ef4444',     // Engineering/Equipment
  pink: '#ec4899',    // Management/Supply
  cyan: '#0891b2',    // Carbon Capture
  gray: '#6b7280'     // Default/Fossil
}
```

#### Color Assignment Logic
- **Blue**: Financial analysis, design phases
- **Green**: Environmental, sustainability topics
- **Purple**: Production and process-related
- **Amber**: Analysis and maintenance
- **Red**: Engineering and equipment
- **Pink**: Management and logistics
- **Cyan**: Specialized technologies

### 4. Icon Mappings

Maps categories to Heroicons components:
```javascript
export const categoryIcons = {
  'Capital Cost Estimation': 'CurrencyDollarIcon',
  'Energy Efficiency': 'BoltIcon',
  'Carbon Footprint': 'CloudIcon',
  // ... full icon mapping
}
```

## Decarbonization Categories

### Specialized Categories
```javascript
export const decarbonizationCategories = [
  'renewable',      // Solar, wind, hydro
  'low-carbon',     // Nuclear, CCS-enabled
  'fossil',         // Traditional fossil fuels
  'emerging',       // Novel technologies
  'hydrogen',       // H2 production methods
  'carbon-capture', // CCS/CCUS technologies
  'electrification' // Electric alternatives
]
```

### Decarbonization Colors
```javascript
{
  'renewable': '#10b981',     // Green (environmental)
  'low-carbon': '#3b82f6',    // Blue (clean tech)
  'fossil': '#6b7280',        // Gray (traditional)
  'emerging': '#f59e0b',      // Amber (innovation)
  'hydrogen': '#8b5cf6',      // Purple (future fuel)
  'carbon-capture': '#0891b2', // Cyan (technology)
  'electrification': '#ec4899' // Pink (transformation)
}
```

### Decarbonization Icons
```javascript
{
  'renewable': 'LeafIcon',
  'low-carbon': 'CloudIcon',
  'fossil': 'FireIcon',
  'emerging': 'SparklesIcon',
  'hydrogen': 'BeakerIcon',
  'carbon-capture': 'FilterIcon',
  'electrification': 'BoltIcon'
}
```

## Usage Patterns

### 1. Category Selection
```javascript
import { categories } from './categoryData';
// Use in dropdown or filter components
```

### 2. Color Application
```javascript
import { categoryColors } from './categoryData';
const color = categoryColors[category] || '#6b7280';
```

### 3. Icon Display
```javascript
import { categoryIcons } from './categoryData';
const iconName = categoryIcons[category];
// Map to actual icon component
```

### 4. Grouped Navigation
```javascript
import { categoryGroups } from './categoryData';
// Create grouped menu structure
```

## Best Practices

1. **Consistency**
   - Use predefined categories throughout the system
   - Apply consistent color coding
   - Maintain icon associations

2. **Extensibility**
   - Add new categories to appropriate groups
   - Assign meaningful colors
   - Choose representative icons

3. **Performance**
   - Import only needed exports
   - Cache color/icon lookups
   - Use constants for frequent access

## Integration Points

- Used by CategorySelector component
- Referenced in ItemCard for category display
- Applied in filtering and search functions
- Supports visual consistency across UI

## Future Enhancements

1. **Dynamic Categories**
   - User-defined categories
   - Custom color schemes
   - Configurable groupings

2. **Localization**
   - Multi-language category names
   - Regional category preferences
   - Cultural color associations

3. **Analytics Integration**
   - Category usage tracking
   - Popular category identification
   - Trend analysis

This module provides the foundational categorization system for organizing and visualizing process economics configurations, ensuring consistent user experience and efficient information architecture.