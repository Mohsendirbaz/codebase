# Entity Analyzer Documentation

## Overview

The `entity_analyzer.js` module provides comprehensive analysis of React entities within a codebase. It identifies, categorizes, and analyzes React components, hooks, contexts, higher-order components (HOCs), providers, and consumers, providing insights into the application's React architecture.

## Architecture

### Entity Categories

1. **Components**
   - Class components
   - Function components
   - Memoized components (React.memo)
   - ForwardRef components

2. **Hooks**
   - Built-in React hooks
   - Custom application hooks

3. **Context API**
   - Context definitions
   - Context providers
   - Context consumers

4. **Advanced Patterns**
   - Higher-Order Components (HOCs)
   - Render prop patterns
   - Component composition patterns

## Main Function

### `analyzeEntities(files)`

Primary function for analyzing React entities across a codebase.

#### Parameters
```javascript
files: Array<{
  path: string,    // File path
  content: string  // File content
}>
```

#### Returns
```javascript
{
  components: {
    class: Array<ClassComponentInfo>,
    function: Array<FunctionComponentInfo>,
    memo: Array<MemoComponentInfo>,
    forwardRef: Array<ForwardRefComponentInfo>
  },
  hooks: {
    built_in: Array<HookInfo>,
    custom: Array<HookInfo>
  },
  contexts: Array<ContextInfo>,
  hocs: Array<HOCInfo>,
  providers: Array<ProviderInfo>,
  consumers: Array<ConsumerInfo>
}
```

## Entity Information Structures

### Component Information
```javascript
{
  name: string,           // Component name
  filePath: string,       // Source file path
  type: string,           // 'class' | 'function' | 'arrow'
  props: Array<string>,   // Prop names
  hooks: Array<Object>,   // Hooks used (function components)
  methods: Array<string>, // Methods (class components)
  state: Object          // State structure (class components)
}
```

### Hook Information
```javascript
{
  name: string,          // Hook name
  filePath: string,      // Source file
  args: Array<Object>,   // Hook arguments
  location: Object       // Location in file
}
```

### Context Information
```javascript
{
  name: string,         // Context name
  filePath: string,     // Definition file
  componentName: string // Associated component (if any)
}
```

### Provider/Consumer Information
```javascript
{
  name: string,           // Provider/Consumer name
  componentName: string,  // Component using it
  filePath: string        // Source file
}
```

## Analysis Functions

### `categorizeComponent(component, filePath, entities)`

Categorizes components based on their implementation patterns.

#### Classification Logic

1. **Class Components**
   - Extends React.Component or React.PureComponent
   - Has lifecycle methods
   - Uses `this.state` and `this.props`

2. **Function Components**
   - Regular functions returning JSX
   - Arrow functions returning JSX
   - May use hooks

3. **Memo Components**
   - Wrapped with React.memo
   - Performance optimized components
   - Shallow prop comparison

4. **ForwardRef Components**
   - Created with React.forwardRef
   - Ref forwarding capability
   - Often used in component libraries

### `categorizeHook(hook, filePath, entities)`

Classifies hooks as built-in or custom.

#### Built-in React Hooks
- `useState` - State management
- `useEffect` - Side effects
- `useContext` - Context consumption
- `useReducer` - Complex state logic
- `useCallback` - Callback memoization
- `useMemo` - Value memoization
- `useRef` - Mutable references
- `useImperativeHandle` - Imperative API
- `useLayoutEffect` - Synchronous effects
- `useDebugValue` - DevTools integration
- `useDeferredValue` - Concurrent features
- `useTransition` - Concurrent features
- `useId` - Unique IDs

#### Custom Hooks
- Start with "use" prefix
- Compose built-in hooks
- Encapsulate reusable logic

### `identifyAdvancedPatterns(parseResult, filePath, entities)`

Identifies advanced React patterns and architectural elements.

#### Pattern Detection

1. **Context Creation**
   - Searches for `createContext` imports
   - Identifies context definitions
   - Maps to exporting components

2. **Higher-Order Components**
   - Naming convention: starts with "with"
   - Returns enhanced components
   - Common patterns: withAuth, withTheme

3. **Provider Pattern**
   - Components ending with ".Provider"
   - Context value providers
   - State management roots

4. **Consumer Pattern**
   - Components ending with ".Consumer"
   - Render prop pattern
   - Context value consumption

## Usage Patterns

### Basic Analysis
```javascript
import { analyzeEntities } from './utils/entity_analyzer';

const files = [
  { path: '/src/App.js', content: appContent },
  { path: '/src/components/Button.js', content: buttonContent }
];

const entities = await analyzeEntities(files);

console.log(`Found ${entities.components.function.length} function components`);
console.log(`Found ${entities.hooks.custom.length} custom hooks`);
```

