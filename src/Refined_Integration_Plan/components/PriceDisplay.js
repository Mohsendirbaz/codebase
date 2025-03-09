import React from 'react';
import './PriceDisplay.css';

/**
 * PriceDisplay Component
 * Displays price information in a compact format for use within ModelCard
 * 
 * @param {Object} props - Component props
 * @param {Object} props.priceData - Price data object with version and value
 * @param {Function} props.onViewDetails - Function to call when details button is clicked
 */
const PriceDisplay = ({ priceData, onViewDetails }) => {
  if (!priceData) return null;
  
  // Format price for display
  const formatPrice = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `$${parseFloat(value).toFixed(2)}`;
  };
  
  return (
    <div className="price-display">
      <div className="price-header">
        <h4>Average Selling Price</h4>
        <div className="price-badge">From Economic Summary</div>
      </div>
      
      <div className="price-value">{formatPrice(priceData.value)}</div>
      
      <div className="price-actions">
        <button 
          className="details-button"
          onClick={(e) => {
            e.stopPropagation();
            if (onViewDetails) onViewDetails();
          }}
        >
          View Price Details
        </button>
      </div>
    </div>
  );
};

export default PriceDisplay;
