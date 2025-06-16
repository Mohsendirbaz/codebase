/**
 * Context Analyzer for React applications
 * Analyzes the usage of React Context API across components
 */
import { parseComponent } from './react_parser';

/**
 * Main function to analyze React Context API usage in a codebase
 * @param {Array} files - Array of file objects with path and content
 * @returns {Object} Analysis results containing context usage patterns
 */
export async function analyzeContexts(files) {
  const contextAnalysis = {
    contexts: [],           // All identified contexts
    providers: [],          // Context provider usage
    consumers: {
      useContext: [],       // Components using useContext
      Consumer: [],         // Components using Context.Consumer
      contextType: []       // Class components using contextType
    },
    patterns: {
      globalState: [],      // Contexts used for global state
      theming: [],          // Contexts used for theming
      localization: [],     // Contexts used for i18n/localization
      authentication: [],   // Contexts used for auth state
      configuration: []     // Contexts used for app configuration
    },
    metrics: {
      mostUsedContexts: [], // Contexts with most consumers
      contextHierarchy: {}, // Nested context providers
      contextSize: {}       // Size/complexity of context values
    }
  };
  
  // First pass: identify all contexts
  for (const file of files) {
    try {
      const parseResult = await parseComponent(file.content, file.path);
      
      // Look for context creation
      identifyContexts(parseResult, file.path, contextAnalysis);
      
    } catch (error) {
      console.error(`Error analyzing contexts in ${file.path}:`, error);
    }
  }
  
  // Second pass: analyze context usage
  for (const file of files) {
    try {
      const parseResult = await parseComponent(file.content, file.path);
      
      // Identify context providers
      identifyProviders(parseResult, file.path, contextAnalysis);
      
      // Identify context consumers
      identifyConsumers(parseResult, file.path, contextAnalysis);
      
    } catch (error) {
      console.error(`Error analyzing context usage in ${file.path}:`, error);
    }
  }
  
  // Third pass: analyze context patterns and metrics
  analyzeContextPatterns(contextAnalysis);
  calculateContextMetrics(contextAnalysis);
  
  return contextAnalysis;
}

/**
 * Identify React Context definitions
 */
