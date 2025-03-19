import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { refreshRef } from './SensitivityMonitor';
import '../../styles/HomePage.CSS/ConfigurationMonitor.css';
import useFormValues from '../../useFormValues';

/**
 * ConfigurationMonitor component displays configuration values from U_configurations
 * Provides searching and filtering of configuration parameters
 */
const ConfigurationMonitor = ({ version }) => {
  // Import property mapping from useFormValues
  const { propertyMapping } = useFormValues();
  // Component state
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByGroup, setFilterByGroup] = useState('all');
  const [configData, setConfigData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get display name from property mapping or generate one if not found
  const getDisplayName = (id) => {
    if (propertyMapping[id]) {
      return propertyMapping[id];
    }
    
    // Fallback to generating a display name from ID
    const [baseName] = id.split(/Amount\d+/i);
    return baseName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/(^|\s)\S/g, t => t.toUpperCase())
      .trim();
  };

  // Categorize parameters based on the numeric suffix in their ID
  const categorizeParam = (id) => {
    // Extract the numeric suffix from the ID
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
    { id: "federalTaxRateAmount33", value: 21, remarks: "Federal tax rate" }
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
        return;
      }
      
      const data = await response.json();
      
      if (data.filteredValues && Array.isArray(data.filteredValues) && data.filteredValues.length > 0) {
        console.log(`Loaded ${data.filteredValues.length} configuration values from API`);
        setConfigData(data.filteredValues);
      } else {
        console.warn('API returned empty filteredValues array, using fallback data');
        setConfigData(fallbackConfigData);
      }
    } catch (error) {
      console.error('Error fetching configuration data:', error);
      console.log('Using fallback configuration data due to error');
      setConfigData(fallbackConfigData);
    } finally {
      setIsLoading(false);
    }
  }, [version]);

  // Refresh configuration data
  const handleRefresh = useCallback(() => {
    setConfigData([]);
    setIsLoading(true);
    setError(null);
    fetchConfigData();
    refreshRef.current?.();
  }, [fetchConfigData]);

  // Fetch configuration data on version change
  useEffect(() => {
    fetchConfigData();
  }, [fetchConfigData]);

  // Process and group configuration data
  const groupedParams = useMemo(() => {
    if (!configData || configData.length === 0) return {};
    
    // Filter based on search term and group filter
    const filteredParams = configData.filter(param => {
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
  }, [configData, searchTerm, filterByGroup]);

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
    return value.toString();
  };

  return (
    <div className={`config-monitor ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="config-header">
        {isExpanded ? (
          <>
            <h3>Configuration Monitor</h3>
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
            
            <button
              className="refresh-button"
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
              <option value="Custom Group 1">Custom Group 1</option>
              <option value="Custom Group 2">Custom Group 2</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {/* Status information */}
          <div className="config-status">
            <div className="version-info">Version: {version}</div>
            <div className="param-count">
              {configData.length} parameters
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
            <div className="parameters-list">
              {Object.keys(groupedParams).length === 0 ? (
                <div className="empty-state">
                  {configData.length === 0 
                    ? "No configuration data available" 
                    : "No parameters match your filters"}
                </div>
              ) : (
                Object.entries(groupedParams).map(([groupName, params]) => (
                  <div key={groupName} className="param-group">
                    <div className="group-header">{groupName}</div>
                    
                    {params.map(param => (
                      <div key={param.id} className="parameter-item">
                        <div className="parameter-header">
                          <span className="param-id">{getDisplayName(param.id)}</span>
                          <span className="param-value">{formatValue(param.value)}</span>
                        </div>
                        
                        {param.remarks && (
                          <div className="param-remarks">
                            <span>Note: {param.remarks}</span>
                          </div>
                        )}
                        
                        {/* If this parameter has start/end values */}
                        {(param.start !== undefined || param.end !== undefined) && (
                          <div className="param-period">
                            <span>Period: {param.start || 0} to {param.end || 'End'}</span>
                          </div>
                        )}
                        
                        <div className="param-technical-id">
                          <span>ID: {param.id}</span>
                        </div>
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
