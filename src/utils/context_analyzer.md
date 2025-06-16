# Context Analyzer Documentation

## Overview

The `context_analyzer.js` module provides comprehensive analysis of React Context API usage across a codebase. It identifies context definitions, tracks provider and consumer relationships, detects usage patterns, and calculates metrics to help developers understand their application's context architecture.

## Architecture

### Multi-Phase Analysis

1. **Context Identification Phase**
   - Locates `createContext` imports and calls
   - Identifies context definitions across files
   - Maps context names to their source locations

2. **Usage Analysis Phase**
   - Tracks Context.Provider usage
   - Identifies consumer patterns (useContext, Consumer, contextType)
   - Maps provider-consumer relationships

3. **Pattern Recognition Phase**
   - Categorizes contexts by purpose (theming, auth, state, etc.)
   - Identifies common architectural patterns
   - Detects context hierarchies

4. **Metrics Calculation Phase**
   - Calculates usage statistics
   - Identifies most-used contexts
   - Detects potential bottlenecks

## Core Function

### `analyzeContexts(files)`

Main entry point for analyzing React Context usage.

#### Parameters
- `files` (Array): Array of file objects
  ```javascript
  [
    {
      path: '/src/contexts/ThemeContext.js',
      content: '// file content as string'
    }
  ]
  ```

#### Returns
```javascript
{
  contexts: [],          // All identified contexts
  providers: [],         // Context provider usage
  consumers: {
    useContext: [],      // Components using useContext
    Consumer: [],        // Components using Context.Consumer
    contextType: []      // Class components using contextType
  },
  patterns: {
    globalState: [],     // Contexts for global state
    theming: [],         // Contexts for theming
    localization: [],    // Contexts for i18n
    authentication: [],  // Contexts for auth
    configuration: []    // Contexts for config
  },
  metrics: {
    mostUsedContexts: [],    // Contexts by usage count
    contextHierarchy: {},    // Nested context providers
    contextSize: {}          // Complexity estimates
  }
}
```

## Analysis Functions

### `identifyContexts(parseResult, filePath, contextAnalysis)`

Identifies React Context definitions in a file.

#### Detection Methods
1. **Import Analysis**: Checks for `createContext` imports from 'react'
2. **Pattern Matching**: Searches for `createContext(` calls
3. **Export Mapping**: Links contexts to their export names

#### Captured Information
- Context name
- File path
- Associated component (if any)
- Provider availability
- Consumer availability

### `identifyProviders(parseResult, filePath, contextAnalysis)`

Tracks Context.Provider usage patterns.

#### Provider Detection
1. **JSX Analysis**: Scans JSX for `.Provider` components
2. **Prop Extraction**: Captures provider props
3. **External Context Detection**: Identifies providers for imported contexts

#### Provider Information
```javascript
{
  contextName: 'ThemeContext',
  providerComponent: 'App',
  filePath: '/src/App.js',
  props: ['value', 'children'],
  externalContext: false,
  programmatic: false
}
```

### `identifyConsumers(parseResult, filePath, contextAnalysis)`

Identifies all context consumption patterns.

#### Consumer Types

1. **useContext Hook**
   - Most common in functional components
   - Tracks hook arguments
   - Maps to component usage

2. **Context.Consumer**
   - Render prop pattern
   - JSX-based consumption
   - Legacy but still supported

3. **static contextType**
   - Class component pattern
   - Single context limitation
   - Direct context access

## Pattern Recognition

### `analyzeContextPatterns(contextAnalysis)`

Categorizes contexts based on naming conventions and usage patterns.

#### Pattern Categories

1. **Theming Contexts**
   - Keywords: theme, style, color, dark, light
   - Common props: theme, darkMode, toggleTheme
   - Purpose: UI appearance management

2. **Localization Contexts**
   - Keywords: i18n, local, lang, translate
   - Common props: language, locale, translations
   - Purpose: Multi-language support

3. **Authentication Contexts**
   - Keywords: auth, user, login, session
   - Common props: user, login, logout, isAuthenticated
   - Purpose: User authentication state

4. **Configuration Contexts**
   - Keywords: config, settings, env, feature
   - Common props: config, settings, environment
   - Purpose: Application configuration

