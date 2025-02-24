import React, { useState, useCallback } from 'react';
import './FilterPopup.css';

const FILTER_PRESETS = {
  basic: {
    name: 'Basic',
    filters: { cost: true, time: false, process: false },
    description: 'Cost-focused inheritance',
    departure: 20
  },
  standard: {
    name: 'Standard',
    filters: { cost: true, time: true, process: false },
    description: 'Cost and time inheritance',
    departure: 15
  },
  complete: {
    name: 'Complete',
    filters: { cost: true, time: true, process: true },
    description: 'Full model inheritance',
    departure: 10
  }
};

const FilterPopup = ({ modelType, settings, onUpdate, onClose }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [activePreset, setActivePreset] = useState(null);

  const applyPreset = useCallback((presetKey) => {
    const preset = FILTER_PRESETS[presetKey];
    setLocalSettings(prev => ({
      ...prev,
      filters: { ...preset.filters },
      departure: preset.departure
    }));
    setActivePreset(presetKey);
  }, []);

  const handleFilterToggle = (filterType) => {
    setActivePreset(null); // Clear preset when manually toggling filters
    setLocalSettings(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterType]: !prev.filters[filterType]
      }
    }));
  };

  const handleDepartureChange = (e) => {
    setActivePreset(null); // Clear preset when manually changing departure
    const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
    setLocalSettings(prev => ({
      ...prev,
      departure: value
    }));
  };

  const handlePriorityChange = (priority) => {
    setLocalSettings(prev => ({
      ...prev,
      priority
    }));
  };

  const handleSave = () => {
    onUpdate(localSettings);
    onClose();
  };

  const getFilterDescription = (filterType) => {
    switch (filterType) {
      case 'cost':
        return {
          title: 'Cost Filter',
          description: 'Inherit direct and indirect cost values',
          items: [
            'Bare Erected Cost',
            'Operating Costs',
            'Engineering & Construction',
            'Process & Project Contingency'
          ]
        };
      case 'time':
        return {
          title: 'Time Filter',
          description: 'Inherit time-based parameters',
          items: [
            'Plant Lifetime',
            'Construction Years',
            'Efficacy Periods',
            'Temporal Settings'
          ]
        };
      case 'process':
        return {
          title: 'Process Filter',
          description: 'Inherit process-specific values',
          items: [
            'Node Costs',
            'Process Variables',
            'CO₂ and H₂ Parameters',
            'Transport & Storage'
          ]
        };
      default:
        return { title: '', description: '', items: [] };
    }
  };

  return (
    <div className="filter-popup-overlay">
      <div className="filter-popup">
        <div className="filter-popup-header">
          <h2>{modelType === 'base' ? 'Base Model' : `Variant ${modelType.slice(-1)}`} Configuration</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="filter-popup-content">
          {modelType !== 'base' && (
            <section className="presets-section">
              <h3>Quick Presets</h3>
              <div className="preset-buttons">
                {Object.entries(FILTER_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    className={`preset-button ${activePreset === key ? 'active' : ''}`}
                    onClick={() => applyPreset(key)}
                  >
                    <div className="preset-header">
                      <span className="preset-name">{preset.name}</span>
                      <span className="preset-departure">{preset.departure}%</span>
                    </div>
                    <span className="preset-description">{preset.description}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="filter-section">
            <h3>Active Filters</h3>
            <div className="filter-options">
              {Object.keys(settings.filters).map(filterType => {
                const { title, description, items } = getFilterDescription(filterType);
                return (
                  <div key={filterType} className="filter-option-container">
                    <label className="filter-option">
                      <div className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={localSettings.filters[filterType]}
                          onChange={() => handleFilterToggle(filterType)}
                        />
                        <span className="checkbox-custom" />
                      </div>
                      <div className="filter-info">
                        <span className="filter-title">{title}</span>
                        <span className="filter-description">{description}</span>
                      </div>
                    </label>
                    {localSettings.filters[filterType] && (
                      <div className="filter-details">
                        <div className="filter-items">
                          {items.map((item, index) => (
                            <div key={index} className="filter-item">
                              <span className="item-icon">•</span>
                              <span className="item-text">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {modelType !== 'base' && (
            <section className="inheritance-section">
              <h3>Inheritance Settings</h3>
              
              <div className="departure-control">
                <label className="departure-label">
                  Departure from Base
                  <div className="departure-input-group">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={localSettings.departure}
                      onChange={handleDepartureChange}
                    />
                    <span className="departure-unit">%</span>
                  </div>
                </label>
                <div className="departure-slider">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localSettings.departure}
                    onChange={handleDepartureChange}
                  />
                  <div className="departure-markers">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <div className="priority-control">
                <label>Priority Level</label>
                <div className="priority-options">
                  <div className="priority-description">
                    <p>Set the priority level for this model variant. This affects how inheritance conflicts are resolved:</p>
                    <ul>
                      <li><strong>High:</strong> This model's values take precedence</li>
                      <li><strong>Medium:</strong> Values are averaged with base model</li>
                      <li><strong>Low:</strong> Base model values take precedence</li>
                    </ul>
                  </div>
                  <div className="priority-buttons">
                    {['high', 'medium', 'low'].map(priority => (
                      <button
                        key={priority}
                        className={`priority-button ${priority} ${localSettings.priority === priority ? 'active' : ''}`}
                        onClick={() => handlePriorityChange(priority)}
                      >
                        <span className="priority-icon">
                          {priority === 'high' && '⬆️'}
                          {priority === 'medium' && '⬅️'}
                          {priority === 'low' && '⬇️'}
                        </span>
                        <span className="priority-label">
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="filter-popup-footer">
          {activePreset && (
            <div className="preset-indicator">
              Using {FILTER_PRESETS[activePreset].name} preset
            </div>
          )}
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPopup;
