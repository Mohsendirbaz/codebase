/**
 * Hook Analyzer for React applications
 * Analyzes the usage of React hooks across components
 */
import { parseComponent } from './react_parser';

/**
 * Main function to analyze React hooks usage in a codebase
 * @param {Array} files - Array of file objects with path and content
 * @returns {Object} Analysis results containing hook usage patterns
 */
export async function analyzeHooks(files) {
  const hooksAnalysis = {
    usage: {
      // Built-in hooks usage
      useState: [],
      useEffect: [],
      useContext: [],
      useReducer: [],
      useCallback: [],
      useMemo: [],
      useRef: [],
      useImperativeHandle: [],
      useLayoutEffect: [],
      useDebugValue: [],
      useDeferredValue: [],
      useTransition: [],
      useId: [],
      // Custom hooks
      custom: {}
    },
    patterns: {
      // Common patterns
      dataFetching: [],
      formHandling: [],
      animation: [],
      eventListeners: [],
      localStorage: [],
      mediaQueries: [],
      // Anti-patterns
      conditionalHooks: [],
      nestedHooks: [],
      infiniteLoops: []
    },
    metrics: {
      // Usage metrics
      mostUsedHooks: [],
      hooksPerComponent: {},
      complexComponents: []
    },
    dependencies: {
      // Dependency tracking
      missingDependencies: [],
      unnecessaryDependencies: [],
      complexDependencies: []
    }
  };
  
  // Process each file
  for (const file of files) {
    try {
      const parseResult = await parseComponent(file.content, file.path);
      
      // Process hooks in each component
      parseResult.components.forEach(component => {
        if (component.hooks && component.hooks.length > 0) {
          analyzeComponentHooks(component, file.path, hooksAnalysis);
        }
      });
      
      // Process hooks at file level
      if (parseResult.hooks && parseResult.hooks.length > 0) {
        parseResult.hooks.forEach(hook => {
          trackHookUsage(hook, file.path, null, hooksAnalysis);
        });
      }
      
    } catch (error) {
      console.error(`Error analyzing hooks in ${file.path}:`, error);
    }
  }
  
  // Calculate metrics
  calculateHookMetrics(hooksAnalysis);
  
  return hooksAnalysis;
}

/**
 * Analyze hooks used in a specific component
 */
function analyzeComponentHooks(component, filePath, hooksAnalysis) {
  const componentName = component.name;
  
  // Track hooks per component for metrics
  hooksAnalysis.metrics.hooksPerComponent[componentName] = {
    filePath,
    count: component.hooks.length,
    hooks: {}
  };
  
  // Process each hook in the component
  component.hooks.forEach(hook => {
    // Track usage
    trackHookUsage(hook, filePath, componentName, hooksAnalysis);
    
    // Count hook types per component
    if (!hooksAnalysis.metrics.hooksPerComponent[componentName].hooks[hook.name]) {
      hooksAnalysis.metrics.hooksPerComponent[componentName].hooks[hook.name] = 0;
    }
    hooksAnalysis.metrics.hooksPerComponent[componentName].hooks[hook.name]++;
    
    // Analyze hook patterns
    detectHookPatterns(hook, component, filePath, componentName, hooksAnalysis);
    
    // Analyze dependencies for useEffect, useCallback, useMemo
    if (['useEffect', 'useCallback', 'useMemo'].includes(hook.name)) {
      analyzeDependencies(hook, filePath, componentName, hooksAnalysis);
    }
  });
  
  // Check for complex components (many hooks)
  if (component.hooks.length > 7) {
    hooksAnalysis.metrics.complexComponents.push({
      componentName,
      filePath,
      hookCount: component.hooks.length,
      hookTypes: Object.keys(hooksAnalysis.metrics.hooksPerComponent[componentName].hooks)
    });
  }
  
  // Check for anti-patterns
  detectHookAntiPatterns(component, filePath, hooksAnalysis);
}

/**
 * Track usage of a specific hook
 */
