# MatrixInheritanceManager.js - Architectural Summary

## Overview
A class-based manager (123 lines) that handles inheritance relationships between versions in the ModEcon Matrix System. It builds and maintains an inheritance graph to track how parameter values are derived from other versions.

## Core Architecture

### Level 1: Class Purpose
- **Inheritance Management**: Tracks version relationships
- **Graph Building**: Creates inheritance dependency graph
- **Value Propagation**: Manages inherited value calculations
- **Relationship Configuration**: Sets up inheritance rules

### Level 2: Constructor
```javascript
constructor(versions, formMatrix) {
  this.versions = versions      // Version state object
  this.formMatrix = formMatrix  // Form matrix data
  this.inheritanceGraph = ...   // Built inheritance graph
}
```

### Level 3: Inheritance Graph Structure
```javascript
inheritanceGraph = {
  [versionId]: {
    sources: [{
      version: string,      // Source version ID
      percentage: number    // Inheritance percentage
    }],
    targets: [{
      version: string,      // Target version ID  
      percentage: number    // Inheritance percentage
    }]
  }
}
```

### Level 4: Core Methods

#### buildInheritanceGraph()
- Initializes empty graph nodes
- Iterates through form matrix parameters
- Identifies inheritance relationships
- Builds bidirectional connections
- Returns complete graph structure

#### getInheritanceSources(version)
```javascript
Returns: Array<{version, percentage}>
- Lists all sources for a version
- Includes inheritance percentages
- Empty array if no sources
```

#### getInheritanceTargets(version)
```javascript
Returns: Array<{version, percentage}>
- Lists all dependent versions
- Shows impact relationships
- Empty array if no targets
```

#### configureInheritance(paramId, version, sourceVersion, percentage)
```javascript
Parameters:
- paramId: Parameter to configure
- version: Target version
- sourceVersion: Source to inherit from
- percentage: 0-100 inheritance amount

Returns: Updated form matrix
```

### Level 5: Inheritance Rules

#### Percentage System
- 0%: No inheritance (independent)
- 1-99%: Partial inheritance
- 100%: Full inheritance (copy)

#### Graph Properties
- Directed acyclic graph (DAG)
- Multiple inheritance supported
- Circular reference prevention
- Transitive inheritance tracking

### Level 6: Data Flow

#### Inheritance Process
1. Source version has value
2. Target inherits percentage
3. Remaining percentage is independent
4. Final value = inherited + own value

#### Update Propagation
1. Source value changes
2. Find all targets
3. Recalculate inherited values
4. Propagate transitively

### Level 7: Advanced Features

#### Circular Reference Detection
- Graph traversal validation
- Prevents infinite loops
- Error reporting
- Suggested resolutions

#### Inheritance Chains
- Multi-level inheritance
- Transitive calculations
- Performance optimization
- Cache management

## Integration Points

### Form Matrix Integration
- Reads inheritance metadata
- Updates parameter values
- Maintains consistency
- Triggers recalculations

### Version Management
- Syncs with version state
- Handles version deletion
- Updates on version creation
- Maintains graph integrity

## Usage Pattern
```javascript
const manager = new MatrixInheritanceManager(versions, formMatrix);

// Configure inheritance
const updatedMatrix = manager.configureInheritance(
  'param1',
  'v2',
  'v1',
  75  // 75% inheritance
);

// Get relationships
const sources = manager.getInheritanceSources('v2');
const targets = manager.getInheritanceTargets('v1');
```

## Key Features
1. **Bidirectional Tracking**: Both source and target relationships
2. **Flexible Inheritance**: Partial percentage support
3. **Graph Visualization Ready**: Data structure supports UI rendering
4. **Performance**: Efficient graph operations

This manager provides a robust system for handling complex inheritance relationships between versions in the matrix system.