function identifyContexts(parseResult, filePath, contextAnalysis) {
  // Check for createContext imports
  const hasCreateContextImport = parseResult.imports.some(importItem => 
    importItem.source === 'react' && 
    importItem.specifiers.some(s => s.imported === 'createContext')
  );
  
  if (!hasCreateContextImport) return;
  
  // Look for createContext calls in the file
  const fileContent = JSON.stringify(parseResult);
  const createContextMatches = fileContent.match(/createContext\(/g);
  
  if (createContextMatches) {
    // For each context creation, extract information
    parseResult.components.forEach(component => {
      // This is a simplified approach - a real implementation would need AST traversal
      // to accurately identify context creation and extract default values
      
      const componentStr = JSON.stringify(component);
      if (componentStr.includes('createContext(')) {
        // Extract context name (usually the variable name)
        let contextName = component.name + 'Context';
        
        // Check exports to find the actual context name
        parseResult.exports.forEach(exp => {
          if (exp.type === 'named' || exp.type === 'default') {
            if (componentStr.includes(`${exp.name} = createContext`)) {
              contextName = exp.name;
            }
          }
        });
        
        contextAnalysis.contexts.push({
          name: contextName,
          filePath,
          componentName: component.name,
          hasProvider: componentStr.includes(`${contextName}.Provider`),
          hasConsumer: componentStr.includes(`${contextName}.Consumer`)
        });
      }
    });
    
    // Also check for contexts created outside components
    parseResult.exports.forEach(exp => {
      if (fileContent.includes(`${exp.name} = createContext`) || 
          fileContent.includes(`${exp.name}=createContext`)) {
        
        // Check if this context was already added from a component
        const alreadyAdded = contextAnalysis.contexts.some(
          ctx => ctx.name === exp.name && ctx.filePath === filePath
        );
        
        if (!alreadyAdded) {
          contextAnalysis.contexts.push({
            name: exp.name,
            filePath,
            componentName: null,
            hasProvider: fileContent.includes(`${exp.name}.Provider`),
            hasConsumer: fileContent.includes(`${exp.name}.Consumer`)
          });
        }
      }
    });
  }
}

/**
 * Identify Context Provider usage
 */
function identifyProviders(parseResult, filePath, contextAnalysis) {
  parseResult.components.forEach(component => {
    const componentStr = JSON.stringify(component);
    
    // Look for Context.Provider patterns in JSX
    if (component.jsxStructure) {
      component.jsxStructure.forEach(jsx => {
        if (jsx.type && jsx.type.endsWith('.Provider')) {
          // Extract context name from Provider
          const contextName = jsx.type.substring(0, jsx.type.length - 9);
          
          // Find the context in our list
          const context = contextAnalysis.contexts.find(ctx => ctx.name === contextName);
          
          if (context) {
            contextAnalysis.providers.push({
              contextName,
              providerComponent: component.name,
              filePath,
              props: jsx.props || []
            });
          } else {
            // This might be a provider for a context defined in another file
            contextAnalysis.providers.push({
              contextName,
              providerComponent: component.name,
              filePath,
              props: jsx.props || [],
              externalContext: true
            });
          }
        }
      });
    }
    
    // Also check for programmatic usage of Context.Provider
    contextAnalysis.contexts.forEach(context => {
      if (componentStr.includes(`${context.name}.Provider`)) {
        // Check if we already added this provider from JSX analysis
        const alreadyAdded = contextAnalysis.providers.some(
          p => p.contextName === context.name && 
               p.providerComponent === component.name && 
               p.filePath === filePath
        );
        
        if (!alreadyAdded) {
          contextAnalysis.providers.push({
            contextName: context.name,
            providerComponent: component.name,
            filePath,
            programmatic: true
          });
        }
      }
    });
  });
}

/**
 * Identify Context Consumer usage
 */
function identifyConsumers(parseResult, filePath, contextAnalysis) {
  // Check for useContext hook usage
  parseResult.hooks.forEach(hook => {
    if (hook.name === 'useContext') {
      // The first argument should be the context
      const contextArg = hook.args[0];
      if (contextArg && contextArg.type === 'identifier') {
        const contextName = contextArg.name;
        
        // Find the component using this hook
        let componentName = null;
        parseResult.components.forEach(component => {
          if (component.hooks && component.hooks.some(h => 
            h.name === 'useContext' && 
            JSON.stringify(h.args) === JSON.stringify(hook.args)
          )) {
            componentName = component.name;
          }
        });
        
        contextAnalysis.consumers.useContext.push({
          contextName,
          consumerComponent: componentName,
          filePath,
          location: hook.location
        });
      }
    }
  });
  
  // Check for Context.Consumer usage in JSX
  parseResult.components.forEach(component => {
    if (component.jsxStructure) {
      component.jsxStructure.forEach(jsx => {
        if (jsx.type && jsx.type.endsWith('.Consumer')) {
          // Extract context name from Consumer
          const contextName = jsx.type.substring(0, jsx.type.length - 9);
          
          contextAnalysis.consumers.Consumer.push({
            contextName,
            consumerComponent: component.name,
            filePath
          });
        }
      });
    }
    
    // Check for static contextType in class components
    if (component.type === 'class') {
      const componentStr = JSON.stringify(component);
      
      // Look for static contextType = SomeContext pattern
      contextAnalysis.contexts.forEach(context => {
        if (componentStr.includes(`contextType = ${context.name}`) || 
            componentStr.includes(`contextType=${context.name}`)) {
          
          contextAnalysis.consumers.contextType.push({
            contextName: context.name,
            consumerComponent: component.name,
            filePath
          });
        }
      });
    }
  });
}

/**
 * Analyze context usage patterns
 */
function analyzeContextPatterns(contextAnalysis) {
  // Analyze each context to determine its likely purpose
  contextAnalysis.contexts.forEach(context => {
    const contextName = context.name.toLowerCase();
    const providersForContext = contextAnalysis.providers.filter(
      p => p.contextName === context.name
    );
    
    // Check provider props and context name for clues about purpose
    const allProviderProps = providersForContext.flatMap(p => p.props || []);
    const providerPropsStr = JSON.stringify(allProviderProps);
    
    // Theme context detection
    if (
      contextName.includes('theme') || 
      contextName.includes('style') || 
      contextName.includes('color') ||
      providerPropsStr.includes('theme') ||
      providerPropsStr.includes('dark') ||
      providerPropsStr.includes('light')
    ) {
      contextAnalysis.patterns.theming.push({
        contextName: context.name,
        filePath: context.filePath,
        evidence: 'Context name or provider props suggest theming functionality'
      });
    }
    
    // Localization context detection
    if (
      contextName.includes('i18n') || 
      contextName.includes('local') || 
      contextName.includes('lang') ||
      contextName.includes('translate') ||
      providerPropsStr.includes('language') ||
      providerPropsStr.includes('locale') ||
      providerPropsStr.includes('translate')
    ) {
      contextAnalysis.patterns.localization.push({
        contextName: context.name,
        filePath: context.filePath,
        evidence: 'Context name or provider props suggest localization functionality'
      });
    }
    
    // Authentication context detection
    if (
      contextName.includes('auth') || 
      contextName.includes('user') || 
      contextName.includes('login') ||
      contextName.includes('session') ||
      providerPropsStr.includes('user') ||
      providerPropsStr.includes('login') ||
      providerPropsStr.includes('logout') ||
      providerPropsStr.includes('isAuthenticated')
    ) {
      contextAnalysis.patterns.authentication.push({
        contextName: context.name,
        filePath: context.filePath,
        evidence: 'Context name or provider props suggest authentication functionality'
      });
    }
    
    // Configuration context detection
    if (
      contextName.includes('config') || 
      contextName.includes('settings') || 
      contextName.includes('env') ||
      contextName.includes('feature') ||
      providerPropsStr.includes('config') ||
      providerPropsStr.includes('settings') ||
      providerPropsStr.includes('environment')
    ) {
      contextAnalysis.patterns.configuration.push({
        contextName: context.name,
        filePath: context.filePath,
        evidence: 'Context name or provider props suggest configuration functionality'
      });
    }
    
    // Global state context detection (if not matching other specific patterns)
    if (
      contextName.includes('store') || 
      contextName.includes('state') || 
      contextName.includes('data') ||
      contextName.includes('provider') ||
      (providersForContext.length > 0 && 
       !contextAnalysis.patterns.theming.some(t => t.contextName === context.name) &&
       !contextAnalysis.patterns.localization.some(l => l.contextName === context.name) &&
       !contextAnalysis.patterns.authentication.some(a => a.contextName === context.name) &&
       !contextAnalysis.patterns.configuration.some(c => c.contextName === context.name))
    ) {
      contextAnalysis.patterns.globalState.push({
        contextName: context.name,
        filePath: context.filePath,
        evidence: 'Context appears to be used for general state management'
      });
    }
  });
}

/**
 * Calculate metrics based on context usage
 */
function calculateContextMetrics(contextAnalysis) {
  // Calculate most used contexts
  const contextUsageCounts = {};
  
  // Count useContext usage
  contextAnalysis.consumers.useContext.forEach(consumer => {
    if (!contextUsageCounts[consumer.contextName]) {
      contextUsageCounts[consumer.contextName] = 0;
    }
    contextUsageCounts[consumer.contextName]++;
  });
  
  // Count Context.Consumer usage
  contextAnalysis.consumers.Consumer.forEach(consumer => {
    if (!contextUsageCounts[consumer.contextName]) {
      contextUsageCounts[consumer.contextName] = 0;
    }
    contextUsageCounts[consumer.contextName]++;
  });
  
  // Count contextType usage
  contextAnalysis.consumers.contextType.forEach(consumer => {
    if (!contextUsageCounts[consumer.contextName]) {
      contextUsageCounts[consumer.contextName] = 0;
    }
    contextUsageCounts[consumer.contextName]++;
  });
  
  // Sort contexts by usage count
  contextAnalysis.metrics.mostUsedContexts = Object.entries(contextUsageCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  // Analyze context hierarchy (nested providers)
  // This is a simplified approach - a real implementation would need to analyze
  // the component tree to accurately identify nested providers
  const providersByComponent = {};
  
  contextAnalysis.providers.forEach(provider => {
    if (!providersByComponent[provider.providerComponent]) {
      providersByComponent[provider.providerComponent] = [];
    }
    providersByComponent[provider.providerComponent].push(provider.contextName);
  });
  
  // Components with multiple providers might have nested contexts
  Object.entries(providersByComponent).forEach(([component, contexts]) => {
    if (contexts.length > 1) {
      contextAnalysis.metrics.contextHierarchy[component] = contexts;
    }
  });
  
  // Estimate context value size/complexity
  // This is a very simplified approach - a real implementation would need to
  // analyze the actual context values passed to providers
  contextAnalysis.contexts.forEach(context => {
    const providersForContext = contextAnalysis.providers.filter(
      p => p.contextName === context.name
    );
    
    if (providersForContext.length > 0) {
      // Count total props across all providers as a rough estimate of complexity
      const totalProps = providersForContext.reduce(
        (sum, provider) => sum + (provider.props ? provider.props.length : 0), 
        0
      );
      
      contextAnalysis.metrics.contextSize[context.name] = {
        providers: providersForContext.length,
        estimatedComplexity: totalProps
      };
    }
  });
}