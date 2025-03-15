# State Flow Analysis

## Overview

- **Total Components**: 40
- **Context Providers**: 0
- **Context Consumers**: 0
- **Stateful Components**: 22
- **Maximum Prop Drilling Depth**: 4

## Prop Drilling Chains

The following chains represent potential prop drilling patterns:

### Chain 1 (Depth: 4)

L_1_HomePageContent → TestingZone → CFAConsolidationUI → IndividualResultsPanel → CustomizableTable

### Chain 2 (Depth: 4)

TabContent → TestingZone → CFAConsolidationUI → IndividualResultsPanel → CustomizableTable

### Chain 3 (Depth: 3)

TooltipWithMore → Tooltip → ScalingSummary → Card

### Chain 4 (Depth: 3)

L_1_HomePageContent → TestingZone → CFAConsolidationUI → IndividualResultsPanel

### Chain 5 (Depth: 3)

L_1_HomePageContent → ModelZone → SensitivityEngine → AnalysisChart

### Chain 6 (Depth: 3)

L_1_HomePageContent → ModelZone → RiskAssessment → AnalysisChart

### Chain 7 (Depth: 3)

L_1_HomePageContent → ModelZone → OptimizationEngine → AnalysisChart

### Chain 8 (Depth: 3)

L_1_HomePageContent → ModelZone → DecisionEngine → AnalysisChart

### Chain 9 (Depth: 3)

TestingZone → CFAConsolidationUI → IndividualResultsPanel → CustomizableTable

### Chain 10 (Depth: 3)

TabContent → TestingZone → CFAConsolidationUI → IndividualResultsPanel

*5 additional chains omitted for brevity*

## Stateful Components

The following components manage local state:

- **DecisionEngine**: recommendations, selectedRecommendation, isAnalyzing
- **TodoList**: items, draggedId, editingId, editText, newItemType
- **IndividualResultsPanel**: viewingVersion, individualTableData, loadingTable
- **SensitivityAnalysis**: visualizationData, isLoading, error
- **ScalingSummary**: itemExpressions, frozenItems, lastUpdated, intermediateResults
- **CFAConsolidationUI**: selectionState, processingState, resultsState
- **TooltipWithMore**: showMore
- **ModelZone**: activeModel, activeDialog, scenarios, optimizationResults, riskMetrics, sensitivityData
- **SensitivityEngine**: activeSimulation, parameters, results, isCalculating
- **ScalingTab**: items, sequentialOperations, tabConfigs, activeExpression, draggedItemId
- **SpatialTransformComponent**: interactionState
- **OverlayController**: isTransitioning, currentContent, nextContent
- **CalculationMonitor**: monitorData
- **L_1_HomePageContent**: activeTab, activeSubTab, selectedProperties, season, S, loadingStates, contentLoaded, iframesLoaded, imagesLoaded, contentLoadingState, version, batchRunning, analysisRunning, monitoringActive, csvFiles, subTab, albumImages, selectedAlbum, albumHtmls, selectedHtml, remarks, customizedFeatures, selectedCalculationOption, target_row, calculatedPrices, baseCosts, scalingGroups, collapsedTabs, isToggleSectionOpen, showPopup, popupPosition, F, V
- **OptimizationEngine**: activeOptimization, objectiveFunction, solutions, isOptimizing, optimizationParams
- **EditableHierarchicalList**: items, draggedId, editingId, editText
- **GeneralFormConfig**: showPopup, popupPosition, selectedItemId, editingLabel, tempLabel
- **RiskAssessment**: activeRiskType, riskMetrics, isCalculating, optimizationTarget
- **CustomizableImage**: imageState
- **TabContent**: editableTab
- **TooltipProvider**: isVisible
- **Popup**: sliderValues, isSubmitting, submitError, submitSuccess, isClosing

## Recommendations

- **Reduce Prop Drilling**: Consider using Context API or state management libraries for deeply nested prop chains.
- **Consolidate State Management**: A high proportion of components have local state. Consider using a more centralized approach.
- **Add Context**: For a project of this size, Context API could simplify state management.

*This report was generated automatically and may require human review.*
