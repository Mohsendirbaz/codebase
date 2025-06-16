# Refactoring Plan for ONE1 Project

## Overview

This document outlines a comprehensive refactoring plan for the ONE1 project, with the primary goal of capping the maximum file size to 1000 lines. The plan identifies large files, proposes logical separation points, and provides a phased implementation approach to ensure a smooth transition to a more modular codebase.

## Large Files Inventory

Based on analysis of the codebase, the following files exceed or approach the 1000-line limit:

| File | Size (bytes) | Estimated Lines | Priority |
|------|--------------|-----------------|----------|
| Consolidated.js | 152,337 | 3,100+ | Very High |
| HomePage.js | 120,205 | 2,700+ | Very High |
| Consolidated2.js | 103,026 | 2,300+ | Very High |
| ExtendedScaling.js | 72,199 | 1,900+ | High |
| climate-module-enhanced.js | 71,854 | 1,900+ | High |
| Consolidated3.js | 53,290 | 1,400+ | High |
| MatrixStateManager.js | 49,234 | 1,500+ | High |
| multi-zone-selector.js | 41,327 | 1,200+ | Medium |
| unified-tooltip.js | 36,487 | 950+ | Medium |
| process-economics-library.js | 37,023 | 1,000+ | Medium |
| CoordinateFactFinder.js | 32,253 | 900+ | Medium |
| GeneralFormConfig.js | 31,990 | 900+ | Medium |
| ThemeConfigurator.js | 35,056 | 900+ | Medium |
| SensitivityMonitor.js | 32,403 | 900+ | Medium |
| mockDataService.js | 28,232 | 800+ | Low |
| insight_generator.js | 27,338 | 800+ | Low |
| ClimateMapOverlay.js | 25,004 | 700+ | Low |
| CoordinateComponent.js | 24,133 | 700+ | Low |

## Refactoring Strategy

### General Principles

1. **Logical Separation**: Split files based on functional boundaries and component responsibilities
2. **Modular Organization**: Create specialized directories for related components
3. **Backward Compatibility**: Maintain exports to ensure existing code continues to work
4. **Documentation**: Add clear file headers and section comments to improve maintainability

### File-Specific Refactoring Plans

#### 1. Consolidated.js (Very High Priority)

Current Status: ~3,100 lines, multiple unrelated components and services

Refactoring Plan:
1. Extract `MatrixSubmissionService` to `src/services/MatrixSubmissionService.js` ✓
2. Extract `GeneralFormConfig` to `src/components/forms/GeneralFormConfig.js` ✓
3. Extract `MatrixApp` to `src/components/matrix/MatrixApp.js` ✓
4. Extract UI components (Card, CardHeader, CardContent) to `src/components/ui/Card.js`
5. Extract Tooltip component to `src/components/ui/Tooltip.js`
6. Extract CumulativeDocumentation to `src/components/documentation/CumulativeDocumentation.js`
7. Extract DraggableScalingItem to `src/components/scaling/DraggableScalingItem.js`
8. Extract ScalingSummary to a dedicated file (if not already extracted)
9. Update imports and exports to maintain backward compatibility

#### 2. HomePage.js (Very High Priority)

Current Status: ~2,700 lines, main application page with multiple tabs and panels

Refactoring Plan:
1. Extract tab-specific components to separate files:
   - `src/components/tabs/InputTab.js`
   - `src/components/tabs/ResultsTab.js`
   - `src/components/tabs/CodeEntityAnalysisTab.js`
2. Extract sub-tab components:
   - `src/components/subtabs/ProjectConfigTab.js`
   - `src/components/subtabs/LoanConfigTab.js`
   - `src/components/subtabs/RatesConfigTab.js`
   - `src/components/subtabs/ProcessConfigTab.js`
3. Extract utility functions to `src/utils/homePageUtils.js`
4. Create a main HomePage container that imports and composes these components

#### 3. Consolidated2.js (Very High Priority)

Current Status: ~2,300 lines, contains multiple matrix-related components and hooks

