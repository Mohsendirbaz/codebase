import React, { useState, useEffect } from 'react';
import SensitivityVisualization from '../SensitivityVisualization';
import { useVersionState } from '../contexts/VersionStateContext';
import './SensitivityAnalysis.css';

const SensitivityAnalysis = () => {
  const { version } = useVersionState();
  const [visualizationData, setVisualizationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch visualization data when sensitivity analysis is triggered
  const fetchVisualizationData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:5007/sensitivity/visualization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedVersions: [version],
          senParameters: {
            // Configure S34-S38 against S13
            ...Array.from({ length: 5 }, (_, i) => ({
              [`S${34 + i}`]: {
                mode: 'symmetrical',
                enabled: true,
                compareToKey: 'S13',
                comparisonType: 'primary',
                waterfall: true,
                bar: true,
                point: true,
              }
            })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setVisualizationData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching visualization data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch visualization data when version changes
  useEffect(() => {
    if (version) {
      fetchVisualizationData();
    }
  }, [version]);

  return (
    <div className="sensitivity-analysis">
      <div className="sensitivity-header">
        <h2>Sensitivity Analysis</h2>
        <button 
          onClick={fetchVisualizationData}
          className="refresh-button"
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Analysis'}
        </button>
      </div>

      <div className="sensitivity-content">
        {isLoading ? (
          <div className="loading-indicator">Loading sensitivity analysis...</div>
        ) : error ? (
          <div className="error-message">Error: {error}</div>
        ) : visualizationData ? (
          <SensitivityVisualization visualizationData={visualizationData} />
        ) : (
          <div className="no-data-message">
            No sensitivity analysis data available. Click Refresh Analysis to fetch data.
          </div>
        )}
      </div>
    </div>
  );
};

export default SensitivityAnalysis;
