#!/usr/bin/env node
/**
 * Script to restore original filenames by removing [A]_ and [I]_ prefixes
 * Optimized for better performance
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration - Reduced to a more reasonable value
const MAX_PREFIX_ITERATIONS = 10; 

/**
 * Systematically cleans a string from prefixes
 * This function handles all types of prefixes in a consistent way
 * @param {string} str - The string to clean
 * @returns {string} - The cleaned string
 */
const cleanFromPrefixes = (str) => {
  // Handle known problematic patterns first - using a Map for faster lookups
  const knownPatterns = [
    { pattern: /Filter\[(A|I)\]_Popup(\.css)?$/, replacement: 'FilterPopup$2' },
    { pattern: /Model\[(A|I)\]_Card$/, replacement: 'ModelCard' },
    { pattern: /Filter\[(A|I)\]_\[(A|I)\]_Popup$/, replacement: 'FilterPopup' },
    { pattern: /Individual\[(A|I)\]_ResultsPanel$/, replacement: 'IndividualResultsPanel' },
    // Add patterns for L_1_HomePage.CSS files
    { pattern: /L_1_HomePage\.CSS\/\[(A|I)\]_L_1_HomePage(\d+)\.css$/, replacement: 'L_1_HomePage.CSS/L_1_HomePage$2.css' },
    { pattern: /L_1_HomePage\.CSS\/\[(A|I)\]_L_1_HomePage_([^.]+)\.css$/, replacement: 'L_1_HomePage.CSS/L_1_HomePage_$2.css' }
  ];
  
  // Try each known pattern
  for (const { pattern, replacement } of knownPatterns) {
    if (pattern.test(str)) {
      return str.replace(pattern, replacement);
    }
  }
  
  // If no known pattern matched, proceed with systematic cleaning
  let cleaned = str;
  
  // Step 1: Normalize any duplicate or mixed prefixes
  // Handle duplicate prefixes ([A]_[A]_ or [I]_[I]_)
  cleaned = cleaned.replace(/\[(A|I)\]_\[(A|I)\]_/g, (match) => {
    return match.includes('[A]') ? '[A]_' : '[I]_';
  });
  
  // Handle mixed prefixes ([A]_[I]_ or [I]_[A]_) - active always takes precedence
  cleaned = cleaned.replace(/\[A\]_\[I\]_|\[I\]_\[A\]_/g, '[A]_');
  
  // Step 2: Identify the structure of the string
  // This helps us determine if the prefix is at the beginning, middle, or part of a nested structure
  
  // Case 1: Prefix at the beginning (most common case)
  if (cleaned.match(/^\[(A|I)\]_/)) {
    cleaned = cleaned.replace(/^\[(A|I)\]_/, '');
    return cleaned;
  }
  
  // Case 2: Prefix in the middle of a complete name
  // We need to ensure we're matching a complete name, not a partial one
  const middlePrefixMatch = cleaned.match(/^(.+?)\[(A|I)\]_(.+)$/);
  if (middlePrefixMatch) {
    // Extract the parts before and after the prefix
    const [_, before, type, after] = middlePrefixMatch;
    
    // Check if this is a complete name by looking for delimiters
    // In a file path, delimiters would be characters like '.', '_', etc.
    const isCompleteName = !before.includes('.') && !after.includes('.');
    
    if (isCompleteName) {
      return before + after;
    }
  }
  
  // Case 3: Nested structure with prefixes
  // Handle cases like "dir/[A]_file" or "dir.[A]_subdir"
  const nestedMatch = cleaned.match(/^(.+?)[._/](\[(A|I)\]_.+)$/);
  if (nestedMatch) {
    const [_, basePart, prefixedPart] = nestedMatch;
    // Recursively clean the prefixed part
    const cleanedPrefixedPart = cleanFromPrefixes(prefixedPart);
    return basePart + '.' + cleanedPrefixedPart;
  }
  
  // Apply multiple iterations to handle any remaining prefixes
  // Using a more reasonable number of iterations
  for (let i = 0; i < MAX_PREFIX_ITERATIONS; i++) {
    const previous = cleaned;
    cleaned = cleaned.replace(/\[(A|I)\]_/g, '');
    
    // If no more changes, we're done
    if (previous === cleaned) {
      break;
    }
  }
  
  // Handle double underscores that might result from removing markers
  cleaned = cleaned.replace(/__+/g, '_');
  
  // Remove leading/trailing underscores
  cleaned = cleaned.replace(/^_+|_+$/g, '');
  
  return cleaned;
};

