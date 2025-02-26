import React, { useState } from 'react';
import './ModelZone.css';
import ModelCard from './ModelCard';
import FilterPopup from './FilterPopup';
import InheritanceControl from './InheritanceControl';
import { useVersionState } from '../../contexts/VersionStateContext';

const ModelZone = () => {
  const { version, selectedVersions, updateVersion } = useVersionState();
  const [activeModel, setActiveModel] = useState(null);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  
  const [modelSettings, setModelSettings] = useState({
    base: {
      type: 'base',
      filters: {
        cost: false,
        time: false,
        process: false
      },
      departure: 0,
      priority: 'high'
    },
    variant1: {
      type: 'variant1',
      filters: {
        cost: false,
        time: false,
        process: false
      },
      departure: 0,
      priority: 'medium'
    },
    variant2: {
      type: 'variant2',
      filters: {
        cost: false,
        time: false,
        process: false
      },
      departure: 0,
      priority: 'low'
    }
  });

  const handleModelClick = (modelType) => {
    setActiveModel(modelType);
    setShowFilterPopup(true);
    // Update version state when model is clicked
    if (modelType === 'base') {
      updateVersion(version);
    } else if (modelType === 'variant1' || modelType === 'variant2') {
      const newVersion = String(Number(version) + 1);
      updateVersion(newVersion);
    }
  };

  const handleFilterUpdate = (modelType, updates) => {
    setModelSettings(prev => ({
      ...prev,
      [modelType]: {
        ...prev[modelType],
        ...updates
      }
    }));
  };

  const handlePopupClose = () => {
    setShowFilterPopup(false);
    setActiveModel(null);
  };

  return (
    <div className="model-zone">
      <div className="model-cards">
        <ModelCard
          type="base"
          settings={modelSettings.base}
          onClick={() => handleModelClick('base')}
          isActive={activeModel === 'base'}
        />
        <ModelCard
          type="variant1"
          settings={modelSettings.variant1}
          onClick={() => handleModelClick('variant1')}
          isActive={activeModel === 'variant1'}
        />
        <ModelCard
          type="variant2"
          settings={modelSettings.variant2}
          onClick={() => handleModelClick('variant2')}
          isActive={activeModel === 'variant2'}
        />
      </div>

      <div className="inheritance-visualization">
        <InheritanceControl
          models={modelSettings}
          onUpdate={handleFilterUpdate}
        />
      </div>

      {showFilterPopup && activeModel && (
        <FilterPopup
          modelType={activeModel}
          settings={modelSettings[activeModel]}
          onUpdate={(updates) => handleFilterUpdate(activeModel, updates)}
          onClose={handlePopupClose}
        />
      )}
    </div>
  );
};

export default ModelZone;
