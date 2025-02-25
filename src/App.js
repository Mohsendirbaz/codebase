import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { VersionStateProvider } from './contexts/VersionStateContext';
import { useTheme, useVersion, useFeatureToggles, useSensitivity } from './hooks';
import TabNavigation from './components/navigation/TabNavigation';
import ThemeSelector from './components/theme/ThemeSelector';
import CsvContentTab from './components/tabs/CsvContentTab';
import HtmlContentTab from './components/tabs/HtmlContentTab';
import PlotContentTab from './components/tabs/PlotContentTab';
import InputForm from './components/forms/InputForm';
import ModelZone from './components/model/ModelZone';
import VersionControl from './components/version/VersionControl';

/**
 * Main application component
 * Uses modular components instead of monolithic L_1_HomePage
 */
function App() {
  // Initialize hooks
  const { season, handleThemeChange } = useTheme({ initialTheme: 'winter' });
  const { version, handleVersionChange, csvFiles, albumHtmls, albumImages } = useVersion();
  const { remarks, customizedFeatures, F, V, toggleRemarks, toggleCustomizedFeatures } = useFeatureToggles();
  const { S, enableParameter } = useSensitivity();

  // Tab state
  const [activeTab, setActiveTab] = React.useState('Input');
  const [activeSubTab, setActiveSubTab] = React.useState('ProjectConfig');

  return (
    <ErrorBoundary>
      <VersionStateProvider>
        <div className={`app-container theme-${season}`}>
          <Router>
            <div className="L_1_HomePageSectionA">
              <div className="about-us-image1"></div>
              <div className="L_1_HomePageSectionT">
                <VersionControl 
                  version={version}
                  onVersionChange={handleVersionChange}
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

              <div className="tab-content">
                {activeTab === 'Input' && (
                  <InputForm
                    activeSubTab={activeSubTab}
                    setActiveSubTab={setActiveSubTab}
                    version={version}
                    F={F}
                    V={V}
                    S={S}
                    remarks={remarks}
                    customizedFeatures={customizedFeatures}
                    onToggleRemarks={toggleRemarks}
                    onToggleCustomizedFeatures={toggleCustomizedFeatures}
                  />
                )}

                {activeTab === 'Case1' && (
                  <CsvContentTab
                    csvFiles={csvFiles}
                    version={version}
                  />
                )}

                {activeTab === 'Case2' && (
                  <HtmlContentTab
                    albumHtmls={albumHtmls}
                    version={version}
                  />
                )}

                {activeTab === 'Case3' && (
                  <PlotContentTab
                    albumImages={albumImages}
                    version={version}
                  />
                )}

                {activeTab === 'ModelZone' && (
                  <ModelZone
                    version={version}
                    F={F}
                    V={V}
                    S={S}
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
