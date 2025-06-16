import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/CoordinateComponent.css';

/**
 * CoordinateComponent
 *
 * A component for displaying and editing geographic coordinates (longitude and latitude)
 * for zones in the matrix system. It also stores asset information associated with
 * those coordinates.
 *
 * @param {Object} props - Component props
 * @param {Object} props.zone - The zone object containing coordinate and asset information
 * @param {Function} props.onCoordinateChange - Callback when coordinates are changed
 * @param {Function} props.onAssetChange - Callback when asset information is changed
 * @param {Function} props.onMapView - Optional callback to show zone on a map
 */
const CoordinateComponent = ({
                               zone,
                               onCoordinateChange,
                               onAssetChange,
                               onMapView
                             }) => {
  // State for coordinates
  const [coordinates, setCoordinates] = useState({
    longitude: zone?.coordinates?.longitude || 0,
    latitude: zone?.coordinates?.latitude || 0
  });

  // State for assets
  const [assets, setAssets] = useState(zone?.assets || []);

  // State for new asset being added
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: '',
    carbonIntensity: 0,
    isHardToDecarbonize: false
  });

  // State for UI
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [activeAssetIndex, setActiveAssetIndex] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Update local state when zone prop changes
  useEffect(() => {
    if (zone) {
      setCoordinates({
        longitude: zone.coordinates?.longitude || 0,
        latitude: zone.coordinates?.latitude || 0
      });
      setAssets(zone.assets || []);
    }
  }, [zone]);

  // Handle coordinate change
  const handleCoordinateChange = useCallback((type, value) => {
    const numValue = parseFloat(value);

    // Validate longitude (-180 to 180)
    if (type === 'longitude' && (isNaN(numValue) || numValue < -180 || numValue > 180)) {
      setValidationErrors(prev => ({
        ...prev,
        longitude: 'Longitude must be between -180 and 180'
      }));
      return;
    }

    // Validate latitude (-90 to 90)
    if (type === 'latitude' && (isNaN(numValue) || numValue < -90 || numValue > 90)) {
      setValidationErrors(prev => ({
        ...prev,
        latitude: 'Latitude must be between -90 and 90'
      }));
      return;
    }

    // Clear validation error if valid
    setValidationErrors(prev => ({
      ...prev,
      [type]: undefined
    }));

    // Update coordinates
    const newCoordinates = {
      ...coordinates,
      [type]: numValue
    };

    setCoordinates(newCoordinates);

    // Notify parent component
    if (onCoordinateChange) {
      onCoordinateChange(newCoordinates);
    }
  }, [coordinates, onCoordinateChange]);

  // Handle new asset input change
  const handleNewAssetChange = useCallback((field, value) => {
    setNewAsset(prev => ({
      ...prev,
      [field]: field === 'carbonIntensity' ? parseFloat(value) || 0 : value
    }));
  }, []);

  // Handle toggle for hard to decarbonize status
  const handleToggleHardToDecarbonize = useCallback((assetId) => {
    const updatedAssets = assets.map(asset =>
        asset.id === assetId
            ? { ...asset, isHardToDecarbonize: !asset.isHardToDecarbonize }
            : asset
    );

    setAssets(updatedAssets);

    // Notify parent component
    if (onAssetChange) {
      onAssetChange(updatedAssets);
    }
  }, [assets, onAssetChange]);

  // Add new asset
  const handleAddAsset = useCallback(() => {
    // Validate required fields
    const errors = {};
    if (!newAsset.name.trim()) errors.name = 'Name is required';
    if (!newAsset.type.trim()) errors.type = 'Type is required';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        ...errors
      }));
      return;
    }

    // Clear validation errors
    setValidationErrors({});

    // Create new asset with unique ID
    const assetToAdd = {
      ...newAsset,
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Add to assets list
    const updatedAssets = [...assets, assetToAdd];
    setAssets(updatedAssets);

    // Reset new asset form
    setNewAsset({
      name: '',
      type: '',
      carbonIntensity: 0,
      isHardToDecarbonize: false
    });

    // Exit add mode
    setIsAddingAsset(false);

    // Notify parent component
    if (onAssetChange) {
      onAssetChange(updatedAssets);
    }
  }, [newAsset, assets, onAssetChange]);

  // Remove asset
  const handleRemoveAsset = useCallback((assetId) => {
    const updatedAssets = assets.filter(asset => asset.id !== assetId);
    setAssets(updatedAssets);

    // Notify parent component
    if (onAssetChange) {
      onAssetChange(updatedAssets);
    }
  }, [assets, onAssetChange]);

  // Update existing asset
  const handleUpdateAsset = useCallback((assetId, field, value) => {
    const updatedAssets = assets.map(asset =>
        asset.id === assetId
            ? {
              ...asset,
              [field]: field === 'carbonIntensity' ? parseFloat(value) || 0 : value
            }
            : asset
    );

    setAssets(updatedAssets);

    // Notify parent component
    if (onAssetChange) {
      onAssetChange(updatedAssets);
    }
  }, [assets, onAssetChange]);

  // Filter assets based on type and search term
  const filteredAssets = assets.filter(asset => {
    // Filter by type
    if (filterType !== 'all' && asset.type !== filterType) {
      return false;
    }

    // Filter by search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      return (
          asset.name.toLowerCase().includes(term) ||
          asset.type.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // Calculate asset statistics
  const assetStats = {
    total: assets.length,
    hardToDecarbonize: assets.filter(a => a.isHardToDecarbonize).length,
    byType: assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {}),
    averageCarbonIntensity: assets.length
        ? assets.reduce((sum, asset) => sum + asset.carbonIntensity, 0) / assets.length
        : 0
  };

  // Get unique asset types for filter dropdown
  const uniqueAssetTypes = [...new Set(assets.map(asset => asset.type))].filter(Boolean);

  return (
      <div className="coordinate-component">
        <div className="coordinate-header">
          <h3>Zone Coordinates & Assets</h3>
          <div className="coordinate-zone-info">
            <span>Zone: {zone?.id || 'Unknown'}</span>
            <span>{zone?.metadata?.label || 'Unnamed Zone'}</span>
          </div>
        </div>

        <div className="coordinate-section">
          <h4>Geographic Coordinates</h4>
          <div className="coordinate-inputs">
            <div className="coordinate-input-group">
              <label htmlFor="longitude">Longitude:</label>
              <input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  min="-180"
                  max="180"
                  value={coordinates.longitude}
                  onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
                  className={validationErrors.longitude ? 'coordinate-input-error' : ''}
              />
              {validationErrors.longitude && (
                  <div className="coordinate-error">{validationErrors.longitude}</div>
              )}
            </div>

            <div className="coordinate-input-group">
              <label htmlFor="latitude">Latitude:</label>
              <input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  min="-90"
                  max="90"
                  value={coordinates.latitude}
                  onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
                  className={validationErrors.latitude ? 'coordinate-input-error' : ''}
              />
              {validationErrors.latitude && (
                  <div className="coordinate-error">{validationErrors.latitude}</div>
              )}
            </div>

            {onMapView && (
                <button
                    className="coordinate-map-button"
                    onClick={() => onMapView(coordinates)}
                >
                  View on Map
                </button>
            )}
          </div>
        </div>

        <div className="coordinate-section">
          <div className="coordinate-section-header">
            <h4>Assets at this Location</h4>
            <button
                className="coordinate-add-button"
                onClick={() => setIsAddingAsset(true)}
                disabled={isAddingAsset}
            >
              Add Asset
            </button>
          </div>

          {/* Asset Stats */}
          <div className="coordinate-asset-stats">
            <div className="stat-item">
              <span className="stat-label">Total Assets:</span>
              <span className="stat-value">{assetStats.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Hard to Decarbonize:</span>
              <span className="stat-value">{assetStats.hardToDecarbonize}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg. Carbon Intensity:</span>
              <span className="stat-value">{assetStats.averageCarbonIntensity.toFixed(1)} kg CO2e/unit</span>
            </div>
          </div>

          {/* Add new asset form */}
          <AnimatePresence>
            {isAddingAsset && (
                <motion.div
                    className="coordinate-add-asset-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                  <div className="coordinate-form-header">
                    <h5>Add New Asset</h5>
                    <button
                        className="coordinate-form-close"
                        onClick={() => {
                          setIsAddingAsset(false);
                          setValidationErrors({});
                        }}
                    >
                      ×
                    </button>
                  </div>

                  <div className="coordinate-form-inputs">
                    <div className="coordinate-form-group">
                      <label htmlFor="asset-name">Asset Name:</label>
                      <input
                          id="asset-name"
                          type="text"
                          value={newAsset.name}
                          onChange={(e) => handleNewAssetChange('name', e.target.value)}
                          className={validationErrors.name ? 'coordinate-input-error' : ''}
                      />
                      {validationErrors.name && (
                          <div className="coordinate-error">{validationErrors.name}</div>
                      )}
                    </div>

                    <div className="coordinate-form-group">
                      <label htmlFor="asset-type">Asset Type:</label>
                      <select
                          id="asset-type"
                          value={newAsset.type}
                          onChange={(e) => handleNewAssetChange('type', e.target.value)}
                          className={validationErrors.type ? 'coordinate-input-error' : ''}
                      >
                        <option value="">Select Type</option>
                        <option value="industrial">Industrial</option>
                        <option value="commercial">Commercial</option>
                        <option value="residential">Residential</option>
                        <option value="energy">Energy</option>
                        <option value="transportation">Transportation</option>
                        <option value="agriculture">Agriculture</option>
                      </select>
                      {validationErrors.type && (
                          <div className="coordinate-error">{validationErrors.type}</div>
                      )}
                    </div>

                    <div className="coordinate-form-group">
                      <label htmlFor="asset-carbon">Carbon Intensity (kg CO2e/unit):</label>
                      <input
                          id="asset-carbon"
                          type="number"
                          min="0"
                          step="0.1"
                          value={newAsset.carbonIntensity}
                          onChange={(e) => handleNewAssetChange('carbonIntensity', e.target.value)}
                      />
                    </div>

                    <div className="coordinate-form-group coordinate-checkbox-group">
                      <label htmlFor="asset-hard-to-decarbonize">
                        <input
                            id="asset-hard-to-decarbonize"
                            type="checkbox"
                            checked={newAsset.isHardToDecarbonize}
                            onChange={(e) => handleNewAssetChange('isHardToDecarbonize', e.target.checked)}
                        />
                        Hard to Decarbonize Sector
                      </label>
                    </div>
                  </div>

                  <div className="coordinate-form-actions">
                    <button
                        className="coordinate-form-cancel"
                        onClick={() => {
                          setIsAddingAsset(false);
                          setValidationErrors({});
                        }}
                    >
                      Cancel
                    </button>
                    <button
                        className="coordinate-form-submit"
                        onClick={handleAddAsset}
                    >
                      Add Asset
                    </button>
                  </div>
                </motion.div>
            )}
          </AnimatePresence>

          {/* Asset Filter Controls */}
          <div className="coordinate-filter-controls">
            <div className="coordinate-filter-group">
              <label htmlFor="filter-type">Filter by Type:</label>
              <select
                  id="filter-type"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                {uniqueAssetTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="coordinate-search-group">
              <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="coordinate-search-input"
              />
              {searchTerm && (
                  <button
                      className="coordinate-search-clear"
                      onClick={() => setSearchTerm('')}
                  >
                    ×
                  </button>
              )}
            </div>
          </div>

          {/* Assets list */}
          <div className="coordinate-assets-list">
            {filteredAssets.length === 0 ? (
                <div className="coordinate-no-assets">
                  {assets.length === 0
                      ? "No assets added for this location"
                      : "No assets match the current filters"}
                </div>
            ) : (
                filteredAssets.map((asset, index) => (
                    <motion.div
                        key={asset.id}
                        className={`coordinate-asset-item ${asset.isHardToDecarbonize ? 'hard-to-decarbonize' : ''} ${activeAssetIndex === index ? 'active' : ''}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setActiveAssetIndex(activeAssetIndex === index ? null : index)}
                    >
                      <div className="coordinate-asset-info">
                        <div className="coordinate-asset-name">{asset.name}</div>
                        <div className="coordinate-asset-type">{asset.type}</div>
                        <div className="coordinate-asset-carbon">
                          {asset.carbonIntensity.toFixed(1)} kg CO2e/unit
                        </div>
                      </div>

                      <div className="coordinate-asset-actions">
                        <div className="coordinate-asset-status">
                          <label className="coordinate-status-toggle">
                            <input
                                type="checkbox"
                                checked={asset.isHardToDecarbonize}
                                onChange={() => handleToggleHardToDecarbonize(asset.id)}
                            />
                            <span className="coordinate-status-slider"></span>
                          </label>
                          <span className="coordinate-status-label">
                      {asset.isHardToDecarbonize ? 'Hard to Decarbonize' : 'Standard Sector'}
                    </span>
                        </div>

                        <button
                            className="coordinate-asset-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAsset(asset.id);
                            }}
                        >
                          Remove
                        </button>
                      </div>

                      {/* Expanded asset details */}
                      <AnimatePresence>
                        {activeAssetIndex === index && (
                            <motion.div
                                className="coordinate-asset-details"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                              <div className="coordinate-detail-group">
                                <label>Asset Name:</label>
                                <input
                                    type="text"
                                    value={asset.name}
                                    onChange={(e) => handleUpdateAsset(asset.id, 'name', e.target.value)}
                                />
                              </div>

                              <div className="coordinate-detail-group">
                                <label>Asset Type:</label>
                                <select
                                    value={asset.type}
                                    onChange={(e) => handleUpdateAsset(asset.id, 'type', e.target.value)}
                                >
                                  <option value="industrial">Industrial</option>
                                  <option value="commercial">Commercial</option>
                                  <option value="residential">Residential</option>
                                  <option value="energy">Energy</option>
                                  <option value="transportation">Transportation</option>
                                  <option value="agriculture">Agriculture</option>
                                </select>
                              </div>

                              <div className="coordinate-detail-group">
                                <label>Carbon Intensity:</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={asset.carbonIntensity}
                                    onChange={(e) => handleUpdateAsset(asset.id, 'carbonIntensity', e.target.value)}
                                />
                                <span>kg CO2e/unit</span>
                              </div>

                              <div className="coordinate-climate-impact">
                                <h6>Climate Impact Assessment</h6>
                                <div className="climate-impact-scale">
                                  <div
                                      className="climate-impact-indicator"
                                      style={{
                                        left: `${Math.min(100, asset.carbonIntensity / 2)}%`,
                                        backgroundColor: asset.isHardToDecarbonize ? '#e74c3c' : '#3498db'
                                      }}
                                  ></div>
                                  <div className="climate-scale-labels">
                                    <span>Low</span>
                                    <span>Medium</span>
                                    <span>High</span>
                                  </div>
                                </div>
                                <div className="climate-impact-note">
                                  {asset.isHardToDecarbonize
                                      ? "This asset belongs to a hard-to-decarbonize sector and may require special consideration in climate planning."
                                      : "This asset can be addressed with standard decarbonization approaches."}
                                </div>
                              </div>
                            </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                ))
            )}
          </div>
        </div>
      </div>
  );
};

CoordinateComponent.propTypes = {
  zone: PropTypes.shape({
    id: PropTypes.string,
    metadata: PropTypes.object,
    coordinates: PropTypes.shape({
      longitude: PropTypes.number,
      latitude: PropTypes.number
    }),
    assets: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          type: PropTypes.string.isRequired,
          carbonIntensity: PropTypes.number,
          isHardToDecarbonize: PropTypes.bool
        })
    )
  }),
  onCoordinateChange: PropTypes.func,
  onAssetChange: PropTypes.func,
  onMapView: PropTypes.func
};

export default CoordinateComponent;