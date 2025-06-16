# CoordinateComponent Documentation

## Overview

The `CoordinateComponent` is a comprehensive geographic coordinate and asset management interface that enables users to define zone locations and track climate-relevant assets. It combines geospatial data entry with carbon intensity tracking for climate impact assessment.

## Architecture

### Component Structure
```
CoordinateComponent
├── Header (Zone Information)
├── Geographic Coordinates Section
│   ├── Longitude Input
│   ├── Latitude Input
│   └── Map View Button
├── Assets Section
│   ├── Asset Statistics
│   ├── Add Asset Form
│   ├── Filter Controls
│   └── Assets List
│       └── Expandable Asset Details
│           ├── Editable Fields
│           └── Climate Impact Assessment
```

### State Architecture
```javascript
// Coordinate state
const [coordinates, setCoordinates] = useState({
  longitude: zone?.coordinates?.longitude || 0,
  latitude: zone?.coordinates?.latitude || 0
});

// Asset management
const [assets, setAssets] = useState(zone?.assets || []);
const [newAsset, setNewAsset] = useState({
  name: '',
  type: '',
  carbonIntensity: 0,
  isHardToDecarbonize: false
});

// UI state
const [isAddingAsset, setIsAddingAsset] = useState(false);
const [validationErrors, setValidationErrors] = useState({});
const [activeAssetIndex, setActiveAssetIndex] = useState(null);
const [filterType, setFilterType] = useState('all');
const [searchTerm, setSearchTerm] = useState('');
```

## Geospatial Features

### Coordinate Management

1. **Validation Rules**
   - Longitude: -180° to +180°
   - Latitude: -90° to +90°
   - Precision: 6 decimal places (approximately 0.11 meters)

2. **Input Features**
   - Real-time validation
   - Error messaging
   - Decimal precision support
   - Map view integration option

### Geographic Standards
The component follows WGS84 (World Geodetic System 1984) standards:
- Decimal degrees format
- Negative values for West/South
- Positive values for East/North

## Climate-Related Features

### Asset Classification System

**Asset Types:**
- `industrial`: Manufacturing and processing facilities
- `commercial`: Business and retail operations
- `residential`: Housing and living spaces
- `energy`: Power generation and distribution
- `transportation`: Transit and logistics infrastructure
- `agriculture`: Farming and food production

### Carbon Intensity Tracking

Each asset includes:
```javascript
{
  id: string,
  name: string,
  type: string,
  carbonIntensity: number, // kg CO₂e per unit
  isHardToDecarbonize: boolean
}
```

**Hard to Decarbonize Classification:**
- Binary flag for sector difficulty
- Visual indicators for quick identification
- Impacts climate planning strategies

### Climate Impact Assessment

The component provides visual climate impact analysis:
```javascript
<div className="climate-impact-scale">
  <div
    className="climate-impact-indicator"
    style={{
      left: `${Math.min(100, asset.carbonIntensity / 2)}%`,
      backgroundColor: asset.isHardToDecarbonize ? '#e74c3c' : '#3498db'
    }}
  />
</div>
```

Impact levels:
- **Low**: 0-50 kg CO₂e/unit
- **Medium**: 50-150 kg CO₂e/unit
- **High**: >150 kg CO₂e/unit

## User Interface Features

### Asset Management

1. **Adding Assets**
   - Animated form expansion
   - Required field validation
   - Type selection dropdown
   - Carbon intensity input
   - Hard-to-decarbonize toggle

2. **Asset Filtering**
   - Type-based filtering
   - Text search functionality
   - Clear search option
   - Real-time results

3. **Asset Editing**
   - Inline editing in expanded view
   - All fields editable
   - Immediate state updates
   - No save button needed (auto-save)

### Statistics Dashboard

Real-time calculations:
```javascript
const assetStats = {
  total: assets.length,
  hardToDecarbonize: assets.filter(a => a.isHardToDecarbonize).length,
  averageCarbonIntensity: assets.reduce((sum, asset) => 
    sum + asset.carbonIntensity, 0) / assets.length
};
```

## Animation and Interactions

### Framer Motion Integration

1. **Form Animations**
   ```javascript
   <motion.div
     initial={{ opacity: 0, height: 0 }}
     animate={{ opacity: 1, height: 'auto' }}
     exit={{ opacity: 0, height: 0 }}
   >
   ```

2. **Asset List Animations**
   - Staggered entry animations
   - Smooth expand/collapse
   - Fade transitions

### Interactive Elements

- **Toggle Switches**: Custom styled checkboxes for binary options
- **Expandable Details**: Click to reveal/hide asset details
- **Hover States**: Visual feedback on interactive elements
- **Loading States**: Skeleton screens for async operations

## Data Flow

### Input Handling
```javascript
// Coordinate updates
handleCoordinateChange(type, value) → validation → setState → onCoordinateChange callback

// Asset updates
handleAssetChange(field, value) → setState → onAssetChange callback
```

### Prop Interface
```javascript
PropTypes = {
  zone: {
    id: string,
    metadata: object,
    coordinates: { longitude: number, latitude: number },
    assets: array
  },
  onCoordinateChange: function,
  onAssetChange: function,
  onMapView: function
}
```

## Validation and Error Handling

### Coordinate Validation
- Range checking for valid Earth coordinates
- Numeric input validation
- Clear error messages
- Prevents invalid submissions

### Asset Validation
- Required fields: name, type
- Carbon intensity: non-negative numbers
- Unique ID generation for each asset
- Form-level validation before submission

## Best Practices

### Performance Optimization
1. **Debounced Updates**: Coordinate changes are immediate but could be debounced for API calls
2. **Memoized Calculations**: Asset statistics cached until data changes
3. **Lazy Rendering**: Expanded asset details only render when opened
4. **Virtual Scrolling**: Could be implemented for large asset lists

### Accessibility
- Semantic HTML structure
- Label associations for all inputs
- Keyboard navigation support
- ARIA labels for interactive elements
- High contrast mode support

### Data Integrity
- Immutable state updates
- Validation before persistence
- Unique identifiers for all assets
- Consistent data structures

## Integration Patterns

### With Parent Components
```javascript
// Coordinate updates
<CoordinateComponent
  zone={activeZone}
  onCoordinateChange={(coords) => updateZoneCoordinates(zoneId, coords)}
  onAssetChange={(assets) => updateZoneAssets(zoneId, assets)}
/>
```

### With Climate Systems
- Assets feed into carbon footprint calculations
- Hard-to-decarbonize flags affect regulatory compliance
- Carbon intensity data used for zone-level aggregations

### With Mapping Services
- Coordinates compatible with standard mapping APIs
- Optional map view integration
- Geocoding support potential

## Future Enhancement Opportunities

1. **Advanced Asset Features**
   - Asset lifecycle tracking
   - Maintenance schedules
   - Efficiency improvements over time
   - Asset interconnections

2. **Geographic Enhancements**
   - Address-to-coordinate conversion
   - Polygon zone boundaries
   - Multi-coordinate zones
   - Elevation data integration

3. **Climate Analytics**
   - Predictive carbon modeling
   - Scenario planning tools
   - Decarbonization pathways
   - ROI calculations for improvements

4. **Integration Capabilities**
   - Import from GIS systems
   - Export to climate reporting tools
   - API for external asset data
   - Real-time sensor integration