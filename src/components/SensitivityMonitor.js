import React, { useState, useMemo } from 'react';
import './SensitivityMonitor.css';

/**
 * SensitivityMonitor component displays and tracks all configured sensitivity parameters
 * Provides filtering, searching, and historical tracking of sensitivity configurations
 */
const SensitivityMonitor = ({ S, setS, version, activeTab }) => {
  // Component state
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyEnabled, setShowOnlyEnabled] = useState(false);
  const [filterByTab, setFilterByTab] = useState('all');
  const [filterByType, setFilterByType] = useState('all');

  // Reset handlers
  const handleResetAll = () => {
    const resetS = {};
    Object.keys(S).forEach(key => {
      resetS[key] = {
        mode: 'Not Set',
        values: [],
        enabled: false,
        compareToKey: '',
        comparisonType: null,
        waterfall: false,
        bar: false,
        point: false
      };
    });
    setS(resetS);
  };

  const handleResetParameter = (paramId) => {
    setS(prev => ({
      ...prev,
      [paramId]: {
        mode: 'Not Set',
        values: [],
        enabled: false,
        compareToKey: '',
        comparisonType: null,
        waterfall: false,
        bar: false,
        point: false
      }
    }));
  };

  // Helper function to determine which tab a parameter belongs to
  const getParameterTab = (paramId) => {
    const numericPart = parseInt(paramId.replace('S', ''));
    if (numericPart >= 10 && numericPart <= 19) return 'ProjectConfig';
    if (numericPart >= 20 && numericPart <= 29) return 'LoanConfig';
    if (numericPart >= 30 && numericPart <= 39) return 'RatesConfig';
    if (numericPart >= 40 && numericPart <= 49) return 'Process1Config';
    if (numericPart >= 50 && numericPart <= 59) return 'Process2Config';
    if (numericPart >= 60 && numericPart <= 69) return 'Revenue1Config';
    if (numericPart >= 70 && numericPart <= 79) return 'Revenue2Config';
    return 'other';
  };

  // Process raw sensitivity parameters into a more usable format
  const processedParams = useMemo(() => {
    if (!S) return [];
    
    return Object.entries(S)
      .map(([key, config]) => ({
        id: key,
        tab: getParameterTab(key),
        mode: config.mode || 'Not Set',
        values: config.values || [],
        enabled: config.enabled || false,
        compareToKey: config.compareToKey || '',
        comparisonType: config.comparisonType || null,
        waterfall: config.waterfall || false,
        bar: config.bar || false,
        point: config.point || false,
        // Determine visualization types
        visualizationTypes: [
          config.waterfall && 'waterfall',
          config.bar && 'bar',
          config.point && 'point'
        ].filter(Boolean)
      }));
  }, [S]);

  // Apply all filters to the processed parameters
  const filteredParams = useMemo(() => {
    return processedParams.filter(param => {
      // Filter by enabled status if that filter is active
      if (showOnlyEnabled && !param.enabled) return false;
      
      // Filter by visualization type if not set to 'all'
      if (filterByType !== 'all' && !param.visualizationTypes.includes(filterByType)) return false;
      
      // Filter by tab if not set to 'all'
      if (filterByTab !== 'all' && param.tab !== filterByTab) return false;
      
      // Apply search filter to parameter ID
      if (searchTerm && !param.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      return true;
    });
  }, [processedParams, showOnlyEnabled, filterByType, filterByTab, searchTerm]);
  
  // Group parameters by their first digit (e.g., S10-S19, S20-S29, etc.)
  const groupedParams = useMemo(() => {
    const groups = {};
    
    filteredParams.forEach(param => {
      // Extract the group number (first digit after S)
      const groupNumber = param.id.match(/S(\d)/)?.[1] || '0';
      const groupKey = `S${groupNumber}0-S${groupNumber}9`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(param);
    });
    
    return groups;
  }, [filteredParams]);

  return (
    <div className={`sensitivity-monitor ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="monitor-header">
        {isExpanded ? (
          <>
            <h3>Sensitivity Monitor</h3>
            <div>
              <button 
                className="reset-all-button"
                onClick={handleResetAll}
                title="Reset all parameters"
              >
                Reset All
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
            <span className="vertical-text">Sensitivity Monitor</span> ▶
          </button>
        )}
      </div>
      
      {isExpanded && (
        <div className="monitor-content">
          {/* Search and filters */}
          <div className="search-filters">
            <input
              type="text"
              placeholder="Search parameters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <div className="filter-options">
              <label className="filter-option">
                <input 
                  type="checkbox" 
                  checked={showOnlyEnabled}
                  onChange={() => setShowOnlyEnabled(!showOnlyEnabled)}
                />
                Enabled only
              </label>
              
              <select 
                value={filterByTab} 
                onChange={(e) => setFilterByTab(e.target.value)}
                className="tab-filter"
              >
                <option value="all">All Tabs</option>
                <option value="ProjectConfig">Project Configuration</option>
                <option value="LoanConfig">Loan Configuration</option>
                <option value="RatesConfig">Rates & Fixed Costs</option>
                <option value="Process1Config">Process Quantities</option>
                <option value="Process2Config">Process Costs</option>
                <option value="Revenue1Config">Revenue Streams Quantities</option>
                <option value="Revenue2Config">Revenue Streams Prices</option>
              </select>

              <select 
                value={filterByType} 
                onChange={(e) => setFilterByType(e.target.value)}
                className="type-filter"
              >
                <option value="all">All visualizations</option>
                <option value="waterfall">Waterfall</option>
                <option value="bar">Bar</option>
                <option value="point">Point</option>
              </select>
            </div>
          </div>
          
          {/* Status information */}
          <div className="monitor-status">
            <div className="version-info">Version: {version}</div>
            <div className="param-count">
              {filteredParams.length} parameter{filteredParams.length !== 1 ? 's' : ''} 
              {showOnlyEnabled ? ' (enabled)' : ''}
              {filterByTab !== 'all' ? ` in ${filterByTab}` : ''}
            </div>
          </div>
          
          {/* Parameters list - grouped by ranges */}
          <div className="parameters-list">
            {Object.keys(groupedParams).length === 0 ? (
              <div className="empty-state">
                {processedParams.length === 0 
                  ? "No sensitivity parameters configured" 
                  : "No parameters match your filters"}
              </div>
            ) : (
              Object.entries(groupedParams).map(([groupName, params]) => (
                <div key={groupName} className="param-group">
                  <div className="group-header">{groupName}</div>
                  
                  {params.map(param => (
                    <div 
                      key={param.id} 
                      className={`parameter-item ${param.enabled ? 'enabled' : 'disabled'}`}
                    >
                      <div className="parameter-header">
                        <span className="param-id">{param.id}</span>
          <div className="mode-container">
            {param.mode === 'Not Set' ? (
              <span className="not-set-text">Not Set</span>
            ) : (
              <div className="green-box"></div>
            )}
            <button
              className="reset-parameter-button"
              onClick={() => handleResetParameter(param.id)}
              title="Reset this parameter"
            >
              Reset
            </button>
          </div>
                      </div>
                      
                      {param.values.length > 0 && (
                        <div className="param-values">
                          {param.values.filter(v => v !== '').map((value, idx) => (
                            <span key={idx} className="value-chip">{value}</span>
                          ))}
                        </div>
                      )}
                      
                      {param.compareToKey && (
                        <div className="param-comparison">
                          Compares to {param.compareToKey} as {param.comparisonType} axis
                        </div>
                      )}
                      
                      {param.visualizationTypes.length > 0 && (
                        <div className="vis-types">
                          {param.visualizationTypes.map(type => (
                            <span key={type} className={`vis-tag ${type}`}>{type}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SensitivityMonitor;
