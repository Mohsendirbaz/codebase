#!/usr/bin/env node
/**
 * Script to rename files with [A] or [I] prefixes based on the analysis report
 * This script only renames files and updates imports, without modifying file content
 * 
 * Optimized for better performance with:
 * - Asynchronous file operations
 * - Command-line options
 * - Better error handling
 * - Progress reporting
 * - Compatibility with optimized scripts
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const util = require('util');
const { glob } = require('glob');

// Convert glob to a promise-based function
const globAsync = util.promisify(glob);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  reportPath: args.find(arg => arg.startsWith('--report='))?.split('=')[1] || 'active-files-report.json',
  verbose: args.includes('--verbose'),
  dryRun: args.includes('--dry-run'),
  skipImports: args.includes('--skip-imports'),
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

// Function to rename a file with active/inactive prefix
const renameFile = async (filePath, status, projectRoot) => {
  try {
    if (!await fileExists(filePath)) {
      console.error(`File not found: ${filePath}`);
      return null;
    }
    
    const dirName = path.dirname(filePath);
    const fileName = path.basename(filePath);
    
    // Remove existing [A] or [I] prefixes if they exist
    const cleanFileName = fileName.replace(/^\[(A|I)\]_/, '');
    
    // Add new prefix
    const prefix = status === 'active' ? '[A]_' : '[I]_';
    const newFileName = `${prefix}${cleanFileName}`;
    const newFilePath = path.join(dirName, newFileName);
    
    // Skip if the file is already correctly named
    if (fileName === newFileName) {
      console.log(`✓ File already correctly named: ${path.relative(projectRoot, filePath)}`);
      return null;
    }
    
    // Rename the file if not in dry run mode
    if (!options.dryRun) {
      await fs.rename(filePath, newFilePath);
      console.log(`✓ Renamed ${path.relative(projectRoot, filePath)} to ${newFileName}`);
    } else {
      console.log(`[DRY RUN] Would rename ${path.relative(projectRoot, filePath)} to ${newFileName}`);
    }
    
    return {
      oldPath: filePath,
      newPath: newFilePath
    };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
    return null;
  }
};

/**
 * Update import statements in a file
 * @param {string} filePath - Path to the file to update
 * @param {Map} renamedFiles - Map of original filenames to prefixed filenames
 * @returns {boolean} - Whether the file was updated
 */
