/**
 * @fileoverview Rule to differentiate between active and inactive project files
 */
"use strict";

const path = require("path");
const fs = require("fs");

// Cache for resolved imports to prevent redundant processing
const importCache = new Map();
// Cache for file content to avoid repeated file reads
const fileContentCache = new Map();
// Cache for regex patterns to avoid recompilation
const regexCache = {
  cssImport: /@import\s+(?:url\(['"]?(\.+[^'"]+)['"]?\)|['"]?(\.+[^'"]+)['"]?)/g,
  jsImport: /import\s+(?:(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"](\.+[^'"]+)['"]/g,
  dynamicImport: /import\(\s*['"](\.+[^'"]+)['"]\s*\)/g,
  cssImportInJs: /import\s+['"](\.+[^'"]+\.css)['"]/g,
  requireStatement: /require\s*\(\s*['"](\.+[^'"]+)['"]\s*\)/g
};

/**
 * Resolves an import path to an absolute file path
 * @param {string} importPath - The import path from the source code
 * @param {string} currentFilePath - The absolute path of the file containing the import
 * @returns {string|null} - The resolved absolute file path or null if not resolved
 */
function resolveImportPath(importPath, currentFilePath) {
  // Skip node_modules and non-relative imports
  if (!importPath.startsWith(".")) {
    return null;
  }

  const currentDir = path.dirname(currentFilePath);
  
  // Handle known problematic patterns first
  const knownPatterns = [
    { pattern: /\.\/Filter\[(A|I)\]_Popup(\.css)?$/, replacement: './FilterPopup$2' },
    { pattern: /\.\/Model\[(A|I)\]_Card$/, replacement: './ModelCard' },
    { pattern: /\.\/Filter\[(A|I)\]_\[(A|I)\]_Popup$/, replacement: './FilterPopup' },
    { pattern: /\.\/Individual\[(A|I)\]_ResultsPanel$/, replacement: './IndividualResultsPanel' },
    // Add patterns for L_1_HomePage.CSS files
    { pattern: /\.\/L_1_HomePage\.CSS\/\[(A|I)\]_L_1_HomePage(\d+)\.css$/, replacement: './L_1_HomePage.CSS/L_1_HomePage$2.css' },
    { pattern: /\.\/L_1_HomePage\.CSS\/\[(A|I)\]_L_1_HomePage_([^.]+)\.css$/, replacement: './L_1_HomePage.CSS/L_1_HomePage_$2.css' }
  ];
  
  let cleanImportPath = importPath;
  
  // Try each known pattern
  let matchedKnownPattern = false;
  for (const { pattern, replacement } of knownPatterns) {
    if (pattern.test(importPath)) {
      cleanImportPath = importPath.replace(pattern, replacement);
      matchedKnownPattern = true;
      break;
    }
  }
  
  // If no known pattern matched, clean the import path from any [A]_ or [I]_ prefixes
  if (!matchedKnownPattern) {
    // Split the path into segments
    const segments = importPath.split('/');
    
    // Process each segment individually
    const cleanedSegments = segments.map(segment => {
      // Skip segments without prefixes
      if (!segment.includes('[A]') && !segment.includes('[I]')) {
        return segment;
      }
      
      // Clean the segment from prefixes
      return segment.replace(/\[(A|I)\]_/g, '');
    });
    
    // Rejoin the segments
    cleanImportPath = cleanedSegments.join('/');
  }
  
  let resolvedPath = path.resolve(currentDir, cleanImportPath);

  // Handle directory imports (e.g., './components')
  if (!path.extname(resolvedPath)) {
    // Try index.js in the directory
    const indexPath = path.join(resolvedPath, "index.js");
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }

    // Try with .js extension
    const jsPath = `${resolvedPath}.js`;
    if (fs.existsSync(jsPath)) {
      return jsPath;
    }

    // Try with .jsx extension
    const jsxPath = `${resolvedPath}.jsx`;
    if (fs.existsSync(jsxPath)) {
      return jsxPath;
    }

    // Try with .ts extension
    const tsPath = `${resolvedPath}.ts`;
    if (fs.existsSync(tsPath)) {
      return tsPath;
    }

    // Try with .tsx extension
    const tsxPath = `${resolvedPath}.tsx`;
    if (fs.existsSync(tsxPath)) {
      return tsxPath;
    }
    
    // Try with .css extension
    const cssPath = `${resolvedPath}.css`;
    if (fs.existsSync(cssPath)) {
      return cssPath;
    }

    // If not found, try with prefixed versions
    const prefixedPaths = [
      // Try with [A]_ prefix
      path.join(resolvedPath, "[A]_index.js"),
      `${resolvedPath.replace(/([^/\\]+)$/, "[A]_$1")}.js`,
      `${resolvedPath.replace(/([^/\\]+)$/, "[A]_$1")}.jsx`,
      `${resolvedPath.replace(/([^/\\]+)$/, "[A]_$1")}.ts`,
      `${resolvedPath.replace(/([^/\\]+)$/, "[A]_$1")}.tsx`,
      `${resolvedPath.replace(/([^/\\]+)$/, "[A]_$1")}.css`,
      
      // Try with [I]_ prefix
      path.join(resolvedPath, "[I]_index.js"),
      `${resolvedPath.replace(/([^/\\]+)$/, "[I]_$1")}.js`,
      `${resolvedPath.replace(/([^/\\]+)$/, "[I]_$1")}.jsx`,
      `${resolvedPath.replace(/([^/\\]+)$/, "[I]_$1")}.ts`,
      `${resolvedPath.replace(/([^/\\]+)$/, "[I]_$1")}.tsx`,
      `${resolvedPath.replace(/([^/\\]+)$/, "[I]_$1")}.css`,
    ];
    
    for (const prefixedPath of prefixedPaths) {
      if (fs.existsSync(prefixedPath)) {
        return prefixedPath;
      }
    }

    return null;
  }

  // Check if the file exists
  if (fs.existsSync(resolvedPath)) {
    return resolvedPath;
  }
  
  // If not found, try with prefixed versions
  const fileDir = path.dirname(resolvedPath);
  const fileName = path.basename(resolvedPath);
  const prefixedPaths = [
    path.join(fileDir, `[A]_${fileName}`),
    path.join(fileDir, `[I]_${fileName}`),
  ];
  
  for (const prefixedPath of prefixedPaths) {
    if (fs.existsSync(prefixedPath)) {
      return prefixedPath;
    }
  }

  return null;
}

