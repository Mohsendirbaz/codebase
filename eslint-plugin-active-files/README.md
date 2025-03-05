# eslint-plugin-active-files

ESLint plugin to visually differentiate between active and inactive project files in React applications directly in the file explorer.

## Overview

This plugin analyzes your React project to identify which files are actively used (imported directly or indirectly from the entry point) and which files are inactive (not imported anywhere in the dependency chain). It generates a report that is used to rename files with prefixes that visually indicate their status in the file explorer.

## Features

- Identifies the entry point (`index.js`) and recursively traces imports
- Classifies standalone files (no further imports) as the final layer
- Properly handles files that appear in multiple active paths
- Considers only `index.js` as the entry point, not other hub files
- Generates a comprehensive report of active and inactive files
- Works with a companion script to rename files with visual prefixes
- Automatically updates import statements to maintain functionality
- Provides a clean restoration process to revert filename changes

## Installation

### For Local Development

If you're using the plugin locally (as in this project):

```bash
# Run the installation script
npm run install-active-files-plugin
```

### For External Projects

If you want to use this plugin in other projects:

```bash
npm install eslint-plugin-active-files --save-dev
```

## Configuration

Add the plugin to your `.eslintrc.js` file:

```js
module.exports = {
  plugins: [
    "active-files"
  ],
  rules: {
    "active-files/active-files-tracker": [
      "warn",
      {
        entryPoint: "src/index.js"
      }
    ]
  }
};
```

## Rule Options

The `active-files-tracker` rule accepts the following options:

- `entryPoint` (string, default: `"src/index.js"`): The entry point file path relative to the project root

## Complete Workflow

### Step 1: Analysis and Report Generation

When you run ESLint with this plugin, it will:

```bash
npm run analyze-active-files
```

1. Start from the specified entry point (default: `src/index.js`)
2. Recursively trace all imports to build a dependency graph
3. Identify which files are active (reachable from the entry point)
4. Generate a report file (`active-files-report.json`) with the analysis results

### Step 2: File Renaming

A separate script (`mark-active-files.js`) then:

```bash
npm run mark-active-files
```

1. Reads the report file
2. Renames files with prefixes to indicate their status:
   - Active files: `[A]_filename.js` (except for the entry point `src/index.js` which is preserved)
   - Inactive files: `[I]_filename.js`
3. Updates import statements in all files to reflect the new filenames
4. Generates a summary of renamed files

> **Note:** The entry point file (`src/index.js`) is excluded from renaming since it's the fixed point for the application.

### Step 3: Restoration

When you're done analyzing your project, you can restore the original filenames:

```bash
node restore-filenames.js
```

This script will:
1. Find all files with `[A]_` or `[I]_` prefixes
2. Rename them back to their original names
3. Update all import statements to reflect the restored filenames

## Visual Differentiation

After running the analysis and renaming, your files will be visibly differentiated in the file explorer:

- **Active files**: Prefixed with `[A]_` (e.g., `[A]_App.js`)
- **Inactive files**: Prefixed with `[I]_` (e.g., `[I]_UnusedComponent.js`)

This makes it immediately obvious which files are active and which are inactive without having to open them.

## Enabling/Disabling the Rule

You can enable or disable the rule in your `.eslintrc.js` file:

```js
// To enable
"active-files/active-files-tracker": ["warn", { entryPoint: "src/index.js" }]

// To disable
"active-files/active-files-tracker": "off"
```

For more details, see the [ESLint Rule Management Guide](../eslint-rule-management.md).

## Troubleshooting

If you encounter issues with the analysis:

1. **Plugin Registration Issues**:
   - Make sure the plugin name in `.eslintrc.js` matches the export in `index.js`
   - The rule name should be `active-files/active-files-tracker` in `.eslintrc.js`
   - The rule export should be `active-files-tracker` in `index.js`

2. **TypeError: ruleListener is not a function**:
   - This error occurs when the rule is not properly registered
   - Make sure the plugin is properly linked: `npm link ./eslint-plugin-active-files`
   - Check that the rule export in `index.js` matches what ESLint expects

3. **File Renaming Issues**:
   - If files aren't being renamed, check file permissions
   - Make sure the files aren't open in your editor when running the script
   - Check if the report file was generated correctly

4. **Import Statement Updates**:
   - The script automatically updates import statements to reflect renamed files
   - If you encounter import errors, run the renaming script again

## Benefits

- **Immediately visible**: File status is visible directly in the file explorer
- **No need to open files**: Status is clear from the filename itself
- **Works in any editor**: Not dependent on editor-specific extensions
- **Maintains imports**: All import statements are automatically updated
- **Non-invasive**: The file content is never modified, only the filenames
- **Clean restoration**: The project can be restored to its original state without any traces

## License

MIT