const updateImportsInFile = async (filePath, renamedFiles) => {
  try {
    if (!await fileExists(filePath)) {
      return false;
    }
    
    let content = await fs.readFile(filePath, 'utf8');
    let updated = false;
    
    // Create a more comprehensive lookup map for faster access
    const directLookup = new Map();
    const filesByBaseName = new Map();
    const filesByName = new Map();
    
    // Process the renamed files map to create a more comprehensive lookup
    for (const [oldPath, newPath] of renamedFiles.entries()) {
      // Skip if the paths are the same or if either is not a string
      if (oldPath === newPath || typeof oldPath !== 'string' || typeof newPath !== 'string') continue;
      
      // Normalize paths for consistent comparison (always use forward slashes)
      const oldNormPath = oldPath.replace(/\\/g, '/');
      const newNormPath = typeof newPath === 'string' ? newPath.replace(/\\/g, '/') : newPath;
      
      // Get the prefix ([A]_ or [I]_) from the new path
      let prefix = '';
      if (typeof newNormPath === 'string') {
        const baseName = path.basename(newNormPath);
        if (baseName.startsWith('[A]_')) {
          prefix = '[A]_';
        } else if (baseName.startsWith('[I]_')) {
          prefix = '[I]_';
        }
      }
      
      if (!prefix) continue; // Skip if we couldn't determine the prefix
      
      // Extract file information
      const oldBaseName = path.basename(oldNormPath);
      const oldFileName = path.basename(oldNormPath, path.extname(oldNormPath));
      const oldExt = path.extname(oldNormPath);
      
      // Store in multiple maps for different lookup strategies
      
      // 1. Full path map (with all variations of path format)
      directLookup.set(oldNormPath, { newPath: newNormPath, prefix, fileName: oldFileName, ext: oldExt });
      directLookup.set(oldNormPath.replace(/^\.\//, ''), { newPath: newNormPath, prefix, fileName: oldFileName, ext: oldExt });
      if (!oldNormPath.startsWith('./')) {
        directLookup.set(`./${oldNormPath}`, { newPath: newNormPath, prefix, fileName: oldFileName, ext: oldExt });
      }
      
      // 2. Basename map (for files with the same name in different directories)
      if (!filesByBaseName.has(oldBaseName)) {
        filesByBaseName.set(oldBaseName, []);
      }
      filesByBaseName.get(oldBaseName).push({ 
        oldPath: oldNormPath, 
        newPath: newNormPath, 
        prefix, 
        fileName: oldFileName, 
        ext: oldExt 
      });
      
      // 3. Filename map (without extension)
      if (!filesByName.has(oldFileName)) {
        filesByName.set(oldFileName, []);
      }
      filesByName.get(oldFileName).push({ 
        oldPath: oldNormPath, 
        newPath: newNormPath, 
        prefix, 
        fileName: oldFileName, 
        ext: oldExt 
      });
      
      // 4. Special handling for extensions
      if (oldExt) {
        // Without extension
        const withoutExt = oldNormPath.substring(0, oldNormPath.length - oldExt.length);
        directLookup.set(withoutExt, { newPath: newNormPath, prefix, fileName: oldFileName, ext: oldExt });
        directLookup.set(withoutExt.replace(/^\.\//, ''), { newPath: newNormPath, prefix, fileName: oldFileName, ext: oldExt });
        if (!withoutExt.startsWith('./')) {
          directLookup.set(`./${withoutExt}`, { newPath: newNormPath, prefix, fileName: oldFileName, ext: oldExt });
        }
      }
    }
    
    // Log the lookup maps for debugging
    if (options.verbose) {
      console.log(`\nDirect lookup map for ${filePath} has ${directLookup.size} entries`);
      console.log(`Basename map has ${filesByBaseName.size} entries`);
      console.log(`Filename map has ${filesByName.size} entries`);
    }
    
    // Helper function to find the best match for an import path
    const findBestMatch = (importPath) => {
      // Normalize the import path
      const normImportPath = importPath.replace(/\\/g, '/');
      
      // Try direct lookup first (most precise)
      if (directLookup.has(normImportPath)) {
        return directLookup.get(normImportPath);
      }
      
      // Parse the import path
      const importDir = path.dirname(normImportPath);
      const importBaseName = path.basename(normImportPath);
      const importExt = path.extname(normImportPath);
      const importFileName = importExt ? path.basename(normImportPath, importExt) : importBaseName;
      
      // Try by basename if we have an extension
      if (importExt && filesByBaseName.has(importBaseName)) {
        const candidates = filesByBaseName.get(importBaseName);
        
        // If there's only one candidate, use it
        if (candidates.length === 1) {
          return candidates[0];
        }
        
        // If there are multiple candidates, try to find the best match by directory
        for (const candidate of candidates) {
          const candidateDir = path.dirname(candidate.oldPath);
          if (candidateDir === importDir || candidateDir.endsWith(`/${importDir}`)) {
            return candidate;
          }
        }
        
        // If no good match by directory, just use the first one
        return candidates[0];
      }
      
      // Try by filename without extension
      if (filesByName.has(importFileName)) {
        const candidates = filesByName.get(importFileName);
        
        // If there's only one candidate, use it
        if (candidates.length === 1) {
          return candidates[0];
        }
        
        // If there are multiple candidates, try to find the best match by directory
        for (const candidate of candidates) {
          const candidateDir = path.dirname(candidate.oldPath);
          if (candidateDir === importDir || candidateDir.endsWith(`/${importDir}`)) {
            return candidate;
          }
        }
        
        // If no good match by directory, just use the first one
        return candidates[0];
      }
      
      // No match found
      return null;
    };
    
    // Process different types of imports
    
    // 1. Handle ES6 imports: import X from './path/file'
    const es6ImportRegex = /import\s+(?:(?:{[^}]*}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:{[^}]*}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    
    // Reset regex lastIndex
    es6ImportRegex.lastIndex = 0;
    
    while ((match = es6ImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      const originalImport = match[0];
      
      // Skip node_modules imports
      if (importPath.startsWith('@') || (!importPath.startsWith('.') && !importPath.includes('/'))) {
        continue;
      }
      
      // Find the best match for this import path
      const fileInfo = findBestMatch(importPath);
      
      // If we found a match, update the import
      if (fileInfo) {
        // Parse the import path
        const importDir = path.dirname(importPath);
        const importExt = path.extname(importPath) || fileInfo.ext || '.js'; // Use the extension from the import path, or the file info, or default to .js
        
        // Construct the new import path
        let newImportPath;
        
        if (importDir === '.') {
          // Direct import from current directory
          newImportPath = `./${fileInfo.prefix}${fileInfo.fileName}${importExt}`;
        } else {
          // Import from subdirectory
          newImportPath = `${importDir}/${fileInfo.prefix}${fileInfo.fileName}${importExt}`;
        }
        
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
      if (!importPath.startsWith('.') && !importPath.includes('/')) {
        continue;
      }
      
      // Find the best match for this import path
      const fileInfo = findBestMatch(importPath);
      
      // If we found a match, update the import
      if (fileInfo) {
        // Parse the import path
        const importDir = path.dirname(importPath);
        
        // Construct the new import path
        let newImportPath;
        
        if (importDir === '.') {
          // Direct import from current directory
          newImportPath = `./${fileInfo.prefix}${fileInfo.fileName}.css`;
        } else {
          // Import from subdirectory
          newImportPath = `${importDir}/${fileInfo.prefix}${fileInfo.fileName}.css`;
        }
        
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
      if (!importPath.startsWith('.') && !importPath.includes('/')) {
        continue;
      }
      
      // Find the best match for this import path
      const fileInfo = findBestMatch(importPath);
      
      // If we found a match, update the import
      if (fileInfo) {
        // Parse the import path
        const importDir = path.dirname(importPath);
        const importExt = path.extname(importPath) || fileInfo.ext || '.js'; // Use the extension from the import path, or the file info, or default to .js
        
        // Construct the new import path
        let newImportPath;
        
        if (importDir === '.') {
          // Direct import from current directory
          newImportPath = `./${fileInfo.prefix}${fileInfo.fileName}${importExt}`;
        } else {
          // Import from subdirectory
          newImportPath = `${importDir}/${fileInfo.prefix}${fileInfo.fileName}${importExt}`;
        }
        
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
      if (!importPath || (!importPath.startsWith('.') && !importPath.includes('/'))) {
        continue;
      }
      
      // Find the best match for this import path
      const fileInfo = findBestMatch(importPath);
      
      // If we found a match, update the import
      if (fileInfo) {
        // Parse the import path
        const importDir = path.dirname(importPath);
        const importExt = path.extname(importPath) || fileInfo.ext || '.css'; // Use the extension from the import path, or the file info, or default to .css
        
        // Construct the new import path
        let newImportPath;
        
        if (importDir === '.') {
          // Direct import from current directory
          newImportPath = `./${fileInfo.prefix}${fileInfo.fileName}${importExt}`;
        } else {
          // Import from subdirectory
          newImportPath = `${importDir}/${fileInfo.prefix}${fileInfo.fileName}${importExt}`;
        }
        
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

async function main() {
  try {
    // Display help if requested
    if (options.help) {
      console.log(`
Usage: node mark-active-files.js [options]

Options:
  --report=<path>   Path to the report file (default: active-files-report.json)
  --verbose         Display more detailed output
  --dry-run         Show what would be done without making changes
  --skip-imports    Skip updating import statements
  --help, -h        Display this help message

Example:
  node mark-active-files.js --report=custom-report.json --dry-run --verbose
`);
      process.exit(0);
    }
    
    console.log('Starting file renaming process...');
    logVerbose(`Options: ${JSON.stringify(options, null, 2)}`);
    
    const projectRoot = process.cwd();
    const reportPath = path.join(projectRoot, options.reportPath);
    
    // Check if the report file exists
    if (!await fileExists(reportPath)) {
      console.error(`Error: Report file not found: ${reportPath}`);
      console.log('Please run the analysis first using "npm run analyze-active-files".');
      process.exit(1);
    }
    
    // Read the report file
    console.log(`Reading analysis report from ${reportPath}...`);
    let report;
    try {
      const reportContent = await fs.readFile(reportPath, 'utf8');
      report = JSON.parse(reportContent);
      logVerbose('Report file successfully parsed.');
    } catch (error) {
      console.error(`Error reading or parsing report file: ${error.message}`);
      process.exit(1);
    }
    
    // Validate report data
    const activeFiles = report.activeFiles || [];
    const inactiveFiles = report.inactiveFiles || [];
    
    if (!Array.isArray(activeFiles) || !Array.isArray(inactiveFiles)) {
      console.error('Error: Invalid report format. Missing or invalid activeFiles or inactiveFiles array.');
      process.exit(1);
    }
    
    // Track renamed files for import updates
    const renamedFiles = new Map();
    
    // Rename active files
    console.log(`\nRenaming ${activeFiles.length} active files...`);
    await processBatchedFiles(activeFiles, async (file) => {
      // Skip renaming index.js as it's the fixed entry point
      if (file.endsWith('src/index.js') || file.endsWith('src\\index.js')) {
        console.log(`✓ Skipping entry point: ${file} (will not be renamed)`);
        return;
      }
      
      const filePath = path.join(projectRoot, file);
      const result = await renameFile(filePath, 'active', projectRoot);
      if (result) {
        // Store both the full path and the relative path
        const oldRelativePath = file;
        const newRelativePath = path.relative(projectRoot, result.newPath);
        
        // Store with multiple keys for better matching
        renamedFiles.set(oldRelativePath, newRelativePath);
        
        // Also store by basename for simpler lookups
        const oldBaseName = path.basename(oldRelativePath);
        const newBaseName = path.basename(newRelativePath);
        renamedFiles.set(oldBaseName, newBaseName);
        
        // And store without extension
        const oldFileNameNoExt = path.basename(oldRelativePath, path.extname(oldRelativePath));
        const newFileNameNoExt = path.basename(newRelativePath, path.extname(newRelativePath));
        if (oldFileNameNoExt !== oldBaseName) {
          renamedFiles.set(oldFileNameNoExt, newFileNameNoExt);
        }
        
        logVerbose(`Added to rename map: ${oldRelativePath} -> ${newRelativePath}`);
        logVerbose(`Also added: ${oldBaseName} -> ${newBaseName}`);
        if (oldFileNameNoExt !== oldBaseName) {
          logVerbose(`Also added: ${oldFileNameNoExt} -> ${newFileNameNoExt}`);
        }
      }
    });
    
    // Rename inactive files
    console.log(`\nRenaming ${inactiveFiles.length} inactive files...`);
    await processBatchedFiles(inactiveFiles, async (file) => {
      const filePath = path.join(projectRoot, file);
      const result = await renameFile(filePath, 'inactive', projectRoot);
      if (result) {
        // Store both the full path and the relative path
        const oldRelativePath = file;
        const newRelativePath = path.relative(projectRoot, result.newPath);
        
        // Store with multiple keys for better matching
        renamedFiles.set(oldRelativePath, newRelativePath);
        
        // Also store by basename for simpler lookups
        const oldBaseName = path.basename(oldRelativePath);
        const newBaseName = path.basename(newRelativePath);
        renamedFiles.set(oldBaseName, newBaseName);
        
        // And store without extension
        const oldFileNameNoExt = path.basename(oldRelativePath, path.extname(oldRelativePath));
        const newFileNameNoExt = path.basename(newRelativePath, path.extname(newRelativePath));
        if (oldFileNameNoExt !== oldBaseName) {
          renamedFiles.set(oldFileNameNoExt, newFileNameNoExt);
        }
        
        logVerbose(`Added to rename map: ${oldRelativePath} -> ${newRelativePath}`);
        logVerbose(`Also added: ${oldBaseName} -> ${newBaseName}`);
        if (oldFileNameNoExt !== oldBaseName) {
          logVerbose(`Also added: ${oldFileNameNoExt} -> ${newFileNameNoExt}`);
        }
      }
    });
    
    // Log the rename map for debugging
    if (options.verbose) {
      console.log('\nRename map:');
      for (const [oldPath, newPath] of renamedFiles.entries()) {
        console.log(`  ${oldPath} -> ${newPath}`);
      }
    }
    
      // Update imports in all files to reflect the renamed files
      if (!options.skipImports) {
        console.log('\nUpdating import statements...');
        const allFiles = await globAsync('./src/**/*.{js,jsx,ts,tsx,css}', { ignore: ['**/node_modules/**'] });
        console.log(`Found ${allFiles.length} files to check for import updates`);
        
        // First, ensure we have a complete map of all renamed files
        console.log('Building comprehensive rename map...');
        
        // Add entries for all active files (even if they weren't renamed)
        for (const file of activeFiles) {
          const filePath = path.join(projectRoot, file);
          const dirName = path.dirname(filePath);
          const fileName = path.basename(filePath);
          const cleanFileName = fileName.replace(/^\[(A|I)\]_/, '');
          const prefixedFileName = `[A]_${cleanFileName}`;
          
          // Only add if not already in the map
          if (!renamedFiles.has(cleanFileName)) {
            renamedFiles.set(cleanFileName, prefixedFileName);
            logVerbose(`Added active file to rename map: ${cleanFileName} -> ${prefixedFileName}`);
          }
          
          // Also add without extension
          const fileExt = path.extname(fileName);
          if (fileExt) {
            const fileNameNoExt = cleanFileName.slice(0, -fileExt.length);
            const prefixedFileNameNoExt = `[A]_${fileNameNoExt}`;
            if (!renamedFiles.has(fileNameNoExt)) {
              renamedFiles.set(fileNameNoExt, prefixedFileNameNoExt);
              logVerbose(`Added active file (no ext) to rename map: ${fileNameNoExt} -> ${prefixedFileNameNoExt}`);
            }
          }
        }
        
        // Add entries for all inactive files (even if they weren't renamed)
        for (const file of inactiveFiles) {
          const filePath = path.join(projectRoot, file);
          const dirName = path.dirname(filePath);
          const fileName = path.basename(filePath);
          const cleanFileName = fileName.replace(/^\[(A|I)\]_/, '');
          const prefixedFileName = `[I]_${cleanFileName}`;
          
          // Only add if not already in the map
          if (!renamedFiles.has(cleanFileName)) {
            renamedFiles.set(cleanFileName, prefixedFileName);
            logVerbose(`Added inactive file to rename map: ${cleanFileName} -> ${prefixedFileName}`);
          }
          
          // Also add without extension
          const fileExt = path.extname(fileName);
          if (fileExt) {
            const fileNameNoExt = cleanFileName.slice(0, -fileExt.length);
            const prefixedFileNameNoExt = `[I]_${fileNameNoExt}`;
            if (!renamedFiles.has(fileNameNoExt)) {
              renamedFiles.set(fileNameNoExt, prefixedFileNameNoExt);
              logVerbose(`Added inactive file (no ext) to rename map: ${fileNameNoExt} -> ${prefixedFileNameNoExt}`);
            }
          }
        }
        
        // Log the enhanced rename map for debugging
        if (options.verbose) {
          console.log('\nEnhanced rename map:');
          for (const [oldPath, newPath] of renamedFiles.entries()) {
            console.log(`  ${oldPath} -> ${newPath}`);
          }
        }
        
        // Now update all import statements
        await processBatchedFiles(allFiles, async (file) => {
          await updateImportsInFile(file, renamedFiles);
        });
    } else {
      console.log('\nSkipping import updates (--skip-imports flag detected)');
    }
    
    // Check if restore script exists
    const restoreScriptPath = path.join(projectRoot, 'restore-filenames.js');
    if (await fileExists(restoreScriptPath)) {
      console.log('\nRestore script found at: restore-filenames.js');
    } else {
      console.log('\nNote: A restore script is needed to revert filename changes.');
      console.log('Please create restore-filenames.js to enable restoration.');
    }
    
    // Count only files that were actually renamed
    const actuallyRenamedCount = renamedFiles.size;
    
    console.log('\nRenaming complete!');
    if (options.dryRun) {
      console.log(`[DRY RUN] Would rename ${actuallyRenamedCount} files (${activeFiles.length} active files and ${inactiveFiles.length} inactive files in report).`);
    } else {
      console.log(`Renamed ${actuallyRenamedCount} files (${activeFiles.length} active files and ${inactiveFiles.length} inactive files in report).`);
    }
    console.log('\nActive files now have [A]_ prefix');
    console.log('Inactive files now have [I]_ prefix');
    console.log('\nTo restore original filenames, run:');
    console.log('node restore-filenames.js');
    
  } catch (error) {
    console.error('Error renaming files:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
