import React, { useState } from 'react';
import ProcessEconomicsLibrary from './process-economics-library';
import CentralScalingTab from '../truly_extended_scaling/CentralScalingTab';
import '../../styles/HomePage.CSS/HCSS.css'
/**
 * LibraryIntegration component that shows how to integrate the Process Economics Library
 * with the existing scaling components
 */
const LibraryIntegration = ({
  formValues,
  V,
  R,
  toggleV,
  toggleR,

  scalingBaseCosts,
  setScalingBaseCosts,
  scalingGroups,

  onScalingGroupsChange,
  onScaledValuesChange,

  filterKeyword,
  initialScalingGroups,
  activeGroupIndex ,
  onActiveGroupChange ,
  onFinalResultsGenerated,

}) => {
  // State to manage library visibility
  const [showLibrary, setShowLibrary] = useState(false);

  // Current configuration for potential saving
  const [currentConfiguration, setCurrentConfiguration] = useState(null);

  // State for managing active group
  const [activeScalingGroups, setActiveScalingGroups] = useState({
    Amount4: 0,
    Amount5: 0,
    Amount6: 0,
    Amount7: 0
  });

  // Handle active group changes
  const handleActiveGroupChange = (groupIndex, filterKeyword) => {
    setActiveScalingGroups(prev => ({
      ...prev,
      [filterKeyword]: groupIndex
    }));
  };

  // Prepare current configuration for export
  const prepareCurrentConfiguration = () => {
    // Focus on the current scaling type's groups
    const currentGroups = scalingGroups.filter(group => 
      group._scalingType === filterKeyword
    );

    // Generate tabConfigs from these groups
    const tabConfigs = currentGroups.map(group => ({
      id: group.id,
      label: group.name,
      _scalingType: group._scalingType || filterKeyword
    }));

    // Create the configuration object
    const configuration = {
      version: "1.2.0",
      metadata: {
        exportDate: new Date().toISOString(),
        exportedBy: "ScalingModule",
        description: `${filterKeyword} Configuration`,
        scalingType: filterKeyword
      },
      currentState: {
        selectedGroupIndex: activeScalingGroups[filterKeyword] || 0,
        scalingGroups: currentGroups,
        protectedTabs: [],
        tabConfigs: tabConfigs,
        itemExpressions: {}
      }
    };

    setCurrentConfiguration(configuration);
    return configuration;
  };

  // Open the library
  const openLibrary = () => {
    prepareCurrentConfiguration();
    setShowLibrary(true);
  };

  // Close the library
  const closeLibrary = () => {
    setShowLibrary(false);
  };

  // Handle importing a configuration from the library
  const handleImportConfiguration = (configuration) => {
    // Extract the scaling groups and tabConfigs from the configuration
    const { scalingGroups: importedGroups, tabConfigs } = configuration.currentState;

    // Get all scaling groups of types different from the current one
    const otherGroups = scalingGroups.filter(group => 
      group._scalingType !== filterKeyword
    );

    // Create the updated groups array, ensuring _scalingType is set
    const updatedGroups = [
      ...otherGroups,
      ...importedGroups.map(group => ({
        ...group,
        _scalingType: filterKeyword
      }))
    ];

    // Update the scaling groups
    if (onScalingGroupsChange) {
      onScalingGroupsChange(updatedGroups);
    }

    // Select the first imported group
    if (importedGroups.length > 0) {
      handleActiveGroupChange(0, filterKeyword);
    }

    // Close the library
    closeLibrary();
  };

  return (
    <div className="library-integration">
      {/* Library Button */}
      <div className="library-button-container">
        <button 
          className="open-library-button"
          onClick={openLibrary}
        >
          <svg className="library-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19V5C4 3.89543 4.89543 3 6 3H19.4C19.7314 3 20 3.26863 20 3.6V16.7143" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M16 8.77975C16 9.38118 15.7625 9.95883 15.3383 10.3861C14.3619 11.3701 13.415 12.3961 12.4021 13.3443C12.17 13.5585 11.8017 13.5507 11.5795 13.3268L8.66848 10.3861C8.24428 9.95886 8.00684 9.38119 8.00684 8.77975C8.00684 7.53971 9.02576 6.52637 10.2709 6.52637C10.8736 6.52637 11.4334 6.76079 11.8542 7.18622L12.0068 7.34061L12.1595 7.18622C12.5802 6.76079 13.14 6.52637 13.7427 6.52637C14.9879 6.52637 16.0068 7.53971 16.0068 8.77975Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 17.9998H20M6 14.9998H20M6 20.9998H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Process Economics Library
        </button>
      </div>

      {/* Normal Scaling UI */}
      <CentralScalingTab
        formValues={formValues}
        V={V}
        R={R}
        toggleV={toggleV}
        toggleR={toggleR}

        scalingBaseCosts={scalingBaseCosts}
        setScalingBaseCosts={setScalingBaseCosts}
        scalingGroups={scalingGroups}

        onScalingGroupsChange={onScalingGroupsChange}
        onScaledValuesChange={onScaledValuesChange}

        activeScalingGroups={activeScalingGroups}
        initialScalingGroups = {initialScalingGroups}
        activeGroupIndex ={activeGroupIndex}
        onActiveGroupChange = {onActiveGroupChange}
        onFinalResultsGenerated={onFinalResultsGenerated}

      />

      {/* Library Modal */}
      {showLibrary && (
        <div className="library-modal-overlay">
          <ProcessEconomicsLibrary
            onImportConfiguration={handleImportConfiguration}
            onClose={closeLibrary}
            currentConfiguration={currentConfiguration}
            filterKeyword={filterKeyword}
          />
        </div>
      )}

    </div>
  );
};

export default LibraryIntegration;
