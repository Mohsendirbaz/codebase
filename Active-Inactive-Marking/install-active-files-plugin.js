#!/usr/bin/env node
/**
 * Installation script for the active-files-tracker ESLint plugin
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeCommand(command) {
  console.log(`Executing: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

// Ensure the plugin is properly linked
function linkPlugin() {
  try {
    // Unlink first in case it was previously linked
    execSync('npm unlink eslint-plugin-active-files', { stdio: 'ignore' });
    
    // Link the plugin
    execSync('cd eslint-plugin-active-files && npm link', { stdio: 'inherit' });
    execSync('npm link eslint-plugin-active-files', { stdio: 'inherit' });
    
    return true;
  } catch (error) {
    console.error('Error linking plugin:', error.message);
    return false;
  }
}

// Update npm scripts in package.json
function updatePackageJson() {
  try {
    const packageJsonPath = path.resolve('./package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add or update scripts
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['analyze-active-files'] = 'node ./run-active-files-analysis.js';
    packageJson.scripts['mark-active-files'] = 'node ./mark-active-files.js';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error updating package.json:', error.message);
    return false;
  }
}

function main() {
  console.log('Starting installation of active-files-tracker ESLint plugin...');
  
  // Check if the plugin directory exists
  const pluginPath = path.resolve('./eslint-plugin-active-files');
  if (!checkFileExists(pluginPath)) {
    console.error('Error: eslint-plugin-active-files directory not found.');
    console.log('Please make sure you are in the correct directory.');
    process.exit(1);
  }
  
  // Check if package.json exists
  const packageJsonPath = path.resolve('./package.json');
  if (!checkFileExists(packageJsonPath)) {
    console.error('Error: package.json not found.');
    console.log('Please make sure you are in the correct directory.');
    process.exit(1);
  }
  
  // Install plugin dependencies first
  console.log('Installing plugin dependencies...');
  if (!executeCommand('cd eslint-plugin-active-files && npm install')) {
    console.error('Error installing plugin dependencies.');
    process.exit(1);
  }
  
  // Install glob dependency for the analysis script
  console.log('Installing glob dependency...');
  if (!executeCommand('npm install glob --save-dev')) {
    console.error('Error installing glob dependency.');
    console.log('You may need to install it manually: npm install glob --save-dev');
  }
  
  // Link the plugin properly
  console.log('Linking the ESLint plugin...');
  if (!linkPlugin()) {
    console.error('Error linking the ESLint plugin.');
    process.exit(1);
  }
  
  // Update package.json scripts
  console.log('Updating package.json scripts...');
  if (!updatePackageJson()) {
    console.error('Error updating package.json scripts.');
    process.exit(1);
  }
  
  // Check if .eslintrc.js exists
  const eslintrcPath = path.resolve('./.eslintrc.js');
  if (!checkFileExists(eslintrcPath)) {
    console.log('Creating .eslintrc.js file...');
    const eslintrcContent = `module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: [
    "react",
    "active-files",
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "active-files/active-files-tracker": [
      "warn",
      {
        entryPoint: "src/index.js",
        activeMarker: "/* @active */",
        inactiveMarker: "/* @inactive */",
      },
    ],
  },
};`;
    
    try {
      fs.writeFileSync(eslintrcPath, eslintrcContent);
      console.log('.eslintrc.js file created successfully.');
    } catch (error) {
      console.error('Error creating .eslintrc.js file:', error.message);
      console.log('You may need to create it manually.');
    }
  }
  
  // Create VS Code settings directory if it doesn't exist
  const vscodeDir = path.resolve('./.vscode');
  if (!checkFileExists(vscodeDir)) {
    try {
      fs.mkdirSync(vscodeDir);
    } catch (error) {
      console.error('Error creating .vscode directory:', error.message);
    }
  }
  
  // Create a sample file to demonstrate the file naming convention
  const exampleDirPath = path.resolve('./example-files');
  if (!checkFileExists(exampleDirPath)) {
    try {
      fs.mkdirSync(exampleDirPath);
    } catch (error) {
      console.error('Error creating example-files directory:', error.message);
    }
  }
  
  // Create example files
  const activeExamplePath = path.resolve('./example-files/[A]_active-file-example.js');
  if (!checkFileExists(activeExamplePath)) {
    try {
      fs.writeFileSync(activeExamplePath, `// This is an example of an active file
// Notice the [A]_ prefix in the filename

import React from 'react';

function ActiveComponent() {
  return (
    <div>
      <h1>This is an active component</h1>
      <p>It's imported directly or indirectly from the entry point (index.js)</p>
    </div>
  );
}

export default ActiveComponent;
`);
      console.log('Active file example created successfully.');
    } catch (error) {
      console.error('Error creating active file example:', error.message);
    }
  }
  
  const inactiveExamplePath = path.resolve('./example-files/[I]_inactive-file-example.js');
  if (!checkFileExists(inactiveExamplePath)) {
    try {
      fs.writeFileSync(inactiveExamplePath, `// This is an example of an inactive file
// Notice the [I]_ prefix in the filename

import React from 'react';

function InactiveComponent() {
  return (
    <div>
      <h1>This is an inactive component</h1>
      <p>It's not imported from the entry point (index.js) or any active file</p>
    </div>
  );
}

export default InactiveComponent;
`);
      console.log('Inactive file example created successfully.');
    } catch (error) {
      console.error('Error creating inactive file example:', error.message);
    }
  }
  
  console.log('\nInstallation complete!');
  console.log('\nTo analyze your project and generate a report, run:');
  console.log('npm run analyze-active-files');
  
  console.log('\nTo rename files with [A]_ or [I]_ prefixes, run:');
  console.log('npm run mark-active-files');
  
  console.log('\nFor more information, see README-active-files.md');
}

main();
