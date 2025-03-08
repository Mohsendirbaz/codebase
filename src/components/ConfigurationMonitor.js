import React, { useState, useEffect, useMemo } from 'react';
import './ConfigurationMonitor.css';
// Import propertyMapping from the central file
import useFormValues from '../useFormValues';

/**
 * ConfigurationMonitor component displays configuration values from U_configurations
 * Provides searching and filtering of configuration parameters
 * Shows both standard and time-dependent parameter variations
 * 
 * @param {Object} props Component props
 * @param {string|number} props.version Current configuration version to display
 */
const ConfigurationMonitor = ({ version }) => {
  // Component state
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByGroup, setFilterByGroup] = useState('all');
  const [configData, setConfigData] = useState([]);
  const [timeDependentData, setTimeDependentData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // Get propertyMapping from the central file
  const { propertyMapping } = useFormValues();

  // Helper function to categorize parameters by their group
  const categorizeParam = (id) => {
    if (id.includes('Amount1')) return 'Project Settings';
    if (id.includes('Amount2')) return 'Loan Settings';
    if (id.includes('Amount3')) return 'Rate Settings';
    if (id.includes('Amount4') || id.includes('vAmount4')) return 'Process Quantities';
    if (id.includes('Amount5') || id.includes('vAmount5')) return 'Process Costs';
    if (id.includes('Amount6') || id.includes('vAmount6')) return 'Custom Group 1';
    if (id.includes('Amount7') || id.includes('vAmount7')) return 'Custom Group 2';
    return 'Other';
  };

  /**
   * Fetch configuration data from backend when version changes
   * Uses dedicated ConfigurationMonitor API endpoints
   */
  const fetchConfigData = async () => {
    // Skip fetch if version is empty/invalid
    if (!version) {
      console.log('ConfigurationMonitor: Skipping fetch - no version provided');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`ConfigurationMonitor: Fetching configuration for version ${version}`);
      
      // Fetch standard parameters from dedicated endpoint
      const response = await fetch(`http://localhost:5001/config_monitor/standard/${version}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch standard configuration data: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract standard parameters from filteredValues
      if (data.filteredValues && Array.isArray(data.filteredValues)) {
        const standardParams = data.filteredValues.map(item => ({
          id: item.id,
          value: typeof item.value === 'string' ? 
                (isNaN(item.value) ? item.value : parseFloat(item.value)) : 
                item.value,
          remarks: item.remarks || ''
        }));
        
        setConfigData(standardParams);
        console.log(`ConfigurationMonitor: Processed ${standardParams.length} standard parameters`);
      }
      
      // Fetch time-dependent parameters from dedicated endpoint
      try {
        const tdResponse = await fetch(`http://localhost:5001/config_monitor/time_dependent/${version}`);
        
        if (tdResponse.ok) {
          const tdData = await tdResponse.json();
          
          if (tdData.timeDependent && Array.isArray(tdData.timeDependent)) {
            setTimeDependentData(tdData.timeDependent);
            console.log(`ConfigurationMonitor: Processed ${tdData.timeDependent.length} time-dependent parameters`);
          }
        } else {
          console.warn(`Failed to fetch time-dependent parameters: ${tdResponse.status}`);
        }
      } catch (tdError) {
        console.warn('Unable to fetch time-dependent parameters:', tdError);
      }
      
      setLastFetchTime(new Date());
      
    } catch (error) {
      console.error('Error fetching configuration data:', error);
      setError(`Failed to load configuration data: ${error.message}`);
      
      // Fallback to existing endpoint if the dedicated server is not available
      try {
        console.log('Attempting fallback to existing load_configuration endpoint');
        
        const fallbackResponse = await fetch('http://localhost:5000/load_configuration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ version })
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          
          if (fallbackData.filteredValues && Array.isArray(fallbackData.filteredValues)) {
            const standardParams = fallbackData.filteredValues.map(item => ({
              id: item.id,
              value: typeof item.value === 'string' ? 
                    (isNaN(item.value) ? item.value : parseFloat(item.value)) : 
                    item.value,
              remarks: item.remarks || ''
            }));
            
            setConfigData(standardParams);
            setError(null); // Clear error since fallback succeeded
            setLastFetchTime(new Date());
            console.log(`Fallback successful: Processed ${standardParams.length} standard parameters`);
          }
        } else {
          console.error('Fallback also failed:', fallbackResponse.status);
        }
      } catch (fallbackError) {
        console.error('Fallback attempt failed:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when version changes
  useEffect(() => {
    fetchConfigData();
  }, [version]);

  // Organize configurations by parameter ID to group standard and time-dependent variants
  const organizedParams = useMemo(() => {
    const result = {};
    
    // First, add all standard parameters
    configData.forEach(param => {
      if (!result[param.id]) {
        result[param.id] = {
          id: param.id,
          name: propertyMapping[param.id] || param.id,
          category: categorizeParam(param.id),
          standard: param,
          timeVariants: []
        };
      }
    });
    
    // Then add time-dependent variants
    timeDependentData.forEach(param => {
      if (!result[param.id]) {
        // Create entry if it doesn't exist (shouldn't happen normally, but for robustness)
        result[param.id] = {
          id: param.id,
          name: propertyMapping[param.id] || param.id,
          category: categorizeParam(param.id),
          standard: null,
          timeVariants: []
        };
      }
      
      result[param.id].timeVariants.push(param);
    });
    
    return result;
  }, [configData, timeDependentData, propertyMapping]);

  // Filter and group parameters based on search and category filter
  const filteredGroupedParams = useMemo(() => {
    const groups = {};
    
    Object.values(organizedParams).forEach(param => {
      // Skip if it doesn't match search term
      const matchesSearch = searchTerm === '' || 
        param.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        param.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (param.standard?.remarks && param.standard.remarks.toLowerCase().includes(searchTerm.toLowerCase())) ||
        param.timeVariants.some(v => v.remarks && v.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return;
      
      // Skip if it doesn't match category filter
      if (filterByGroup !== 'all' && param.category !== filterByGroup) return;
      
      // Add to the appropriate group
      if (!groups[param.category]) {
        groups[param.category] = [];
      }
      
      groups[param.category].push(param);
    });
    
    // Sort parameters within each group
    Object.keys(groups).forEach(category => {
      groups[category].sort((a, b) => a.id.localeCompare(b.id));
    });
    
    return groups;
  }, [organizedParams, searchTerm, filterByGroup]);

  // Format value for display based on type
  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      // Format numbers with appropriate precision
      return Math.abs(value) < 0.01 ? value.toFixed(4) : value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }
    return value.toString();
  };

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchConfigData();
  };

  return (
    <div className={`config-monitor ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="config-header">
        {isExpanded ? (
          <>
            <h3>Configuration Monitor</h3>
            <div className="header-controls">
              <button 
                className="refresh-button" 
                onClick={handleManualRefresh}
                title="Refresh configuration data"
                disabled={isLoading}
              >
                ↻
              </button>
              <button 
                className="toggle-button" 
                onClick={() => setIsExpanded(false)}
                title="Collapse panel"
              >
                ◀
              </button>
            </div>
          </>
        ) : (
          <button 
            className="expand-button" 
            onClick={() => setIsExpanded(true)}
            title="Expand panel"
          >
            <span className="vertical-text">Configuration Monitor</span> ▶
          </button>
        )}
      </div>
      
      {isExpanded && (
        <div className="config-content">
          {/* Search and filters */}
          <div className="search-filters">
            <input
              type="text"
              placeholder="Search parameters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <select 
              value={filterByGroup} 
              onChange={(e) => setFilterByGroup(e.target.value)}
              className="group-filter"
            >
              <option value="all">All Parameter Groups</option>
              <option value="Project Settings">Project Settings</option>
              <option value="Loan Settings">Loan Settings</option>
              <option value="Rate Settings">Rate Settings</option>
              <option value="Process Quantities">Process Quantities</option>
              <option value="Process Costs">Process Costs</option>
              <option value="Custom Group 1">Custom Group 1</option>
              <option value="Custom Group 2">Custom Group 2</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {/* Status information */}
          <div className="config-status">
            <div className="version-info">Version: {version}</div>
            <div className="param-count">
              <span>{configData.length} parameters</span>
              {timeDependentData.length > 0 && (
                <span> • {timeDependentData.length} time variations</span>
              )}
              {lastFetchTime && (
                <span className="last-updated">
                  • Updated: {lastFetchTime.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          
          {/* Loading and error states */}
          {isLoading && (
            <div className="loading-indicator">Loading configuration data...</div>
          )}
          
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          {/* Integrated parameters list - grouped by category */}
          {!isLoading && !error && (
            <div className="parameters-list">
              {Object.keys(filteredGroupedParams).length === 0 ? (
                <div className="empty-state">
                  {Object.keys(organizedParams).length === 0
                    ? "No configuration data available" 
                    : "No parameters match your filters"}
                </div>
              ) : (
                Object.entries(filteredGroupedParams).map(([groupName, params]) => (
                  <div key={groupName} className="param-group">
                    <div className="group-header">{groupName}</div>
                    
                    {params.map(param => (
                      <div key={param.id} className="parameter-container">
                        <div className="parameter-id-header">
                          <span className="param-name">{param.name}</span>
                          <span className="param-technical-id">ID: {param.id}</span>
                        </div>
                        
                        {/* Standard parameter value */}
                        {param.standard && (
                          <div className="parameter-standard">
                            <div className="parameter-value-row">
                              <span className="param-value-label">Base Value:</span>
                              <span className="param-value">{formatValue(param.standard.value)}</span>
                            </div>
                            
                            {param.standard.remarks && (
                              <div className="param-remarks">
                                <span>Note: {param.standard.remarks}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Time-dependent variations */}
                        {param.timeVariants.length > 0 && (
                          <div className="parameter-time-variants">
                            <div className="time-variants-header">
                              Time-Dependent Values:
                            </div>
                            <div className="time-variants-list">
                              {param.timeVariants.map((variant, idx) => (
                                <div key={`${param.id}-tv-${idx}`} className="time-variant-item">
                                  <div className="time-variant-period">
                                    Years {variant.start} to {variant.end}:
                                  </div>
                                  <div className="time-variant-value">
                                    {formatValue(variant.value)}
                                  </div>
                                  {variant.remarks && (
                                    <div className="time-variant-remarks">
                                      {variant.remarks}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConfigurationMonitor;