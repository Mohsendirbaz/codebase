import React, { useState, useCallback } from 'react';
import './neumorphic-modelzone.css';
import ModelCard from './ModelCard';
import FilterPopup from './FilterPopup';
import EnhancedInheritanceControl from './EnhancedInheritanceControl';
import ImpactAnalysis from './ImpactAnalysis';
import SensitivityEngine from './SensitivityEngine';
import RiskAssessment from './RiskAssessment';
import OptimizationEngine from './OptimizationEngine';
import DecisionEngine from './DecisionEngine';
import OverlayController from './OverlayController';
import AnalysisVisualizationIntegration from './AnalysisVisualizationIntegration';
import { useVersionState } from '../../contexts/VersionStateContext';
import useFormValues from '../../useFormValues';

// Dialog layer types
const DIALOG_LAYERS = {
  NONE: 'none',
  FILTER: 'filter',
  IMPACT: 'impact',
  SCENARIO: 'scenario',
  SENSITIVITY: 'sensitivity',
  RISK: 'risk',
  OPTIMIZATION: 'optimization',
  DECISION: 'decision'
};

const ModelZone = () => {
  const { version } = useVersionState();
  const [activeModel, setActiveModel] = useState(null);
  const [activeDialog, setActiveDialog] = useState(DIALOG_LAYERS.NONE);
  const [scenarios, setScenarios] = useState([]);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [sensitivityData, setSensitivityData] = useState(null);
  
  // Enhanced model settings with inheritance and calculation data
  const modelSettings = [
    {
      id: 'base',
      name: 'Base Model',
      description: 'Foundation configuration',
      type: 'base',
      filters: {
        cost: false,
        time: false,
        process: false
      },
      departure: 0,
      priority: 'high'
    },
    {
      id: 'variant1',
      name: 'Core Cost',
      description: 'Cost-focused variant',
      type: 'variant1',
      filters: {
        cost: true,
        time: false,
        process: false
      },
      departure: 20,
      priority: 'medium'
    },
    {
      id: 'variant2',
      name: 'Brand Cost',
      description: 'Brand-specific variant',
      type: 'variant2',
      filters: {
        cost: true,
        time: true,
        process: true
      },
      departure: 15,
      priority: 'low'
    }
  ];

  // Enhanced handlers
  const handleModelClick = useCallback((modelId) => {
    setActiveModel(modelId);
    setActiveDialog(DIALOG_LAYERS.FILTER);
  }, []);

  const handleViewImpact = useCallback((modelId) => {
    setActiveModel(modelId);
    setActiveDialog(DIALOG_LAYERS.IMPACT);
  }, []);

  const handleSensitivityAnalysis = useCallback(async (modelId) => {
    setActiveModel(modelId);
    setActiveDialog(DIALOG_LAYERS.SENSITIVITY);
    
    // Prepare sensitivity data with efficacy metrics for SensitivityEngine
    const model = modelSettings.find(m => m.id === modelId);
    if (!model) return;
    
    try {
      // Load utility functions dynamically to avoid circular dependencies
      const { loadSensitivityData, calculateEfficacyMetrics } = await import('./utils/dataProcessing');
      
      // Load sensitivity data
      const sensitivityData = await loadSensitivityData(model);
      
      // Prepare data for SensitivityEngine
      // (Efficacy metrics will be calculated in the ModelCard via the custom event)
      setSensitivityData({
        parameters: sensitivityData.parameters,
        derivatives: sensitivityData.derivatives,
        efficacyReady: true
      });
    } catch (error) {
      console.error('Error loading sensitivity data:', error);
    }
  }, [modelSettings]);

  const handleRiskAssessment = useCallback((modelId) => {
    setActiveModel(modelId);
    setActiveDialog(DIALOG_LAYERS.RISK);
  }, []);

  const handleOptimization = useCallback((modelId) => {
    setActiveModel(modelId);
    setActiveDialog(DIALOG_LAYERS.OPTIMIZATION);
  }, []);

  const handleDecisionSupport = useCallback((modelId) => {
    setActiveModel(modelId);
    setActiveDialog(DIALOG_LAYERS.DECISION);
  }, []);

  const handleFilterUpdate = useCallback((modelId, updates) => {
    setScenarios(prev => {
      const modelIndex = modelSettings.findIndex(m => m.id === modelId);
      if (modelIndex === -1) return prev;

      const newScenario = {
        id: `${modelId}-${Date.now()}`,
        modelId,
        filters: updates.filters,
        departure: updates.departure,
        priority: updates.priority,
        timestamp: Date.now()
      };

      return [...prev, newScenario];
    });
    setActiveDialog(DIALOG_LAYERS.NONE);
  }, [modelSettings]);

  const handleDialogClose = useCallback(() => {
    setActiveDialog(DIALOG_LAYERS.NONE);
  }, []);

  // Get active model data
  const activeModelData = activeModel 
    ? modelSettings.find(m => m.id === activeModel)
    : null;

  // Get form values and property mapping from the useFormValues hook
  const { formValues, propertyMapping } = useFormValues();

  // Get overlay content based on active dialog
  const getOverlayContent = () => {
    if (!activeModelData) return null;

    const content = (() => {
      switch (activeDialog) {
        case DIALOG_LAYERS.FILTER:
          return (
            <FilterPopup
              modelType={activeModelData.type}
              settings={activeModelData}
              onClose={handleDialogClose}
              onUpdate={(updates) => handleFilterUpdate(activeModel, updates)}
            />
          );
        case DIALOG_LAYERS.IMPACT:
          return (
            <ImpactAnalysis
              model={activeModelData}
              baseModel={modelSettings.find(m => m.id === 'base')}
              onClose={handleDialogClose}
            />
          );
        case DIALOG_LAYERS.SENSITIVITY:
          return (
            <SensitivityEngine
              model={activeModelData}
              baseModel={modelSettings.find(m => m.id === 'base')}
              onUpdate={(updates) => {
                handleFilterUpdate(activeModel, updates);
                setSensitivityData(updates.results);
              }}
              onClose={handleDialogClose}
            />
          );
        case DIALOG_LAYERS.RISK:
          return (
            <RiskAssessment
              model={activeModelData}
              baseModel={modelSettings.find(m => m.id === 'base')}
              scenarios={scenarios}
              onUpdate={(updates) => {
                handleFilterUpdate(activeModel, updates);
                setRiskMetrics(updates.metrics);
              }}
              onClose={handleDialogClose}
            />
          );
        case DIALOG_LAYERS.OPTIMIZATION:
          return (
            <OptimizationEngine
              model={activeModelData}
              baseModel={modelSettings.find(m => m.id === 'base')}
              scenarios={scenarios}
              constraints={{
                maxCost: 1000000,
                maxRisk: 0.2,
                minReturn: 0.1
              }}
              onUpdate={(updates) => {
                handleFilterUpdate(activeModel, updates);
                setOptimizationResults(updates.results);
              }}
              onClose={handleDialogClose}
            />
          );
        case DIALOG_LAYERS.DECISION:
          return (
            <DecisionEngine
              model={activeModelData}
              baseModel={modelSettings.find(m => m.id === 'base')}
              scenarios={scenarios}
              optimizationResults={optimizationResults}
              riskMetrics={riskMetrics}
              sensitivityData={sensitivityData}
              onApply={(recommendation) => {
                handleFilterUpdate(activeModel, recommendation.changes);
              }}
              onClose={handleDialogClose}
            />
          );
        default:
          return null;
      }
    })();

    // Wrap content with AnalysisVisualizationIntegration for analysis-related dialogs
    const needsIntegration = [
      DIALOG_LAYERS.SENSITIVITY,
      DIALOG_LAYERS.RISK,
      DIALOG_LAYERS.OPTIMIZATION,
      DIALOG_LAYERS.DECISION
    ].includes(activeDialog);

    return needsIntegration ? (
      <AnalysisVisualizationIntegration
        onAnalysisUpdate={(analysisState) => {
          // Handle analysis state updates
          if (analysisState.results.current.size > 0) {
            const latestResult = Array.from(analysisState.results.current.values())[0];
            switch (activeDialog) {
              case DIALOG_LAYERS.SENSITIVITY:
                setSensitivityData(latestResult);
                break;
              case DIALOG_LAYERS.RISK:
                setRiskMetrics(latestResult);
                break;
              case DIALOG_LAYERS.OPTIMIZATION:
                setOptimizationResults(latestResult);
                break;
            }
          }
        }}
        onVisualizationUpdate={(visualizationState) => {
          // Handle visualization state updates
          // This could be used to persist visualization preferences
          console.log('Visualization state updated:', visualizationState);
        }}
      >
        {content}
      </AnalysisVisualizationIntegration>
    ) : content;
  };

  return (
    <div className="model-zone" data-active-dialog={activeDialog}>
      <div className="model-cards">
        {modelSettings.map((model) => (
          <ModelCard
            key={model.id}
            type={model.type}
            settings={model}
            isActive={activeModel === model.id}
            onClick={() => handleModelClick(model.id)}
            onViewImpact={() => handleViewImpact(model.id)}
            onSensitivityAnalysis={() => handleSensitivityAnalysis(model.id)}
            onRiskAssessment={() => handleRiskAssessment(model.id)}
            onOptimization={() => handleOptimization(model.id)}
            onDecisionSupport={() => handleDecisionSupport(model.id)}
            baseSettings={model.type !== 'base' ? modelSettings.find(m => m.id === 'base') : null}
          />
        ))}
      </div>

      {/* Overlay System */}
      {activeDialog !== DIALOG_LAYERS.NONE && activeModelData && (
        <OverlayController
          activeModel={activeModel}
          activeOverlay={activeDialog}
          onNavigate={(overlay) => setActiveDialog(overlay)}
          onClose={handleDialogClose}
        >
          {getOverlayContent()}
        </OverlayController>
      )}

      {/* Enhanced Inheritance Visualization */}
      <div className="inheritance-visualization">
        <EnhancedInheritanceControl
          models={modelSettings}
          onUpdate={handleFilterUpdate}
          propertyMapping={propertyMapping}
          formValues={formValues}
        />
      </div>

      {/* Scenario Comparison Panel */}
      {scenarios.length > 0 && (
        <div className="scenario-panel">
          <h3>Saved Scenarios</h3>
          <div className="scenario-list">
            {scenarios.map(scenario => (
              <div 
                key={scenario.id} 
                className="scenario-item"
                onClick={() => {
                  setActiveModel(scenario.modelId);
                  setActiveDialog(DIALOG_LAYERS.IMPACT);
                }}
              >
                <span>{modelSettings.find(m => m.id === scenario.modelId)?.name}</span>
                <span>{new Date(scenario.timestamp).toLocaleString()}</span>
                <button 
                  className="view-impact-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModel(scenario.modelId);
                    setActiveDialog(DIALOG_LAYERS.IMPACT);
                  }}
                >
                  View Impact
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelZone;
