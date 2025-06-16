import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { getAPIPrecedenceData } from '../find_factual_precedence/components/modules/FactualPrecedence/APIFactualPrecedence';
import './styles/CoordinateFactFinder.css';

/**
 * CoordinateFactFinder Component
 *
 * This component enhances the CoordinateComponent with robust fact-finding capabilities
 * for coordinate maps. It fetches and displays location-based data for coordinates and assets.
 *
 * @param {Object} props - Component props
 * @param {Object} props.coordinates - The coordinates (longitude and latitude)
 * @param {Array} props.assets - The assets associated with the coordinates
 * @param {Function} props.onFactFound - Callback when new facts are found
 * @param {boolean} props.autoFetch - Whether to automatically fetch data when coordinates change
 */
const CoordinateFactFinder = ({
                                coordinates,
                                assets = [],
                                onFactFound = () => {},
                                autoFetch = true
                              }) => {
  // State for fact-finding results
  const [locationFacts, setLocationFacts] = useState(null);
  const [assetFacts, setAssetFacts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeAssetId, setActiveAssetId] = useState(null);
  const [factHistory, setFactHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [factType, setFactType] = useState('all');

  // Fetch location facts when coordinates change (if autoFetch is enabled)
  useEffect(() => {
    if (autoFetch && coordinates && coordinates.longitude !== undefined && coordinates.latitude !== undefined) {
      fetchLocationFacts(coordinates);
    }
  }, [coordinates, autoFetch]);

  // Fetch location facts based on coordinates
  const fetchLocationFacts = useCallback(async (coords) => {
    setLoading(true);
    setError(null);

    try {
      // Record the fetch action in history
      const historyEntry = {
        id: `location-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'location',
        coordinates: { ...coords },
        query: `Location at ${coords.longitude.toFixed(6)}, ${coords.latitude.toFixed(6)}`
      };

      // Create a form value for the API call
      const formValue = {
        label: `Location at ${coords.longitude.toFixed(6)}, ${coords.latitude.toFixed(6)}`,
        value: `${coords.longitude},${coords.latitude}`,
        type: 'coordinate-location',
        remarks: `Geographic coordinates for fact finding`
      };

      // Use the existing FactualPrecedence API
      const factsData = await getAPIPrecedenceData('coordinate-location', formValue);

      if (factsData) {
        setLocationFacts(factsData);

        // Add results to history entry
        historyEntry.result = factsData;
        historyEntry.success = true;

        // Notify parent component
        onFactFound('location', factsData);
      } else {
        // Generate fallback data if API returns nothing
        const fallbackData = generateFallbackLocationData(coords);
        setLocationFacts(fallbackData);

        // Add fallback results to history entry
        historyEntry.result = fallbackData;
        historyEntry.success = true;
        historyEntry.isFallback = true;

        onFactFound('location', fallbackData);
      }

      // Update history
      setFactHistory(prev => [historyEntry, ...prev]);
    } catch (error) {
      console.error('Error fetching location facts:', error);
      setError('Failed to fetch location information. Please try again later.');

      // Record error in history
      const errorEntry = {
        id: `location-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'location',
        coordinates: { ...coords },
        query: `Location at ${coords.longitude.toFixed(6)}, ${coords.latitude.toFixed(6)}`,
        error: error.message,
        success: false
      };
      setFactHistory(prev => [errorEntry, ...prev]);

      // Generate fallback data on error
      const fallbackData = generateFallbackLocationData(coords);
      setLocationFacts(fallbackData);
      onFactFound('location', fallbackData);
    } finally {
      setLoading(false);
    }
  }, [onFactFound]);

  // Fetch additional geographical data using external API
  const fetchGeoData = useCallback(async (coords) => {
    setLoading(true);

    try {
      // Use OpenStreetMap Nominatim API for reverse geocoding
      const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
        params: {
          format: 'json',
          lat: coords.latitude,
          lon: coords.longitude,
          zoom: 10,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'ModEcon Matrix Application' // Specify a user agent as required by the API
        }
      });

      if (response.data) {
        // Extract address and additional data
        const { address, display_name } = response.data;

        // Create enhanced location data
        const enhancedData = {
          summary: `Location identified as ${display_name || 'an unnamed location'}`,
          examples: [
            {
              entity: "Country",
              value: address?.country || "Unknown",
              year: new Date().getFullYear(),
              source: "OpenStreetMap"
            },
            {
              entity: "Region",
              value: address?.state || address?.region || "Unknown",
              year: new Date().getFullYear(),
              source: "OpenStreetMap"
            },
            {
              entity: "Locality",
              value: address?.city || address?.town || address?.village || "Unknown",
              year: new Date().getFullYear(),
              source: "OpenStreetMap"
            },
            {
              entity: "Terrain Type",
              value: determineTerrainType(address),
              year: new Date().getFullYear(),
              source: "Geographic Analysis"
            }
          ],
          recommendedValue: "Geographic data from OpenStreetMap",
          confidenceLevel: "medium",
          additionalData: {
            openStreetMap: response.data
          }
        };

        // Merge with existing location facts or set as new facts
        if (locationFacts) {
          setLocationFacts({
            ...locationFacts,
            examples: [...(locationFacts.examples || []), ...enhancedData.examples].filter(
                // Remove duplicates by entity
                (example, index, self) =>
                    index === self.findIndex(e => e.entity === example.entity)
            ),
            additionalData: {
              ...(locationFacts.additionalData || {}),
              ...enhancedData.additionalData
            }
          });
        } else {
          setLocationFacts(enhancedData);
        }

        // Notify parent component
        onFactFound('location', enhancedData);

        // Add to history
        setFactHistory(prev => [{
          id: `geo-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'geo',
          coordinates: { ...coords },
          query: `Geo data for ${coords.longitude.toFixed(6)}, ${coords.latitude.toFixed(6)}`,
          result: enhancedData,
          success: true
        }, ...prev]);
      }
    } catch (error) {
      console.error('Error fetching geographical data:', error);
      setError(prev => prev || 'Failed to fetch additional geographical data.');

      // Add to history
      setFactHistory(prev => [{
        id: `geo-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'geo',
        coordinates: { ...coords },
        query: `Geo data for ${coords.longitude.toFixed(6)}, ${coords.latitude.toFixed(6)}`,
        error: error.message,
        success: false
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  }, [locationFacts, onFactFound]);

  // Determine terrain type based on address data
  const determineTerrainType = (address) => {
    if (!address) return "Unknown";

    if (address.city || address.town || address.village || address.suburb || address.neighbourhood) {
      return "Urban/Suburban";
    }

    if (address.county && !address.city) {
      return "Rural";
    }

    if (address.peak || address.ridge) {
      return "Mountainous";
    }

    if (address.sea || address.ocean) {
      return "Marine";
    }

    if (address.forest || address.wood) {
      return "Forest";
    }

    if (address.desert) {
      return "Desert";
    }

    return "Mixed Terrain";
  };

  // Fetch asset facts when an asset is selected
  const fetchAssetFacts = useCallback(async (asset) => {
    if (!asset || !asset.id) return;

    // If we already have facts for this asset, don't fetch again
    if (assetFacts[asset.id]) {
      setActiveAssetId(asset.id);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Record the fetch action in history
      const historyEntry = {
        id: `asset-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'asset',
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.type,
        query: `Asset info for ${asset.name} (${asset.type})`
      };

      // Create a form value for the API call
      const formValue = {
        label: asset.name,
        value: asset.type,
        type: 'asset-info',
        remarks: `Asset type: ${asset.type}, Carbon intensity: ${asset.carbonIntensity}`
      };

      // Use the existing FactualPrecedence API
      const factsData = await getAPIPrecedenceData('asset-info', formValue);

      if (factsData) {
        // Update asset facts state
        setAssetFacts(prev => ({
          ...prev,
          [asset.id]: factsData
        }));

        // Set active asset
        setActiveAssetId(asset.id);

        // Add results to history entry
        historyEntry.result = factsData;
        historyEntry.success = true;

        // Notify parent component
        onFactFound('asset', { assetId: asset.id, facts: factsData });
      } else {
        // Generate fallback data if API returns nothing
        const fallbackData = generateFallbackAssetData(asset);

        // Update asset facts state
        setAssetFacts(prev => ({
          ...prev,
          [asset.id]: fallbackData
        }));

        // Set active asset
        setActiveAssetId(asset.id);

        // Add fallback results to history entry
        historyEntry.result = fallbackData;
        historyEntry.success = true;
        historyEntry.isFallback = true;

        // Notify parent component
        onFactFound('asset', { assetId: asset.id, facts: fallbackData });
      }

      // Update history
      setFactHistory(prev => [historyEntry, ...prev]);
    } catch (error) {
      console.error('Error fetching asset facts:', error);
      setError('Failed to fetch asset information. Please try again later.');

      // Record error in history
      const errorEntry = {
        id: `asset-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'asset',
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.type,
        query: `Asset info for ${asset.name} (${asset.type})`,
        error: error.message,
        success: false
      };
      setFactHistory(prev => [errorEntry, ...prev]);

      // Generate fallback data on error
      const fallbackData = generateFallbackAssetData(asset);

      // Update asset facts state
      setAssetFacts(prev => ({
        ...prev,
        [asset.id]: fallbackData
      }));

      // Set active asset
      setActiveAssetId(asset.id);

      // Notify parent component
      onFactFound('asset', { assetId: asset.id, facts: fallbackData });
    } finally {
      setLoading(false);
    }
  }, [assetFacts, onFactFound]);

  // Generate fallback location data
  const generateFallbackLocationData = (coords) => {
    return {
      summary: `Geographic location at coordinates ${coords.longitude.toFixed(4)}, ${coords.latitude.toFixed(4)}. This appears to be a point on Earth that may have industrial, commercial, or natural significance.`,
      examples: [
        {
          entity: "Geographic Region",
          value: determineRegion(coords),
          year: new Date().getFullYear(),
          source: "Coordinate Analysis"
        },
        {
          entity: "Terrain Type",
          value: "Mixed Use",
          year: new Date().getFullYear(),
          source: "Geographic Estimation"
        },
        {
          entity: "Climate Risk Level",
          value: determineClimateRisk(coords),
          year: new Date().getFullYear(),
          source: "Climate Risk Assessment"
        }
      ],
      recommendedValue: "Consider local regulations and environmental factors for this location.",
      confidenceLevel: "low"
    };
  };

  // Generate fallback asset data
  const generateFallbackAssetData = (asset) => {
    return {
      summary: `${asset.name} is a ${asset.type} asset with a carbon intensity of ${asset.carbonIntensity} kg CO2e/unit.`,
      examples: [
        {
          entity: "Similar Assets",
          value: `Typical ${asset.type}`,
          year: new Date().getFullYear(),
          source: "Industry Standards"
        },
        {
          entity: "Carbon Intensity",
          value: asset.carbonIntensity,
          unit: "kg CO2e/unit",
          year: new Date().getFullYear(),
          source: "Asset Metadata"
        },
        {
          entity: "Decarbonization Potential",
          value: asset.isHardToDecarbonize ? "Challenging" : "Standard",
          year: new Date().getFullYear(),
          source: "Sectoral Analysis"
        },
        {
          entity: "Emission Category",
          value: determineEmissionCategory(asset.carbonIntensity),
          year: new Date().getFullYear(),
          source: "Carbon Classification"
        }
      ],
      recommendedValue: asset.isHardToDecarbonize ?
          "Consider advanced decarbonization strategies for this hard-to-decarbonize asset." :
          "Standard decarbonization approaches may be effective for this asset.",
      confidenceLevel: "medium"
    };
  };

  // Determine emission category based on carbon intensity
  const determineEmissionCategory = (intensity) => {
    if (intensity < 10) return "Low";
    if (intensity < 50) return "Medium";
    if (intensity < 100) return "High";
    return "Very High";
  };

  // Determine climate risk based on coordinates (simplified example)
  const determineClimateRisk = (coords) => {
    const { latitude } = coords;

    // Very simplified risk assessment based just on latitude
    // In reality would use much more sophisticated climate models
    if (latitude > 66.5 || latitude < -66.5) {
      return "High - Polar Region"; // Arctic/Antarctic
    }

    if (latitude > 23.5 && latitude < 66.5) {
      return "Medium - Temperate Region";
    }

    if (latitude < 23.5 && latitude > -23.5) {
      return "Variable - Tropical Region";
    }

    if (latitude > -66.5 && latitude < -23.5) {
      return "Medium - Southern Temperate";
    }

    return "Undetermined";
  };

  // Determine region from coordinates (simplified)
  const determineRegion = (coords) => {
    const { longitude, latitude } = coords;

    // Very simplified region determination
    if (longitude > -180 && longitude < -30 && latitude > 15 && latitude < 90) {
      return "North America";
    } else if (longitude > -30 && longitude < 40 && latitude > 30 && latitude < 90) {
      return "Europe";
    } else if (longitude > 40 && longitude < 180 && latitude > 0 && latitude < 90) {
      return "Asia";
    } else if (latitude < 0) {
      return "Southern Hemisphere";
    } else {
      return "Unknown Region";
    }
  };

  // Filter fact history entries
  const filteredHistory = factHistory.filter(entry => {
    // Filter by confidence
    if (confidenceFilter !== 'all') {
      if (entry.result?.confidenceLevel !== confidenceFilter) {
        return false;
      }
    }

    // Filter by fact type
    if (factType !== 'all' && entry.type !== factType) {
      return false;
    }

    return true;
  });

  return (
      <div className="coordinate-fact-finder">
        <div className="fact-finder-header">
          <div className="fact-finder-title">
            <h4>Location & Asset Intelligence</h4>
            <div className="fact-finder-actions">
              <button
                  className="fact-finder-history-toggle"
                  onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'Hide History' : 'Show History'}
              </button>
              {coordinates && (
                  <button
                      className="fact-finder-fetch"
                      onClick={() => fetchLocationFacts(coordinates)}
                      disabled={loading}
                  >
                    Refresh Location Data
                  </button>
              )}
              {coordinates && (
                  <button
                      className="fact-finder-geo-fetch"
                      onClick={() => fetchGeoData(coordinates)}
                      disabled={loading}
                  >
                    Get Geo Details
                  </button>
              )}
            </div>
          </div>
          {loading && <div className="fact-finder-loading">Loading facts...</div>}
          {error && <div className="fact-finder-error">{error}</div>}
        </div>

        {/* Fact History Section (conditionally shown) */}
        <AnimatePresence>
          {showHistory && (
              <motion.div
                  className="fact-finder-history"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
              >
                <div className="history-header">
                  <h5>Fact Search History</h5>
                  <div className="history-filters">
                    <select
                        value={confidenceFilter}
                        onChange={(e) => setConfidenceFilter(e.target.value)}
                    >
                      <option value="all">All Confidence Levels</option>
                      <option value="high">High Confidence</option>
                      <option value="medium">Medium Confidence</option>
                      <option value="low">Low Confidence</option>
                    </select>

                    <select
                        value={factType}
                        onChange={(e) => setFactType(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="location">Location</option>
                      <option value="asset">Asset</option>
                      <option value="geo">Geographical</option>
                    </select>
                  </div>
                </div>

                <div className="history-entries">
                  {filteredHistory.length === 0 ? (
                      <div className="history-empty">No search history available</div>
                  ) : (
                      filteredHistory.map(entry => (
                          <div
                              key={entry.id}
                              className={`history-entry ${entry.success ? 'success' : 'error'} ${entry.isFallback ? 'fallback' : ''}`}
                          >
                            <div className="history-entry-header">
                      <span className="history-timestamp">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                              <span className="history-type">{entry.type}</span>
                              {entry.success ? (
                                  <span className="history-success">Success</span>
                              ) : (
                                  <span className="history-error">Failed</span>
                              )}
                            </div>
                            <div className="history-query">{entry.query}</div>
                            {entry.error && (
                                <div className="history-error-message">{entry.error}</div>
                            )}
                            {entry.isFallback && (
                                <div className="history-fallback-note">Used fallback data</div>
                            )}
                          </div>
                      ))
                  )}
                </div>
              </motion.div>
          )}
        </AnimatePresence>

        {/* Location Facts Section */}
        {locationFacts && (
            <motion.div
                className="fact-finder-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
            >
              <h5>Location Facts</h5>
              <div className={`fact-finder-summary ${locationFacts.confidenceLevel || 'medium'}-confidence`}>
                {locationFacts.summary}

                {locationFacts.confidenceLevel && (
                    <div className="confidence-indicator">
                      <span className="confidence-label">Confidence:</span>
                      <span className={`confidence-value ${locationFacts.confidenceLevel}-confidence`}>
                  {locationFacts.confidenceLevel.charAt(0).toUpperCase() + locationFacts.confidenceLevel.slice(1)}
                </span>
                    </div>
                )}
              </div>

              {locationFacts.examples && locationFacts.examples.length > 0 && (
                  <div className="fact-finder-examples">
                    <table>
                      <thead>
                      <tr>
                        <th>Attribute</th>
                        <th>Value</th>
                        <th>Source</th>
                        <th>Year</th>
                      </tr>
                      </thead>
                      <tbody>
                      {locationFacts.examples.map((example, index) => (
                          <tr key={index}>
                            <td>{example.entity}</td>
                            <td>{example.value}{example.unit ? ` ${example.unit}` : ''}</td>
                            <td>{example.source}</td>
                            <td>{example.year}</td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
              )}

              {locationFacts.recommendedValue && (
                  <div className="fact-finder-recommendation">
                    <strong>Recommendation:</strong> {locationFacts.recommendedValue}
                  </div>
              )}

              {/* Additional geographical data visualization */}
              {locationFacts.additionalData?.openStreetMap && (
                  <div className="geo-data-visualization">
                    <h6>Geographical Context</h6>
                    <div className="geo-data-summary">
                      <p>Location is in <strong>{locationFacts.additionalData.openStreetMap.address.country || 'Unknown Country'}</strong></p>
                      {locationFacts.additionalData.openStreetMap.address.state && (
                          <p>State/Region: <strong>{locationFacts.additionalData.openStreetMap.address.state}</strong></p>
                      )}
                      {(locationFacts.additionalData.openStreetMap.address.city ||
                          locationFacts.additionalData.openStreetMap.address.town ||
                          locationFacts.additionalData.openStreetMap.address.village) && (
                          <p>Nearest settlement: <strong>
                            {locationFacts.additionalData.openStreetMap.address.city ||
                                locationFacts.additionalData.openStreetMap.address.town ||
                                locationFacts.additionalData.openStreetMap.address.village}
                          </strong></p>
                      )}
                    </div>
                  </div>
              )}
            </motion.div>
        )}

        {/* Asset Selection Section */}
        {assets.length > 0 && (
            <div className="fact-finder-asset-selection">
              <h5>Select Asset for Details</h5>
              <div className="asset-buttons">
                {assets.map(asset => (
                    <button
                        key={asset.id}
                        className={`asset-button ${activeAssetId === asset.id ? 'active' : ''} ${asset.isHardToDecarbonize ? 'hard-to-decarbonize' : ''}`}
                        onClick={() => fetchAssetFacts(asset)}
                    >
                      {asset.name}
                    </button>
                ))}
              </div>
            </div>
        )}

        {/* Asset Facts Section */}
        {activeAssetId && assetFacts[activeAssetId] && (
            <motion.div
                className="fact-finder-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
            >
              <h5>Asset Facts</h5>
              <div className={`fact-finder-summary ${assetFacts[activeAssetId].confidenceLevel || 'medium'}-confidence`}>
                {assetFacts[activeAssetId].summary}

                {assetFacts[activeAssetId].confidenceLevel && (
                    <div className="confidence-indicator">
                      <span className="confidence-label">Confidence:</span>
                      <span className={`confidence-value ${assetFacts[activeAssetId].confidenceLevel}-confidence`}>
                  {assetFacts[activeAssetId].confidenceLevel.charAt(0).toUpperCase() + assetFacts[activeAssetId].confidenceLevel.slice(1)}
                </span>
                    </div>
                )}
              </div>

              {assetFacts[activeAssetId].examples && assetFacts[activeAssetId].examples.length > 0 && (
                  <div className="fact-finder-examples">
                    <table>
                      <thead>
                      <tr>
                        <th>Attribute</th>
                        <th>Value</th>
                        <th>Source</th>
                        <th>Year</th>
                      </tr>
                      </thead>
                      <tbody>
                      {assetFacts[activeAssetId].examples.map((example, index) => (
                          <tr key={index}>
                            <td>{example.entity}</td>
                            <td>{example.value}{example.unit ? ` ${example.unit}` : ''}</td>
                            <td>{example.source}</td>
                            <td>{example.year || 'N/A'}</td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
              )}

              {assetFacts[activeAssetId].recommendedValue && (
                  <div className="fact-finder-recommendation">
                    <strong>Recommendation:</strong> {assetFacts[activeAssetId].recommendedValue}
                  </div>
              )}

              {/* Asset visualization - shows carbon intensity and decarbonization potential */}
              <div className="asset-visualization">
                <h6>Carbon Intensity Visualization</h6>
                <div className="intensity-gauge">
                  <div className="gauge-scale">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                    <span>Very High</span>
                  </div>
                  <div className="gauge-indicator-container">
                    {assets.find(a => a.id === activeAssetId) && (
                        <div
                            className={`gauge-indicator ${assets.find(a => a.id === activeAssetId).isHardToDecarbonize ? 'hard-decarbonize' : ''}`}
                            style={{
                              left: `${Math.min(95, (assets.find(a => a.id === activeAssetId).carbonIntensity / 2))}%`
                            }}
                        />
                    )}
                  </div>
                </div>

                {/* Decarbonization potential visualization */}
                <div className="decarbonization-potential">
                  <h6>Decarbonization Pathway</h6>
                  <div className="pathway-visualization">
                    {assets.find(a => a.id === activeAssetId)?.isHardToDecarbonize ? (
                        <div className="hard-pathway">
                          <div className="pathway-step current">Current State</div>
                          <div className="pathway-arrow">→</div>
                          <div className="pathway-step">Efficiency Improvements</div>
                          <div className="pathway-arrow">→</div>
                          <div className="pathway-step">Process Redesign</div>
                          <div className="pathway-arrow">→</div>
                          <div className="pathway-step">Advanced Technology</div>
                          <div className="pathway-arrow">→</div>
                          <div className="pathway-step target">Low Carbon</div>
                        </div>
                    ) : (
                        <div className="standard-pathway">
                          <div className="pathway-step current">Current State</div>
                          <div className="pathway-arrow">→</div>
                          <div className="pathway-step">Efficiency Measures</div>
                          <div className="pathway-arrow">→</div>
                          <div className="pathway-step">Clean Energy</div>
                          <div className="pathway-arrow">→</div>
                          <div className="pathway-step target">Low Carbon</div>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
        )}
      </div>
  );
};

CoordinateFactFinder.propTypes = {
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
  ),
  onFactFound: PropTypes.func,
  autoFetch: PropTypes.bool
};

export default CoordinateFactFinder;