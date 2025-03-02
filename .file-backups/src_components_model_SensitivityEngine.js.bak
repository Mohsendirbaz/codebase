import React, { useState, useEffect, useCallback } from 'react';
import './SensitivityEngine.css';
import AnalysisChart from './AnalysisChart';

const SIMULATION_TYPES = {
  SENSITIVITY: 'sensitivity',
  MONTE_CARLO: 'monteCarlo'
};

const PARAMETER_TYPES = {
  COST: 'cost',
  TIME: 'time',
  PROCESS: 'process'
};

const PARAMETER_COLORS = {
  cost: '#3b82f6',
  time: '#22c55e',
  process: '#f59e0b'
};

const SensitivityEngine = ({ model, baseModel, onUpdate, onClose }) => {
  const [activeSimulation, setActiveSimulation] = useState(SIMULATION_TYPES.SENSITIVITY);
  const [parameters, setParameters] = useState([]);
  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Initialize parameters based on model filters
  useEffect(() => {
    const initializeParameters = () => {
      const activeFilters = Object.entries(model.filters)
        .filter(([_, isActive]) => isActive)
        .map(([type]) => type);

      const params = activeFilters.map(filter => ({
        type: filter,
        range: {
          min: -model.departure,
          max: model.departure
        },
        distribution: 'uniform',
        steps: 10,
        isEnabled: true
      }));

      setParameters(params);
    };

    initializeParameters();
  }, [model]);

  // Run sensitivity analysis
  const runSensitivityAnalysis = useCallback(async () => {
    setIsCalculating(true);
    try {
      // Prepare parameters for analysis
      const analysisParams = parameters
        .filter(p => p.isEnabled)
        .map(p => ({
          type: p.type,
          range: p.range,
          steps: p.steps
        }));

      // Mock API call - replace with actual backend call
      const results = await mockSensitivityCalculation(analysisParams);
      setResults(results);
    } catch (error) {
      console.error('Sensitivity analysis failed:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [parameters]);

  // Run Monte Carlo simulation
  const runMonteCarloSimulation = useCallback(async () => {
    setIsCalculating(true);
    try {
      // Prepare parameters for simulation
      const simulationParams = parameters
        .filter(p => p.isEnabled)
        .map(p => ({
          type: p.type,
          distribution: p.distribution,
          range: p.range
        }));

      // Mock API call - replace with actual backend call
      const results = await mockMonteCarloSimulation(simulationParams);
      setResults(results);
    } catch (error) {
      console.error('Monte Carlo simulation failed:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [parameters]);

  // Update parameter settings
  const handleParameterUpdate = (index, updates) => {
    setParameters(prev => {
      const newParams = [...prev];
      newParams[index] = { ...newParams[index], ...updates };
      return newParams;
    });
  };

  // Helper function to get consistent colors for parameters
  const getParameterColor = (parameter) => {
    return PARAMETER_COLORS[parameter] || '#64748b';
  };

  // Mock calculation functions - replace with actual API calls
  const mockSensitivityCalculation = async (params) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      type: 'sensitivity',
      parameters: params,
      results: params.map(p => ({
        parameter: p.type,
        values: Array.from({ length: p.steps }, (_, i) => ({
          value: p.range.min + (p.range.max - p.range.min) * (i / (p.steps - 1)),
          impact: Math.random() * 2 - 1
        }))
      }))
    };
  };

  const mockMonteCarloSimulation = async (params) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      type: 'monteCarlo',
      parameters: params,
      iterations: 1000,
      results: {
        npv: Array.from({ length: 1000 }, () => ({
          value: Math.random() * 1000000,
          probability: Math.random()
        })),
        irr: Array.from({ length: 1000 }, () => ({
          value: Math.random() * 0.2,
          probability: Math.random()
        }))
      }
    };
  };

  return (
    <div className="sensitivity-engine">
      <div className="sensitivity-header">
        <h2>Sensitivity Analysis: {model.name}</h2>
        <div className="simulation-toggle">
          <button
            className={`toggle-button ${activeSimulation === SIMULATION_TYPES.SENSITIVITY ? 'active' : ''}`}
            onClick={() => setActiveSimulation(SIMULATION_TYPES.SENSITIVITY)}
          >
            Sensitivity Analysis
          </button>
          <button
            className={`toggle-button ${activeSimulation === SIMULATION_TYPES.MONTE_CARLO ? 'active' : ''}`}
            onClick={() => setActiveSimulation(SIMULATION_TYPES.MONTE_CARLO)}
          >
            Monte Carlo
          </button>
        </div>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="sensitivity-content">
        <div className="parameters-panel">
          <h3>Analysis Parameters</h3>
          {parameters.map((param, index) => (
            <div key={param.type} className="parameter-control">
              <div className="parameter-header">
                <label className="parameter-label">
                  <input
                    type="checkbox"
                    checked={param.isEnabled}
                    onChange={(e) => handleParameterUpdate(index, { isEnabled: e.target.checked })}
                  />
                  {param.type.charAt(0).toUpperCase() + param.type.slice(1)}
                </label>
              </div>
              
              {param.isEnabled && (
                <div className="parameter-settings">
                  <div className="range-control">
                    <label>Range</label>
                    <div className="range-inputs">
                      <input
                        type="number"
                        value={param.range.min}
                        onChange={(e) => handleParameterUpdate(index, {
                          range: { ...param.range, min: parseFloat(e.target.value) }
                        })}
                      />
                      <span>to</span>
                      <input
                        type="number"
                        value={param.range.max}
                        onChange={(e) => handleParameterUpdate(index, {
                          range: { ...param.range, max: parseFloat(e.target.value) }
                        })}
                      />
                    </div>
                  </div>

                  {activeSimulation === SIMULATION_TYPES.SENSITIVITY && (
                    <div className="steps-control">
                      <label>Steps</label>
                      <input
                        type="number"
                        min="2"
                        max="50"
                        value={param.steps}
                        onChange={(e) => handleParameterUpdate(index, {
                          steps: parseInt(e.target.value)
                        })}
                      />
                    </div>
                  )}

                  {activeSimulation === SIMULATION_TYPES.MONTE_CARLO && (
                    <div className="distribution-control">
                      <label>Distribution</label>
                      <select
                        value={param.distribution}
                        onChange={(e) => handleParameterUpdate(index, {
                          distribution: e.target.value
                        })}
                      >
                        <option value="uniform">Uniform</option>
                        <option value="normal">Normal</option>
                        <option value="triangular">Triangular</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="results-panel">
          {isCalculating ? (
            <div className="calculating-indicator">
              <div className="spinner" />
              <span>Running {activeSimulation === SIMULATION_TYPES.SENSITIVITY ? 'Sensitivity Analysis' : 'Monte Carlo Simulation'}...</span>
            </div>
          ) : results ? (
            <div className="results-content">
              {results.type === 'sensitivity' && (
                <div className="sensitivity-results">
                  {results.results.map(paramResult => (
                    <div key={paramResult.parameter} className="parameter-result">
                      <h4>{paramResult.parameter} Sensitivity</h4>
                      <AnalysisChart
                        type="sensitivity"
                        data={{
                          values: paramResult.values
                        }}
                        options={{
                          lineColor: getParameterColor(paramResult.parameter),
                          pointColor: getParameterColor(paramResult.parameter)
                        }}
                      />
                    </div>
                  ))}
                  <AnalysisChart
                    type="tornado"
                    data={{
                      parameters: parameters
                        .filter(p => p.isEnabled)
                        .map(p => ({
                          name: p.type,
                          low: -p.range.min / 100,
                          high: p.range.max / 100
                        }))
                    }}
                    options={{
                      negativeColor: 'rgba(239, 68, 68, 0.2)',
                      positiveColor: 'rgba(34, 197, 94, 0.2)'
                    }}
                  />
                </div>
              )}

              {results.type === 'monteCarlo' && (
                <div className="monte-carlo-results">
                  <div className="distribution-charts">
                    <div className="chart-container">
                      <h4>NPV Distribution</h4>
                      <AnalysisChart
                        type="distribution"
                        data={{
                          values: results.results.npv
                        }}
                        options={{
                          barColor: 'rgba(34, 197, 94, 0.2)',
                          barBorder: 'rgba(34, 197, 94, 0.5)'
                        }}
                      />
                    </div>
                    <div className="chart-container">
                      <h4>IRR Distribution</h4>
                      <AnalysisChart
                        type="distribution"
                        data={{
                          values: results.results.irr
                        }}
                        options={{
                          barColor: 'rgba(59, 130, 246, 0.2)',
                          barBorder: 'rgba(59, 130, 246, 0.5)'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-results">
              <p>Configure parameters and run analysis to see results</p>
              <button
                className="run-analysis-button"
                onClick={activeSimulation === SIMULATION_TYPES.SENSITIVITY ? runSensitivityAnalysis : runMonteCarloSimulation}
              >
                Run {activeSimulation === SIMULATION_TYPES.SENSITIVITY ? 'Sensitivity Analysis' : 'Monte Carlo Simulation'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SensitivityEngine;
