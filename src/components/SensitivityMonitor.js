import React, { useState, useEffect, useMemo } from 'react';
import './SensitivityMonitor.css';

/**
 * SensitivityMonitor component displays and tracks all configured sensitivity parameters
 * Provides filtering, searching, and historical tracking of sensitivity configurations
 */
const SensitivityMonitor = ({ S, version, activeTab }) => {
  // Component state
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyEnabled, setShowOnlyEnabled] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [filterByTab, setFilterByTab] = useState(false);
  const [filterByType, setFilterByType] = useState('all');
  const [sensitivityHistory, setSensitivityHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch sensitivity history from backend when version changes
  useEffect(() => {
    if (!version || !showHistory) return;
    
    const fetchSensitivityHistory = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/get_sensitivity_history/${version}`);
        if (response.ok) {
          const data = await response.json();
          // Parse log lines into structured data
          const parsedHistory = data.logs.map(logLine => {
            try {
              const [timestamp, rest] = logLine.split(' - ');
              const [sKey, configString] = rest.split(': ');
              const config = JSON.parse(configString);
              return { timestamp, sKey, config };
            } catch (e) {
              console.error('Error parsing log line:', e);
              return null;
            }
          }).filter(item => item !== null);
          
          setSensitivityHistory(parsedHistory);
        }
      } catch (error) {
        console.error('Error fetching sensitivity history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSensitivityHistory();
  }, [version, showHistory]);

  // Process raw sensitivity parameters into a more usable format
  const processedParams = useMemo(() => {
    if (!S) return [];
    
    return Object.entries(S)
      .map(([key, config]) => ({
        id: key,
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
      
      // Apply search filter to parameter ID
      if (searchTerm && !param.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      return true;
    });
  }, [processedParams, showOnlyEnabled, filterByType, searchTerm]);
  
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

  // Format a timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className={`sensitivity-monitor ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="monitor-header">
        {isExpanded ? (
          <>
            <h3>Sensitivity Monitor</h3>
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
              
              <label className="filter-option">
                <input 
                  type="checkbox" 
                  checked={showHistory}
                  onChange={() => setShowHistory(!showHistory)}
                />
                Show history
              </label>
              
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
                        <span className="param-mode">{param.mode}</span>
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
          
          {/* History section */}
          {showHistory && (
            <div className="history-section">
              <h4>Change History</h4>
              
              {isLoading ? (
                <div className="loading-indicator">Loading history...</div>
              ) : sensitivityHistory.length === 0 ? (
                <div className="empty-state">No historical changes recorded</div>
              ) : (
                <div className="history-list">
                  {sensitivityHistory.map((entry, idx) => (
                    <div key={idx} className="history-item">
                      <div className="history-time">{formatTimestamp(entry.timestamp)}</div>
                      <div className="history-param">{entry.sKey}</div>
                      <div className="history-details">
                        {entry.config.mode && <span className="history-mode">{entry.config.mode}</span>}
                        {entry.config.values?.length > 0 && (
                          <span className="history-values">
                            [{entry.config.values.filter(Boolean).join(', ')}]
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SensitivityMonitor;
