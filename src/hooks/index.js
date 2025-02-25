/**
 * Export all custom hooks from a single location
 */

export { default as useFormValues } from './useFormValues';
export { default as useVersion } from './useVersion';
export { default as useTheme } from './useTheme';
export { default as useContentLoading } from './useContentLoading';
export { default as useAnalysis } from './useAnalysis';
export { default as useFeatureToggles } from './useFeatureToggles';
export { default as useSensitivity } from './useSensitivity';

// Example usage in components:
// import { 
//   useFormValues, 
//   useVersion, 
//   useTheme,
//   useContentLoading,
//   useAnalysis,
//   useFeatureToggles,
//   useSensitivity 
// } from '../hooks';
// 
// const { formValues, handleInputChange } = useFormValues();
// const { version, handleVersionChange } = useVersion();
// const { season, handleThemeChange } = useTheme();
// const { loadingStates, handleIframeLoad } = useContentLoading({ activeTab });
// const { analysisRunning, handleRun } = useAnalysis({ version, selectedVersions, V, F, S });
// const { remarks, toggleRemarks } = useFeatureToggles();
// const { S, enableParameter } = useSensitivity();
