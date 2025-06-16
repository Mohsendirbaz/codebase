// ZoneUtils.js

import * as turf from '@turf/turf';

/**
 * Utility functions for zone generation, transformation, and analysis
 */

/**
 * Generate a grid of zones based on configuration
 * 
 * @param {Object} config - Configuration for zone generation
 * @param {Object} config.gridSize - Grid size configuration
 * @param {number} config.gridSize.rows - Number of rows in the grid
 * @param {number} config.gridSize.columns - Number of columns in the grid
 * @param {Object} config.zoneSize - Zone size configuration
 * @param {number} config.zoneSize.width - Width of each zone
 * @param {number} config.zoneSize.height - Height of each zone
 * @param {string} config.zoneSize.unit - Unit of measurement ('m', 'km', 'mi')
 * @param {string} config.zoneShape - Shape of each zone ('square', 'hexagon', 'circle')
 * @param {string} config.namingPattern - Pattern for naming zones
 * @param {number} config.nameStartIndex - Starting index for zone naming
 * @param {Object} centerPoint - Center point for the grid
 * @param {number} centerPoint.longitude - Longitude of the center point
 * @param {number} centerPoint.latitude - Latitude of the center point
 * @returns {Array} Array of generated zones
 */
export function generateZoneGrid(config, centerPoint) {
  const { gridSize, zoneSize, zoneShape, namingPattern, nameStartIndex } = config;
  const { longitude, latitude } = centerPoint;
  
  // Convert units to meters
  const widthInMeters = convertToMeters(zoneSize.width, zoneSize.unit);
  const heightInMeters = convertToMeters(zoneSize.height, zoneSize.unit);
  
  // Calculate grid dimensions
  const gridWidthMeters = widthInMeters * gridSize.columns;
  const gridHeightMeters = heightInMeters * gridSize.rows;
  
  // Calculate the bounds of the grid
  const halfWidthDeg = metersToLongitudeDegrees(gridWidthMeters / 2, latitude);
  const halfHeightDeg = metersToLatitudeDegrees(gridHeightMeters / 2);
  
  const bounds = {
    minLon: longitude - halfWidthDeg,
    maxLon: longitude + halfWidthDeg,
    minLat: latitude - halfHeightDeg,
    maxLat: latitude + halfHeightDeg
  };
  
  // Generate zones based on shape
  let zones = [];
  
  switch (zoneShape) {
    case 'square':
      zones = generateSquareZones(gridSize, bounds, namingPattern, nameStartIndex);
      break;
    case 'hexagon':
      zones = generateHexZones(gridSize, bounds, namingPattern, nameStartIndex);
      break;
    case 'circle':
      zones = generateCircleZones(gridSize, bounds, widthInMeters / 2, namingPattern, nameStartIndex);
      break;
    default:
      zones = generateSquareZones(gridSize, bounds, namingPattern, nameStartIndex);
  }
  
  return zones;
}

/**
 * Generate square zones in a grid pattern
 * 
 * @param {Object} gridSize - Grid size configuration
 * @param {Object} bounds - Bounds of the grid
 * @param {string} namingPattern - Pattern for naming zones
 * @param {number} nameStartIndex - Starting index for zone naming
 * @returns {Array} Array of generated square zones
 */
function generateSquareZones(gridSize, bounds, namingPattern, nameStartIndex) {
  const zones = [];
  const { minLon, maxLon, minLat, maxLat } = bounds;
  
  const cellWidth = (maxLon - minLon) / gridSize.columns;
  const cellHeight = (maxLat - minLat) / gridSize.rows;
  
  for (let row = 0; row < gridSize.rows; row++) {
    for (let col = 0; col < gridSize.columns; col++) {
      // Calculate cell coordinates
      const west = minLon + (col * cellWidth);
      const east = west + cellWidth;
      const south = minLat + (row * cellHeight);
      const north = south + cellHeight;
      
      // Create GeoJSON polygon for the cell
      const polygon = turf.polygon([[
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south]
      ]]);
      
      // Calculate center point
      const center = turf.center(polygon);
      
      // Create zone object
      const zoneIndex = row * gridSize.columns + col + nameStartIndex;
      const zoneName = namingPattern
        .replace('{x}', col + nameStartIndex)
        .replace('{y}', row + nameStartIndex)
        .replace('{i}', zoneIndex);
      
      zones.push({
        id: `zone-${Date.now()}-${zoneIndex}`,
        name: zoneName,
        type: 'square',
        geoJSON: polygon,
        center: {
          lng: center.geometry.coordinates[0],
          lat: center.geometry.coordinates[1]
        },
        coordinates: {
          longitude: center.geometry.coordinates[0],
          latitude: center.geometry.coordinates[1]
        },
        area: turf.area(polygon),
        bounds: {
          west, east, south, north
        }
      });
    }
  }
  
  return zones;
}

