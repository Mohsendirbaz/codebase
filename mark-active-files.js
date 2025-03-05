#!/usr/bin/env node
/**
 * Enhanced script to rename files with [A] or [I] prefixes based on the analysis report
 * This script processes files in dependency order and thoroughly updates import statements
 * 
 * Key improvements:
 * - Processes files in dependency order based on report data
 * - Consistent path normalization across platforms
 * - Enhanced import detection and updating
 * - Better handling of various import statement formats
 * - Improved error reporting and recovery
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
  forceRename: args.includes('--force-rename'),
  help: args.includes('--help') || args.includes('-h')
};

// Helper function to log verbose messages
const logVerbose = (message) => {
  if (options.verbose) {
    console.log(`[VERBOSE] ${message}`);
  }
};

// Helper function to log debug messages
const logDebug = (message) => {
  if (process.env.DEBUG) {
    console.log(`[DEBUG] ${message}`);
  }
};

// Consistently normalize paths across platforms
const normalizePath = (filePath) => {
  return filePath.replace(/\\/g, '/');
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

// Helper function to create backup of a file before renaming
const backupFile = async (filePath, projectRoot) => {
  if (options.dryRun) return true;
  
  try {
    const backupDir = path.join(projectRoot, '.file-backups');
    
    // Create backup directory if it doesn't exist
    if (!fsSync.existsSync(backupDir)) {
      await fs.mkdir(backupDir, { recursive: true });
    }
    
    const relativePath = path.relative(projectRoot, filePath);
    const backupPath = path.join(backupDir, `${relativePath.replace(/[/\\]/g, '_')}.bak`);
    
    // Copy the file to backup location
    await fs.copyFile(filePath, backupPath);
    logVerbose(`Created backup of ${relativePath} at ${backupPath}`);
    return true;
  } catch (error) {
    console.error(`Error creating backup for ${filePath}:`, error.message);
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
    
    // First create a backup of the file
    await backupFile(filePath, projectRoot);
    
    const dirName = path.dirname(filePath);
    const fileName = path.basename(filePath);
    
    // Remove existing [A] or [I] prefixes if they exist
    const cleanFileName = fileName.replace(/^\[(A|I)\]_/, '');
    
    // Add new prefix
    const prefix = status === 'active' ? '[A]_' : '[I]_';
    const newFileName = `${prefix}${cleanFileName}`;
    const newFilePath = path.join(dirName, newFileName);
    
    // Skip if the file is already correctly named
    if (fileName === newFileName && !options.forceRename) {
      console.log(`✓ File already correctly named: ${path.relative(projectRoot, filePath)}`);
      return null;
    }
    
    // Rename the file if not in dry run mode
    if (!options.dryRun) {
      try {
        await fs.rename(filePath, newFilePath);
        console.log(`✓ Renamed ${path.relative(projectRoot, filePath)} to ${newFileName}`);
      } catch (error) {
        // If direct rename fails, try copy-and-delete approach
        console.warn(`Direct rename failed for ${filePath}, trying copy-and-delete approach...`);
        
        try {
          const content = await fs.readFile(filePath, 'utf8');
          await fs.writeFile(newFilePath, content, 'utf8');
          await fs.unlink(filePath);
          console.log(`✓ Renamed ${path.relative(projectRoot, filePath)} to ${newFileName} using copy-and-delete`);
        } catch (copyError) {
          console.error(`Failed to rename ${filePath} using copy-and-delete:`, copyError.message);
          return null;
        }
      }
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
 * @param {Object} importedByMap - Map from the report showing which files import each file
 * @returns {boolean} - Whether the file was updated
 */
