import React, { useState, useEffect, useRef } from 'react';
import './CalculationMonitor.css';

/**
 * CalculationMonitor component that displays real-time updates during price optimization
 * 
 * @param {Object} props
 * @param {Array} props.selectedVersions - Array of versions being processed
 * @param {Function} props.updatePrice - Function to update price in parent component
 * @param {Boolean} props.isActive - Whether the monitor is active/visible
 * @param {String} props.currentVersion - Current version number
 */
const CalculationMonitor = ({ selectedVersions, updatePrice, isActive, currentVersion }) => {
  // State for storing monitoring data for each version
  const [monitorData, setMonitorData] = useState({});
  
  // Refs to store EventSource connections
  const eventSourcesRef = useRef({});

  useEffect(() => {
    // Only set up monitoring if component is active
    if (!isActive) return;
    
    // Define versions to monitor
    const versionsToMonitor = selectedVersions.length > 0 
      ? selectedVersions 
      : [parseInt(currentVersion, 10)];
    
    console.log('Setting up monitoring for versions:', versionsToMonitor);
    
    // Set up event sources for each version
    versionsToMonitor.forEach(version => {
      // Close existing connection if any
      if (eventSourcesRef.current[version]) {
        eventSourcesRef.current[version].close();
      }
      
      // Create new EventSource connection with debugging
      console.log(`Creating EventSource connection to http://127.0.0.1:5007/stream_price/${version}`);
      const eventSource = new EventSource(`http://127.0.0.1:5007/stream_price/${version}`);
      eventSourcesRef.current[version] = eventSource;
      
      // Initialize monitoring data for this version
      setMonitorData(prev => ({
        ...prev,
        [version]: {
          status: 'connecting',
          currentPrice: null,
          iterations: 0,
          npv: null,
          complete: false,
          error: null,
          lastUpdated: new Date().toISOString()
        }
      }));
      
      console.log(`Initialized monitoring data for version ${version}`);
      
      // Handle incoming messages
      eventSource.onmessage = (event) => {
        try {
          console.log(`[Version ${version}] Raw event data:`, event.data);
          const data = JSON.parse(event.data);
          console.log(`[Version ${version}] Parsed update:`, data);
          
          // Check for heartbeat
          if (data.heartbeat) {
            console.log(`[Version ${version}] Received heartbeat at ${data.timestamp}`);
            return; // Skip further processing for heartbeats
          }
          
          // Update monitoring data
          setMonitorData(prev => {
            const updatedData = {
              ...prev,
              [version]: {
                status: 'active',
                currentPrice: data.price || prev[version]?.currentPrice,
                iterations: data.iteration || prev[version]?.iterations,
                npv: data.npv !== undefined ? data.npv : prev[version]?.npv,
                complete: data.complete || prev[version]?.complete,
                error: data.error || prev[version]?.error,
                lastUpdated: new Date().toISOString()
              }
            };
            console.log(`[Version ${version}] Updated monitor data:`, updatedData[version]);
            return updatedData;
          });
          
          // Update price in parent component
          if (data.price) {
            updatePrice(version, data.price);
          }
          
          // Close the connection if complete
          if (data.complete) {
            console.log(`[Version ${version}] Calculation complete, closing connection`);
            eventSource.close();
          }
        } catch (error) {
          console.error(`[Version ${version}] Error processing stream data:`, error);
          
          // Update with error state
          setMonitorData(prev => ({
            ...prev,
            [version]: {
              ...prev[version],
              status: 'error',
              error: error.message,
              lastUpdated: new Date().toISOString()
            }
          }));
        }
      };
      
      // Handle connection open
      eventSource.onopen = () => {
        console.log(`[Version ${version}] Stream connection opened`);
        setMonitorData(prev => ({
          ...prev,
          [version]: {
            ...prev[version],
            status: 'connected',
            lastUpdated: new Date().toISOString()
          }
        }));
      };
      
      // Handle errors
      eventSource.onerror = (error) => {
        console.error(`[Version ${version}] Stream error:`, error);
        setMonitorData(prev => ({
          ...prev,
          [version]: {
            ...prev[version],
            status: 'error',
            error: 'Connection error',
            lastUpdated: new Date().toISOString()
          }
        }));
        
        // Close the connection on error
        eventSource.close();
      };
    });
    
    // Cleanup function to close all connections when component unmounts
    return () => {
      console.log('Cleaning up event sources');
      Object.values(eventSourcesRef.current).forEach(es => {
        if (es && es.readyState !== 2) { // 2 = CLOSED
          es.close();
        }
      });
    };
  }, [isActive, selectedVersions, currentVersion, updatePrice]);
  
  // Helper to format status
  const getStatusDisplay = (statusData) => {
    if (!statusData) return 'Unknown';
    
    switch (statusData.status) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Connected, waiting for data...';
      case 'active':
        return statusData.complete 
          ? 'Calculation complete' 
          : `Processing (Iteration ${statusData.iterations})`;
      case 'error':
        return `Error: ${statusData.error}`;
      default:
        return statusData.status || 'Unknown';
    }
  };
  
  // If component is not active, don't render anything
  if (!isActive) return null;
  
  // Get versions to display
  const versionsToDisplay = Object.keys(monitorData).map(Number);
  
  return (
    <div className="calculation-monitor">
      <h3>Real-time Calculation Monitor</h3>
      
      {versionsToDisplay.length === 0 ? (
        <p className="no-data">No active calculations</p>
      ) : (
        <div className="monitor-data">
          {versionsToDisplay.map(version => {
            const data = monitorData[version];
            if (!data) return null;
            
            return (
              <div 
                key={version} 
                className={`version-monitor ${data.status} ${data.complete ? 'complete' : ''}`}
              >
                <h4>Version {version}</h4>
                <div className="monitor-status">
                  <span className="status-indicator"></span>
                  <span className="status-text">{getStatusDisplay(data)}</span>
                </div>
                <div className="monitor-details">
                  {data.currentPrice !== null && (
                    <div className="detail-row">
                      <strong>Current Price:</strong> ${data.currentPrice?.toFixed(2)}
                    </div>
                  )}
                  {data.npv !== null && (
                    <div className="detail-row">
                      <strong>Current NPV:</strong> ${data.npv?.toFixed(2)}
                    </div>
                  )}
                  {data.complete && (
                    <div className="success-message">
                      ✓ Price optimization successful
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CalculationMonitor;
