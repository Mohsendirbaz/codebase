# ClimateMapOverlay.js - Climate Impact Visualization Component

## Overview

`ClimateMapOverlay.js` is a sophisticated mapping component that provides interactive climate data visualization overlays on geographic maps. It displays carbon footprint impacts, regulatory compliance zones, and supports multi-zone selection using React Leaflet and Turf.js for geospatial operations.

## Architecture

### Core Features
- Interactive map with multiple overlay layers
- Climate impact visualization (heatmap, bubble, gradient)
- Regulatory compliance zone display
- Multi-zone selection and drawing
- Asset carbon footprint visualization
- Boundary data integration

### Dependencies
```javascript
import { MapContainer, TileLayer, FeatureGroup, Polygon, Circle, Tooltip, Rectangle } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
```

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `coordinates` | Object | - | Location coordinates (longitude, latitude) |
| `assets` | Array | `[]` | Assets with carbon intensity data |
| `carbonFootprints` | Object | `{}` | Carbon footprint data by location |
| `regulatoryThresholds` | Object | `{}` | Regulatory compliance thresholds |
| `complianceStatus` | Object | `{overall: 'compliant'}` | Current compliance status |
| `zones` | Array | `[]` | Geographic zones to display |
| `onAreaSelected` | Function | `() => {}` | Callback for area selection |
| `onZoneSelected` | Function | `() => {}` | Callback for zone selection |

## State Management

### Visualization Controls
```javascript
const [showClimateImpact, setShowClimateImpact] = useState(true);
const [showRegulatoryZones, setShowRegulatoryZones] = useState(true);
const [showZones, setShowZones] = useState(true);
const [showBoundaries, setShowBoundaries] = useState(false);
const [selectedVisualization, setSelectedVisualization] = useState('heatmap');
```

### Map State
```javascript
const [mapCenter, setMapCenter] = useState([latitude, longitude]);
const [mapZoom, setMapZoom] = useState(12);
const [selectedArea, setSelectedArea] = useState(null);
const [selectedZone, setSelectedZone] = useState(null);
const [boundaryData, setBoundaryData] = useState(null);
```

## Key Functions

### 1. Carbon Footprint Calculation
```javascript
const totalCarbonFootprint = useCallback(() => {
  // Sum asset footprints
  const assetFootprint = assets.reduce(
    (sum, asset) => sum + (asset.carbonIntensity || 0), 0
  );
  
  // Add location-specific footprints
  const locationKey = `${longitude},${latitude}`;
  const additionalFootprint = carbonFootprints[locationKey]?.total || 0;
  
  return assetFootprint + additionalFootprint;
}, [assets, coordinates, carbonFootprints]);
```

### 2. Impact Level Determination
```javascript
const getImpactLevel = useCallback(() => {
  const total = totalCarbonFootprint();
  
  if (total < 1000) return 'low';
  if (total < 10000) return 'medium';
  if (total < 25000) return 'high';
  return 'critical';
}, [totalCarbonFootprint]);
```

**Thresholds**:
- **Low**: < 1,000 kg CO₂e
- **Medium**: 1,000 - 10,000 kg CO₂e
- **High**: 10,000 - 25,000 kg CO₂e
- **Critical**: > 25,000 kg CO₂e

### 3. Regulatory Compliance Check
```javascript
const getRegulatoryCompliance = useCallback(() => {
  const total = totalCarbonFootprint();
  const compliance = {
    local: 'compliant',
    state: 'compliant',
    federal: 'compliant'
  };
  
  // Check against thresholds
  if (total > thresholds.local?.threshold) {
    compliance.local = total > thresholds.local?.critical ? 
      'non-compliant' : 'warning';
  }
  // Similar checks for state and federal
  
  return compliance;
}, [totalCarbonFootprint, regulatoryThresholds]);
```

## Visualization Modes

### 1. Heatmap Mode
- Color-coded impact indicator
- Display total CO₂e value
- Dynamic color based on impact level

### 2. Bubble Mode
- Bubble size represents carbon intensity
- Color indicates decarbonization difficulty
- Individual asset representation

### 3. Gradient Mode
- Gradient bar with position indicator
- Shows relative position to regulatory threshold
- Four-level scale (Low to Critical)

## Map Features

