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
      "off", // Changed from "warn" to "off" to prevent messages in the editor
      {
        entryPoint: "src/index.js"
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
        "src/App.css",
        "src/components/buttons/ActionButtons.css",
        "src/components/buttons/ActionButtons.js",
        "src/components/forms/InputForm.js",
        "src/components/layout/HeaderSection.css",
        "src/components/layout/HeaderSection.js",
        "src/components/layout/theme/ThemeSelector.js",
        "src/components/L_1_HomePage.CSS/L_1_HomePage1.css",
        "src/components/L_1_HomePage.CSS/L_1_HomePage2.css",
        "src/components/L_1_HomePage.CSS/L_1_HomePage3.css",
        "src/components/L_1_HomePage.CSS/L_1_HomePage5.css",
        "src/components/L_1_HomePage.CSS/L_1_HomePage6.css",
        "src/components/navigation/TabNavigation.js",
        "src/components/scaling/Card.js",
        "src/components/scaling/MathProcessor.js",
        "src/components/scaling/MotionDraggableIte.js",
        "src/components/scaling/MotionScalingSummary.js",
        "src/components/scaling/MotionTooltip.js",
        "src/components/scaling/ScalingTab.js",
        "src/components/scaling/styles/animations.css",
        "src/components/scaling/styles/base.css",
        "src/components/scaling/styles/card.css",
        "src/components/scaling/styles/draggable.css",
        "src/components/scaling/styles/scaling.css",
        "src/components/scaling/styles/tooltip.css",
        "src/components/SensitivityIntegration.js",
        "src/components/SensitivityVisualization.css",
        "src/components/tabs/CsvContentTab.js",
        "src/components/tabs/HtmlContentTab.js",
        "src/components/tabs/PlotContentTab.js",
        "src/components/tabs/TabContent.js",
        "src/hooks/index.js",
        "src/hooks/useAnalysis.js",
        "src/hooks/useContentLoading.js",
        "src/hooks/useFeatureToggles.js",
        "src/hooks/useFormValues.js",
        "src/hooks/useSensitivity.js",
        "src/hooks/useTheme.js",
        "src/hooks/useVersion.js",
        "src/L_1_HomePage.CSS/L_1_HomePage_Neumorphic.css",
        "src/PriceOptimizationConfig.css",
        "src/PriceOptimizationConfig.js",
        "src/SensitivityVisualization.css",
        "src/services/apiService.js",
        "src/services/batchService.js",
        "src/services/configService.js",
        "src/services/contentService.js",
        "src/services/index.js",
        "src/state/VersionStateManager.js",
        "src/styles/fall.css",
        "src/styles/winter.css",
        "src/TodoList2.js",
        "src/ui/tooltip.jsx",
        "src/utils/pathTransformers.js"
      ],
      rules: {
        // Silence all rules for inactive files
        "no-unused-vars": "off",
        "react/prop-types": "off",
        "react/react-in-jsx-scope": "off",
        "no-case-declarations": "off",
        "react/no-unescaped-entities": "off",
        "no-useless-catch": "off"
      }
    }
  ]
};
