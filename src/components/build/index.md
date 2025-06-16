# Build Components Index

## Overview
Central export module for all build workflow components. Provides a clean interface for importing build-related UI components throughout the application.

## Exports

### Named Exports
1. **BuildWorkflowPanel**
   - Main build automation panel
   - Sidebar integration component
   - Build, test, deploy functionality

2. **BuildWorkflowIntegrationExample**
   - Integration demonstration
   - Mock file editor example
   - Reference implementation

### Default Export
- Object containing all build components
- Convenience export for bulk imports
- Maintains consistent export pattern

## Usage Patterns

### Individual Import
```javascript
import { BuildWorkflowPanel } from './components/build';
```

### Bulk Import
```javascript
import BuildComponents from './components/build';
const { BuildWorkflowPanel, BuildWorkflowIntegrationExample } = BuildComponents;
```

### Direct Component Import
```javascript
import BuildWorkflowPanel from './components/build/BuildWorkflowPanel';
```

## Module Structure
- Clean separation of concerns
- Centralized export management
- Consistent with project patterns
- Supports tree-shaking optimization