### Component Statistics
```javascript
// Calculate component distribution
const stats = {
  totalComponents: 
    entities.components.class.length +
    entities.components.function.length +
    entities.components.memo.length +
    entities.components.forwardRef.length,
  
  classVsFunctional: {
    class: entities.components.class.length,
    functional: 
      entities.components.function.length +
      entities.components.memo.length +
      entities.components.forwardRef.length
  },
  
  hooksUsage: {
    components: entities.components.function
      .filter(c => c.hooks.length > 0).length,
    totalHooks: entities.hooks.built_in.length + 
                entities.hooks.custom.length
  }
};
```

### Architecture Analysis
```javascript
// Find components using specific hooks
const componentsUsingState = entities.components.function
  .filter(comp => 
    comp.hooks.some(hook => hook.name === 'useState')
  );

// Find all context providers
const contextArchitecture = {
  contexts: entities.contexts,
  providers: entities.providers,
  consumers: entities.consumers
};

// Identify HOC usage
const enhancedComponents = entities.hocs.map(hoc => ({
  hoc: hoc.name,
  usage: findHOCUsage(hoc.name, entities.components)
}));
```

## Integration Points

### Dependencies
- `react_parser.js` - AST parsing and component analysis
- React codebase - Requires React components to analyze

### Output Consumers
- Documentation generators
- Architecture visualizers
- Code quality metrics
- Refactoring tools
- Component catalogs

### Complementary Tools
- `context_analyzer.js` - Deeper context analysis
- `dependency_mapper.js` - Import relationships
- `hook_analyzer.js` - Detailed hook analysis

## Advanced Features

### Relationship Identification
The `identifyRelationships` function (placeholder) would establish:
- Component-to-hook mappings
- HOC-to-component relationships
- Provider-consumer chains
- Component hierarchies

### Pattern Recognition

1. **Naming Conventions**
   - HOCs: `with*` prefix
   - Hooks: `use*` prefix
   - Contexts: `*Context` suffix
   - Providers: `*Provider` suffix

2. **Structural Patterns**
   - Render props
   - Compound components
   - Controlled components
   - Container/Presenter pattern

## Best Practices Insights

### Component Organization
1. **Consistent Typing**
   - Prefer function components for new code
   - Use TypeScript for prop validation
   - Implement proper component interfaces

2. **Hook Usage**
   - Extract custom hooks for reuse
   - Follow rules of hooks
   - Optimize with useCallback/useMemo

3. **Context Architecture**
   - Minimize context nesting
   - Split contexts by concern
   - Use context selectively

### Code Quality Indicators

1. **Positive Indicators**
   - High custom hook usage (reusability)
   - Balanced component types
   - Clear HOC naming

2. **Warning Signs**
   - Too many class components (legacy)
   - No custom hooks (missed reusability)
   - Excessive HOC nesting

## Limitations

1. **Static Analysis**
   - No runtime component creation
   - Dynamic imports not tracked
   - Conditional rendering missed

2. **Pattern Detection**
   - Relies on naming conventions
   - May miss unconventional patterns
   - Limited AST traversal

3. **Accuracy**
   - Simplified component detection
   - Basic hook identification
   - May miss complex patterns

## Future Enhancements

1. **Deep AST Analysis**
   - Full AST traversal
   - Accurate pattern detection
   - Runtime behavior inference

2. **Performance Metrics**
   - Component render frequency
   - Hook execution patterns
   - Re-render analysis

3. **Relationship Mapping**
   - Component dependency graphs
   - Hook flow visualization
   - Context consumption trees

4. **Quality Metrics**
   - Component complexity scores
   - Hook optimization opportunities
   - Architecture health indicators

5. **Refactoring Support**
   - Class to function migration
   - Hook extraction suggestions
   - Context optimization

## Example Output
```javascript
{
  components: {
    class: [
      {
        name: "LegacyDashboard",
        filePath: "/src/components/Dashboard.js",
        type: "class",
        props: ["user", "data"],
        methods: ["componentDidMount", "handleClick"],
        state: { loading: false, data: null }
      }
    ],
    function: [
      {
        name: "Button",
        filePath: "/src/components/Button.js",
        type: "function",
        props: ["onClick", "children", "variant"],
        hooks: [
          { name: "useState", args: [false] },
          { name: "useTheme", args: [] }
        ]
      }
    ]
  },
  hooks: {
    built_in: [
      {
        name: "useState",
        filePath: "/src/components/Button.js",
        args: [false],
        location: { line: 5, column: 10 }
      }
    ],
    custom: [
      {
        name: "useTheme",
        filePath: "/src/hooks/useTheme.js",
        args: [],
        location: { line: 3, column: 8 }
      }
    ]
  }
}
```