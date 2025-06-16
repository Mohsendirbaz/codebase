// BoundaryDownloader.js
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import '../../styles/HomePage.CSS/BoundaryDownloader.css';

// Base URL for boundary file downloads
const BOUNDARY_FILE_BASE_URL = 'https://api.climate-data-service.org/boundaries';

/**
 * BoundaryDownloader Component
 * 
 * A component for downloading boundary files for countries, states, counties
 * in different formats (geojson, shapefile, tif, etc).
 * 
 * @param {Object} props - Component props
 * @param {Object} props.selectedArea - The selected area information
 * @param {Array} props.generatedZones - Array of generated zones
 * @param {Object} props.boundaryOptions - Boundary file download options
 */
const BoundaryDownloader = ({
  selectedArea,
  generatedZones = [],
  boundaryOptions = {
    enableCountry: true,
    enableState: true,
    enableCounty: true,
    formats: ['geojson', 'shapefile', 'tif', 'country_sf'],
    include3D: true,
    includeElevation: true
  }
}) => {
  // State for boundary layers found in the selected area
  const [boundaryLayers, setBoundaryLayers] = useState({
    country: [],
    state: [],
    county: []
  });

  // State for selected boundary for download
  const [selectedBoundary, setSelectedBoundary] = useState(null);

  // State for loading status
  const [loading, setLoading] = useState(false);

  // State for advanced options
  const [advancedOptions, setAdvancedOptions] = useState({
    include3D: boundaryOptions.include3D,
    includeElevation: boundaryOptions.includeElevation,
    bufferZone: 0, // In kilometers
    simplified: false, // Whether to use simplified geometries
    resolution: 'high' // high, medium, low
  });

  // Find intersecting boundary layers when selected area changes
  useEffect(() => {
    if (!selectedArea) {
      setBoundaryLayers({
        country: [],
        state: [],
        county: []
      });
      setSelectedBoundary(null);
      return;
    }

    findIntersectingBoundaries(selectedArea);
  }, [selectedArea]);

  // Find intersecting boundary layers
  const findIntersectingBoundaries = useCallback(async (area) => {
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

  // Handle boundary selection
  const handleBoundarySelect = useCallback((boundary) => {
    setSelectedBoundary(boundary);
  }, []);

  // Generate download URL for boundary file
  const getBoundaryDownloadUrl = useCallback((boundary, format) => {
    if (!boundary) return '';

    const baseUrl = BOUNDARY_FILE_BASE_URL;
    let url = `${baseUrl}/${boundary.type}/${boundary.id}?format=${format}`;

    // Add advanced options to the URL
    if (advancedOptions.include3D) {
      url += '&include3D=true';
    }

    if (advancedOptions.includeElevation) {
      url += '&includeElevation=true';
    }

    if (advancedOptions.bufferZone > 0) {
      url += `&buffer=${advancedOptions.bufferZone}`;
    }

    if (advancedOptions.simplified) {
      url += '&simplified=true';
    }

    url += `&resolution=${advancedOptions.resolution}`;

    return url;
  }, [advancedOptions]);

  // Handle download button click
  const handleDownload = useCallback((format) => {
    if (!selectedBoundary) return;

    const url = getBoundaryDownloadUrl(selectedBoundary, format);

    // Trigger the download (in a real implementation, this would be a proper download)
    window.open(url, '_blank');
  }, [selectedBoundary, getBoundaryDownloadUrl]);

  // Handle advanced option change
  const handleAdvancedOptionChange = useCallback((option, value) => {
    setAdvancedOptions(prev => ({
      ...prev,
      [option]: value
    }));
  }, []);

  // Get count of downloadable boundaries
  const getBoundaryCount = useCallback(() => {
    return (
      boundaryLayers.country.length +
      boundaryLayers.state.length +
      boundaryLayers.county.length
    );
  }, [boundaryLayers]);

  return (
    <div className="boundary-downloader">
      <div className="boundary-downloader-header">
        <h3>Boundary File Downloads</h3>
        <div className="boundary-downloader-stats">
          <span className="boundary-count">
            {getBoundaryCount()} boundaries available
          </span>
          {generatedZones.length > 0 && (
            <span className="zone-count">
              {generatedZones.length} zones selected
            </span>
          )}
        </div>
      </div>

      <div className="boundary-downloader-content">
        {loading ? (
          <div className="boundary-downloader-loading">
            <div className="loading-spinner"></div>
            <p>Finding boundaries for selected area...</p>
          </div>
        ) : !selectedArea ? (
          <div className="boundary-downloader-empty">
            <p>No area selected. Please select an area on the map to see available boundaries.</p>
          </div>
        ) : getBoundaryCount() === 0 ? (
          <div className="boundary-downloader-empty">
            <p>No boundary data found for the selected area. Try selecting a different area.</p>
          </div>
        ) : (
          <div className="boundary-selection-container">
            <div className="boundary-selection-tabs">
              {boundaryOptions.enableCountry && boundaryLayers.country.length > 0 && (
                <div className="boundary-tab">
                  <h4>Countries</h4>
                  <div className="boundary-list">
                    {boundaryLayers.country.map(boundary => (
                      <div 
                        key={boundary.id}
                        className={`boundary-item ${selectedBoundary?.id === boundary.id ? 'selected' : ''}`}
                        onClick={() => handleBoundarySelect(boundary)}
                      >
                        {boundary.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {boundaryOptions.enableState && boundaryLayers.state.length > 0 && (
                <div className="boundary-tab">
                  <h4>States/Provinces</h4>
                  <div className="boundary-list">
                    {boundaryLayers.state.map(boundary => (
                      <div 
                        key={boundary.id}
                        className={`boundary-item ${selectedBoundary?.id === boundary.id ? 'selected' : ''}`}
                        onClick={() => handleBoundarySelect(boundary)}
                      >
                        {boundary.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {boundaryOptions.enableCounty && boundaryLayers.county.length > 0 && (
                <div className="boundary-tab">
                  <h4>Counties/Districts</h4>
                  <div className="boundary-list">
                    {boundaryLayers.county.map(boundary => (
                      <div 
                        key={boundary.id}
                        className={`boundary-item ${selectedBoundary?.id === boundary.id ? 'selected' : ''}`}
                        onClick={() => handleBoundarySelect(boundary)}
                      >
                        {boundary.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedBoundary && (
              <motion.div 
                className="boundary-download-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="boundary-download-header">
                  <h4>Download: {selectedBoundary.name}</h4>
                  <span className="boundary-type-badge">
                    {selectedBoundary.type.charAt(0).toUpperCase() + selectedBoundary.type.slice(1)}
                  </span>
                </div>

                <div className="boundary-format-section">
                  <h5>File Formats</h5>
                  <div className="boundary-format-grid">
                    {boundaryOptions.formats.map(format => (
                      <button 
                        key={format}
                        className="boundary-download-button"
                        onClick={() => handleDownload(format)}
                      >
                        {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="boundary-advanced-section">
                  <div className="advanced-section-header">
                    <h5>Advanced Options</h5>
                  </div>

                  <div className="advanced-options-grid">
                    <div className="advanced-option-group">
                      <label className="advanced-checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={advancedOptions.include3D}
                          onChange={(e) => handleAdvancedOptionChange('include3D', e.target.checked)}
                        />
                        Include 3D
                      </label>
                      <span className="option-description">
                        Includes 3D geometry data (where available)
                      </span>
                    </div>

                    <div className="advanced-option-group">
                      <label className="advanced-checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={advancedOptions.includeElevation}
                          onChange={(e) => handleAdvancedOptionChange('includeElevation', e.target.checked)}
                        />
                        Include Elevation
                      </label>
                      <span className="option-description">
                        Includes elevation data (DEM)
                      </span>
                    </div>

                    <div className="advanced-option-group">
                      <label className="advanced-checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={advancedOptions.simplified}
                          onChange={(e) => handleAdvancedOptionChange('simplified', e.target.checked)}
                        />
                        Simplified Geometries
                      </label>
                      <span className="option-description">
                        Reduces file size with simplified boundary shapes
                      </span>
                    </div>

                    <div className="advanced-option-group">
                      <label>Buffer Zone (km):</label>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={advancedOptions.bufferZone}
                        onChange={(e) => handleAdvancedOptionChange('bufferZone', parseInt(e.target.value) || 0)}
                        className="advanced-input"
                      />
                      <span className="option-description">
                        Extends boundary by specified distance
                      </span>
                    </div>

                    <div className="advanced-option-group">
                      <label>Resolution:</label>
                      <select 
                        value={advancedOptions.resolution}
                        onChange={(e) => handleAdvancedOptionChange('resolution', e.target.value)}
                        className="advanced-select"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <span className="option-description">
                        Controls detail level of boundary data
                      </span>
                    </div>
                  </div>
                </div>

                <div className="boundary-for-zones-section">
                  <h5>Apply to Generated Zones</h5>
                  <div className="boundary-zones-options">
                    <button className="boundary-zones-button">
                      Intersect Zones with Boundary
                    </button>
                    <button className="boundary-zones-button">
                      Crop Zones to Boundary
                    </button>
                  </div>
                  <p className="zones-note">
                    {generatedZones.length === 0 
                      ? "No zones have been generated yet. Generate zones to enable these options."
                      : `These options will affect all ${generatedZones.length} generated zones.`
                    }
                  </p>
                </div>

                <div className="boundary-format-info">
                  <h5>Format Information</h5>
                  <div className="format-info-grid">
                    <div className="format-info-item">
                      <span className="format-name">GeoJSON</span>
                      <span className="format-description">Standard format for web mapping</span>
                    </div>
                    <div className="format-info-item">
                      <span className="format-name">Shapefile</span>
                      <span className="format-description">Common format for GIS applications</span>
                    </div>
                    <div className="format-info-item">
                      <span className="format-name">TIF</span>
                      <span className="format-description">Raster format with georeferencing</span>
                    </div>
                    <div className="format-info-item">
                      <span className="format-name">country_sf</span>
                      <span className="format-description">R-compatible simple features format</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

BoundaryDownloader.propTypes = {
  selectedArea: PropTypes.object,
  generatedZones: PropTypes.array,
  boundaryOptions: PropTypes.shape({
    enableCountry: PropTypes.bool,
    enableState: PropTypes.bool,
    enableCounty: PropTypes.bool,
    formats: PropTypes.arrayOf(PropTypes.string),
    include3D: PropTypes.bool,
    includeElevation: PropTypes.bool
  })
};

export default BoundaryDownloader;