5. **Global State Contexts**
   - Keywords: store, state, data, provider
   - Default category for unmatched contexts
   - Purpose: General state management

## Metrics Calculation

### `calculateContextMetrics(contextAnalysis)`

Generates quantitative insights about context usage.

#### Metric Types

1. **Most Used Contexts**
   ```javascript
   [
     { name: 'ThemeContext', count: 45 },
     { name: 'AuthContext', count: 23 },
     { name: 'ConfigContext', count: 12 }
   ]
   ```

2. **Context Hierarchy**
   - Identifies components with multiple providers
   - Suggests nested context relationships
   - Maps potential context dependencies

3. **Context Complexity**
   - Estimates based on provider count
   - Prop complexity analysis
   - Usage spread across components

## Usage Patterns

### Basic Usage
```javascript
import { analyzeContexts } from './utils/context_analyzer';

const files = [
  { path: '/src/App.js', content: fileContent1 },
  { path: '/src/contexts/Theme.js', content: fileContent2 }
];

const analysis = await analyzeContexts(files);

console.log('Total contexts:', analysis.contexts.length);
console.log('Theme contexts:', analysis.patterns.theming);
console.log('Most used:', analysis.metrics.mostUsedContexts[0]);
```

### Advanced Analysis
```javascript
// Find over-used contexts
const overUsed = analysis.metrics.mostUsedContexts
  .filter(ctx => ctx.count > 20);

// Identify provider bottlenecks
const bottlenecks = Object.entries(analysis.metrics.contextHierarchy)
  .filter(([comp, contexts]) => contexts.length > 3);

// Find unused contexts
const unused = analysis.contexts.filter(ctx => 
  !analysis.providers.some(p => p.contextName === ctx.name)
);
```

## Integration Points

### Required Dependencies
- `react_parser.js`: Provides AST parsing capabilities
- File system access for reading component files
- Pattern matching for context identification

### Output Consumers
- Visualization tools (component graphs)
- Code quality metrics
- Architecture documentation generators
- Refactoring tools

## Analysis Insights

### Common Patterns Detected

1. **Provider at Root**
   - App-level providers for global contexts
   - Theme and auth typically at top level
   - Configuration contexts in index files

2. **Feature-Scoped Contexts**
   - Contexts within feature folders
   - Limited scope providers
   - Modular context architecture

3. **Context Composition**
   - Multiple contexts in provider components
   - Nested provider hierarchies
   - Context dependency chains

### Anti-Patterns Identified

1. **Over-Provisioning**
   - Too many contexts in one component
   - Deep nesting of providers
   - Performance implications

2. **Circular Dependencies**
   - Contexts depending on each other
   - Provider-consumer cycles
   - Initialization issues

3. **Context Sprawl**
   - Too many single-use contexts
   - Lack of context consolidation
   - Maintenance overhead

## Limitations

1. **Static Analysis**
   - Cannot detect dynamic context creation
   - Runtime behavior not captured
   - Conditional usage might be missed

2. **Pattern Matching**
   - Relies on naming conventions
   - May misclassify unusually named contexts
   - Custom patterns might not be detected

3. **Accuracy**
   - Simplified AST traversal
   - May miss complex usage patterns
   - External contexts harder to track

## Best Practices Recommendations

1. **Context Organization**
   - Group related contexts
   - Clear naming conventions
   - Documented context purposes

2. **Provider Placement**
   - Minimize provider nesting
   - Place providers at appropriate levels
   - Avoid unnecessary re-renders

3. **Consumer Patterns**
   - Prefer useContext hook
   - Minimize Context.Consumer usage
   - Consider context selectors

## Future Enhancements

1. **Performance Analysis**
   - Context render impact
   - Provider re-render frequency
   - Consumer update patterns

2. **Dependency Graphs**
   - Visual context relationships
   - Provider-consumer mapping
   - Context hierarchy visualization

3. **Refactoring Suggestions**
   - Context consolidation opportunities
   - Provider optimization hints
   - Architecture improvements

4. **Real-time Monitoring**
   - Development-time analysis
   - Context usage tracking
   - Performance warnings