/**
 * Extracts import statements from a file
 * This is a critical function that identifies all dependencies of a file
 * 
 * @param {string} filePath - The absolute path of the file to analyze
 * @returns {string[]} - Array of imported file paths
 */
function extractImports(filePath) {
  // Check cache first
  if (importCache.has(filePath)) {
    return importCache.get(filePath);
  }

  const imports = [];
  const fileName = path.basename(filePath);
  console.log(`Extracting imports from: ${fileName}`);

  try {
    // Get file content (from cache if available)
    let content;
    if (fileContentCache.has(filePath)) {
      content = fileContentCache.get(filePath);
    } else {
      content = fs.readFileSync(filePath, "utf8");
      fileContentCache.set(filePath, content);
    }

    // Check if this is a CSS file
    if (filePath.toLowerCase().endsWith('.css')) {
      // CSS @import statements: @import url('./path/file.css') or @import './path/file.css'
      // Use cached regex pattern
      const cssImportRegex = regexCache.cssImport;
      cssImportRegex.lastIndex = 0; // Reset regex state
      
      let match;
      while ((match = cssImportRegex.exec(content)) !== null) {
        const importPath = match[1] || match[2]; // Either from url() or direct import
        
        // Log the extracted CSS import path for debugging
        console.log(`  CSS import: ${importPath}`);
        
        const resolvedPath = resolveImportPath(importPath, filePath);
        
        if (resolvedPath) {
          imports.push(resolvedPath);
          console.log(`    Resolved to: ${path.basename(resolvedPath)}`);
        } else {
          console.log(`    Failed to resolve: ${importPath}`);
        }
      }
    } else {
      // Use cached regex patterns for all import types
      // Regular JS imports
      const importRegex = regexCache.jsImport;
      importRegex.lastIndex = 0; // Reset regex state
      
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        console.log(`  JS import: ${importPath}`);
        
        // Special handling for L_1_HomePage.CSS imports
        if (importPath.includes('L_1_HomePage.CSS')) {
          console.log(`    Found L_1_HomePage.CSS import: ${importPath}`);
        }
        
        const resolvedPath = resolveImportPath(importPath, filePath);
        
        if (resolvedPath) {
          imports.push(resolvedPath);
          console.log(`    Resolved to: ${path.basename(resolvedPath)}`);
        } else {
          console.log(`    Failed to resolve: ${importPath}`);
        }
      }

      // Dynamic imports
      const dynamicImportRegex = regexCache.dynamicImport;
      dynamicImportRegex.lastIndex = 0; // Reset regex state
      
      while ((match = dynamicImportRegex.exec(content)) !== null) {
        const importPath = match[1];
        console.log(`  Dynamic import: ${importPath}`);
        
        const resolvedPath = resolveImportPath(importPath, filePath);
        
        if (resolvedPath) {
          imports.push(resolvedPath);
          console.log(`    Resolved to: ${path.basename(resolvedPath)}`);
        } else {
          console.log(`    Failed to resolve: ${importPath}`);
        }
      }
      
      // CSS imports in JS files
      const cssImportRegex = regexCache.cssImportInJs;
      cssImportRegex.lastIndex = 0; // Reset regex state
      
      while ((match = cssImportRegex.exec(content)) !== null) {
        const importPath = match[1];
        console.log(`  CSS import in JS: ${importPath}`);
        
        // Special handling for L_1_HomePage.CSS imports
        if (importPath.includes('L_1_HomePage.CSS')) {
          console.log(`    Found L_1_HomePage.CSS import in JS: ${importPath}`);
        }
        
        const resolvedPath = resolveImportPath(importPath, filePath);
        
        if (resolvedPath) {
          imports.push(resolvedPath);
          console.log(`    Resolved to: ${path.basename(resolvedPath)}`);
        } else {
          console.log(`    Failed to resolve: ${importPath}`);
        }
      }
      
      // Require statements
      const requireRegex = regexCache.requireStatement;
      requireRegex.lastIndex = 0; // Reset regex state
      
      while ((match = requireRegex.exec(content)) !== null) {
        const importPath = match[1];
        console.log(`  Require statement: ${importPath}`);
        
        const resolvedPath = resolveImportPath(importPath, filePath);
        
        if (resolvedPath) {
          imports.push(resolvedPath);
          console.log(`    Resolved to: ${path.basename(resolvedPath)}`);
        } else {
          console.log(`    Failed to resolve: ${importPath}`);
        }
      }
    }

    // Log summary of imports found
    console.log(`  Found ${imports.length} imports in ${fileName}`);

    // Cache the results
    importCache.set(filePath, imports);
    return imports;
  } catch (error) {
    console.error(`Error extracting imports from ${filePath}:`, error);
    return [];
  }
}

