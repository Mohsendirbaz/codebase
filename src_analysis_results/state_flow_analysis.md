# State Flow Analysis

## Overview

- **Total Components**: 40
- **Context Providers**: 0
- **Context Consumers**: 0
- **Stateful Components**: 22
- **Maximum Prop Drilling Depth**: 5

## Prop Drilling Chains

The following chains represent potential prop drilling patterns:

### Chain 1 (Depth: 5)

App → TabContent → TestingZone → CFAConsolidationUI → IndividualResultsPanel → CustomizableTable

### Chain 2 (Depth: 5)

Index → App → TabContent → InputForm → GeneralFormConfig → Popup

### Chain 3 (Depth: 5)

Index → App → TabContent → TestingZone → CFAConsolidationUI → IndividualResultsPanel

### Chain 4 (Depth: 5)

Index → App → TabContent → ModelZone → SensitivityEngine → AnalysisChart

### Chain 5 (Depth: 5)

Index → App → TabContent → ModelZone → RiskAssessment → AnalysisChart

### Chain 6 (Depth: 5)

Index → App → TabContent → ModelZone → OptimizationEngine → AnalysisChart

### Chain 7 (Depth: 5)

Index → App → TabContent → ModelZone → DecisionEngine → AnalysisChart

### Chain 8 (Depth: 4)

App → TabContent → InputForm → GeneralFormConfig → Popup

### Chain 9 (Depth: 4)

App → TabContent → TestingZone → CFAConsolidationUI → IndividualResultsPanel

### Chain 10 (Depth: 4)

App → TabContent → ModelZone → SensitivityEngine → AnalysisChart

*62 additional chains omitted for brevity*

## Stateful Components

The following components manage local state:

- **App**: activeTab, activeSubTab, selectedProperties, S, error
- **VersionControl**: localVersion, showHistory
- **ModelZone**: activeModel, activeDialog, scenarios, optimizationResults, riskMetrics, sensitivityData
- **CustomizableImage**: imageState
- **EditableHierarchicalList**: items, draggedId, editingId, editText
- **Tooltip**: isVisible, history, historyIndex, errors, protectedTabs, sequentialOperations, tabConfigs, frozenItems, itemExpressions, scalingGroups, selectedGroup, isExporting
- **ScalingSummary**: itemExpressions, frozenItems, lastUpdated, intermediateResults
- **TooltipWithMore**: showMore
- **TooltipProvider**: isVisible
- **GeneralFormConfig**: showPopup, popupPosition, selectedItemId, editingLabel, tempLabel
- **Popup**: sliderValues, isSubmitting, submitError, submitSuccess, isClosing
- **L_1_HomePageContent**: activeTab, activeSubTab, selectedProperties, selectedVersions, subTab, selectedHtml, selectedAlbum, showPopup, popupPosition, baseCosts, scalingGroups, collapsedTabs, isToggleSectionOpen, calculatedPrices, loadingStates, contentLoaded, contentLoadingState
- **TodoList**: items, draggedId, editingId, editText, newItemType
- **SensitivityAnalysis**: visualizationData, isLoading, error
- **SpatialTransformComponent**: interactionState
- **CFAConsolidationUI**: selectionState, processingState, resultsState
- **IndividualResultsPanel**: viewingVersion, individualTableData, loadingTable
- **DecisionEngine**: recommendations, selectedRecommendation, isAnalyzing
- **SensitivityEngine**: activeSimulation, parameters, results, isCalculating
- **RiskAssessment**: activeRiskType, riskMetrics, isCalculating, optimizationTarget
- **OptimizationEngine**: activeOptimization, objectiveFunction, solutions, isOptimizing, optimizationParams
- **OverlayController**: isTransitioning, currentContent, nextContent

## Recommendations

- **Reduce Prop Drilling**: Consider using Context API or state management libraries for deeply nested prop chains.
- **Consolidate State Management**: A high proportion of components have local state. Consider using a more centralized approach.
- **Add Context**: For a project of this size, Context API could simplify state management.

*This report was generated automatically and may require human review.*
