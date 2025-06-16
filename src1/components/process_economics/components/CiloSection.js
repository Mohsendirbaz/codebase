// src/modules/processEconomics/components/CiloSection.js
import React, { useState, useEffect } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

import ItemCard from './ItemCard';
import { usageTracker } from '../services/usageTrackingService';

const CiloSection = ({ 
  cilo, 
  items = [], 
  onImport, 
  onAddToPersonal, 
  maxVisible = 3,
  onViewAll
}) => {
  const [visibleItems, setVisibleItems] = useState([]);
  const [itemUsage, setItemUsage] = useState({});
  
  // Initialize with most relevant items for this cilo
  useEffect(() => {
    // Filter items by cilo type (using tags or categories)
    const ciloItems = items.filter(item => {
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
    
    // Sort by popularity if usage stats are available
    ciloItems.sort((a, b) => {
      const aUsage = a.usage?.total || 0;
      const bUsage = b.usage?.total || 0;
      return bUsage - aUsage;
    });
    
    // Limit to maxVisible items
    setVisibleItems(ciloItems.slice(0, maxVisible));
    
    // Load usage stats for these items
    loadItemUsage(ciloItems.slice(0, maxVisible));
  }, [items, cilo, maxVisible]);
  
  // Load usage statistics for items
  const loadItemUsage = async (items) => {
    const usageData = {};
    
    // Fetch usage stats for each item
    for (const item of items) {
      try {
        const stats = await usageTracker.getItemUsageStats(item.id);
        usageData[item.id] = stats;
      } catch (error) {
        console.error(`Error loading usage for ${item.id}:`, error);
      }
    }
    
    setItemUsage(usageData);
  };
  
  const IconComponent = cilo.icon;
  
  return (
    <div className={`cilo-section ${cilo.id}`}>
      <div className="cilo-header">
        <div className="cilo-title">
          <IconComponent className="cilo-icon" />
          <h2 className="cilo-name">{cilo.name}</h2>
        </div>
      </div>
      
      <p className="cilo-description">{cilo.description}</p>
      
      <div className="cilo-content">
        {visibleItems.length > 0 ? (
          <div className="cilo-grid">
            {visibleItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ItemCard
                  item={item}
                  onImport={onImport}
                  onAddToPersonal={onAddToPersonal}
                  usageStats={itemUsage[item.id]}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="empty-cilo">
            <p>No configurations available for {cilo.name}.</p>
          </div>
        )}
      </div>
      
      <div className="cilo-footer">
        <button 
          className="view-all-button"
          onClick={() => onViewAll(cilo.id)}
        >
          <span>View all {cilo.name}</span>
          <ArrowRightIcon className="view-all-icon" />
        </button>
      </div>
    </div>
  );
};

export default CiloSection;