// Function to restore a file to its original name
const restoreFileName = (filePath) => {
  try {
    const dirName = path.dirname(filePath);
    const fileName = path.basename(filePath);
    
    // Check if the file has [A]_ or [I]_ prefix or contains [A] or [I] anywhere
    const hasPrefix = fileName.match(/^\[(A|I)\]_/) || fileName.includes('[A]') || fileName.includes('[I]');
    if (!hasPrefix) {
      return null; // No prefix to remove
    }
    
    // Remove all [A] and [I] markers using the cleanFromPrefixes function
    let originalFileName = cleanFromPrefixes(fileName);
    
    const originalFilePath = path.join(dirName, originalFileName);
    
    // Skip if the file is already correctly named
    if (fileName === originalFileName) {
      console.log(`✓ File already correctly named: ${filePath}`);
      return null;
    }
    
    // Rename the file
    fs.renameSync(filePath, originalFilePath);
    console.log(`✓ Restored ${filePath} to ${originalFilePath}`);
    
    return {
      oldPath: filePath,
      newPath: originalFilePath
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
    if (!fs.existsSync(filePath)) {
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
        // Add patterns for L_1_HomePage.CSS files
        { pattern: /\.\/L_1_HomePage\.CSS\/\[(A|I)\]_L_1_HomePage(\d+)\.css$/, replacement: './L_1_HomePage.CSS/L_1_HomePage$2.css' },
        { pattern: /\.\/L_1_HomePage\.CSS\/\[(A|I)\]_L_1_HomePage_([^.]+)\.css$/, replacement: './L_1_HomePage.CSS/L_1_HomePage_$2.css' }
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
          
          return cleanFromPrefixes(segment);
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
    
    // Special handling for L_1_HomePage.CSS imports
    const l1HomePageCssRegex = /import\s+['"]\.\/L_1_HomePage\.CSS\/\[(A|I)\]_([^'"]+)['"]|from\s+['"]\.\/L_1_HomePage\.CSS\/\[(A|I)\]_([^'"]+)['"]/g;
    let match;
    while ((match = l1HomePageCssRegex.exec(content)) !== null) {
      const cssFile = match[2] || match[3];
      const prefix = match[1] || match[3];
      const newImport = match[0].replace(`./L_1_HomePage.CSS/[${prefix}]_${cssFile}`, `./L_1_HomePage.CSS/${cssFile}`);
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

async function main() {
  try {
    // Check for force flag
    const forceMode = process.argv.includes('--force');
    
    console.log(`Starting filename restoration${forceMode ? ' (FORCE MODE)' : ''}...`);
    
    if (forceMode) {
      console.log('Force mode enabled: Will perform more aggressive restoration');
    }
    
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
    
    // Process files in batches for better performance
    processBatchedFiles(uniqueFiles, (file) => {
      const result = restoreFileName(file);
      if (result) {
        restoredFiles.push(result);
      }
    });
    
    // Update imports in all files
    console.log('\nUpdating import statements...');
    const allFiles = glob.sync('./src/**/*.{js,jsx,ts,tsx,css}', { ignore: ['**/node_modules/**'] });
    console.log(`Found ${allFiles.length} files to check for import updates`);
    
    // Special handling for index.js - always process it regardless of other conditions
    const indexJsPath = path.join(process.cwd(), 'src/index.js');
    if (fs.existsSync(indexJsPath)) {
      console.log('\nSpecial handling: Processing index.js imports...');
      cleanImportsInFile(indexJsPath, true);
      console.log('✓ Completed special processing of index.js');
    } else {
      console.log('Warning: index.js not found at expected path');
    }
    
    // Filter files to only process those that might have imports with prefixes
    // This avoids unnecessary processing of files that don't have imports with prefixes
    console.log('\nScanning files for imports with prefixes...');
    
    // Process files in batches for better performance
    processBatchedFiles(allFiles, (file) => {
      // Skip index.js as it's already been processed
      if (file === indexJsPath) return;
      
      cleanImportsInFile(file, forceMode);
    });
    
    // Count only files that were actually restored (had prefixes removed)
    const actuallyRestoredCount = restoredFiles.length;
    
    console.log('\nRestoration complete!');
    console.log(`Restored ${actuallyRestoredCount} files to their original names.`);
    
  } catch (error) {
    console.error('Error restoring filenames:', error);
    process.exit(1);
  }
}

main();