const fs = require('fs');
const path = require('path');

// === Configuration: Set parameters ===
const DESTINATION_DIRECTORY = path.resolve(
  'C:/Users/md8w7/OneDrive University of Missouri/Desktop/ImportantFiles/Milestone4/src'
);
const MODULE_NAMES = ["KeyAmount1", "KeyAmount2", "KeyAmount3"]; // Search phrases
const REPLACEMENT_PHRASES = ["NewKeyAmount1", "NewKeyAmount2", "NewKeyAmount3"]; // Replacement phrases
const EXCLUDED_PHRASES = ['ReactScanner', 'ID_Replace_React', 'ID_Replace_React_Final']; // Excluded files

// New: Specific search configuration
const SPECIFIC = true; // Set to true for specific search
const SPECIFIC_TARGET_FILES = ["example1.js", "example2.js"]; // List of specific files to search

// Log file path inside the destination directory
const logFilePath = path.join(DESTINATION_DIRECTORY, 'ID_Replace_React.log');

// Store matches and tracking
const matches = [];
const foundPhrases = new Set(); // Track found phrases
const fileUpdates = new Map(); // Track changes per file
let totalFilesProcessed = 0; // Track total number of files processed

// Generate regex patterns for each search term
const generateRegexPatterns = (moduleNames) => {
  return moduleNames.map((name) => new RegExp(name, 'i')); // Case-insensitive regex
};

// Initialize log file
const initializeLogFile = () => {
  try {
    fs.writeFileSync(logFilePath, '', 'utf-8'); // Clear previous content
    console.log(`Log file initialized: ${logFilePath}`);
  } catch (error) {
    console.error(`Failed to initialize log file: ${error.message}`);
    process.exit(1);
  }
};

// Helper to log matches
const logMatch = (moduleName, file, lineNumber, lineContent, replacement) => {
  const relativePath = path.relative(DESTINATION_DIRECTORY, file);
  const updatedContent = lineContent.replace(new RegExp(moduleName, 'gi'), replacement);
  matches.push({
    component: moduleName,
    replacement: replacement,
    file: relativePath,
    line: lineNumber,
    content: updatedContent.trim(),
  });
  foundPhrases.add(moduleName);
  fileUpdates.set(file, (fileUpdates.get(file) || []).concat([updatedContent]));
};

// Helper to exclude files
const isExcludedFile = (filename) => {
  return EXCLUDED_PHRASES.some((phrase) =>
    filename.toLowerCase().includes(phrase.toLowerCase())
  );
};

// Helper to check if a file is in the specific target list
const isSpecificTarget = (file) => {
  return SPECIFIC ? SPECIFIC_TARGET_FILES.includes(file) : true;
};

// Recursive directory walker
const walkDirectory = (dir, patterns) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkDirectory(fullPath, patterns); // Recursively search subdirectories
    } else if (file.endsWith('.js') && !isExcludedFile(file) && isSpecificTarget(file)) {
      totalFilesProcessed++; // Increment total files processed
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        const updatedLines = lines.slice(); // Copy original lines for updates

        // Search each line for matches
        lines.forEach((line, index) => {
          patterns.forEach((pattern, i) => {
            if (pattern.test(line)) {
              updatedLines[index] = line.replace(pattern, REPLACEMENT_PHRASES[i]);
              logMatch(MODULE_NAMES[i], fullPath, index + 1, line, REPLACEMENT_PHRASES[i]);
            }
          });
        });

        // Save updated file if changes were made
        if (fileUpdates.has(fullPath)) {
          const updatedContent = updatedLines.join('\n');
          const updateCount = fileUpdates.get(fullPath).length;
          const newFileName = path.basename(fullPath, '.js') + `_updated_${updateCount}.js`;
          const newPath = path.join(path.dirname(fullPath), newFileName);
          fs.writeFileSync(newPath, updatedContent, 'utf-8');
          console.log(`Updated file saved: ${newPath}`);
        }
      } catch (error) {
        console.error(`Could not read ${fullPath}: ${error.message}`);
      }
    }
  }
};

// Main function to execute the search and log results
const findReactMatches = () => {
  initializeLogFile(); // Clear previous content from the log file

  const patterns = generateRegexPatterns(MODULE_NAMES); // Generate regex patterns
  walkDirectory(DESTINATION_DIRECTORY, patterns); // Start recursive search

  // Prepare summary of missing phrases
  const notFoundPhrases = MODULE_NAMES.filter((name) => !foundPhrases.has(name));
  const summaryHeader = `=== Summary of Matches ===\n\n`;
  const missingPhrasesInfo = notFoundPhrases.length
    ? `The following phrases were not found: ${notFoundPhrases.join(', ')}.\n\n`
    : 'All target phrases were found.\n\n';

  // Tabulate results
  const tableHeader =
    `| # | Component/Phrase | Replacement | File Path | Line | Updated Content |\n` +
    `|---|-----------------|-------------|-----------|------|-----------------|\n`;

  const tableRows = matches
    .map(
      (match, index) =>
        `| ${index + 1} | ${match.component} | ${match.replacement} | ${match.file} | ${match.line} | ${match.content} |`
    )
    .join('\n');

  const summaryContent = matches.length > 0 ? tableHeader + tableRows : 'No matches found.\n';
  const totalFilesInfo = `\nTotal Files Processed: ${totalFilesProcessed}\n`;

  // Write summary and results to the log file
  fs.writeFileSync(
    logFilePath,
    summaryHeader + missingPhrasesInfo + summaryContent + totalFilesInfo,
    'utf-8'
  );

  console.log(`Search completed. Results are logged in: ${logFilePath}`);
};

// Execute the search
findReactMatches();
