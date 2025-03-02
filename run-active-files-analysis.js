#!/usr/bin/env node
/**
 * Script to run the active-files-tracker ESLint rule
 * This will analyze the project and generate a report file
 * 
 * This is the core script that initiates the dependency analysis process
 * starting from the entry point (index.js) and recursively tracing all imports
 * 
 * Optimized for better performance with:
 * - Asynchronous execution
 * - Better error handling
 * - Progress reporting
 * - Conditional execution with command-line flags
 */

const { ESLint } = require('eslint');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');

// Convert exec to a promise-based function
const execAsync = util.promisify(exec);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  skipRestore: args.includes('--skip-restore'),
  skipConfig: args.includes('--skip-config'),
  skipGraph: args.includes('--skip-graph'),
  skipMark: args.includes('--skip-mark'),
  forceRestore: args.includes('--force-restore'),
  verbose: args.includes('--verbose')
};

// Helper function to log verbose messages
const logVerbose = (message) => {
  if (options.verbose) {
    console.log(`[VERBOSE] ${message}`);
  }
};

// Helper function to execute a command with proper error handling
const runCommand = async (command, description) => {
  try {
    console.log(`\n${description}...`);
    const { stdout, stderr } = await execAsync(command);
    if (options.verbose && stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.warn(`Warning during ${description.toLowerCase()}:`);
      console.warn(stderr);
    }
    console.log(`✓ ${description} completed successfully.`);
    return true;
  } catch (error) {
    console.error(`Error during ${description.toLowerCase()}:`, error.message);
    if (options.verbose && error.stdout) {
      console.log(error.stdout);
    }
    if (error.stderr) {
      console.error(error.stderr);
    }
    return false;
  }
};

// Helper function to check if a file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error(`Error checking if file exists (${filePath}):`, error.message);
    return false;
  }
};

