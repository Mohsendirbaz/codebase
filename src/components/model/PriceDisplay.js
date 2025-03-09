import React, { useState, useEffect } from 'react';
import './neumorphic-efficacy.css';
import { fetchCombinedPriceData, formatPrice, calculatePriceChange } from './services/integrationService';

/**
 * PriceDisplay Component
 * Displays price information for a model and compares with base model if applicable
 * 
 * @param {Object} props - Component props
 * @param {string} props.version - Model version
 * @param {string|null} props.extension - Model extension (if applicable)
 * @param {string|null} props.baseVersion - Base model version for comparison (if applicable)
 * @param {string|null} props.baseExtension - Base model extension for comparison (if applicable)
 */
const PriceDisplay = ({ 
  version, 
  extension, 
  baseVersion, 
  baseExtension 
}) => {
  const [priceData, setPriceData] = useState(null);
  const [basePriceData, setBasePriceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch price data for the current model
  useEffect(() => {
    const loadPriceData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch combined price data for the current model
        const data = await fetchCombinedPriceData({
          version, 
          extension
        });
        setPriceData(data);
        
        // Dispatch custom event with price data for efficacy calculation
        if (data) {
          const event = new CustomEvent('priceDataLoaded', {
            detail: {
              version,
              extension,
              priceData: data
            }
          });
          window.dispatchEvent(event);
        }
        
        // If base version is provided, fetch combined price data for comparison
        if (baseVersion) {
          const baseData = await fetchCombinedPriceData({
            version: baseVersion, 
            extension: baseExtension
          });
          setBasePriceData(baseData);
        }
      } catch (err) {
        console.error('Error loading price data:', err);
        setError(err.message || 'Failed to load price data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPriceData();
  }, [version, extension, baseVersion, baseExtension]);

  // Get the CSS class based on price change
  const getPriceChangeClass = () => {
    if (!priceData || !basePriceData || !basePriceData.averageSellingPrice) {
      return 'price-neutral';
    }
    
    const change = priceData.averageSellingPrice - basePriceData.averageSellingPrice;
    
    if (Math.abs(change) < 0.01) return 'price-neutral';
    return change > 0 ? 'price-increase' : 'price-decrease';
  };
  
  // Get price change icon
  const getPriceChangeIcon = () => {
    if (!priceData || !basePriceData || !basePriceData.averageSellingPrice) {
      return '→';
    }
    
    const change = priceData.averageSellingPrice - basePriceData.averageSellingPrice;
    
    if (Math.abs(change) < 0.01) return '→';
    return change > 0 ? '↑' : '↓';
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="price-display">
        <div className="price-header">Price Data</div>
        <div className="price-value">Loading...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="price-display">
        <div className="price-header">Price Data</div>
        <div className="price-value price-error">Error loading data</div>
      </div>
    );
  }

  // Render no data state
  if (!priceData || priceData.averageSellingPrice === 0) {
    return (
      <div className="price-display">
        <div className="price-header">Price Data</div>
        <div className="price-value">No price data available</div>
      </div>
    );
  }

  return (
    <div className="price-display">
      <div className="price-header">
        Average Selling Price
        {priceData.isEstimate && (
          <span className="price-estimate-tag">Estimate</span>
        )}
        {priceData.hasEnrichedData && (
          <span className="price-enriched-tag">Enhanced</span>
        )}
      </div>
      <div className="price-value">
        {formatPrice(priceData.averageSellingPrice)}
      </div>
      
      {basePriceData && basePriceData.averageSellingPrice > 0 && (
        <div className={`price-comparison ${getPriceChangeClass()}`}>
          <span className="price-change-icon">{getPriceChangeIcon()}</span>
          <span>
            {calculatePriceChange(
              priceData.averageSellingPrice, 
              basePriceData.averageSellingPrice
            )}% vs. Base
          </span>
        </div>
      )}
      
      {/* Show min/max price if available from enhanced data */}
      {priceData.minimumPrice > 0 && priceData.maximumPrice > 0 && (
        <div className="price-range">
          <span className="range-label">Price Range:</span>
          <span className="range-values">
            {formatPrice(priceData.minimumPrice)} - {formatPrice(priceData.maximumPrice)}
          </span>
        </div>
      )}
    </div>
  );
};

export default PriceDisplay;
