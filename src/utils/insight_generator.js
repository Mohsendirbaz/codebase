/**
 * Generate code insights from analysis results
 */
export function generateInsights(analysisData) {
  const insights = {
    keyInsights: [],
    metrics: {},
    patterns: {},
    antiPatterns: {},
    recommendations: []
  };
  
  // Generate key metrics
  insights.metrics = generateMetrics(analysisData);
  
  // Identify common patterns
  insights.patterns = identifyPatterns(analysisData);
  
  // Identify anti-patterns
  insights.antiPatterns = identifyAntiPatterns(analysisData);
  
  // Generate key insights
  insights.keyInsights = [
    ...generateStructuralInsights(analysisData, insights.metrics),
    ...generatePerformanceInsights(analysisData, insights.antiPatterns),
    ...generateMaintainabilityInsights(analysisData)
  ];
  
  // Generate recommendations
  insights.recommendations = generateRecommendations(
    analysisData, 
    insights.antiPatterns,
    insights.metrics
  );
  
  return insights;
}

/**
 * Generate key metrics from analysis data
 */
function generateMetrics(analysisData) {
  // Metrics calculation
  const metrics = {
    totalComponents: 0,
    componentComplexity: {},
    modularity: 0,
    cohesion: 0,
    coupling: 0,
    hooksUsage: {},
  };
  
  // Calculate component metrics
  if (analysisData.components) {
    metrics.totalComponents = Object.values(analysisData.components)
      .reduce((total, components) => total + components.length, 0);
      
    // Calculate average component complexity
    let totalComplexity = 0;
    let componentCount = 0;
    
    Object.values(analysisData.components).forEach(components => {
      components.forEach(component => {
        const complexity = calculateComponentComplexity(component);
        metrics.componentComplexity[component.name] = complexity;
        totalComplexity += complexity;
        componentCount++;
      });
    });
    
    metrics.averageComplexity = componentCount > 0 ? 
      totalComplexity / componentCount : 0;
  }
  
  // Calculate hook usage metrics
  if (analysisData.hooks) {
    const hooksCount = {};
    Object.values(analysisData.hooks).forEach(hooks => {
      hooks.forEach(hook => {
        hooksCount[hook.name] = (hooksCount[hook.name] || 0) + 1;
      });
    });
    metrics.hooksUsage = hooksCount;
  }
  
  // Calculate modularity metrics
  if (analysisData.imports) {
    // Calculate modularity based on import relationships
    const totalFiles = Object.keys(analysisData.imports).length;
    if (totalFiles > 0) {
      let totalImports = 0;
      let uniqueImports = new Set();
      
      Object.values(analysisData.imports).forEach(imports => {
        imports.forEach(imp => {
          totalImports++;
          uniqueImports.add(imp.source);
        });
      });
      
      // Modularity score: ratio of unique imports to total imports
      // Higher ratio means better modularity (less duplication)
      metrics.modularity = uniqueImports.size / (totalImports || 1);
      
      // Calculate coupling (average number of imports per file)
      metrics.coupling = totalImports / totalFiles;
    }
  }
  
  // Calculate cohesion if component methods are available
  if (analysisData.components) {
    let totalCohesion = 0;
    let componentsWithMethods = 0;
    
    Object.values(analysisData.components).forEach(components => {
      components.forEach(component => {
        if (component.methods && component.methods.length > 0) {
          // Simple cohesion metric: ratio of methods that use component state or props
          const methodsUsingStateOrProps = component.methods.filter(method => {
            // This is a simplified check - in a real implementation,
            // we would analyze the method body to see if it uses state or props
            return method.usesState || method.usesProps;
          }).length;
          
          const cohesion = methodsUsingStateOrProps / component.methods.length;
          totalCohesion += cohesion;
          componentsWithMethods++;
        }
      });
    });
    
    metrics.cohesion = componentsWithMethods > 0 ? 
      totalCohesion / componentsWithMethods : 0;
  }
  
  return metrics;
}

/**
 * Calculate component complexity
 */
