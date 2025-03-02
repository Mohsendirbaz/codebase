import React, { useState, useEffect, useCallback } from 'react';
import './OverlayController.css';
import NavigationManager from './NavigationManager';

const TRANSITION_DURATION = 300; // ms

const OverlayController = ({ 
  activeModel, 
  activeOverlay, 
  children, 
  onNavigate, 
  onClose 
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentContent, setCurrentContent] = useState(null);
  const [nextContent, setNextContent] = useState(null);

  // Handle overlay changes
  useEffect(() => {
    if (children) {
      if (currentContent) {
        setIsTransitioning(true);
        setNextContent(children);
        
        // Wait for exit animation
        setTimeout(() => {
          setCurrentContent(children);
          setNextContent(null);
          setIsTransitioning(false);
        }, TRANSITION_DURATION);
      } else {
        setCurrentContent(children);
      }
    } else {
      setCurrentContent(null);
      setNextContent(null);
    }
  }, [children]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle click outside
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Prevent scroll on body when overlay is open
  useEffect(() => {
    if (activeOverlay) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeOverlay]);

  if (!activeOverlay && !currentContent) {
    return null;
  }

  return (
    <div 
      className="overlay-container"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="overlay-title"
    >
      <div className="overlay-backdrop" />
      
      <div className={`overlay-content ${isTransitioning ? 'transitioning' : ''}`}>
        <NavigationManager
          activeModel={activeModel}
          activeOverlay={activeOverlay}
          onNavigate={onNavigate}
          onClose={onClose}
        />
        
        <div className="overlay-body">
          {currentContent}
          {nextContent && (
            <div className="next-content">
              {nextContent}
            </div>
          )}
        </div>
      </div>

      {/* Accessibility: Close button for screen readers */}
      <button
        className="sr-only"
        onClick={onClose}
        aria-label="Close overlay"
      >
        Close
      </button>
    </div>
  );
};

export default OverlayController;