/**
 * Generate hexagonal zones in a grid pattern
 * 
 * @param {Object} gridSize - Grid size configuration
 * @param {Object} bounds - Bounds of the grid
 * @param {string} namingPattern - Pattern for naming zones
 * @param {number} nameStartIndex - Starting index for zone naming
 * @returns {Array} Array of generated hexagonal zones
 */
function generateHexZones(gridSize, bounds, namingPattern, nameStartIndex) {
  const zones = [];
  const { minLon, maxLon, minLat, maxLat } = bounds;
  
  // Adjusted for hexagons (width is 2 * inradius, height is 2 * apothem)
  const cellWidth = (maxLon - minLon) / (gridSize.columns + 0.5); // Adjust for offset columns
  const cellHeight = (maxLat - minLat) / (gridSize.rows * 0.75); // Hexagons overlap in height
  
  for (let row = 0; row < gridSize.rows; row++) {
    for (let col = 0; col < gridSize.columns; col++) {
      // Calculate cell center
      const x = minLon + (col * cellWidth) + (cellWidth / 2) + (row % 2 === 1 ? cellWidth / 2 : 0);
      const y = minLat + (row * cellHeight * 0.75) + (cellHeight / 2);
      
      // Create a hexagon
      const options = {
        steps: 6, // 6 sides for a hexagon
        units: 'degrees'
      };
      
      // Size of the hexagon
      const radiusX = cellWidth / 2 * 0.9; // 90% of half cell width
      const radiusY = cellHeight / 2 * 0.9; // 90% of half cell height
      
      // Generate a circle and then convert to polygon to make it a hexagon
      const circle = turf.circle([x, y], Math.min(radiusX, radiusY), options);
      
      // Create zone object
      const zoneIndex = row * gridSize.columns + col + nameStartIndex;
      const zoneName = namingPattern
        .replace('{x}', col + nameStartIndex)
        .replace('{y}', row + nameStartIndex)
        .replace('{i}', zoneIndex);
      
      zones.push({
        id: `zone-${Date.now()}-${zoneIndex}`,
        name: zoneName,
        type: 'hexagon',
        geoJSON: circle,
        center: {
          lng: x,
          lat: y
        },
        coordinates: {
          longitude: x,
          latitude: y
        },
        area: turf.area(circle),
        bounds: turf.bbox(circle)
      });
    }
  }
  
  return zones;
}

/**
 * Generate circular zones in a grid pattern
 * 
 * @param {Object} gridSize - Grid size configuration
 * @param {Object} bounds - Bounds of the grid
 * @param {number} radiusMeters - Radius of each circle in meters
 * @param {string} namingPattern - Pattern for naming zones
 * @param {number} nameStartIndex - Starting index for zone naming
 * @returns {Array} Array of generated circular zones
 */