function calculateComponentComplexity(component) {
  // Component complexity calculation
  let complexity = 0;
  
  // Base complexity based on component type
  complexity += component.type === 'class' ? 2 : 1;
  
  // Add complexity for hooks
  complexity += (component.hooks || []).length * 0.5;
  
  // Add complexity for JSX depth
  if (component.jsxStructure) {
    complexity += calculateJSXDepth(component.jsxStructure) * 0.3;
  }
  
  // Add complexity for state usage
  if (component.type === 'class' && component.state) {
    complexity += Object.keys(component.state).length * 0.5;
  }
  
  return complexity;
}

/**
 * Calculate JSX nesting depth
 */
function calculateJSXDepth(jsxStructure) {
  // If jsxStructure is not an array or is empty, return 0
  if (!Array.isArray(jsxStructure) || jsxStructure.length === 0) {
    return 0;
  }
  
  // Function to recursively calculate depth
  function getDepth(element, currentDepth = 1) {
    // If no children or empty children array, return current depth
    if (!element.children || !Array.isArray(element.children) || element.children.length === 0) {
      return currentDepth;
    }
    
    // Calculate max depth of all children
    const childDepths = element.children.map(child => getDepth(child, currentDepth + 1));
    return Math.max(...childDepths);
  }
  
  // Calculate max depth for all top-level elements
  const depths = jsxStructure.map(element => getDepth(element));
  return Math.max(...depths);
}

/**
 * Identify common patterns in the codebase
 */
function identifyPatterns(analysisData) {
  // Pattern identification
  const patterns = {
    componentComposition: [],
    renderProps: [],
    hocs: [],
    customHooks: [],
    contextUsage: [],
    stateManagement: []
  };
  
  // Identify component composition patterns
  if (analysisData.components) {
    Object.entries(analysisData.components).forEach(([file, components]) => {
      components.forEach(component => {
        // Check for component composition (components rendering other components)
        if (component.jsxStructure) {
          const composedComponents = findComposedComponents(component.jsxStructure);
          if (composedComponents.length > 0) {
            patterns.componentComposition.push({
              component: component.name,
              file,
              composedComponents
            });
          }
        }
      });
    });
  }
  
  // Identify render props pattern
  if (analysisData.propFlows && analysisData.propFlows.renderProps) {
    patterns.renderProps = analysisData.propFlows.renderProps;
  }
  
  // Identify HOCs
  if (analysisData.propFlows && analysisData.propFlows.hocs) {
    patterns.hocs = analysisData.propFlows.hocs;
  }
  
  // Identify custom hooks
  if (analysisData.hooks) {
    const customHookNames = new Set();
    
    Object.entries(analysisData.hooks).forEach(([file, hooks]) => {
      hooks.forEach(hook => {
        // Custom hooks start with "use" and are not built-in React hooks
        if (hook.name.startsWith('use') && 
            !['useState', 'useEffect', 'useContext', 'useReducer', 
              'useCallback', 'useMemo', 'useRef', 'useImperativeHandle', 
              'useLayoutEffect', 'useDebugValue'].includes(hook.name)) {
          customHookNames.add(hook.name);
          patterns.customHooks.push({
            name: hook.name,
            file,
            usedHooks: hook.usedHooks || []
          });
        }
      });
    });
  }
  
  // Identify Context API usage
  if (analysisData.imports) {
    Object.entries(analysisData.imports).forEach(([file, imports]) => {
      imports.forEach(imp => {
        if (imp.specifiers) {
          const hasContextImport = imp.specifiers.some(spec => 
            spec.imported === 'createContext' || spec.imported === 'useContext'
          );
          
          if (hasContextImport) {
            patterns.contextUsage.push({
              file,
              import: imp.source
            });
          }
        }
      });
    });
  }
  
  // Identify state management patterns
  if (analysisData.hooks) {
    Object.entries(analysisData.hooks).forEach(([file, hooks]) => {
      const stateHooks = hooks.filter(hook => 
        hook.name === 'useState' || hook.name === 'useReducer'
      );
      
      if (stateHooks.length > 0) {
        patterns.stateManagement.push({
          file,
          stateHooks: stateHooks.map(hook => ({
            type: hook.name,
            args: hook.args
          }))
        });
      }
    });
  }
  
  return patterns;
}

