/**
 * @fileoverview ESLint plugin to differentiate between active and inactive project files
 */
"use strict";

// Import the rule implementation
const activeFilesTracker = require("./rules/active-files-tracker");

// Export the plugin
module.exports = {
  rules: {
    // Make sure this matches exactly what's in .eslintrc.js
    "active-files-tracker": activeFilesTracker
  },
  configs: {
    recommended: {
      plugins: ["active-files"],
      rules: {
        "active-files/active-files-tracker": "warn"
      }
    }
  }
};