function generateCircleZones(gridSize, bounds, radiusMeters, namingPattern, nameStartIndex) {
  const zones = [];
  const { minLon, maxLon, minLat, maxLat } = bounds;
  
  const cellWidth = (maxLon - minLon) / gridSize.columns;
  const cellHeight = (maxLat - minLat) / gridSize.rows;
  
  for (let row = 0; row < gridSize.rows; row++) {
    for (let col = 0; col < gridSize.columns; col++) {
      // Calculate cell center
      const x = minLon + (col * cellWidth) + (cellWidth / 2);
      const y = minLat + (row * cellHeight) + (cellHeight / 2);
      
      // Convert radius from meters to degrees at this latitude
      const radiusLonDeg = metersToLongitudeDegrees(radiusMeters, y);
      const radiusLatDeg = metersToLatitudeDegrees(radiusMeters);
      const radiusDeg = Math.min(radiusLonDeg, radiusLatDeg);
      
      // Create a circle
      const circle = turf.circle([x, y], radiusDeg, { units: 'degrees', steps: 64 });
      
      // Create zone object
      const zoneIndex = row * gridSize.columns + col + nameStartIndex;
      const zoneName = namingPattern
        .replace('{x}', col + nameStartIndex)
        .replace('{y}', row + nameStartIndex)
        .replace('{i}', zoneIndex);
      
      zones.push({
        id: `zone-${Date.now()}-${zoneIndex}`,
        name: zoneName,
        type: 'circle',
        geoJSON: circle,
        center: {
          lng: x,
          lat: y
        },
        coordinates: {
          longitude: x,
          latitude: y
        },
        radius: radiusMeters, // Store the radius in meters
        area: Math.PI * radiusMeters * radiusMeters,
        bounds: turf.bbox(circle)
      });
    }
  }
  
  return zones;
}

/**
 * Convert distance to meters based on unit
 * 
 * @param {number} distance - Distance value
 * @param {string} unit - Unit of measurement ('m', 'km', 'mi')
 * @returns {number} Distance in meters
 */
function convertToMeters(distance, unit) {
  switch (unit) {
    case 'm':
      return distance;
    case 'km':
      return distance * 1000;
    case 'mi':
      return distance * 1609.34; // Miles to meters
    default:
      return distance;
  }
}

/**
 * Convert meters to longitude degrees at a given latitude
 * 
 * @param {number} meters - Distance in meters
 * @param {number} latitude - Latitude in degrees
 * @returns {number} Longitude degrees
 */
function metersToLongitudeDegrees(meters, latitude) {
  // Earth's radius in meters
  const earthRadius = 6378137;
  
  // Convert latitude to radians
  const latRad = latitude * Math.PI / 180;
  
  // Calculate longitude degrees
  // At the equator, 1 degree of longitude is about 111,319.5 meters
  // As you move away from the equator, this distance decreases by the cosine of the latitude
  const lonDegrees = meters / (earthRadius * Math.cos(latRad) * Math.PI / 180);
  
  return lonDegrees;
}

/**
 * Convert meters to latitude degrees
 * 
 * @param {number} meters - Distance in meters
 * @returns {number} Latitude degrees
 */
function metersToLatitudeDegrees(meters) {
  // Earth's radius in meters
  const earthRadius = 6378137;
  
  // Calculate latitude degrees
  // 1 degree of latitude is about 111,319.5 meters
  const latDegrees = meters / (earthRadius * Math.PI / 180);
  
  return latDegrees;
}

/**
 * Create clusters of zones based on various attributes
 * 
 * @param {Array} zones - Array of zones to cluster
 * @param {string} analysisType - Type of analysis ('emissions', 'regulatory', 'combined')
 * @param {number} clusterCount - Number of clusters to create
 * @param {Object} carbonFootprints - Carbon footprint data
 * @param {Object} complianceStatus - Compliance status data
 * @returns {Object} Clustering results
 */