/**
 * Helper function to find composed components in JSX structure
 */
function findComposedComponents(jsxStructure) {
  if (!Array.isArray(jsxStructure)) {
    return [];
  }
  
  const composedComponents = [];
  
  // Function to recursively find components
  function findComponents(elements) {
    elements.forEach(element => {
      // Components in React start with uppercase letters
      if (element.type && element.type.charAt(0) === element.type.charAt(0).toUpperCase()) {
        composedComponents.push(element.type);
      }
      
      // Recursively check children
      if (element.children && Array.isArray(element.children)) {
        findComponents(element.children);
      }
    });
  }
  
  findComponents(jsxStructure);
  return [...new Set(composedComponents)]; // Remove duplicates
}

/**
 * Identify anti-patterns in the codebase
 */
function identifyAntiPatterns(analysisData) {
  // Anti-pattern detection
  const antiPatterns = {
    propDrilling: [],
    largeComponents: [],
    unnecessaryRerenders: [],
    missingDependencies: [],
    complexStateLogic: [],
    inconsistentPatterns: []
  };
  
  // Detect prop drilling
  if (analysisData.propFlows && analysisData.propFlows.propDrilling) {
    antiPatterns.propDrilling = analysisData.propFlows.propDrilling;
  }
  
  // Detect large components
  if (analysisData.components) {
    Object.entries(analysisData.components).forEach(([file, components]) => {
      components.forEach(component => {
        // Use calculated complexity or line count
        const complexity = calculateComponentComplexity(component);
        if (complexity > 7) {
          antiPatterns.largeComponents.push({
            file,
            component: component.name,
            complexity
          });
        }
      });
    });
  }
  
  // Detect missing dependencies in useEffect
  if (analysisData.hooks) {
    Object.entries(analysisData.hooks).forEach(([file, hooks]) => {
      hooks.forEach(hook => {
        if (hook.name === 'useEffect' || hook.name === 'useCallback' || hook.name === 'useMemo') {
          const missingDeps = detectMissingDependencies(hook);
          if (missingDeps.length > 0) {
            antiPatterns.missingDependencies.push({
              file,
              hook: hook.name,
              location: hook.location,
              missingDependencies: missingDeps
            });
          }
        }
      });
    });
  }
  
  // Detect unnecessary re-renders
  if (analysisData.components) {
    Object.entries(analysisData.components).forEach(([file, components]) => {
      components.forEach(component => {
        // Check for components that might re-render unnecessarily
        const rerenderIssues = detectUnnecessaryRerenders(component);
        if (rerenderIssues.length > 0) {
          antiPatterns.unnecessaryRerenders.push({
            file,
            component: component.name,
            issues: rerenderIssues
          });
        }
      });
    });
  }
  
  // Detect complex state logic
  if (analysisData.hooks) {
    Object.entries(analysisData.hooks).forEach(([file, hooks]) => {
      const stateHooks = hooks.filter(hook => 
        hook.name === 'useState'
      );
      
      // If a component has many state hooks, it might indicate complex state logic
      if (stateHooks.length > 5) {
        antiPatterns.complexStateLogic.push({
          file,
          stateHooksCount: stateHooks.length
        });
      }
    });
  }
  
  // Detect inconsistent patterns
  if (analysisData.components) {
    // Check for inconsistent component types (mix of class and functional components)
    const componentTypes = new Set();
    Object.values(analysisData.components).forEach(components => {
      components.forEach(component => {
        componentTypes.add(component.type);
      });
    });
    
    if (componentTypes.size > 1) {
      antiPatterns.inconsistentPatterns.push({
        type: 'mixedComponentTypes',
        description: 'Codebase uses a mix of class and functional components'
      });
    }
  }
  
  return antiPatterns;
}

/**
 * Helper function to detect missing dependencies in hooks
 */
