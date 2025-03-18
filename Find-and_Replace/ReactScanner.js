const fs = require('fs');
const path = require('path');

// === Configuration: Set parameters ===
const DESTINATION_DIRECTORY = path.resolve(
  'C:/Users/md8w7/OneDrive University of Missouri/Desktop/ImportantFiles/Milestone4/src'
);
const MODULE_NAMES = ["repaymentPercentageOfRevenueAmount2", "KeyAmount2", "KeyAmount3"]; // Search phrases
const EXCLUDED_PHRASES = ['ReactScanner', 'ID_Replace_React', 'ID_Replace_React_Final']; // Excluded files
const SKIP_FOLDERS = ['node_modules', 'dist', 'build']; // List of folders to skip

// === New Configuration: Specific targets ===
const SPECIFIC = false; // Set this to true to enable specific file matching
const SPECIFIC_TARGET_FILES = ["example1.js", "example2.js"]; // List of specific files to search

// === Log file path inside the destination directory ===
const logFilePath = path.join(DESTINATION_DIRECTORY, 'ID_Scan_React.log');

// Store matches and tracking found phrases
const matches = [];
const foundPhrases = new Set(); // Track found phrases for summary

// Generate regex patterns for each search term (case-insensitive matching)
const generateRegexPatterns = (moduleNames) => {
  return moduleNames.map((name) => new RegExp(name, 'i')); // Case-insensitive
};

// Initialize the log file by clearing old content
const initializeLogFile = () => {
  try {
    fs.writeFileSync(logFilePath, '', 'utf-8'); // Clear previous content
    console.log(`Log file initialized: ${logFilePath}`);
  } catch (error) {
    console.error(`Failed to initialize log file: ${error.message}`);
    process.exit(1);
  }
};

// Helper function to log a match with details
const logMatch = (moduleName, file, lineNumber, lineContent) => {
  const relativePath = path.relative(DESTINATION_DIRECTORY, file);
  matches.push({
    component: moduleName,
    file: relativePath,
    line: lineNumber,
    content: lineContent.trim(),
  });
  foundPhrases.add(moduleName); // Track found phrase
};

// Helper function to exclude files based on excluded phrases
const isExcludedFile = (filename) => {
  return EXCLUDED_PHRASES.some((phrase) =>
    filename.toLowerCase().includes(phrase.toLowerCase())
  );
};

// Helper function to skip certain folders
const shouldSkipFolder = (folderName) => {
  return SKIP_FOLDERS.includes(folderName);
};

// Recursive function to walk through directories and search .js files
const walkDirectory = (dir, patterns) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (shouldSkipFolder(file)) {
        console.log(`Skipping folder: ${file}`);
        continue; // Skip this folder
      }
      walkDirectory(fullPath, patterns); // Recursively search subdirectories
    } else if (file.endsWith('.js') && !isExcludedFile(file)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        // Search each line for each pattern
        lines.forEach((line, index) => {
          patterns.forEach((pattern, i) => {
            if (pattern.test(line)) {
              logMatch(MODULE_NAMES[i], fullPath, index + 1, line); // Log match details
            }
          });
        });
      } catch (error) {
        console.error(`Could not read ${fullPath}: ${error.message}`);
      }
    }
  }
};

// Function to scan specific files only
const scanSpecificFiles = (files, patterns) => {
  files.forEach((specificFile) => {
    const fullPath = path.join(DESTINATION_DIRECTORY, specificFile);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        // Search each line for each pattern
        lines.forEach((line, index) => {
          patterns.forEach((pattern, i) => {
            if (pattern.test(line)) {
              logMatch(MODULE_NAMES[i], fullPath, index + 1, line); // Log match details
            }
          });
        });
      } catch (error) {
        console.error(`Could not read ${fullPath}: ${error.message}`);
      }
    } else {
      console.log(`File not found: ${specificFile}`);
    }
  });
};

// Main function to execute the search and log results
const findReactMatches = () => {
  initializeLogFile(); // Clear previous content from the log file

  const patterns = generateRegexPatterns(MODULE_NAMES); // Generate regex patterns

  if (SPECIFIC) {
    scanSpecificFiles(SPECIFIC_TARGET_FILES, patterns); // Scan specific files only
  } else {
    walkDirectory(DESTINATION_DIRECTORY, patterns); // Start the recursive search
  }

  // Prepare the brief summary on missing phrases
  const notFoundPhrases = MODULE_NAMES.filter(
    (name) => !foundPhrases.has(name)
  );
  const summaryHeader = `=== Summary of Matches ===\n\n`;
  const missingPhrasesInfo = notFoundPhrases.length
    ? `The following phrases were not found: ${notFoundPhrases.join(', ')}.\n\n`
    : 'All target phrases were found.\n\n';

  // Prepare the tabulated results
  const tableHeader =
    `| # | Component/Phrase | File Path | Line | Content |\n` +
    `|---|-----------------|-----------|------|---------|\n`;

  const tableRows = matches
    .map(
      (match, index) =>
        `| ${index + 1} | ${match.component} | ${match.file} | ${match.line} | ${match.content} |`
    )
    .join('\n');

  const summaryContent =
    matches.length > 0 ? tableHeader + tableRows : 'No matches found.\n';

  // Write the full summary and results to the log file
  fs.writeFileSync(
    logFilePath,
    summaryHeader + missingPhrasesInfo + summaryContent,
    'utf-8'
  );

  console.log(`Search completed. Results are logged in: ${logFilePath}`);
};

// Execute the search
findReactMatches();
