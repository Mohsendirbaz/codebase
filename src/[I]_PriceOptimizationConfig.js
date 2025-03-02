import React, { useState, useEffect } from 'react';
import './PriceOptimizationConfig.css';

/**
 * PriceOptimizationConfig component allows users to configure price optimization parameters
 * for the Cash Flow Analysis (CFA) calculation.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.selectedVersions - Array of selected version numbers
 * @param {Object} props.optimizationParams - Current optimization parameters
 * @param {Function} props.setOptimizationParams - Function to update optimization parameters
 */
const PriceOptimizationConfig = ({ selectedVersions, optimizationParams, setOptimizationParams }) => {
  console.log("PriceOptimizationConfig rendering with selectedVersions:", selectedVersions);
  // Local state for global parameters
  const [globalParams, setGlobalParams] = useState({
    toleranceLower: -1000,
    toleranceUpper: 1000,
    increaseRate: 1.02,
    decreaseRate: 0.985
  });

  // Local state for version-specific parameters
  const [versionParams, setVersionParams] = useState({});
  
  // Local state for UI
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState('global');

  // Initialize from props
  useEffect(() => {
    if (optimizationParams.global) {
      setGlobalParams(optimizationParams.global);
    }
    
    // Initialize version-specific parameters
    const newVersionParams = {};
    
    // Ensure selectedVersions is an array
    const versions = Array.isArray(selectedVersions) ? selectedVersions : [];
    console.log("Processing versions:", versions);
    
    versions.forEach(version => {
      // Convert version to string for consistent key handling
      const versionKey = String(version);
      if (optimizationParams[versionKey]) {
        newVersionParams[versionKey] = optimizationParams[versionKey];
      } else {
        newVersionParams[versionKey] = { ...globalParams };
      }
    });
    
    setVersionParams(newVersionParams);
    
    // If we have versions but no active tab is set, set the first version as active
    if (versions.length > 0 && activeTab === 'global') {
      setActiveTab(`version-${versions[0]}`);
    } else if (versions.length === 0) {
      // If no versions are selected, make sure we're on the global tab
      setActiveTab('global');
    }
  }, [optimizationParams, selectedVersions]);

  // Update the parent component's state when parameters change
  const updateOptimizationParams = () => {
    const newParams = { global: globalParams };
    
    // Only include version-specific parameters if they differ from global
    Object.entries(versionParams).forEach(([version, params]) => {
      if (
        params.toleranceLower !== globalParams.toleranceLower ||
        params.toleranceUpper !== globalParams.toleranceUpper ||
        params.increaseRate !== globalParams.increaseRate ||
        params.decreaseRate !== globalParams.decreaseRate
      ) {
        newParams[version] = params;
      }
    });
    
    setOptimizationParams(newParams);
  };

  // Handle changes to global parameters
  const handleGlobalChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    setGlobalParams(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  // Handle changes to version-specific parameters
  const handleVersionChange = (version, name, value) => {
    const numValue = parseFloat(value);
    
    setVersionParams(prev => ({
      ...prev,
      [version]: {
        ...prev[version],
        [name]: numValue
      }
    }));
  };

  // Apply global parameters to all versions
  const applyGlobalToAll = () => {
    const newVersionParams = {};
    selectedVersions.forEach(version => {
      newVersionParams[version] = { ...globalParams };
    });
    setVersionParams(newVersionParams);
  };

  // Apply changes when parameters are updated
  useEffect(() => {
    updateOptimizationParams();
  }, [globalParams, versionParams]);

  return (
    <div className="price-optimization-config">
      <div className="optimization-header">
        <h3>Price Optimization Parameters</h3>
        <button 
          className="toggle-advanced-button"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </button>
      </div>
      
      {showAdvanced && (
        <div className="advanced-settings">
          <div className="tabs">
            <button 
              className={`tab-button ${activeTab === 'global' ? 'active' : ''}`}
              onClick={() => setActiveTab('global')}
            >
              Global Settings
            </button>
            {Array.isArray(selectedVersions) && selectedVersions.map(version => (
              <button 
                key={version}
                className={`tab-button ${activeTab === `version-${version}` ? 'active' : ''}`}
                onClick={() => setActiveTab(`version-${version}`)}
              >
                Version {version}
              </button>
            ))}
          </div>
          
          <div className="tab-content">
            {activeTab === 'global' ? (
              <div className="global-params">
                <div className="param-group">
                  <h4>NPV Tolerance Bounds</h4>
                  <div className="param-row">
                    <label>
                      Lower Bound:
                      <input 
                        type="number" 
                        name="toleranceLower" 
                        value={globalParams.toleranceLower} 
                        onChange={handleGlobalChange}
                      />
                    </label>
                    <label>
                      Upper Bound:
                      <input 
                        type="number" 
                        name="toleranceUpper" 
                        value={globalParams.toleranceUpper} 
                        onChange={handleGlobalChange}
                      />
                    </label>
                  </div>
                </div>
                
                <div className="param-group">
                  <h4>Price Adjustment Rates</h4>
                  <div className="param-row">
                    <label>
                      Increase Rate:
                      <input 
                        type="number" 
                        name="increaseRate" 
                        value={globalParams.increaseRate} 
                        onChange={handleGlobalChange}
                        step="0.001"
                        min="1.001"
                        max="1.5"
                      />
                    </label>
                    <label>
                      Decrease Rate:
                      <input 
                        type="number" 
                        name="decreaseRate" 
                        value={globalParams.decreaseRate} 
                        onChange={handleGlobalChange}
                        step="0.001"
                        min="0.5"
                        max="0.999"
                      />
                    </label>
                  </div>
                </div>
                
                <button 
                  className="apply-global-button"
                  onClick={applyGlobalToAll}
                >
                  Apply to All Versions
                </button>
              </div>
            ) : (
              // Version-specific parameters
              Array.isArray(selectedVersions) && selectedVersions.map(version => {
                if (activeTab !== `version-${version}`) return null;
                
                const params = versionParams[version] || { ...globalParams };
                
                return (
                  <div key={version} className="version-params">
                    <h4>Version {version} Settings</h4>
                    
                    <div className="param-group">
                      <h4>NPV Tolerance Bounds</h4>
                      <div className="param-row">
                        <label>
                          Lower Bound:
                          <input 
                            type="number" 
                            value={params.toleranceLower} 
                            onChange={(e) => handleVersionChange(version, 'toleranceLower', e.target.value)}
                          />
                        </label>
                        <label>
                          Upper Bound:
                          <input 
                            type="number" 
                            value={params.toleranceUpper} 
                            onChange={(e) => handleVersionChange(version, 'toleranceUpper', e.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                    
                    <div className="param-group">
                      <h4>Price Adjustment Rates</h4>
                      <div className="param-row">
                        <label>
                          Increase Rate:
                          <input 
                            type="number" 
                            value={params.increaseRate} 
                            onChange={(e) => handleVersionChange(version, 'increaseRate', e.target.value)}
                            step="0.001"
                            min="1.001"
                            max="1.5"
                          />
                        </label>
                        <label>
                          Decrease Rate:
                          <input 
                            type="number" 
                            value={params.decreaseRate} 
                            onChange={(e) => handleVersionChange(version, 'decreaseRate', e.target.value)}
                            step="0.001"
                            min="0.5"
                            max="0.999"
                          />
                        </label>
                      </div>
                    </div>
                    
                    <button 
                      className="reset-version-button"
                      onClick={() => setVersionParams(prev => ({
                        ...prev,
                        [version]: { ...globalParams }
                      }))}
                    >
                      Reset to Global
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      
      <div className="optimization-info">
        <p>
          <strong>How it works:</strong> The price optimization algorithm adjusts the selling price 
          iteratively until the Net Present Value (NPV) at the target year falls within the specified 
          tolerance bounds.
        </p>
        {showAdvanced && (
          <div className="parameter-explanation">
            <ul>
              <li><strong>Tolerance Bounds:</strong> The acceptable range for NPV (e.g., -1000 to 1000)</li>
              <li><strong>Increase Rate:</strong> Multiplier to increase price when NPV is too low (e.g., 1.02 = +2%)</li>
              <li><strong>Decrease Rate:</strong> Multiplier to decrease price when NPV is too high (e.g., 0.985 = -1.5%)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceOptimizationConfig;