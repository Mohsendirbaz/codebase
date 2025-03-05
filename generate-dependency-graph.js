#!/usr/bin/env node
/**
 * Script to generate a visual representation of the dependency graph
 * This script reads the active-files-report.json file and generates a dependency graph visualization
 * 
 * Optimized for better performance with:
 * - Asynchronous file operations
 * - Better error handling
 * - Command-line options
 * - Progress reporting
 * - Compatibility with optimized scripts
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const util = require('util');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  reportPath: args.find(arg => arg.startsWith('--report='))?.split('=')[1] || 'active-files-report.json',
  outputPath: args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'dependency-graph.html',
  verbose: args.includes('--verbose'),
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

// Function to generate a simple HTML visualization of the dependency graph
function generateHtmlVisualization(reportData) {
  console.log('Generating HTML visualization...');
  
  const { activeFiles, inactiveFiles, standaloneFiles, dependencyLayers, importedBy } = reportData;
  
  // Create a map of file paths to their base names for display
  const fileBaseNames = {};
  [...activeFiles, ...inactiveFiles].forEach(file => {
    fileBaseNames[file] = path.basename(file);
  });
  
  // Generate HTML for the dependency layers
  console.log('Processing dependency layers...');
  let layersHtml = '';
  const sortedLayers = Object.keys(dependencyLayers).sort((a, b) => parseInt(a) - parseInt(b));
  
  sortedLayers.forEach((layer, index) => {
    const files = dependencyLayers[layer];
    if (index % 5 === 0) {
      // Log progress every 5 layers
      console.log(`Processing layer ${index + 1}/${sortedLayers.length}...`);
    }
    
    layersHtml += `
      <div class="layer">
        <h3>Layer ${layer}</h3>
        <ul>
          ${files.map(file => {
            const isActive = activeFiles.includes(file);
            const isStandalone = standaloneFiles.includes(file);
            const className = isActive ? 'active' : 'inactive';
            const standaloneClass = isStandalone ? 'standalone' : '';
            return `<li class="${className} ${standaloneClass}" data-file="${file}">
              ${fileBaseNames[file]}
              ${isStandalone ? ' (Standalone)' : ''}
            </li>`;
          }).join('')}
        </ul>
      </div>
    `;
  });
  
  // Generate HTML for the file details section
  console.log('Processing file details...');
  let fileDetailsHtml = '';
  const sortedFiles = [...activeFiles, ...inactiveFiles].sort();
  
  sortedFiles.forEach((file, index) => {
    if (index % 100 === 0) {
      // Log progress every 100 files
      console.log(`Processing file ${index + 1}/${sortedFiles.length}...`);
    }
    
    const isActive = activeFiles.includes(file);
    const isStandalone = standaloneFiles.includes(file);
    const importers = importedBy[file] || [];
    
    fileDetailsHtml += `
      <div class="file-details" id="details-${file.replace(/[^a-zA-Z0-9]/g, '-')}">
        <h3>${file}</h3>
        <p>Status: <span class="${isActive ? 'active' : 'inactive'}">${isActive ? 'Active' : 'Inactive'}</span></p>
        ${isStandalone ? '<p>This is a standalone file (no further imports)</p>' : ''}
        <p>Imported by:</p>
        <ul>
          ${importers.length > 0 ? 
            importers.map(importer => `<li>${importer}</li>`).join('') : 
            '<li>No files import this file</li>'}
        </ul>
      </div>
    `;
  });
  
  // Generate the complete HTML
  console.log('Assembling final HTML...');
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dependency Graph Visualization</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3 {
      color: #444;
    }
    .container {
      display: flex;
      flex-wrap: wrap;
    }
    .layers-container {
      flex: 1;
      min-width: 300px;
      border-right: 1px solid #ccc;
      padding-right: 20px;
    }
    .details-container {
      flex: 2;
      min-width: 400px;
      padding-left: 20px;
    }
    .layer {
      margin-bottom: 20px;
      padding: 10px;
      background-color: #f9f9f9;
      border-radius: 5px;
    }
    .layer h3 {
      margin-top: 0;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .layer ul {
      list-style-type: none;
      padding: 0;
    }
    .layer li {
      padding: 5px 10px;
      margin: 5px 0;
      border-radius: 3px;
      cursor: pointer;
    }
    .active {
      background-color: #e6f7e6;
      border-left: 4px solid #4CAF50;
    }
    .inactive {
      background-color: #f7e6e6;
      border-left: 4px solid #F44336;
    }
    .standalone {
      font-style: italic;
    }
    .file-details {
      display: none;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 5px;
      margin-bottom: 15px;
    }
    .file-details h3 {
      margin-top: 0;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .summary {
      background-color: #f0f0f0;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .legend {
      display: flex;
      margin-bottom: 20px;
    }
    .legend-item {
      margin-right: 20px;
      display: flex;
      align-items: center;
    }
    .legend-color {
      width: 20px;
      height: 20px;
      margin-right: 5px;
      border-radius: 3px;
    }
    .search-container {
      margin-bottom: 20px;
    }
    #search-input {
      padding: 8px;
      width: 100%;
      max-width: 300px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>Dependency Graph Visualization</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Files: ${activeFiles.length + inactiveFiles.length}</p>
    <p>Active Files: ${activeFiles.length}</p>
    <p>Inactive Files: ${inactiveFiles.length}</p>
    <p>Standalone Files: ${standaloneFiles.length}</p>
    <p>Dependency Layers: ${Object.keys(dependencyLayers).length}</p>
  </div>
  
  <div class="legend">
    <div class="legend-item">
      <div class="legend-color active"></div>
      <span>Active File</span>
    </div>
    <div class="legend-item">
      <div class="legend-color inactive"></div>
      <span>Inactive File</span>
    </div>
  </div>
  
  <div class="search-container">
    <input type="text" id="search-input" placeholder="Search files...">
  </div>
  
  <div class="container">
    <div class="layers-container">
      <h2>Dependency Layers</h2>
      ${layersHtml}
    </div>
    
    <div class="details-container">
      <h2>File Details</h2>
      <p>Click on a file to see details</p>
      ${fileDetailsHtml}
    </div>
  </div>
  
  <script>
    // Add click event listeners to file items
    document.querySelectorAll('.layer li').forEach(item => {
      item.addEventListener('click', function() {
        // Hide all file details
        document.querySelectorAll('.file-details').forEach(detail => {
          detail.style.display = 'none';
        });
        
        // Show the selected file's details
        const file = this.getAttribute('data-file');
        const detailsId = 'details-' + file.replace(/[^a-zA-Z0-9]/g, '-');
        const detailsElement = document.getElementById(detailsId);
        if (detailsElement) {
          detailsElement.style.display = 'block';
        }
      });
    });
    
    // Add search functionality
    document.getElementById('search-input').addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      
      document.querySelectorAll('.layer li').forEach(item => {
        const fileName = item.textContent.toLowerCase();
        const filePath = item.getAttribute('data-file').toLowerCase();
        
        if (fileName.includes(searchTerm) || filePath.includes(searchTerm)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  </script>
</body>
</html>
  `;
}

async function main() {
  try {
    // Display help if requested
    if (options.help) {
      console.log(`
Usage: node generate-dependency-graph.js [options]

Options:
  --report=<path>   Path to the report file (default: active-files-report.json)
  --output=<path>   Path to the output HTML file (default: dependency-graph.html)
  --verbose         Display more detailed output
  --help, -h        Display this help message

Example:
  node generate-dependency-graph.js --report=custom-report.json --output=custom-graph.html --verbose
`);
      process.exit(0);
    }
    
    console.log('Generating dependency graph visualization...');
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
    let reportData;
    try {
      const reportContent = await fs.readFile(reportPath, 'utf8');
      reportData = JSON.parse(reportContent);
      logVerbose('Report file successfully parsed.');
    } catch (error) {
      console.error(`Error reading or parsing report file: ${error.message}`);
      process.exit(1);
    }
    
    // Check if the report has the required data
    if (!reportData.dependencyLayers || !reportData.importedBy) {
      console.error('Error: The report does not contain dependency layer information.');
      console.log('Please run the analysis again with the updated ESLint rule.');
      process.exit(1);
    }
    
    // Log some statistics
    console.log(`Found ${reportData.activeFiles.length} active files and ${reportData.inactiveFiles.length} inactive files.`);
    console.log(`Dependency layers: ${Object.keys(reportData.dependencyLayers).length}`);
    
    // Generate the HTML visualization
    const html = generateHtmlVisualization(reportData);
    
    // Write the HTML to a file
    const outputPath = path.join(projectRoot, options.outputPath);
    console.log(`Writing visualization to ${outputPath}...`);
    try {
      await fs.writeFile(outputPath, html, 'utf8');
      console.log(`Dependency graph visualization generated at: ${outputPath}`);
      console.log('Open this file in a web browser to view the visualization.');
    } catch (error) {
      console.error(`Error writing output file: ${error.message}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error generating dependency graph visualization:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});