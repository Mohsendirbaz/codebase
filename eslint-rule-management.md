# Managing the Active Files ESLint Rule

This guide explains how to enable, disable, and manage the active-files-tracker ESLint rule.

## Enabling/Disabling the Rule in .eslintrc.js

### To Enable the Rule

Add or modify the rule in your `.eslintrc.js` file:

```js
module.exports = {
  // ... other ESLint configuration
  plugins: [
    // ... other plugins
    "active-files",
  ],
  rules: {
    // ... other rules
    "active-files/active-files-tracker": [
      "warn", // or "error" if you want it to be treated as an error
      {
        entryPoint: "src/index.js"
      }
    ],
  },
};
```

### To Disable the Rule

You can disable the rule in several ways:

1. **Comment out the rule** (temporary disable):
   ```js
   rules: {
     // ... other rules
     // "active-files/active-files-tracker": ["warn", { entryPoint: "src/index.js" }],
   },
   ```

2. **Set the rule to "off"** (proper disable):
   ```js
   rules: {
     // ... other rules
     "active-files/active-files-tracker": "off",
   },
   ```

3. **Remove the rule entirely** from your `.eslintrc.js` file.

## Clean Restoration After Using the File Naming Approach

The file naming approach renames your files with `[A]_` and `[I]_` prefixes but does not modify the content of the files. To restore your project to its original state, you can use the provided `restore-filenames.js` script:

```bash
node restore-filenames.js
```

This script will:
1. Find all files with `[A]_` or `[I]_` prefixes
2. Rename them back to their original names
3. Update all import statements to reflect the restored filenames

The restoration process is clean and will not leave any traces in your files, as it only affects the filenames and import statements, not the actual content of the files.

### Troubleshooting Restoration

If the restoration script reports "No files with [A]_ or [I]_ prefixes found" but you know there are renamed files, it might be due to glob pattern issues. The script uses specific glob patterns to find files with the prefixes:

```javascript
const files = glob.sync('./src/**/\\[A\\]_*.{js,jsx,ts,tsx}', { ignore: ['**/node_modules/**'] });
const files2 = glob.sync('./src/**/\\[I\\]_*.{js,jsx,ts,tsx}', { ignore: ['**/node_modules/**'] });
```

If you're having issues, you can try:

1. **Manually specifying file paths**: If you know which files were renamed, you can modify the script to use a hardcoded list of files.

2. **Using the file explorer**: You can also manually rename the files back to their original names using your file explorer or IDE.

3. **Using a different glob pattern**: You might need to adjust the glob pattern based on your specific environment.

Remember that the entry point file (`src/index.js`) is excluded from renaming, so it won't need restoration.

## Workflow for Using the Active Files Tracker

1. **Enable the rule** in your `.eslintrc.js` file
2. **Run the analysis** to generate the report:
   ```bash
   npm run analyze-active-files
   ```
3. **Rename the files** to visually differentiate active and inactive files:
   ```bash
   npm run mark-active-files
   ```
4. **Examine your project** to identify unused files that can be removed
5. **Restore original filenames** when you're done:
   ```bash
   node restore-filenames.js
   ```
6. **Disable the rule** in your `.eslintrc.js` file if you no longer need it

## Benefits of This Approach

- **Non-invasive**: The file content is never modified, only the filenames
- **Visually clear**: Active and inactive files are immediately distinguishable in the file explorer
- **Clean restoration**: The project can be restored to its original state without any traces
- **Import handling**: Import statements are automatically updated to maintain functionality
