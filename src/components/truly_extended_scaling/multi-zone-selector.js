// MultiZoneSelector.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import * as turf from '@turf/turf';
import { MapContainer, TileLayer, FeatureGroup, Polygon, Circle, Rectangle, useMapEvents } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import '../../styles/HomePage.CSS/MultiZoneSelector.css';
import UnifiedTooltip from '../../unified-tooltip';

// Base URL for boundary file downloads
const BOUNDARY_FILE_BASE_URL = 'https://api.climate-data-service.org/boundaries';

/**
 * Component for map interactions and capturing events
 */
const MapEventHandler = ({ onMapClick, onMapMove }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e);
    },
    moveend: (e) => {
      onMapMove(e);
    }
  });
  return null;
};

/**
 * MultiZoneSelector Component
 * 
 * A component for selecting multiple zones spanning a convex area from a map.
 * Automatically translates selected areas to a number of zones by default specification
 * and provides options for downloading boundary files.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onZonesSelected - Callback when zones are selected
 * @param {Array} props.existingZones - Array of existing zones
 * @param {Object} props.boundaryOptions - Options for boundary file downloads
 */
const MultiZoneSelector = ({
  onZonesSelected = () => {},
  existingZones = [],
  boundaryOptions = {
    enableCountry: true,
    enableState: true,
    enableCounty: true,
    formats: ['geojson', 'shapefile', 'tif', 'country_sf'],
    include3D: true,
    includeElevation: true
  }
}) => {
  // Refs
  const mapRef = useRef(null);
  const featuresRef = useRef(null);

  // State for selected area
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedPolygon, setSelectedPolygon] = useState(null);

  // State for zone generation options
  const [zoneOptions, setZoneOptions] = useState({
    areaUnit: 'km2', // 'm2', 'km2', 'acres', 'hectares'
    geometry: 'square', // 'square', 'round', 'hex'
    size: 1, // Size in selected units (area for square/hex, radius for round)
    autoGenerate: true, // Auto-generate zones when area selected
    maxZones: 50, // Max number of zones to generate
    namePattern: 'Zone-{i}' // Pattern for zone names
  });

  // State for generatedZones
  const [generatedZones, setGeneratedZones] = useState([]);

  // State for loading
  const [loading, setLoading] = useState(false);

  // State for boundary layer and downloads
  const [boundaryLayers, setBoundaryLayers] = useState({
    country: [],
    state: [],
    county: []
  });

  // State for selected boundary
  const [selectedBoundary, setSelectedBoundary] = useState(null);

  // State for UI
  const [activeTab, setActiveTab] = useState('draw'); // 'draw', 'zones', 'boundaries'
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]); // Default to London
  const [mapZoom, setMapZoom] = useState(13);
  const [viewportChanged, setViewportChanged] = useState(false);

  // Convert area units to square meters
  const convertToSquareMeters = useCallback((value, unit) => {
    switch (unit) {
      case 'm2':
        return value;
      case 'km2':
        return value * 1000000;
      case 'acres':
        return value * 4046.86;
      case 'hectares':
        return value * 10000;
      default:
        return value;
    }
  }, []);

  // Convert square meters to selected unit
  const convertFromSquareMeters = useCallback((value, unit) => {
    switch (unit) {
      case 'm2':
        return value;
      case 'km2':
        return value / 1000000;
      case 'acres':
        return value / 4046.86;
      case 'hectares':
        return value / 10000;
      default:
        return value;
    }
  }, []);

  // Format area display
  const formatArea = useCallback((area, unit) => {
    const formatted = convertFromSquareMeters(area, unit);
    return `${formatted.toFixed(2)} ${unit}`;
  }, [convertFromSquareMeters]);

  // Format point list for display
  const formatPointList = useCallback((points) => {
    if (!points || !Array.isArray(points)) return '';
    return points.map(point => {
      if (Array.isArray(point)) {
        return `[${point[0].toFixed(6)}, ${point[1].toFixed(6)}]`;
      } else {
        return `[${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}]`;
      }
    }).join(', ');
  }, []);

  // Handle area selection from drawn shapes
  const handleAreaSelected = useCallback((e) => {
    const { layerType, layer } = e;

    // Clear existing layers
    if (featuresRef.current) {
      // Keep only the newly created layer
      const layers = featuresRef.current.getLayers();
      layers.forEach(l => {
        if (l !== layer) {
          featuresRef.current.removeLayer(l);
        }
      });
    }

    let selectedGeoJSON = null;
    let area = 0;
    let polygon = null;

    switch (layerType) {
      case 'polygon':
        polygon = layer.getLatLngs()[0];
        selectedGeoJSON = {
          type: 'Polygon',
          coordinates: [polygon.map(point => [point.lng, point.lat])]
        };
        area = turf.area(selectedGeoJSON);
        break;
      case 'rectangle':
        polygon = layer.getLatLngs()[0];
        selectedGeoJSON = {
          type: 'Polygon',
          coordinates: [polygon.map(point => [point.lng, point.lat])]
        };
        area = turf.area(selectedGeoJSON);
        break;
      case 'circle':
        const center = layer.getLatLng();
        const radius = layer.getRadius(); // in meters

        selectedGeoJSON = turf.circle([center.lng, center.lat], radius / 1000); // radius in km
        area = Math.PI * radius * radius; // πr²

        // Get the polygon points from the GeoJSON
        polygon = selectedGeoJSON.geometry.coordinates[0].map(
          coord => ({ lat: coord[1], lng: coord[0] })
        );
        break;
      default:
        console.warn('Unsupported layer type:', layerType);
        return;
    }

    setSelectedArea({
      type: layerType,
      geoJSON: selectedGeoJSON,
      area: area,
      center: layerType === 'circle' 
        ? layer.getLatLng() 
        : turf.center(selectedGeoJSON).geometry.coordinates
    });

    setSelectedPolygon(polygon);

    // Auto generate zones if enabled
    if (zoneOptions.autoGenerate) {
      generateZones(selectedGeoJSON, area, polygon);
    }

    // Search for intersecting boundary layers
    findIntersectingBoundaries(selectedGeoJSON);
  }, [zoneOptions.autoGenerate]);

  // Handle deleting drawn shapes
  const handleAreaDeleted = useCallback(() => {
    setSelectedArea(null);
    setSelectedPolygon(null);
    setGeneratedZones([]);
    setSelectedBoundary(null);
  }, []);

  // Generate zones within the selected area
  const generateZones = useCallback((geoJSON, totalArea, polygon) => {
    setLoading(true);

    // Defer calculation to not block the UI
    setTimeout(() => {
      try {
        const zoneSize = convertToSquareMeters(zoneOptions.size, zoneOptions.areaUnit);
        let zones = [];

        // Calculate approximately how many zones will fit
        const numberOfZones = Math.min(
          Math.floor(totalArea / zoneSize),
          zoneOptions.maxZones
        );

        if (numberOfZones <= 0) {
          setGeneratedZones([]);
          setLoading(false);
          return;
        }

        // Generate zones based on geometry type
        switch (zoneOptions.geometry) {
          case 'square': {
            // For square zones, create a grid
            const bbox = turf.bbox(geoJSON);
            const squareSideLength = Math.sqrt(zoneSize);

            // Calculate how many squares fit in each dimension
            const width = turf.distance(
              [bbox[0], bbox[1]],
              [bbox[2], bbox[1]],
              { units: 'meters' }
            );
            const height = turf.distance(
              [bbox[0], bbox[1]],
              [bbox[0], bbox[3]],
              { units: 'meters' }
            );

            const columns = Math.min(Math.floor(width / squareSideLength), Math.ceil(Math.sqrt(numberOfZones)));
            const rows = Math.min(Math.floor(height / squareSideLength), Math.ceil(numberOfZones / columns));

            // Create grid cells
            const cellWidth = (bbox[2] - bbox[0]) / columns;
            const cellHeight = (bbox[3] - bbox[1]) / rows;

            let zoneIndex = 0;
            for (let i = 0; i < rows && zoneIndex < numberOfZones; i++) {
              for (let j = 0; j < columns && zoneIndex < numberOfZones; j++) {
                const cell = [
                  [bbox[0] + j * cellWidth, bbox[1] + i * cellHeight],
                  [bbox[0] + (j + 1) * cellWidth, bbox[1] + i * cellHeight],
                  [bbox[0] + (j + 1) * cellWidth, bbox[1] + (i + 1) * cellHeight],
                  [bbox[0] + j * cellWidth, bbox[1] + (i + 1) * cellHeight],
                  [bbox[0] + j * cellWidth, bbox[1] + i * cellHeight], // Close the polygon
                ];

                const cellPolygon = {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [cell]
                  }
                };

                // Only include cells that intersect with the selected area
                if (turf.booleanIntersects(cellPolygon, geoJSON)) {
                  // Get the intersection of the cell and the selected area
                  let intersectedCell;
                  try {
                    intersectedCell = turf.intersect(cellPolygon, geoJSON);
                  } catch (e) {
                    // If intersection fails, just use the original cell
                    intersectedCell = cellPolygon;
                  }

                  if (intersectedCell) {
                    const zoneName = zoneOptions.namePattern.replace('{i}', zoneIndex + 1);
                    const zoneCenter = turf.center(intersectedCell).geometry.coordinates;

                    zones.push({
                      id: `zone-${Date.now()}-${zoneIndex}`,
                      name: zoneName,
                      type: 'square',
                      geoJSON: intersectedCell,
                      center: { lat: zoneCenter[1], lng: zoneCenter[0] },
                      area: turf.area(intersectedCell),
                      coordinates: {
                        longitude: zoneCenter[0],
                        latitude: zoneCenter[1]
                      }
                    });

                    zoneIndex++;
                  }
                }
              }
            }
            break;
          }

          case 'round': {
            // For round zones, create circle packing
            // This is a simplified approach - advanced circle packing is more complex
            const center = turf.center(geoJSON).geometry.coordinates;
            const radiusInMeters = Math.sqrt(zoneSize / Math.PI);

            // Create a single center circle
            const centerCircle = {
              id: `zone-${Date.now()}-0`,
              name: zoneOptions.namePattern.replace('{i}', 1),
              type: 'round',
              center: { lat: center[1], lng: center[0] },
              radius: radiusInMeters,
              area: Math.PI * radiusInMeters * radiusInMeters,
              coordinates: {
                longitude: center[0],
                latitude: center[1]
              }
            };

            zones.push(centerCircle);

            // Place additional circles in rings around the center
            // For a first ring, we can fit about 6 circles
            if (numberOfZones > 1) {
              const rings = Math.ceil(Math.log2(numberOfZones));
              let zoneIndex = 1;

              for (let ring = 1; ring <= rings && zoneIndex < numberOfZones; ring++) {
                // Each ring can fit approximately 6 * ring circles
                const circlesInRing = 6 * ring;
                const ringRadius = radiusInMeters * 2 * ring;

                for (let i = 0; i < circlesInRing && zoneIndex < numberOfZones; i++) {
                  const angle = (2 * Math.PI * i) / circlesInRing;
                  const x = center[0] + (ringRadius / 111320) * Math.cos(angle); // 111320 meters = 1 degree longitude at equator
                  const y = center[1] + (ringRadius / 110540) * Math.sin(angle); // 110540 meters = 1 degree latitude

                  // Check if the circle is within or intersects the selected area
                  const circleGeoJSON = turf.circle([x, y], radiusInMeters / 1000); // radius in km

                  if (turf.booleanIntersects(circleGeoJSON, geoJSON)) {
                    const zoneName = zoneOptions.namePattern.replace('{i}', zoneIndex + 1);

                    zones.push({
                      id: `zone-${Date.now()}-${zoneIndex}`,
                      name: zoneName,
                      type: 'round',
                      center: { lat: y, lng: x },
                      radius: radiusInMeters,
                      area: Math.PI * radiusInMeters * radiusInMeters,
                      coordinates: {
                        longitude: x,
                        latitude: y
                      }
                    });

                    zoneIndex++;
                  }
                }
              }
            }
            break;
          }

          case 'hex': {
            // For hexagonal zones, create a hex grid
            const bbox = turf.bbox(geoJSON);

            // Calculate hex side length from desired area
            // Area of a regular hexagon = (3√3/2) * s², where s is the side length
            const hexSideLength = Math.sqrt((2 * zoneSize) / (3 * Math.sqrt(3)));

            // Height of a hex is 2 * apothem, where apothem = (√3/2) * side
            const hexHeight = 2 * ((Math.sqrt(3) / 2) * hexSideLength);
            // Width of a hex is 2 * side
            const hexWidth = 2 * hexSideLength;

            // Calculate grid dimensions
            const width = turf.distance(
              [bbox[0], bbox[1]],
              [bbox[2], bbox[1]],
              { units: 'meters' }
            );
            const height = turf.distance(
              [bbox[0], bbox[1]],
              [bbox[0], bbox[3]],
              { units: 'meters' }
            );

            const columns = Math.min(Math.floor(width / (hexWidth * 0.75)), Math.ceil(Math.sqrt(numberOfZones)));
            const rows = Math.min(Math.floor(height / hexHeight), Math.ceil(numberOfZones / columns));

            // Convert to degrees for longitude and latitude
            const hexWidthDeg = hexWidth / (111320 * Math.cos(bbox[1] * Math.PI / 180));
            const hexHeightDeg = hexHeight / 110540;

            let zoneIndex = 0;
            for (let i = 0; i < rows && zoneIndex < numberOfZones; i++) {
              for (let j = 0; j < columns && zoneIndex < numberOfZones; j++) {
                // Offset every other row to create the hex pattern
                const offset = (i % 2 === 0) ? 0 : hexWidthDeg * 0.5;
                const centerLon = bbox[0] + (j * hexWidthDeg * 0.75) + offset + (hexWidthDeg * 0.5);
                const centerLat = bbox[1] + (i * hexHeightDeg) + (hexHeightDeg * 0.5);

                // Create hexagon points (approximated as a circle with 6 points)
                const hexPoints = [];
                for (let k = 0; k < 6; k++) {
                  const angle = (2 * Math.PI * k) / 6;
                  const x = centerLon + (hexWidthDeg * 0.5) * Math.cos(angle);
                  const y = centerLat + (hexHeightDeg * 0.5) * Math.sin(angle);
                  hexPoints.push([x, y]);
                }
                hexPoints.push(hexPoints[0]); // Close the polygon

                const hexPolygon = {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [hexPoints]
                  }
                };

                // Only include hexes that intersect with the selected area
                if (turf.booleanIntersects(hexPolygon, geoJSON)) {
                  // Get the intersection of the hex and the selected area
                  let intersectedHex;
                  try {
                    intersectedHex = turf.intersect(hexPolygon, geoJSON);
                  } catch (e) {
                    // If intersection fails, just use the original hex
                    intersectedHex = hexPolygon;
                  }

                  if (intersectedHex) {
                    const zoneName = zoneOptions.namePattern.replace('{i}', zoneIndex + 1);
                    const zoneCenter = [centerLon, centerLat];

                    zones.push({
                      id: `zone-${Date.now()}-${zoneIndex}`,
                      name: zoneName,
                      type: 'hex',
                      geoJSON: intersectedHex,
                      center: { lat: zoneCenter[1], lng: zoneCenter[0] },
                      area: turf.area(intersectedHex),
                      coordinates: {
                        longitude: zoneCenter[0],
                        latitude: zoneCenter[1]
                      }
                    });

                    zoneIndex++;
                  }
                }
              }
            }
            break;
          }
        }

        // Update generated zones state
        setGeneratedZones(zones);

        // Notify parent component
        onZonesSelected(zones);
      } catch (error) {
        console.error('Error generating zones:', error);
      } finally {
        setLoading(false);
      }
    }, 0);
  }, [zoneOptions, convertToSquareMeters, onZonesSelected]);

  // Find intersecting boundary layers
  const findIntersectingBoundaries = useCallback(async (geoJSON) => {
    setLoading(true);

    try {
      // In a real implementation, this would make API calls to a GIS service
      // Here we're simulating the process with setTimeout

      // Simulate API call latency
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock data - in a real implementation, this would be from an API
      const mockBoundaries = {
        country: [
          { id: 'C1', name: 'United Kingdom', type: 'country', intersects: true },
          { id: 'C2', name: 'France', type: 'country', intersects: false }
        ],
        state: [
          { id: 'S1', name: 'Greater London', type: 'state', intersects: true },
          { id: 'S2', name: 'South East England', type: 'state', intersects: false }
        ],
        county: [
          { id: 'CT1', name: 'Westminster', type: 'county', intersects: true },
          { id: 'CT2', name: 'Camden', type: 'county', intersects: true },
          { id: 'CT3', name: 'Islington', type: 'county', intersects: false }
        ]
      };

      // Filter for intersecting boundaries only
      const intersectingBoundaries = {
        country: mockBoundaries.country.filter(b => b.intersects),
        state: mockBoundaries.state.filter(b => b.intersects),
        county: mockBoundaries.county.filter(b => b.intersects)
      };

      setBoundaryLayers(intersectingBoundaries);
    } catch (error) {
      console.error('Error finding intersecting boundaries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate download URL for boundary file
  const getBoundaryDownloadUrl = useCallback((boundary, format, options = {}) => {
    const { include3D, includeElevation } = options;
    const baseUrl = BOUNDARY_FILE_BASE_URL;
    let url = `${baseUrl}/${boundary.type}/${boundary.id}?format=${format}`;

    if (include3D) {
      url += '&include3D=true';
    }

    if (includeElevation) {
      url += '&includeElevation=true';
    }

    return url;
  }, []);

  // Handle map click
  const handleMapClick = useCallback((e) => {
    // If no feature group or in view mode, do nothing
    if (!featuresRef.current || activeTab !== 'draw') return;

    // Get the clicked location
    const { lat, lng } = e.latlng;

    // Check if click is within a zone
    let clickInZone = false;
    generatedZones.forEach(zone => {
      // For polygon zones
      if (zone.geoJSON) {
        const point = turf.point([lng, lat]);
        if (turf.booleanPointInPolygon(point, zone.geoJSON)) {
          clickInZone = true;

          setTooltipContent({
            type: 'zone',
            zone: zone
          });

          setTooltipPosition({ x: e.containerPoint.x, y: e.containerPoint.y });
          setShowTooltip(true);
        }
      } 
      // For circle zones
      else if (zone.type === 'round') {
        const distance = turf.distance(
          [lng, lat],
          [zone.center.lng, zone.center.lat],
          { units: 'meters' }
        );

        if (distance <= zone.radius) {
          clickInZone = true;

          setTooltipContent({
            type: 'zone',
            zone: zone
          });

          setTooltipPosition({ x: e.containerPoint.x, y: e.containerPoint.y });
          setShowTooltip(true);
        }
      }
    });

    if (!clickInZone) {
      setShowTooltip(false);
    }
  }, [generatedZones, activeTab]);

  // Handle map move
  const handleMapMove = useCallback((e) => {
    const map = e.target;
    setMapCenter(map.getCenter());
    setMapZoom(map.getZoom());
    setViewportChanged(true);
  }, []);

  // Handle zone option change
  const handleZoneOptionChange = useCallback((option, value) => {
    setZoneOptions(prev => ({
      ...prev,
      [option]: value
    }));
  }, []);

  // Handle generate zones button click
  const handleGenerateZones = useCallback(() => {
    if (selectedArea && selectedPolygon) {
      generateZones(selectedArea.geoJSON, selectedArea.area, selectedPolygon);
    }
  }, [selectedArea, selectedPolygon, generateZones]);

  // Handle boundary selection
  const handleBoundarySelect = useCallback((boundary) => {
    setSelectedBoundary(boundary);
  }, []);

  // Handle download button click
  const handleDownloadBoundary = useCallback((format) => {
    if (!selectedBoundary) return;

    const url = getBoundaryDownloadUrl(selectedBoundary, format, {
      include3D: boundaryOptions.include3D,
      includeElevation: boundaryOptions.includeElevation
    });

    // Trigger the download (in a real implementation, this would be a proper download)
    window.open(url, '_blank');
  }, [selectedBoundary, boundaryOptions, getBoundaryDownloadUrl]);

  // Render boundary selection options
  const renderBoundaryOptions = useCallback(() => {
    return (
      <div className="multi-zone-boundary-selection">
        <h4>Available Boundaries</h4>

        {loading ? (
          <div className="multi-zone-loading">Loading boundaries...</div>
        ) : (
          <div className="multi-zone-boundary-tabs">
            {boundaryOptions.enableCountry && boundaryLayers.country.length > 0 && (
              <div className="multi-zone-boundary-tab">
                <h5>Countries</h5>
                <ul className="multi-zone-boundary-list">
                  {boundaryLayers.country.map(boundary => (
                    <li 
                      key={boundary.id}
                      className={`multi-zone-boundary-item ${selectedBoundary?.id === boundary.id ? 'selected' : ''}`}
                      onClick={() => handleBoundarySelect(boundary)}
                    >
                      {boundary.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {boundaryOptions.enableState && boundaryLayers.state.length > 0 && (
              <div className="multi-zone-boundary-tab">
                <h5>States/Provinces</h5>
                <ul className="multi-zone-boundary-list">
                  {boundaryLayers.state.map(boundary => (
                    <li 
                      key={boundary.id}
                      className={`multi-zone-boundary-item ${selectedBoundary?.id === boundary.id ? 'selected' : ''}`}
                      onClick={() => handleBoundarySelect(boundary)}
                    >
                      {boundary.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {boundaryOptions.enableCounty && boundaryLayers.county.length > 0 && (
              <div className="multi-zone-boundary-tab">
                <h5>Counties/Districts</h5>
                <ul className="multi-zone-boundary-list">
                  {boundaryLayers.county.map(boundary => (
                    <li 
                      key={boundary.id}
                      className={`multi-zone-boundary-item ${selectedBoundary?.id === boundary.id ? 'selected' : ''}`}
                      onClick={() => handleBoundarySelect(boundary)}
                    >
                      {boundary.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(!boundaryLayers.country.length && !boundaryLayers.state.length && !boundaryLayers.county.length) && (
              <div className="multi-zone-no-boundaries">
                No boundaries found for the selected area. Try selecting a larger area or a different location.
              </div>
            )}
          </div>
        )}

        {selectedBoundary && (
          <div className="multi-zone-boundary-download">
            <h4>Download Boundary: {selectedBoundary.name}</h4>
            <div className="multi-zone-download-options">
              <div className="multi-zone-format-options">
                {boundaryOptions.formats.map(format => (
                  <button 
                    key={format}
                    className="multi-zone-download-button"
                    onClick={() => handleDownloadBoundary(format)}
                  >
                    Download {format.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="multi-zone-advanced-options">
                <label>
                  <input 
                    type="checkbox" 
                    checked={boundaryOptions.include3D}
                    onChange={() => boundaryOptions.include3D = !boundaryOptions.include3D}
                  />
                  Include 3D
                </label>

                <label>
                  <input 
                    type="checkbox" 
                    checked={boundaryOptions.includeElevation}
                    onChange={() => boundaryOptions.includeElevation = !boundaryOptions.includeElevation}
                  />
                  Include Elevation
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }, [
    loading, 
    boundaryLayers, 
    selectedBoundary, 
    boundaryOptions, 
    handleBoundarySelect, 
    handleDownloadBoundary
  ]);

  // Render zone options panel
  const renderZoneOptions = useCallback(() => {
    return (
      <div className="multi-zone-options-panel">
        <h4>Zone Generation Options</h4>

        <div className="multi-zone-option-group">
          <label htmlFor="zone-area-unit">Area Unit:</label>
          <select
            id="zone-area-unit"
            value={zoneOptions.areaUnit}
            onChange={(e) => handleZoneOptionChange('areaUnit', e.target.value)}
          >
            <option value="m2">Square Meters (m²)</option>
            <option value="km2">Square Kilometers (km²)</option>
            <option value="acres">Acres</option>
            <option value="hectares">Hectares</option>
          </select>
        </div>

        <div className="multi-zone-option-group">
          <label htmlFor="zone-geometry">Zone Geometry:</label>
          <select
            id="zone-geometry"
            value={zoneOptions.geometry}
            onChange={(e) => handleZoneOptionChange('geometry', e.target.value)}
          >
            <option value="square">Square Grid</option>
            <option value="round">Round/Circular</option>
            <option value="hex">Hexagonal Grid</option>
          </select>
        </div>

        <div className="multi-zone-option-group">
          <label htmlFor="zone-size">
            {zoneOptions.geometry === 'round' ? 'Radius' : 'Area'} Size:
          </label>
          <input
            id="zone-size"
            type="number"
            min="0.1"
            step="0.1"
            value={zoneOptions.size}
            onChange={(e) => handleZoneOptionChange('size', parseFloat(e.target.value) || 1)}
          />
          <span className="multi-zone-unit-label">
            {zoneOptions.geometry === 'round' 
              ? zoneOptions.areaUnit === 'km2' ? 'km' : 'm'
              : zoneOptions.areaUnit}
          </span>
        </div>

        <div className="multi-zone-option-group">
          <label htmlFor="zone-max">Maximum Zones:</label>
          <input
            id="zone-max"
            type="number"
            min="1"
            max="500"
            value={zoneOptions.maxZones}
            onChange={(e) => handleZoneOptionChange('maxZones', parseInt(e.target.value) || 50)}
          />
        </div>

        <div className="multi-zone-option-group">
          <label htmlFor="zone-name-pattern">Name Pattern:</label>
          <input
            id="zone-name-pattern"
            type="text"
            value={zoneOptions.namePattern}
            onChange={(e) => handleZoneOptionChange('namePattern', e.target.value)}
          />
          <small>Use {'{i}'} for index number</small>
        </div>

        <div className="multi-zone-option-group multi-zone-checkbox-group">
          <label htmlFor="zone-auto-generate">
            <input
              id="zone-auto-generate"
              type="checkbox"
              checked={zoneOptions.autoGenerate}
              onChange={(e) => handleZoneOptionChange('autoGenerate', e.target.checked)}
            />
            Auto-generate zones on selection
          </label>
        </div>

        <button 
          className="multi-zone-generate-button"
          onClick={handleGenerateZones}
          disabled={!selectedArea || loading}
        >
          {loading ? 'Generating...' : 'Generate Zones'}
        </button>
      </div>
    );
  }, [zoneOptions, selectedArea, loading, handleZoneOptionChange, handleGenerateZones]);

  // Render generated zones overview
  const renderZonesOverview = useCallback(() => {
    return (
      <div className="multi-zone-overview">
        <h4>Generated Zones</h4>

        {loading ? (
          <div className="multi-zone-loading">Generating zones...</div>
        ) : generatedZones.length === 0 ? (
          <div className="multi-zone-no-zones">
            No zones generated yet. Draw an area on the map and click "Generate Zones".
          </div>
        ) : (
          <>
            <div className="multi-zone-summary">
              <div className="multi-zone-summary-item">
                <span className="multi-zone-summary-label">Total Zones:</span>
                <span className="multi-zone-summary-value">{generatedZones.length}</span>
              </div>

              <div className="multi-zone-summary-item">
                <span className="multi-zone-summary-label">Total Area:</span>
                <span className="multi-zone-summary-value">
                  {formatArea(generatedZones.reduce((sum, zone) => sum + zone.area, 0), zoneOptions.areaUnit)}
                </span>
              </div>

              <div className="multi-zone-summary-item">
                <span className="multi-zone-summary-label">Zone Type:</span>
                <span className="multi-zone-summary-value">
                  {zoneOptions.geometry.charAt(0).toUpperCase() + zoneOptions.geometry.slice(1)}
                </span>
              </div>
            </div>

            <div className="multi-zone-list">
              {generatedZones.map(zone => (
                <motion.div 
                  key={zone.id}
                  className="multi-zone-list-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="multi-zone-list-header">
                    <span className="multi-zone-name">{zone.name}</span>
                    <span className="multi-zone-type">{zone.type}</span>
                  </div>

                  <div className="multi-zone-list-details">
                    <div className="multi-zone-detail">
                      <span className="multi-zone-detail-label">Coordinates:</span>
                      <span className="multi-zone-detail-value">
                        {zone.coordinates.latitude.toFixed(6)}, {zone.coordinates.longitude.toFixed(6)}
                      </span>
                    </div>

                    <div className="multi-zone-detail">
                      <span className="multi-zone-detail-label">Area:</span>
                      <span className="multi-zone-detail-value">
                        {formatArea(zone.area, zoneOptions.areaUnit)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }, [generatedZones, loading, zoneOptions.areaUnit, zoneOptions.geometry, formatArea]);

  return (
    <div className="multi-zone-selector">
      <div className="multi-zone-tabs">
        <button 
          className={`multi-zone-tab ${activeTab === 'draw' ? 'active' : ''}`}
          onClick={() => setActiveTab('draw')}
        >
          Draw Area
        </button>
        <button 
          className={`multi-zone-tab ${activeTab === 'zones' ? 'active' : ''}`}
          onClick={() => setActiveTab('zones')}
        >
          Generated Zones
        </button>
        <button 
          className={`multi-zone-tab ${activeTab === 'boundaries' ? 'active' : ''}`}
          onClick={() => setActiveTab('boundaries')}
        >
          Boundary Downloads
        </button>
      </div>

      <div className="multi-zone-content">
        <div className="multi-zone-map-container">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%" }}
            whenCreated={map => {
              mapRef.current = map;
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapEventHandler onMapClick={handleMapClick} onMapMove={handleMapMove} />

            <FeatureGroup ref={featuresRef}>
              {activeTab === 'draw' && (
                <EditControl
                  position="topleft"
                  onCreated={handleAreaSelected}
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
              )}
            </FeatureGroup>

            {/* Render the selected polygon */}
            {selectedPolygon && activeTab !== 'draw' && (
              <Polygon 
                positions={selectedPolygon} 
                pathOptions={{ color: '#3388ff', fillOpacity: 0.2 }}
              />
            )}

            {/* Render the generated zones */}
            {generatedZones.map(zone => {
              if (zone.type === 'round') {
                return (
                  <Circle
                    key={zone.id}
                    center={[zone.center.lat, zone.center.lng]}
                    radius={zone.radius}
                    pathOptions={{ color: '#4caf50', fillOpacity: 0.2 }}
                  />
                );
              } else {
                // For square and hex zones, render polygons
                return (
                  <Polygon
                    key={zone.id}
                    positions={zone.geoJSON.geometry.coordinates[0].map(coord => [coord[1], coord[0]])}
                    pathOptions={{ color: '#4caf50', fillOpacity: 0.2 }}
                  />
                );
              }
            })}
          </MapContainer>

          {/* Zone tooltip using UnifiedTooltip */}
          {tooltipContent?.type === 'zone' && (
            <UnifiedTooltip
              type="zone"
              data={{
                name: tooltipContent.zone.name,
                type: tooltipContent.zone.type,
                area: formatArea(tooltipContent.zone.area, zoneOptions.areaUnit),
                coordinates: `${tooltipContent.zone.coordinates.latitude.toFixed(6)}, ${tooltipContent.zone.coordinates.longitude.toFixed(6)}`
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  left: tooltipPosition.x,
                  top: tooltipPosition.y,
                  width: '1px',
                  height: '1px',
                  pointerEvents: 'none'
                }}
              />
            </UnifiedTooltip>
          )}
        </div>

        <div className="multi-zone-sidebar">
          {activeTab === 'draw' && renderZoneOptions()}
          {activeTab === 'zones' && renderZonesOverview()}
          {activeTab === 'boundaries' && renderBoundaryOptions()}
        </div>
      </div>

      <div className="multi-zone-selected-area-info">
        {selectedArea ? (
          <div className="multi-zone-area-details">
            <div className="multi-zone-area-header">
              <h4>Selected Area</h4>
              <span className="multi-zone-area-value">
                {formatArea(selectedArea.area, zoneOptions.areaUnit)}
              </span>
            </div>

            <div className="multi-zone-area-details-grid">
              <div className="multi-zone-area-detail">
                <span className="multi-zone-detail-label">Type:</span>
                <span className="multi-zone-detail-value">
                  {selectedArea.type.charAt(0).toUpperCase() + selectedArea.type.slice(1)}
                </span>
              </div>

              <div className="multi-zone-area-detail">
                <span className="multi-zone-detail-label">Center:</span>
                <span className="multi-zone-detail-value">
                  {Array.isArray(selectedArea.center) 
                    ? `${selectedArea.center[1].toFixed(6)}, ${selectedArea.center[0].toFixed(6)}`
                    : `${selectedArea.center.lat.toFixed(6)}, ${selectedArea.center.lng.toFixed(6)}`
                  }
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="multi-zone-no-area">
            <p>No area selected. Use the drawing tools to select an area on the map.</p>
          </div>
        )}
      </div>
    </div>
  );
};

MultiZoneSelector.propTypes = {
  onZonesSelected: PropTypes.func,
  existingZones: PropTypes.array,
  boundaryOptions: PropTypes.shape({
    enableCountry: PropTypes.bool,
    enableState: PropTypes.bool,
    enableCounty: PropTypes.bool,
    formats: PropTypes.arrayOf(PropTypes.string),
    include3D: PropTypes.bool,
    includeElevation: PropTypes.bool
  })
};

export default MultiZoneSelector;