// Helper function to read and parse JSON file
const readJsonFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading JSON file (${filePath}):`, error.message);
    return null;
  }
};

async function main() {
  try {
    console.log('Starting active files analysis...');
    console.log('This will identify all files that are imported (directly or indirectly) from the entry point');
    
    if (options.verbose) {
      console.log('\nCommand line options:');
      console.log(JSON.stringify(options, null, 2));
    }
    
    // Check if the plugin is installed
    const pluginPath = path.resolve('./eslint-plugin-active-files');
    if (!fileExists(pluginPath)) {
      console.error('Error: eslint-plugin-active-files not found.');
      console.log('Please make sure the plugin is installed in the project directory.');
      process.exit(1);
    }
    
    // Restore original filenames before analysis if not skipped
    if (!options.skipRestore) {
      const restoreScriptPath = path.resolve('./restore-filenames.js');
      if (fileExists(restoreScriptPath)) {
        const restoreCommand = options.forceRestore 
          ? 'node restore-filenames.js --force' 
          : 'node restore-filenames.js';
        
        const restoreSuccess = await runCommand(
          restoreCommand, 
          'Restoring original filenames before analysis'
        );
        
        if (!restoreSuccess) {
          console.log('WARNING: Continuing with analysis, but results may be affected by unrestored filenames.');
        }
      } else {
        console.warn('WARNING: restore-filenames.js not found. Running analysis without restoration may lead to prefix accumulation.');
      }
    } else {
      console.log('Skipping filename restoration (--skip-restore flag detected)');
    }
    
    // Check if entry point exists
    const entryPoint = path.resolve('./src/index.js');
    if (!fileExists(entryPoint)) {
      console.error(`Error: Entry point file not found: ${entryPoint}`);
      console.log('Please make sure the entry point file exists.');
      process.exit(1);
    }
    
    console.log(`\nAnalyzing project starting from: ${entryPoint}`);
    console.log('This is the entry point from which all dependencies will be traced');
    
    // Set the environment variable to enable the analysis in the ESLint rule
    process.env.ANALYZE_ACTIVE_FILES = 'true';
    logVerbose('ANALYZE_ACTIVE_FILES environment variable set to true');
    
    // Create ESLint instance with overridden configuration to enable the rule
    const eslint = new ESLint({
      useEslintrc: true,
      overrideConfig: {
        rules: {
          // Temporarily set the rule to "warn" for analysis
          'active-files/active-files-tracker': [
            'warn', 
            { 
              entryPoint: 'src/index.js',
              silentMode: false // Explicitly disable silent mode for analysis
            }
          ]
        }
      }
    });
    
    console.log('\nRunning ESLint with active-files-tracker rule...');
    console.log('This will recursively trace all imports starting from index.js');
    
    // Run ESLint on the entry point to generate the report
    let results;
    try {
      results = await eslint.lintFiles([entryPoint]);
      logVerbose(`ESLint analysis completed with ${results.length} result(s)`);
    } catch (error) {
      console.error('Error running ESLint analysis:', error.message);
      process.exit(1);
    }
    
    // Process results
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);
    
    console.log('\nAnalysis Results:');
    console.log(resultText);
    
    // Check if the report file was generated
    const reportPath = path.resolve('./active-files-report.json');
    if (!fileExists(reportPath)) {
      console.error('Error: Report file was not generated.');
      process.exit(1);
    }
    
    // Read the report file
    const report = readJsonFile(reportPath);
    if (!report) {
      console.error('Error: Failed to parse the report file.');
      process.exit(1);
    }
    
    // Check if the report has the enhanced dependency information
    const hasEnhancedInfo = report.dependencyLayers && report.importedBy;
    
    console.log('\nSummary:');
    console.log(`Active files: ${report.activeFiles.length}`);
    console.log(`Inactive files: ${report.inactiveFiles.length}`);
    console.log(`Standalone files: ${report.standaloneFiles.length}`);
    console.log(`Total files: ${report.activeFiles.length + report.inactiveFiles.length}`);
    
    if (hasEnhancedInfo) {
      console.log(`Dependency layers: ${Object.keys(report.dependencyLayers).length}`);
      
      // Log some statistics about the dependency layers
      const layerCounts = {};
      Object.keys(report.dependencyLayers).forEach(layer => {
        layerCounts[layer] = report.dependencyLayers[layer].length;
      });
      
      console.log('\nFiles per dependency layer:');
      Object.keys(layerCounts).sort((a, b) => parseInt(a) - parseInt(b)).forEach(layer => {
        console.log(`  Layer ${layer}: ${layerCounts[layer]} files`);
      });
    }
    
    // Run additional steps in parallel for better performance
    const pendingTasks = [];
    
    // Update the ESLint configuration with the list of inactive files
    if (!options.skipConfig) {
      const updateConfigPath = path.resolve('./update-eslint-config.js');
      if (fileExists(updateConfigPath)) {
        pendingTasks.push(
          runCommand(
            'node update-eslint-config.js', 
            'Updating ESLint configuration with inactive files'
          )
        );
      }
    } else {
      console.log('\nSkipping ESLint configuration update (--skip-config flag detected)');
    }
    
    // Generate the dependency graph visualization if the script exists
    if (!options.skipGraph && hasEnhancedInfo) {
      const visualizationScriptPath = path.resolve('./generate-dependency-graph.js');
      if (fileExists(visualizationScriptPath)) {
        pendingTasks.push(
          runCommand(
            'node generate-dependency-graph.js', 
            'Generating dependency graph visualization'
          )
        );
      }
    } else {
      if (options.skipGraph) {
        console.log('\nSkipping dependency graph generation (--skip-graph flag detected)');
      } else if (!hasEnhancedInfo) {
        console.log('\nSkipping dependency graph generation (enhanced dependency information not available)');
      }
    }
    
    // Wait for all pending tasks to complete
    if (pendingTasks.length > 0) {
      console.log(`\nExecuting ${pendingTasks.length} additional tasks in parallel...`);
      await Promise.all(pendingTasks);
      console.log('All additional tasks completed.');
    }
    
    // Run the mark-active-files.js script (this should be run after all other tasks)
    if (!options.skipMark) {
      const markFilesPath = path.resolve('./mark-active-files.js');
      if (fileExists(markFilesPath)) {
        console.log('\nWould you like to rename files with [A]_ or [I]_ prefixes?');
        await runCommand(
          'node mark-active-files.js', 
          'Running mark-active-files.js to rename files'
        );
      }
    } else {
      console.log('\nSkipping file marking (--skip-mark flag detected)');
    }
    
    console.log('\nAnalysis complete!');
    console.log('Report file generated at active-files-report.json');
    console.log('\nTo restore original filenames, run:');
    console.log('node restore-filenames.js');
    
  } catch (error) {
    console.error('Error running analysis:', error);
    process.exit(1);
  }
}

// Display help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node run-active-files-analysis.js [options]

Options:
  --skip-restore    Skip restoring original filenames before analysis
  --skip-config     Skip updating ESLint configuration
  --skip-graph      Skip generating dependency graph visualization
  --skip-mark       Skip marking files with [A]_ or [I]_ prefixes
  --force-restore   Use force mode when restoring filenames
  --verbose         Display more detailed output
  --help, -h        Display this help message

Example:
  node run-active-files-analysis.js --skip-mark --verbose
`);
  process.exit(0);
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
