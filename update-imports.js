#!/usr/bin/env node
/**
 * Standalone script to update import statements in files with [A]_ and [I]_ prefixes
 * This script is designed to be run after mark-active-files.js has renamed files
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  verbose: args.includes('--verbose'),
  dryRun: args.includes('--dry-run'),
  help: args.includes('--help') || args.includes('-h')
};

// Helper function to log verbose messages
const logVerbose = (message) => {
  if (options.verbose) {
    console.log(`[VERBOSE] ${message}`);
  }
};

// Helper function to check if a file exists
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Process files in batches for better performance
 * @param {Array} files - Array of files to process
 * @param {Function} processor - Function to process each file
 * @param {number} batchSize - Size of each batch
 */
const processBatchedFiles = async (files, processor, batchSize = 50) => {
  const totalFiles = files.length;
  let processedCount = 0;
  
  console.log(`Processing ${totalFiles} files in batches of ${batchSize}...`);
  
  // Process files in batches
  for (let i = 0; i < totalFiles; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const promises = batch.map(file => processor(file));
    await Promise.all(promises);
    
    processedCount += batch.length;
    
    // Log progress
    const percentComplete = Math.round((processedCount / totalFiles) * 100);
    console.log(`Progress: ${processedCount}/${totalFiles} files (${percentComplete}%)`);
  }
};

/**
 * Build a map of original filenames to prefixed filenames
 * @param {Array} files - Array of files to process
 * @returns {Map} - Map of original filenames to prefixed filenames
 */
const buildFileMap = async (files) => {
  const fileMap = new Map();
  
  for (const file of files) {
    const fileName = path.basename(file);
    const dirName = path.dirname(file);
    
    // Check if the file has a prefix
    if (fileName.startsWith('[A]_') || fileName.startsWith('[I]_')) {
      const originalName = fileName.replace(/^\[(A|I)\]_/, '');
      const originalPath = path.join(dirName, originalName);
      
      // Store mapping from original to prefixed
      fileMap.set(originalPath, file);
      
      // Also store by basename for simpler lookups
      fileMap.set(originalName, fileName);
      
      // And store without extension
      const originalNameNoExt = path.basename(originalName, path.extname(originalName));
      const prefixedNameNoExt = path.basename(fileName, path.extname(fileName));
      if (originalNameNoExt !== originalName) {
        fileMap.set(originalNameNoExt, prefixedNameNoExt);
      }
      
      logVerbose(`Added to file map: ${originalPath} -> ${file}`);
      logVerbose(`Also added: ${originalName} -> ${fileName}`);
      if (originalNameNoExt !== originalName) {
        logVerbose(`Also added: ${originalNameNoExt} -> ${prefixedNameNoExt}`);
      }
    }
  }
  
  return fileMap;
};

/**
 * Update import statements in a file
 * @param {string} filePath - Path to the file to update
 * @param {Map} fileMap - Map of original filenames to prefixed filenames
 * @returns {boolean} - Whether the file was updated
 */
