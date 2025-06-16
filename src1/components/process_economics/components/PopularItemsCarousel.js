/**
 * A carousel component for displaying popular items with responsive layout and navigation.
 * 
 * @component
 * @param {Object[]} items - Array of items to be displayed in the carousel
 * @param {Function} onImport - Callback function for importing an item
 * @param {Function} onAddToPersonal - Callback function for adding an item to personal collection
 * 
 * @returns {React.ReactElement} A responsive carousel with navigation buttons and indicators
 * 
 * @example
 * <PopularItemsCarousel 
 *   items={popularItems} 
 *   onImport={handleImport} 
 *   onAddToPersonal={handleAddToPersonal} 
 * />
 */
// src/modules/processEconomics/components/PopularItemsCarousel.js
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

import ItemCard from './ItemCard';

const PopularItemsCarousel = ({ items, onImport, onAddToPersonal }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleItems, setVisibleItems] = useState(3);
  const carouselRef = useRef(null);
  
  // Update visible items count based on screen width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setVisibleItems(1);
      } else if (width < 1200) {
        setVisibleItems(2);
      } else {
        setVisibleItems(3);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Navigate to next slide
  const handleNext = () => {
    if (currentIndex < items.length - visibleItems) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  };
  
  // Navigate to previous slide
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  };
  
  // Check if navigation buttons should be enabled
  const canGoNext = currentIndex < items.length - visibleItems;
  const canGoPrev = currentIndex > 0;
  
  return (
    <div className="popular-items-carousel">
      <button
        className={`carousel-button prev ${!canGoPrev ? 'disabled' : ''}`}
        onClick={handlePrev}
        disabled={!canGoPrev}
      >
        <ChevronLeftIcon className="carousel-button-icon" />
      </button>
      
      <div className="carousel-container" ref={carouselRef}>
        <motion.div
          className="carousel-track"
          animate={{
            x: `-${currentIndex * (100 / visibleItems)}%`
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {items.map(item => (
            <div
              key={item.id}
              className={`carousel-item style-${visibleItems}`}
              style={{ width: `${100 / visibleItems}%` }}
            >
              <ItemCard
                item={item}
                onImport={onImport}
                onAddToPersonal={onAddToPersonal}
              />
            </div>
          ))}
        </motion.div>
      </div>
      
      <button
        className={`carousel-button next ${!canGoNext ? 'disabled' : ''}`}
        onClick={handleNext}
        disabled={!canGoNext}
      >
        <ChevronRightIcon className="carousel-button-icon" />
      </button>
      
      <div className="carousel-indicators">
        {Array.from({ length: Math.ceil(items.length / visibleItems) }).map((_, index) => (
          <button
            key={index}
            className={`carousel-indicator ${index === Math.floor(currentIndex / visibleItems) ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index * visibleItems)}
          />
        ))}
      </div>
    </div>
  );
};

export default PopularItemsCarousel;