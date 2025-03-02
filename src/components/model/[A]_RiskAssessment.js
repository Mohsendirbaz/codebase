import React, { useState, useEffect, useCallback } from 'react';
import './RiskAssessment.css';
import AnalysisChart from './AnalysisChart';

const RISK_TYPES = {
  MARKET: 'market',
  OPERATIONAL: 'operational',
  FINANCIAL: 'financial'
};

const RISK_METRICS = {
  VAR: 'Value at Risk',
  VOLATILITY: 'Volatility',
  CORRELATION: 'Correlation',
  BETA: 'Beta'
};

const RiskAssessment = ({ model, baseModel, scenarios, onUpdate, onClose }) => {
  const [activeRiskType, setActiveRiskType] = useState(RISK_TYPES.MARKET);
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [optimizationTarget, setOptimizationTarget] = useState({
    metric: 'VAR',
    threshold: 0.05
  });

  // Initialize risk metrics based on model and scenarios
  useEffect(() => {
    const calculateInitialMetrics = async () => {
      setIsCalculating(true);
      try {
        const metrics = await calculateRiskMetrics(model, scenarios);
        setRiskMetrics(metrics);
      } catch (error) {
        console.error('Risk calculation failed:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateInitialMetrics();
  }, [model, scenarios]);

  // Calculate risk metrics
  const calculateRiskMetrics = async (model, scenarios) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock risk calculations - replace with actual risk models
    const marketRisk = calculateMarketRisk(model, scenarios);
    const operationalRisk = calculateOperationalRisk(model, scenarios);
    const financialRisk = calculateFinancialRisk(model, scenarios);

    return {
      market: marketRisk,
      operational: operationalRisk,
      financial: financialRisk
    };
  };

  // Risk calculation functions
  const calculateMarketRisk = (model, scenarios) => {
    const returns = scenarios.map(s => ({
      value: Math.random() * 2 - 1,
      probability: Math.random()
    }));

    return {
      var: calculateVaR(returns, 0.95),
      volatility: calculateVolatility(returns),
      correlation: calculateCorrelation(returns),
      beta: calculateBeta(returns)
    };
  };

  const calculateOperationalRisk = (model, scenarios) => {
    return {
      var: Math.random() * 0.1,
      volatility: Math.random() * 0.2,
      correlation: Math.random() * 0.5,
      beta: Math.random() * 1.5
    };
  };

  const calculateFinancialRisk = (model, scenarios) => {
    return {
      var: Math.random() * 0.15,
      volatility: Math.random() * 0.25,
      correlation: Math.random() * 0.6,
      beta: Math.random() * 1.2
    };
  };

  // Statistical calculations
  const calculateVaR = (returns, confidence) => {
    const sortedReturns = returns
      .map(r => r.value)
      .sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    return -sortedReturns[index];
  };

  const calculateVolatility = (returns) => {
    const values = returns.map(r => r.value);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  };

  const calculateCorrelation = (returns) => {
    // Mock correlation with market benchmark
    return Math.random() * 2 - 1;
  };

  const calculateBeta = (returns) => {
    // Mock beta calculation
    return Math.random() * 2;
  };

  // Handle optimization target update
  const handleOptimizationUpdate = useCallback((updates) => {
    setOptimizationTarget(prev => ({
      ...prev,
      ...updates
    }));

    // Notify parent component
    onUpdate({
      type: 'optimization',
      target: {
        ...optimizationTarget,
        ...updates
      }
    });
  }, [optimizationTarget, onUpdate]);

  return (
    <div className="risk-assessment">
      <div className="risk-header">
        <h2>Risk Assessment: {model.name}</h2>
        <div className="risk-type-toggle">
          {Object.entries(RISK_TYPES).map(([key, value]) => (
            <button
              key={key}
              className={`toggle-button ${activeRiskType === value ? 'active' : ''}`}
              onClick={() => setActiveRiskType(value)}
            >
              {key.charAt(0) + key.slice(1).toLowerCase()} Risk
            </button>
          ))}
        </div>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="risk-content">
        {isCalculating ? (
          <div className="calculating-indicator">
            <div className="spinner" />
            <span>Calculating Risk Metrics...</span>
          </div>
        ) : riskMetrics ? (
          <div className="metrics-panel">
            <div className="metrics-grid">
              {Object.entries(RISK_METRICS).map(([key, label]) => (
                <div key={key} className="metric-card">
                  <h4>{label}</h4>
                  <div className="metric-value">
                    {(riskMetrics[activeRiskType][key.toLowerCase()] * 100).toFixed(2)}%
                  </div>
                  <div className="metric-chart">
                    <AnalysisChart
                      type="distribution"
                      data={{
                        values: Array.from({ length: 100 }, () => ({
                          value: Math.random() * 2 - 1,
                          probability: Math.random()
                        }))
                      }}
                      options={{
                        barColor: getRiskColor(activeRiskType, 0.2),
                        barBorder: getRiskColor(activeRiskType, 0.5)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="optimization-panel">
              <h3>Risk Optimization</h3>
              <div className="optimization-controls">
                <div className="control-group">
                  <label>Target Metric</label>
                  <select
                    value={optimizationTarget.metric}
                    onChange={(e) => handleOptimizationUpdate({ metric: e.target.value })}
                  >
                    {Object.entries(RISK_METRICS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="control-group">
                  <label>Risk Threshold (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={optimizationTarget.threshold * 100}
                    onChange={(e) => handleOptimizationUpdate({
                      threshold: parseFloat(e.target.value) / 100
                    })}
                  />
                </div>
              </div>

              <div className="optimization-chart">
                <AnalysisChart
                  type="tornado"
                  data={{
                    parameters: Object.entries(RISK_METRICS).map(([key]) => ({
                      name: key,
                      low: -Math.random() * 0.5,
                      high: Math.random() * 0.5
                    }))
                  }}
                  options={{
                    negativeColor: getRiskColor(activeRiskType, 0.2),
                    positiveColor: getRiskColor(activeRiskType, 0.5)
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="no-metrics">
            <p>Configure scenarios and run analysis to see risk metrics</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get consistent colors for risk types
const getRiskColor = (riskType, alpha = 1) => {
  const colors = {
    [RISK_TYPES.MARKET]: `rgba(59, 130, 246, ${alpha})`,
    [RISK_TYPES.OPERATIONAL]: `rgba(239, 68, 68, ${alpha})`,
    [RISK_TYPES.FINANCIAL]: `rgba(34, 197, 94, ${alpha})`
  };
  return colors[riskType] || `rgba(100, 116, 139, ${alpha})`;
};

export default RiskAssessment;
