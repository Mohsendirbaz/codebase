/**
 * DecarbonizationPathwayCard.js
 *
 * Card component for displaying information about a single decarbonization pathway.
 * Used in both the list view and the comparison view.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLeaf, faIndustry, faWater, faDollarSign, 
  faClock, faPlus, faMinus, faCircleInfo
} from '@fortawesome/free-solid-svg-icons';
import './styles/DecarbonizationPathwayCard.css';

/**
 * DecarbonizationPathwayCard - Card component for displaying pathway details
 * 
 * @param {Object} props - Component props
 * @param {Object} props.pathway - Pathway data object
 * @param {Object} props.metrics - Metrics data for the pathway
 * @param {Boolean} props.isComparison - Whether card is being used in comparison view
 * @param {Boolean} props.isInComparison - Whether pathway is in comparison selection
 * @param {Function} props.onAddToComparison - Callback when pathway is added to comparison
 * @param {Function} props.onRemoveFromComparison - Callback when pathway is removed from comparison
 */
export const DecarbonizationPathwayCard = ({
  pathway,
  metrics = {},
  isComparison = false,
  isInComparison = false,
  onAddToComparison,
  onRemoveFromComparison
}) => {
  if (!pathway) return null;
  
  // Format the score (0-100 scale)
  const formatScore = (score) => {
    return Math.round(score || 0);
  };
  
  return (
    <div className={`decarbonization-pathway-card ${isComparison ? 'comparison-card' : ''}`}>
      <div className="pathway-card-header">
        <div className="pathway-card-title">
          <h3>{pathway.name}</h3>
          {pathway.isHardToDecarbonize && (
            <span className="hard-to-decarbonize-badge">
              <FontAwesomeIcon icon={faIndustry} /> Hard to Decarbonize
            </span>
          )}
          <span className={`pathway-category-badge ${pathway.category}`}>
            {pathway.category}
          </span>
        </div>
        
        {!isComparison && (
          <div className="pathway-card-actions">
            {isInComparison ? (
              <button 
                className="remove-from-comparison-button"
                onClick={onRemoveFromComparison}
              >
                <FontAwesomeIcon icon={faMinus} /> Remove from Comparison
              </button>
            ) : (
              <button 
                className="add-to-comparison-button"
                onClick={onAddToComparison}
              >
                <FontAwesomeIcon icon={faPlus} /> Add to Comparison
              </button>
            )}
          </div>
        )}
        
        {isComparison && (
          <button 
            className="remove-button"
            onClick={onRemoveFromComparison}
          >
            <FontAwesomeIcon icon={faMinus} />
          </button>
        )}
      </div>
      
      {pathway.description && (
        <div className="pathway-card-description">
          {pathway.description}
        </div>
      )}
      
      <div className="pathway-metrics">
        <div className="metric-card cost-metric">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faDollarSign} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Cost</div>
            <div className="metric-value">
              ${pathway.economics?.["Real Levelized Cost ($/kg H₂)"]?.toFixed(2) || 'N/A'}
            </div>
            <div className="metric-subtitle">$/kg H₂</div>
            {metrics.costEffectiveness && (
              <div className="metric-score-bar">
                <div 
                  className="metric-score-fill" 
                  style={{ width: `${formatScore(metrics.costEffectiveness)}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
        
        <div className="metric-card emissions-metric">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faLeaf} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Emissions</div>
            <div className="metric-value">
              {pathway.carbonIntensity?.toFixed(1) || 'N/A'}
            </div>
            <div className="metric-subtitle">kg CO₂e/kg H₂</div>
            {metrics.emissionReduction && (
              <div className="metric-score-bar">
                <div 
                  className="metric-score-fill" 
                  style={{ width: `${formatScore(metrics.emissionReduction)}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
        
        <div className="metric-card water-metric">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faWater} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Water Usage</div>
            <div className="metric-value">
              {pathway.inputs?.["Water Total (gal)"]?.toFixed(2) || 'N/A'}
            </div>
            <div className="metric-subtitle">gal/kg H₂</div>
            {metrics.waterEfficiency && (
              <div className="metric-score-bar">
                <div 
                  className="metric-score-fill" 
                  style={{ width: `${formatScore(metrics.waterEfficiency)}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
        
        <div className="metric-card readiness-metric">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Readiness</div>
            <div className="metric-value">
              {pathway.readinessYear || 'N/A'}
            </div>
            <div className="metric-subtitle">
              {pathway.maturityLevel && (
                <span className={`readiness-badge ${pathway.maturityLevel}`}>
                  {pathway.maturityLevel}
                </span>
              )}
            </div>
            {metrics.implementationTimeframe && (
              <div className="metric-score-bar">
                <div 
                  className="metric-score-fill" 
                  style={{ width: `${formatScore(metrics.implementationTimeframe)}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {!isComparison && metrics.overallScore && (
        <div className="overall-score">
          <div className="score-label">
            <FontAwesomeIcon icon={faCircleInfo} /> Overall Score
          </div>
          <div className="score-gauge">
            <svg viewBox="0 0 100 50" className="gauge">
              <path 
                d="M10,50 A40,40 0 1,1 90,50" 
                className="gauge-background"
              />
              <path 
                d="M10,50 A40,40 0 1,1 90,50" 
                className="gauge-fill"
                strokeDasharray={`${0.8 * metrics.overallScore}, 100`}
              />
              <text x="50" y="30" className="gauge-text">
                {Math.round(metrics.overallScore)}
              </text>
              <text x="50" y="45" className="gauge-subtext">
                / 100
              </text>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

DecarbonizationPathwayCard.propTypes = {
  pathway: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string,
    isHardToDecarbonize: PropTypes.bool,
    inputs: PropTypes.object,
    economics: PropTypes.object,
    carbonIntensity: PropTypes.number,
    maturityLevel: PropTypes.string,
    readinessYear: PropTypes.number
  }),
  metrics: PropTypes.shape({
    costEffectiveness: PropTypes.number,
    emissionReduction: PropTypes.number,
    implementationTimeframe: PropTypes.number,
    waterEfficiency: PropTypes.number,
    overallScore: PropTypes.number
  }),
  isComparison: PropTypes.bool,
  isInComparison: PropTypes.bool,
  onAddToComparison: PropTypes.func,
  onRemoveFromComparison: PropTypes.func
};

export default DecarbonizationPathwayCard;