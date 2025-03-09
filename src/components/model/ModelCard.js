import React, { useState, useEffect } from 'react';
import './css/PriceEfficacy.css';
import PriceDisplay from './PriceDisplay';
import EfficacyIndicator from './EfficacyIndicator';
import { loadSensitivityData, calculateEfficacyMetrics } from './utils/dataProcessing';
import './ModelCard.css';

const ModelCard = ({ 
  type, 
  settings, 
  onClick, 
  isActive, 
  onViewImpact, 
  onSensitivityAnalysis, 
  onRiskAssessment, 
  onOptimization, 
  onDecisionSupport,
  baseSettings // Base model settings for comparison
}) => {
  const [efficacyMetrics, setEfficacyMetrics] = useState(null);
  const [sensitivityData, setSensitivityData] = useState(null);
  const [isLoadingEfficacy, setIsLoadingEfficacy] = useState(false);
  // Load sensitivity data and calculate efficacy metrics when model changes
  useEffect(() => {
    const fetchSensitivityAndEfficacy = async () => {
      // Only perform calculation for non-base models with active filters
      if (type === 'base' || getFilterCount() === 0) return;
      
      setIsLoadingEfficacy(true);
      
      try {
        // Load sensitivity data
        const data = await loadSensitivityData(settings);
        setSensitivityData(data);
        
        // We'll add the efficacy calculation in a subsequent effect
      } catch (error) {
        console.error('Error loading sensitivity data:', error);
      } finally {
        setIsLoadingEfficacy(false);
      }
    };
    
    fetchSensitivityAndEfficacy();
  }, [type, settings]);
  
  // Calculate efficacy metrics when price data is available (in PriceDisplay)
  // This is handled via a custom event listener to avoid prop drilling
  useEffect(() => {
    const handlePriceDataLoaded = (event) => {
      const { version, extension, priceData } = event.detail;
      
      // Only process events for this model
      if (version !== settings.version || extension !== settings.extension) return;
      
      if (sensitivityData && priceData) {
        const metrics = calculateEfficacyMetrics(sensitivityData, priceData);
        setEfficacyMetrics(metrics);
      }
    };
    
    // Listen for price data loaded events
    window.addEventListener('priceDataLoaded', handlePriceDataLoaded);
    
    return () => {
      window.removeEventListener('priceDataLoaded', handlePriceDataLoaded);
    };
  }, [sensitivityData, settings]);
  
  const getFilterCount = () => {
    return Object.values(settings.filters).filter(Boolean).length;
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'base':
        return 'Base Model';
      case 'variant1':
        return 'Core Cost';
      case 'variant2':
        return 'Brand Cost';
      default:
        return '';
    }
  };

  const getFilterLabels = () => {
    const labels = {
      cost: 'Cost',
      time: 'Time',
      process: 'Process'
    };
    return Object.entries(settings.filters)
      .filter(([_, isActive]) => isActive)
      .map(([key]) => labels[key]);
  };

  return (
    <div 
      className={`model-card ${type} ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="model-card-header">
        <h3>{getTypeLabel()}</h3>
        <div className="model-card-badges">
          {getFilterCount() > 0 && (
            <span className="filter-badge" title={getFilterLabels().join(', ')}>
              {getFilterCount()} {getFilterCount() === 1 ? 'Filter' : 'Filters'}
            </span>
          )}
          {settings.departure > 0 && (
            <span className="departure-badge">
              {settings.departure}% Departure
            </span>
          )}
        </div>
      </div>

      <div className="model-card-content">
        <div className="filter-indicators">
          {Object.entries(settings.filters).map(([filter, isActive]) => (
            <div 
              key={filter}
              className={`filter-indicator ${isActive ? 'active' : ''}`}
              title={`${filter.charAt(0).toUpperCase() + filter.slice(1)} Filter`}
            >
              <span className="filter-icon">
                {filter === 'cost' && '💰'}
                {filter === 'time' && '⏱️'}
                {filter === 'process' && '⚙️'}
              </span>
            </div>
          ))}
        </div>

        <div className="priority-indicator">
          <span className="priority-label">Priority</span>
          <span className={`priority-value ${settings.priority}`}>
            <span className="priority-icon">
              {settings.priority === 'high' && '⬆️'}
              {settings.priority === 'medium' && '⬅️'}
              {settings.priority === 'low' && '⬇️'}
            </span>
            <span className="priority-text">
              {settings.priority.charAt(0).toUpperCase() + settings.priority.slice(1)}
            </span>
          </span>
        </div>
        
        {/* Price Display Integration */}
        <PriceDisplay 
          version={settings.version}
          extension={settings.extension}
          baseVersion={type !== 'base' && baseSettings ? baseSettings.version : null}
          baseExtension={type !== 'base' && baseSettings ? baseSettings.extension : null}
        />
        
        {/* Efficacy Indicator Integration */}
        {efficacyMetrics && (
          <EfficacyIndicator
            efficacyMetrics={efficacyMetrics}
            showDetails={isActive}
          />
        )}
      </div>

      <div className="model-card-footer">
        <div className="card-actions">
          <div className="primary-actions">
            <button 
              className="configure-button"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              Configure
            </button>
            {type !== 'base' && (
              <>
                <button 
                  className="impact-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewImpact();
                  }}
                >
                  View Impact
                </button>
                <>
                  <button 
                    className="sensitivity-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSensitivityAnalysis();
                    }}
                    title={efficacyMetrics ? `Price Efficacy: ${(efficacyMetrics.score * 100).toFixed(0)}%` : "Run sensitivity analysis"}
                  >
                    Sensitivity
                  </button>
                  <div className="analysis-buttons">
                    <button 
                      className="risk-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRiskAssessment();
                      }}
                    >
                      Risk
                    </button>
                  <div className="advanced-actions">
                    <button 
                      className="optimization-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOptimization();
                      }}
                    >
                      Optimize
                    </button>
                    <button 
                      className="decision-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDecisionSupport();
                      }}
                    >
                      Get Recommendations
                    </button>
                  </div>
                  </div>
                </>
              </>
            )}
          </div>
          <div className="secondary-actions">
            <button 
              className="reset-button"
              onClick={(e) => {
                e.stopPropagation();
                // Reset logic will be implemented later
              }}
            >
              Reset
            </button>
          </div>
        </div>
        {type !== 'base' && settings.departure > 0 && (
          <div className="impact-preview">
            <div className="impact-meter">
              <div 
                className="impact-fill"
                style={{ width: `${settings.departure}%` }}
              />
            </div>
            <span className="impact-label">
              {settings.departure}% Impact
              {efficacyMetrics && ` • ${(efficacyMetrics.score * 100).toFixed(0)}% Efficacy`}
            </span>
          </div>
        )}
      </div>

      {type !== 'base' && settings.departure > 0 && (
        <div className="inheritance-indicator">
          <div className="inheritance-line" />
          <div className="inheritance-value">
            {settings.departure}% from base
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelCard;
