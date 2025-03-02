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
const glob = require('glob');
const util = require('util');

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
 * Systematically analyzes and cleans import paths with prefixes
 * This function handles all types of prefixes in a consistent way
 * @param {string} importPath - The import path to clean
 * @returns {string} - The cleaned import path
 */
const cleanImportPath = (importPath) => {
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
  
  // Try each known pattern
  for (const { pattern, replacement } of knownPatterns) {
    if (pattern.test(importPath)) {
      return importPath.replace(pattern, replacement);
    }
  }
  
  // If no known pattern matched, proceed with systematic cleaning
  // Split the path into segments for systematic processing
  const segments = importPath.split('/');
  
  // Process each segment individually using a systematic approach
  const processedSegments = segments.map(segment => {
    // Skip segments without prefixes
    if (!segment.includes('[A]_') && !segment.includes('[I]_')) {
      return segment;
    }
    
    // Step 1: Normalize any duplicate or mixed prefixes
    let normalizedSegment = segment;
    
    // Handle duplicate prefixes ([A]_[A]_ or [I]_[I]_)
    normalizedSegment = normalizedSegment.replace(/\[(A|I)\]_\[(A|I)\]_/g, (match) => {
      return match.includes('[A]') ? '[A]_' : '[I]_';
    });
    
    // Handle mixed prefixes ([A]_[I]_ or [I]_[A]_) - active always takes precedence
    normalizedSegment = normalizedSegment.replace(/\[A\]_\[I\]_|\[I\]_\[A\]_/g, '[A]_');
    
    // Step 2: Identify the structure of the segment
    // This helps us determine if the prefix is at the beginning, middle, or part of a nested structure
    
    // Case 1: Prefix at the beginning (most common case)
    if (normalizedSegment.match(/^\[(A|I)\]_/)) {
      return normalizedSegment.replace(/^\[(A|I)\]_/, '');
    }
    
    // Case 2: Prefix in the middle of a complete name
    // We need to ensure we're matching a complete name, not a partial one
    const middlePrefixMatch = normalizedSegment.match(/^(.+?)\[(A|I)\]_(.+)$/);
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
    const nestedMatch = normalizedSegment.match(/^(.+?)[._/](\[(A|I)\]_.+)$/);
    if (nestedMatch) {
      const [_, basePart, prefixedPart] = nestedMatch;
      // Recursively clean the prefixed part
      const cleanedPrefixedPart = cleanImportPath(prefixedPart);
      return basePart + '.' + cleanedPrefixedPart;
    }
    
    // If we couldn't determine a specific case, return the segment as is
    return normalizedSegment;
  });
  
  // Rejoin the segments to form the cleaned path
  return processedSegments.join('/');
};