/**
 * Builds a dependency graph starting from the entry point
 * This is the core function that determines which files are active in the project
 * by recursively tracing imports from the entry point (index.js)
 * 
 * @param {string} entryPoint - The absolute path of the entry point file
 * @returns {Object} - The dependency graph, active files, and dependency layers
 */
function buildDependencyGraph(entryPoint) {
  const dependencyGraph = new Map();
  const activeFiles = new Set();
  const processedFiles = new Set();
  const dependencyLayers = new Map(); // Track dependency depth for each file
  const importedBy = new Map(); // Track which files import each file
  
  // Initialize the entry point at layer 0
  dependencyLayers.set(entryPoint, 0);
  
  function processFile(filePath, currentDepth = 0) {
    // Skip if already processed to prevent infinite recursion
    if (processedFiles.has(filePath)) {
      // If we found a shorter path to this file, update its layer
      if (currentDepth < dependencyLayers.get(filePath)) {
        dependencyLayers.set(filePath, currentDepth);
      }
      return;
    }
    
    // Mark file as processed and active
    processedFiles.add(filePath);
    activeFiles.add(filePath);
    
    // Set the dependency layer for this file
    dependencyLayers.set(filePath, currentDepth);
    
    // Extract imports from the file
    console.log(`Processing file: ${path.basename(filePath)} at depth ${currentDepth}`);
    const imports = extractImports(filePath);
    dependencyGraph.set(filePath, imports);
    
    // Process each imported file
    for (const importedFile of imports) {
      // Track which files import this file
      if (!importedBy.has(importedFile)) {
        importedBy.set(importedFile, new Set());
      }
      importedBy.get(importedFile).add(filePath);
      
      // Recursively process the imported file
      processFile(importedFile, currentDepth + 1);
    }
  }
  
  // Start processing from the entry point
  processFile(entryPoint);
  
  return {
    dependencyGraph,
    activeFiles,
    dependencyLayers,
    importedBy
  };
}

