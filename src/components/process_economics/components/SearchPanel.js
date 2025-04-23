import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

import { categories } from '../data/categoryData';

const SearchPanel = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categories: [],
    complexity: null
  });
  
  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value, getActiveFilters());
  };
  
  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    onSearch('', getActiveFilters());
  };
  
  // Toggle category filter
  const toggleCategoryFilter = (category) => {
    setFilters(prev => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      
      const newFilters = {
        ...prev,
        categories: newCategories
      };
      
      onSearch(searchTerm, getActiveFilters(newFilters));
      return newFilters;
    });
  };
  
  // Set complexity filter
  const setComplexityFilter = (complexity) => {
    setFilters(prev => {
      const newComplexity = prev.complexity === complexity ? null : complexity;
      
      const newFilters = {
        ...prev,
        complexity: newComplexity
      };
      
      onSearch(searchTerm, getActiveFilters(newFilters));
      return newFilters;
    });
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      categories: [],
      complexity: null
    });
    
    onSearch(searchTerm, {});
  };
  
  // Get active filters for search
  const getActiveFilters = (currentFilters = filters) => {
    const activeFilters = {};
    
    if (currentFilters.categories.length > 0) {
      activeFilters.categories = currentFilters.categories;
    }
    
    if (currentFilters.complexity) {
      activeFilters.complexity = currentFilters.complexity;
    }
    
    return activeFilters;
  };
  
  // Count active filters
  const activeFilterCount = 
    filters.categories.length + 
    (filters.complexity ? 1 : 0);
  
  return (
    <div className="search-panel">
      <div className="search-bar">
        <div className="search-input-L-container">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            className="search-input-L"
            placeholder="Search configurations, tags, or modelers..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button 
              className="clear-search-button"
              onClick={handleClearSearch}
            >
              <XMarkIcon className="clear-icon" />
            </button>
          )}
        </div>
        
        <button 
          className={`filter-button ${activeFilterCount > 0 ? 'has-filters' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <AdjustmentsHorizontalIcon className="filter-icon" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="filter-count">{activeFilterCount}</span>
          )}
        </button>
      </div>
      
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            className="filters-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="filter-section">
              <div className="filter-header">
                <h3>Categories</h3>
              </div>
              <div className="category-filters">
                {categories.map(category => (
                  <button
                    key={category}
                    className={`category-filter ${filters.categories.includes(category) ? 'selected' : ''}`}
                    onClick={() => toggleCategoryFilter(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="filter-section">
              <div className="filter-header">
                <h3>Complexity</h3>
              </div>
              <div className="complexity-filters">
                <button
                  className={`complexity-filter ${filters.complexity === 'simple' ? 'selected' : ''}`}
                  onClick={() => setComplexityFilter('simple')}
                >
                  Simple (1-2 groups)
                </button>
                <button
                  className={`complexity-filter ${filters.complexity === 'medium' ? 'selected' : ''}`}
                  onClick={() => setComplexityFilter('medium')}
                >
                  Medium (3-5 groups)
                </button>
                <button
                  className={`complexity-filter ${filters.complexity === 'complex' ? 'selected' : ''}`}
                  onClick={() => setComplexityFilter('complex')}
                >
                  Complex (6+ groups)
                </button>
              </div>
            </div>
            
            <div className="filter-actions">
              <button
                className="clear-filters-button"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
              >
                Clear All Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchPanel;