import React from 'react';

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
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            fontWeight: 'bold',
            padding: '10px',
            border: 'none',
            cursor: 'pointer',
            opacity: analyzingRunning ? 0.7 : 1,
          }}
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
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            fontWeight: 'bold',
            padding: '10px',
            border: 'none',
            cursor: 'pointer',
            opacity: analyzingRunning ? 0.7 : 1,
          }}
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
