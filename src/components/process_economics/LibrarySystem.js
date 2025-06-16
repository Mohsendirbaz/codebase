// src/modules/processEconomics/LibrarySystem.js
import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { 
  BookOpenIcon, 
  UserIcon, 
  GlobeAltIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ChartBarIcon,
  CubeIcon,
  LeafIcon
} from '@heroicons/react/24/outline';

import PersonalLibrary from './components/PersonalLibrary';
import GeneralLibrary from './components/GeneralLibrary';
import CiloExplorer from './components/CiloExplorer';
import SearchPanel from './components/SearchPanel';
import ImportExportPanel from './components/ImportExportPanel';
import LibraryHeader from './components/LibraryHeader';
import UsageStatsOverview from './components/UsageStatsOverview';
import DecarbonizationLibrary from './components/DecarbonizationLibrary';

import { getPersonalLibrary, getGeneralLibrary } from './services/libraryService';
import { usageTracker } from './services/usageTrackingService';
import { generateUniqueId } from './utils/blockchainUtils';

import './styles/LibrarySystem.css'
import './styles/DecarbonizationComponents.css'

const LibrarySystem = ({
  onImportConfiguration,
  onClose,
  currentConfiguration,
  filterKeyword = '',
  userId
}) => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [personalLibrary, setPersonalLibrary] = useState([]);
  const [generalLibrary, setGeneralLibrary] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showUsageStats, setShowUsageStats] = useState(false);

  // Load library data
  useEffect(() => {
    const loadLibraries = async () => {
      // Load personal library for current user
      const personalData = await getPersonalLibrary(userId);
      setPersonalLibrary(personalData);

      // Load general/public library
      const generalData = await getGeneralLibrary();
      setGeneralLibrary(generalData);
    };

    loadLibraries();
  }, [userId]);

  // Handle importing configuration with usage tracking
  const handleImportWithTracking = (configuration) => {
    // Extract the item from either library
    const allItems = [...personalLibrary, ...generalLibrary];
    const item = allItems.find(item => 
      item.configuration.currentState.id === configuration.currentState.id
    );

    // Track usage if item exists
    if (item) {
      const source = personalLibrary.includes(item) ? 'personal' : 'general';
      usageTracker.trackItemUsage(item.id, userId, source, 'import');
    }

    // Call the original import function
    onImportConfiguration(configuration);
  };

  // Handle search across both libraries
  const handleSearch = (searchTerm, filters) => {
    if (!searchTerm && (!filters || Object.keys(filters).length === 0)) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Search in both libraries
    const personalResults = searchInLibrary(personalLibrary, searchTerm, filters);
    const generalResults = searchInLibrary(generalLibrary, searchTerm, filters);

    setSearchResults({
      personal: personalResults,
      general: generalResults
    });
  };

  // Helper function to search in a library
  const searchInLibrary = (library, term, filters) => {
    if (!library || library.length === 0) return [];

    const searchLower = term ? term.toLowerCase() : '';

    return library.filter(item => {
      // Match search term
      const textMatch = !searchLower || 
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
        (item.modeler && item.modeler.toLowerCase().includes(searchLower));

      if (!textMatch) return false;

      // Apply filters if any
      if (filters && Object.keys(filters).length > 0) {
        // Filter implementation remains the same as before
        // ...
      }

      return true;
    });
  };

  return (
    <div className="process-economics-library-system">
      <LibraryHeader 
        onClose={onClose}
        onToggleUsageStats={() => setShowUsageStats(!showUsageStats)}
        showUsageStats={showUsageStats}
      />

      {showUsageStats ? (
        <UsageStatsOverview userId={userId} onClose={() => setShowUsageStats(false)} />
      ) : (
        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <div className="library-navigation">
            <Tab.List className="library-tabs">
              <Tab className={({ selected }) => 
                `library-tab ${selected ? 'library-tab-selected' : ''}`
              }>
                <UserIcon className="tab-icon" />
                <span>Personal Library</span>
              </Tab>

              <Tab className={({ selected }) => 
                `library-tab ${selected ? 'library-tab-selected' : ''}`
              }>
                <GlobeAltIcon className="tab-icon" />
                <span>General Library</span>
              </Tab>

              {/* New tab for Specialized Systems (Cilos) */}
              <Tab className={({ selected }) => 
                `library-tab ${selected ? 'library-tab-selected' : ''}`
              }>
                <CubeIcon className="tab-icon" />
                <span>Specialized Systems</span>
              </Tab>

              {/* New tab for Decarbonization Pathways */}
              <Tab className={({ selected }) => 
                `library-tab ${selected ? 'library-tab-selected' : ''}`
              }>
                <LeafIcon className="tab-icon" />
                <span>Decarbonization Pathways</span>
              </Tab>

              {isSearching && (
                <Tab className={({ selected }) => 
                  `library-tab ${selected ? 'library-tab-selected' : ''}`
                }>
                  <MagnifyingGlassIcon className="tab-icon" />
                  <span>Search Results</span>
                </Tab>
              )}
            </Tab.List>

            <SearchPanel onSearch={handleSearch} />

            <ImportExportPanel 
              currentConfiguration={currentConfiguration}
              filterKeyword={filterKeyword}
              generateUniqueId={generateUniqueId}
              userId={userId}
            />
          </div>

          <Tab.Panels className="library-panels">
            <Tab.Panel>
              <PersonalLibrary 
                items={personalLibrary}
                setItems={setPersonalLibrary}
                onImportConfiguration={handleImportWithTracking}
                userId={userId}
              />
            </Tab.Panel>

            <Tab.Panel>
              <GeneralLibrary 
                items={generalLibrary}
                onImportConfiguration={handleImportWithTracking}
              />
            </Tab.Panel>

            {/* New Tab Panel for Specialized Systems (Cilos) */}
            <Tab.Panel>
              <CiloExplorer 
                onImportConfiguration={handleImportWithTracking}
              />
            </Tab.Panel>

            {/* New Tab Panel for Decarbonization Pathways */}
            <Tab.Panel>
              <DecarbonizationLibrary 
                onImportConfiguration={handleImportWithTracking}
                userId={userId}
              />
            </Tab.Panel>

            {isSearching && (
              <Tab.Panel>
                <div className="search-results-panel">
                  <h2>Search Results</h2>
                  {searchResults && (
                    <div className="search-results-content">
                      {searchResults.personal.length > 0 && (
                        <div className="search-results-section">
                          <h3>Personal Library ({searchResults.personal.length})</h3>
                          <PersonalLibrary 
                            items={searchResults.personal}
                            onImportConfiguration={handleImportWithTracking}
                            userId={userId}
                            isSearchView={true}
                          />
                        </div>
                      )}

                      {searchResults.general.length > 0 && (
                        <div className="search-results-section">
                          <h3>General Library ({searchResults.general.length})</h3>
                          <GeneralLibrary
                            items={searchResults.general}
                            onImportConfiguration={handleImportWithTracking}
                            isSearchView={true}
                          />
                        </div>
                      )}

                      {searchResults.personal.length === 0 && searchResults.general.length === 0 && (
                        <div className="no-results">
                          <p>No matching items found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Tab.Panel>
            )}
          </Tab.Panels>
        </Tab.Group>
      )}
    </div>
  );
};

export default LibrarySystem;
