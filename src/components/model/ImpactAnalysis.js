import React, { useState, useEffect } from 'react';
import './neumorphic-impact.css';
import { useVersionState } from '../../contexts/VersionStateContext';
import useFormValues from '../../useFormValues';
import EfficacyIndicator from './EfficacyIndicator';

const ImpactAnalysis = ({ model, baseModel, onClose }) => {
  // Access version state and form values
  const { version } = useVersionState();
  const { formValues, propertyMapping } = useFormValues();
  
  const [activeTab, setActiveTab] = useState('cashflow');
  const [impactData, setImpactData] = useState(null);
  const [efficacyMetrics, setEfficacyMetrics] = useState(null);

  // Calculate impact data based on model settings and base model
  useEffect(() => {
    const calculateImpact = () => {
      const impact = {
        cashflow: {
          inherited: calculateInheritedValues(model, baseModel),
          departure: calculateDepartureEffect(model.departure),
          priority: calculatePriorityImpact(model.priority)
        },
        costs: {
          operating: calculateOperatingCosts(model, baseModel),
          fixed: calculateFixedCosts(model, baseModel),
          variable: calculateVariableCosts(model, baseModel)
        },
        depreciation: calculateDepreciationSchedule(model, baseModel)
      };
      setImpactData(impact);
    };

    calculateImpact();
  }, [model, baseModel]);
  
  // Calculate efficacy metrics when impact data changes
  useEffect(() => {
    if (impactData) {
      // Calculate efficacy metrics based on the impact analysis
      const calculateEfficacyMetrics = () => {
        // In a real implementation, this would likely call an API or use more complex calculations
        // using the formValues and propertyMapping
        return {
          costEfficiency: 0.75 + (Math.random() * 0.2), // Value between 0.75 and 0.95
          timeEfficiency: 0.65 + (Math.random() * 0.25), // Value between 0.65 and 0.9
          processEfficiency: 0.7 + (Math.random() * 0.2), // Value between 0.7 and 0.9
          overallEfficacy: 0.7 + (Math.random() * 0.25), // Value between 0.7 and 0.95
          confidenceScore: 0.8 + (Math.random() * 0.15), // Value between 0.8 and 0.95
          parameterSensitivity: {
            cost: 0.2 + (Math.random() * 0.6), // Value between 0.2 and 0.8
            time: 0.3 + (Math.random() * 0.5), // Value between 0.3 and 0.8
            process: 0.4 + (Math.random() * 0.4) // Value between 0.4 and 0.8
          }
        };
      };
      
      setEfficacyMetrics(calculateEfficacyMetrics());
    }
  }, [impactData, formValues, propertyMapping]);

  // Calculation helper functions
  const calculateInheritedValues = (model, baseModel) => {
    const inherited = {};
    Object.keys(model.filters).forEach(filter => {
      if (model.filters[filter]) {
        inherited[filter] = {
          from: baseModel[filter],
          modification: model.departure
        };
      }
    });
    return inherited;
  };

  const calculateDepartureEffect = (departure) => {
    return {
      percentage: departure,
      impact: departure / 100
    };
  };

  const calculatePriorityImpact = (priority) => {
    const impacts = {
      high: 1,
      medium: 0.5,
      low: 0.25
    };
    return impacts[priority] || 0;
  };

  const calculateOperatingCosts = (model, baseModel) => {
    // Simplified calculation for demo
    return {
      base: 100,
      modified: 100 * (1 + model.departure / 100)
    };
  };

  const calculateFixedCosts = (model, baseModel) => {
    // Simplified calculation for demo
    return {
      base: 50,
      modified: 50 * (1 + model.departure / 100)
    };
  };

  const calculateVariableCosts = (model, baseModel) => {
    // Simplified calculation for demo
    return {
      base: 50,
      modified: 50 * (1 + model.departure / 100)
    };
  };

  const calculateDepreciationSchedule = (model, baseModel) => {
    // Simplified calculation for demo
    return {
      years: 5,
      annual: 20,
      modified: 20 * (1 + model.departure / 100)
    };
  };

  return (
    <div className="impact-analysis">
      <div className="impact-header">
        <h2>Impact Analysis: {model.name}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="impact-tabs">
        <button
          className={`tab-button ${activeTab === 'cashflow' ? 'active' : ''}`}
          onClick={() => setActiveTab('cashflow')}
        >
          Cash Flow Impact
        </button>
        <button
          className={`tab-button ${activeTab === 'costs' ? 'active' : ''}`}
          onClick={() => setActiveTab('costs')}
        >
          Cost Structure
        </button>
        <button
          className={`tab-button ${activeTab === 'depreciation' ? 'active' : ''}`}
          onClick={() => setActiveTab('depreciation')}
        >
          Depreciation Impact
        </button>
      </div>

      <div className="impact-content">
        {impactData && (
          <>
            {activeTab === 'cashflow' && (
              <div className="cashflow-impact">
                <h3>Inheritance Effects</h3>
                <div className="impact-grid">
                  {Object.entries(impactData.cashflow.inherited).map(([filter, data]) => (
                    <div key={filter} className="impact-item">
                      <h4>{filter} Filter</h4>
                      <div className="impact-value">
                        Base Value: {data.from}
                        <span className="arrow">→</span>
                        Modified: {data.from * (1 + data.modification / 100)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="departure-effect">
                  <h3>Departure Effect</h3>
                  <div className="effect-meter">
                    <div 
                      className="effect-fill"
                      style={{ width: `${impactData.cashflow.departure.percentage}%` }}
                    />
                    <span className="effect-value">
                      {impactData.cashflow.departure.percentage}% Departure
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'costs' && (
              <div className="cost-impact">
                <h3>Cost Structure Changes</h3>
                <div className="cost-comparison">
                  <div className="cost-column">
                    <h4>Operating Costs</h4>
                    <div className="cost-bar">
                      <div className="base-cost" style={{ height: `${impactData.costs.operating.base}px` }} />
                      <div className="modified-cost" style={{ height: `${impactData.costs.operating.modified}px` }} />
                    </div>
                    <div className="cost-labels">
                      <span>Base: ${impactData.costs.operating.base}</span>
                      <span>Modified: ${impactData.costs.operating.modified}</span>
                    </div>
                  </div>

                  <div className="cost-column">
                    <h4>Fixed Costs</h4>
                    <div className="cost-bar">
                      <div className="base-cost" style={{ height: `${impactData.costs.fixed.base}px` }} />
                      <div className="modified-cost" style={{ height: `${impactData.costs.fixed.modified}px` }} />
                    </div>
                    <div className="cost-labels">
                      <span>Base: ${impactData.costs.fixed.base}</span>
                      <span>Modified: ${impactData.costs.fixed.modified}</span>
                    </div>
                  </div>

                  <div className="cost-column">
                    <h4>Variable Costs</h4>
                    <div className="cost-bar">
                      <div className="base-cost" style={{ height: `${impactData.costs.variable.base}px` }} />
                      <div className="modified-cost" style={{ height: `${impactData.costs.variable.modified}px` }} />
                    </div>
                    <div className="cost-labels">
                      <span>Base: ${impactData.costs.variable.base}</span>
                      <span>Modified: ${impactData.costs.variable.modified}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'depreciation' && (
              <div className="depreciation-impact">
                <h3>Depreciation Schedule</h3>
                <div className="depreciation-timeline">
                  {Array.from({ length: impactData.depreciation.years }).map((_, index) => (
                    <div key={index} className="depreciation-year">
                      <div className="year-label">Year {index + 1}</div>
                      <div className="depreciation-bar">
                        <div 
                          className="base-depreciation"
                          style={{ height: `${impactData.depreciation.annual}px` }}
                        />
                        <div 
                          className="modified-depreciation"
                          style={{ height: `${impactData.depreciation.modified}px` }}
                        />
                      </div>
                      <div className="depreciation-values">
                        <span>${impactData.depreciation.annual}</span>
                        <span>${impactData.depreciation.modified}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Add EfficacyIndicator integration */}
      {efficacyMetrics && (
        <div className="efficacy-indicator-container">
          <h3>Impact Efficacy Analysis</h3>
          <EfficacyIndicator 
            metrics={efficacyMetrics}
            modelType={model.type}
            baselineType={baseModel.type}
          />
        </div>
      )}
    </div>
  );
};

export default ImpactAnalysis;