// Function to update imports in a file after renaming
const updateImportsInFile = async (filePath, renamedFiles) => {
  try {
    if (!await fileExists(filePath)) {
      return false;
    }
    
    let content = await fs.readFile(filePath, 'utf8');
    let updated = false;
    
    // First, build a map of file status (active or inactive)
    const fileStatusMap = new Map();
    for (const [oldPath, newPath] of renamedFiles) {
      // Determine if the file is active or inactive based on its new name
      const isActive = path.basename(newPath).startsWith('[A]_');
      fileStatusMap.set(oldPath, isActive);
    }
    
    // Update import statements to reflect renamed files
    for (const [oldRelativePath, newRelativePath] of renamedFiles) {
      // Skip if the paths are the same
      if (oldRelativePath === newRelativePath) continue;
      
      const oldImportPath = oldRelativePath.replace(/\\/g, '/');
      const newImportPath = newRelativePath.replace(/\\/g, '/');
      
      // Extract directory and filename parts
      const oldDir = path.dirname(oldImportPath);
      const oldFileName = path.basename(oldImportPath, path.extname(oldImportPath));
      const oldExt = path.extname(oldImportPath);
      
      const newDir = path.dirname(newImportPath);
      const newFileName = path.basename(newImportPath);
      
      // Determine if the file is active or inactive
      const isActive = newFileName.startsWith('[A]_');
      const prefix = isActive ? '[A]_' : '[I]_';
      
      // For import paths, we need to add the prefix to the filename part
      // but keep the directory structure the same
      if (filePath.toLowerCase().endsWith('.css')) {
        // Handle CSS @import statements: @import url('./path/file.css')
        const cssAtImportRegex = new RegExp(`@import\\s+url\\(['"](\\.\\./|\\./)?${oldDir !== '.' ? oldDir + '/' : ''}(${oldFileName})(${oldExt}['"]\\))`, 'g');
        content = content.replace(cssAtImportRegex, (match, leadingDots, fileName, ext) => {
          const dots = leadingDots || './';
          const dir = oldDir !== '.' ? oldDir + '/' : '';
          updated = true;
          return `@import url('${dots}${dir}${prefix}${fileName}${ext}`;
        });
        
        // Handle CSS @import statements without url(): @import './path/file.css'
        const cssAtImportNoUrlRegex = new RegExp(`@import\\s+['"](\\.\\./|\\./)?${oldDir !== '.' ? oldDir + '/' : ''}(${oldFileName})(${oldExt}['"])`, 'g');
        content = content.replace(cssAtImportNoUrlRegex, (match, leadingDots, fileName, ext) => {
          const dots = leadingDots || './';
          const dir = oldDir !== '.' ? oldDir + '/' : '';
          updated = true;
          return `@import '${dots}${dir}${prefix}${fileName}${ext}`;
        });
      } else {
        // JS/TS files
        
        // Replace import statements - handle both ES6 imports and CSS imports
        // ES6 imports: import X from './path/file'
        const importRegex = new RegExp(`from\\s+['"](\\.\\./|\\./)?${oldDir !== '.' ? oldDir + '/' : ''}(${oldFileName})(['"])`, 'g');
        content = content.replace(importRegex, (match, leadingDots, fileName, quote) => {
          const dots = leadingDots || './';
          const dir = oldDir !== '.' ? oldDir + '/' : '';
          updated = true;
          return `from '${dots}${dir}${prefix}${fileName}${quote}`;
        });
        
        // CSS imports: import './path/file.css'
        const cssImportRegex = new RegExp(`import\\s+['"](\\.\\./|\\./)?${oldDir !== '.' ? oldDir + '/' : ''}(${oldFileName})(${oldExt}['"])`, 'g');
        content = content.replace(cssImportRegex, (match, leadingDots, fileName, ext) => {
          const dots = leadingDots || './';
          const dir = oldDir !== '.' ? oldDir + '/' : '';
          updated = true;
          return `import '${dots}${dir}${prefix}${fileName}${ext}`;
        });
        
        // Handle require statements: require('./path/file')
        const requireRegex = new RegExp(`require\\s*\\(['"](\\.\\./|\\./)?${oldDir !== '.' ? oldDir + '/' : ''}(${oldFileName})(['"])\\)`, 'g');
        content = content.replace(requireRegex, (match, leadingDots, fileName, quote) => {
          const dots = leadingDots || './';
          const dir = oldDir !== '.' ? oldDir + '/' : '';
          updated = true;
          return `require('${dots}${dir}${prefix}${fileName}${quote})`;
        });
      }
    }
    
    // Special handling for L_1_HomePage.CSS imports
    const l1HomePageCssRegex = /import\s+['"]\.\/L_1_HomePage\.CSS\/([^'"]+)['"]|from\s+['"]\.\/L_1_HomePage\.CSS\/([^'"]+)['"]/g;
    let match;
    while ((match = l1HomePageCssRegex.exec(content)) !== null) {
      const cssFile = match[1] || match[2];
      if (!cssFile.startsWith('[A]_') && !cssFile.startsWith('[I]_')) {
        // Determine if this CSS file is active or inactive
        // For simplicity, we'll mark all CSS files as active
        const prefix = '[A]_';
        const newImport = match[0].replace(`./L_1_HomePage.CSS/${cssFile}`, `./L_1_HomePage.CSS/${prefix}${cssFile}`);
        content = content.replace(match[0], newImport);
        updated = true;
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
        renamedFiles.set(file, path.relative(projectRoot, result.newPath));
      }
    });
    
    // Rename inactive files
    console.log(`\nRenaming ${inactiveFiles.length} inactive files...`);
    await processBatchedFiles(inactiveFiles, async (file) => {
      const filePath = path.join(projectRoot, file);
      const result = await renameFile(filePath, 'inactive', projectRoot);
      if (result) {
        renamedFiles.set(file, path.relative(projectRoot, result.newPath));
      }
    });
    
    // Update imports in all files to reflect the renamed files
    if (!options.skipImports) {
      console.log('\nUpdating import statements...');
      const allFiles = await globAsync('./src/**/*.{js,jsx,ts,tsx,css}', { ignore: ['**/node_modules/**'] });
      console.log(`Found ${allFiles.length} files to check for import updates`);
      
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