Refactoring Plan:
1. Extract custom hooks to `src/hooks/` directory:
   - `src/hooks/useMatrixFormValues.js`
   - `src/hooks/useEfficacyManager.js`
   - `src/hooks/useMatrixHistory.js`
2. Extract manager classes to `src/managers/` directory:
   - `src/managers/VersionZoneManager.js`
   - `src/managers/MatrixInheritanceManager.js`
   - `src/managers/MatrixScalingManager.js`
3. Extract editor components to `src/components/editors/` directory:
   - `src/components/editors/MatrixValueEditor.js`
   - `src/components/editors/EfficacyPeriodEditor.js`
4. Extract service classes to `src/services/` directory:
   - `src/services/MatrixSyncService.js`
   - `src/services/MatrixValidator.js`

#### 4. ExtendedScaling.js (High Priority)

Current Status: ~1,900 lines, complex scaling component with multiple sub-components

Refactoring Plan:
1. Extract utility functions to `src/components/truly_extended_scaling/utils/scalingUtils.js`
2. Extract sub-components:
   - `src/components/truly_extended_scaling/ScalingOperations.js`
   - `src/components/truly_extended_scaling/ScalingHistory.js`
   - `src/components/truly_extended_scaling/ScalingGroups.js`
   - `src/components/truly_extended_scaling/ScalingItems.js`
3. Extract state management logic to `src/components/truly_extended_scaling/hooks/useScalingState.js`
4. Create a main ExtendedScaling container that imports and composes these components

#### 5. MatrixStateManager.js (High Priority)

Current Status: ~1,500 lines, state management for matrix application

Refactoring Plan:
1. Split into logical modules:
   - `src/state/matrixReducer.js`
   - `src/state/matrixActions.js`
   - `src/state/matrixSelectors.js`
   - `src/state/matrixContext.js`
   - `src/state/matrixHooks.js`
2. Extract API-related functions to `src/api/matrixApi.js`
3. Extract utility functions to `src/utils/matrixUtils.js`

## Implementation Phases

### Phase 1: High-Priority Files (Weeks 1-2)

1. Refactor Consolidated.js (already started)
   - Complete extraction of remaining components
   - Update imports and exports

2. Refactor HomePage.js
   - Extract tab components
   - Extract sub-tab components
   - Create main container

3. Refactor Consolidated2.js
   - Extract hooks and managers
   - Extract editor components
   - Extract services

### Phase 2: Medium-Priority Files (Weeks 3-4)

1. Refactor ExtendedScaling.js
   - Extract sub-components
   - Extract utility functions
   - Create main container

2. Refactor MatrixStateManager.js
   - Split into logical modules
   - Extract API functions
   - Extract utility functions

3. Refactor climate-module-enhanced.js
   - Extract sub-components
   - Extract utility functions
   - Create main container

### Phase 3: Lower-Priority Files (Weeks 5-6)

1. Refactor remaining files:
   - multi-zone-selector.js
   - unified-tooltip.js
   - process-economics-library.js
   - CoordinateFactFinder.js
   - GeneralFormConfig.js
   - ThemeConfigurator.js
   - SensitivityMonitor.js

2. Update documentation and tests

## Testing Strategy

1. After each file refactoring:
   - Run unit tests for affected components
   - Verify functionality in the application
   - Check for regressions

2. Create new tests for extracted components

## Documentation Guidelines

1. Add file headers to all new files:
```javascript
/**
 * @file ComponentName.js
 * @description Brief description of the component's purpose
 * @module path/to/module
 * @requires list of dependencies
 */
```

2. Add section comments for complex logic:
```javascript
// === SECTION NAME ===
// Description of what this section does
```

3. Update README.md with new directory structure and component relationships

## Future Maintenance Guidelines

1. Enforce the 1000-line limit for all new files
2. Use code reviews to ensure new code follows modular patterns
3. Regularly audit file sizes as part of the development process
4. Consider implementing automated checks for file size in the CI pipeline