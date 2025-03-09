import React, { useState, useEffect } from 'react';
import { fetchPriceData, calculatePriceDifferentials } from '../services/priceDataService';
import './PriceDataPanel.css';

/**
 * PriceDataPanel Component
 * Displays detailed price information for a specific version and optional comparison
 * 
 * @param {Object} props - Component props
 * @param {string} props.version - The primary version to analyze
 * @param {string} props.extension - Optional extension for version
 * @param {string} props.baseVersion - Optional base version for comparison
 * @param {string} props.baseExtension - Optional extension for base version
 * @param {Function} props.onClose - Function to call when panel is closed
 */
const PriceDataPanel = ({ 
  version, 
  extension, 
  baseVersion,
  baseExtension, 
  onClose 
}) => {
  const [priceData, setPriceData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [differential, setDifferential] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch price data when component mounts or versions change
  useEffect(() => {
    const loadPriceData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch price data for the primary version
        const data = await fetchPriceData(version, extension);
        setPriceData(data);
        
        // If comparing to base, fetch that as well
        if (baseVersion) {
          const baseData = await fetchPriceData(baseVersion, baseExtension);
          setComparisonData(baseData);
          
          // Calculate price differential
          const differentials = calculatePriceDifferentials([baseData, data]);
          if (differentials.length > 0) {
            setDifferential(differentials[0]);
          }
        }
      } catch (err) {
        console.error('Error loading price data:', err);
        setError('Failed to load price data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPriceData();
  }, [version, extension, baseVersion, baseExtension]);
  
  // Format price for display
  const formatPrice = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `$${parseFloat(value).toFixed(2)}`;
  };
  
  // Format percent change for display
  const formatPercentChange = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const numValue = parseFloat(value);
    return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(2)}%`;
  };
  
  // Get CSS class for differential values
  const getDifferentialClass = (value) => {
    if (value === null || value === undefined) return '';
    return parseFloat(value) >= 0 ? 'positive' : 'negative';
  };
  
  return (
    <div className="price-data-panel">
      <div className="panel-header">
        <h2>
          Price Analysis for Version {version}
          {extension && `.${extension}`}
        </h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      {isLoading ? (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Loading price data...</span>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : (
        <div className="price-content">
          <div className="price-metrics">
            <div className="metric-card primary-price">
              <h3>Average Selling Price</h3>
              <div className="price-value main-price">{formatPrice(priceData?.value)}</div>
              <div className="price-source">
                Source: Economic Summary CSV
                <br />
                <span className="timestamp">
                  {priceData?.timestamp && new Date(priceData.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
            
            {comparisonData && (
              <div className="comparison-card">
                <h3>Comparison to Base</h3>
                <div className="comparison-row">
                  <span className="comparison-label">Base (v{baseVersion}{baseExtension && `.${baseExtension}`}):</span>
                  <span className="comparison-value">{formatPrice(comparisonData.value)}</span>
                </div>
                
                {differential && (
                  <>
                    <div className="comparison-row">
                      <span className="comparison-label">Absolute Difference:</span>
                      <span className={`comparison-value ${getDifferentialClass(differential.absoluteChange)}`}>
                        {differential.absoluteChange >= 0 ? '+' : ''}${differential.absoluteChange}
                      </span>
                    </div>
                    <div className="comparison-row">
                      <span className="comparison-label">Percent Change:</span>
                      <span className={`comparison-value ${getDifferentialClass(differential.percentChange)}`}>
                        {formatPercentChange(differential.percentChange)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="price-impact-section">
            <h3>Price Impact Factors</h3>
            <p className="impact-description">
              The following factors have the most significant impact on the Average Selling Price:
            </p>
            
            <div className="impact-factors">
              <div className="impact-factor">
                <div className="factor-header">
                  <span className="factor-name">Cost Structure</span>
                  <span className="factor-impact high">High Impact</span>
                </div>
                <div className="factor-bar-container">
                  <div className="factor-bar" style={{ width: '85%' }}></div>
                </div>
                <p className="factor-description">
                  Direct and indirect costs are primary determinants of the selling price.
                </p>
              </div>
              
              <div className="impact-factor">
                <div className="factor-header">
                  <span className="factor-name">Time Parameters</span>
                  <span className="factor-impact medium">Medium Impact</span>
                </div>
                <div className="factor-bar-container">
                  <div className="factor-bar" style={{ width: '60%' }}></div>
                </div>
                <p className="factor-description">
                  Plant lifetime and construction years influence long-term pricing strategies.
                </p>
              </div>
              
              <div className="impact-factor">
                <div className="factor-header">
                  <span className="factor-name">Process Variables</span>
                  <span className="factor-impact low">Low Impact</span>
                </div>
                <div className="factor-bar-container">
                  <div className="factor-bar" style={{ width: '35%' }}></div>
                </div>
                <p className="factor-description">
                  Process-specific variables have a smaller but still significant impact on pricing.
                </p>
              </div>
            </div>
          </div>
          
          <div className="price-actions">
            <button className="action-button">
              Export Price Analysis
            </button>
            <button className="action-button">
              Run Sensitivity Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceDataPanel;