export function createZoneClusters(zones, analysisType, clusterCount, carbonFootprints, complianceStatus) {
  // Extract features for clustering
  const features = zones.map(zone => {
    const zoneId = zone.id;
    
    // Get carbon footprints for this zone
    const zoneCarbonFootprint = getCarbonFootprintForZone(zoneId, carbonFootprints);
    
    // Get compliance status for this zone
    const zoneCompliance = getComplianceForZone(zoneId, complianceStatus);
    
    // Normalize compliance to numbers
    const complianceScore = {
      compliant: 1.0,
      warning: 0.5,
      'non-compliant': 0.0,
      'not-applicable': 0.5
    };
    
    // Create feature vector based on analysis type
    let features = {};
    
    switch (analysisType) {
      case 'emissions':
        features = {
          totalEmissions: zoneCarbonFootprint.total || 0,
          hardToDecarbonize: zoneCarbonFootprint.hardToDecarbonize || 0,
          scope1: zoneCarbonFootprint.scope1 || 0,
          scope2: zoneCarbonFootprint.scope2 || 0,
          scope3: zoneCarbonFootprint.scope3 || 0
        };
        break;
      case 'regulatory':
        features = {
          localCompliance: complianceScore[zoneCompliance.local] || 0.5,
          stateCompliance: complianceScore[zoneCompliance.state] || 0.5,
          federalCompliance: complianceScore[zoneCompliance.federal] || 0.5,
          overallCompliance: complianceScore[zoneCompliance.overall] || 0.5
        };
        break;
      case 'combined':
        features = {
          totalEmissions: zoneCarbonFootprint.total || 0,
          hardToDecarbonize: zoneCarbonFootprint.hardToDecarbonize || 0,
          localCompliance: complianceScore[zoneCompliance.local] || 0.5,
          federalCompliance: complianceScore[zoneCompliance.federal] || 0.5
        };
        break;
      default:
        features = {
          totalEmissions: zoneCarbonFootprint.total || 0
        };
    }
    
    return {
      zoneId,
      features,
      zone
    };
  });
  
  // Normalize features
  const normalizedFeatures = normalizeFeatures(features);
  
  // Perform k-means clustering
  const clusters = kMeansClustering(normalizedFeatures, clusterCount);
  
  return clusters;
}

/**
 * Get carbon footprint data for a specific zone
 * 
 * @param {string} zoneId - ID of the zone
 * @param {Object} carbonFootprints - Carbon footprint data
 * @returns {Object} Carbon footprint for the zone
 */
function getCarbonFootprintForZone(zoneId, carbonFootprints) {
  // In a real implementation, this would extract the carbon footprint data
  // for the specified zone from the carbonFootprints object
  
  // Mock implementation
  return {
    total: Math.random() * 10000,
    hardToDecarbonize: Math.random() * 5000,
    standard: Math.random() * 5000,
    scope1: Math.random() * 3000,
    scope2: Math.random() * 3000,
    scope3: Math.random() * 4000
  };
}

/**
 * Get compliance status for a specific zone
 * 
 * @param {string} zoneId - ID of the zone
 * @param {Object} complianceStatus - Compliance status data
 * @returns {Object} Compliance status for the zone
 */
function getComplianceForZone(zoneId, complianceStatus) {
  // In a real implementation, this would extract the compliance status
  // for the specified zone from the complianceStatus object
  
  // Mock implementation
  const statuses = ['compliant', 'warning', 'non-compliant'];
  return {
    overall: statuses[Math.floor(Math.random() * 3)],
    local: statuses[Math.floor(Math.random() * 3)],
    state: statuses[Math.floor(Math.random() * 3)],
    federal: statuses[Math.floor(Math.random() * 3)]
  };
}

/**
 * Normalize features for clustering
 * 
 * @param {Array} features - Array of feature objects
 * @returns {Array} Normalized features
 */
function normalizeFeatures(features) {
  // Initialize min and max values for each feature
  const mins = {};
  const maxs = {};
  
  // Get all feature names from the first item
  const featureNames = Object.keys(features[0].features);
  
  // Initialize min and max
  featureNames.forEach(name => {
    mins[name] = Infinity;
    maxs[name] = -Infinity;
  });
  
  // Find min and max for each feature
  features.forEach(item => {
    featureNames.forEach(name => {
      const value = item.features[name];
      mins[name] = Math.min(mins[name], value);
      maxs[name] = Math.max(maxs[name], value);
    });
  });
  
  // Normalize features
  return features.map(item => {
    const normalizedFeatures = {};
    
    featureNames.forEach(name => {
      const value = item.features[name];
      const min = mins[name];
      const max = maxs[name];
      
      // If max equals min, set normalized value to 0.5
      normalizedFeatures[name] = max === min ? 0.5 : (value - min) / (max - min);
    });
    
    return {
      ...item,
      normalizedFeatures
    };
  });
}

