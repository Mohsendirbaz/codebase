import React from 'react';
import '../css/PriceEfficacy.css';

/**
 * EfficacyIndicator Component
 * Displays efficacy metrics calculated from sensitivity analysis and price data
 * 
 * @param {Object} props - Component props
 * @param {Object} props.efficacyMetrics - Efficacy metrics data
 * @param {boolean} props.showDetails - Whether to show detailed metrics
 * @param {number} props.maxImpacts - Maximum number of parameter impacts to show
 */
const EfficacyIndicator = ({ 
  efficacyMetrics, 
  showDetails = false,
  maxImpacts = 3
}) => {
  // Return null if no efficacy metrics are available
  if (!efficacyMetrics || efficacyMetrics.score === undefined) {
    return null;
  }
  
  // Get efficacy level based on score
  const getEfficacyLevel = (score) => {
    if (score > 0.5) return 'high';
    if (score > 0.2) return 'medium';
    return 'low';
  };
  
  // Get icon based on efficacy level
  const getEfficacyIcon = (level) => {
    switch (level) {
      case 'high': return '⚡'; // High efficacy
      case 'medium': return '✓'; // Medium efficacy
      case 'low': return '↓'; // Low efficacy
      default: return '•'; // Default icon
    }
  };
  
  // Format efficacy score as percentage
  const formatEfficacyScore = (score) => {
    return `${(score * 100).toFixed(0)}%`;
  };
  
  // Format price impact value
  const formatPriceImpact = (impact) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(impact);
  };
  
  const efficacyLevel = getEfficacyLevel(efficacyMetrics.score);
  const parameterImpacts = efficacyMetrics.parameterImpacts || [];
  
  return (
    <div className={`efficacy-indicator efficacy-${efficacyLevel}`}>
      <div className="efficacy-label">
        <span className="efficacy-icon">{getEfficacyIcon(efficacyLevel)}</span>
        <span>Price Efficacy</span>
      </div>
      
      <div className="efficacy-value">
        <span className="efficacy-score">{formatEfficacyScore(efficacyMetrics.score)}</span>
        {showDetails && (
          <span className="efficacy-details">
            Sensitivity: {formatEfficacyScore(efficacyMetrics.sensitivity)}
          </span>
        )}
      </div>
      
      {showDetails && parameterImpacts.length > 0 && (
        <div className="parameter-impacts">
          <div className="impact-header">Top Parameter Impacts</div>
          <div className="impact-list">
            {parameterImpacts
              .slice(0, maxImpacts)
              .map((impact, index) => (
                <div key={index} className="impact-item">
                  <span className="impact-parameter">
                    {impact.parameter.charAt(0).toUpperCase() + impact.parameter.slice(1)}
                  </span>
                  <span className="impact-value">
                    {formatPriceImpact(impact.priceImpact)}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default EfficacyIndicator;
