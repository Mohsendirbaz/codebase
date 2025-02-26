import React from 'react';
import './ActionButtons.css';

const ActionButtons = ({
  handleRunPNG,
  handleRunSub,
  selectedProperties,
  remarks,
  customizedFeatures,
  version,
  selectedVersions,
  analyzingRunning,
}) => {
  return (
    <div className="button-row visualization-row">
      <div className="tooltip-container">
        <button
          onClick={() => handleRunPNG({ 
            selectedProperties, 
            remarks, 
            customizedFeatures 
          })}
          disabled={analyzingRunning}
        >
          Generate PNG Plots
        </button>
        <span className="tooltip1">
          Choose the attributes thou wishest to grace the legend, and with a
          click, summon forth the PNG plots.
        </span>
      </div>
      <div className="tooltip-container">
        <button
          type="button"
          onClick={() => handleRunSub({ 
            selectedVersions, 
            selectedProperties, 
            remarks, 
            customizedFeatures 
          })}
          disabled={analyzingRunning}
        >
          Generate Dynamic Plots
        </button>
        <span className="tooltip1">
          Seize the power of efficacy to tailor thy analysis, then click to
          conjure dynamic plots.
        </span>
      </div>
    </div>
  );
};

export default ActionButtons;
