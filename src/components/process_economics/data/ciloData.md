# CILO Data Module Documentation

## Overview

The `ciloData.js` module defines the data structures and schemas for CILO (Configuration Integrated Library Organizer) types used in the process economics system. CILO represents specialized configuration categories for industrial process equipment and systems.

## Data Structures

### CILO Types Enum

```javascript
export const ciloTypes = {
  FLUID_HANDLING: 'fluid-handling',
  THERMAL_SYSTEMS: 'thermal-systems',
  COLUMNS: 'columns',
  RENEWABLE_SYSTEMS: 'renewable-systems',
  POWER_GRID: 'power-grid'
};
```

**Purpose**: Provides standardized identifiers for different CILO categories to ensure consistency across the application.

### CILO Data Schema

Each CILO entry in the `ciloData` array follows this schema:

```javascript
{
  id: string,           // Unique identifier from ciloTypes
  name: string,         // Display name for the CILO category
  icon: Component,      // HeroIcon component for visual representation
  description: string,  // Detailed description of the CILO category
  categories: string[], // Subcategories within this CILO type
  tags: string[]        // Searchable keywords for this CILO type
}
```

## CILO Categories

### 1. Fluid Handling Systems
- **ID**: `fluid-handling`
- **Icon**: BeakerIcon
- **Subcategories**: Pumps, Pipes, Valves, Flow Control, Pressure Systems
- **Tags**: fluid, flow, hydraulic, pump, valve, pressure
- **Use Case**: Configurations for liquid and gas transport systems

### 2. Thermal Systems
- **ID**: `thermal-systems`
- **Icon**: FireIcon
- **Subcategories**: Heat Exchangers, Boilers, Thermal Storage, Cooling Systems, Insulation
- **Tags**: heat, thermal, temperature, exchanger, cooling, boiler
- **Use Case**: Temperature control and heat transfer equipment configurations

### 3. Columns
- **ID**: `columns`
- **Icon**: CubeTransparentIcon
- **Subcategories**: Distillation, Absorption, Extraction, Packed Columns, Tray Columns
- **Tags**: column, separation, distillation, extraction, absorption
- **Use Case**: Separation and purification process configurations

### 4. Renewable Systems
- **ID**: `renewable-systems`
- **Icon**: SunIcon
- **Subcategories**: Solar, Wind, Hydro, Biomass, Geothermal, Storage
- **Tags**: renewable, solar, wind, hydro, biomass, sustainable
- **Use Case**: Sustainable energy generation and storage system configurations

### 5. Power Grid
- **ID**: `power-grid`
- **Icon**: BoltIcon
- **Subcategories**: Transmission, Distribution, Control, Protection, Stability
- **Tags**: grid, power, electric, transmission, distribution, energy
- **Use Case**: Electrical power distribution and control system configurations

## Integration Patterns

### 1. Component Integration
```javascript
import { ciloData, ciloTypes } from './data/ciloData';

// Render CILO categories
ciloData.map(cilo => (
  <div key={cilo.id}>
    <cilo.icon className="w-5 h-5" />
    <span>{cilo.name}</span>
  </div>
));
```

### 2. Filtering by Type
```javascript
// Get specific CILO category
const thermalCilo = ciloData.find(c => c.id === ciloTypes.THERMAL_SYSTEMS);

// Filter by tag
const fluidRelated = ciloData.filter(c => 
  c.tags.includes('fluid') || c.tags.includes('flow')
);
```

### 3. Search Implementation
```javascript
// Search across all fields
const searchCilo = (query) => {
  const lowercaseQuery = query.toLowerCase();
  return ciloData.filter(cilo => 
    cilo.name.toLowerCase().includes(lowercaseQuery) ||
    cilo.description.toLowerCase().includes(lowercaseQuery) ||
    cilo.tags.some(tag => tag.includes(lowercaseQuery)) ||
    cilo.categories.some(cat => cat.toLowerCase().includes(lowercaseQuery))
  );
};
```

## Use Cases and Examples

### 1. CILO Explorer Component
Used in the CiloExplorer component to display categorized equipment configurations:
```javascript
{ciloData.map(cilo => (
  <CiloSection
    key={cilo.id}
    cilo={cilo}
    configurations={getConfigsForCilo(cilo.id)}
  />
))}
```

### 2. Configuration Categorization
When saving configurations, assign appropriate CILO type:
```javascript
const saveConfiguration = (config, ciloType) => {
  const enhancedConfig = {
    ...config,
    ciloType: ciloType,
    tags: [...config.tags, ...getCiloTags(ciloType)]
  };
  return libraryService.saveItem(enhancedConfig);
};
```

### 3. Navigation and Filtering
Use CILO types for navigation menu:
```javascript
const navigationItems = ciloData.map(cilo => ({
  id: cilo.id,
  label: cilo.name,
  icon: cilo.icon,
  count: getConfigurationCount(cilo.id)
}));
```

## Best Practices

1. **Consistency**: Always use `ciloTypes` enum instead of hardcoding strings
2. **Extensibility**: When adding new CILO types, ensure all required fields are populated
3. **Icons**: Use appropriate HeroIcons that visually represent the category
4. **Tags**: Include comprehensive tags for better searchability
5. **Categories**: Keep subcategories specific and industry-standard

## Related Modules

- `LibrarySystem.js` - Uses CILO data for organizing configurations
- `CiloExplorer.js` - Component that renders CILO categories
- `CategorySelector.js` - Allows users to filter by CILO type
- `libraryService.js` - Handles saving/retrieving configurations by CILO type