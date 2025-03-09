import React, { useState, useEffect } from 'react';
import './neumorphic-derivatives.css';
import { loadDerivativesData } from '../services/derivativesService';
import AnalysisChart from './AnalysisChart';

const DerivativesPanel = ({
  version,
  extension,
  parameters,
  onDataLoaded
}) => {
  const [derivativesData, setDerivativesData] = useState(null);
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await loadDerivativesData(version, extension, parameters);
        setDerivativesData(data);
        
        if (data.parameters.length > 0) {
          setSelectedParameter(data.parameters[0].id);
        }

        // Notify parent component
        if (onDataLoaded) {
          onDataLoaded({
            version,
            extension,
            derivatives: data
          });
        }
      } catch (error) {
        console.error('Error loading derivatives data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [version, extension, parameters, onDataLoaded]);

  const getParameterData = (parameterId) => {
    if (!derivativesData) return null;
    return derivativesData.parameters.find(p => p.id === parameterId);
  };

  const renderDerivativesAnalysis = () => {
    if (!derivativesData || !selectedParameter) return null;

    const parameterData = getParameterData(selectedParameter);
    if (!parameterData) return null;

    return (
      <div className="derivatives-analysis">
        <div className="parameter-selector">
          <h4>Parameter Selection</h4>
          <div className="parameter-buttons">
            {derivativesData.parameters.map(param => (
              <button
                key={param.id}
                className={`parameter-button ${selectedParameter === param.id ? 'active' : ''}`}
                onClick={() => setSelectedParameter(param.id)}
              >
                <span className="parameter-name">{param.name}</span>
                <span className="impact-value" style={{
                  color: param.impact >= 0 ? 'var(--model-color-success)' : 'var(--model-color-danger)'
                }}>
                  {(param.impact * 100).toFixed(1)}%
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="derivatives-visualization">
          <div className="visualization-header">
            <h4>{parameterData.name} Impact Analysis</h4>
            <div className="impact-metrics">
              <div className="metric">
                <span className="metric-label">Overall Impact</span>
                <span className="metric-value" style={{
                  color: parameterData.impact >= 0 ? 'var(--model-color-success)' : 'var(--model-color-danger)'
                }}>
                  {(parameterData.impact * 100).toFixed(1)}%
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Confidence</span>
                <span className="metric-value">
                  {(parameterData.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          <div className="visualization-content">
            <AnalysisChart
              type="derivatives"
              data={{
                points: parameterData.derivatives,
                baseline: parameterData.baseline
              }}
              options={{
                height: 300,
                lineColor: 'var(--model-color-primary)',
                pointColor: 'var(--model-color-primary-light)',
                baselineColor: 'var(--model-color-text-light)'
              }}
            />
          </div>
        </div>

        <div className="impact-distribution">
          <h4>Impact Distribution</h4>
          <AnalysisChart
            type="distribution"
            data={{
              values: parameterData.distribution,
              baseline: parameterData.baseline
            }}
            options={{
              height: 200,
              barColor: 'var(--model-color-primary-light)',
              barBorder: 'var(--model-color-primary)',
              baselineColor: 'var(--model-color-text-light)'
            }}
          />
        </div>

        <div className="sensitivity-metrics">
          <div className="metric-card">
            <h4>Elasticity</h4>
            <div className="metric-value">
              {parameterData.elasticity.toFixed(2)}
            </div>
            <div className="metric-description">
              Price sensitivity to parameter changes
            </div>
          </div>

          <div className="metric-card">
            <h4>Stability</h4>
            <div className="metric-value">
              {(parameterData.stability * 100).toFixed(0)}%
            </div>
            <div className="metric-description">
              Consistency of impact across range
            </div>
          </div>

          <div className="metric-card">
            <h4>Threshold</h4>
            <div className="metric-value">
              {parameterData.threshold.toFixed(2)}
            </div>
            <div className="metric-description">
              Critical value for significant impact
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="derivatives-panel">
      {isLoading ? (
        <div className="loading-indicator">
          <div className="spinner" />
          <span>Loading derivatives data...</span>
        </div>
      ) : (
        renderDerivativesAnalysis()
      )}
    </div>
  );
};

export default DerivativesPanel;
