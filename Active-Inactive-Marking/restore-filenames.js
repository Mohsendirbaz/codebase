#!/usr/bin/env node
/**
 * Script to restore original filenames by removing [A] and [I] prefixes
 * Optimized for better performance with:
 * - Configurable prefix removal depth
 * - Enhanced handling of multiple accumulated prefixes
 * - Unified file renaming and import cleaning
 * - Improved restoration reporting
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  maxPrefixDepth: parseInt(args.find(arg => arg.startsWith('--max-prefix-depth='))?.split('=')[1] || '10', 10),
  verbose: args.includes('--verbose'),
  dryRun: args.includes('--dry-run'),
  force: args.includes('--force'),
  skipImports: args.includes('--skip-imports'),
  help: args.includes('--help') || args.includes('-h')
};

// Helper function to log verbose messages
const logVerbose = (message) => {
  if (options.verbose) {
    console.log(`[VERBOSE] ${message}`);
  }
};

/**
 * Systematically cleans a string from prefixes
 * This function handles all types of prefixes in a consistent way
 * @param {string} str - The string to clean
 * @param {number} maxDepth - Maximum number of prefix removal iterations
 * @returns {Object} - The cleaned string and whether any prefixes were removed
 */
const cleanFromPrefixes = (str, maxDepth = options.maxPrefixDepth) => {
  // Track if any prefixes were removed
  let prefixesRemoved = false;
  const originalStr = str;
  
  // Handle known problematic patterns first - using a Map for faster lookups
  const knownPatterns = [
    // Use word boundaries (\b) to prevent partial matches
    { pattern: /\b(Filter)\[(A|I)\]_Popup\b(\.css)?$/, replacement: '$1Popup$3' },
    { pattern: /\b(Model)\[(A|I)\]_Card\b$/, replacement: '$1Card' },
    { pattern: /\b(Filter)\[(A|I)\]_\[(A|I)\]_Popup\b$/, replacement: '$1Popup' },
    { pattern: /\b(Individual)\[(A|I)\]_ResultsPanel\b$/, replacement: '$1ResultsPanel' },
    
    // More specific patterns for problematic files
    { pattern: /FilterPopup\[(A|I)\]_/, replacement: 'FilterPopup' },
    { pattern: /ModelCard\[(A|I)\]_/, replacement: 'ModelCard' },
    { pattern: /IndividualResultsPanel\[(A|I)\]_/, replacement: 'IndividualResultsPanel' },
    
    // Add patterns for HomePage.CSS files
    { pattern: /HomePage\.CSS\/\[(A|I)\]_HomePage(\d+)\.css$/, replacement: 'HomePage.CSS/HomePage$2.css' },
    { pattern: /HomePage\.CSS\/\[(A|I)\]_HomePage_([^.]+)\.css$/, replacement: 'HomePage.CSS/HomePage_$2.css' }
  ];
  
  // Try each known pattern
  for (const { pattern, replacement } of knownPatterns) {
    if (pattern.test(str)) {
      const newStr = str.replace(pattern, replacement);
      if (newStr !== str) {
        prefixesRemoved = true;
        return { cleaned: newStr, prefixesRemoved };
      }
    }
  }
  
  // If no known pattern matched, proceed with systematic cleaning
  let cleaned = str;
  
  // Step 1: Handle multiple accumulated prefixes
  // This regex matches sequences like [A]_[I]_[A]_[I]_ and normalizes them
  const multiPrefixRegex = /(\[(A|I)\]_)+/g;
  const normalizedStr = cleaned.replace(multiPrefixRegex, (match) => {
    // If we found multiple prefixes, mark that we're removing them
    if (match.length > 4) { // More than just a single [A]_ or [I]_
      prefixesRemoved = true;
      // Active always takes precedence
      return match.includes('[A]') ? '[A]_' : '[I]_';
    }
    return match;
  });
  
  if (normalizedStr !== cleaned) {
    cleaned = normalizedStr;
  }
  
  // Step 2: Normalize any duplicate or mixed prefixes
  // Handle duplicate prefixes ([A]_[A]_ or [I]_[I]_)
  const dupPrefixStr = cleaned.replace(/\[(A|I)\]_\[(A|I)\]_/g, (match) => {
    prefixesRemoved = true;
    return match.includes('[A]') ? '[A]_' : '[I]_';
  });
  
  if (dupPrefixStr !== cleaned) {
    cleaned = dupPrefixStr;
  }
  
  // Handle mixed prefixes ([A]_[I]_ or [I]_[A]_) - active always takes precedence
  const mixedPrefixStr = cleaned.replace(/\[A\]_\[I\]_|\[I\]_\[A\]_/g, (match) => {
    prefixesRemoved = true;
    return '[A]_';
  });
  
  if (mixedPrefixStr !== cleaned) {
    cleaned = mixedPrefixStr;
  }
  
  // Step 3: Identify the structure of the string
  // This helps us determine if the prefix is at the beginning, middle, or part of a nested structure
  
  // Case 1: Prefix at the beginning (most common case)
  if (cleaned.match(/^\[(A|I)\]_/)) {
    prefixesRemoved = true;
    cleaned = cleaned.replace(/^\[(A|I)\]_/, '');
    return { cleaned, prefixesRemoved };
  }
  
  // Case 2: Prefix in the middle of a complete name with word boundaries
  // We need to ensure we're matching a complete name, not a partial one
  const middlePrefixMatch = cleaned.match(/^(.+?)\b\[(A|I)\]_(.+)$/);
  if (middlePrefixMatch) {
    // Extract the parts before and after the prefix
    const [_, before, type, after] = middlePrefixMatch;
    
    // Check if this is a complete name by looking for delimiters
    // In a file path, delimiters would be characters like '.', '_', etc.
    const isCompleteName = !before.includes('.') && !after.includes('.');
    
    if (isCompleteName) {
      prefixesRemoved = true;
      return { cleaned: before + after, prefixesRemoved };
    }
  }
  
  // Case 3: Nested structure with prefixes
  // Handle cases like "dir/[A]_file" or "dir.[A]_subdir"
  const nestedMatch = cleaned.match(/^(.+?)[._/](\[(A|I)\]_.+)$/);
  if (nestedMatch) {
    const [_, basePart, prefixedPart] = nestedMatch;
    // Recursively clean the prefixed part
    const { cleaned: cleanedPrefixedPart, prefixesRemoved: nestedPrefixesRemoved } = 
      cleanFromPrefixes(prefixedPart, maxDepth);
    
    if (nestedPrefixesRemoved) {
      prefixesRemoved = true;
      return { cleaned: basePart + '.' + cleanedPrefixedPart, prefixesRemoved };
    }
  }
  
  // Case 4: Handle prefixes that might be in the middle of a filename
  // This is for cases like "FilterPopup[A]_Component"
  const inlineMatch = cleaned.match(/^(.+?)\[(A|I)\]_(.+)$/);
  if (inlineMatch) {
    const [_, before, type, after] = inlineMatch;
    // Check for known problematic filenames
    const knownNames = ['FilterPopup', 'ModelCard', 'IndividualResultsPanel'];
    for (const name of knownNames) {
      if (before.endsWith(name)) {
        prefixesRemoved = true;
        return { cleaned: before + after, prefixesRemoved };
      }
    }
  }
  
  // Apply multiple iterations to handle any remaining prefixes
  // Using the configurable maxDepth parameter
  let iterationsMade = 0;
  for (let i = 0; i < maxDepth; i++) {
    const previous = cleaned;
    cleaned = cleaned.replace(/\[(A|I)\]_/g, '');
    
    // If we made a change, track that prefixes were removed
    if (previous !== cleaned) {
      prefixesRemoved = true;
      iterationsMade++;
    }
    
    // If no more changes, we're done
    if (previous === cleaned) {
      break;
    }
  }
  
  if (iterationsMade > 0 && options.verbose) {
    console.log(`Applied ${iterationsMade} prefix removal iterations to: ${str}`);
  }
  
  // Handle double underscores that might result from removing markers
  const doubleUnderscoreStr = cleaned.replace(/__+/g, '_');
  if (doubleUnderscoreStr !== cleaned) {
    cleaned = doubleUnderscoreStr;
    prefixesRemoved = true;
  }
  
  // Remove leading/trailing underscores
  const trimmedStr = cleaned.replace(/^_+|_+$/g, '');
  if (trimmedStr !== cleaned) {
    cleaned = trimmedStr;
    prefixesRemoved = true;
  }
  
  return { cleaned, prefixesRemoved };
};