const updateImportsInFile = async (filePath, renamedFiles, importedByMap) => {
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
    const dirLookup = new Map();
    
    // Process the renamed files map to create a more comprehensive lookup
    for (const [oldPath, newPath] of renamedFiles.entries()) {
      // Skip if the paths are the same or if either is not a string
      if (oldPath === newPath || typeof oldPath !== 'string' || typeof newPath !== 'string') continue;
      
      // Normalize paths for consistent comparison (always use forward slashes)
      const oldNormPath = normalizePath(oldPath);
      const newNormPath = typeof newPath === 'string' ? normalizePath(newPath) : newPath;
      
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
      const oldDir = path.dirname(oldNormPath);
      
      // Store in multiple maps for different lookup strategies
      
      // 1. Full path map (with all variations of path format)
      directLookup.set(oldNormPath, { newPath: newNormPath, prefix, fileName: oldFileName, ext: oldExt, dir: oldDir });
      
      // Handle path variations
      const pathVariations = [
        oldNormPath,
        oldNormPath.replace(/^\.\//, ''),
        oldNormPath.startsWith('./') ? oldNormPath : `./${oldNormPath}`,
        oldNormPath.endsWith(oldExt) ? oldNormPath.slice(0, -oldExt.length) : oldNormPath,
        path.join(oldDir, oldFileName).replace(/\\/g, '/')
      ];
      
      for (const variation of pathVariations) {
        if (!directLookup.has(variation)) {
          directLookup.set(variation, { newPath: newNormPath, prefix, fileName: oldFileName, ext: oldExt, dir: oldDir });
        }
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
        ext: oldExt,
        dir: oldDir
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
        ext: oldExt,
        dir: oldDir
      });
      
      // 4. Directory map (for resolving relative imports)
      if (!dirLookup.has(oldDir)) {
        dirLookup.set(oldDir, []);
      }
      dirLookup.get(oldDir).push({
        oldPath: oldNormPath,
        newPath: newNormPath,
        prefix,
        fileName: oldFileName,
        ext: oldExt,
        dir: oldDir
      });
    }
    
    // Log the lookup maps for debugging
    if (options.verbose) {
      console.log(`\nDirect lookup map for ${filePath} has ${directLookup.size} entries`);
      console.log(`Basename map has ${filesByBaseName.size} entries`);
      console.log(`Filename map has ${filesByName.size} entries`);
      console.log(`Directory map has ${dirLookup.size} entries`);
    }
    
    // Use the importedByMap to identify expected imports for this file
    const normalizedFilePath = normalizePath(path.relative(process.cwd(), filePath));
    const expectedImports = [];
    
    // Check if this file imports any known files from the importedByMap
    for (const [importedFile, importers] of Object.entries(importedByMap)) {
      if (importers.includes(normalizedFilePath) || 
          importers.some(imp => normalizePath(imp) === normalizedFilePath)) {
        expectedImports.push(importedFile);
      }
    }
    
    logVerbose(`Expected imports for ${path.basename(filePath)}: ${expectedImports.join(', ')}`);
    
    // Helper function to find the best match for an import path
    const findBestMatch = (importPath) => {
      // Normalize the import path
      const normImportPath = normalizePath(importPath);
      
      // Try direct lookup first (most precise)
      if (directLookup.has(normImportPath)) {
        return directLookup.get(normImportPath);
      }
      
      // Parse the import path
      const importDir = path.dirname(normImportPath);
      const importBaseName = path.basename(normImportPath);
      const importExt = path.extname(normImportPath);
      const importFileName = importExt ? path.basename(normImportPath, importExt) : importBaseName;
      
      // Check against expected imports from the report
      for (const expectedImport of expectedImports) {
        const expectedBaseName = path.basename(expectedImport);
        const expectedFileName = path.basename(expectedImport, path.extname(expectedImport));
        
        if (importFileName === expectedFileName || 
            importBaseName === expectedBaseName ||
            normImportPath.endsWith(expectedImport) ||
            expectedImport.endsWith(normImportPath)) {
            
          // Found a match in expected imports, now find it in our rename maps
          for (const [oldPath, fileInfo] of directLookup.entries()) {
            if (oldPath.endsWith(expectedImport) || expectedImport.endsWith(oldPath)) {
              return fileInfo;
            }
          }
        }
      }
      
      // Try by basename if we have an extension
      if (importExt && filesByBaseName.has(importBaseName)) {
        const candidates = filesByBaseName.get(importBaseName);
        
        // If there's only one candidate, use it
        if (candidates.length === 1) {
          return candidates[0];
        }
        
        // If there are multiple candidates, try to find the best match by directory
        for (const candidate of candidates) {
          const candidateDir = normalizePath(candidate.dir);
          if (candidateDir === importDir || candidateDir.endsWith(`/${importDir}`) || importDir.endsWith(`/${candidateDir}`)) {
            return candidate;
          }
        }
        
        // Try to match based on relative path resolution
        const thisFileDir = normalizePath(path.dirname(filePath));
        for (const candidate of candidates) {
          const candidateFullPath = path.join(process.cwd(), candidate.oldPath);
          const relativeToThis = normalizePath(path.relative(thisFileDir, candidateFullPath));
          
          if (relativeToThis === normImportPath || 
              `./${relativeToThis}` === normImportPath ||
              relativeToThis.replace(/^\.\//, '') === normImportPath.replace(/^\.\//, '')) {
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
          const candidateDir = normalizePath(candidate.dir);
          if (candidateDir === importDir || candidateDir.endsWith(`/${importDir}`) || importDir.endsWith(`/${candidateDir}`)) {
            return candidate;
          }
        }
        
        // Try to match based on relative path resolution
        const thisFileDir = normalizePath(path.dirname(filePath));
        for (const candidate of candidates) {
          const candidateFullPath = path.join(process.cwd(), candidate.oldPath);
          const relativeToThis = normalizePath(path.relative(thisFileDir, candidateFullPath));
          
          if (relativeToThis === normImportPath || 
              `./${relativeToThis}` === normImportPath ||
              relativeToThis.replace(/^\.\//, '') === normImportPath.replace(/^\.\//, '')) {
            return candidate;
          }
        }
        
        // If no good match by directory, try a proximity search on the directory structure
        let bestCandidate = null;
        let shortestDistance = Infinity;
        
        for (const candidate of candidates) {
          // Calculate a "distance" metric between import directory and candidate directory
          const importDirParts = importDir.split('/');
          const candidateDirParts = candidate.dir.split('/');
          let distance = Math.abs(importDirParts.length - candidateDirParts.length);
          
          // Add 1 for each different directory component
          for (let i = 0; i < Math.min(importDirParts.length, candidateDirParts.length); i++) {
            if (importDirParts[i] !== candidateDirParts[i]) {
              distance++;
            }
          }
          
          if (distance < shortestDistance) {
            shortestDistance = distance;
            bestCandidate = candidate;
          }
        }
        
        // If we found a best candidate with reasonable distance, use it
        if (bestCandidate && shortestDistance < 5) {
          return bestCandidate;
        }
        
        // If no good match by proximity, just use the first one
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
      
      // Skip node_modules imports and absolute imports
      if (importPath.startsWith('@') || 
          (!importPath.startsWith('.') && !importPath.includes('/')) ||
          importPath.startsWith('http')) {
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
        
        console.log(`Updated import in ${path.basename(filePath)}: ${importPath} -> ${newImportPath}`);
      }
    }
    
    // 2. Handle CSS imports: import './path/file.css'
    const cssImportRegex = /import\s+['"]([^'"]+\.css)['"]/g;
    
    // Reset regex lastIndex
    cssImportRegex.lastIndex = 0;
    
    while ((match = cssImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      const originalImport = match[0];
      
      // Skip node_modules imports and absolute imports
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
        
        console.log(`Updated CSS import in ${path.basename(filePath)}: ${importPath} -> ${newImportPath}`);
      }
    }
    
    // 3. Handle require statements: require('./path/file')
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    
    // Reset regex lastIndex
    requireRegex.lastIndex = 0;
    
    while ((match = requireRegex.exec(content)) !== null) {
      const importPath = match[1];
      const originalRequire = match[0];
      
      // Skip node_modules imports and absolute imports
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
        
        console.log(`Updated require in ${path.basename(filePath)}: ${importPath} -> ${newImportPath}`);
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
        
        console.log(`Updated CSS @import in ${path.basename(filePath)}: ${importPath} -> ${newImportPath}`);
      }
    }
    
    // 5. Handle dynamic imports: import('./path/file')
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    
    // Reset regex lastIndex
    dynamicImportRegex.lastIndex = 0;
    
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      const originalImport = match[0];
      
      // Skip node_modules imports and absolute imports
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
        
        // Replace the dynamic import statement
        const newImport = originalImport.replace(importPath, newImportPath);
        content = content.replace(originalImport, newImport);
        updated = true;
        
        console.log(`Updated dynamic import in ${path.basename(filePath)}: ${importPath} -> ${newImportPath}`);
      }
    }
    
    if (updated) {
      if (!options.dryRun) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✓ Updated imports in ${path.basename(filePath)}`);
      } else {
        console.log(`[DRY RUN] Would update imports in ${path.basename(filePath)}`);
      }
      return true;
    } else {
      logVerbose(`No imports updated in ${path.basename(filePath)}`);
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating imports in ${filePath}:`, error.message);
    return false;
  }
};