function detectMissingDependencies(hook) {
  // This is a simplified implementation
  // In a real implementation, we would analyze the hook callback
  // to find variables used inside that are not included in the dependency array
  
  const missingDeps = [];
  
  // Check if the hook has a dependency array
  const depArray = hook.args && hook.args.length > 1 ? hook.args[1] : null;
  
  if (depArray && depArray.type === 'array') {
    // In a real implementation, we would compare variables used in the callback
    // with those listed in the dependency array
    // For now, we'll just check if the dependency array is empty when it shouldn't be
    
    // If the callback uses state or props but the dependency array is empty,
    // that's a potential issue
    const callback = hook.args[0];
    if (callback && callback.type === 'function' && callback.usesStateOrProps && depArray.elements.length === 0) {
      missingDeps.push('Potential missing dependencies in empty dependency array');
    }
  }
  
  return missingDeps;
}

/**
 * Helper function to detect unnecessary re-renders
 */
function detectUnnecessaryRerenders(component) {
  const issues = [];
  
  // Check for inline object/array/function definitions in JSX
  if (component.jsxStructure) {
    // In a real implementation, we would analyze the JSX to find inline definitions
    // For now, we'll just check if there are any props that look like inline definitions
    
    const hasInlineDefinitions = component.jsxStructure.some(element => 
      element.props && element.props.some(prop => 
        prop.value && typeof prop.value === 'object'
      )
    );
    
    if (hasInlineDefinitions) {
      issues.push('Potential inline object/array/function definitions in JSX');
    }
  }
  
  // Check if the component is a function component without React.memo
  if (component.type === 'function' || component.type === 'arrow') {
    const isMemoized = component.wrappers && 
                      component.wrappers.some(wrapper => wrapper === 'memo');
    
    if (!isMemoized) {
      issues.push('Function component not wrapped in React.memo');
    }
  }
  
  return issues;
}

/**
 * Generate structural insights
 */
function generateStructuralInsights(analysisData, metrics) {
  // Structural insights generation
  const insights = [];
  
  // Insight about component structure
  if (metrics.totalComponents > 0) {
    insights.push({
      title: "Component Structure",
      description: `The codebase has ${metrics.totalComponents} components with an average complexity of ${metrics.averageComplexity.toFixed(1)}.`,
      type: "structure"
    });
  }
  
  // Insight about component hierarchy
  if (analysisData.components) {
    const componentTypes = {
      class: 0,
      function: 0,
      arrow: 0
    };
    
    Object.values(analysisData.components).forEach(components => {
      components.forEach(component => {
        if (component.type in componentTypes) {
          componentTypes[component.type]++;
        }
      });
    });
    
    const totalComponents = Object.values(componentTypes).reduce((sum, count) => sum + count, 0);
    
    if (totalComponents > 0) {
      const classPercentage = Math.round((componentTypes.class / totalComponents) * 100);
      const functionPercentage = Math.round(((componentTypes.function + componentTypes.arrow) / totalComponents) * 100);
      
      insights.push({
        title: "Component Types",
        description: `${classPercentage}% of components are class-based and ${functionPercentage}% are function-based.`,
        type: "structure"
      });
    }
  }
  
  // Insight about modularity
  if (metrics.modularity > 0) {
    const modularityRating = metrics.modularity > 0.7 ? "high" : 
                            metrics.modularity > 0.4 ? "moderate" : "low";
    
    insights.push({
      title: "Code Modularity",
      description: `The codebase has ${modularityRating} modularity (${(metrics.modularity * 100).toFixed(0)}%), indicating ${modularityRating === "high" ? "good" : "potential issues with"} code organization and reuse.`,
      type: "structure"
    });
  }
  
  // Insight about component composition
  if (analysisData.components) {
    let compositionCount = 0;
    let deeplyNestedCount = 0;
    
    Object.values(analysisData.components).forEach(components => {
      components.forEach(component => {
        if (component.jsxStructure && component.jsxStructure.length > 0) {
          compositionCount++;
          
          // Check for deeply nested JSX
          const depth = calculateJSXDepth(component.jsxStructure);
          if (depth > 4) {
            deeplyNestedCount++;
          }
        }
      });
    });
    
    if (compositionCount > 0 && metrics.totalComponents > 0) {
      const compositionPercentage = Math.round((compositionCount / metrics.totalComponents) * 100);
      
      insights.push({
        title: "Component Composition",
        description: `${compositionPercentage}% of components use component composition.${deeplyNestedCount > 0 ? ` ${deeplyNestedCount} components have deeply nested JSX (>4 levels).` : ""}`,
        type: "structure"
      });
    }
  }
  
  return insights;
}

