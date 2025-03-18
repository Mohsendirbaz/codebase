#!/usr/bin/env node
/**
 * Script to update the ESLint configuration with the list of inactive files
 * This script reads the active-files-report.json file and updates the .eslintrc.js file
 * to silence ESLint warnings for inactive files
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

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  reportPath: args.find(arg => arg.startsWith('--report='))?.split('=')[1] || 'active-files-report.json',
  configPath: args.find(arg => arg.startsWith('--config='))?.split('=')[1] || '.eslintrc.js',
  verbose: args.includes('--verbose'),
  help: args.includes('--help') || args.includes('-h'),
  dryRun: args.includes('--dry-run')
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

async function main() {
  try {
    // Display help if requested
    if (options.help) {
      console.log(`
Usage: node update-eslint-config.js [options]

Options:
  --report=<path>   Path to the report file (default: active-files-report.json)
  --config=<path>   Path to the ESLint config file (default: .eslintrc.js)
  --verbose         Display more detailed output
  --dry-run         Show what would be done without making changes
  --help, -h        Display this help message

Example:
  node update-eslint-config.js --report=custom-report.json --config=custom-eslintrc.js --verbose
`);
      process.exit(0);
    }
    
    console.log('Updating ESLint configuration with inactive files...');
    logVerbose(`Options: ${JSON.stringify(options, null, 2)}`);
    
    // Resolve file paths
    const projectRoot = process.cwd();
    const reportPath = path.resolve(projectRoot, options.reportPath);
    const eslintConfigPath = path.resolve(projectRoot, options.configPath);
    
    logVerbose(`Report path: ${reportPath}`);
    logVerbose(`ESLint config path: ${eslintConfigPath}`);
    
    // Check if the report file exists
    if (!await fileExists(reportPath)) {
      console.error(`Error: Report file not found: ${reportPath}`);
      console.log('Please run the analysis first using "npm run analyze-active-files".');
      process.exit(1);
    }
    
    // Check if the ESLint config file exists
    if (!await fileExists(eslintConfigPath)) {
      console.error(`Error: ESLint config file not found: ${eslintConfigPath}`);
      process.exit(1);
    }
    
    // Read and parse the report file
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
    
    console.log(`Found ${activeFiles.length} active files and ${inactiveFiles.length} inactive files in the report.`);
    
    // Read the ESLint configuration file
    console.log(`Reading ESLint configuration from ${eslintConfigPath}...`);
    let eslintConfigContent;
    try {
      eslintConfigContent = await fs.readFile(eslintConfigPath, 'utf8');
      logVerbose('ESLint configuration file successfully read.');
    } catch (error) {
      console.error(`Error reading ESLint configuration file: ${error.message}`);
      process.exit(1);
    }
    
    // Normalize file paths to use forward slashes to avoid escape sequence issues
    console.log('Normalizing file paths...');
    const normalizedInactiveFiles = inactiveFiles.map(file => file.replace(/\\/g, '/'));
    
    // Filter out any active files that might be in the inactive files list
    // This ensures active files take precedence over inactive files
    console.log('Filtering out active files from inactive files list...');
    const normalizedActiveFiles = activeFiles.map(file => file.replace(/\\/g, '/'));
    const filteredInactiveFiles = normalizedInactiveFiles.filter(file => !normalizedActiveFiles.includes(file));
    
    console.log(`After filtering out active files, ${filteredInactiveFiles.length} inactive files remain.`);
    
    // If there are no inactive files after filtering, use a default pattern
    // This prevents ESLint configuration errors with empty files array
    const filesToUse = filteredInactiveFiles.length > 0 
      ? filteredInactiveFiles 
      : ["**/[I]_*.{js,jsx,ts,tsx}"]; // Default pattern for inactive files
    
    // Create the overrides section with the list of inactive files
    console.log('Creating ESLint overrides section...');
    
    // For large lists, log progress
    if (filesToUse.length > 100) {
      console.log(`Processing ${filesToUse.length} files for ESLint overrides...`);
      // Log progress every 100 files
      for (let i = 0; i < filesToUse.length; i += 100) {
        if (i > 0) {
          console.log(`Processed ${i}/${filesToUse.length} files...`);
        }
      }
    }
    
    const overridesSection = `
  // Override rules for inactive files to silence warnings
  overrides: [
    {
      // Files identified as inactive by the active-files-tracker rule
      files: [
        ${filesToUse.map(file => `"${file}"`).join(',\n        ')}
      ],
      rules: {
        // Silence all rules for inactive files
        "no-unused-vars": "off",
        "react/prop-types": "off",
        "react/react-in-jsx-scope": "off",
        "no-case-declarations": "off",
        "react/no-unescaped-entities": "off",
        "no-useless-catch": "off",
        "no-undef": "off",
        "no-empty": "off",
        // Disable all other potential warnings
        "import/no-unresolved": "off",
        "import/named": "off",
        "import/namespace": "off",
        "import/default": "off",
        "import/export": "off"
      }
    }
  ]`;
    
    // Replace the existing overrides section or add it if it doesn't exist
    console.log('Updating ESLint configuration...');
    let updatedEslintConfigContent;
    
    if (eslintConfigContent.includes('overrides:')) {
      // Replace the existing overrides section
      updatedEslintConfigContent = eslintConfigContent.replace(
        /\s*\/\/\s*Override rules for inactive files[\s\S]*?overrides:\s*\[\s*\{[\s\S]*?\}\s*\]/,
        overridesSection
      );
    } else {
      // Add the overrides section before the closing brace
      updatedEslintConfigContent = eslintConfigContent.replace(
        /\};?\s*$/,
        `,${overridesSection}\n};`
      );
    }
    
    // Check if the content was actually updated
    if (eslintConfigContent === updatedEslintConfigContent) {
      console.warn('Warning: ESLint configuration was not updated. The overrides section may not have been found or replaced correctly.');
    }
    
    // Write the updated ESLint configuration if not in dry run mode
    if (options.dryRun) {
      console.log('Dry run mode: Not writing changes to ESLint configuration.');
      if (options.verbose) {
        console.log('Updated ESLint configuration would be:');
        console.log(updatedEslintConfigContent);
      }
    } else {
      console.log(`Writing updated ESLint configuration to ${eslintConfigPath}...`);
      try {
        await fs.writeFile(eslintConfigPath, updatedEslintConfigContent, 'utf8');
        console.log('ESLint configuration updated successfully.');
      } catch (error) {
        console.error(`Error writing ESLint configuration file: ${error.message}`);
        process.exit(1);
      }
    }
    
    console.log('Inactive files will now have ESLint warnings silenced.');
    
  } catch (error) {
    console.error('Error updating ESLint configuration:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
