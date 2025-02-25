import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { VersionStateProvider } from './contexts/VersionStateContext';
import { 
  useTheme, 
  useVersion, 
  useFeatureToggles, 
  useFormValues,
  useContentLoading,
  useAnalysis
} from './hooks';
import TabNavigation from './components/navigation/TabNavigation';
import ThemeSelector from './components/theme/ThemeSelector';
import TabContent from './components/tabs/TabContent';
import ModelZone from './components/model/ModelZone';
import VersionControl from './components/version/VersionControl';

/**
 * Main application component
 * Uses modular components instead of monolithic L_1_HomePage
 */
function App() {
  // Tab and form states
  const [activeTab, setActiveTab] = useState('Input');
  const [activeSubTab, setActiveSubTab] = useState('ProjectConfig');
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [S, setS] = useState({});

  // Initialize hooks for state management
  const { season, handleThemeChange } = useTheme({ initialTheme: 'winter' });
  const { 
    version, 
    handleVersionChange, 
    csvFiles, 
    albumHtmls, 
    albumImages,
    createNewBatch,
    removeBatch,
    handleRefresh,
    setVersion,
    error: versionError,
    isLoading: versionLoading,
    retryFetch,
    retryCount 
  } = useVersion();
  
  const { 
    remarks, 
    customizedFeatures, 
    F, 
    V, 
    toggleRemarks, 
    toggleCustomizedFeatures,
    toggleF,
    toggleV,
    resetFeatures,
    isFeatureEnabled
  } = useFeatureToggles();
  
  // Form state management
  const { 
    formValues, 
    handleInputChange, 
    handleReset, 
    setFormValues 
  } = useFormValues();

  // Content loading states - now activeTab is defined before this hook
  const { 
    loadingStates,
    contentLoaded,
    handleIframeLoad,
    handleImageLoad,
    resetLoadingStates 
  } = useContentLoading({ activeTab });

  // Analysis operations
  const { 
    analysisRunning,
    calculatedPrices,
    selectedCalculationOption,
    targetRow,
    handleOptionChange,
    handleTargetRowChange,
    handleRun,
    handleSubmitCompleteSet 
  } = useAnalysis({ 
    version, 
    selectedVersions: [], 
    V, 
    F
  });

  // Error state
  const [error, setError] = useState(null);

  // Error handler
  const handleError = useCallback((error) => {
    console.error('Application error:', error);
    setError(error.message);
    // Reset error after 5 seconds
    setTimeout(() => setError(null), 5000);
  }, []);

  // Retry handler
  const handleRetry = useCallback(() => {
    if (retryFetch) {
      retryFetch();
    }
  }, [retryFetch]);

  // Determine if we should show the connection error message
  const showConnectionError = versionError && !versionLoading && (activeTab === 'Case1' || activeTab === 'Case2' || activeTab === 'Case3');

  return (
    <ErrorBoundary>
      <VersionStateProvider>
        <div className={`app-container theme-${season}`}>
          {/* Show version error if present */}
          {versionError && (
            <div className="error-banner">
              <span>{versionError}</span>
              <button 
                className={`retry-button ${versionLoading ? 'loading' : ''}`} 
                onClick={handleRetry}
                disabled={versionLoading}
              >
                {versionLoading ? `Retrying (${retryCount})...` : 'Retry Connection'}
              </button>
            </div>
          )}
          {/* Show general error if present */}
          {error && !versionError && (
            <div className="error-banner">
              <span>{error}</span>
            </div>
          )}
          <Router>
            <div className="L_1_HomePageSectionA">
              <div className="about-us-image1"></div>
              <div className="L_1_HomePageSectionT">
                <VersionControl 
                  version={version}
                  onVersionChange={handleVersionChange}
                  onCreateBatch={createNewBatch}
                  onRemoveBatch={removeBatch}
                  onRefresh={handleRefresh}
                  isLoading={versionLoading}
                />
              </div>
              <ThemeSelector 
                season={season} 
                handleThemeChange={handleThemeChange} 
              />
            </div>

            <div className="main-content">
              <TabNavigation 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
              />

              <div className={`tab-content ${versionLoading ? 'loading' : ''}`}>
                {(activeTab === 'Input' || activeTab === 'Case1' || activeTab === 'Case2' || activeTab === 'Case3') && (
                  <>
                    {showConnectionError ? (
                      <div className="connection-error">
                        <div className="icon">⚠️</div>
                        <div className="message">
                          <p>Backend service is currently unavailable.</p>
                          <p>Some features may be limited.</p>
                        </div>
                        <button 
                          className={`retry-button ${versionLoading ? 'loading' : ''}`} 
                          onClick={handleRetry}
                          disabled={versionLoading}
                        >
                          {versionLoading ? (
                            <>
                              <span className="spinner"></span>
                              <span>Retrying ({retryCount})...</span>
                            </>
                          ) : (
                            'Retry Connection'
                          )}
                        </button>
                        <div className="offline-features">
                          <h3>Available Offline Features:</h3>
                          <ul>
                            <li>Theme customization</li>
                            <li>Form input and validation</li>
                            <li>Local state management</li>
                            <li>Navigation between tabs</li>
                          </ul>
                          <h3>Features Requiring Backend:</h3>
                          <ul>
                            <li>CSV file generation and viewing</li>
                            <li>Plot generation</li>
                            <li>Batch operations</li>
                            <li>Analysis calculations</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <TabContent
                        activeTab={activeTab}
                        version={version}
                        csvFiles={csvFiles}
                        albumHtmls={albumHtmls}
                        albumImages={albumImages}
                        loadingStates={loadingStates}
                        contentLoaded={contentLoaded}
                        onIframeLoad={handleIframeLoad}
                        onImageLoad={handleImageLoad}
                        onError={handleError}
                        formValues={formValues}
                        handleInputChange={handleInputChange}
                        handleReset={handleReset}
                        F={F}
                        toggleF={toggleF}
                        V={V}
                        toggleV={toggleV}
                        S={S}
                        setS={setS}
                        setVersion={setVersion}
                        handleRun={handleRun}
                        handleSubmitCompleteSet={handleSubmitCompleteSet}
                        selectedCalculationOption={selectedCalculationOption}
                        handleOptionChange={handleOptionChange}
                        target_row={targetRow}
                        handleTargetRowChange={handleTargetRowChange}
                        remarks={remarks}
                        toggleRemarks={toggleRemarks}
                        customizedFeatures={customizedFeatures}
                        toggleCustomizedFeatures={toggleCustomizedFeatures}
                        activeSubTab={activeSubTab}
                        setActiveSubTab={setActiveSubTab}
                        selectedProperties={selectedProperties}
                        setSelectedProperties={setSelectedProperties}
                      />
                    )}
                  </>
                )}

                {activeTab === 'ModelZone' && (
                  <ModelZone
                    version={version}
                    F={F}
                    V={V}
                  />
                )}
              </div>
            </div>
          </Router>
        </div>
      </VersionStateProvider>
    </ErrorBoundary>
  );
}

export default App;