/**
 * Generate performance insights
 */
function generatePerformanceInsights(analysisData, antiPatterns) {
  // Performance insights generation
  const insights = [];
  
  // Insight about re-render issues
  if (antiPatterns.unnecessaryRerenders && antiPatterns.unnecessaryRerenders.length > 0) {
    insights.push({
      title: "Render Performance",
      description: `${antiPatterns.unnecessaryRerenders.length} components have potential unnecessary re-render issues.`,
      type: "performance"
    });
  }
  
  // Insight about large components
  if (antiPatterns.largeComponents && antiPatterns.largeComponents.length > 0) {
    insights.push({
      title: "Component Size",
      description: `${antiPatterns.largeComponents.length} components have high complexity which may impact performance.`,
      type: "performance"
    });
  }
  
  // Insight about hooks usage
  if (analysisData.hooks) {
    let effectHooksCount = 0;
    let memoHooksCount = 0;
    
    Object.values(analysisData.hooks).forEach(hooks => {
      hooks.forEach(hook => {
        if (hook.name === 'useEffect' || hook.name === 'useLayoutEffect') {
          effectHooksCount++;
        } else if (hook.name === 'useMemo' || hook.name === 'useCallback') {
          memoHooksCount++;
        }
      });
    });
    
    if (effectHooksCount > 0) {
      insights.push({
        title: "Effect Hooks",
        description: `The codebase uses ${effectHooksCount} effect hooks. ${memoHooksCount > 0 ? `${memoHooksCount} memoization hooks are used to optimize performance.` : "Consider using memoization hooks to optimize performance."}`,
        type: "performance"
      });
    }
  }
  
  // Insight about missing dependencies
  if (antiPatterns.missingDependencies && antiPatterns.missingDependencies.length > 0) {
    insights.push({
      title: "Hook Dependencies",
      description: `${antiPatterns.missingDependencies.length} hooks have potential missing dependencies which may cause stale closures or infinite re-renders.`,
      type: "performance"
    });
  }
  
  return insights;
}

/**
 * Generate maintainability insights
 */
