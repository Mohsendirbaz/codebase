# Active Files Tracking System Usage Guide

This guide explains how to use the Active Files Tracking System to identify active and inactive files in your React project, visualize the dependency structure, and manage your codebase more effectively.

## Core Concepts

The Active Files Tracking System is built around these key concepts:

1. **Entry Point Tracing**: The system identifies `index.js` as the entry point and recursively traces all imports to build a complete dependency graph.

2. **Active vs. Inactive Files**: Files that are imported (directly or indirectly) from the entry point are considered "active". Files that exist in the project but are not imported from the entry point are considered "inactive".

3. **Standalone Files**: Files that don't import any other files are classified as "standalone" or "leaf nodes" in the dependency tree.

4. **Dependency Layers**: Files are categorized into layers based on their distance from the entry point, providing a clear visualization of the project structure.

## Installation

The Active Files Tracking System is already installed in your project. If you need to reinstall it, run:

```bash
npm run install-active-files-plugin
```

## Usage

### Analyzing Your Project

To analyze your project and generate a report of active and inactive files:

```bash
npm run analyze-active-files
```

This command:
1. Restores any previously renamed files to their original names
2. Runs the ESLint rule to analyze the project
3. Generates a report file (`active-files-report.json`)

### Visualizing the Dependency Graph

To generate a visual representation of your project's dependency graph:

```bash
npm run generate-dependency-graph
```

This creates an HTML file (`dependency-graph.html`) that you can open in any web browser to explore:
- Files organized by dependency layers
- Active and inactive file status
- Standalone files
- Which files import each file

For a one-step process to analyze and visualize:

```bash
npm run analyze-and-visualize
```

### Marking Files with Prefixes

To rename your files with prefixes that indicate their status:

```bash
npm run mark-active-files
```

This will:
- Rename active files with the `[A]_` prefix (e.g., `App.js` → `[A]_App.js`)
- Rename inactive files with the `[I]_` prefix (e.g., `UnusedComponent.js` → `[I]_UnusedComponent.js`)
- Update import statements in all files to reflect the new filenames

### Restoring Original Filenames

To restore files to their original names:

```bash
npm run restore-filenames
```

For a more aggressive restoration that handles edge cases:

```bash
npm run restore-filenames:force
```

### Development Workflow

For normal development without analysis:

```bash
npm start
# or
npm run dev
```

To start the development server with analysis:

```bash
npm run start:with-analysis
```

## Understanding the Report

The `active-files-report.json` file contains:

- `activeFiles`: Files that are imported (directly or indirectly) from the entry point
- `inactiveFiles`: Files that exist in the project but are not imported from the entry point
- `standaloneFiles`: Files that don't import any other files
- `dependencyLayers`: Files categorized by their distance from the entry point
- `importedBy`: For each file, a list of files that import it

## Dependency Graph Visualization

The dependency graph visualization provides:

1. **Summary**: Overview of active, inactive, and standalone files
2. **Dependency Layers**: Files organized by their distance from the entry point
3. **File Details**: For each file, shows its status and which files import it
4. **Search**: Ability to search for specific files

## Best Practices

1. **Regular Analysis**: Run the analysis regularly to keep track of your project's structure
2. **Clean Up Inactive Files**: Consider removing or refactoring inactive files
3. **Optimize Dependency Chains**: Look for opportunities to simplify complex dependency chains
4. **Visualize Before Refactoring**: Generate the dependency graph before making major architectural changes

## Troubleshooting

### Import Path Issues

If you encounter issues with import paths not being properly resolved:

1. Check for special characters or unusual patterns in your import paths
2. Ensure that the file exists at the specified path
3. Try running the analysis with the force flag: `npm run restore-filenames:force && npm run analyze-active-files`

### Missing Files in the Report

If some files are missing from the report:

1. Ensure that the file is imported (directly or indirectly) from the entry point
2. Check if the file extension is supported (.js, .jsx, .ts, .tsx, .css)
3. Verify that the file is located in the src directory

## Advanced Configuration

The ESLint rule can be configured in `.eslintrc.js`:

```javascript
"active-files/active-files-tracker": [
  "off", // Changed from "warn" to "off" to prevent messages in the editor
  {
    entryPoint: "src/index.js" // Change this if your entry point is different
  }
]
