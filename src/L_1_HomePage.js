import React, { useState, useEffect } from 'react';
import { VersionStateProvider } from './contexts/VersionStateContext';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

// Component imports
import CustomizableImage from './CustomizableImage';
import CustomizableTable from './CustomizableTable';
import ExtendedScaling from './ExtendedScaling';
import FormHeader from './FormHeader';
import GeneralFormConfig from './GeneralFormConfig';
import Popup from './Popup';
import PropertySelector from './PropertySelector';
import TodoList from './TodoList';
import VersionSelector from './VersionSelector';
import ModelZone from './components/model/ModelZone';
import VersionControl from './components/version/VersionControl';
import EditableHierarchicalList from './Editable';
import SpatialTransformComponent from './naturalmotion';

// CSS imports
import './L_1_HomePage1.css';
import './L_1_HomePage2.css';
import './L_1_HomePage3.css';
import './L_1_HomePage4.css';
import './L_1_HomePage5.css';
import './L_1_HomePage6.css';

// Custom hooks
import {
  useFormValues,
  useVersion,
  useTheme,
  useContentLoading,
  useAnalysis,
  useFeatureToggles,
  useSensitivity
} from './hooks';

// Components
import HeaderSection from './components/layout/HeaderSection';
import TabNavigation from './components/navigation/TabNavigation';
import InputForm from './components/forms/InputForm';
import CsvContentTab from './components/tabs/CsvContentTab';
import HtmlContentTab from './components/tabs/HtmlContentTab';
import PlotContentTab from './components/tabs/PlotContentTab';
import ActionButtons from './components/buttons/ActionButtons';

// Services
import { configService, batchService } from './services';

