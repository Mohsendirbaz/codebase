# State Flow Analysis

## Overview

- **Total Components**: 40
- **Context Providers**: 0
- **Context Consumers**: 0
- **Stateful Components**: 21
- **Maximum Prop Drilling Depth**: 4

## Prop Drilling Chains

The following chains represent potential prop drilling patterns:

### Chain 1 (Depth: 4)

TabContent → TestingZone → CFAConsolidationUI → IndividualResultsPanel → CustomizableTable

### Chain 2 (Depth: 4)

L_1_HomePageContent → TestingZone → CFAConsolidationUI → IndividualResultsPanel → CustomizableTable

### Chain 3 (Depth: 3)

TestingZone → CFAConsolidationUI → IndividualResultsPanel → CustomizableTable

### Chain 4 (Depth: 3)

TabContent → InputForm → GeneralFormConfig → Popup

### Chain 5 (Depth: 3)

TabContent → TestingZone → CFAConsolidationUI → ProcessingPanel

### Chain 6 (Depth: 3)

TabContent → ModelZone → SensitivityEngine → AnalysisChart

### Chain 7 (Depth: 3)

TabContent → ModelZone → RiskAssessment → AnalysisChart

### Chain 8 (Depth: 3)

TabContent → ModelZone → OptimizationEngine → AnalysisChart

### Chain 9 (Depth: 3)

TabContent → ModelZone → DecisionEngine → AnalysisChart

### Chain 10 (Depth: 3)

TabContent → TestingZone → CFAConsolidationUI → IndividualResultsPanel

*9 additional chains omitted for brevity*

## Stateful Components

The following components manage local state:

- **DecisionEngine**: recommendations, selectedRecommendation, isAnalyzing
- **ModelZone**: activeModel, activeDialog, scenarios, optimizationResults, riskMetrics, sensitivityData
- **TodoList**: items, draggedId, editingId, editText, newItemType
- **Popup**: sliderValues, isSubmitting, submitError, submitSuccess, isClosing
- **ScalingSummary**: itemExpressions, frozenItems, lastUpdated, intermediateResults
- **TabContent**: editableTab
- **ScalingTab**: items, sequentialOperations, tabConfigs, activeExpression, draggedItemId
- **EditableHierarchicalList**: items, draggedId, editingId, editText
- **L_1_HomePageContent**: activeTab, activeSubTab, selectedProperties, selectedVersions, season, S, loadingStates, contentLoaded, iframesLoaded, imagesLoaded, contentLoadingState, version, batchRunning, analysisRunning, csvFiles, subTab, albumImages, selectedAlbum, albumHtmls, selectedHtml, remarks, customizedFeatures, selectedCalculationOption, target_row, calculatedPrices, baseCosts, scalingGroups, collapsedTabs, isToggleSectionOpen, showPopup, popupPosition, F, V
- **TooltipProvider**: isVisible
- **IndividualResultsPanel**: viewingVersion, individualTableData, loadingTable
- **CustomizableImage**: imageState
- **SpatialTransformComponent**: interactionState
- **RiskAssessment**: activeRiskType, riskMetrics, isCalculating, optimizationTarget
- **GeneralFormConfig**: showPopup, popupPosition, selectedItemId, editingLabel, tempLabel
- **SensitivityAnalysis**: visualizationData, isLoading, error
- **SensitivityEngine**: activeSimulation, parameters, results, isCalculating
- **CFAConsolidationUI**: selectionState, processingState, resultsState
- **OptimizationEngine**: activeOptimization, objectiveFunction, solutions, isOptimizing, optimizationParams
- **OverlayController**: isTransitioning, currentContent, nextContent
- **TooltipWithMore**: showMore

## Recommendations

- **Reduce Prop Drilling**: Consider using Context API or state management libraries for deeply nested prop chains.
- **Consolidate State Management**: A high proportion of components have local state. Consider using a more centralized approach.
- **Add Context**: For a project of this size, Context API could simplify state management.

*This report was generated automatically and may require human review.*
