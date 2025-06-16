# zone-utils.js Documentation

## Overview

The `zone-utils.js` module provides comprehensive utilities for zone generation, transformation, and analysis in geographical applications. It supports creating various zone shapes (square, hexagonal, circular), clustering zones based on emissions and regulatory data, and parsing GeoJSON files for zone boundaries.

## Dependencies

- **@turf/turf** - Advanced geospatial analysis library for JavaScript

## Core Functions

### 1. generateZoneGrid(config, centerPoint)

Generates a grid of zones based on configuration parameters.

#### Parameters:
- `config` (Object) - Configuration for zone generation
  - `gridSize` (Object) - Grid dimensions
    - `rows` (number) - Number of rows
    - `columns` (number) - Number of columns
  - `zoneSize` (Object) - Individual zone dimensions
    - `width` (number) - Zone width
    - `height` (number) - Zone height
    - `unit` (string) - Unit of measurement ('m', 'km', 'mi')
  - `zoneShape` (string) - Shape type ('square', 'hexagon', 'circle')
  - `namingPattern` (string) - Pattern for zone names (supports {x}, {y}, {i} placeholders)
  - `nameStartIndex` (number) - Starting index for zone numbering
- `centerPoint` (Object) - Grid center coordinates
  - `longitude` (number) - Center longitude
  - `latitude` (number) - Center latitude

#### Returns:
Array of zone objects with properties:
- `id` - Unique zone identifier
- `name` - Zone name based on pattern
- `type` - Zone shape type
- `geoJSON` - GeoJSON representation
- `center` - Center coordinates
- `coordinates` - Coordinate object
- `area` - Zone area in square meters
- `bounds` - Bounding box

#### Example:
```javascript
const config = {
  gridSize: { rows: 3, columns: 3 },
  zoneSize: { width: 10, height: 10, unit: 'km' },
  zoneShape: 'square',
  namingPattern: 'Zone-{x}-{y}',
  nameStartIndex: 1
};

const centerPoint = { longitude: -122.4194, latitude: 37.7749 };
const zones = generateZoneGrid(config, centerPoint);
```

### 2. createZoneClusters(zones, analysisType, clusterCount, carbonFootprints, complianceStatus)

Creates clusters of zones based on emissions, regulatory compliance, or combined analysis.

#### Parameters:
- `zones` (Array) - Array of zone objects to cluster
- `analysisType` (string) - Type of analysis:
  - `'emissions'` - Cluster by emission data
  - `'regulatory'` - Cluster by compliance status
  - `'combined'` - Cluster by both emissions and compliance
- `clusterCount` (number) - Number of clusters to create
- `carbonFootprints` (Object) - Carbon footprint data by zone
- `complianceStatus` (Object) - Compliance status data by zone

#### Returns:
Object containing:
- `clusters` (Array) - Array of cluster objects
  - `centroid` - Cluster center in feature space
  - `points` - Array of zones in the cluster
  - `size` - Number of zones in cluster
- `iterations` (number) - Number of k-means iterations
- `converged` (boolean) - Whether clustering converged

#### Clustering Features by Analysis Type:

**Emissions Analysis:**
- Total emissions
- Hard-to-decarbonize emissions
- Scope 1, 2, and 3 emissions

**Regulatory Analysis:**
- Local compliance score
- State compliance score
- Federal compliance score
- Overall compliance score

**Combined Analysis:**
- Total emissions
- Hard-to-decarbonize emissions
- Local compliance score
- Federal compliance score

#### Example:
```javascript
const clusters = createZoneClusters(
  zones,
  'combined',
  4,
  carbonFootprintData,
  complianceData
);
```

### 3. parseGeoJSONToZones(geoJSONData)

Parses GeoJSON data to create zone objects.

#### Parameters:
- `geoJSONData` (string) - GeoJSON data as string

#### Returns:
Array of zone objects created from GeoJSON features

#### Example:
```javascript
const geoJSONString = fs.readFileSync('zones.geojson', 'utf8');
const zones = parseGeoJSONToZones(geoJSONString);
```

## Helper Functions

### Unit Conversion

#### convertToMeters(distance, unit)
Converts distance values to meters.

**Supported Units:**
- `'m'` - Meters (no conversion)
- `'km'` - Kilometers to meters
- `'mi'` - Miles to meters

#### metersToLongitudeDegrees(meters, latitude)
Converts meters to longitude degrees at a specific latitude.

#### metersToLatitudeDegrees(meters)
Converts meters to latitude degrees.

