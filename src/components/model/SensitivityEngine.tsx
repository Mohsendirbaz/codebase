import React, { useState, useCallback, useEffect } from 'react';
import './neumorphic-sensitivity.css';
import { useWebSocket } from './hooks/useWebSocket';
import ProgressIndicator from './ProgressIndicator';
import AnalysisChart from './AnalysisChart';

interface Parameter {
  id: string;
  name: string;
  type: string;
  range: {
    min: number;
    max: number;
  };
  steps: number;
}

interface SensitivityEngineProps {
  parameters: Parameter[];
  onAnalysisComplete?: (results: any) => void;
  onError?: (error: Error) => void;
  className?: string;
}

const SensitivityEngine: React.FC<SensitivityEngineProps> = ({
  parameters,
  onAnalysisComplete,
  onError,
  className = ''
}) => {
  const { connected, startAnalysis, cancelAnalysis, progress, error } = useWebSocket();
  const [activeAnalyses, setActiveAnalyses] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, any>>({});

  // Handle WebSocket errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Monitor analysis progress
  useEffect(() => {
    Object.entries(progress).forEach(([analysisId, data]) => {
      if (data.latest_results) {
        setResults(prev => ({
          ...prev,
          [analysisId]: data.latest_results
        }));

        // If analysis is complete, notify parent
        if (data.status === 'complete' && onAnalysisComplete) {
          onAnalysisComplete(data.latest_results);
        }
      }
    });
  }, [progress, onAnalysisComplete]);

  const handleStartAnalysis = useCallback((parameter: Parameter) => {
    try {
      const analysisId = startAnalysis('sensitivity', {
        parameter,
        type: 'multipoint',
        config: {
          steps: parameter.steps,
          range: parameter.range
        }
      });
      
      setActiveAnalyses(prev => [...prev, analysisId]);
    } catch (err) {
      if (onError) {
        onError(err as Error);
      }
    }
  }, [startAnalysis, onError]);

  const handleCancelAnalysis = useCallback((analysisId: string) => {
    cancelAnalysis(analysisId);
    setActiveAnalyses(prev => prev.filter(id => id !== analysisId));
  }, [cancelAnalysis]);

  return (
    <div className={`sensitivity-engine ${className}`}>
      {!connected && (
        <div className="connection-status">
          Connecting to analysis server...
        </div>
      )}

      <div className="parameters-grid">
        {parameters.map(param => (
          <div key={param.id} className="parameter-card">
            <div className="parameter-header">
              <h3>{param.name}</h3>
              <span className="parameter-type">{param.type}</span>
            </div>

            <div className="parameter-range">
              <span>Range: {param.range.min} to {param.range.max}</span>
              <span>Steps: {param.steps}</span>
            </div>

            <button
              className="analyze-button"
              onClick={() => handleStartAnalysis(param)}
              disabled={!connected}
            >
              Analyze Sensitivity
            </button>

            {/* Show progress for active analyses */}
            {activeAnalyses
              .filter(id => progress[id]?.latest_results?.parameter_id === param.id)
              .map(analysisId => (
                <ProgressIndicator
                  key={analysisId}
                  progress={progress[analysisId]}
                  onCancel={() => handleCancelAnalysis(analysisId)}
                />
              ))}

            {/* Show results if available */}
            {Object.entries(results)
              .filter(([_, data]) => data.parameter_id === param.id)
              .map(([analysisId, data]) => (
                <div key={analysisId} className="analysis-results">
                  <AnalysisChart
                    type="sensitivity"
                    data={{
                      points: data.sensitivity_curve,
                      baseline: data.baseline_value,
                      confidence: data.confidence_intervals
                    }}
                    options={{
                      height: 200,
                      showConfidence: true,
                      lineColor: 'var(--model-color-primary)',
                      confidenceColor: 'var(--model-color-primary-light)'
                    }}
                  />
                  
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <span className="metric-label">Elasticity</span>
                      <span className="metric-value">
                        {data.elasticity.toFixed(3)}
                      </span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Impact Score</span>
                      <span className="metric-value">
                        {(data.impact_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Confidence</span>
                      <span className="metric-value">
                        {(data.confidence_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SensitivityEngine;
