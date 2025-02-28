import React, { useState, useEffect } from 'react';
import './CalculationMonitor.css';

/**
 * CalculationMonitor component
 * Displays real-time information from calculation processes
 * 
 * @param {Object} props
 * @param {Array} props.selectedVersions - Array of selected version numbers
 * @param {Function} props.updatePrice - Function to update price in parent component
 * @param {boolean} props.isActive - Whether monitoring is active
 */
const CalculationMonitor = ({ selectedVersions, updatePrice, isActive }) => {
    const [streamStatus, setStreamStatus] = useState({});
    const [calculationProgress, setCalculationProgress] = useState({});
    const [streamConnections, setStreamConnections] = useState({});
    const [lastUpdated, setLastUpdated] = useState({});

    // Connect to streams when component mounts or selectedVersions change
    useEffect(() => {
        if (!isActive || !selectedVersions || selectedVersions.length === 0) return;
        
        // Setup stream connections for each version
        const connections = {};
        
        selectedVersions.forEach(version => {
            // Create a new EventSource connection
            const eventSource = new EventSource(`http://127.0.0.1:5007/stream_price/${version}`);
            connections[version] = eventSource;
            
            setStreamStatus(prev => ({
                ...prev,
                [version]: 'connected'
            }));
            
            // Handle incoming messages
            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log(`Real-time update for version ${version}:`, data);
                    
                    // Update calculation progress
                    setCalculationProgress(prev => ({
                        ...prev,
                        [version]: data
                    }));
                    
                    // Update last updated timestamp
                    setLastUpdated(prev => ({
                        ...prev,
                        [version]: new Date().toLocaleTimeString()
                    }));
                    
                    // Update price if available
                    if (data.price && updatePrice) {
                        updatePrice(version, data.price);
                    }
                    
                    // Close the stream if the backend signals completion
                    if (data.complete) {
                        console.log(`Completed streaming for version ${version}`);
                        setStreamStatus(prev => ({
                            ...prev,
                            [version]: 'completed'
                        }));
                        eventSource.close();
                    }
                } catch (error) {
                    console.error('Error processing stream data:', error);
                }
            };
            
            // Handle errors
            eventSource.onerror = (error) => {
                console.error(`Error in calculation stream for version ${version}:`, error);
                setStreamStatus(prev => ({
                    ...prev,
                    [version]: 'error'
                }));
                eventSource.close();
            };
        });
        
        setStreamConnections(connections);
        
        // Cleanup function to close all connections when component unmounts
        return () => {
            Object.values(connections).forEach(connection => {
                if (connection) connection.close();
            });
        };
    }, [selectedVersions, isActive, updatePrice]);

    if (!isActive) return null;

    return (
        <div className="calculation-monitor">
            <h3>Real-Time Calculation Monitor</h3>
            
            {selectedVersions.length === 0 ? (
                <p>No versions selected for monitoring</p>
            ) : (
                <div className="monitor-grid">
                    {selectedVersions.map(version => (
                        <div key={version} className={`monitor-card ${streamStatus[version]}`}>
                            <h4>Version {version}</h4>
                            <div className="status-indicator">
                                <span className={`status-dot ${streamStatus[version]}`}></span>
                                <span className="status-text">{streamStatus[version] || 'initializing'}</span>
                            </div>
                            
                            {calculationProgress[version] && (
                                <div className="progress-details">
                                    {calculationProgress[version].price && (
                                        <div className="price-display">
                                            <span>Calculated Price:</span>
                                            <span className="price-value">${calculationProgress[version].price}</span>
                                        </div>
                                    )}
                                    
                                    {calculationProgress[version].step && (
                                        <div className="step-display">
                                            <span>Current Step:</span>
                                            <span>{calculationProgress[version].step}</span>
                                        </div>
                                    )}
                                    
                                    {lastUpdated[version] && (
                                        <div className="timestamp">
                                            Last updated: {lastUpdated[version]}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            
            <div className="monitor-footer">
                <p className="monitor-note">
                    * Real-time monitoring provides live updates during calculation process
                </p>
            </div>
        </div>
    );
};

export default CalculationMonitor;
