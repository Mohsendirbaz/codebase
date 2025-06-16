# Dependency Mapper Documentation

## Overview

The `dependency_mapper.js` module provides comprehensive dependency analysis for JavaScript/React applications. It maps import/export relationships between modules, identifies circular dependencies, calculates dependency metrics, and generates visualization-ready data structures for understanding module relationships.

## Architecture

### Core Components

1. **Module Registry**
   - Tracks all modules in the codebase
   - Records exports and imports for each module
   - Maintains bidirectional dependency relationships

2. **Dependency Graph**
   - Directed graph structure
   - Forward dependencies (what a module depends on)
   - Reverse dependencies (what depends on a module)

3. **Analysis Engine**
   - Circular dependency detection
   - Bottleneck identification
   - Orphan module detection
   - Dependency metrics calculation

4. **Visualization Generator**
   - Transforms dependency data for graph visualization
   - Calculates node sizes based on importance
   - Prepares link data for rendering

## Main Functions

### `mapDependencies(files)`

Primary function for analyzing module dependencies.

#### Parameters
```javascript
files: Array<{
  path: string,    // Absolute file path
  content: string  // File content
}>
```

#### Returns
```javascript
{
  modules: {
    [path]: {
      path: string,
      exports: Array<{name, type}>,
      imports: Array<{source, resolvedPath, specifiers}>
    }
  },
  dependencies: {
    [path]: Array<string>  // Paths this module depends on
  },
  dependents: {
    [path]: Array<string>  // Paths that depend on this module
  },
  circular: Array<Array<string>>,  // Circular dependency chains
  metrics: {
    mostDependedOn: Array<{module, count}>,
    mostDependencies: Array<{module, count}>,
    orphans: Array<string>,
    bottlenecks: Array<{module, dependentsCount, dependenciesCount, score}>
  }
}
```

### `resolveImportPath(importSource, currentFilePath)`

Resolves relative import paths to absolute paths.

#### Path Resolution Logic
1. **Relative Paths** (`./, ../`)
   - Resolves relative to current file directory
   - Handles parent directory traversal
   - Adds default `.js` extension if missing

2. **Module Paths** (non-relative)
   - Currently returns null (placeholder for module resolution)
   - Would handle node_modules, aliases, etc.

#### Example
```javascript
// Current file: C:\project\src\components\Button.js
resolveImportPath('./styles', 'C:\\project\\src\\components\\Button.js')
// Returns: C:\project\src\components\styles.js

resolveImportPath('../utils/helpers', 'C:\\project\\src\\components\\Button.js')
// Returns: C:\project\src\utils\helpers.js
```

### `generateDependencyGraph(dependencyMap)`

Transforms dependency data into visualization format.

#### Returns
```javascript
{
  nodes: Array<{
    id: string,           // Module path (unique identifier)
    name: string,         // File name
    fullPath: string,     // Complete path
    dependentsCount: number,
    dependenciesCount: number,
    exports: number,      // Export count
    size: number         // Visual size based on importance
  }>,
  links: Array<{
    source: number,      // Source node index
    target: number,      // Target node index
    value: number        // Link weight
  }>
}
```

## Analysis Functions

### `analyzeGraph(dependencyMap)`

Performs comprehensive analysis on the dependency graph.

#### Analysis Steps

1. **Most Depended On Modules**
   - Sorts modules by dependent count
   - Identifies critical shared modules
   - Top 10 modules returned

2. **Most Dependencies**
   - Identifies modules with many imports
   - Potential refactoring candidates
   - Top 10 modules returned

3. **Orphan Detection**
   - Finds modules with no dependents
   - Excludes entry points (index.js, App.js)
   - Candidates for removal or consolidation

4. **Bottleneck Identification**
   - High dependents AND high dependencies
   - Score = dependentsCount × dependenciesCount
   - Threshold: >3 for both metrics

### `findCircularDependencies(dependencyMap)`

Detects circular dependency chains using depth-first search.

#### Algorithm Details
1. **DFS Traversal**
   - Maintains visited set (fully processed)
   - Tracks recursion stack (current path)
   - Detects back edges indicating cycles

2. **Cycle Detection**
   - Identifies when a module is revisited in current path
   - Extracts the circular chain
   - Stores unique cycles only

3. **Deduplication**
   - Sorts cycle nodes for consistent comparison
   - Removes duplicate cycles
   - Orders by cycle length

