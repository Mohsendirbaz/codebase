/**
 * Entity Analyzer for React applications
 * Identifies and categorizes React entities in the codebase
 */
import { parseComponent } from './react_parser';

/**
 * Main function to analyze React entities in a codebase
 * @param {Array} files - Array of file objects with path and content
 * @returns {Object} Analysis results containing all identified entities
 */
export async function analyzeEntities(files) {
  const entities = {
    components: {
      class: [],
      function: [],
      memo: [],
      forwardRef: []
    },
    hooks: {
      built_in: [],
      custom: []
    },
    contexts: [],
    hocs: [],
    providers: [],
    consumers: []
  };

  // Process each file
  for (const file of files) {
    try {
      const parseResult = await parseComponent(file.content, file.path);
      
      // Process components
      parseResult.components.forEach(component => {
        categorizeComponent(component, file.path, entities);
      });
      
      // Process hooks
      parseResult.hooks.forEach(hook => {
        categorizeHook(hook, file.path, entities);
      });
      
      // Process imports and exports to identify contexts, HOCs, etc.
      identifyAdvancedPatterns(parseResult, file.path, entities);
      
    } catch (error) {
      console.error(`Error analyzing ${file.path}:`, error);
    }
  }
  
  // Post-process to identify relationships
  identifyRelationships(entities);
  
  return entities;
}

/**
 * Categorize a component based on its type and features
 */
function categorizeComponent(component, filePath, entities) {
  // Extract base component info
  const componentInfo = {
    name: component.name,
    filePath,
    type: component.type,
    props: component.props,
    hooks: component.hooks || []
  };
  
  // Determine component category
  if (component.type === 'class') {
    entities.components.class.push({
      ...componentInfo,
      methods: component.methods,
      state: component.state
    });
  } else if (component.type === 'function' || component.type === 'arrow') {
    // Check if it's a memo or forwardRef component
    if (isMemoComponent(component)) {
      entities.components.memo.push(componentInfo);
    } else if (isForwardRefComponent(component)) {
      entities.components.forwardRef.push(componentInfo);
    } else {
      entities.components.function.push(componentInfo);
    }
  }
}

/**
 * Categorize a hook based on its name and usage
 */
function categorizeHook(hook, filePath, entities) {
  const hookInfo = {
    name: hook.name,
    filePath,
    args: hook.args,
    location: hook.location
  };
  
  // Check if it's a built-in React hook
  const builtInHooks = [
    'useState', 'useEffect', 'useContext', 'useReducer',
    'useCallback', 'useMemo', 'useRef', 'useImperativeHandle',
    'useLayoutEffect', 'useDebugValue', 'useDeferredValue',
    'useTransition', 'useId'
  ];
  
  if (builtInHooks.includes(hook.name)) {
    entities.hooks.built_in.push(hookInfo);
  } else {
    entities.hooks.custom.push(hookInfo);
  }
}

/**
 * Identify advanced React patterns like Context, HOCs, etc.
 */
function identifyAdvancedPatterns(parseResult, filePath, entities) {
  // Look for Context creation
  parseResult.imports.forEach(importItem => {
    if (importItem.source === 'react' && 
        importItem.specifiers.some(s => s.imported === 'createContext')) {
      // Find createContext calls
      parseResult.components.forEach(component => {
        // This is a simplified check - would need AST traversal for accurate detection
        if (component.jsxStructure && 
            JSON.stringify(component.jsxStructure).includes('createContext')) {
          entities.contexts.push({
            name: component.name,
            filePath
          });
        }
      });
    }
  });
  
  // Identify HOCs (functions that return components)
  // This is a simplified approach - real implementation would need deeper analysis
  parseResult.exports.forEach(exportItem => {
    if (exportItem.type === 'named' || exportItem.type === 'default') {
      const name = exportItem.name;
      // Check if this is likely a HOC (starts with 'with' prefix)
      if (name.startsWith('with') && name[4] && name[4] === name[4].toUpperCase()) {
        entities.hocs.push({
          name,
          filePath
        });
      }
    }
  });
  
  // Identify Context Providers and Consumers
  parseResult.components.forEach(component => {
    if (component.jsxStructure) {
      component.jsxStructure.forEach(jsx => {
        // Check for Provider pattern
        if (jsx.type && jsx.type.endsWith('Provider')) {
          entities.providers.push({
            name: jsx.type,
            componentName: component.name,
            filePath
          });
        }
        
        // Check for Consumer pattern
        if (jsx.type && jsx.type.endsWith('Consumer')) {
          entities.consumers.push({
            name: jsx.type,
            componentName: component.name,
            filePath
          });
        }
      });
    }
  });
}

/**
 * Identify relationships between different entities
 */
function identifyRelationships(entities) {
  // This would establish connections between components, hooks, contexts, etc.
  // For example, which components use which hooks, which components are wrapped by which HOCs, etc.
  
  // For now, this is a placeholder for future implementation
}

/**
 * Check if a component is wrapped with React.memo
 */
function isMemoComponent(component) {
  // This is a simplified check - real implementation would need AST analysis
  return false; // Placeholder
}

/**
 * Check if a component is created with React.forwardRef
 */
function isForwardRefComponent(component) {
  // This is a simplified check - real implementation would need AST analysis
  return false; // Placeholder
}