import React, { useState, useEffect, useMemo, useCallback } from 'react';
import '../../styles/HomePage.CSS/ConfigurationMonitor.css';
import useFormValues from '../../useFormValues';

/**
 * ConfigurationMonitor component displays configuration values from U_configurations
 * Provides searching and filtering of configuration parameters
 * Shows both baseline and customized (time-segmented) parameters
 */
const ConfigurationMonitor = ({ version }) => {
  // Import property mapping from useFormValues
  const { propertyMapping } = useFormValues();
  // Component state
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByGroup, setFilterByGroup] = useState('all');
  const [configData, setConfigData] = useState([]); // Baseline parameters (filteredValues)
  const [customizedData, setCustomizedData] = useState([]); // Customized parameters (filteredValue)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(version);



// Refresh parameters by temporarily setting version to 0
  const refreshParameters = useCallback(async () => {
    const originalVersion = version;
    setCurrentVersion('0');
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    setCurrentVersion(originalVersion);
  }, [version]);

  const fetchParameters = async () => {
    setIsLoading(true);
  try {
  // Initial parameters fetch
  const response = await fetch(`http://localhost:5001/parameters/${currentVersion}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch parameters: ${response.status}`);
  }
  } catch (error) {console.error('Error in sensitivity monitoring:', error);
  }finally {
    setIsLoading(false);
  }
  };


  // Get display name from property mapping or generate one if not found
  const getDisplayName = (id) => {
    if (propertyMapping[id]) {
      return propertyMapping[id];
    }
    
    // Handle new parameter formats
    if (id.startsWith('CustomParam_')) {
      return id.replace('CustomParam_', '')
        .replace(/_/g, ' ')
        .replace(/(^|\s)\S/g, t => t.toUpperCase());
    }
    if (id.startsWith('TimeSeg_')) {
      return id.replace('TimeSeg_', 'Time Segment: ')
        .replace(/_/g, ' ')
        .replace(/(^|\s)\S/g, t => t.toUpperCase());
    }
    if (id.startsWith('UserDefined_')) {
      return id.replace('UserDefined_', 'User Defined: ')
        .replace(/_/g, ' ')
        .replace(/(^|\s)\S/g, t => t.toUpperCase());
    }
    
    // Fallback to generating a display name from legacy ID format
    const [baseName] = id.split(/Amount\d+/i);
    return baseName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/(^|\s)\S/g, t => t.toUpperCase())
      .trim();
  };

  // Categorize parameters based on the numeric suffix in their ID or custom prefixes
  const categorizeParam = (id) => {
    // Check for custom parameter prefixes first
    if (id.startsWith('CustomParam_')) return 'Custom Parameters';
    if (id.startsWith('TimeSeg_')) return 'Time-Segmented';
    if (id.startsWith('UserDefined_')) return 'User-Defined';
    
    // Handle legacy numeric suffix parameters
    const match = id.match(/Amount(\d+)/i);
    if (!match) return 'Other';
    
    const amountNumber = parseInt(match[1], 10);
    if (amountNumber >= 10 && amountNumber <= 19) return 'Project Settings';
    if (amountNumber >= 20 && amountNumber <= 29) return 'Loan Settings';
    if (amountNumber >= 30 && amountNumber <= 39) return 'Rate Settings';
    if (amountNumber >= 40 && amountNumber <= 49) return 'Process Quantities';
    if (amountNumber >= 50 && amountNumber <= 59) return 'Process Costs';
    if (amountNumber >= 60 && amountNumber <= 69) return 'Custom Group 1';
    if (amountNumber >= 70 && amountNumber <= 79) return 'Custom Group 2';
    return 'Other';
  };

  // Hardcoded fallback data to display when API fails
  const fallbackConfigData = [
    { id: "plantLifetimeAmount10", value: 20, remarks: "Years of operation" },
    { id: "bECAmount11", value: 240000000, remarks: "Total bare erected cost" },
    { id: "numberOfUnitsAmount12", value: 1, remarks: "Single unit installation" },
    { id: "initialSellingPriceAmount13", value: 75, remarks: "Default selling price" },
    { id: "totalOperatingCostPercentageAmount14", value: 15, remarks: "Operating cost as percentage" },
    { id: "engineering_Procurement_and_Construction_EPC_Amount15", value: 12, remarks: "EPC percentage" },
    { id: "process_contingency_PC_Amount16", value: 10, remarks: "Process contingency" },
    { id: "project_Contingency_PT_BEC_EPC_PCAmount17", value: 15, remarks: "Project contingency" },
    { id: "use_direct_operating_expensesAmount18", value: true, remarks: "Using direct operating expenses" },
    { id: "depreciationMethodAmount20", value: "MACRS", remarks: "Modified Accelerated Cost Recovery System" },
    { id: "loanTypeAmount21", value: "Standard", remarks: "Standard loan type" },
    { id: "interestTypeAmount22", value: "Fixed", remarks: "Fixed interest rate" },
    { id: "generalInflationRateAmount23", value: 2.5, remarks: "Annual inflation rate" },
    { id: "loanPercentageAmount26", value: 80, remarks: "Loan percentage of total cost" },
    { id: "iRRAmount30", value: 12, remarks: "Target internal rate of return" },
    { id: "annualInterestRateAmount31", value: 7.5, remarks: "Annual interest rate" },
    { id: "stateTaxRateAmount32", value: 6, remarks: "State tax rate" },
    { id: "federalTaxRateAmount33", value: 21, remarks: "Federal tax rate" },
    // New parameter types
    { id: "CustomParam_energy_credit_rate", value: 0.3, remarks: "Custom energy credit rate" },
    { id: "TimeSeg_maintenance_cost", value: 50000, remarks: "Maintenance cost time segment", start: 5, end: 10 },
    { id: "UserDefined_equipment_upgrade", value: 150000, remarks: "User defined equipment upgrade cost" }
  ];
  
  // Fetch configuration data function
  const fetchConfigData = useCallback(async () => {
    if (!version) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Always use integer version for U_configurations files
      let intVersion = version;
      if (typeof version === 'string' && version.includes('.')) {
        // For versions like "1.13", use just "1" for config files
        intVersion = version.split('.')[0];
      }
      
      console.log(`Attempting to fetch configuration for version: ${intVersion}`);
      
      // Try load endpoint directly
      const response = await fetch('http://localhost:5000/load_configuration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: intVersion })
      });
      
      if (!response.ok) {
        console.warn(`API returned error status: ${response.status}`);
        console.log('Using fallback configuration data');
        setConfigData(fallbackConfigData);
        setCustomizedData([]);
        return;
      }
      
      const data = await response.json();
      
      // Process baseline configuration values
      if (data.filteredValues && Array.isArray(data.filteredValues) && data.filteredValues.length > 0) {
        console.log(`Loaded ${data.filteredValues.length} baseline configuration values from API`);
        setConfigData(data.filteredValues);
      } else {
        console.warn('API returned empty filteredValues array, using fallback data');
        setConfigData(fallbackConfigData);
      }
      
      // Process customized configuration values with time segments
      if (data.filteredValue && Array.isArray(data.filteredValue)) {
        console.log(`Loaded ${data.filteredValue.length} customized configuration values from API`);
        setCustomizedData(data.filteredValue);
      } else {
        console.warn('API returned empty or non-array filteredValue');
        setCustomizedData([]);
      }
    } catch (error) {
      console.error('Error fetching configuration data:', error);
      console.log('Using fallback configuration data due to error');
      setConfigData(fallbackConfigData);
      setCustomizedData([]);
    } finally {
      setIsLoading(false);
    }
  }, [version]);

  // Refresh configuration data
  const handleRefresh = useCallback(() => {
    setConfigData([]);
    setCustomizedData([]);
    setIsLoading(true);
    setError(null);
    fetchConfigData();
    refreshParameters();
  }, [fetchConfigData]);

  // Fetch configuration data on version change
  useEffect(() => {
    fetchConfigData();
  }, [fetchConfigData]);

  // Combine baseline and customized parameters for display
  // We'll use this to group and filter all parameters
  const allParameters = useMemo(() => {
    const combined = [...configData];
    
    // Process customized parameters
    customizedData.forEach(customParam => {
      // Find if there's a matching baseline parameter
      const baselineIndex = combined.findIndex(bp => bp.id === customParam.id);
      
      if (baselineIndex !== -1) {
        // If there's a baseline parameter with the same ID, add customized data to it
        combined[baselineIndex] = {
          ...combined[baselineIndex],
          hasCustomized: true,
          customized: [...(combined[baselineIndex].customized || []), customParam]
        };
      } else {
        // If no baseline parameter exists, add as a new entry
        combined.push({
          ...customParam,
          hasCustomized: true,
          customized: [customParam]
        });
      }
    });
    
    return combined;
  }, [configData, customizedData]);

  // Process and group configuration data
  const groupedParams = useMemo(() => {
    if (!allParameters || allParameters.length === 0) return {};
    
    // Filter based on search term and group filter
    const filteredParams = allParameters.filter(param => {
      const matchesSearch = searchTerm === '' || 
        param.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        getDisplayName(param.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (param.remarks && param.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const category = categorizeParam(param.id);
      const matchesGroup = filterByGroup === 'all' || category === filterByGroup;
      
      return matchesSearch && matchesGroup;
    });
    
    // Group by category
    return filteredParams.reduce((groups, param) => {
      const category = categorizeParam(param.id);
      
      if (!groups[category]) {
        groups[category] = [];
      }
      
      groups[category].push(param);
      return groups;
    }, {});
  }, [allParameters, searchTerm, filterByGroup]);

  // Format value for display based on type
  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      // Format numbers with appropriate precision
      return Math.abs(value) < 0.01 ? value.toString() : value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return value.toString();
  };

  return (
    <div className={`config-monitor-c ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="config-header-c">
        {isExpanded ? (
          <>
            <h3>Financial Configuration</h3>
            <button 
              className="toggle-button" 
              onClick={() => setIsExpanded(false)}
              title="Collapse panel"
            >
              ◀
            </button>
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
        <div className="config-content-c">
          {/* Search and filters */}
          <div className="search-filters-c">
            <input
              type="text"
              placeholder="Search parameters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <button
              className="refresh-button-c"
              onClick={handleRefresh}
              title="Refresh configuration data"
            >
              Refresh
            </button>

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
              <option value="Custom Parameters">Custom Parameters</option>
              <option value="Time-Segmented">Time-Segmented Parameters</option>
              <option value="User-Defined">User-Defined Groups</option>
              <option value="Custom Group 1">Custom Group 1</option>
              <option value="Custom Group 2">Custom Group 2</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {/* Status information */}
          <div className="config-status-c">
            <div className="version-info">Version: {version}</div>
            <div className="param-count">
              {allParameters.length} parameters 
              {customizedData.length > 0 ? ` (${customizedData.length} customized)` : ''}
            </div>
          </div>
          
          {/* Loading and error states */}
          {isLoading && (
            <div className="loading-indicator">Loading configuration data...</div>
          )}
          
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          {/* Parameters list - grouped by category */}
          {!isLoading && !error && (
            <div className="parameters-list-c">
              {Object.keys(groupedParams).length === 0 ? (
                <div className="empty-state">
                  {allParameters.length === 0 
                    ? "No configuration data available" 
                    : "No parameters match your filters"}
                </div>
              ) : (
                Object.entries(groupedParams).map(([groupName, params]) => (
                  <div key={groupName} className="param-group-c">
                    <div className="group-header">{groupName}</div>
                    
                    {params.map(param => (
                      <div key={param.id} className="parameter-container">
                        {/* Baseline Value */}
                        <div className="parameter-item-c baseline">
                          <div className="parameter-header">
                            <span className="param-id-baseline">{getDisplayName(param.id)}</span>
                            <span className="param-value">{formatValue(param.value)}</span>
                          </div>
                          
                          {param.remarks && (
                            <div className="param-remarks">
                              <span>Note: {param.remarks}</span>
                            </div>
                          )}
                          
                          <div className="param-technical-id">
                            <span>ID: {param.id}</span>
                          </div>
                        </div>

                        {/* Customized Values */}
                        {param.hasCustomized && param.customized && param.customized.length > 0 && (
                          <div className="customized-values-container">
                            {param.customized.map((custom, idx) => (
                              <div key={`${custom.id}-${idx}`} className="parameter-item-c customized">
                                <div className="parameter-header">
                                  <span className="param-id">Customized Value</span>
                                  <span className="param-value">{formatValue(custom.value)}</span>
                                </div>
                                
                                <div className="time-segment">
                                  <div className="time-segment-item">
                                    {custom.start !== undefined ? custom.start : 0}
                                    <div className="time-segment-label">Start</div>
                                  </div>
                                  <div className="time-segment-item">
                                    {custom.end !== undefined ? custom.end : 'End'}
                                    <div className="time-segment-label">End</div>
                                  </div>
                                </div>
                                
                                {custom.remarks && (
                                  <div className="param-remarks">
                                    <span>Note: {custom.remarks}</span>
                                  </div>
                                )}
                              </div>
                            ))}
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
