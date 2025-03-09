import React, { useState, useEffect, useCallback } from 'react';
import './SensitivityEngine.css';
import './css/PriceEfficacy.css';
import AnalysisChart from './AnalysisChart';
import EfficacyIndicator from './EfficacyIndicator';
import { runSensitivityAnalysis, runMonteCarloSimulation } from './services/apiService';
import { calculateEfficacyMetrics } from './services/integrationService';

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

const SensitivityEngine = ({ 
  model, 
  baseModel, 
  sensitivityData: initialSensitivityData,
  onUpdate, 
  onClose 
}) => {
  const [activeSimulation, setActiveSimulation] = useState(SIMULATION_TYPES.SENSITIVITY);
  const [parameters, setParameters] = useState([]);
  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [efficacyMetrics, setEfficacyMetrics] = useState(null);
  const [priceData, setPriceData] = useState(null);

  // Listen for price data events to calculate efficacy
  useEffect(() => {
    const handlePriceDataLoaded = (event) => {
      const { version, extension, priceData } = event.detail;
      
      // Only process events for this model
      if (version !== model.version || extension !== model.extension) return;
      
      // Store price data for efficacy calculations
      setPriceData(priceData);
    };
    
    // Listen for price data loaded events
    window.addEventListener('priceDataLoaded', handlePriceDataLoaded);
    
    return () => {
      window.removeEventListener('priceDataLoaded', handlePriceDataLoaded);
    };
  }, [model]);
  
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
      
      // Use initial sensitivity data if provided
      if (initialSensitivityData?.derivatives) {
        updateEfficacyMetrics(initialSensitivityData, priceData);
      }
    };

    initializeParameters();
  }, [model, initialSensitivityData, priceData]);
  
  // Update efficacy metrics when sensitivity data and price data are available
  const updateEfficacyMetrics = useCallback((sensitivityData, priceData) => {
    if (sensitivityData?.derivatives && priceData) {
      // Use the integrationService for efficacy calculations
      const metrics = calculateEfficacyMetrics(sensitivityData, priceData);
      setEfficacyMetrics(metrics);
    }
  }, []);

  // Update efficacy metrics when price data changes
  useEffect(() => {
    if (results && priceData) {
      // Create sensitivity data structure from results
      const sensitivityData = {
        parameters: results.results?.map(r => r.parameter) || [],
        derivatives: results.results?.map(r => ({
          parameter: r.parameter,
          data: r.values.map(v => ({ impact: v.impact }))
        })) || []
      };
      
      updateEfficacyMetrics(sensitivityData, priceData);
    }
  }, [results, priceData, updateEfficacyMetrics]);

  // Run sensitivity analysis
  const handleSensitivityAnalysis = useCallback(async () => {
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

      // Use the API service instead of mock function
      const results = await runSensitivityAnalysis(analysisParams);
      setResults(results);
      
      // Update parent component with results
      if (onUpdate) {
        onUpdate({
          results: results,
          efficacyReady: true
        });
      }
    } catch (error) {
      console.error('Sensitivity analysis failed:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [parameters, onUpdate]);

  // Run Monte Carlo simulation
  const handleMonteCarloSimulation = useCallback(async () => {
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

      // Use the API service instead of mock function
      const results = await runMonteCarloSimulation(simulationParams);
      setResults(results);
      
      // Update parent component with results
      if (onUpdate) {
        onUpdate({
          results: results,
          efficacyReady: false // Monte Carlo doesn't calculate efficacy
        });
      }
    } catch (error) {
      console.error('Monte Carlo simulation failed:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [parameters, onUpdate]);

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
      
      {/* Display efficacy metrics if available */}
      {efficacyMetrics && (
        <div className="efficacy-summary">
          <h3>Price Efficacy Analysis</h3>
          <EfficacyIndicator
            efficacyMetrics={efficacyMetrics}
            showDetails={true}
            maxImpacts={5}
          />
        </div>
      )}

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
                      <h4 style={{ color: getParameterColor(paramResult.parameter) }}>
                        {paramResult.parameter.charAt(0).toUpperCase() + paramResult.parameter.slice(1)} Sensitivity
                        {efficacyMetrics && (
                          <span className="parameter-efficacy">
                            {' • '}
                            {efficacyMetrics.parameterImpacts.find(p => p.parameter === paramResult.parameter)?.elasticity.toFixed(2) || 0}
                            {' elasticity'}
                          </span>
                        )}
                      </h4>
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
                  
                  <div className="tornado-chart">
                    <h4>Parameter Impact Analysis</h4>
                    <AnalysisChart
                      type="tornado"
                      data={{
                        parameters: parameters
                          .filter(p => p.isEnabled)
                          .map(p => ({
                            name: p.type.charAt(0).toUpperCase() + p.type.slice(1),
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
              
              <div className="analysis-actions">
                <button
                  className="run-analysis-button"
                  onClick={activeSimulation === SIMULATION_TYPES.SENSITIVITY ? handleSensitivityAnalysis : handleMonteCarloSimulation}
                >
                  Recalculate {activeSimulation === SIMULATION_TYPES.SENSITIVITY ? 'Sensitivity Analysis' : 'Monte Carlo Simulation'}
                </button>
                
                {efficacyMetrics && (
                  <div className="price-impact-summary">
                    <h4>Price Impact Summary</h4>
                    <div className="price-impact-metrics">
                      <div className="price-impact-metric">
                        <span className="metric-label">Overall Elasticity:</span>
                        <span className="metric-value">{efficacyMetrics.elasticity.toFixed(2)}</span>
                      </div>
                      <div className="price-impact-metric">
                        <span className="metric-label">Price Sensitivity:</span>
                        <span className="metric-value">{(efficacyMetrics.sensitivity * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-results">
              <p>Configure parameters and run analysis to see results</p>
              <button
                className="run-analysis-button"
                onClick={activeSimulation === SIMULATION_TYPES.SENSITIVITY ? handleSensitivityAnalysis : handleMonteCarloSimulation}
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