// Helper function to check if a path is a directory
const isDirectory = (filePath) => {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch (error) {
    return false;
  }
};

// Helper function to check if a path is a file
const isFile = (filePath) => {
  try {
    return fs.statSync(filePath).isFile();
  } catch (error) {
    return false;
  }
};

// Function to restore a file to its original name
const restoreFileName = (filePath) => {
  try {
    // Skip if the path doesn't exist
    if (!fs.existsSync(filePath)) {
      logVerbose(`Path does not exist: ${filePath}`);
      return null;
    }
    
    // Skip if the path is a directory
    if (isDirectory(filePath)) {
      logVerbose(`Skipping directory: ${filePath}`);
      return null;
    }
    
    // Skip if the path is not a file
    if (!isFile(filePath)) {
      logVerbose(`Not a regular file: ${filePath}`);
      return null;
    }
    
    const dirName = path.dirname(filePath);
    const fileName = path.basename(filePath);
    
    // Check if the file has [A]_ or [I]_ prefix or contains [A] or [I] anywhere
    const hasPrefix = fileName.match(/^\[(A|I)\]_/) || fileName.includes('[A]') || fileName.includes('[I]');
    if (!hasPrefix) {
      return null; // No prefix to remove
    }
    
    // Remove all [A] and [I] markers using the enhanced cleanFromPrefixes function
    const { cleaned: originalFileName, prefixesRemoved } = cleanFromPrefixes(fileName);
    
    // Skip if no prefixes were removed
    if (!prefixesRemoved) {
      logVerbose(`No prefixes to remove from: ${filePath}`);
      return null;
    }
    
    const originalFilePath = path.join(dirName, originalFileName);
    
    // Skip if the file is already correctly named
    if (fileName === originalFileName) {
      console.log(`✓ File already correctly named: ${filePath}`);
      return null;
    }
    
    // Rename the file if not in dry run mode
    if (!options.dryRun) {
      fs.renameSync(filePath, originalFilePath);
      console.log(`✓ Restored ${filePath} to ${originalFilePath}`);
    } else {
      console.log(`[DRY RUN] Would restore ${filePath} to ${originalFilePath}`);
    }
    
    return {
      oldPath: filePath,
      newPath: originalFilePath,
      prefixesRemoved
    };
  } catch (error) {
    console.error(`Error restoring file ${filePath}:`, error.message);
    return null;
  }
};

