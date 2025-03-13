import React, { useState, useEffect, useCallback } from 'react';
import './OptimizationEngine.css';
import AnalysisChart from './AnalysisChart';

const OPTIMIZATION_TYPES = {
  COST: 'cost',
  RISK: 'risk',
  RETURN: 'return',
  MULTI: 'multi'
};

const OBJECTIVE_FUNCTIONS = {
  MINIMIZE_COST: 'minimize_cost',
  MINIMIZE_RISK: 'minimize_risk',
  MAXIMIZE_RETURN: 'maximize_return',
  MAXIMIZE_EFFICIENCY: 'maximize_efficiency'
};

const OptimizationEngine = ({ model, baseModel, scenarios, constraints, onUpdate, onClose }) => {
  const [activeOptimization, setActiveOptimization] = useState(OPTIMIZATION_TYPES.COST);
  const [objectiveFunction, setObjectiveFunction] = useState(OBJECTIVE_FUNCTIONS.MINIMIZE_COST);
  const [solutions, setSolutions] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationParams, setOptimizationParams] = useState({
    iterations: 1000,
    convergenceThreshold: 0.001,
    constraints: {
      maxCost: Infinity,
      maxRisk: 0.2,
      minReturn: 0.1
    }
  });

  // Initialize optimization based on model and scenarios
  useEffect(() => {
    const initializeOptimization = async () => {
      setIsOptimizing(true);
      try {
        const initialSolutions = await generateInitialSolutions(model, scenarios);
        setSolutions(initialSolutions);
      } catch (error) {
        console.error('Optimization initialization failed:', error);
      } finally {
        setIsOptimizing(false);
      }
    };

    initializeOptimization();
  }, [model, scenarios]);

  // Run optimization with current parameters
  const runOptimization = useCallback(async () => {
    setIsOptimizing(true);
    try {
      const results = await optimizeSolutions(
        solutions,
        objectiveFunction,
        optimizationParams
      );
      setSolutions(results);
      
      // Notify parent component
      onUpdate({
        type: 'optimization',
        solutions: results,
        parameters: optimizationParams
      });
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [solutions, objectiveFunction, optimizationParams, onUpdate]);

  // Generate initial solution set
  const generateInitialSolutions = async (model, scenarios) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate random initial solutions
    return Array.from({ length: 100 }, () => ({
      parameters: {
        cost: Math.random() * 1000000,
        risk: Math.random() * 0.3,
        return: Math.random() * 0.2
      },
      fitness: Math.random(),
      constraints: {
        costSatisfied: true,
        riskSatisfied: true,
        returnSatisfied: true
      }
    }));
  };

  // Optimize solutions using selected objective function
  const optimizeSolutions = async (currentSolutions, objective, params) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock optimization process
    const optimized = currentSolutions.map(solution => ({
      ...solution,
      parameters: {
        cost: solution.parameters.cost * (1 - Math.random() * 0.1),
        risk: solution.parameters.risk * (1 - Math.random() * 0.1),
        return: solution.parameters.return * (1 + Math.random() * 0.1)
      },
      fitness: solution.fitness * (1 + Math.random() * 0.1)
    }));

    // Sort by fitness
    return optimized.sort((a, b) => b.fitness - a.fitness);
  };

  // Update optimization parameters
  const handleParamUpdate = (updates) => {
    setOptimizationParams(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Get best solution metrics
  const getBestSolution = () => {
    if (!solutions?.length) return null;
    return solutions[0];
  };

  return (
    <div className="optimization-engine">
      <div className="optimization-header">
        <h2>Optimization Engine: {model.name}</h2>
        <div className="optimization-type-toggle">
          {Object.entries(OPTIMIZATION_TYPES).map(([key, value]) => (
            <button
              key={key}
              className={`toggle-button ${activeOptimization === value ? 'active' : ''}`}
              onClick={() => setActiveOptimization(value)}
            >
              {key.charAt(0) + key.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="optimization-content">
        <div className="optimization-controls">
          <div className="objective-function">
            <h3>Objective Function</h3>
            <select
              value={objectiveFunction}
              onChange={(e) => setObjectiveFunction(e.target.value)}
            >
              {Object.entries(OBJECTIVE_FUNCTIONS).map(([key, value]) => (
                <option key={key} value={value}>
                  {key.split('_').map(word => 
                    word.charAt(0) + word.slice(1).toLowerCase()
                  ).join(' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="constraint-controls">
            <h3>Constraints</h3>
            <div className="constraint-grid">
              <div className="constraint-item">
                <label>Max Cost ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={optimizationParams.constraints.maxCost}
                  onChange={(e) => handleParamUpdate({
                    constraints: {
                      ...optimizationParams.constraints,
                      maxCost: parseFloat(e.target.value)
                    }
                  })}
                />
              </div>
              <div className="constraint-item">
                <label>Max Risk (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={optimizationParams.constraints.maxRisk * 100}
                  onChange={(e) => handleParamUpdate({
                    constraints: {
                      ...optimizationParams.constraints,
                      maxRisk: parseFloat(e.target.value) / 100
                    }
                  })}
                />
              </div>
              <div className="constraint-item">
                <label>Min Return (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={optimizationParams.constraints.minReturn * 100}
                  onChange={(e) => handleParamUpdate({
                    constraints: {
                      ...optimizationParams.constraints,
                      minReturn: parseFloat(e.target.value) / 100
                    }
                  })}
                />
              </div>
            </div>
          </div>

          <div className="algorithm-controls">
            <h3>Algorithm Parameters</h3>
            <div className="param-grid">
              <div className="param-item">
                <label>Iterations</label>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={optimizationParams.iterations}
                  onChange={(e) => handleParamUpdate({
                    iterations: parseInt(e.target.value)
                  })}
                />
              </div>
              <div className="param-item">
                <label>Convergence Threshold</label>
                <input
                  type="number"
                  min="0.0001"
                  max="0.1"
                  step="0.0001"
                  value={optimizationParams.convergenceThreshold}
                  onChange={(e) => handleParamUpdate({
                    convergenceThreshold: parseFloat(e.target.value)
                  })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="results-panel">
          {isOptimizing ? (
            <div className="optimizing-indicator">
              <div className="spinner" />
              <span>Running Optimization...</span>
            </div>
          ) : solutions ? (
            <div className="optimization-results">
              <div className="best-solution">
                <h3>Best Solution</h3>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <label>Cost</label>
                    <span>${getBestSolution().parameters.cost.toLocaleString()}</span>
                  </div>
                  <div className="metric-item">
                    <label>Risk</label>
                    <span>{(getBestSolution().parameters.risk * 100).toFixed(2)}%</span>
                  </div>
                  <div className="metric-item">
                    <label>Return</label>
                    <span>{(getBestSolution().parameters.return * 100).toFixed(2)}%</span>
                  </div>
                  <div className="metric-item">
                    <label>Fitness</label>
                    <span>{getBestSolution().fitness.toFixed(4)}</span>
                  </div>
                </div>
              </div>

              <div className="solution-distribution">
                <h3>Solution Distribution</h3>
                <div className="chart-grid">
                  <div className="chart-container">
                    <h4>Cost Distribution</h4>
                    <AnalysisChart
                      type="distribution"
                      data={{
                        values: solutions.map(s => ({
                          value: s.parameters.cost,
                          probability: s.fitness
                        }))
                      }}
                      options={{
                        barColor: 'rgba(59, 130, 246, 0.2)',
                        barBorder: 'rgba(59, 130, 246, 0.5)'
                      }}
                    />
                  </div>
                  <div className="chart-container">
                    <h4>Risk vs Return</h4>
                    <AnalysisChart
                      type="scatter"
                      data={{
                        points: solutions.map(s => ({
                          x: s.parameters.risk,
                          y: s.parameters.return,
                          value: s.fitness
                        }))
                      }}
                      options={{
                        pointColor: 'rgba(34, 197, 94, 0.5)'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="optimization-actions">
                <button
                  className="optimize-button"
                  onClick={runOptimization}
                >
                  Run Optimization
                </button>
                <button
                  className="apply-button"
                  onClick={() => onUpdate({
                    type: 'apply',
                    solution: getBestSolution()
                  })}
                >
                  Apply Best Solution
                </button>
              </div>
            </div>
          ) : (
            <div className="no-solutions">
              <p>Configure parameters and run optimization to see results</p>
              <button
                className="optimize-button"
                onClick={runOptimization}
              >
                Start Optimization
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptimizationEngine;
