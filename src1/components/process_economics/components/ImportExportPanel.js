import React, { useState, useRef } from 'react';
import { 
  ArrowUpTrayIcon, 
  DocumentCheckIcon, 
  ServerStackIcon
} from '@heroicons/react/24/outline';

import SaveToLibraryModal from './SaveToLibraryModal';
import { saveConfiguration, getMyLibraryShelves } from '../services/libraryService';
import { getCurrentUserId } from '../utils/authUtils';

const ImportExportPanel = ({
  currentConfiguration,
  filterKeyword,
  generateUniqueId,
  userId
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [userShelves, setUserShelves] = useState([]);
  const [isLoadingShelves, setIsLoadingShelves] = useState(false);
  const fileInputRef = useRef(null);
  
  // Load user's shelves when opening save modal
  const handleOpenSaveModal = async () => {
    if (!currentConfiguration) {
      alert('No configuration to save. Please create or import a configuration first.');
      return;
    }
    
    setIsLoadingShelves(true);
    try {
      const shelves = await getMyLibraryShelves(userId);
      setUserShelves(shelves);
    } catch (error) {
      console.error('Error loading shelves:', error);
    } finally {
      setIsLoadingShelves(false);
    }
    
    setShowSaveModal(true);
  };
  
  // Import from file
  const handleImportFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target.result);
        
        // Validate the configuration
        if (!importedConfig.version || !importedConfig.metadata || !importedConfig.currentState) {
          alert('Invalid configuration file. The file format is not recognized.');
          return;
        }
        
        // Open save modal with imported configuration
        handleOpenSaveModalWithConfig(importedConfig);
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing file. Please make sure it is a valid JSON configuration file.');
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file');
    };
    
    reader.readAsText(file);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Open save modal with a specific configuration
  const handleOpenSaveModalWithConfig = (config) => {
    if (!config) return;
    
    setIsLoadingShelves(true);
    getMyLibraryShelves(userId)
      .then(shelves => {
        setUserShelves(shelves);
        setShowSaveModal(true);
      })
      .catch(error => {
        console.error('Error loading shelves:', error);
      })
      .finally(() => {
        setIsLoadingShelves(false);
      });
  };
  
  // Save configuration to library
  const handleSaveToLibrary = async (saveData) => {
    try {
      // Generate blockchain ID
      const uniqueId = generateUniqueId();
      
      // Prepare item data
      const newItem = {
        id: uniqueId,
        name: saveData.name,
        description: saveData.description,
        category: saveData.category,
        modeler: saveData.modeler,
        tags: saveData.tags,
        shelf: saveData.shelf === 'none' ? null : saveData.shelf,
        dateAdded: new Date().toISOString(),
        configuration: currentConfiguration
      };
      
      // Save to library
      await saveConfiguration(userId, newItem);
      
      // Close the modal
      setShowSaveModal(false);
      
      // Show success message
      alert(`"${saveData.name}" saved to your library.`);
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error saving configuration to library.');
    }
  };
  
  return (
    <div className="import-export-panel">
      <div className="panel-actions">
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
        
        <button 
          className="action-button"
          onClick={() => fileInputRef.current.click()}
        >
          <ArrowUpTrayIcon className="action-icon" />
          <span>Import File</span>
        </button>
        
        <button 
          className="action-button primary"
          onClick={handleOpenSaveModal}
          disabled={!currentConfiguration}
        >
          <DocumentCheckIcon className="action-icon" />
          <span>Save Current</span>
        </button>
        
        <button 
          className="action-button"
          onClick={() => window.open('/process-economics/browse', '_blank')}
        >
          <ServerStackIcon className="action-icon" />
          <span>Browse Library</span>
        </button>
      </div>
      
      {showSaveModal && (
        <SaveToLibraryModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveToLibrary}
          shelves={userShelves}
          isLoadingShelves={isLoadingShelves}
          defaultType={filterKeyword || ''}
        />
      )}
    </div>
  );
};

export default ImportExportPanel;