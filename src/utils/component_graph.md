# Component Graph Visualization Documentation

## Overview

The `component_graph.js` module provides a sophisticated D3.js-based visualization system for rendering interactive component dependency graphs. It creates force-directed graph visualizations that help developers understand the relationships and dependencies between components in a React application.

## Architecture

### Multi-Level Structure

1. **Visualization Layer**
   - D3.js force simulation engine
   - SVG-based rendering
   - Interactive zoom and pan capabilities
   - Drag-and-drop node positioning

2. **Data Processing Layer**
   - Graph data transformation
   - Node and link processing
   - Circular dependency detection support

3. **Interaction Layer**
   - Tooltip system
   - Click-based node highlighting
   - Component detail panel
   - Real-time graph updates

## Core Functions

### `renderComponentGraph(container, data, options)`

The main entry point for creating a component dependency graph.

#### Parameters
- `container` (DOM Element): The container element for the visualization
- `data` (Object/Array): Component data in either raw or processed format
- `options` (Object): Configuration options
  - `width` (Number): Graph width (default: 960)
  - `height` (Number): Graph height (default: 700)

#### Returns
An object containing:
- `svg`: The D3 SVG selection
- `simulation`: The force simulation instance
- `update`: Function to update the graph with new data

### `processGraphData(data)`

Transforms raw component data into graph-compatible format.

#### Input Formats
1. **Pre-processed Format**:
   ```javascript
   {
     nodes: [...],
     links: [...]
   }
   ```

2. **Component List Format**:
   ```javascript
   [
     {
       id: 'ComponentName',
       name: 'ComponentName',
       type: 'ui|core|utility|container',
       category: 'data|layout|form|navigation',
       importance: 1-10,
       metadata: {},
       dependencies: [
         { target: 'OtherComponent', type: 'import', value: 1 }
       ]
     }
   ]
   ```

## Visual Elements

### Node Types and Styling

#### Node Types
- **core**: Deep orange (#ff5722) - Core application components
- **ui**: Blue (#2196f3) - User interface components
- **container**: Purple (#9c27b0) - Container components
- **utility**: Green (#4caf50) - Utility components
- **hoc**: Orange (#ff9800) - Higher-order components
- **hook**: Pink (#e91e63) - React hooks
- **context**: Deep purple (#673ab7) - Context providers
- **default**: Blue grey (#607d8b) - Uncategorized components

#### Node Categories
- **data**: Cyan (#00bcd4) - Data handling components
- **layout**: Indigo (#3f51b5) - Layout components
- **form**: Light green (#8bc34a) - Form components
- **navigation**: Amber (#ffc107) - Navigation components
- **visualization**: Teal (#009688) - Visualization components
- **authentication**: Red (#f44336) - Auth components

### Link Types
- **import**: Dark grey (#666666) - Import dependencies
- **parent-child**: Medium grey (#999999) - Parent-child relationships
- **context**: Light grey (#bbbbbb) - Context dependencies
- **data-flow**: Very dark grey (#333333) - Data flow connections
- **event**: Grey (#777777) - Event connections

## Interactive Features

### Force Simulation
- **Link Force**: Maintains connections between nodes (distance: 100)
- **Charge Force**: Prevents node overlap (strength: -300)
- **Center Force**: Centers the graph in the viewport
- **Collision Force**: Prevents node collision (radius: 30)

### User Interactions

#### Drag and Drop
- Nodes can be dragged to reposition
- Fixed positioning during drag
- Released nodes resume force simulation

#### Zoom and Pan
- Scroll to zoom (scale: 0.1 to 4x)
- Click and drag background to pan
- Transform applied to all graph elements

#### Node Interactions
1. **Hover**: Displays tooltip with component details
2. **Click**: 
   - Highlights related nodes and connections
   - Shows detailed component information panel

### Tooltip System

Displays on hover with:
- Component name
- Type and category
- Importance rating
- Custom metadata
- Component description

### Component Details Panel

Click-activated panel showing:
- Full component information
- Metadata details
- File path with navigation link
- Type, category, and importance metrics

## Dynamic Updates

### Update Function
The returned `update` function allows real-time graph updates:

```javascript
const graph = renderComponentGraph(container, initialData);

// Later...
graph.update(newData);
```

#### Update Process
1. Reconciles nodes and links with new data
2. Smoothly transitions existing elements
3. Adds new elements with enter animations
4. Removes obsolete elements with exit animations
5. Maintains force simulation continuity

## Legend System

### Legend Components
- **Node Types**: Visual examples of each node type
- **Link Types**: Visual examples of each connection type
- **Background**: Semi-transparent white background
- **Positioning**: Top-right corner with 200px offset

## Utility Functions

### `getNodeRadius(node)`
Calculates node size based on:
- Base radius: 10px
- Importance factor: `sqrt(importance) * baseRadius`
- Type-specific multipliers:
  - core: 1.5x
  - utility: 0.8x
  - container: 1.2x

### `getNodeColor(node)`
Determines node color with priority:
1. Category color (if specified and not default)
2. Type color (fallback)
3. Default color (blue grey)

### `createTooltipContent(node)`
Generates HTML tooltip content including:
- Title with component name
- Type and category information
- Importance rating
- Metadata key-value pairs
- Description (if available)

### `highlightRelatedNodes(selectedNode, allNodes, allLinks)`
Visual feedback for selected nodes:
- Dims unrelated nodes (opacity: 0.3)
- Highlights selected and connected nodes (opacity: 1)
- Emphasizes related connections
- Increases stroke width for clarity

### `showComponentDetails(node)`
Creates or updates detail panel with:
- Component name and metrics
- Metadata section
- File path with navigation
- Close button functionality

## CSS Requirements

The module expects certain CSS classes:
- `.component-graph`: Main graph container
- `.graph-tooltip`: Tooltip styling
- `.component-details-panel`: Details panel styling
- `.visible`: Show/hide state for panels

## Integration Points

### Data Sources
- Component analysis tools
- Dependency mapping utilities
- AST parsing results
- File system scanners

### Complementary Tools
- `dependency_mapper.js`: Provides dependency data
- `entity_analyzer.js`: Provides component metadata
- `react_parser.js`: Extracts component information

## Performance Considerations

1. **Large Graphs**: Force simulation may slow with 100+ nodes
2. **Updates**: Batch updates for better performance
3. **Rendering**: SVG performance limits at ~1000 elements
4. **Memory**: Cleanup simulation on component unmount

## Usage Example

```javascript
import { renderComponentGraph } from './utils/component_graph';

// Prepare container
const container = document.getElementById('graph-container');

// Prepare data
const componentData = [
  {
    id: 'App',
    name: 'App',
    type: 'core',
    category: 'layout',
    dependencies: [
      { target: 'Header', type: 'import' },
      { target: 'Router', type: 'import' }
    ]
  }
  // ... more components
];

// Render graph
const graph = renderComponentGraph(container, componentData, {
  width: 1200,
  height: 800
});

// Update graph later
graph.update(newComponentData);
```

## Future Enhancement Opportunities

1. **Filtering**: Add node/link filtering capabilities
2. **Layouts**: Alternative layout algorithms (hierarchical, circular)
3. **Export**: SVG/PNG export functionality
4. **Animation**: Smoother transitions and animations
5. **Performance**: WebGL renderer for large graphs
6. **Search**: Find and highlight specific components
7. **Clustering**: Group related components visually