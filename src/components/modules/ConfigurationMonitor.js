import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/L_1_HomePage.CSS/ConfigurationMonitor.css';

/**
 * ConfigurationMonitor component displays configuration values from U_configurations
 * Provides searching and filtering of configuration parameters
 */
const ConfigurationMonitor = ({ version }) => {
  // Component state
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByGroup, setFilterByGroup] = useState('all');
  const [configData, setConfigData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Property mapping for human-readable names
  const propertyMapping = {
    // Amount10-19 group
    "plantLifetimeAmount10": "Plant Lifetime",
    "bECAmount11": "Bare Erected Cost",
    "numberOfUnitsAmount12": "Number of Units",
    "initialSellingPriceAmount13": "Price",
    "totalOperatingCostPercentageAmount14": "Direct Total Operating Cost Percentage as % of Revenue",
    "engineering_Procurement_and_Construction_EPC_Amount15": "Engineering Procurement and Construction as % of BEC",
    "process_contingency_PC_Amount16": "Process Contingency as % of BEC",
    "project_Contingency_PT_BEC_EPC_PCAmount17": "Project Contingency as % of BEC, EPC, PC",
    "use_direct_operating_expensesAmount18": "Use Direct Operating Expenses",

    // Amount20-29 group
    "depreciationMethodAmount20": "Depreciation Method",
    "loanTypeAmount21": "Loan Type",
    "interestTypeAmount22": "Interest Type",
    "generalInflationRateAmount23": "General Inflation Rate",
    "interestProportionAmount24": "Interest Proportion",
    "principalProportionAmount25": "Principal Proportion",
    "loanPercentageAmount26": "Loan Percentage of TOC",
    "repaymentPercentageOfRevenueAmount27": "Repayment Percentage Of Revenue",
    "numberofconstructionYearsAmount28": "Number of Construction Years",

    // Amount30-39 group
    "iRRAmount30": "Internal Rate of Return",
    "annualInterestRateAmount31": "Annual Interest Rate",
    "stateTaxRateAmount32": "State Tax Rate",
    "federalTaxRateAmount33": "Federal Tax Rate",
    "rawmaterialAmount34": "Feedstock Cost",
    "laborAmount35": "Labor Cost",
    "utilityAmount36": "Utility Cost",
    "maintenanceAmount37": "Maintenance Cost",
    "insuranceAmount38": "Insurance Cost",
  };

  // Helper function to categorize parameters by their group (Amount10-19, Amount20-29, etc.)
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

  // Fetch configuration data from backend when version changes
  useEffect(() => {
    if (!version) return;
    
    const fetchConfigData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:5000/load_configuration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ version })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch configuration data: ${response.status}`);
        }
        
        const data = await response.json();
        setConfigData(data.filteredValues || []);
      } catch (error) {
        console.error('Error fetching configuration data:', error);
        setError('Failed to load configuration data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfigData();
  }, [version]);

  // Process and group configuration data
  const groupedParams = useMemo(() => {
    if (!configData || configData.length === 0) return {};
    
    // Filter based on search term and group filter
    const filteredParams = configData.filter(param => {
      const matchesSearch = searchTerm === '' || 
        param.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (propertyMapping[param.id] && propertyMapping[param.id].toLowerCase().includes(searchTerm.toLowerCase())) ||
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
                          <span className="param-id">{propertyMapping[param.id] || param.id}</span>
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
