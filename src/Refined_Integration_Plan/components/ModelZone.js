import React, { useState, useEffect } from 'react';
import ModelCard from './ModelCard';
import PriceDataPanel from './PriceDataPanel';
import './ModelZone.css';

/**
 * ModelZone Component
 * Main container for displaying model cards with integrated price and sensitivity data
 * 
 * @param {Object} props - Component props
 * @param {Array} props.models - Array of model objects with version and extension info
 * @param {Function} props.onModelSelect - Function to call when a model is selected
 */
const ModelZone = ({ 
  models = [], 
  onModelSelect 
}) => {
  const [selectedModels, setSelectedModels] = useState([]);
  const [showComparisonPanel, setShowComparisonPanel] = useState(false);
  const [filteredModels, setFilteredModels] = useState([]);
  const [sortOption, setSortOption] = useState('dateDesc');
  const [filterOption, setFilterOption] = useState('all');
  
  // Initialize filtered models when models prop changes
  useEffect(() => {
    if (!models || models.length === 0) return;
    
    applyFiltersAndSort(models, filterOption, sortOption);
  }, [models]);
  
  // Apply filters and sorting to models
  const applyFiltersAndSort = (modelList, filter, sort) => {
    // First apply filters
    let filtered = [...modelList];
    
    if (filter === 'standard') {
      filtered = filtered.filter(model => !model.extension);
    } else if (filter === 'extensions') {
      filtered = filtered.filter(model => model.extension);
    }
    
    // Then apply sorting
    if (sort === 'versionAsc') {
      filtered.sort((a, b) => {
        if (a.version === b.version) {
          // If versions are the same, sort by extension
          if (!a.extension) return -1;
          if (!b.extension) return 1;
          return parseFloat(a.extension) - parseFloat(b.extension);
        }
        return parseFloat(a.version) - parseFloat(b.version);
      });
    } else if (sort === 'versionDesc') {
      filtered.sort((a, b) => {
        if (a.version === b.version) {
          // If versions are the same, sort by extension
          if (!a.extension) return 1;
          if (!b.extension) return -1;
          return parseFloat(b.extension) - parseFloat(a.extension);
        }
        return parseFloat(b.version) - parseFloat(a.version);
      });
    } else if (sort === 'dateAsc') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sort === 'dateDesc') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    setFilteredModels(filtered);
  };
  
  // Handle filter and sort changes
  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setFilterOption(newFilter);
    applyFiltersAndSort(models, newFilter, sortOption);
  };
  
  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortOption(newSort);
    applyFiltersAndSort(models, filterOption, newSort);
  };
  
  // Handle model selection
  const handleModelSelect = (model) => {
    // Check if model is already selected
    const isSelected = selectedModels.some(m => 
      m.version === model.version && m.extension === model.extension
    );
    
    let newSelected;
    
    if (isSelected) {
      // Deselect the model
      newSelected = selectedModels.filter(m => 
        !(m.version === model.version && m.extension === model.extension)
      );
    } else {
      // Add model to selection, up to a maximum of 3
      newSelected = selectedModels.length < 3 
        ? [...selectedModels, model] 
        : [...selectedModels.slice(1), model]; // Remove oldest if at max
    }
    
    setSelectedModels(newSelected);
    
    // Call parent handler if provided
    if (onModelSelect) {
      onModelSelect(newSelected);
    }
  };
  
  // Open comparison panel
  const handleCompare = () => {
    if (selectedModels.length > 0) {
      setShowComparisonPanel(true);
    }
  };
  
  return (
    <div className="model-zone">
      <div className="zone-header">
        <h2>Model Zone</h2>
        <div className="zone-actions">
          <div className="filter-controls">
            <div className="control-group">
              <label htmlFor="filter-select">Filter:</label>
              <select 
                id="filter-select" 
                value={filterOption} 
                onChange={handleFilterChange}
              >
                <option value="all">All Models</option>
                <option value="standard">Standard Versions</option>
                <option value="extensions">Version Extensions</option>
              </select>
            </div>
            
            <div className="control-group">
              <label htmlFor="sort-select">Sort by:</label>
              <select 
                id="sort-select" 
                value={sortOption} 
                onChange={handleSortChange}
              >
                <option value="dateDesc">Newest First</option>
                <option value="dateAsc">Oldest First</option>
                <option value="versionDesc">Version (High to Low)</option>
                <option value="versionAsc">Version (Low to High)</option>
              </select>
            </div>
          </div>
          
          <div className="selection-controls">
            <span className="selection-count">
              {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
            </span>
            <button 
              className="compare-button"
              disabled={selectedModels.length < 1}
              onClick={handleCompare}
            >
              Compare Models
            </button>
          </div>
        </div>
      </div>
      
      {filteredModels.length === 0 ? (
        <div className="no-models-message">
          <p>No models available. Create a model to get started.</p>
        </div>
      ) : (
        <div className="model-grid">
          {filteredModels.map(model => (
            <ModelCard
              key={`${model.version}${model.extension ? '.' + model.extension : ''}`}
              model={model}
              isSelected={selectedModels.some(m => 
                m.version === model.version && m.extension === model.extension
              )}
              onSelect={handleModelSelect}
            />
          ))}
        </div>
      )}
      
      {showComparisonPanel && (
        <div className="modal-overlay">
          <PriceDataPanel
            version={selectedModels[0].version}
            extension={selectedModels[0].extension}
            baseVersion={selectedModels.length > 1 ? selectedModels[1].version : null}
            baseExtension={selectedModels.length > 1 ? selectedModels[1].extension : null}
            onClose={() => setShowComparisonPanel(false)}
          />
        </div>
      )}
    </div>
  );
};

export default ModelZone;
