# Active Files Tracker for React Projects

This project includes a custom ESLint rule to visually differentiate between active and inactive files in your React application directly in the file explorer.

## What It Does

The Active Files Tracker:

1. Identifies the entry point (`index.js`) and recursively traces imports
2. Classifies standalone files (no further imports) as the final layer
3. Properly handles files that appear in multiple active paths
4. Considers only `index.js` as the entry point, not other hub files
5. **Renames files with prefixes** to visually indicate their status in the file explorer

## Installation

The ESLint plugin is already included in this project. To install its dependencies, run:

```bash
# Run the installation script
npm run install-active-files-plugin
```

This script will:
- Install all necessary dependencies for the plugin
- Install the glob dependency for the analysis script
- Link the local ESLint plugin to your project
- Create an `.eslintrc.js` file if it doesn't exist
- Update package.json scripts for easy analysis and renaming

## Usage

The process is split into two steps for better reliability:

### Step 1: Analyze your project

```bash
npm run analyze-active-files
```

This will:
1. Start from `src/index.js`
2. Recursively trace all imports to build a dependency graph
3. Identify which files are active (reachable from the entry point)
4. Generate a report file (`active-files-report.json`) with the analysis results
5. Automatically run the renaming script (or you can run it separately)

### Step 2: Rename your files

```bash
npm run mark-active-files
```

This will:
1. Read the report file generated in step 1
2. Rename files with prefixes to indicate their status:
   - Active files: `[A]_filename.js` (except for the entry point `src/index.js` which is preserved)
   - Inactive files: `[I]_filename.js`
3. Update import statements in all files to reflect the new filenames
4. Generate a summary of renamed files

> **Note:** The entry point file (`src/index.js`) is excluded from renaming since it's the fixed point for the application.

### Step 3: Restore original filenames (when done)

```bash
node restore-filenames.js
```

This will:
1. Find all files with `[A]_` or `[I]_` prefixes
2. Rename them back to their original names
3. Update all import statements to reflect the restored filenames

## Visual Differentiation

After running the analysis and renaming, your files will be visibly differentiated in the file explorer:

- **Active files**: Prefixed with `[A]_` (e.g., `[A]_App.js`)
- **Inactive files**: Prefixed with `[I]_` (e.g., `[I]_UnusedComponent.js`)

This makes it immediately obvious which files are active and which are inactive without having to open them.

## Enabling/Disabling the ESLint Rule

For details on how to enable or disable the ESLint rule and manage the restoration process, see the [ESLint Rule Management Guide](./eslint-rule-management.md).

## Troubleshooting

If you encounter issues with the analysis:

1. **Plugin Registration Issues**:
   - The installation script properly links the plugin using `npm link`
   - If you still have issues, try running: `npm unlink eslint-plugin-active-files && cd eslint-plugin-active-files && npm link && cd .. && npm link eslint-plugin-active-files`

2. **File Renaming Issues**:
   - If files aren't being renamed, check file permissions
   - Make sure the files aren't open in your editor when running the script
   - Check if the report file was generated correctly

3. **Import Statement Updates**:
   - The script automatically updates import statements to reflect renamed files
   - If you encounter import errors, run the renaming script again

4. **ESLint Rule Error**:
   - If you see "TypeError: ruleListener is not a function", the plugin registration is incorrect
   - Run the installation script again to fix the plugin registration

## Customization

You can customize the rule in the `.eslintrc.js` file:

```js
"active-files/active-files-tracker": [
  "warn",
  {
    entryPoint: "src/index.js"
  },
],
```

You can also modify the prefixes used for renaming by editing the `mark-active-files.js` script.

## How It Works

The solution works by:

1. Starting from the entry point file
2. Parsing JavaScript/JSX files to extract import statements
3. Building a dependency graph
4. Determining which files are active (reachable from the entry point)
5. Generating a report file with the analysis results
6. Using a separate script to rename files based on the report
7. Updating import statements to reflect the new filenames

## Benefits

- **Immediately visible**: File status is visible directly in the file explorer
- **No need to open files**: Status is clear from the filename itself
- **Works in any editor**: Not dependent on editor-specific extensions
- **Maintains imports**: All import statements are automatically updated
- **Non-invasive**: The file content is never modified, only the filenames
- **Clean restoration**: The project can be restored to its original state without any traces