### 1. Asset Visualization
```javascript
<Circle
  center={[latitude, longitude]}
  radius={Math.max(50, asset.carbonIntensity * 2)}
  pathOptions={{
    color: asset.isHardToDecarbonize ? '#ef4444' : '#10b981',
    fillColor: asset.isHardToDecarbonize ? '#fee2e2' : '#d1fae5',
    fillOpacity: 0.6
  }}
>
  <Tooltip>{/* Asset details */}</Tooltip>
</Circle>
```

### 2. Zone Rendering

#### Circle Zones
```javascript
<Circle
  center={[zone.coordinates.latitude, zone.coordinates.longitude]}
  radius={zone.radius || 500}
  // Styling and event handlers
/>
```

#### Polygon Zones (GeoJSON)
```javascript
<Polygon
  positions={coordinates}
  pathOptions={{
    color: selectedZone ? '#3b82f6' : '#4ade80',
    fillColor: selectedZone ? '#93c5fd' : '#bbf7d0'
  }}
/>
```

#### Rectangle Zones (Default)
```javascript
<Rectangle
  bounds={[
    [lat - 0.005, lon - 0.005],
    [lat + 0.005, lon + 0.005]
  ]}
/>
```

### 3. Drawing Controls
```javascript
<EditControl
  position="topright"
  draw={{
    polygon: true,
    rectangle: true,
    circle: true,
    marker: false,
    circlemarker: false,
    polyline: false
  }}
/>
```

## Control Panel UI

### Visualization Controls
- Toggle climate impact display
- Toggle regulatory zones
- Toggle zone display
- Toggle boundaries
- Visualization type selector

### Zone Management
- Add/Remove zones
- Select active zone
- Clear all zones
- Import/Export zone data

### Legend
- Color-coded impact levels
- Regulatory compliance indicators
- Zone type indicators

## Event Handling

### Zone Selection
```javascript
const handleZoneSelected = (zone) => {
  setSelectedZone(zone);
  onZoneSelected(zone);
  
  // Calculate zone statistics
  const stats = calculateZoneStats(zone);
  // Update UI with zone details
};
```

### Drawing Events
```javascript
const onCreated = useCallback((e) => {
  const { layer } = e;
  const shape = layer.toGeoJSON();
  
  // Calculate area using Turf.js
  const area = turf.area(shape);
  
  // Create zone object
  const newZone = {
    id: `zone-${Date.now()}`,
    type: 'polygon',
    geoJSON: shape,
    area: area,
    // Additional properties
  };
  
  onAreaSelected(newZone);
}, [onAreaSelected]);
```

## Styling

### CSS Classes
- `.climate-map-overlay`: Main container
- `.map-container`: Leaflet map wrapper
- `.control-panel`: Control interface
- `.impact-overlay`: Climate impact display
- `.regulatory-zones-overlay`: Compliance display
- `.visualization-controls`: Toggle controls

### Color Scheme
- **Green** (#10b981): Low impact/Compliant
- **Amber** (#f59e0b): Medium impact/Warning
- **Red** (#ef4444): High impact/Non-compliant
- **Dark Red** (#7f1d1d): Critical impact
- **Blue** (#3b82f6): Selected items

## Performance Considerations

1. **Memoized Calculations**
   - Use useCallback for expensive computations
   - Cache carbon footprint totals
   - Minimize re-renders

2. **Map Optimization**
   - Limit number of rendered zones
   - Use clustering for many assets
   - Implement viewport culling

3. **Data Management**
   - Lazy load boundary data
   - Paginate large zone lists
   - Compress GeoJSON data

## Usage Example

```javascript
<ClimateMapOverlay
  coordinates={{ latitude: 51.505, longitude: -0.09 }}
  assets={assetList}
  carbonFootprints={footprintData}
  regulatoryThresholds={{
    local: { threshold: 5000, critical: 8000 },
    state: { threshold: 15000, critical: 20000 },
    federal: { threshold: 25000, critical: 35000 }
  }}
  complianceStatus={{ overall: 'warning' }}
  zones={zoneList}
  onAreaSelected={handleAreaSelection}
  onZoneSelected={handleZoneSelection}
/>
```

This component provides a comprehensive climate impact visualization system, enabling users to understand and analyze carbon footprints, regulatory compliance, and geographic distribution of environmental impacts in an intuitive, interactive map interface.