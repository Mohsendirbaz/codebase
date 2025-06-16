# Editors Components Index

## Overview
Central export module for all editor components. Provides a unified interface for importing specialized editing interfaces used throughout the application.

## Module Structure

### Current Exports
- **MatrixValueEditor**: Editor for matrix parameter values

### Export Pattern
- Named exports for clarity
- Default re-exports from components
- Consistent module interface

## Usage

### Import Example
```javascript
import { MatrixValueEditor } from './components/editors';
```

### Component Access
```javascript
const editors = require('./components/editors');
const { MatrixValueEditor } = editors;
```

## Module Information
- **Location**: components/editors
- **Type**: Index aggregator
- **Pattern**: Re-export module

## Future Expansion
- Additional specialized editors
- Inline editing components
- Rich text editors
- Code editors
- Formula editors