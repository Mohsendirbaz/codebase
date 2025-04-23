// src/modules/processEconomics/components/GeneralLibrary.js (modified)
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Squares2X2Icon, 
  Bars3Icon,
  BarsArrowUpIcon,
  ChevronDownIcon,
  FireIcon
} from '@heroicons/react/24/outline';

import ItemCard from './ItemCard';
import  CategorySelector from './CategorySelector';
import PopularItemsCarousel from './PopularItemsCarousel';
import { saveToPersonalLibrary } from '../services/libraryService';
import { usageTracker } from '../services/usageTrackingService';
import '../styles/LibrarySystem.css'

const GeneralLibrary = ({ 
  items, 
  onImportConfiguration,
  isSearchView = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortOption, setSortOption] = useState('name');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [popularItems, setPopularItems] = useState([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  
  // Load popular items
  useEffect(() => {
    const loadPopularItems = async () => {
      setIsLoadingPopular(true);
      try {
        const popular = await usageTracker.getPopularItems(6);
        setPopularItems(popular);
      } catch (error) {
        console.error('Error loading popular items:', error);
      } finally {
        setIsLoadingPopular(false);
      }
    };
    
    loadPopularItems();
  }, []);
  
  // Extract unique categories
  const categories = ['all', ...new Set(items.map(item => item.category))];
  
  // Filter items by category
  const filteredItems = items.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  );
  
  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch(sortOption) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'category':
        return a.category.localeCompare(b.category);
      case 'date':
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      case 'complexity':
        return (
          b.configuration.currentState.scalingGroups.length - 
          a.configuration.currentState.scalingGroups.length
        );
      case 'popularity':
        return (b.usage?.total || 0) - (a.usage?.total || 0);
      default:
        return 0;
    }
  });
  
  // Handle adding an item to personal library
  const handleAddToPersonal = async (item, userId, shelf = null) => {
    try {
      // Add to personal library
      await saveToPersonalLibrary(userId, item, shelf);
      
      // Show success message
      alert(`Added "${item.name}" to your personal library${shelf ? ` (${shelf})` : ''}`);
    } catch (error) {
      console.error('Error saving to personal library:', error);
      alert('Error adding to personal library');
    }
  };
  
  // If this is a search view, render a simpler version
  if (isSearchView) {
    return (
      <div className="library-items-grid">
        {sortedItems.map(item => (
          <ItemCard 
            key={item.id}
            item={item}
            onImport={onImportConfiguration}
            onAddToPersonal={handleAddToPersonal}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className="general-library">
      {/* Add Popular Items Carousel */}
      {!isLoadingPopular && popularItems.length > 0 && (
        <div className="popular-items-section">
          <div className="section-header">
            <h2>
              <FireIcon className="section-icon" />
              <span>Popular Configurations</span>
            </h2>
          </div>
          <PopularItemsCarousel 
            items={popularItems}
            onImport={onImportConfiguration}
            onAddToPersonal={handleAddToPersonal}
          />
        </div>
      )}
      
      <div className="general-library-header">
        <div className="category-navigation">
          < CategorySelector 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
        
        <div className="view-options">
          <div className="sort-selector">
            <button 
              className="sort-button"
              onClick={() => setShowSortOptions(!showSortOptions)}
            >
              <BarsArrowUpIcon className="sort-icon" />
              <span>Sort: {sortOption}</span>
              <ChevronDownIcon className="chevron-icon" />
            </button>
            
            {showSortOptions && (
              <div className="sort-options">
                <button 
                  className={`sort-option ${sortOption === 'name' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('name');
                    setShowSortOptions(false);
                  }}
                >
                  Name
                </button>
                <button 
                  className={`sort-option ${sortOption === 'category' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('category');
                    setShowSortOptions(false);
                  }}
                >
                  Category
                </button>
                <button 
                  className={`sort-option ${sortOption === 'date' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('date');
                    setShowSortOptions(false);
                  }}
                >
                  Date Added
                </button>
                <button 
                  className={`sort-option ${sortOption === 'popularity' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('popularity');
                    setShowSortOptions(false);
                  }}
                >
                  Most Used
                </button>
                <button 
                  className={`sort-option ${sortOption === 'complexity' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('complexity');
                    setShowSortOptions(false);
                  }}
                >
                  Complexity
                </button>
              </div>
            )}
          </div>
          
          <div className="view-mode-toggle">
            <button 
              className={`view-mode-button ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Squares2X2Icon className="view-mode-icon" />
            </button>
            <button 
              className={`view-mode-button ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <Bars3Icon className="view-mode-icon" />
            </button>
          </div>
        </div>
      </div>
      
      <div className={`general-library-content ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
        <AnimatePresence>
          {sortedItems.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className={viewMode === 'list' ? 'list-item-container' : ''}
            >
              <ItemCard 
                item={item}
                onImport={onImportConfiguration}
                onAddToPersonal={handleAddToPersonal}
                viewMode={viewMode}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {sortedItems.length === 0 && (
          <div className="empty-library">
            <p>No items in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralLibrary;