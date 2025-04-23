// src/modules/processEconomics/components/CiloExplorer.js
import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  Squares2X2Icon, 
  CubeIcon 
} from '@heroicons/react/24/outline';

import CiloSection from './CiloSection';
import { ciloData, ciloTypes } from '../data/ciloData';
import { getGeneralLibrary } from '../services/libraryService';
import { getCurrentUserId } from '../utils/authUtils';
import ItemCard from '../components/ItemCard';
const CiloExplorer = ({ onImportConfiguration }) => {
  const [libraryItems, setLibraryItems] = useState([]);
  const [selectedCilo, setSelectedCilo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Load all library items
  useEffect(() => {
    const loadLibraryItems = async () => {
      setIsLoading(true);
      try {
        const items = await getGeneralLibrary();
        setLibraryItems(items);
      } catch (error) {
        console.error('Error loading library items:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLibraryItems();
  }, []);
  
  // Handle adding an item to personal library
  const handleAddToPersonal = async (item, userId = getCurrentUserId(), shelf = null) => {
    try {
      // Implementation from the general library component
      // ...
      
      // Show success message
      alert(`Added "${item.name}" to your personal library${shelf ? ` (${shelf})` : ''}`);
    } catch (error) {
      console.error('Error saving to personal library:', error);
      alert('Error adding to personal library');
    }
  };
  
  // Handle viewing all items for a specific cilo
  const handleViewAll = (ciloId) => {
    setSelectedCilo(ciloId);
  };
  
  // Filter items by search term
  const filteredItems = searchTerm.trim() !== '' 
    ? libraryItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      )
    : libraryItems;
  
  // If a specific cilo is selected, show only that cilo's items
  if (selectedCilo) {
    const cilo = ciloData.find(c => c.id === selectedCilo);
    
    const ciloItems = filteredItems.filter(item => {
      // Check if item has matching tags
      const hasTags = item.tags && cilo.tags.some(tag => 
        item.tags.some(itemTag => 
          itemTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      
      // Check if item has matching category
      const hasCategory = item.category && 
        cilo.categories.some(cat => 
          item.category.toLowerCase().includes(cat.toLowerCase())
        );
      
      return hasTags || hasCategory;
    });
    
    return (
      <div className="cilo-detail-view">
        <div className="cilo-detail-header">
          <button 
            className="back-button"
            onClick={() => setSelectedCilo(null)}
          >
            ← Back to All Cilos
          </button>
          
          <div className="search-container">
            <MagnifyingGlassIcon className="search-icon" />
            <input
              type="text"
              placeholder={`Search in ${cilo.name}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-L"
            />
          </div>
        </div>
        
        <div className="cilo-detail-title">
          <cilo.icon className="cilo-icon" />
          <h2>{cilo.name}</h2>
        </div>
        
        <p className="cilo-detail-description">{cilo.description}</p>
        
        <div className="cilo-categories">
          {cilo.categories.map(category => (
            <span key={category} className="cilo-category-badge">
              {category}
            </span>
          ))}
        </div>
        
        {ciloItems.length > 0 ? (
          <div className="library-items-grid">
            {ciloItems.map(item => (
              <div key={item.id}>
                <ItemCard
                  item={item}
                  onImport={onImportConfiguration}
                  onAddToPersonal={handleAddToPersonal}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-cilo-detail">
            <p>No configurations found for {cilo.name}.</p>
          </div>
        )}
      </div>
    );
  }
  
  // Show all cilos
  return (
    <div className="cilo-explorer">
      <div className="cilo-explorer-header">
        <h2>
          <CubeIcon className="header-icon" />
          Specialized Systems Libraries
        </h2>
        
        <div className="search-container">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search across all specialized libraries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-L"
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="loading-cilos">
          <div className="loading-spinner"></div>
          <span>Loading specialized libraries...</span>
        </div>
      ) : (
        <div className="cilos-container">
          {ciloData.map(cilo => (
            <CiloSection
              key={cilo.id}
              cilo={cilo}
              items={filteredItems}
              onImport={onImportConfiguration}
              onAddToPersonal={handleAddToPersonal}
              onViewAll={handleViewAll}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CiloExplorer;