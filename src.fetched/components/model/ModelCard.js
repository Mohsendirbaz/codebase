import React from 'react';
import './ModelCard.css';

const ModelCard = ({ type, settings, onClick, isActive }) => {
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
            {settings.priority}
          </span>
        </div>
      </div>

      <div className="model-card-footer">
        <button 
          className="configure-button"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Configure
        </button>
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
