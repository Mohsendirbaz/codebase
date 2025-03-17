import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../../styles/HomePage.CSS/SensitivityMonitor.css';

/**
 * SensitivityMonitor component for configuring and managing sensitivity analysis parameters
 * 
 * @param {Object} props
 * @param {Object} props.S - Sensitivity parameters state object
 * @param {Function} props.setS - Function to update sensitivity parameters
 * @param {string} props.version - Current version number
 * @param {string} props.activeTab - Currently active application tab
 */
const SensitivityMonitor = ({ S, setS, version, activeTab }) => {
  // Component state
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [parameterDetails, setParameterDetails] = useState(null);
  const [availableParameters, setAvailableParameters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modes available for sensitivity analysis
  const sensitivityModes = [
    { id: 'range', label: 'Range Analysis', description: 'Test a range of values' },
    { id: 'discrete', label: 'Discrete Values', description: 'Test specific values' },
    { id: 'percentage', label: 'Percentage Change', description: 'Test percentage variations' },
    { id: 'monteCarlo', label: 'Monte Carlo', description: 'Random sampling within bounds' }
  ];
  
  // Comparison types for parameter relationships
  const comparisonTypes = [
    { id: 'none', label: 'No Comparison' },
    { id: 'ratio', label: 'Ratio (A:B)' },
    { id: 'difference', label: 'Difference (A-B)' },
    { id: 'product', label: 'Product (A×B)' }
  ];

  // Fetch available parameters from the backend
  useEffect(() => {
    if (!version) return;
    
    const fetchParameters = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:5001/parameters/${version}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch parameters: ${response.status}`);
        }
        
        const data = await response.json();
        setAvailableParameters(data.parameters || []);
      } catch (error) {
        console.error('Error fetching sensitivity parameters:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchParameters();
  }, [version]);
  
  // Filter parameters based on search term and filter mode
  const filteredParameters = useMemo(() => {
    return Object.entries(S).filter(([key, value]) => {
      // Extract parameter number for categorization
      const paramNumber = parseInt(key.replace('S', ''), 10);
      
      // Match search term
      const matchesSearch = searchTerm === '' || 
        key.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Match filter mode
      let matchesFilter = filterMode === 'all';
      
      if (filterMode === 'enabled' && value.enabled) {
        matchesFilter = true;
      } else if (filterMode === 'disabled' && !value.enabled) {
        matchesFilter = true;
      } else if (filterMode === 'project' && paramNumber >= 10 && paramNumber <= 19) {
        matchesFilter = true;
      } else if (filterMode === 'loan' && paramNumber >= 20 && paramNumber <= 29) {
        matchesFilter = true;
      } else if (filterMode === 'rates' && paramNumber >= 30 && paramNumber <= 39) {
        matchesFilter = true;
      } else if (filterMode === 'quantities' && paramNumber >= 40 && paramNumber <= 49) {
        matchesFilter = true;
      } else if (filterMode === 'costs' && paramNumber >= 50 && paramNumber <= 59) {
        matchesFilter = true;
      }
      
      return matchesSearch && matchesFilter;
    });
  }, [S, searchTerm, filterMode]);
  
  // Get parameter name from key
  const getParameterName = useCallback((key) => {
    const paramNumber = key.replace('S', '');
    const matchingParam = availableParameters.find(p => p.id === `Amount${paramNumber}`);
    
    if (matchingParam) {
      return matchingParam.name || matchingParam.id;
    }
    
    return `Parameter ${paramNumber}`;
  }, [availableParameters]);
  
  // Handle enabling/disabling a parameter
  const toggleParameterEnabled = useCallback((key) => {
    setS(prevS => ({
      ...prevS,
      [key]: {
        ...prevS[key],
        enabled: !prevS[key].enabled
      }
    }));
  }, [setS]);
  
  // Open parameter details panel
  const openParameterDetails = useCallback((key) => {
    setSelectedParameter(key);
    setParameterDetails(S[key]);
  }, [S]);
  
  // Update parameter details
  const updateParameterDetails = useCallback((field, value) => {
    setParameterDetails(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  // Save parameter changes
  const saveParameterChanges = useCallback(() => {
    if (!selectedParameter || !parameterDetails) return;
    
    setS(prevS => ({
      ...prevS,
      [selectedParameter]: {
        ...parameterDetails
      }
    }));
    
    // Close the details panel
    setSelectedParameter(null);
    setParameterDetails(null);
  }, [selectedParameter, parameterDetails, setS]);
  
  // Cancel parameter editing
  const cancelParameterEditing = useCallback(() => {
    setSelectedParameter(null);
    setParameterDetails(null);
  }, []);
  
  // Helper to add a value to a parameter's values array
  const addParameterValue = useCallback(() => {
    if (!parameterDetails) return;
    
    setParameterDetails(prev => ({
      ...prev,
      values: [...prev.values, 0]
    }));
  }, [parameterDetails]);
  
  // Helper to remove a value from a parameter's values array
  const removeParameterValue = useCallback((index) => {
    if (!parameterDetails) return;
    
    setParameterDetails(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index)
    }));
  }, [parameterDetails]);
  
  // Update a specific value in the values array
  const updateParameterValue = useCallback((index, value) => {
    if (!parameterDetails) return;
    
    const newValue = parseFloat(value);
    if (isNaN(newValue)) return;
    
    setParameterDetails(prev => {
      const newValues = [...prev.values];
      newValues[index] = newValue;
      return {
        ...prev,
        values: newValues
      };
    });
  }, [parameterDetails]);
  
  // Reset all sensitivity parameters
  const resetAllParameters = useCallback(() => {
    const initialS = {};
    for (let i = 10; i <= 79; i++) {
      initialS[`S${i}`] = {
        mode: null,
        values: [],
        enabled: false,
        compareToKey: '',
        comparisonType: null,
      };
    }
    setS(initialS);
  }, [setS]);
  
  // Determine if the component should be visible based on activeTab
  const isVisible = useMemo(() => {
    return ['Input', 'Case1', 'Case2', 'Case3', 'Scaling'].includes(activeTab);
  }, [activeTab]);
  
  // If not visible, don't render anything
  if (!isVisible) return null;
  
  return (
    <div className={`sensitivity-monitor ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="monitor-header">
        {isExpanded ? (
          <>
            <h3>Sensitivity Analysis Configuration</h3>
            <button 
              className="collapse-button" 
              onClick={() => setIsExpanded(false)}
              aria-label="Collapse panel"
            >
              ▼
            </button>
          </>
        ) : (
          <button 
            className="expand-button" 
            onClick={() => setIsExpanded(true)}
            aria-label="Expand panel"
          >
            <span className="vertical-text">Sensitivity Analysis</span> ▲
          </button>
        )}
      </div>
      
      {isExpanded && (
        <div className="monitor-content">
          <div className="monitor-toolbar">
            <input
              type="text"
              placeholder="Search parameters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <select 
              value={filterMode} 
              onChange={(e) => setFilterMode(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Parameters</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
              <option value="project">Project Settings (10-19)</option>
              <option value="loan">Loan Settings (20-29)</option>
              <option value="rates">Rate Settings (30-39)</option>
              <option value="quantities">Process Quantities (40-49)</option>
              <option value="costs">Process Costs (50-59)</option>
            </select>
            
            <button 
              className="reset-button"
              onClick={resetAllParameters}
              title="Reset all sensitivity parameters"
            >
              Reset All
            </button>
          </div>
          
          {isLoading ? (
            <div className="loading-indicator">Loading parameters...</div>
          ) : (
            <div className="parameters-container">
              {filteredParameters.length === 0 ? (
                <div className="empty-state">
                  No sensitivity parameters match your criteria
                </div>
              ) : (
                <ul className="parameters-list">
                  {filteredParameters.map(([key, value]) => (
                    <li key={key} className={`parameter-item ${value.enabled ? 'enabled' : 'disabled'}`}>
                      <div className="parameter-header">
                        <div className="parameter-info">
                          <span className="parameter-key">{key}</span>
                          <span className="parameter-name">{getParameterName(key)}</span>
                        </div>
                        
                        <div className="parameter-controls">
                          <label className="toggle-label">
                            <input 
                              type="checkbox" 
                              checked={value.enabled} 
                              onChange={() => toggleParameterEnabled(key)}
                              className="toggle-checkbox"
                            />
                            <span className="toggle-slider"></span>
                          </label>
                          
                          <button 
                            className="edit-button"
                            onClick={() => openParameterDetails(key)}
                            disabled={!value.enabled}
                            title="Configure parameter"
                          >
                            Configure
                          </button>
                        </div>
                      </div>
                      
                      {value.enabled && (
                        <div className="parameter-summary">
                          <div className="parameter-mode">
                            <span className="label">Mode:</span> 
                            <span className="value">
                              {value.mode ? 
                                sensitivityModes.find(m => m.id === value.mode)?.label || value.mode 
                                : 'Not configured'}
                            </span>
                          </div>
                          
                          {value.values.length > 0 && (
                            <div className="parameter-values">
                              <span className="label">Values:</span> 
                              <span className="value">
                                {value.values.length === 1 ? 
                                  value.values[0] : 
                                  `${value.values.length} values`}
                              </span>
                            </div>
                          )}
                          
                          {value.compareToKey && (
                            <div className="parameter-comparison">
                              <span className="label">Compared to:</span> 
                              <span className="value">
                                {getParameterName(value.compareToKey)} 
                                ({comparisonTypes.find(c => c.id === value.comparisonType)?.label || 'comparison'})
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {/* Parameter details modal */}
          {selectedParameter && parameterDetails && (
            <div className="parameter-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h4>Configure {getParameterName(selectedParameter)}</h4>
                  <button 
                    className="close-button"
                    onClick={cancelParameterEditing}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="sensitivity-mode">Sensitivity Mode</label>
                    <select 
                      id="sensitivity-mode"
                      value={parameterDetails.mode || ''}
                      onChange={(e) => updateParameterDetails('mode', e.target.value)}
                      className="form-control"
                    >
                      <option value="">Select a mode</option>
                      {sensitivityModes.map(mode => (
                        <option key={mode.id} value={mode.id}>
                          {mode.label} - {mode.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {parameterDetails.mode && (
                    <>
                      <div className="form-group">
                        <label>Parameter Values</label>
                        <div className="values-container">
                          {parameterDetails.values.length === 0 ? (
                            <div className="empty-values">No values configured</div>
                          ) : (
                            <ul className="values-list">
                              {parameterDetails.values.map((value, index) => (
                                <li key={index} className="value-item">
                                  <input 
                                    type="number"
                                    value={value}
                                    onChange={(e) => updateParameterValue(index, e.target.value)}
                                    className="value-input"
                                    step="0.01"
                                  />
                                  <button 
                                    className="remove-value-button"
                                    onClick={() => removeParameterValue(index)}
                                    aria-label="Remove value"
                                  >
                                    -
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          
                          <button 
                            className="add-value-button"
                            onClick={addParameterValue}
                          >
                            Add Value
                          </button>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="comparison-parameter">Compare To Parameter</label>
                        <select 
                          id="comparison-parameter"
                          value={parameterDetails.compareToKey || ''}
                          onChange={(e) => updateParameterDetails('compareToKey', e.target.value)}
                          className="form-control"
                        >
                          <option value="">No comparison</option>
                          {Object.keys(S)
                            .filter(key => key !== selectedParameter && S[key].enabled)
                            .map(key => (
                              <option key={key} value={key}>
                                {getParameterName(key)} ({key})
                              </option>
                            ))}
                        </select>
                      </div>
                      
                      {parameterDetails.compareToKey && (
                        <div className="form-group">
                          <label htmlFor="comparison-type">Comparison Type</label>
                          <select 
                            id="comparison-type"
                            value={parameterDetails.comparisonType || 'none'}
                            onChange={(e) => updateParameterDetails('comparisonType', e.target.value)}
                            className="form-control"
                          >
                            {comparisonTypes.map(type => (
                              <option key={type.id} value={type.id}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="modal-footer">
                  <button 
                    className="cancel-button"
                    onClick={cancelParameterEditing}
                  >
                    Cancel
                  </button>
                  <button 
                    className="save-button"
                    onClick={saveParameterChanges}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SensitivityMonitor;
