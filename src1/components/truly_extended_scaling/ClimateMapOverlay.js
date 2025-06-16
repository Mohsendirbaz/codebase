// ClimateMapOverlay.js (Updated)
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, FeatureGroup, Polygon, Circle, Tooltip, Rectangle } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import * as turf from '@turf/turf';
import './styles/ClimateMapOverlay.css';

/**
 * ClimateMapOverlay Component
 *
 * This component provides visualization overlays for climate data on coordinate maps.
 * It displays climate impact visualization, regulatory compliance zones, and supports
 * multi-zone selection capabilities.
 *
 * @param {Object} props - Component props
 * @param {Object} props.coordinates - The coordinates (longitude and latitude)
 * @param {Array} props.assets - The assets associated with the coordinates
 * @param {Object} props.carbonFootprints - Carbon footprint data
 * @param {Object} props.regulatoryThresholds - Regulatory threshold data
 * @param {Object} props.complianceStatus - Compliance status data
 * @param {Array} props.zones - Array of zones to display on the map (optional)
 * @param {Function} props.onAreaSelected - Callback when an area is selected (optional)
 * @param {Function} props.onZoneSelected - Callback when a zone is selected (optional)
 */
const ClimateMapOverlay = ({
                             coordinates,
                             assets = [],
                             carbonFootprints = {},
                             regulatoryThresholds = {},
                             complianceStatus = { overall: 'compliant' },
                             zones = [],
                             onAreaSelected = () => {},
                             onZoneSelected = () => {}
                           }) => {
  // State for visualization options
  const [showClimateImpact, setShowClimateImpact] = useState(true);
  const [showRegulatoryZones, setShowRegulatoryZones] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(false);
  const [selectedVisualization, setSelectedVisualization] = useState('heatmap'); // heatmap, bubble, gradient

  // State for map control
  const [mapCenter, setMapCenter] = useState([
    coordinates?.latitude || 51.505,
    coordinates?.longitude || -0.09
  ]);
  const [mapZoom, setMapZoom] = useState(12);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [boundaryData, setBoundaryData] = useState(null);

  // Refs
  const mapRef = React.useRef(null);
  const featureGroupRef = React.useRef(null);

  // Update map center when coordinates change
  useEffect(() => {
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      setMapCenter([coordinates.latitude, coordinates.longitude]);
    }
  }, [coordinates]);

  // Calculate total carbon footprint for this location
  const totalCarbonFootprint = useCallback(() => {
    // Sum up carbon footprints from assets
    const assetFootprint = assets.reduce((sum, asset) => sum + (asset.carbonIntensity || 0), 0);

    // Add any additional footprints from the carbonFootprints object
    let additionalFootprint = 0;
    if (coordinates && carbonFootprints) {
      const locationKey = `${coordinates.longitude.toFixed(4)},${coordinates.latitude.toFixed(4)}`;
      if (carbonFootprints[locationKey]) {
        additionalFootprint = carbonFootprints[locationKey].total || 0;
      }
    }

    return assetFootprint + additionalFootprint;
  }, [assets, coordinates, carbonFootprints]);

  // Determine impact level based on total carbon footprint
  const getImpactLevel = useCallback(() => {
    const total = totalCarbonFootprint();

    // Define thresholds for impact levels
    if (total < 1000) return 'low';
    if (total < 10000) return 'medium';
    if (total < 25000) return 'high';
    return 'critical';
  }, [totalCarbonFootprint]);

  // Determine regulatory compliance based on thresholds
  const getRegulatoryCompliance = useCallback(() => {
    const total = totalCarbonFootprint();
    const compliance = {
      local: 'compliant',
      state: 'compliant',
      federal: 'compliant'
    };

    // Check against each regulatory level
    if (regulatoryThresholds.local?.enabled && total > regulatoryThresholds.local.threshold) {
      compliance.local = 'non-compliant';
    } else if (regulatoryThresholds.local?.enabled && total > regulatoryThresholds.local.threshold * 0.8) {
      compliance.local = 'warning';
    }

    if (regulatoryThresholds.state?.enabled && total > regulatoryThresholds.state.threshold) {
      compliance.state = 'non-compliant';
    } else if (regulatoryThresholds.state?.enabled && total > regulatoryThresholds.state.threshold * 0.8) {
      compliance.state = 'warning';
    }

    if (regulatoryThresholds.federal?.enabled && total > regulatoryThresholds.federal.threshold) {
      compliance.federal = 'non-compliant';
    } else if (regulatoryThresholds.federal?.enabled && total > regulatoryThresholds.federal.threshold * 0.8) {
      compliance.federal = 'warning';
    }

    return compliance;
  }, [totalCarbonFootprint, regulatoryThresholds]);

  // Handle area creation from drawing
  const handleAreaCreated = (e) => {
    const { layerType, layer } = e;

    // Clear existing selection
    setSelectedArea(null);
    setSelectedZone(null);

    let areaGeoJSON = null;

    switch (layerType) {
      case 'polygon':
        const polygonPoints = layer.getLatLngs()[0];
        areaGeoJSON = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [polygonPoints.map(point => [point.lng, point.lat])]
          }
        };
        break;
      case 'rectangle':
        const rectanglePoints = layer.getLatLngs()[0];
        areaGeoJSON = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [rectanglePoints.map(point => [point.lng, point.lat])]
          }
        };
        break;
      case 'circle':
        const center = layer.getLatLng();
        const radius = layer.getRadius(); // in meters
        areaGeoJSON = turf.circle([center.lng, center.lat], radius / 1000, { steps: 64, units: 'kilometers' });
        break;
      default:
        console.warn('Unsupported layer type:', layerType);
        return;
    }

    // Set the selected area
    setSelectedArea({
      type: layerType,
      geoJSON: areaGeoJSON,
      layer
    });

    // Call the callback with the selected area
    onAreaSelected(areaGeoJSON);
  };

  // Handle area deletion
  const handleAreaDeleted = () => {
    setSelectedArea(null);
    onAreaSelected(null);
  };

  // Handle zone selection
  const handleZoneSelected = (zone) => {
    setSelectedZone(zone);
    onZoneSelected(zone);
  };

  // Generate climate impact visualization
  const renderClimateImpact = () => {
    if (!showClimateImpact) return null;

    const impactLevel = getImpactLevel();
    const total = totalCarbonFootprint();

    return (
        <div className={`climate-impact-overlay impact-${impactLevel}`}>
          <div className="impact-header">
            <h4>Climate Impact</h4>
            <span className={`impact-level ${impactLevel}`}>
            {impactLevel.charAt(0).toUpperCase() + impactLevel.slice(1)}
          </span>
          </div>

          <div className="impact-visualization">
            {selectedVisualization === 'heatmap' && (
                <div className="impact-heatmap">
                  <div
                      className="heatmap-indicator"
                      style={{
                        backgroundColor:
                            impactLevel === 'low' ? '#10b981' :
                                impactLevel === 'medium' ? '#f59e0b' :
                                    impactLevel === 'high' ? '#ef4444' :
                                        '#7f1d1d'
                      }}
                  />
                  <div className="heatmap-value">{total.toFixed(2)} kg CO₂e</div>
                </div>
            )}

            {selectedVisualization === 'bubble' && (
                <div className="impact-bubbles">
                  {assets.map((asset, index) => (
                      <div
                          key={asset.id || index}
                          className="impact-bubble"
                          style={{
                            width: `${Math.min(100, Math.max(20, asset.carbonIntensity / 10))}px`,
                            height: `${Math.min(100, Math.max(20, asset.carbonIntensity / 10))}px`,
                            backgroundColor: asset.isHardToDecarbonize ? '#ef4444' : '#10b981'
                          }}
                      >
                        <span className="bubble-label">{asset.name}</span>
                      </div>
                  ))}
                </div>
            )}

            {selectedVisualization === 'gradient' && (
                <div className="impact-gradient">
                  <div className="gradient-bar">
                    <div
                        className="gradient-indicator"
                        style={{
                          left: `${Math.min(100, (total / (regulatoryThresholds.federal?.threshold || 25000)) * 100)}%`
                        }}
                    />
                  </div>
                  <div className="gradient-labels">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                    <span>Critical</span>
                  </div>
                </div>
            )}
          </div>
        </div>
    );
  };

  // Generate regulatory zone overlay
  const renderRegulatoryZones = () => {
    if (!showRegulatoryZones) return null;

    const compliance = getRegulatoryCompliance();

    return (
        <div className="regulatory-zones-overlay">
          <div className="regulatory-header">
            <h4>Regulatory Compliance</h4>
            <span className={`compliance-status ${complianceStatus.overall}`}>
            {complianceStatus.overall === 'compliant' && 'Compliant'}
              {complianceStatus.overall === 'warning' && 'Warning'}
              {complianceStatus.overall === 'non-compliant' && 'Non-Compliant'}
          </span>
          </div>

          <div className="regulatory-zones">
            <div className={`regulatory-zone ${compliance.local}`}>
              <span className="zone-name">Local</span>
              <span className="zone-threshold">
              {regulatoryThresholds.local?.threshold.toLocaleString()} kg CO₂e
            </span>
              <span className={`zone-status ${compliance.local}`}>
              {compliance.local === 'compliant' && '✓'}
                {compliance.local === 'warning' && '⚠️'}
                {compliance.local === 'non-compliant' && '✗'}
            </span>
            </div>

            <div className={`regulatory-zone ${compliance.state}`}>
              <span className="zone-name">State</span>
              <span className="zone-threshold">
              {regulatoryThresholds.state?.threshold.toLocaleString()} kg CO₂e
            </span>
              <span className={`zone-status ${compliance.state}`}>
              {compliance.state === 'compliant' && '✓'}
                {compliance.state === 'warning' && '⚠️'}
                {compliance.state === 'non-compliant' && '✗'}
            </span>
            </div>

            <div className={`regulatory-zone ${compliance.federal}`}>
              <span className="zone-name">Federal</span>
              <span className="zone-threshold">
              {regulatoryThresholds.federal?.threshold.toLocaleString()} kg CO₂e
            </span>
              <span className={`zone-status ${compliance.federal}`}>
              {compliance.federal === 'compliant' && '✓'}
                {compliance.federal === 'warning' && '⚠️'}
                {compliance.federal === 'non-compliant' && '✗'}
            </span>
            </div>
          </div>
        </div>
    );
  };

  // Load boundary data for visualization
  const loadBoundaryData = async () => {
    // In a real implementation, this would make an API call to load boundary data
    // For now, we'll use mock data
    setTimeout(() => {
      const mockBoundaries = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'City Boundary', type: 'municipal' },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [coordinates.longitude - 0.05, coordinates.latitude - 0.05],
                [coordinates.longitude + 0.05, coordinates.latitude - 0.05],
                [coordinates.longitude + 0.05, coordinates.latitude + 0.05],
                [coordinates.longitude - 0.05, coordinates.latitude + 0.05],
                [coordinates.longitude - 0.05, coordinates.latitude - 0.05]
              ]]
            }
          },
          {
            type: 'Feature',
            properties: { name: 'County Boundary', type: 'county' },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [coordinates.longitude - 0.1, coordinates.latitude - 0.1],
                [coordinates.longitude + 0.1, coordinates.latitude - 0.1],
                [coordinates.longitude + 0.1, coordinates.latitude + 0.1],
                [coordinates.longitude - 0.1, coordinates.latitude + 0.1],
                [coordinates.longitude - 0.1, coordinates.latitude - 0.1]
              ]]
            }
          }
        ]
      };

      setBoundaryData(mockBoundaries);
    }, 300);
  };

  // Load boundary data when showBoundaries changes
  useEffect(() => {
    if (showBoundaries && !boundaryData) {
      loadBoundaryData();
    }
  }, [showBoundaries, boundaryData, coordinates]);

  // Render the map overlays
  const renderMapOverlays = () => {
    return (
        <div className="map-container">
          <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '400px', width: '100%' }}
              whenCreated={mapInstance => {
                mapRef.current = mapInstance;
              }}
          >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Feature group for drawings */}
            <FeatureGroup ref={featureGroupRef}>
              <EditControl
                  position="topright"
                  onCreated={handleAreaCreated}
                  onDeleted={handleAreaDeleted}
                  draw={{
                    rectangle: true,
                    polygon: true,
                    circle: true,
                    circlemarker: false,
                    marker: false,
                    polyline: false
                  }}
              />
            </FeatureGroup>

            {/* Render assets */}
            {assets.map((asset, index) => (
                <Circle
                    key={asset.id || `asset-${index}`}
                    center={[coordinates.latitude, coordinates.longitude]}
                    radius={Math.max(50, asset.carbonIntensity * 2)}
                    pathOptions={{
                      color: asset.isHardToDecarbonize ? '#ef4444' : '#10b981',
                      fillColor: asset.isHardToDecarbonize ? '#fee2e2' : '#d1fae5',
                      fillOpacity: 0.6
                    }}
                >
                  <Tooltip>
                    <div>
                      <strong>{asset.name}</strong>
                      <div>Type: {asset.type}</div>
                      <div>Carbon Intensity: {asset.carbonIntensity} kg CO₂e</div>
                    </div>
                  </Tooltip>
                </Circle>
            ))}

            {/* Render zones */}
            {showZones && zones.map(zone => {
              // Different rendering based on zone type
              if (zone.type === 'circle') {
                return (
                    <Circle
                        key={zone.id}
                        center={[zone.coordinates.latitude, zone.coordinates.longitude]}
                        radius={zone.radius || 500}
                        pathOptions={{
                          color: zone.id === selectedZone?.id ? '#3b82f6' : '#4ade80',
                          fillColor: zone.id === selectedZone?.id ? '#93c5fd' : '#bbf7d0',
                          fillOpacity: 0.4,
                          weight: zone.id === selectedZone?.id ? 3 : 2
                        }}
                        eventHandlers={{
                          click: () => handleZoneSelected(zone)
                        }}
                    >
                      <Tooltip>
                        <div>
                          <strong>{zone.name}</strong>
                          <div>Type: {zone.type}</div>
                          {zone.area && <div>Area: {(zone.area / 1000000).toFixed(2)} km²</div>}
                        </div>
                      </Tooltip>
                    </Circle>
                );
              } else if (zone.geoJSON) {
                // For polygons from GeoJSON
                const coordinates = zone.geoJSON.geometry.coordinates[0].map(
                    coord => [coord[1], coord[0]]
                );

                return (
                    <Polygon
                        key={zone.id}
                        positions={coordinates}
                        pathOptions={{
                          color: zone.id === selectedZone?.id ? '#3b82f6' : '#4ade80',
                          fillColor: zone.id === selectedZone?.id ? '#93c5fd' : '#bbf7d0',
                          fillOpacity: 0.4,
                          weight: zone.id === selectedZone?.id ? 3 : 2
                        }}
                        eventHandlers={{
                          click: () => handleZoneSelected(zone)
                        }}
                    >
                      <Tooltip>
                        <div>
                          <strong>{zone.name}</strong>
                          <div>Type: {zone.type}</div>
                          {zone.area && <div>Area: {(zone.area / 1000000).toFixed(2)} km²</div>}
                        </div>
                      </Tooltip>
                    </Polygon>
                );
              } else {
                // Default square zone around coordinates
                return (
                    <Rectangle
                        key={zone.id}
                        bounds={[
                          [zone.coordinates.latitude - 0.005, zone.coordinates.longitude - 0.005],
                          [zone.coordinates.latitude + 0.005, zone.coordinates.longitude + 0.005]
                        ]}
                        pathOptions={{
                          color: zone.id === selectedZone?.id ? '#3b82f6' : '#4ade80',
                          fillColor: zone.id === selectedZone?.id ? '#93c5fd' : '#bbf7d0',
                          fillOpacity: 0.4,
                          weight: zone.id === selectedZone?.id ? 3 : 2
                        }}
                        eventHandlers={{
                          click: () => handleZoneSelected(zone)
                        }}
                    >
                      <Tooltip>
                        <div>
                          <strong>{zone.name}</strong>
                          <div>Type: Default</div>
                        </div>
                      </Tooltip>
                    </Rectangle>
                );
              }
            })}

            {/* Render boundary data */}
            {showBoundaries && boundaryData && boundaryData.features.map((feature, index) => {
              const coordinates = feature.geometry.coordinates[0].map(
                  coord => [coord[1], coord[0]]
              );

              return (
                  <Polygon
                      key={`boundary-${index}`}
                      positions={coordinates}
                      pathOptions={{
                        color: '#6366f1',
                        fillColor: '#a5b4fc',
                        fillOpacity: 0.2,
                        weight: 2,
                        dashArray: '5, 5'
                      }}
                  >
                    <Tooltip>
                      <div>
                        <strong>{feature.properties.name}</strong>
                        <div>Type: {feature.properties.type}</div>
                      </div>
                    </Tooltip>
                  </Polygon>
              );
            })}
          </MapContainer>
        </div>
    );
  };

  return (
      <div className="climate-map-overlay">
        <div className="overlay-controls">
          <div className="overlay-toggles">
            <label>
              <input
                  type="checkbox"
                  checked={showClimateImpact}
                  onChange={() => setShowClimateImpact(!showClimateImpact)}
              />
              Show Climate Impact
            </label>

            <label>
              <input
                  type="checkbox"
                  checked={showRegulatoryZones}
                  onChange={() => setShowRegulatoryZones(!showRegulatoryZones)}
              />
              Show Regulatory Zones
            </label>

            <label>
              <input
                  type="checkbox"
                  checked={showZones}
                  onChange={() => setShowZones(!showZones)}
              />
              Show Generated Zones
            </label>

            <label>
              <input
                  type="checkbox"
                  checked={showBoundaries}
                  onChange={() => setShowBoundaries(!showBoundaries)}
              />
              Show Boundaries
            </label>
          </div>

          <div className="visualization-selector">
            <span>Visualization:</span>
            <select
                value={selectedVisualization}
                onChange={(e) => setSelectedVisualization(e.target.value)}
            >
              <option value="heatmap">Heatmap</option>
              <option value="bubble">Bubble Chart</option>
              <option value="gradient">Gradient Scale</option>
            </select>
          </div>
        </div>

        <div className="overlay-content">
          {renderMapOverlays()}
          {renderClimateImpact()}
          {renderRegulatoryZones()}
        </div>

        {/* Status bar */}
        <div className="overlay-status-bar">
          {selectedArea && (
              <div className="selected-area-info">
                <span>Selected Area: {selectedArea.type}</span>
                {selectedArea.geoJSON && (
                    <span>Area: {(turf.area(selectedArea.geoJSON) / 1000000).toFixed(2)} km²</span>
                )}
              </div>
          )}

          {selectedZone && (
              <div className="selected-zone-info">
                <span>Selected Zone: {selectedZone.name}</span>
                <span>Coordinates: {selectedZone.coordinates.latitude.toFixed(4)}, {selectedZone.coordinates.longitude.toFixed(4)}</span>
              </div>
          )}
        </div>
      </div>
  );
};

ClimateMapOverlay.propTypes = {
  coordinates: PropTypes.shape({
    longitude: PropTypes.number,
    latitude: PropTypes.number
  }),
  assets: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        type: PropTypes.string,
        carbonIntensity: PropTypes.number,
        isHardToDecarbonize: PropTypes.bool
      })
  ),
  carbonFootprints: PropTypes.object,
  regulatoryThresholds: PropTypes.object,
  complianceStatus: PropTypes.object,
  zones: PropTypes.array,
  onAreaSelected: PropTypes.func,
  onZoneSelected: PropTypes.func
};

export default ClimateMapOverlay;