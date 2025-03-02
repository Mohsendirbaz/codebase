#!/usr/bin/env node
/**
 * Workflow script to run the active files analysis, marking, and import updating in sequence
 * This ensures that all steps are performed in the correct order
 */

const { execSync } = require('child_process');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  verbose: args.includes('--verbose'),
  dryRun: args.includes('--dry-run'),
  help: args.includes('--help') || args.includes('-h')
};

// Display help if requested
if (options.help) {
  console.log(`
Usage: node run-active-files-workflow.js [options]

Options:
  --verbose         Display more detailed output
  --dry-run         Show what would be done without making changes
  --help, -h        Display this help message

Example:
  node run-active-files-workflow.js --verbose
`);
  process.exit(0);
}

console.log('Starting Active Files Workflow...');
console.log('This script will run the following steps in sequence:');
console.log('1. Run the active files analysis to generate the report');
console.log('2. Mark active files with [A]_ prefix and inactive files with [I]_ prefix');
console.log('3. Update import statements in all files to reference the renamed files');

// Build the command line arguments for the child processes
const cmdArgs = [];
if (options.verbose) cmdArgs.push('--verbose');
if (options.dryRun) cmdArgs.push('--dry-run');

try {
  // Step 1: Run the active files analysis
  console.log('\n=== Step 1: Running Active Files Analysis ===');
  console.log('Setting ANALYZE_ACTIVE_FILES=true to enable full analysis');
  
  // Set the environment variable for the analysis
  process.env.ANALYZE_ACTIVE_FILES = 'true';
  
  execSync(`node run-active-files-analysis.js ${cmdArgs.join(' ')}`, { 
    stdio: 'inherit',
    env: { ...process.env, ANALYZE_ACTIVE_FILES: 'true' }
  });
  
  // Step 2: Mark active files
  console.log('\n=== Step 2: Marking Active Files ===');
  execSync(`node mark-active-files.js ${cmdArgs.join(' ')}`, { stdio: 'inherit' });
  
  // Step 3: Update import statements (this is now integrated into mark-active-files.js)
  console.log('\n=== Step 3: Verifying Import Statements ===');
  console.log('Import statements are updated as part of the marking process.');
  console.log('If you need to update imports separately, you can run:');
  console.log('node update-imports.js');
  
  console.log('\nActive Files Workflow completed successfully!');
  console.log('Files have been renamed and import statements have been updated.');
  
  // Provide instructions for restoring original filenames
  console.log('\nTo restore original filenames, run:');
  console.log('node restore-filenames.js');
  
} catch (error) {
  console.error('\nError running Active Files Workflow:', error.message);
  process.exit(1);
}