/**
 * Process files in dependency order based on layers from the report
 * @param {Object} layers - Dependency layers from the report
 * @param {Function} processor - Function to process each file
 * @param {string} projectRoot - Root path of the project
 */
const processInDependencyOrder = async (layers, processor, projectRoot) => {
  const totalLayers = Object.keys(layers).length;
  
  console.log(`Processing files in ${totalLayers} dependency layers...`);
  
  // Process files layer by layer
  for (let i = 0; i < totalLayers; i++) {
    const layerFiles = layers[i] || [];
    
    if (layerFiles.length > 0) {
      console.log(`\nProcessing layer ${i} (${layerFiles.length} files)...`);
      
      // Process all files in this layer
      const promises = layerFiles.map(file => {
        const filePath = path.join(projectRoot, file);
        return processor(filePath);
      });
      
      await Promise.all(promises);
    }
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
 * Create a restore script that can undo all the renaming
 * @param {string} projectRoot - Root path of the project
 * @param {Map} renamedFiles - Map of original filenames to prefixed filenames
 */
const createRestoreScript = async (projectRoot, renamedFiles) => {
  if (options.dryRun) {
    console.log('[DRY RUN] Would create restore-filenames.js script');
    return;
  }
  
  // Convert the renamed files map to a format suitable for the restore script
  const restoreEntries = [];
  
  for (const [oldPath, newPath] of renamedFiles.entries()) {
    // Only include renames for full paths, not basenames or filenames
    if (oldPath.includes('/') || oldPath.includes('\\')) {
      if (typeof newPath === 'string' && oldPath !== newPath) {
        restoreEntries.push({
          oldPath: path.relative(projectRoot, oldPath),
          newPath: path.relative(projectRoot, newPath)
        });
      }
    }
  }
  
// Create the restore script content
const scriptContent = `#!/usr/bin/env node
/**
* Script to restore original filenames by removing [A] and [I] prefixes
* Generated automatically by mark-active-files.js
*/

const fs = require('fs').promises;
const path = require('path');

// Helper function to check if a file exists
const fileExists = async (filePath) => {
 try {
   await fs.access(filePath);
   return true;
 } catch (error) {
   return false;
 }
};

// Renamed files registry (in reverse order for restoration)
const renamedFiles = ${JSON.stringify(restoreEntries, null, 2)};

// Function to restore a file to its original name
const restoreFile = async (newPath, oldPath) => {
 const projectRoot = process.cwd();
 const fullNewPath = path.join(projectRoot, newPath);
 const fullOldPath = path.join(projectRoot, oldPath);
 
 try {
   if (!await fileExists(fullNewPath)) {
     console.error(\`File not found: \${fullNewPath}\`);
     return false;
   }
   
   // Rename the file
   await fs.rename(fullNewPath, fullOldPath);
   console.log(\`✓ Restored \${newPath} to original name: \${oldPath}\`);
   return true;
 } catch (error) {
   console.error(\`Error restoring \${newPath}:\`, error.message);
   
   // Try alternative approach with copy and delete
   try {
     const content = await fs.readFile(fullNewPath, 'utf8');
     await fs.writeFile(fullOldPath, content, 'utf8');
     await fs.unlink(fullNewPath);
     console.log(\`✓ Restored \${newPath} to original name: \${oldPath} (using copy-and-delete)\`);
     return true;
   } catch (copyError) {
     console.error(\`Failed to restore using copy-and-delete:\`, copyError.message);
     return false;
   }
 }
};

// Function to update import statements in a file
const updateImportsInFile = async (filePath) => {
 try {
   if (!await fileExists(filePath)) {
     return false;
   }
   
   let content = await fs.readFile(filePath, 'utf8');
   let updated = false;
   
   // Simple pattern to replace prefixes in import statements
   const importPrefixPattern = /import\\s+(?:.+\\s+from\\s+)?['"](.+?\\/)?\\[(A|I)\\]_([^'"]+)['"]/g;
   content = content.replace(importPrefixPattern, (match, dir, prefix, name) => {
     updated = true;
     return match.replace(\`\${dir || ''}\${prefix === 'A' ? '[A]_' : '[I]_'}\${name}\`, \`\${dir || ''}\${name}\`);
   });
   
   // Handle CSS imports
   const cssImportPattern = /import\\s+['"](.+?\\/)?\\[(A|I)\\]_([^'"]+\\.css)['"]/g;
   content = content.replace(cssImportPattern, (match, dir, prefix, name) => {
     updated = true;
     return match.replace(\`\${dir || ''}\${prefix === 'A' ? '[A]_' : '[I]_'}\${name}\`, \`\${dir || ''}\${name}\`);
   });
   
   // Handle require statements
   const requirePrefixPattern = /require\\s*\\(\\s*['"](.+?\\/)?\\[(A|I)\\]_([^'"]+)['"]/g;
   content = content.replace(requirePrefixPattern, (match, dir, prefix, name) => {
     updated = true;
     return match.replace(\`\${dir || ''}\${prefix === 'A' ? '[A]_' : '[I]_'}\${name}\`, \`\${dir || ''}\${name}\`);
   });
   
   // Handle dynamic imports
   const dynamicImportPattern = /import\\s*\\(\\s*['"](.+?\\/)?\\[(A|I)\\]_([^'"]+)['"]/g;
   content = content.replace(dynamicImportPattern, (match, dir, prefix, name) => {
     updated = true;
     return match.replace(\`\${dir || ''}\${prefix === 'A' ? '[A]_' : '[I]_'}\${name}\`, \`\${dir || ''}\${name}\`);
   });
   
   // Handle CSS @import statements
   const cssAtImportPattern = /@import\\s+(?:url\\(['"]?(.+?\\/)?\\[(A|I)\\]_([^'")]+)['"]?\\)|['"](.+?\\/)?\\[(A|I)\\]_([^'"]+)['"]);/g;
   content = content.replace(cssAtImportPattern, (match, dir1, prefix1, name1, dir2, prefix2, name2) => {
     updated = true;
     if (dir1 !== undefined) {
       return match.replace(\`\${dir1}\${prefix1 === 'A' ? '[A]_' : '[I]_'}\${name1}\`, \`\${dir1}\${name1}\`);
     } else {
       return match.replace(\`\${dir2}\${prefix2 === 'A' ? '[A]_' : '[I]_'}\${name2}\`, \`\${dir2}\${name2}\`);
     }
   });
   
   if (updated) {
     await fs.writeFile(filePath, content, 'utf8');
     console.log(\`✓ Updated imports in \${filePath}\`);
     return true;
   }
   
   return false;
 } catch (error) {
   console.error(\`Error updating imports in \${filePath}:\`, error.message);
   return false;
 }
};

async function main() {
 try {
   console.log("Starting filename restoration...");
   
   // Process files in reverse order
   for (const entry of renamedFiles) {
     await restoreFile(entry.newPath, entry.oldPath);
   }
   
   // Update all import statements after renaming
   console.log("\\nUpdating import statements...");
   const allFiles = await require('glob').glob('./src/**/*.{js,jsx,ts,tsx,css}');
   
   for (const file of allFiles) {
     await updateImportsInFile(file);
   }
   
   console.log("\\nRestoration complete!");
   console.log("All [A] and [I] prefixes have been removed from filenames.");
 } catch (error) {
   console.error("Error restoring filenames:", error);
   process.exit(1);
 }
}

// Run the main function
main().catch(error => {
 console.error("Unhandled error:", error);
 process.exit(1);
});
`;

// Write the restore script to a file
  try {
    await fs.writeFile(path.join(projectRoot, 'restore-filenames.js'), scriptContent, 'utf8');
    // Make it executable on Unix-like systems
    try {
      await fs.chmod(path.join(projectRoot, 'restore-filenames.js'), 0o755);
    } catch (chmodError) {
      // Ignore chmod errors on Windows
      logVerbose(`Could not make restore script executable: ${chmodError.message}`);
    }
    console.log('✓ Created restore script: restore-filenames.js');
  } catch (error) {
    console.error('Error creating restore script:', error.message);
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
--force-rename    Force rename even if file is already correctly named
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
  const dependencyLayers = report.dependencyLayers || {};
  const importedBy = report.importedBy || {};
  
  if (!Array.isArray(activeFiles) || !Array.isArray(inactiveFiles)) {
    console.error('Error: Invalid report format. Missing or invalid activeFiles or inactiveFiles array.');
    process.exit(1);
  }
  
  // Track renamed files for import updates
  const renamedFiles = new Map();
  
  // Verify that index.js is in layer 0 and is active
  const indexLayer = Object.entries(dependencyLayers).find(([layer, files]) => 
    files.some(file => file.endsWith('src/index.js') || file.endsWith('src\\index.js'))
  );
  
  if (!indexLayer || indexLayer[0] !== '0') {
    console.warn('Warning: src/index.js is not in dependency layer 0. The report may be inconsistent.');
  }
  
  if (!activeFiles.some(file => file.endsWith('src/index.js') || file.endsWith('src\\index.js'))) {
    console.warn('Warning: src/index.js is not marked as active. The report may be inconsistent.');
  }
  
  // Create a full dependency layer map including both active and inactive files
  const allLayersMap = {};
  
  // First add files from the dependency layers (these are active files)
  for (const [layer, files] of Object.entries(dependencyLayers)) {
    allLayersMap[layer] = files;
  }
  
  // Add inactive files to the highest layer + 1
  const highestLayer = Math.max(...Object.keys(dependencyLayers).map(l => parseInt(l, 10)));
  allLayersMap[highestLayer + 1] = inactiveFiles;
  
  // Create a mapping function for active files
  const processActiveFile = async (filePath) => {
    // Skip renaming index.js as it's the fixed entry point
    if (filePath.endsWith('src/index.js') || filePath.endsWith('src\\index.js')) {
      console.log(`✓ Skipping entry point: ${filePath} (will not be renamed)`);
      return;
    }
    
    const result = await renameFile(filePath, 'active', projectRoot);
    if (result) {
      const oldRelativePath = path.relative(projectRoot, result.oldPath);
      const newRelativePath = path.relative(projectRoot, result.newPath);
      
      // Store the result in the rename map
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
    }
  };
  
  // Create a mapping function for inactive files
  const processInactiveFile = async (filePath) => {
    const result = await renameFile(filePath, 'inactive', projectRoot);
    if (result) {
      const oldRelativePath = path.relative(projectRoot, result.oldPath);
      const newRelativePath = path.relative(projectRoot, result.newPath);
      
      // Store the result in the rename map
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
    }
  };
  
  // Process active files in dependency order
  console.log('\nRenaming active files in dependency order...');
  
  // For each layer, process its files
  for (let i = 0; i <= highestLayer; i++) {
    const layerFiles = dependencyLayers[i] || [];
    if (layerFiles.length > 0) {
      console.log(`\nProcessing layer ${i} (${layerFiles.length} files)...`);
      
      // Process all files in this layer
      for (const file of layerFiles) {
        const filePath = path.join(projectRoot, file);
        await processActiveFile(filePath);
      }
    }
  }
  
  // Process inactive files
  console.log(`\nRenaming ${inactiveFiles.length} inactive files...`);
  await processBatchedFiles(inactiveFiles, async (file) => {
    const filePath = path.join(projectRoot, file);
    await processInactiveFile(filePath);
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
    
    // Update import statements in dependency order
    console.log('\nUpdating import statements in dependency order...');
    
    // Update imports for each layer in order
    for (let i = 0; i <= highestLayer + 1; i++) {
      const layerFiles = allLayersMap[i] || [];
      if (layerFiles.length > 0) {
        console.log(`\nUpdating imports in layer ${i} (${layerFiles.length} files)...`);
        
        // Process all files in this layer
        for (const file of layerFiles) {
          const filePath = path.join(projectRoot, file);
          // Add the prefixed name if the file was renamed
          const possiblyRenamedPath = path.join(
            path.dirname(filePath),
            renamedFiles.get(path.basename(filePath)) || path.basename(filePath)
          );
          
          // Try both the original and possibly renamed path
          if (await fileExists(possiblyRenamedPath)) {
            await updateImportsInFile(possiblyRenamedPath, renamedFiles, importedBy);
          } else if (await fileExists(filePath)) {
            await updateImportsInFile(filePath, renamedFiles, importedBy);
          } else {
            console.warn(`Warning: Neither ${filePath} nor ${possiblyRenamedPath} exists.`);
          }
        }
      }
    }
  } else {
    console.log('\nSkipping import updates (--skip-imports flag detected)');
  }
  
  // Create restore script
  await createRestoreScript(projectRoot, renamedFiles);
  
  // Count only files that were actually renamed
  let actuallyRenamedCount = 0;
  for (const [oldPath, newPath] of renamedFiles.entries()) {
    if (oldPath.includes('/') || oldPath.includes('\\')) {
      if (oldPath !== newPath) {
        actuallyRenamedCount++;
      }
    }
  }
  
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