/**
 * Identifies standalone files (files with no further imports)
 * These are the "leaf nodes" in the dependency tree
 * 
 * @param {Map} dependencyGraph - The dependency graph
 * @returns {Set} - Set of standalone file paths
 */
function identifyStandaloneFiles(dependencyGraph) {
  const standaloneFiles = new Set();
  
  for (const [filePath, imports] of dependencyGraph.entries()) {
    if (imports.length === 0) {
      standaloneFiles.add(filePath);
    }
  }
  
  return standaloneFiles;
}

/**
 * Categorizes files by their dependency layer
 * This helps visualize the structure of the application
 * 
 * @param {Map} dependencyLayers - Map of file paths to their dependency depth
 * @returns {Map} - Map of layer numbers to sets of files in that layer
 */
function categorizeByLayer(dependencyLayers) {
  const layers = new Map();
  
  for (const [filePath, layer] of dependencyLayers.entries()) {
    if (!layers.has(layer)) {
      layers.set(layer, new Set());
    }
    layers.get(layer).add(filePath);
  }
  
  return layers;
}

/**
 * Improved CSS import detection to better handle CSS dependencies
 * @param {string} filePath - The file path to analyze
 * @returns {string[]} - Array of CSS imports
 */
function extractCssImports(filePath) {
  if (!filePath.toLowerCase().endsWith('.css')) {
    return [];
  }

  const imports = [];
  try {
    // Get file content (from cache if available)
    let content;
    if (fileContentCache.has(filePath)) {
      content = fileContentCache.get(filePath);
    } else {
      content = fs.readFileSync(filePath, "utf8");
      fileContentCache.set(filePath, content);
    }

    // CSS @import statements: @import url('./path/file.css') or @import './path/file.css'
    const cssImportRegex = regexCache.cssImport;
    cssImportRegex.lastIndex = 0; // Reset regex state
    
    let match;
    while ((match = cssImportRegex.exec(content)) !== null) {
      const importPath = match[1] || match[2]; // Either from url() or direct import
      
      // Skip non-relative imports
      if (!importPath || !importPath.startsWith('.')) {
        continue;
      }
      
      imports.push(importPath);
    }
  } catch (error) {
    console.error(`Error extracting CSS imports from ${filePath}:`, error);
  }
  
  return imports;
}

