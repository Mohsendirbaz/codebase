module.exports = {
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
    // Active files tracker rule - only runs when ANALYZE_ACTIVE_FILES=true
    "active-files/active-files-tracker": [
      "off", // Keep as "off" to prevent messages in the editor during normal development
      {
        entryPoint: "src/index.js",
        silentMode: true // Ensures the rule is completely silent during normal development
      }
    ],
    
    // Disable rules that are causing issues in the existing codebase
    "react/react-in-jsx-scope": "off",     // Not needed in React 17+
    "react/prop-types": "off",             // Disable prop types validation
    "no-unused-vars": "off",               // Disable unused variables warning
    "no-case-declarations": "off",         // Allow declarations in case blocks
    "react/no-unescaped-entities": "off",  // Allow unescaped entities in JSX
    "no-useless-catch": "off",             // Allow empty catch blocks
    "no-undef": "warn",                    // Warn about undefined variables
    "no-empty": "warn",                    // Warn about empty blocks
  }
,
  // Override rules for inactive files to silence warnings
  overrides: [
    {
      // Files identified as inactive by the active-files-tracker rule
      files: [
        "src/components/version/VersionControl.css",
        "src/components/version/VersionControl.js"
      ],
      rules: {
        // Silence all rules for inactive files
        "no-unused-vars": "off",
        "react/prop-types": "off",
        "react/react-in-jsx-scope": "off",
        "no-case-declarations": "off",
        "react/no-unescaped-entities": "off",
        "no-useless-catch": "off",
        "no-undef": "off",
        "no-empty": "off",
        // Disable all other potential warnings
        "import/no-unresolved": "off",
        "import/named": "off",
        "import/namespace": "off",
        "import/default": "off",
        "import/export": "off"
      }
    }
  ]
};