function generateMaintainabilityInsights(analysisData) {
  // Maintainability insights generation
  const insights = [];
  
  // Insight about prop drilling
  if (analysisData.propFlows && analysisData.propFlows.propDrilling && analysisData.propFlows.propDrilling.length > 0) {
    insights.push({
      title: "Prop Drilling",
      description: `${analysisData.propFlows.propDrilling.length} instances of prop drilling were detected, which may make the code harder to maintain.`,
      type: "maintainability"
    });
  }
  
  // Insight about complex state management
  if (analysisData.hooks) {
    let stateHooksCount = 0;
    let reducerHooksCount = 0;
    
    Object.values(analysisData.hooks).forEach(hooks => {
      hooks.forEach(hook => {
        if (hook.name === 'useState') {
          stateHooksCount++;
        } else if (hook.name === 'useReducer') {
          reducerHooksCount++;
        }
      });
    });
    
    if (stateHooksCount > 0 || reducerHooksCount > 0) {
      insights.push({
        title: "State Management",
        description: `The codebase uses ${stateHooksCount} useState and ${reducerHooksCount} useReducer hooks. ${reducerHooksCount > 0 ? "The use of reducers indicates structured state management." : "Consider using useReducer for more complex state logic."}`,
        type: "maintainability"
      });
    }
  }
  
  // Insight about custom hooks
  if (analysisData.hooks) {
    const customHooks = new Set();
    
    Object.values(analysisData.hooks).forEach(hooks => {
      hooks.forEach(hook => {
        if (hook.name.startsWith('use') && 
            !['useState', 'useEffect', 'useContext', 'useReducer', 
              'useCallback', 'useMemo', 'useRef', 'useImperativeHandle', 
              'useLayoutEffect', 'useDebugValue'].includes(hook.name)) {
          customHooks.add(hook.name);
        }
      });
    });
    
    if (customHooks.size > 0) {
      insights.push({
        title: "Custom Hooks",
        description: `The codebase has ${customHooks.size} custom hooks, indicating good logic extraction and reuse.`,
        type: "maintainability"
      });
    }
  }
  
  // Insight about context usage
  if (analysisData.imports) {
    let contextUsageCount = 0;
    
    Object.values(analysisData.imports).forEach(imports => {
      imports.forEach(imp => {
        if (imp.specifiers) {
          const hasContextImport = imp.specifiers.some(spec => 
            spec.imported === 'createContext' || spec.imported === 'useContext'
          );
          
          if (hasContextImport) {
            contextUsageCount++;
          }
        }
      });
    });
    
    if (contextUsageCount > 0) {
      insights.push({
        title: "Context API Usage",
        description: `The codebase uses the Context API in ${contextUsageCount} files, which helps avoid prop drilling and improves maintainability.`,
        type: "maintainability"
      });
    }
  }
  
  return insights;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(analysisData, antiPatterns, metrics) {
  // Generate actionable recommendations based on insights
  const recommendations = [];
  
  // Recommend addressing prop drilling with Context API
  if (antiPatterns.propDrilling && antiPatterns.propDrilling.length > 0) {
    recommendations.push({
      title: "Reduce prop drilling with Context API",
      description: "Several components are passing props through multiple levels. Consider using React Context API for deeply shared state.",
      priority: "High",
      affectedFiles: antiPatterns.propDrilling.slice(0, 3).map(item => item.path[0]),
      type: "refactoring"
    });
  }
  
  // Recommend splitting large components
  if (antiPatterns.largeComponents && antiPatterns.largeComponents.length > 0) {
    antiPatterns.largeComponents.slice(0, 3).forEach(item => {
      recommendations.push({
        title: `Refactor large component: ${item.component}`,
        description: `This component has high complexity (${item.complexity.toFixed(1)}). Consider splitting it into smaller, focused components.`,
        priority: "Medium",
        affectedFiles: [item.file],
        type: "refactoring"
      });
    });
  }
  
  // Recommend fixing missing dependencies
  if (antiPatterns.missingDependencies && antiPatterns.missingDependencies.length > 0) {
    recommendations.push({
      title: "Fix missing dependencies in hooks",
      description: "Several hooks have missing dependencies in their dependency arrays, which can cause bugs and unexpected behavior.",
      priority: "High",
      affectedFiles: antiPatterns.missingDependencies.slice(0, 3).map(item => item.file),
      type: "bug"
    });
  }
  
  // Recommend using React.memo for function components
  if (antiPatterns.unnecessaryRerenders && antiPatterns.unnecessaryRerenders.length > 0) {
    recommendations.push({
      title: "Optimize component rendering",
      description: "Several components may re-render unnecessarily. Consider using React.memo for function components and avoiding inline object/function definitions in JSX.",
      priority: "Medium",
      affectedFiles: antiPatterns.unnecessaryRerenders.slice(0, 3).map(item => item.file),
      type: "performance"
    });
  }
  
  // Recommend using useReducer for complex state
  if (antiPatterns.complexStateLogic && antiPatterns.complexStateLogic.length > 0) {
    recommendations.push({
      title: "Simplify state management",
      description: "Some components have complex state logic with many useState hooks. Consider using useReducer for more structured state management.",
      priority: "Medium",
      affectedFiles: antiPatterns.complexStateLogic.slice(0, 3).map(item => item.file),
      type: "refactoring"
    });
  }
  
  // Recommend consistent component patterns
  if (antiPatterns.inconsistentPatterns && antiPatterns.inconsistentPatterns.some(p => p.type === 'mixedComponentTypes')) {
    recommendations.push({
      title: "Standardize component patterns",
      description: "The codebase uses a mix of class and function components. Consider standardizing on function components with hooks for better maintainability.",
      priority: "Low",
      affectedFiles: [],
      type: "consistency"
    });
  }
  
  return recommendations;
}