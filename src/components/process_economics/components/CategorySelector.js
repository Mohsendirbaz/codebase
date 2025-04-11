// src/modules/processEconomics/components/CategorySelector.js
import React, { useState } from 'react';
import { ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { categoryColors } from '../data/categoryData';

const CategorySelector = ({
                              categories = [],
                              selectedCategory,
                              onSelectCategory
                          }) => {
    const [showAllCategories, setShowAllCategories] = useState(false);

    // Determine if there are too many categories to show all at once
    const maxVisibleCategories = 10;
    const hasMoreCategories = categories.length > maxVisibleCategories;

    // Get a color for a category
    const getCategoryColor = (category) => {
        // Convert category to kebab case for lookup
        const key = category.toLowerCase().replace(/\s+/g, '-');
        return categoryColors[key] || '#6b7280'; // Default to gray-500
    };

    // Categories to display in collapsed view
    const displayCategories = showAllCategories
        ? categories
        : categories.slice(0, maxVisibleCategories);

    return (
        <div className="category-selector">
            <div className="category-selector-header">
        <span className="category-selector-label">
          <FunnelIcon className="category-icon" />
          Categories
        </span>
            </div>

            <div className="category-pills">
                {displayCategories.map(category => (
                    <button
                        key={category}
                        className={`category-pill ${selectedCategory === category ? 'selected' : ''}`}
                        onClick={() => onSelectCategory(category)}
                        style={selectedCategory === category ?
                            { backgroundColor: getCategoryColor(category) } : {}}
                    >
                        {category}
                    </button>
                ))}

                {hasMoreCategories && (
                    <button
                        className="category-pill show-more"
                        onClick={() => setShowAllCategories(!showAllCategories)}
                    >
                        {showAllCategories ? 'Show Less' : `+${categories.length - maxVisibleCategories} More`}
                        <ChevronDownIcon
                            className={`chevron-icon ${showAllCategories ? 'rotated' : ''}`}
                        />
                    </button>
                )}
            </div>

            {selectedCategory !== 'all' && (
                <button
                    className="clear-category-button"
                    onClick={() => onSelectCategory('all')}
                >
                    Clear Filter
                </button>
            )}
        </div>
    );
};

export default CategorySelector;