const L_1_HomePageContent = () => {
  // Core state
  const [activeTab, setActiveTab] = useState('Input');
  const [activeSubTab, setActiveSubTab] = useState('ProjectConfig');
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [subTab, setSubTab] = useState('');
  const [selectedHtml, setSelectedHtml] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [baseCosts, setBaseCosts] = useState([]);
  const [scalingGroups, setScalingGroups] = useState([]);
  const [collapsedTabs, setCollapsedTabs] = useState({});
  const [isToggleSectionOpen, setIsToggleSectionOpen] = useState(false);
  const [calculatedPrices, setCalculatedPrices] = useState({});

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    html: false,
    csv: false,
    plots: false,
  });
  const [contentLoaded, setContentLoaded] = useState({});

  // Content Loading States
  const [contentLoadingState, setContentLoadingState] = useState({
    csv: false,
    html: false,
    plots: false,
    iframes: {},
    images: {},
    content: {},
  });

  // Effect for tab transitions
  useEffect(() => {
    setContentLoadingState((prev) => ({
      ...prev,
      csv: activeTab === 'Case1',
      html: activeTab === 'Case2',
      plots: activeTab === 'Case3',
      iframes: {},
      images: {},
      content: {},
    }));
  }, [activeTab]);

  // Effect for content loading
  useEffect(() => {
    if (contentLoadingState.csv || contentLoadingState.html || contentLoadingState.plots) {
      const timer = setTimeout(() => {
        setContentLoadingState((prev) => ({
          ...prev,
          content: { ...prev.content, [activeTab]: true },
        }));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [contentLoadingState.csv, contentLoadingState.html, contentLoadingState.plots, activeTab]);

  // Custom hooks
  const { formValues, handleInputChange, handleReset, setFormValues } = useFormValues();
  const { 
    version, setVersion, batchRunning, csvFiles, albumHtmls, albumImages, 
    handleVersionChange, createNewBatch, removeBatch, handleRefresh 
  } = useVersion();
  const { season, handleThemeChange } = useTheme();
  const { 
    iframesLoaded, imagesLoaded, handleIframeLoad, handleImageLoad 
  } = useContentLoading({ activeTab });
  const { 
    analysisRunning, selectedCalculationOption, targetRow, 
    handleOptionChange, handleTargetRowChange, handleRun, 
    handleRunPNG, handleRunSub 
  } = useAnalysis({ version, selectedVersions, V, F, S });
  const { 
    remarks, customizedFeatures, F, V, toggleRemarks, 
    toggleCustomizedFeatures, toggleF, toggleV 
  } = useFeatureToggles();
  const { S, setS, enableParameter } = useSensitivity();

  // Theme management
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', season);

    if (season !== 'dark') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${process.env.PUBLIC_URL}/styles/${season}.css`;

      const oldLink = document.querySelector('link[href*="/styles/"][href$=".css"]');
      if (oldLink) {
        oldLink.remove();
      }

      document.head.appendChild(link);
    }
  }, [season]);

  // Extract base costs from Process2Config values
  useEffect(() => {
    const process2Costs = Object.entries(formValues)
      .filter(([key, value]) => key.includes('Amount5'))
      .map(([key, value]) => ({
        id: key,
        label: value.label || 'Unnamed Cost',
        baseValue: parseFloat(value.value) || 0,
      }));
    setBaseCosts(process2Costs);
  }, [formValues]);

  // Load configuration effect
  const loadConfiguration = async (version) => {
    try {
      const data = await configService.loadConfiguration(version);
      const { filteredValues } = data;
      
      // Process and update form values
      const processedValues = configService.processConfigValues(filteredValues);
      setFormValues(prev => ({
        ...prev,
        ...processedValues
      }));
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  // Handle submit complete set
  const handleSubmitCompleteSet = async () => {
    const filteredValues = configService.transformFormValues(formValues);
    
    try {
      const result = await batchService.submitCompleteSet(version, filteredValues);
      console.log(result);
    } catch (error) {
      console.error('Error during parameter submission:', error);
    }
  };

  // Handle scaled values changes
  const handleScaledValuesChange = (scaledValues) => {
    console.log('Scaled values:', scaledValues);
  };

  // Handle scaling groups changes
  const handleScalingGroupsChange = (newGroups) => {
    setScalingGroups(newGroups);
  };

  // Toggle tab collapse
  const toggleTabCollapse = (tabId) => {
    setCollapsedTabs((prev) => ({
      ...prev,
      [tabId]: !prev[tabId],
    }));
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Input':
        return (
          <div className="form-content">
            <InputForm
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              formValues={formValues}
              handleInputChange={handleInputChange}
              version={version}
              S={S}
              setS={setS}
              F={F}
              toggleF={toggleF}
              V={V}
              toggleV={toggleV}
              setVersion={setVersion}
              handleReset={handleReset}
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
              selectedProperties={selectedProperties}
              setSelectedProperties={setSelectedProperties}
              showPopup={showPopup}
              setShowPopup={setShowPopup}
              popupPosition={popupPosition}
              setPopupPosition={setPopupPosition}
            />
            <ActionButtons
              handleRunPNG={handleRunPNG}
              handleRunSub={handleRunSub}
              selectedProperties={selectedProperties}
              remarks={remarks}
              customizedFeatures={customizedFeatures}
              version={version}
              selectedVersions={selectedVersions}
              analyzingRunning={analysisRunning}
            />
            <VersionControl
              version={version}
              handleVersionChange={handleVersionChange}
              createNewBatch={createNewBatch}
              removeBatch={removeBatch}
              batchRunning={batchRunning}
              handleRefresh={handleRefresh}
              loadConfiguration={loadConfiguration}
            />
          </div>
        );
      case 'Case1':
        return (
          <CsvContentTab 
            csvFiles={csvFiles}
            subTab={subTab}
            setSubTab={setSubTab}
            version={version}
          />
        );
      case 'Case2':
        return (
          <HtmlContentTab 
            albumHtmls={albumHtmls}
            selectedHtml={selectedHtml}
            setSelectedHtml={setSelectedHtml}
            iframesLoaded={iframesLoaded}
            handleIframeLoad={handleIframeLoad}
          />
        );
      case 'Case3':
        return (
          <PlotContentTab 
            albumImages={albumImages}
            selectedAlbum={selectedAlbum}
            setSelectedAlbum={setSelectedAlbum}
            imagesLoaded={imagesLoaded}
            handleImageLoad={handleImageLoad}
          />
        );
      case 'Scaling':
        return (
          <ExtendedScaling
            baseCosts={baseCosts}
            onScaledValuesChange={handleScaledValuesChange}
            initialScalingGroups={scalingGroups}
            onScalingGroupsChange={handleScalingGroupsChange}
          />
        );
      case 'Editable':
        return (
          <div className="p-4">
            <Tabs>
              <TabList>
                <Tab>Outline</Tab>
                <Tab>Todo List</Tab>
              </TabList>
              <TabPanel>
                <h2 className="text-xl font-bold mb-4">Editable Hierarchical List</h2>
                <EditableHierarchicalList />
              </TabPanel>
              <TabPanel>
                <h2 className="text-xl font-bold mb-4">Todo List</h2>
                <TodoList />
              </TabPanel>
            </Tabs>
          </div>
        );
      case 'ModelZone':
        return <ModelZone />;
      case 'SensitivityAnalysis':
        return <SensitivityAnalysis />;
      case 'TestingZone':
        return <TestingZone />;
      default:
        return null;
    }
  };

  return (
    <div className="L_1_HomePage">
      <HeaderSection season={season} handleThemeChange={handleThemeChange} />
      <div className="main-content">
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="L_1_HomePageTabContent">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

const L_1_HomePage = () => {
  return (
    <VersionStateProvider>
      <L_1_HomePageContent />
    </VersionStateProvider>
  );
};

export default L_1_HomePage;
