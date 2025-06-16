/**
 * Dependency Mapper for React applications
 * Maps relationships between modules based on imports/exports
 */
import { parseComponent } from './react_parser';

/**
 * Main function to map dependencies between modules
 * @param {Array} files - Array of file objects with path and content
 * @returns {Object} Dependency map and metrics
 */
export async function mapDependencies(files) {
  const dependencyMap = {
    modules: {},        // Module info by path
    dependencies: {},   // Dependencies by module
    dependents: {},     // Modules that depend on each module
    circular: [],       // Circular dependency chains
    metrics: {
      mostDependedOn: [],
      mostDependencies: [],
      orphans: [],      // Modules with no dependents
      bottlenecks: []   // Modules that many other modules depend on
    }
  };

  // First pass: collect all modules and their direct dependencies
  for (const file of files) {
    try {
      const parseResult = await parseComponent(file.content, file.path);

      // Initialize module entry
      if (!dependencyMap.modules[file.path]) {
        dependencyMap.modules[file.path] = {
          path: file.path,
          exports: [],
          imports: []
        };
      }

      // Record exports
      if (parseResult.exports && parseResult.exports.length > 0) {
        dependencyMap.modules[file.path].exports = parseResult.exports.map(exp => ({
          name: exp.name,
          type: exp.type
        }));
      }

      // Record imports and build dependency graph
      if (parseResult.imports && parseResult.imports.length > 0) {
        const imports = [];

        parseResult.imports.forEach(imp => {
          // Skip node_modules and built-in modules
          if (!imp.source.startsWith('.') && !imp.source.startsWith('/')) {
            return;
          }

          // Resolve relative path to absolute path (simplified)
          const importPath = resolveImportPath(imp.source, file.path);

          if (importPath) {
            imports.push({
              source: imp.source,
              resolvedPath: importPath,
              specifiers: imp.specifiers
            });

            // Add to dependencies
            if (!dependencyMap.dependencies[file.path]) {
              dependencyMap.dependencies[file.path] = [];
            }
            if (!dependencyMap.dependencies[file.path].includes(importPath)) {
              dependencyMap.dependencies[file.path].push(importPath);
            }

            // Add to dependents
            if (!dependencyMap.dependents[importPath]) {
              dependencyMap.dependents[importPath] = [];
            }
            if (!dependencyMap.dependents[importPath].includes(file.path)) {
              dependencyMap.dependents[importPath].push(file.path);
            }
          }
        });

        dependencyMap.modules[file.path].imports = imports;
      }
    } catch (error) {
      console.error(`Error mapping dependencies for ${file.path}:`, error);
    }
  }

  // Second pass: analyze the dependency graph
  analyzeGraph(dependencyMap);

  return dependencyMap;
}

/**
 * Resolve a relative import path to an absolute path
 * @param {string} importSource - The import source string
 * @param {string} currentFilePath - The path of the current file
 * @returns {string|null} The resolved absolute path or null if not resolvable
 */
function resolveImportPath(importSource, currentFilePath) {
  // This is a simplified implementation
  // In a real-world scenario, this would handle:
  // - Relative paths (./, ../)
  // - Index files (importing a directory)
  // - File extensions (.js, .jsx, .ts, .tsx)
  // - Aliased imports (using webpack aliases)

  // For now, just a basic implementation
  if (importSource.startsWith('./') || importSource.startsWith('../')) {
    // Get directory of current file
    let currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('\\'));

    // Handle relative paths
    let resolvedPath = importSource.replace(/\//g, '\\');

    // Handle ../ by going up directories
    while (resolvedPath.startsWith('..\\')) {
      resolvedPath = resolvedPath.substring(3);
      const lastSlashIndex = currentDir.lastIndexOf('\\');
      if (lastSlashIndex === -1) return null;
      currentDir = currentDir.substring(0, lastSlashIndex);
    }

    // Handle ./ by removing it
    if (resolvedPath.startsWith('.\\')) {
      resolvedPath = resolvedPath.substring(2);
    }

    // Combine paths
    let fullPath = `${currentDir}\\${resolvedPath}`;

    // Add .js extension if no extension
    if (!fullPath.includes('.')) {
      fullPath += '.js';
    }

    return fullPath;
  }

  // For non-relative imports, we would need a module resolution system
  // This is a simplified version that just returns null
  return null;
}

/**
 * Analyze the dependency graph to find patterns and metrics
 * @param {Object} dependencyMap - The dependency map to analyze
 */
