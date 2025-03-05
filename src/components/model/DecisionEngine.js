import React, { useState, useEffect, useCallback } from 'react';
import './DecisionEngine.css';
import AnalysisChart from './AnalysisChart';

const RECOMMENDATION_TYPES = {
  OPTIMIZATION: 'optimization',
  RISK: 'risk',
  SENSITIVITY: 'sensitivity',
  COMBINED: 'combined'
};

const CONFIDENCE_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

const DecisionEngine = ({ 
  model, 
  baseModel, 
  scenarios, 
  optimizationResults,
  riskMetrics,
  sensitivityData,
  onApply,
  onClose 
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Generate recommendations based on all available data
  useEffect(() => {
    const generateRecommendations = async () => {
      setIsAnalyzing(true);
      try {
        const newRecommendations = await analyzeData();
        setRecommendations(newRecommendations);
        if (newRecommendations.length > 0) {
          setSelectedRecommendation(newRecommendations[0]);
        }
      } catch (error) {
        console.error('Recommendation generation failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    generateRecommendations();
  }, [model, optimizationResults, riskMetrics, sensitivityData]);

  // Analyze data and generate recommendations
  const analyzeData = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const recommendations = [];

    // Analyze optimization results
    if (optimizationResults?.solutions) {
      const bestSolution = optimizationResults.solutions[0];
      recommendations.push({
        type: RECOMMENDATION_TYPES.OPTIMIZATION,
        title: 'Optimal Configuration',
        description: 'Based on optimization results, the following configuration provides the best balance of cost, risk, and return.',
        confidence: CONFIDENCE_LEVELS.HIGH,
        impact: calculateImpact(bestSolution),
        changes: [
          {
            parameter: 'Cost Structure',
            current: model.filters.cost ? 'Active' : 'Inactive',
            recommended: bestSolution.parameters.cost > 0.5 ? 'Active' : 'Inactive',
            reason: 'Optimization suggests this configuration maximizes return while maintaining acceptable risk levels.'
          },
          {
            parameter: 'Risk Exposure',
            current: `${(model.departure * 100).toFixed(1)}%`,
            recommended: `${(bestSolution.parameters.risk * 100).toFixed(1)}%`,
            reason: 'This level balances potential returns with risk tolerance.'
          }
        ],
        metrics: {
          expectedReturn: bestSolution.parameters.return,
          riskLevel: bestSolution.parameters.risk,
          confidence: bestSolution.fitness
        }
      });
    }

    // Analyze risk metrics
    if (riskMetrics) {
      const riskRecommendation = {
        type: RECOMMENDATION_TYPES.RISK,
        title: 'Risk Mitigation Strategy',
        description: 'Risk analysis suggests the following adjustments to improve the model\'s risk profile.',
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        impact: calculateRiskImpact(riskMetrics),
        changes: [
          {
            parameter: 'Risk Threshold',
            current: `${(model.departure * 100).toFixed(1)}%`,
            recommended: `${(riskMetrics.recommendedThreshold * 100).toFixed(1)}%`,
            reason: 'Aligns with historical volatility patterns and risk tolerance.'
          }
        ],
        metrics: {
          currentVar: riskMetrics.var,
          projectedVar: riskMetrics.projectedVar,
          confidenceInterval: riskMetrics.confidenceInterval
        }
      };
      recommendations.push(riskRecommendation);
    }

    // Analyze sensitivity data
    if (sensitivityData?.results) {
      const sensitivityRecommendation = {
        type: RECOMMENDATION_TYPES.SENSITIVITY,
        title: 'Parameter Sensitivity Insights',
        description: 'Sensitivity analysis reveals key parameters that significantly impact model performance.',
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        impact: calculateSensitivityImpact(sensitivityData),
        changes: sensitivityData.results.map(result => ({
          parameter: result.parameter,
          current: 'Current Setting',
          recommended: result.recommendedValue,
          reason: `Parameter shows ${result.impact > 0.5 ? 'high' : 'moderate'} impact on model outcomes.`
        })),
        metrics: {
          topFactors: sensitivityData.results.slice(0, 3),
          impactRange: sensitivityData.impactRange
        }
      };
      recommendations.push(sensitivityRecommendation);
    }

    // Generate combined recommendation if multiple analyses available
    if (recommendations.length > 1) {
      const combinedRecommendation = {
        type: RECOMMENDATION_TYPES.COMBINED,
        title: 'Comprehensive Strategy',
        description: 'Holistic analysis combining optimization, risk, and sensitivity insights.',
        confidence: CONFIDENCE_LEVELS.HIGH,
        impact: calculateCombinedImpact(recommendations),
        changes: aggregateChanges(recommendations),
        metrics: {
          overallScore: calculateOverallScore(recommendations),
          confidenceLevel: calculateConfidenceLevel(recommendations)
        }
      };
      recommendations.unshift(combinedRecommendation);
    }

    return recommendations;
  };

  // Impact calculation helpers
  const calculateImpact = (solution) => {
    return {
      cost: (1 - solution.parameters.cost) * 100,
      risk: (1 - solution.parameters.risk) * 100,
      return: solution.parameters.return * 100
    };
  };

  const calculateRiskImpact = (metrics) => {
    return {
      var: metrics.var * 100,
      volatility: metrics.volatility * 100,
      sharpeRatio: metrics.sharpeRatio
    };
  };

  const calculateSensitivityImpact = (data) => {
    return {
      maxImpact: Math.max(...data.results.map(r => Math.abs(r.impact))) * 100,
      averageImpact: data.results.reduce((acc, r) => acc + Math.abs(r.impact), 0) / data.results.length * 100
    };
  };

  const calculateCombinedImpact = (recommendations) => {
    const impacts = recommendations.map(r => r.impact);
    return {
      overall: impacts.reduce((acc, impact) => acc + Object.values(impact).reduce((sum, val) => sum + val, 0), 0) / impacts.length
    };
  };

  // Aggregation helpers
  const aggregateChanges = (recommendations) => {
    const allChanges = recommendations.flatMap(r => r.changes);
    const uniqueParams = new Set(allChanges.map(c => c.parameter));
    
    return Array.from(uniqueParams).map(param => {
      const relatedChanges = allChanges.filter(c => c.parameter === param);
      return {
        parameter: param,
        current: relatedChanges[0].current,
        recommended: relatedChanges[0].recommended,
        reason: 'Combined analysis suggests this optimal configuration.'
      };
    });
  };

  const calculateOverallScore = (recommendations) => {
    return recommendations.reduce((acc, r) => acc + (r.metrics.confidence || 0), 0) / recommendations.length;
  };

  const calculateConfidenceLevel = (recommendations) => {
    const avgConfidence = recommendations.reduce((acc, r) => {
      const confidenceScore = r.confidence === CONFIDENCE_LEVELS.HIGH ? 1 :
                             r.confidence === CONFIDENCE_LEVELS.MEDIUM ? 0.6 : 0.3;
      return acc + confidenceScore;
    }, 0) / recommendations.length;

    return avgConfidence > 0.7 ? CONFIDENCE_LEVELS.HIGH :
           avgConfidence > 0.4 ? CONFIDENCE_LEVELS.MEDIUM :
           CONFIDENCE_LEVELS.LOW;
  };

  // Handle recommendation selection
  const handleRecommendationSelect = useCallback((recommendation) => {
    setSelectedRecommendation(recommendation);
  }, []);

  // Apply selected recommendation
  const handleApply = useCallback(() => {
    if (selectedRecommendation) {
      onApply(selectedRecommendation);
    }
  }, [selectedRecommendation, onApply]);

  return (
    <div className="decision-engine">
      <div className="decision-header">
        <h2>Decision Support: {model.name}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="decision-content">
        {isAnalyzing ? (
          <div className="analyzing-indicator">
            <div className="spinner" />
            <span>Analyzing Data & Generating Recommendations...</span>
          </div>
        ) : (
          <div className="recommendations-panel">
            <div className="recommendations-list">
              {recommendations.map((recommendation, index) => (
                <button
                  key={recommendation.type}
                  className={`recommendation-item ${selectedRecommendation === recommendation ? 'active' : ''}`}
                  onClick={() => handleRecommendationSelect(recommendation)}
                >
                  <div className="recommendation-header">
                    <span className="recommendation-type">{recommendation.type}</span>
                    <span className={`confidence-badge ${recommendation.confidence}`}>
                      {recommendation.confidence}
                    </span>
                  </div>
                  <h3>{recommendation.title}</h3>
                  <p>{recommendation.description}</p>
                </button>
              ))}
            </div>

            {selectedRecommendation && (
              <div className="recommendation-details">
                <div className="impact-summary">
                  <h3>Expected Impact</h3>
                  <div className="impact-metrics">
                    {Object.entries(selectedRecommendation.impact).map(([key, value]) => (
                      <div key={key} className="impact-metric">
                        <label>{key}</label>
                        <span>{typeof value === 'number' ? `${value.toFixed(1)}%` : value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="changes-list">
                  <h3>Recommended Changes</h3>
                  {selectedRecommendation.changes.map((change, index) => (
                    <div key={index} className="change-item">
                      <div className="change-header">
                        <h4>{change.parameter}</h4>
                        <div className="change-values">
                          <span className="current-value">Current: {change.current}</span>
                          <span className="arrow">→</span>
                          <span className="recommended-value">Recommended: {change.recommended}</span>
                        </div>
                      </div>
                      <p className="change-reason">{change.reason}</p>
                    </div>
                  ))}
                </div>

                <div className="visualization-panel">
                  <AnalysisChart
                    type="tornado"
                    data={{
                      parameters: selectedRecommendation.changes.map(change => ({
                        name: change.parameter,
                        low: -0.5,
                        high: 0.5
                      }))
                    }}
                    options={{
                      negativeColor: 'rgba(239, 68, 68, 0.2)',
                      positiveColor: 'rgba(34, 197, 94, 0.2)'
                    }}
                  />
                </div>

                <div className="action-panel">
                  <button
                    className="apply-button"
                    onClick={handleApply}
                  >
                    Apply Recommendation
                  </button>
                  <div className="confidence-note">
                    <span className={`confidence-indicator ${selectedRecommendation.confidence}`} />
                    <span>
                      {selectedRecommendation.confidence === CONFIDENCE_LEVELS.HIGH ? 'High confidence based on comprehensive analysis' :
                       selectedRecommendation.confidence === CONFIDENCE_LEVELS.MEDIUM ? 'Medium confidence with some uncertainty' :
                       'Low confidence, consider additional analysis'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DecisionEngine;