/**
 * Unified function to clean import paths in a file
 * This combines the functionality of updateImportsInFile and forceCleanImports
 * @param {string} filePath - The path of the file to clean
 * @param {boolean} forceMode - Whether to use force mode
 */
const cleanImportsInFile = (filePath, forceMode = false) => {
  try {
    // Skip if the path doesn't exist
    if (!fs.existsSync(filePath)) {
      return;
    }
    
    // Skip if the path is a directory
    if (isDirectory(filePath)) {
      logVerbose(`Skipping directory for import cleaning: ${filePath}`);
      return;
    }
    
    // Skip if the path is not a file
    if (!isFile(filePath)) {
      logVerbose(`Not a regular file for import cleaning: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Extract all import paths from the file
    let importPaths = [];
    
    // Step 1: Extract all import paths from the file
    if (filePath.toLowerCase().endsWith('.css')) {
      // CSS @import statements
      const cssImportRegex = /@import\s+(?:url\(['"]([^'"]+)['"]\)|['"]([^'"]+)['"])/g;
      let match;
      while ((match = cssImportRegex.exec(content)) !== null) {
        const importPath = match[1] || match[2];
        if (importPath && (importPath.includes('[A]') || importPath.includes('[I]'))) {
          importPaths.push({
            fullMatch: match[0],
            path: importPath
          });
        }
      }
    } else {
      // JS/TS import statements
      const jsImportRegex = /(?:from|import)\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = jsImportRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath && (importPath.includes('[A]') || importPath.includes('[I]'))) {
          importPaths.push({
            fullMatch: match[0],
            path: importPath
          });
        }
      }
      
      // Require statements
      const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath && (importPath.includes('[A]') || importPath.includes('[I]'))) {
          importPaths.push({
            fullMatch: match[0],
            path: importPath
          });
        }
      }
    }
    
    // Skip processing if no import paths with prefixes were found
    if (importPaths.length === 0) {
      return;
    }
    
    // Step 2: Process each import path systematically
    for (const importInfo of importPaths) {
      const { fullMatch, path: importPath } = importInfo;
      
      // Step 2.1: Analyze the path structure
      const pathSegments = importPath.split('/');
      
      // Step 2.2: Clean the path based on its structure
      let cleanedPath;
      
      // Case 1: Handle known problematic patterns first
      const knownPatterns = [
        { pattern: /\.\/Filter\[(A|I)\]_Popup(\.css)?$/, replacement: './FilterPopup$2' },
        { pattern: /\.\/Model\[(A|I)\]_Card$/, replacement: './ModelCard' },
        { pattern: /\.\/Filter\[(A|I)\]_\[(A|I)\]_Popup$/, replacement: './FilterPopup' },
        { pattern: /\.\/Individual\[(A|I)\]_ResultsPanel$/, replacement: './IndividualResultsPanel' },
        // Add patterns for HomePage.CSS files
        { pattern: /\.\/HomePage\.CSS\/\[(A|I)\]_HomePage(\d+)\.css$/, replacement: './HomePage.CSS/HomePage$2.css' },
        { pattern: /\.\/HomePage\.CSS\/\[(A|I)\]_HomePage_([^.]+)\.css$/, replacement: './HomePage.CSS/HomePage_$2.css' }
      ];
      
      let matchedKnownPattern = false;
      for (const { pattern, replacement } of knownPatterns) {
        if (pattern.test(importPath)) {
          cleanedPath = importPath.replace(pattern, replacement);
          matchedKnownPattern = true;
          break;
        }
      }
      
      // Case 2: Process segment by segment if no known pattern matched
      if (!matchedKnownPattern) {
        // Process each segment individually
        const cleanedSegments = pathSegments.map(segment => {
          // Skip segments without prefixes
          if (!segment.includes('[A]') && !segment.includes('[I]')) {
            return segment;
          }
          
          const { cleaned } = cleanFromPrefixes(segment);
          return cleaned;
        });
        
        // Rejoin the segments
        cleanedPath = cleanedSegments.join('/');
      }
      
      // Skip if no change
      if (importPath === cleanedPath) continue;
      
      try {
        // Replace in the content - use a safer approach to avoid regex issues
        const escapedImportPath = importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const importPathRegex = new RegExp(escapedImportPath, 'g');
        content = content.replace(importPathRegex, cleanedPath);
        updated = true;
      } catch (error) {
        console.error(`Error replacing import path ${importPath}: ${error.message}`);
        // Fallback to simple string replacement if regex fails
        content = content.replace(importPath, cleanedPath);
        updated = true;
      }
    }
    
    // Special handling for HomePage.CSS imports
    const l1HomePageCssRegex = /import\s+['"]\.\/HomePage\.CSS\/\[(A|I)\]_([^'"]+)['"]|from\s+['"]\.\/HomePage\.CSS\/\[(A|I)\]_([^'"]+)['"]/g;
    let match;
    while ((match = l1HomePageCssRegex.exec(content)) !== null) {
      const cssFile = match[2] || match[3];
      const prefix = match[1] || match[3];
      const newImport = match[0].replace(`./HomePage.CSS/[${prefix}]_${cssFile}`, `./HomePage.CSS/${cssFile}`);
      content = content.replace(match[0], newImport);
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Updated imports in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error cleaning imports in ${filePath}:`, error.message);
  }
};

/**
 * Process files in batches for better performance
 * @param {Array} files - Array of files to process
 * @param {Function} processor - Function to process each file
 * @param {number} batchSize - Size of each batch
 */
const processBatchedFiles = (files, processor, batchSize = 50) => {
  const totalFiles = files.length;
  let processedCount = 0;
  
  console.log(`Processing ${totalFiles} files in batches of ${batchSize}...`);
  
  // Process files in batches
  for (let i = 0; i < totalFiles; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    batch.forEach(file => {
      processor(file);
      processedCount++;
    });
    
    // Log progress
    const percentComplete = Math.round((processedCount / totalFiles) * 100);
    console.log(`Progress: ${processedCount}/${totalFiles} files (${percentComplete}%)`);
  }
};

function main() {
  try {
    // Display help if requested
    if (options.help) {
      console.log(`
Usage: node restore-filenames.js [options]

Options:
  --max-prefix-depth=<n>  Maximum number of prefix removal iterations (default: 10)
  --verbose               Display more detailed output
  --dry-run               Show what would be done without making changes
  --force                 Use force mode for more aggressive restoration
  --skip-imports          Skip updating import statements
  --help, -h              Display this help message

Example:
  node restore-filenames.js --max-prefix-depth=5 --verbose
`);
      process.exit(0);
    }
    
    console.log(`Starting filename restoration${options.force ? ' (FORCE MODE)' : ''}...`);
    logVerbose(`Options: ${JSON.stringify(options, null, 2)}`);
    
    if (options.force) {
      console.log('Force mode enabled: Will perform more aggressive restoration');
    }
    
    if (options.dryRun) {
      console.log('Dry run mode: No actual changes will be made');
    }
    
    console.log(`Maximum prefix removal depth: ${options.maxPrefixDepth}`);
    
    // Find all files with [A]_ or [I]_ prefix
    // Include JS, JSX, TS, TSX, and CSS files
    const fileExtensions = '{js,jsx,ts,tsx,css}';
    
    // Use multiple patterns to increase robustness
    const patterns = [
      `./src/**/\\[A\\]_*.${fileExtensions}`,
      `./src/**/\\[I\\]_*.${fileExtensions}`,
      `./src/**/*\\[A\\]*.${fileExtensions}`,  // Handle cases where [A] might be in the middle
      `./src/**/*\\[I\\]*.${fileExtensions}`,  // Handle cases where [I] might be in the middle
    ];
    
    console.log('Searching for files with [A] or [I] prefixes/markers...');
    
    // Collect all files matching any of the patterns
    const files = [];
    patterns.forEach(pattern => {
      const matchedFiles = glob.sync(pattern, { ignore: ['**/node_modules/**'] });
      console.log(`Pattern ${pattern} matched ${matchedFiles.length} files`);
      files.push(...matchedFiles);
    });
    
    // Remove duplicates more efficiently
    const uniqueFilesSet = new Set(files);
    const uniqueFiles = Array.from(uniqueFilesSet);
    console.log(`Found ${uniqueFiles.length} unique files with [A] or [I] prefixes/markers`);
    
    if (uniqueFiles.length === 0) {
      console.log('No files with [A]_ or [I]_ prefixes found.');
      process.exit(0);
    }
    
    // Restore filenames
    console.log('\nRestoring filenames...');
    const restoredFiles = [];
    let totalPrefixesRemoved = 0;
    
    // Process files in batches for better performance
    processBatchedFiles(uniqueFiles, (file) => {
      const result = restoreFileName(file);
      if (result) {
        restoredFiles.push(result);
        totalPrefixesRemoved++;
      }
    });
    
    // Skip import updates if requested
    if (options.skipImports) {
      console.log('\nSkipping import updates (--skip-imports flag detected)');
    } else {
      // Update imports in all files
      console.log('\nUpdating import statements...');
      
      // Get a list of all files, ensuring we only match actual files, not directories
      const allFilesRaw = glob.sync('./src/**/*.{js,jsx,ts,tsx,css}', { ignore: ['**/node_modules/**'] });
      const allFiles = allFilesRaw.filter(file => isFile(file)); // This is critical to avoid the EISDIR error
      
      console.log(`Found ${allFiles.length} files to check for import updates`);
      
      // Special handling for index.js - always process it regardless of other conditions
      const indexJsPath = path.join(process.cwd(), 'src/index.js');
      if (fs.existsSync(indexJsPath) && isFile(indexJsPath)) {
        console.log('\nSpecial handling: Processing index.js imports...');
        cleanImportsInFile(indexJsPath, options.force);
        console.log('✓ Completed special processing of index.js');
      } else {
        console.log('Warning: index.js not found at expected path or is not a file');
      }
      
      // Filter files to only process those that might have imports with prefixes
      console.log('\nScanning files for imports with prefixes...');
      
      let importsUpdatedCount = 0;
      
      // Process files in batches for better performance
      processBatchedFiles(allFiles, (file) => {
        // Skip index.js as it's already been processed
        if (file === indexJsPath) return;
        
        // Skip directories to avoid EISDIR error
        if (isDirectory(file)) {
          logVerbose(`Skipping directory: ${file}`);
          return;
        }
        
        try {
          // Track if imports were updated
          const fileContent = fs.readFileSync(file, 'utf8');
          const hasMarkers = fileContent.includes('[A]') || fileContent.includes('[I]');
          
          if (hasMarkers) {
            cleanImportsInFile(file, options.force);
            importsUpdatedCount++;
          } else {
            logVerbose(`Skipping ${file} - no markers found`);
          }
        } catch (error) {
          if (error.code === 'EISDIR') {
            logVerbose(`Skipping directory (caught error): ${file}`);
          } else {
            console.error(`Error processing file ${file}:`, error.message);
          }
        }
      });
      
      console.log(`\nUpdated imports in ${importsUpdatedCount} files`);
    }
    
    // Count only files that were actually restored (had prefixes removed)
    const actuallyRestoredCount = restoredFiles.length;
    
    console.log('\nRestoration Summary:');
    console.log(`- Files processed: ${uniqueFiles.length}`);
    console.log(`- Files restored: ${actuallyRestoredCount}`);
    console.log(`- Total prefixes removed: ${totalPrefixesRemoved}`);
    
    if (options.dryRun) {
      console.log('\n[DRY RUN] No actual changes were made. Run without --dry-run to apply changes.');
    } else {
      console.log('\nRestoration complete!');
    }
    
  } catch (error) {
    console.error('Error restoring filenames:', error);
    process.exit(1);
  }
}

// Run the main function
main();