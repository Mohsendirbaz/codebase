# MultiZoneSelector Component Documentation

## Overview
The `MultiZoneSelector` component is a sophisticated map-based interface for selecting and managing multiple geographic zones. It provides tools for drawing areas on a map, automatically generating zones within those areas, and downloading boundary files for different administrative levels.

## Key Features

### 1. **Interactive Map Drawing**
- Draw polygons, rectangles, or circles on an interactive map
- Automatic zone generation within drawn areas
- Support for multiple geometry types (square grid, circular, hexagonal)

### 2. **Zone Generation Options**
- **Area Units**: Square meters, square kilometers, acres, hectares
- **Geometry Types**: Square grid, round/circular, hexagonal grid
- **Auto-generation**: Automatically generate zones when area is selected
- **Customizable Naming**: Pattern-based zone naming with index placeholders

### 3. **Boundary Management**
- Detects intersecting administrative boundaries (country, state, county)
- Downloads boundary files in multiple formats (GeoJSON, Shapefile, TIF, country_sf)
- Options for 3D and elevation data inclusion

## Component Props

```javascript
{
  onZonesSelected: Function,      // Callback when zones are selected
  existingZones: Array,           // Array of existing zones
  boundaryOptions: {              // Options for boundary file downloads
    enableCountry: Boolean,       // Enable country boundary detection
    enableState: Boolean,         // Enable state boundary detection
    enableCounty: Boolean,        // Enable county boundary detection
    formats: Array<String>,       // Available download formats
    include3D: Boolean,           // Include 3D data in downloads
    includeElevation: Boolean     // Include elevation data
  }
}
```

## State Management

### Core State Variables
- `selectedArea`: Currently selected geographic area
- `selectedPolygon`: Polygon points of selected area
- `generatedZones`: Array of generated zones
- `boundaryLayers`: Detected administrative boundaries
- `zoneOptions`: Configuration for zone generation

### Zone Options Configuration
```javascript
{
  areaUnit: 'km2',              // Unit for area measurement
  geometry: 'square',           // Zone shape type
  size: 1,                      // Size in selected units
  autoGenerate: true,           // Auto-generate on selection
  maxZones: 50,                 // Maximum zones to generate
  namePattern: 'Zone-{i}'       // Naming pattern
}
```

## Key Functions

### `handleAreaSelected(e)`
Processes drawn shapes and triggers zone generation:
- Extracts geometry from drawn shape
- Calculates area using Turf.js
- Initiates zone generation if auto-generate is enabled
- Searches for intersecting boundaries

### `generateZones(geoJSON, totalArea, polygon)`
Creates zones within selected area based on geometry type:
- **Square Grid**: Creates rectangular grid cells
- **Circular**: Uses circle packing algorithm
- **Hexagonal**: Generates hexagonal tessellation

### `findIntersectingBoundaries(geoJSON)`
Identifies administrative boundaries that intersect with selected area:
- Makes API calls to GIS service
- Filters for intersecting boundaries only
- Updates boundary layers state

### `getBoundaryDownloadUrl(boundary, format, options)`
Generates download URLs for boundary files:
- Constructs URL with proper format and options
- Includes 3D and elevation parameters if requested

## UI Components

### Tab System
1. **Draw Area**: Map interface for drawing selection areas
2. **Generated Zones**: List of created zones with details
3. **Boundary Downloads**: Available boundary files for download

### Map Features
- OpenStreetMap tile layer
- Leaflet Draw controls for shape creation
- Visual representation of generated zones
- Interactive tooltips showing zone information

### Zone Display
- Zone name and type
- Coordinates (latitude/longitude)
- Area in selected units
- Visual differentiation by geometry type

## Technical Implementation

### Dependencies
- React with Hooks (useState, useRef, useEffect, useCallback)
- Leaflet and React-Leaflet for mapping
- Turf.js for geographic calculations
- Framer Motion for animations
- PropTypes for type checking

### Performance Optimizations
- Deferred zone generation to prevent UI blocking
- Memoized calculations for position and style updates
- Efficient event handling with proper cleanup

## Usage Example

```javascript
<MultiZoneSelector
  onZonesSelected={(zones) => console.log('Selected zones:', zones)}
  existingZones={[]}
  boundaryOptions={{
    enableCountry: true,
    enableState: true,
    enableCounty: true,
    formats: ['geojson', 'shapefile'],
    include3D: true,
    includeElevation: true
  }}
/>
```

## Styling
The component uses CSS classes with `multi-zone-` prefix for styling. Key classes include:
- `multi-zone-selector`: Main container
- `multi-zone-map-container`: Map wrapper
- `multi-zone-sidebar`: Options and controls panel
- `multi-zone-tooltip`: Information tooltips

## Integration Points
- Integrates with climate data services for boundary information
- Compatible with broader scaling and economic analysis systems
- Provides zone data for downstream processing and analysis