const updateImportsInFile = async (filePath, fileMap) => {
  try {
    if (!await fileExists(filePath)) {
      return false;
    }
    
    let content = await fs.readFile(filePath, 'utf8');
    let updated = false;
    
    // 1. Handle ES6 imports: import X from './path/file'
    const es6ImportRegex = /import\s+(?:(?:{[^}]*}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:{[^}]*}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    
    // Reset regex lastIndex
    es6ImportRegex.lastIndex = 0;
    
    while ((match = es6ImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      const originalImport = match[0];
      
      // Skip node_modules imports
      if (importPath.startsWith('@') || !importPath.startsWith('.')) {
        continue;
      }
      
      // Parse the import path
      const importDir = path.dirname(importPath);
      const importBaseName = path.basename(importPath);
      const importFileName = path.basename(importPath, path.extname(importPath));
      const importExt = path.extname(importPath) || '.js'; // Default to .js if no extension
      
      // Check if this file is in our map
      let newImportPath = null;
      
      // Try different variations of the import path
      if (fileMap.has(importPath.replace(/^\.\//, ''))) {
        // Full path without leading ./
        const mappedFile = fileMap.get(importPath.replace(/^\.\//, ''));
        newImportPath = importDir === '.' ? `./${mappedFile}` : `${importDir}/${mappedFile}`;
      } else if (fileMap.has(importBaseName)) {
        // Just the basename
        const mappedFile = fileMap.get(importBaseName);
        newImportPath = importDir === '.' ? `./${mappedFile}` : `${importDir}/${mappedFile}`;
      } else if (fileMap.has(importFileName)) {
        // Just the filename without extension
        const mappedFile = fileMap.get(importFileName);
        newImportPath = importDir === '.' ? `./${mappedFile}${importExt}` : `${importDir}/${mappedFile}${importExt}`;
      }
      
      if (newImportPath) {
        // Replace the import statement
        const newImport = originalImport.replace(importPath, newImportPath);
        content = content.replace(originalImport, newImport);
        updated = true;
        
        console.log(`Updated import in ${filePath}: ${originalImport} -> ${newImport}`);
      }
    }
    
    // 2. Handle CSS imports: import './path/file.css'
    const cssImportRegex = /import\s+['"]([^'"]+\.css)['"]/g;
    
    // Reset regex lastIndex
    cssImportRegex.lastIndex = 0;
    
    while ((match = cssImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      const originalImport = match[0];
      
      // Skip node_modules imports
      if (!importPath.startsWith('.')) {
        continue;
      }
      
      // Parse the import path
      const importDir = path.dirname(importPath);
      const importBaseName = path.basename(importPath);
      const importFileName = path.basename(importPath, '.css');
      
      // Check if this file is in our map
      let newImportPath = null;
      
      // Try different variations of the import path
      if (fileMap.has(importPath.replace(/^\.\//, ''))) {
        // Full path without leading ./
        const mappedFile = fileMap.get(importPath.replace(/^\.\//, ''));
        newImportPath = importDir === '.' ? `./${mappedFile}` : `${importDir}/${mappedFile}`;
      } else if (fileMap.has(importBaseName)) {
        // Just the basename
        const mappedFile = fileMap.get(importBaseName);
        newImportPath = importDir === '.' ? `./${mappedFile}` : `${importDir}/${mappedFile}`;
      } else if (fileMap.has(importFileName)) {
        // Just the filename without extension
        const mappedFile = fileMap.get(importFileName);
        newImportPath = importDir === '.' ? `./${mappedFile}.css` : `${importDir}/${mappedFile}.css`;
      }
      
      if (newImportPath) {
        // Replace the import statement
        const newImport = originalImport.replace(importPath, newImportPath);
        content = content.replace(originalImport, newImport);
        updated = true;
        
        console.log(`Updated CSS import in ${filePath}: ${originalImport} -> ${newImport}`);
      }
    }
    
    // 3. Handle require statements: require('./path/file')
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    
    // Reset regex lastIndex
    requireRegex.lastIndex = 0;
    
    while ((match = requireRegex.exec(content)) !== null) {
      const importPath = match[1];
      const originalRequire = match[0];
      
      // Skip node_modules imports
      if (!importPath.startsWith('.')) {
        continue;
      }
      
      // Parse the import path
      const importDir = path.dirname(importPath);
      const importBaseName = path.basename(importPath);
      const importFileName = path.basename(importPath, path.extname(importPath));
      const importExt = path.extname(importPath) || '.js'; // Default to .js if no extension
      
      // Check if this file is in our map
      let newImportPath = null;
      
      // Try different variations of the import path
      if (fileMap.has(importPath.replace(/^\.\//, ''))) {
        // Full path without leading ./
        const mappedFile = fileMap.get(importPath.replace(/^\.\//, ''));
        newImportPath = importDir === '.' ? `./${mappedFile}` : `${importDir}/${mappedFile}`;
      } else if (fileMap.has(importBaseName)) {
        // Just the basename
        const mappedFile = fileMap.get(importBaseName);
        newImportPath = importDir === '.' ? `./${mappedFile}` : `${importDir}/${mappedFile}`;
      } else if (fileMap.has(importFileName)) {
        // Just the filename without extension
        const mappedFile = fileMap.get(importFileName);
        newImportPath = importDir === '.' ? `./${mappedFile}${importExt}` : `${importDir}/${mappedFile}${importExt}`;
      }
      
      if (newImportPath) {
        // Replace the require statement
        const newRequire = originalRequire.replace(importPath, newImportPath);
        content = content.replace(originalRequire, newRequire);
        updated = true;
        
        console.log(`Updated require in ${filePath}: ${originalRequire} -> ${newRequire}`);
      }
    }
    
    // 4. Special handling for CSS @import statements
    const cssAtImportRegex = /@import\s+(?:url\(['"]?([^'")]+)['"]?\)|['"]([^'"]+)['"]);/g;
    
    // Reset regex lastIndex
    cssAtImportRegex.lastIndex = 0;
    
    while ((match = cssAtImportRegex.exec(content)) !== null) {
      const importPath = match[1] || match[2];
      const originalImport = match[0];
      
      // Skip absolute URLs or node_modules imports
      if (!importPath || !importPath.startsWith('.')) {
        continue;
      }
      
      // Parse the import path
      const importDir = path.dirname(importPath);
      const importBaseName = path.basename(importPath);
      const importFileName = path.basename(importPath, path.extname(importPath));
      const importExt = path.extname(importPath);
      
      // Check if this file is in our map
      let newImportPath = null;
      
      // Try different variations of the import path
      if (fileMap.has(importPath.replace(/^\.\//, ''))) {
        // Full path without leading ./
        const mappedFile = fileMap.get(importPath.replace(/^\.\//, ''));
        newImportPath = importDir === '.' ? `./${mappedFile}` : `${importDir}/${mappedFile}`;
      } else if (fileMap.has(importBaseName)) {
        // Just the basename
        const mappedFile = fileMap.get(importBaseName);
        newImportPath = importDir === '.' ? `./${mappedFile}` : `${importDir}/${mappedFile}`;
      } else if (fileMap.has(importFileName)) {
        // Just the filename without extension
        const mappedFile = fileMap.get(importFileName);
        newImportPath = importDir === '.' ? `./${mappedFile}${importExt}` : `${importDir}/${mappedFile}${importExt}`;
      }
      
      if (newImportPath) {
        // Replace the import statement
        let newImport;
        if (match[1]) {
          // url() format
          newImport = originalImport.replace(importPath, newImportPath);
        } else {
          // direct string format
          newImport = originalImport.replace(importPath, newImportPath);
        }
        
        content = content.replace(originalImport, newImport);
        updated = true;
        
        console.log(`Updated CSS @import in ${filePath}: ${originalImport} -> ${newImport}`);
      }
    }
    
    if (updated) {
      if (!options.dryRun) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✓ Updated imports in ${filePath}`);
      } else {
        console.log(`[DRY RUN] Would update imports in ${filePath}`);
      }
      return true;
    } else {
      logVerbose(`No imports updated in ${filePath}`);
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating imports in ${filePath}:`, error.message);
    return false;
  }
};

async function main() {
  try {
    // Display help if requested
    if (options.help) {
      console.log(`
Usage: node update-imports.js [options]

Options:
  --verbose         Display more detailed output
  --dry-run         Show what would be done without making changes
  --help, -h        Display this help message

Example:
  node update-imports.js --dry-run --verbose
`);
      process.exit(0);
    }
    
    console.log('Starting import statement update process...');
    logVerbose(`Options: ${JSON.stringify(options, null, 2)}`);
    
    // Find all files in the src directory
    console.log('Finding all files in the src directory...');
    const allFiles = await glob('./src/**/*.{js,jsx,ts,tsx,css}', { ignore: ['**/node_modules/**'] });
    console.log(`Found ${allFiles.length} files in the src directory`);
    
    // Build a map of original filenames to prefixed filenames
    console.log('Building file map...');
    const fileMap = await buildFileMap(allFiles);
    console.log(`Built file map with ${fileMap.size} entries`);
    
    // Log the file map for debugging
    if (options.verbose) {
      console.log('\nFile map:');
      for (const [originalPath, prefixedPath] of fileMap.entries()) {
        console.log(`  ${originalPath} -> ${prefixedPath}`);
      }
    }
    
    // Update import statements in all files
    console.log('\nUpdating import statements...');
    await processBatchedFiles(allFiles, async (file) => {
      await updateImportsInFile(file, fileMap);
    });
    
    console.log('\nImport statement update complete!');
    
  } catch (error) {
    console.error('Error updating import statements:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});