function trackHookUsage(hook, filePath, componentName, hooksAnalysis) {
  const hookInfo = {
    filePath,
    componentName,
    args: hook.args,
    location: hook.location
  };
  
  // Check if it's a built-in hook
  const builtInHooks = [
    'useState', 'useEffect', 'useContext', 'useReducer',
    'useCallback', 'useMemo', 'useRef', 'useImperativeHandle',
    'useLayoutEffect', 'useDebugValue', 'useDeferredValue',
    'useTransition', 'useId'
  ];
  
  if (builtInHooks.includes(hook.name)) {
    hooksAnalysis.usage[hook.name].push(hookInfo);
  } else {
    // It's a custom hook
    if (!hooksAnalysis.usage.custom[hook.name]) {
      hooksAnalysis.usage.custom[hook.name] = [];
    }
    hooksAnalysis.usage.custom[hook.name].push(hookInfo);
  }
}

/**
 * Detect common hook usage patterns
 */
function detectHookPatterns(hook, component, filePath, componentName, hooksAnalysis) {
  // Data fetching pattern (useEffect with fetch or axios)
  if (hook.name === 'useEffect') {
    const effectBody = JSON.stringify(hook.args);
    if (effectBody.includes('fetch(') || effectBody.includes('axios.') || effectBody.includes('.then(')) {
      hooksAnalysis.patterns.dataFetching.push({
        componentName,
        filePath,
        location: hook.location
      });
    }
    
    // Event listener pattern
    if (effectBody.includes('addEventListener') || effectBody.includes('removeEventListener')) {
      hooksAnalysis.patterns.eventListeners.push({
        componentName,
        filePath,
        location: hook.location
      });
    }
    
    // LocalStorage pattern
    if (effectBody.includes('localStorage.') || effectBody.includes('sessionStorage.')) {
      hooksAnalysis.patterns.localStorage.push({
        componentName,
        filePath,
        location: hook.location
      });
    }
  }
  
  // Form handling pattern (multiple useState with form field names)
  if (hook.name === 'useState') {
    const stateVarName = hook.args[0]?.name;
    if (stateVarName && (
      stateVarName.includes('form') || 
      stateVarName.includes('input') || 
      stateVarName.includes('value') ||
      stateVarName.includes('field')
    )) {
      // Check if this component has multiple form-related state variables
      const formStateCount = component.hooks.filter(h => 
        h.name === 'useState' && 
        h.args[0]?.name && (
          h.args[0].name.includes('form') || 
          h.args[0].name.includes('input') || 
          h.args[0].name.includes('value') ||
          h.args[0].name.includes('field')
        )
      ).length;
      
      if (formStateCount >= 2) {
        // Only add once per component
        const alreadyAdded = hooksAnalysis.patterns.formHandling.some(
          item => item.componentName === componentName && item.filePath === filePath
        );
        
        if (!alreadyAdded) {
          hooksAnalysis.patterns.formHandling.push({
            componentName,
            filePath,
            stateCount: formStateCount
          });
        }
      }
    }
  }
  
  // Animation pattern (useRef with animation libraries or requestAnimationFrame)
  if (hook.name === 'useRef' || hook.name === 'useEffect') {
    const hookBody = JSON.stringify(hook.args);
    if (
      hookBody.includes('animation') || 
      hookBody.includes('animate') || 
      hookBody.includes('transition') ||
      hookBody.includes('requestAnimationFrame')
    ) {
      hooksAnalysis.patterns.animation.push({
        componentName,
        filePath,
        hookName: hook.name,
        location: hook.location
      });
    }
  }
  
  // Media query pattern (useEffect with matchMedia)
  if (hook.name === 'useEffect') {
    const effectBody = JSON.stringify(hook.args);
    if (effectBody.includes('matchMedia') || effectBody.includes('MediaQuery')) {
      hooksAnalysis.patterns.mediaQueries.push({
        componentName,
        filePath,
        location: hook.location
      });
    }
  }
}

/**
 * Detect hook anti-patterns
 */