function analyzeGraph(dependencyMap) {
  // Find modules with most dependents (most depended on)
  const modulesByDependents = Object.keys(dependencyMap.dependents)
    .map(module => ({
      module,
      count: dependencyMap.dependents[module]?.length || 0
    }))
    .sort((a, b) => b.count - a.count);

  dependencyMap.metrics.mostDependedOn = modulesByDependents
    .slice(0, 10)
    .filter(item => item.count > 0);

  // Find modules with most dependencies
  const modulesByDependencies = Object.keys(dependencyMap.dependencies)
    .map(module => ({
      module,
      count: dependencyMap.dependencies[module]?.length || 0
    }))
    .sort((a, b) => b.count - a.count);

  dependencyMap.metrics.mostDependencies = modulesByDependencies
    .slice(0, 10)
    .filter(item => item.count > 0);

  // Find orphan modules (no dependents)
  dependencyMap.metrics.orphans = Object.keys(dependencyMap.modules)
    .filter(module => !dependencyMap.dependents[module] || dependencyMap.dependents[module].length === 0)
    // Exclude entry points like index.js, App.js
    .filter(module => !module.endsWith('\\index.js') && !module.endsWith('\\App.js'));

  // Find bottleneck modules (high number of dependents and dependencies)
  const bottlenecks = Object.keys(dependencyMap.modules)
    .map(module => {
      const dependentsCount = dependencyMap.dependents[module]?.length || 0;
      const dependenciesCount = dependencyMap.dependencies[module]?.length || 0;

      // Calculate bottleneck score (simplified)
      const score = dependentsCount * dependenciesCount;

      return {
        module,
        dependentsCount,
        dependenciesCount,
        score
      };
    })
    .filter(item => item.dependentsCount > 3 && item.dependenciesCount > 3)
    .sort((a, b) => b.score - a.score);

  dependencyMap.metrics.bottlenecks = bottlenecks.slice(0, 10);

  // Detect circular dependencies
  findCircularDependencies(dependencyMap);
}

/**
 * Find circular dependencies in the dependency graph
 * @param {Object} dependencyMap - The dependency map to analyze
 */
function findCircularDependencies(dependencyMap) {
  const visited = new Set();
  const recursionStack = new Set();
  const circularDependencies = [];

  // Helper function for DFS
  function dfs(module, path = []) {
    // Skip if already fully visited
    if (visited.has(module)) return;

    // Check for circular dependency
    if (recursionStack.has(module)) {
      // Find the start of the cycle
      const cycleStart = path.findIndex(m => m === module);
      if (cycleStart !== -1) {
        const cycle = path.slice(cycleStart).concat(module);
        circularDependencies.push(cycle);
      }
      return;
    }

    // Add to recursion stack
    recursionStack.add(module);
    path.push(module);

    // Visit dependencies
    const dependencies = dependencyMap.dependencies[module] || [];
    for (const dependency of dependencies) {
      dfs(dependency, [...path]);
    }

    // Remove from recursion stack and mark as visited
    recursionStack.delete(module);
    visited.add(module);
  }

  // Run DFS from each module
  for (const module of Object.keys(dependencyMap.modules)) {
    dfs(module);
  }

  // Remove duplicates and sort by length
  const uniqueCircular = [];
  const seen = new Set();

  for (const cycle of circularDependencies) {
    const key = cycle.sort().join('|');
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCircular.push(cycle);
    }
  }

  dependencyMap.circular = uniqueCircular.sort((a, b) => a.length - b.length);
}

/**
 * Generate a dependency graph visualization data structure
 * @param {Object} dependencyMap - The dependency map
 * @returns {Object} Graph data for visualization
 */
export function generateDependencyGraph(dependencyMap) {
  const nodes = [];
  const links = [];
  const nodeMap = new Map();

  // Create nodes
  Object.keys(dependencyMap.modules).forEach((module, index) => {
    const dependentsCount = dependencyMap.dependents[module]?.length || 0;
    const dependenciesCount = dependencyMap.dependencies[module]?.length || 0;

    // Extract module name from path
    const name = module.substring(module.lastIndexOf('\\') + 1);

    const node = {
      id: module,
      name,
      fullPath: module,
      dependentsCount,
      dependenciesCount,
      exports: dependencyMap.modules[module].exports.length,
      size: Math.log(dependentsCount + 1) * 5 + 10 // Node size based on dependents
    };

    nodes.push(node);
    nodeMap.set(module, index);
  });

  // Create links
  Object.keys(dependencyMap.dependencies).forEach(source => {
    const dependencies = dependencyMap.dependencies[source];

    dependencies.forEach(target => {
      if (nodeMap.has(source) && nodeMap.has(target)) {
        links.push({
          source: nodeMap.get(source),
          target: nodeMap.get(target),
          value: 1
        });
      }
    });
  });

  return { nodes, links };
}
