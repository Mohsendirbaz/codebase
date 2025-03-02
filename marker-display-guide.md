# File Naming Convention for Active/Inactive Files

This guide explains how active and inactive files are visually differentiated in your file explorer using the file naming convention approach.

## How It Works

The Active Files Tracker renames your files with prefixes that indicate their status:

- **Active files** are prefixed with `[A]_`:
  ```
  [A]_App.js
  [A]_HomePage.js
  [A]_utils.js
  ```

- **Inactive files** are prefixed with `[I]_`:
  ```
  [I]_UnusedComponent.js
  [I]_OldUtils.js
  [I]_DeprecatedFeature.js
  ```

> **Important:** The entry point file (`src/index.js`) is excluded from renaming since it's the fixed point for the application.

## Visual Appearance in File Explorer

The prefixes make it immediately obvious which files are active and which are inactive directly in the file explorer:

```
src/
├── [A]_App.js
├── index.js                  // Entry point (not renamed)
├── components/
│   ├── [A]_Header.js
│   ├── [A]_Footer.js
│   ├── [I]_Sidebar.js        // Inactive component
│   └── [I]_OldNavigation.js  // Inactive component
├── utils/
│   ├── [A]_api.js
│   ├── [A]_helpers.js
│   └── [I]_deprecated.js     // Inactive utility
└── styles/
    ├── [A]_main.css
    └── [I]_unused.css        // Inactive stylesheet
```

## Import Handling

The script automatically updates all import statements to reflect the new filenames:

```javascript
// Before renaming
import Header from './components/Header';
import Footer from './components/Footer';

// After renaming
import Header from './components/[A]_Header';
import Footer from './components/[A]_Footer';
```

This ensures that your application continues to function correctly after the files are renamed.

## Restoring Original Filenames

When you're done analyzing your project, you can restore the original filenames using the provided script:

```bash
node restore-filenames.js
```

This script will:
1. Find all files with `[A]_` or `[I]_` prefixes
2. Rename them back to their original names
3. Update all import statements to reflect the restored filenames

## Key Benefits

- **Immediately visible**: File status is visible directly in the file explorer
- **No need to open files**: Status is clear from the filename itself
- **Works in any editor**: Not dependent on editor-specific extensions or settings
- **Maintains imports**: All import statements are automatically updated
- **Sortable**: Active and inactive files are naturally grouped together in file listings
- **Searchable**: You can easily filter for `[A]_` or `[I]_` in your file explorer
- **Non-invasive**: The file content is never modified, only the filenames
- **Clean restoration**: The project can be restored to its original state without any traces

## Workflow

1. **Run the analysis** to generate the report:
   ```bash
   npm run analyze-active-files
   ```

2. **Rename the files** to visually differentiate active and inactive files:
   ```bash
   npm run mark-active-files
   ```

3. **Examine your project** to identify unused files that can be removed

4. **Restore original filenames** when you're done:
   ```bash
   node restore-filenames.js
   ```

## Customizing the Prefixes

If you want to use different prefixes, you can modify the `mark-active-files.js` script:

```javascript
// Change these lines in mark-active-files.js
const prefix = status === 'active' ? '[A]_' : '[I]_';

// To something like:
const prefix = status === 'active' ? '✓_' : '✗_';
// Or:
const prefix = status === 'active' ? 'ACTIVE_' : 'INACTIVE_';
```

Make sure to update the restore script as well if you change the prefix format.
