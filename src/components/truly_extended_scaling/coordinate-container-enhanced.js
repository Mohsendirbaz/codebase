// CoordinateContainerEnhanced.js
import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useVersionZone } from '../../MatrixStateManager'
import CoordinateComponent from './CoordinateComponent';
import CoordinateFactFinder from './CoordinateFactFinder';
import ClimateMapOverlay from './ClimateMapOverlay';
import MultiZoneSelector from './multi-zone-selector';
import BoundaryDownloader from './boundary-downloader';
import { motion } from 'framer-motion';
import '../../styles/HomePage.CSS/coordinate-container-enhanced-css.css';
import '../../styles/HomePage.CSS/CoordinateComponent.css';

/**
 * CoordinateContainerEnhanced
 * 
 * Enhanced container component that connects the CoordinateComponent to the MatrixStateManager.
 * It provides the zone data and handlers for updating coordinates and assets, and adds
 * multi-zone selection capabilities and boundary file downloads.
 */
const CoordinateContainerEnhanced = ({ 
  carbonFootprints = {}, 
  regulatoryThresholds = {}, 
  complianceStatus = {}
}) => {
  const { zones, updateZoneCoordinates, updateZoneAssets, addZones } = useVersionZone();

  // State for fact-finding results
  const [locationFacts, setLocationFacts] = useState(null);
  const [assetFacts, setAssetFacts] = useState({});

  // State for active view
  const [activeView, setActiveView] = useState('single'); // 'single', 'multi', 'boundary'

  // State for multi zone selection
  const [selectedArea, setSelectedArea] = useState(null);
  const [generatedZones, setGeneratedZones] = useState([]);

  // State for boundary options
  const [boundaryOptions, setBoundaryOptions] = useState({
    enableCountry: true,
    enableState: true,
    enableCounty: true,
    formats: ['geojson', 'shapefile', 'tif', 'country_sf'],
    include3D: true,
    includeElevation: true
  });

  // Get the active zone for single zone view
  const activeZoneId = zones.active;
  const activeZone = {
    id: activeZoneId,
    metadata: zones.metadata[activeZoneId],
    coordinates: zones.metadata[activeZoneId]?.coordinates || { longitude: 0, latitude: 0 },
    assets: zones.metadata[activeZoneId]?.assets || []
  };

  // Convert existing zones to format needed by MultiZoneSelector
  const existingZones = useCallback(() => {
    return Object.keys(zones.metadata || {}).map(zoneId => ({
      id: zoneId,
      name: zones.metadata[zoneId]?.label || zoneId,
      coordinates: zones.metadata[zoneId]?.coordinates || { longitude: 0, latitude: 0 },
      assets: zones.metadata[zoneId]?.assets || []
    }));
  }, [zones.metadata]);

  // Handle coordinate changes
  const handleCoordinateChange = useCallback((coordinates) => {
    updateZoneCoordinates(activeZoneId, coordinates);
  }, [activeZoneId, updateZoneCoordinates]);

  // Handle asset changes
  const handleAssetChange = useCallback((assets) => {
    updateZoneAssets(activeZoneId, assets);
  }, [activeZoneId, updateZoneAssets]);

  // Handle fact-finding results
  const handleFactFound = useCallback((factType, factData) => {
    if (factType === 'location') {
      setLocationFacts(factData);
    } else if (factType === 'asset') {
      setAssetFacts(prev => ({
        ...prev,
        [factData.assetId]: factData.facts
      }));
    }
  }, []);

  // Handle zones selected from MultiZoneSelector
  const handleZonesSelected = useCallback((newZones) => {
    setGeneratedZones(newZones);

    // Store the selected area if available
    if (newZones.length > 0 && newZones[0].geoJSON) {
      setSelectedArea(newZones[0].geoJSON);
    }
  }, []);

  // Handle adding generated zones to the system
  const handleAddGeneratedZones = useCallback(() => {
    if (generatedZones.length === 0) return;

    // Convert the generated zones to the format expected by the MatrixStateManager
    const zonesToAdd = {};

    generatedZones.forEach(zone => {
      zonesToAdd[zone.id] = {
        label: zone.name,
        coordinates: zone.coordinates,
        assets: [] // Start with empty assets
      };
    });

    // Add the zones to the system
    addZones(zonesToAdd);

    // Show success message or notification
    alert(`Added ${generatedZones.length} zones to the system.`);
  }, [generatedZones, addZones]);

  // Handle boundary option change
  const handleBoundaryOptionChange = useCallback((option, value) => {
    setBoundaryOptions(prev => ({
      ...prev,
      [option]: value
    }));
  }, []);

  return (
    <div className="coordinate-container-enhanced">
      <div className="coordinate-container-header">
        <h2>Zone Management and Multi-Zone Selection</h2>

        <div className="coordinate-container-tabs">
          <button 
            className={`coordinate-tab ${activeView === 'single' ? 'active' : ''}`}
            onClick={() => setActiveView('single')}
          >
            Single Zone
          </button>
          <button 
            className={`coordinate-tab ${activeView === 'multi' ? 'active' : ''}`}
            onClick={() => setActiveView('multi')}
          >
            Multi-Zone Selection
          </button>
          <button 
            className={`coordinate-tab ${activeView === 'boundary' ? 'active' : ''}`}
            onClick={() => setActiveView('boundary')}
          >
            Boundary Downloads
          </button>
        </div>
      </div>

      <div className="coordinate-container-content">
        {activeView === 'single' && (
          <motion.div 
            className="coordinate-single-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CoordinateComponent
              zone={activeZone}
              onCoordinateChange={handleCoordinateChange}
              onAssetChange={handleAssetChange}
            />

            <CoordinateFactFinder
              coordinates={activeZone.coordinates}
              assets={activeZone.assets}
              onFactFound={handleFactFound}
            />

            <ClimateMapOverlay
              coordinates={activeZone.coordinates}
              assets={activeZone.assets}
              carbonFootprints={carbonFootprints}
              regulatoryThresholds={regulatoryThresholds}
              complianceStatus={complianceStatus}
            />
          </motion.div>
        )}

        {activeView === 'multi' && (
          <motion.div 
            className="coordinate-multi-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MultiZoneSelector 
              onZonesSelected={handleZonesSelected}
              existingZones={existingZones()}
              boundaryOptions={boundaryOptions}
            />

            {generatedZones.length > 0 && (
              <div className="multi-view-actions">
                <button 
                  className="add-zones-button"
                  onClick={handleAddGeneratedZones}
                >
                  Add {generatedZones.length} Zones to System
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeView === 'boundary' && (
          <motion.div 
            className="coordinate-boundary-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BoundaryDownloader 
              selectedArea={selectedArea}
              generatedZones={generatedZones}
              boundaryOptions={boundaryOptions}
            />

            <div className="boundary-options-panel">
              <h3>Boundary Download Options</h3>

              <div className="boundary-option-group">
                <label className="boundary-option-label">
                  <input 
                    type="checkbox" 
                    checked={boundaryOptions.enableCountry}
                    onChange={() => handleBoundaryOptionChange('enableCountry', !boundaryOptions.enableCountry)}
                  />
                  Enable Country Boundaries
                </label>
              </div>

              <div className="boundary-option-group">
                <label className="boundary-option-label">
                  <input 
                    type="checkbox" 
                    checked={boundaryOptions.enableState}
                    onChange={() => handleBoundaryOptionChange('enableState', !boundaryOptions.enableState)}
                  />
                  Enable State/Province Boundaries
                </label>
              </div>

              <div className="boundary-option-group">
                <label className="boundary-option-label">
                  <input 
                    type="checkbox" 
                    checked={boundaryOptions.enableCounty}
                    onChange={() => handleBoundaryOptionChange('enableCounty', !boundaryOptions.enableCounty)}
                  />
                  Enable County/District Boundaries
                </label>
              </div>

              <div className="boundary-option-group">
                <label className="boundary-option-label">
                  <input 
                    type="checkbox" 
                    checked={boundaryOptions.include3D}
                    onChange={() => handleBoundaryOptionChange('include3D', !boundaryOptions.include3D)}
                  />
                  Include 3D Data (when available)
                </label>
              </div>

              <div className="boundary-option-group">
                <label className="boundary-option-label">
                  <input 
                    type="checkbox" 
                    checked={boundaryOptions.includeElevation}
                    onChange={() => handleBoundaryOptionChange('includeElevation', !boundaryOptions.includeElevation)}
                  />
                  Include Elevation Data (when available)
                </label>
              </div>

              <div className="boundary-option-group">
                <label>Available Formats:</label>
                <div className="format-checkboxes">
                  <label className="format-checkbox">
                    <input 
                      type="checkbox" 
                      checked={boundaryOptions.formats.includes('geojson')}
                      onChange={() => {
                        const newFormats = boundaryOptions.formats.includes('geojson')
                          ? boundaryOptions.formats.filter(f => f !== 'geojson')
                          : [...boundaryOptions.formats, 'geojson'];
                        handleBoundaryOptionChange('formats', newFormats);
                      }}
                    />
                    GeoJSON
                  </label>

                  <label className="format-checkbox">
                    <input 
                      type="checkbox" 
                      checked={boundaryOptions.formats.includes('shapefile')}
                      onChange={() => {
                        const newFormats = boundaryOptions.formats.includes('shapefile')
                          ? boundaryOptions.formats.filter(f => f !== 'shapefile')
                          : [...boundaryOptions.formats, 'shapefile'];
                        handleBoundaryOptionChange('formats', newFormats);
                      }}
                    />
                    Shapefile
                  </label>

                  <label className="format-checkbox">
                    <input 
                      type="checkbox" 
                      checked={boundaryOptions.formats.includes('tif')}
                      onChange={() => {
                        const newFormats = boundaryOptions.formats.includes('tif')
                          ? boundaryOptions.formats.filter(f => f !== 'tif')
                          : [...boundaryOptions.formats, 'tif'];
                        handleBoundaryOptionChange('formats', newFormats);
                      }}
                    />
                    TIF
                  </label>

                  <label className="format-checkbox">
                    <input 
                      type="checkbox" 
                      checked={boundaryOptions.formats.includes('country_sf')}
                      onChange={() => {
                        const newFormats = boundaryOptions.formats.includes('country_sf')
                          ? boundaryOptions.formats.filter(f => f !== 'country_sf')
                          : [...boundaryOptions.formats, 'country_sf'];
                        handleBoundaryOptionChange('formats', newFormats);
                      }}
                    />
                    country_sf (R)
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

CoordinateContainerEnhanced.propTypes = {
  carbonFootprints: PropTypes.object,
  regulatoryThresholds: PropTypes.object,
  complianceStatus: PropTypes.object
};

export default CoordinateContainerEnhanced;