/**
 * Perform k-means clustering
 * 
 * @param {Array} data - Array of data points
 * @param {number} k - Number of clusters
 * @param {number} maxIterations - Maximum number of iterations
 * @returns {Object} Clustering results
 */
function kMeansClustering(data, k, maxIterations = 100) {
  // Get feature names
  const featureNames = Object.keys(data[0].normalizedFeatures);
  
  // Initialize centroids randomly
  let centroids = [];
  for (let i = 0; i < k; i++) {
    const randomIndex = Math.floor(Math.random() * data.length);
    centroids.push({...data[randomIndex].normalizedFeatures});
  }
  
  // Initialize clusters
  let clusters = Array(k).fill().map(() => []);
  let iterations = 0;
  let converged = false;
  
  while (!converged && iterations < maxIterations) {
    // Reset clusters
    clusters = Array(k).fill().map(() => []);
    
    // Assign data points to clusters
    data.forEach((point, index) => {
      const distances = centroids.map(centroid => {
        return euclideanDistance(point.normalizedFeatures, centroid, featureNames);
      });
      
      const closestCentroid = distances.indexOf(Math.min(...distances));
      clusters[closestCentroid].push({...point, dataIndex: index});
    });
    
    // Update centroids
    const newCentroids = clusters.map(cluster => {
      if (cluster.length === 0) {
        // If a cluster is empty, initialize with random point
        const randomIndex = Math.floor(Math.random() * data.length);
        return {...data[randomIndex].normalizedFeatures};
      }
      
      const centroid = {};
      
      featureNames.forEach(feature => {
        centroid[feature] = cluster.reduce((sum, point) => sum + point.normalizedFeatures[feature], 0) / cluster.length;
      });
      
      return centroid;
    });
    
    // Check for convergence
    converged = centroids.every((centroid, i) => {
      return euclideanDistance(centroid, newCentroids[i], featureNames) < 0.001;
    });
    
    centroids = newCentroids;
    iterations++;
  }
  
  // Prepare results
  const result = {
    clusters: clusters.map((cluster, index) => {
      return {
        centroid: centroids[index],
        points: cluster.map(point => ({
          zoneId: point.zoneId,
          zone: point.zone
        })),
        size: cluster.length
      };
    }),
    iterations,
    converged
  };
  
  return result;
}

/**
 * Calculate Euclidean distance between two points
 * 
 * @param {Object} point1 - First point
 * @param {Object} point2 - Second point
 * @param {Array} features - Feature names
 * @returns {number} Euclidean distance
 */
function euclideanDistance(point1, point2, features) {
  return Math.sqrt(
    features.reduce((sum, feature) => {
      const diff = point1[feature] - point2[feature];
      return sum + diff * diff;
    }, 0)
  );
}

/**
 * Parse a GeoJSON file for zone boundaries
 * 
 * @param {string} geoJSONData - GeoJSON data as string
 * @returns {Array} Array of zones created from GeoJSON
 */
export function parseGeoJSONToZones(geoJSONData) {
  try {
    const geoJSON = JSON.parse(geoJSONData);
    const zones = [];
    
    // Process each feature in the GeoJSON
    if (geoJSON.type === 'FeatureCollection' && geoJSON.features) {
      geoJSON.features.forEach((feature, index) => {
        // Create a zone from the feature
        const center = turf.center(feature);
        
        zones.push({
          id: `zone-geojson-${Date.now()}-${index}`,
          name: feature.properties?.name || `GeoJSON Zone ${index + 1}`,
          type: 'geojson',
          geoJSON: feature,
          center: {
            lng: center.geometry.coordinates[0],
            lat: center.geometry.coordinates[1]
          },
          coordinates: {
            longitude: center.geometry.coordinates[0],
            latitude: center.geometry.coordinates[1]
          },
          area: turf.area(feature),
          properties: feature.properties
        });
      });
    }
    
    return zones;
  } catch (error) {
    console.error('Error parsing GeoJSON:', error);
    return [];
  }
}

export default {
  generateZoneGrid,
  createZoneClusters,
  parseGeoJSONToZones
};