#### Example Output
```javascript
[
  ['moduleA', 'moduleB', 'moduleA'],  // A → B → A
  ['moduleX', 'moduleY', 'moduleZ', 'moduleX']  // X → Y → Z → X
]
```

## Metrics Explained

### Most Depended On
Modules that many other modules import from. These are:
- Shared utilities
- Common components
- Core services
- Configuration modules

**Implications**: Changes to these modules affect many parts of the application.

### Most Dependencies
Modules that import from many other modules. These might be:
- Application entry points
- Page components
- Complex features
- Integration layers

**Implications**: These modules are complex and might benefit from refactoring.

### Orphans
Modules that no other module imports. Potential cases:
- Dead code
- Entry points (excluded)
- Test files
- Standalone scripts

**Implications**: Candidates for removal or better integration.

### Bottlenecks
Modules that both:
- Are depended on by many modules (>3)
- Depend on many other modules (>3)

**Implications**: 
- Single points of failure
- Complex coupling
- Refactoring opportunities
- Performance bottlenecks

## Usage Patterns

### Basic Dependency Mapping
```javascript
import { mapDependencies } from './utils/dependency_mapper';

const files = [
  { path: '/src/App.js', content: appContent },
  { path: '/src/components/Button.js', content: buttonContent }
];

const dependencies = await mapDependencies(files);

// Access results
console.log('Circular dependencies:', dependencies.circular);
console.log('Most used modules:', dependencies.metrics.mostDependedOn);
```

### Visualization Integration
```javascript
import { generateDependencyGraph } from './utils/dependency_mapper';

const graphData = generateDependencyGraph(dependencies);

// Use with D3.js or other visualization libraries
renderForceDirectedGraph(graphData.nodes, graphData.links);
```

### Architectural Analysis
```javascript
// Find architectural issues
const issues = {
  circular: dependencies.circular.length > 0,
  bottlenecks: dependencies.metrics.bottlenecks.length > 0,
  orphans: dependencies.metrics.orphans.length > 0
};

// Generate report
if (issues.circular) {
  console.warn('Circular dependencies found:', dependencies.circular);
}

// Identify layering violations
const uiDependsOnData = Object.entries(dependencies.dependencies)
  .filter(([path, deps]) => 
    path.includes('/ui/') && 
    deps.some(dep => dep.includes('/data/'))
  );
```

## Integration Points

### Input Requirements
- File path and content pairs
- JavaScript/TypeScript files
- Parseable by `react_parser`

### Output Consumers
- Graph visualization tools
- Architecture analysis tools
- Refactoring assistants
- Build optimization tools
- Documentation generators

### Complementary Modules
- `react_parser.js`: Provides AST parsing
- `component_graph.js`: Visualizes dependency data
- `entity_analyzer.js`: Adds semantic information

## Best Practices

### Module Organization
1. **Minimize Circular Dependencies**
   - Extract shared code to separate modules
   - Use dependency injection patterns
   - Implement clear module boundaries

2. **Reduce Bottlenecks**
   - Split large modules
   - Create focused, single-purpose modules
   - Use facade patterns for complex APIs

3. **Clean Up Orphans**
   - Regular dead code elimination
   - Integrate standalone modules
   - Document entry points clearly

### Dependency Management
1. **Import Organization**
   - Group imports by type
   - Use consistent import paths
   - Avoid deep relative paths

2. **Export Management**
   - Clear, focused exports
   - Avoid circular export chains
   - Use index files judiciously

## Limitations

1. **Static Analysis Only**
   - No dynamic imports
   - No runtime dependency injection
   - No conditional imports

2. **Path Resolution**
   - Basic relative path support
   - No webpack alias support
   - No TypeScript path mapping

3. **Module Types**
   - JavaScript/TypeScript focus
   - No CSS/asset dependencies
   - No external library analysis

## Future Enhancements

1. **Advanced Path Resolution**
   - Webpack alias support
   - TypeScript paths
   - Module resolution algorithms

2. **Dynamic Analysis**
   - Runtime dependency tracking
   - Lazy loading detection
   - Code splitting analysis

3. **Dependency Metrics**
   - Coupling metrics
   - Cohesion analysis
   - Stability metrics

4. **Visualization Enhancements**
   - Layered architecture views
   - Dependency matrices
   - Time-based evolution

5. **Refactoring Support**
   - Automated suggestions
   - Safe move operations
   - Dependency impact analysis