## Zone Shape Generators

### generateSquareZones(gridSize, bounds, namingPattern, nameStartIndex)

Generates rectangular zones in a grid pattern.

**Features:**
- Perfect grid alignment
- Consistent zone sizes
- No overlap between zones
- Efficient space utilization

### generateHexZones(gridSize, bounds, namingPattern, nameStartIndex)

Generates hexagonal zones with offset rows.

**Features:**
- Honeycomb pattern
- Better circular approximation
- Offset rows for tessellation
- 75% vertical overlap for proper hex packing

### generateCircleZones(gridSize, bounds, radiusMeters, namingPattern, nameStartIndex)

Generates circular zones in a grid.

**Features:**
- Perfect circles
- Configurable radius
- May have gaps between zones
- 64-point polygon approximation

## Clustering Algorithm

### K-Means Implementation

The module includes a custom k-means clustering implementation:

1. **Feature Normalization** - Min-max normalization to [0, 1] range
2. **Random Initialization** - Initial centroids from random data points
3. **Iterative Refinement** - Up to 100 iterations
4. **Convergence Check** - Stops when centroids move < 0.001
5. **Empty Cluster Handling** - Re-initializes empty clusters

### euclideanDistance(point1, point2, features)

Calculates Euclidean distance between points in feature space.

## Usage Patterns

### Zone Generation Workflow

```javascript
// 1. Define configuration
const zoneConfig = {
  gridSize: { rows: 5, columns: 5 },
  zoneSize: { width: 5, height: 5, unit: 'km' },
  zoneShape: 'hexagon',
  namingPattern: 'HEX-{i}',
  nameStartIndex: 100
};

// 2. Set center point
const center = { longitude: -73.935242, latitude: 40.730610 };

// 3. Generate zones
const zones = generateZoneGrid(zoneConfig, center);

// 4. Add emissions data (example)
zones.forEach(zone => {
  zone.emissions = Math.random() * 1000;
});

// 5. Create clusters
const emissionClusters = createZoneClusters(
  zones,
  'emissions',
  3,
  carbonFootprints,
  complianceStatus
);
```

### GeoJSON Integration

```javascript
// Load existing boundaries
const cityBoundaries = parseGeoJSONToZones(cityGeoJSON);

// Combine with generated zones
const allZones = [...generatedZones, ...cityBoundaries];

// Analyze combined zones
const analysis = createZoneClusters(allZones, 'combined', 5);
```

## Best Practices

1. **Coordinate Systems** - Always use WGS84 (longitude, latitude)
2. **Zone Sizing** - Consider analysis scale when setting zone dimensions
3. **Naming Patterns** - Use descriptive patterns for easy identification
4. **Performance** - Limit grid size for large areas (consider tiling)
5. **Clustering** - Choose appropriate cluster count (3-10 typically)

## Error Handling

The module includes error handling for:
- Invalid GeoJSON parsing
- Division by zero in calculations
- Empty cluster scenarios
- Invalid unit conversions

## Performance Considerations

1. **Large Grids** - Generation time scales with rows × columns
2. **Clustering** - O(n × k × iterations) complexity
3. **GeoJSON Parsing** - Memory usage scales with feature count
4. **Distance Calculations** - Cached for repeated zone pairs

## Integration Examples

### With Mapping Libraries

```javascript
// Leaflet integration
zones.forEach(zone => {
  L.geoJSON(zone.geoJSON, {
    style: { fillColor: getColorForZone(zone) }
  }).addTo(map);
});

// Mapbox GL JS integration
map.addSource('zones', {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: zones.map(z => z.geoJSON)
  }
});
```

### With Data Visualization

```javascript
// D3.js integration for cluster visualization
const clusterData = clusters.clusters.map(cluster => ({
  size: cluster.size,
  emissions: cluster.centroid.totalEmissions,
  compliance: cluster.centroid.overallCompliance
}));

// Plot clusters
d3.select('svg')
  .selectAll('circle')
  .data(clusterData)
  .enter()
  .append('circle')
  .attr('r', d => Math.sqrt(d.size) * 10)
  .attr('fill', d => emissionColorScale(d.emissions));
```

## Future Enhancements

1. **Additional Shapes** - Triangle, diamond, custom polygons
2. **3D Zones** - Support for elevation/height dimension
3. **Adaptive Grids** - Variable zone sizes based on data density
4. **Advanced Clustering** - DBSCAN, hierarchical clustering
5. **Spatial Indexing** - R-tree for efficient spatial queries