/**
 * Creates the ESLint rule
 */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Differentiate between active and inactive project files",
      category: "Project Organization",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          entryPoint: { type: "string", default: "src/index.js" },
          activeMarker: { type: "string", default: "/* @active */" },
          inactiveMarker: { type: "string", default: "/* @inactive */" },
          silentMode: { type: "boolean", default: true }
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {};
    const entryPointRelative = options.entryPoint || "src/index.js";
    const silentMode = options.silentMode !== false; // Default to true if not specified
    
    // Get project root and entry point
    const projectRoot = process.cwd();
    const entryPointAbsolute = path.resolve(projectRoot, entryPointRelative);
    
    return {
      Program(node) {
        const currentFilePath = context.getFilename();
        
        // Check if the ANALYZE_ACTIVE_FILES environment variable is set
        // Only run the full analysis when this variable is set
        const shouldRunAnalysis = process.env.ANALYZE_ACTIVE_FILES === 'true';
        
        // Skip all processing during normal development unless explicitly requested
        if (!shouldRunAnalysis) {
          // In silent mode, don't report anything during normal development
          if (silentMode) {
            return;
          }
          
          // If not in silent mode, just report a simple message without doing analysis
          context.report({
            node,
            message: `Active files tracking is enabled but not running in analysis mode. Run with ANALYZE_ACTIVE_FILES=true to perform full analysis.`,
          });
          return;
        }
        
        // Only run the analysis on the entry point file
        if (currentFilePath === entryPointAbsolute) {
          console.log("Analyzing project from entry point:", entryPointRelative);
          console.log("This analysis is only running because ANALYZE_ACTIVE_FILES=true");
          
          // Clear caches for fresh analysis
          importCache.clear();
          fileContentCache.clear();
          
          // Build dependency graph with enhanced information
          const { dependencyGraph, activeFiles, dependencyLayers, importedBy } = buildDependencyGraph(entryPointAbsolute);
          const standaloneFiles = identifyStandaloneFiles(dependencyGraph);
          const layerCategories = categorizeByLayer(dependencyLayers);
          
          // Function to collect all project files - optimized to skip unnecessary directories
          const collectFiles = (dir, projectFiles) => {
            try {
              const files = fs.readdirSync(dir, { withFileTypes: true });
              
              // Skip directories known to contain non-source files
              const skipDirs = ["node_modules", ".git", ".vscode", "build", "dist", "coverage"];
              
              for (const file of files) {
                const filePath = path.join(dir, file.name);
                
                if (file.isDirectory()) {
                  // Skip known non-source directories and hidden directories
                  if (!skipDirs.includes(file.name) && !file.name.startsWith(".")) {
                    collectFiles(filePath, projectFiles);
                  }
                } else if (/\.(js|jsx|ts|tsx|css)$/.test(file.name)) {
                  // Skip test files if not analyzing tests
                  if (!process.env.ANALYZE_TEST_FILES && /\.(test|spec)\.(js|jsx|ts|tsx)$/.test(file.name)) {
                    continue;
                  }
                  projectFiles.add(filePath);
                }
              }
            } catch (error) {
              console.error(`Error reading directory ${dir}:`, error);
            }
          };
          
          // Get all project files
          const projectFiles = new Set();
          collectFiles(path.join(projectRoot, "src"), projectFiles);
          
          // Additional CSS dependency analysis
          // This ensures CSS files are properly tracked as dependencies
          console.log("Performing additional CSS dependency analysis...");
          const cssFiles = Array.from(projectFiles).filter(file => file.toLowerCase().endsWith('.css'));
          
          // Process CSS files to find additional dependencies
          for (const cssFile of cssFiles) {
            const cssImports = extractCssImports(cssFile);
            for (const importPath of cssImports) {
              const resolvedPath = resolveImportPath(importPath, cssFile);
              if (resolvedPath && activeFiles.has(cssFile)) {
                // If a CSS file is active and imports another CSS file, that file is also active
                activeFiles.add(resolvedPath);
                console.log(`  Marked CSS dependency as active: ${path.basename(resolvedPath)}`);
                
                // Update dependency tracking
                if (!dependencyGraph.has(cssFile)) {
                  dependencyGraph.set(cssFile, []);
                }
                dependencyGraph.get(cssFile).push(resolvedPath);
                
                // Update importedBy tracking
                if (!importedBy.has(resolvedPath)) {
                  importedBy.set(resolvedPath, new Set());
                }
                importedBy.get(resolvedPath).add(cssFile);
              }
            }
          }
          
          // Convert layer categories to a format suitable for JSON
          const layersData = {};
          for (const [layer, files] of layerCategories.entries()) {
            layersData[layer] = Array.from(files).map(file => path.relative(projectRoot, file));
          }
          
          // Convert importedBy to a format suitable for JSON
          const importedByData = {};
          for (const [file, importers] of importedBy.entries()) {
            const relativeFile = path.relative(projectRoot, file);
            importedByData[relativeFile] = Array.from(importers).map(importer => 
              path.relative(projectRoot, importer)
            );
          }
          
          // Generate report data with enhanced dependency information
          const reportData = {
            activeFiles: Array.from(activeFiles).map(file => path.relative(projectRoot, file)),
            inactiveFiles: Array.from(projectFiles)
              .filter(file => !activeFiles.has(file))
              .map(file => path.relative(projectRoot, file)),
            standaloneFiles: Array.from(standaloneFiles).map(file => path.relative(projectRoot, file)),
            dependencyLayers: layersData,
            importedBy: importedByData
          };
          
          // Validate the analysis results
          if (activeFiles.size === 0) {
            console.error("ERROR: No active files found. This is likely an error in the analysis.");
            // Add the entry point as active at minimum
            activeFiles.add(entryPointAbsolute);
            reportData.activeFiles.push(path.relative(projectRoot, entryPointAbsolute));
          } else if (activeFiles.size === 1) {
            console.error("WARNING: Only one active file found. This is likely an error in the analysis.");
            // Check if the only active file is the entry point
            const onlyActiveFile = Array.from(activeFiles)[0];
            if (onlyActiveFile !== entryPointAbsolute) {
              console.error(`  The only active file is not the entry point: ${path.basename(onlyActiveFile)}`);
              // Add the entry point as active
              activeFiles.add(entryPointAbsolute);
              reportData.activeFiles.push(path.relative(projectRoot, entryPointAbsolute));
            }
          } else if (activeFiles.size < 5 && projectFiles.size > 10) {
            // If we have very few active files compared to the total, it's likely an error
            console.warn("WARNING: Very few active files found compared to total files. This might indicate an analysis issue.");
            
            // Ensure the entry point is marked as active
            if (!activeFiles.has(entryPointAbsolute)) {
              console.error(`  Entry point is not marked as active: ${path.basename(entryPointAbsolute)}`);
              activeFiles.add(entryPointAbsolute);
              reportData.activeFiles.push(path.relative(projectRoot, entryPointAbsolute));
            }
            
            // Check for direct imports from the entry point
            const entryPointImports = dependencyGraph.get(entryPointAbsolute) || [];
            if (entryPointImports.length > 0 && entryPointImports.length > activeFiles.size - 1) {
              console.warn(`  Entry point has ${entryPointImports.length} imports but only ${activeFiles.size - 1} other active files.`);
              
              // Ensure all direct imports from entry point are marked as active
              for (const importedFile of entryPointImports) {
                if (!activeFiles.has(importedFile)) {
                  console.warn(`  Adding direct import to active files: ${path.basename(importedFile)}`);
                  activeFiles.add(importedFile);
                  reportData.activeFiles.push(path.relative(projectRoot, importedFile));
                }
              }
            }
          }
          
          // Enhanced CSS file handling
          // Ensure CSS files imported by active JS files are also marked as active
          console.log("Performing enhanced CSS file handling...");
          const jsFiles = Array.from(activeFiles).filter(file => 
            file.toLowerCase().endsWith('.js') || 
            file.toLowerCase().endsWith('.jsx') || 
            file.toLowerCase().endsWith('.ts') || 
            file.toLowerCase().endsWith('.tsx')
          );
          
          for (const jsFile of jsFiles) {
            // Get the imports for this JS file
            const imports = dependencyGraph.get(jsFile) || [];
            
            // Find CSS imports
            const cssImports = imports.filter(imp => imp.toLowerCase().endsWith('.css'));
            
            for (const cssImport of cssImports) {
              if (!activeFiles.has(cssImport)) {
                console.log(`  Marking CSS file as active (imported by JS): ${path.basename(cssImport)}`);
                activeFiles.add(cssImport);
                reportData.activeFiles.push(path.relative(projectRoot, cssImport));
                
                // Also check for CSS files imported by this CSS file
                const nestedCssImports = extractCssImports(cssImport);
                for (const nestedImportPath of nestedCssImports) {
                  const resolvedPath = resolveImportPath(nestedImportPath, cssImport);
                  if (resolvedPath && !activeFiles.has(resolvedPath)) {
                    console.log(`  Marking nested CSS dependency as active: ${path.basename(resolvedPath)}`);
                    activeFiles.add(resolvedPath);
                    reportData.activeFiles.push(path.relative(projectRoot, resolvedPath));
                  }
                }
              }
            }
          }
          
          // Update inactive files list after all active file additions
          reportData.inactiveFiles = Array.from(projectFiles)
            .filter(file => !activeFiles.has(file))
            .map(file => path.relative(projectRoot, file));
          
          // Write report to a JSON file
          try {
            fs.writeFileSync(
              path.join(projectRoot, 'active-files-report.json'),
              JSON.stringify(reportData, null, 2),
              'utf8'
            );
            console.log("Report written to active-files-report.json");
          } catch (error) {
            console.error("Error writing report file:", error.message);
          }
          
          // Report the summary
          context.report({
            node,
            message: `Analysis complete. Found ${activeFiles.size} active files and ${projectFiles.size - activeFiles.size} inactive files. Report written to active-files-report.json`,
          });
        }
      }
    };
  }
};