function detectHookAntiPatterns(component, filePath, hooksAnalysis) {
  const componentCode = JSON.stringify(component);
  
  // Conditional hooks (simplified detection - would need AST analysis for accuracy)
  if (
    componentCode.includes('if') && 
    componentCode.includes('use') && 
    (componentCode.includes('useState(') || componentCode.includes('useEffect('))
  ) {
    hooksAnalysis.patterns.conditionalHooks.push({
      componentName: component.name,
      filePath,
      suspectedLocation: component.location
    });
  }
  
  // Nested hooks (simplified detection)
  if (
    componentCode.includes('function') && 
    componentCode.includes('use') && 
    (componentCode.includes('useState(') || componentCode.includes('useEffect('))
  ) {
    hooksAnalysis.patterns.nestedHooks.push({
      componentName: component.name,
      filePath,
      suspectedLocation: component.location
    });
  }
  
  // Infinite loops in useEffect (missing dependencies)
  component.hooks.forEach(hook => {
    if (hook.name === 'useEffect') {
      // Check if the effect modifies state but doesn't include that state in dependencies
      const effectBody = JSON.stringify(hook.args);
      const hasSetter = effectBody.includes('set') && /set[A-Z]/.test(effectBody);
      const hasEmptyDeps = hook.args.some(arg => 
        arg.type === 'array' && arg.elements && arg.elements.length === 0
      );
      const hasNoDeps = !hook.args.some(arg => arg.type === 'array');
      
      if (hasSetter && (hasEmptyDeps || hasNoDeps)) {
        hooksAnalysis.patterns.infiniteLoops.push({
          componentName: component.name,
          filePath,
          location: hook.location
        });
      }
    }
  });
}

/**
 * Analyze dependencies in hooks like useEffect, useCallback, useMemo
 */
function analyzeDependencies(hook, filePath, componentName, hooksAnalysis) {
  // Find the dependency array argument
  const depsArg = hook.args.find(arg => arg.type === 'array');
  
  if (!depsArg) {
    // No dependency array provided
    hooksAnalysis.dependencies.missingDependencies.push({
      hookName: hook.name,
      componentName,
      filePath,
      location: hook.location,
      issue: 'No dependency array provided'
    });
    return;
  }
  
  // Get the callback argument
  const callbackArg = hook.args.find(arg => arg.type === 'function');
  
  if (!callbackArg) {
    return; // No callback found
  }
  
  // This is a simplified analysis - a real implementation would need to:
  // 1. Parse the callback function body
  // 2. Extract all variables referenced in the callback
  // 3. Compare with the dependency array
  // 4. Identify missing or unnecessary dependencies
  
  // For now, just check if the dependency array is empty but the callback is complex
  if (depsArg.elements && depsArg.elements.length === 0) {
    // Empty dependency array
    hooksAnalysis.dependencies.missingDependencies.push({
      hookName: hook.name,
      componentName,
      filePath,
      location: hook.location,
      issue: 'Empty dependency array with complex callback'
    });
  } else if (depsArg.elements && depsArg.elements.length > 5) {
    // Too many dependencies
    hooksAnalysis.dependencies.complexDependencies.push({
      hookName: hook.name,
      componentName,
      filePath,
      location: hook.location,
      dependencies: depsArg.elements,
      issue: 'Large number of dependencies may indicate a need to refactor'
    });
  }
}

/**
 * Calculate metrics based on hook usage
 */
function calculateHookMetrics(hooksAnalysis) {
  // Calculate most used hooks
  const hookCounts = {};
  
  // Count built-in hooks
  Object.keys(hooksAnalysis.usage).forEach(hookName => {
    if (hookName !== 'custom') {
      hookCounts[hookName] = hooksAnalysis.usage[hookName].length;
    }
  });
  
  // Count custom hooks
  Object.keys(hooksAnalysis.usage.custom).forEach(hookName => {
    hookCounts[hookName] = hooksAnalysis.usage.custom[hookName].length;
  });
  
  // Sort hooks by usage count
  hooksAnalysis.metrics.mostUsedHooks = Object.entries(hookCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  // Sort complex components by hook count
  hooksAnalysis.metrics.complexComponents.sort((a, b) => b.hookCount - a.hookCount);
}