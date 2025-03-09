import React, { useState, useEffect } from 'react';
import { fetchParameterDerivatives, calculatePriceImpact } from '../services/derivativesService';
import './DerivativesPanel.css';

/**
 * DerivativesPanel Component
 * Displays sensitivity derivatives data for parameters and their impact on price
 * 
 * @param {Object} props - Component props
 * @param {string} props.version - The version number
 * @param {string} props.extension - Optional extension for version
 * @param {Array<string>} props.paramIds - Array of parameter IDs to analyze
 * @param {Function} props.onClose - Function to call when panel is closed
 */
const DerivativesPanel = ({ 
  version, 
  extension, 
  paramIds = ['S34', 'S35', 'S36', 'S37', 'S38'], 
  onClose 
}) => {
  const [derivatives, setDerivatives] = useState([]);
  const [activeParamId, setActiveParamId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch derivatives data when component mounts or parameters change
  useEffect(() => {
    const loadDerivatives = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch derivatives data for each parameter
        const derivativesPromises = paramIds.map(paramId => 
          fetchParameterDerivatives(version, extension, paramId)
            .then(data => calculatePriceImpact(data))
            .catch(err => {
              console.warn(`Error fetching derivatives for ${paramId}:`, err);
              return null;
            })
        );
        
        const results = await Promise.all(derivativesPromises);
        const validResults = results.filter(Boolean);
        
        setDerivatives(validResults);
        
        // Set the first parameter as active by default
        if (validResults.length > 0 && !activeParamId) {
          setActiveParamId(validResults[0].paramId);
        }
      } catch (err) {
        console.error('Error loading derivatives data:', err);
        setError('Failed to load derivatives data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (version && paramIds.length > 0) {
      loadDerivatives();
    }
  }, [version, extension, paramIds, activeParamId]);
  
  // Get the currently active derivatives data
  const getActiveDerivatives = () => {
    if (!activeParamId) return null;
    return derivatives.find(d => d.paramId === activeParamId) || null;
  };
  
  // Format percentage for display
  const formatPercent = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
  };
  
  // Render points for the active parameter
  const renderDerivativePoints = () => {
    const activeData = getActiveDerivatives();
    if (!activeData || !activeData.points || activeData.points.length === 0) {
      return (
        <div className="no-points-message">
          No derivatives data available for this parameter.
        </div>
      );
    }
    
    return (
      <div className="derivative-points">
        <h3>Price Impact Points</h3>
        <div className="points-table">
          <div className="table-header">
            <div className="point-value-header">Parameter Value</div>
            <div className="point-impact-header">Price Impact</div>
          </div>
          {activeData.points.map((point, index) => (
            <div 
              key={index} 
              className={`point-row ${point.priceImpact > 0 ? 'positive' : point.priceImpact < 0 ? 'negative' : 'neutral'}`}
            >
              <div className="point-value">{point.value}</div>
              <div className="point-impact">
                {formatPercent(point.priceImpact)}
              </div>
            </div>
          ))}
        </div>
        
        <div className="impact-summary">
          <div className="impact-metric">
            <span className="metric-label">Max Impact:</span>
            <span className="metric-value">{formatPercent(activeData.maxImpact)}</span>
          </div>
          <div className="impact-metric">
            <span className="metric-label">Average Impact:</span>
            <span className="metric-value">{formatPercent(activeData.averageImpact)}</span>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the impact visualization
  const renderImpactVisualization = () => {
    const activeData = getActiveDerivatives();
    if (!activeData || !activeData.points || activeData.points.length === 0) {
      return null;
    }
    
    // Sort points by value for visualization
    const sortedPoints = [...activeData.points].sort((a, b) => a.value - b.value);
    
    return (
      <div className="impact-visualization">
        <h3>Impact Visualization</h3>
        <div className="visualization-container">
          <div className="baseline"></div>
          {sortedPoints.map((point, index) => {
            // Calculate position and height based on impact
            const impact = point.priceImpact || 0;
            const height = Math.min(Math.abs(impact) * 100, 100) + '%';
            const direction = impact >= 0 ? 'positive' : 'negative';
            
            return (
              <div 
                key={index} 
                className={`impact-bar ${direction}`}
                style={{ 
                  height, 
                  left: `${(index / (sortedPoints.length - 1)) * 100}%` 
                }}
              >
                <div className="impact-tooltip">
                  <div>Value: {point.value}</div>
                  <div>Impact: {formatPercent(impact)}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="visualization-labels">
          {sortedPoints.map((point, index) => (
            <div 
              key={index}
              className="point-label"
              style={{ left: `${(index / (sortedPoints.length - 1)) * 100}%` }}
            >
              {point.value}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="derivatives-panel">
      <div className="panel-header">
        <h2>
          Sensitivity Derivatives for Version {version}
          {extension && `.${extension}`}
        </h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      {isLoading ? (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Loading derivatives data...</span>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : derivatives.length === 0 ? (
        <div className="no-derivatives-message">
          No derivatives data available for the selected parameters.
        </div>
      ) : (
        <div className="derivatives-content">
          <div className="parameters-nav">
            {derivatives.map(param => (
              <button
                key={param.paramId}
                className={`param-tab ${param.paramId === activeParamId ? 'active' : ''}`}
                onClick={() => setActiveParamId(param.paramId)}
              >
                {param.paramId}
              </button>
            ))}
          </div>
          
          <div className="derivatives-data">
            {renderDerivativePoints()}
            {renderImpactVisualization()}
          </div>
          
          <div className="derivatives-actions">
            <button 
              className="action-button"
              onClick={() => {
                // This would be implemented to run a new sensitivity analysis
                console.log('Run new sensitivity analysis');
              }}
            >
              Run New Analysis
            </button>
            <button 
              className="action-button secondary"
              onClick={() => {
                // This would be implemented to export the derivatives data
                console.log('Export derivatives data');
              }}
            >
              Export Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DerivativesPanel;
