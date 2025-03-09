import React, { useState, useEffect } from 'react';
import PriceDisplay from './PriceDisplay';
import PriceDataPanel from './PriceDataPanel';
import DerivativesPanel from './DerivativesPanel';
import { fetchPriceData } from '../services/priceDataService';
import './ModelCard.css';

/**
 * ModelCard Component
 * Displays model information with integrated price data and sensitivity indicators
 * Provides access to detailed price and derivatives analysis
 * 
 * @param {Object} props - Component props
 * @param {Object} props.model - Model data with version and extension info
 * @param {boolean} props.isSelected - Whether this model is currently selected
 * @param {Function} props.onSelect - Function to call when model is selected
 */
const ModelCard = ({ 
  model, 
  isSelected = false, 
  onSelect 
}) => {
  const [priceData, setPriceData] = useState(null);
  const [showPricePanel, setShowPricePanel] = useState(false);
  const [showDerivativesPanel, setShowDerivativesPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch price data when model changes
  useEffect(() => {
    const loadPriceData = async () => {
      if (!model || !model.version) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchPriceData(model.version, model.extension);
        setPriceData(data);
      } catch (err) {
        console.error('Error loading price data for model card:', err);
        setError('Failed to load price data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPriceData();
  }, [model]);
  
  // Handle model selection
  const handleModelSelect = () => {
    if (onSelect) {
      onSelect(model);
    }
  };
  
  // Open price data panel
  const handleViewPriceDetails = (e) => {
    e.stopPropagation();
    setShowPricePanel(true);
  };
  
  // Open derivatives panel
  const handleViewDerivatives = (e) => {
    e.stopPropagation();
    setShowDerivativesPanel(true);
  };
  
  // Calculate model status indicators
  const getStatusIndicator = () => {
    if (!model) return null;
    
    // Determine status based on model state
    if (model.status === 'calculating') {
      return { icon: '⚙️', label: 'Calculating', className: 'status-calculating' };
    } else if (model.status === 'error') {
      return { icon: '⚠️', label: 'Error', className: 'status-error' };
    } else if (model.isNew) {
      return { icon: '🆕', label: 'New', className: 'status-new' };
    } else if (model.extension) {
      return { icon: '🔄', label: 'Extension', className: 'status-extension' };
    } else {
      return { icon: '✅', label: 'Ready', className: 'status-ready' };
    }
  };
  
  const status = getStatusIndicator();
  
  return (
    <div 
      className={`model-card ${isSelected ? 'selected' : ''}`} 
      onClick={handleModelSelect}
    >
      <div className="card-header">
        <div className="model-title">
          <h3>
            Version {model.version}
            {model.extension && <span className="extension">.{model.extension}</span>}
          </h3>
          {status && (
            <div className={`status-indicator ${status.className}`}>
              <span className="status-icon">{status.icon}</span>
              <span className="status-label">{status.label}</span>
            </div>
          )}
        </div>
        <div className="model-date">
          {model.createdAt && new Date(model.createdAt).toLocaleDateString()}
        </div>
      </div>
      
      <div className="card-content">
        <div className="model-details">
          <div className="detail-item">
            <span className="detail-label">Type:</span>
            <span className="detail-value">{model.type || 'Standard'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Parameters:</span>
            <span className="detail-value">{model.paramCount || '0'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status:</span>
            <span className="detail-value">{model.calculation || 'Complete'}</span>
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>Loading price data...</span>
          </div>
        ) : error ? (
          <div className="price-error">Price data unavailable</div>
        ) : (
          <>
            <PriceDisplay 
              priceData={priceData} 
              onViewDetails={handleViewPriceDetails} 
            />
            
            <div className="card-actions">
              <button 
                className="action-button"
                onClick={handleViewDerivatives}
              >
                View Sensitivity Analysis
              </button>
            </div>
          </>
        )}
      </div>
      
      {showPricePanel && (
        <div className="modal-overlay">
          <PriceDataPanel
            version={model.version}
            extension={model.extension}
            onClose={() => setShowPricePanel(false)}
          />
        </div>
      )}
      
      {showDerivativesPanel && (
        <div className="modal-overlay">
          <DerivativesPanel
            version={model.version}
            extension={model.extension}
            onClose={() => setShowDerivativesPanel(false)}
          />
        </div>
      )}
    </div>
  );
};

export default ModelCard;
