import React, { useState, useCallback, useEffect } from 'react';
import './NavigationManager.css';

const NAVIGATION_LEVELS = {
  ROOT: 'root',
  CONFIGURATION: 'configuration',
  ANALYSIS: 'analysis',
  OPTIMIZATION: 'optimization'
};

const OVERLAY_TYPES = {
  FILTER: 'filter',
  IMPACT: 'impact',
  SENSITIVITY: 'sensitivity',
  RISK: 'risk',
  OPTIMIZATION: 'optimization'
};

const NavigationManager = ({ activeModel, activeOverlay, onNavigate, onClose }) => {
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(NAVIGATION_LEVELS.ROOT);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Initialize navigation history
  useEffect(() => {
    if (activeOverlay) {
      const level = getNavigationLevel(activeOverlay);
      setNavigationHistory([NAVIGATION_LEVELS.ROOT, level]);
      setCurrentLevel(level);
    }
  }, [activeOverlay]);

  // Get navigation level from overlay type
  const getNavigationLevel = (overlayType) => {
    switch (overlayType) {
      case OVERLAY_TYPES.FILTER:
        return NAVIGATION_LEVELS.CONFIGURATION;
      case OVERLAY_TYPES.IMPACT:
      case OVERLAY_TYPES.SENSITIVITY:
      case OVERLAY_TYPES.RISK:
        return NAVIGATION_LEVELS.ANALYSIS;
      case OVERLAY_TYPES.OPTIMIZATION:
        return NAVIGATION_LEVELS.OPTIMIZATION;
      default:
        return NAVIGATION_LEVELS.ROOT;
    }
  };

  // Get available actions for current level
  const getAvailableActions = useCallback(() => {
    switch (currentLevel) {
      case NAVIGATION_LEVELS.ROOT:
        return [
          {
            id: 'configure',
            label: 'Configure Model',
            icon: '⚙️',
            level: NAVIGATION_LEVELS.CONFIGURATION,
            overlay: OVERLAY_TYPES.FILTER
          },
          {
            id: 'analyze',
            label: 'Analysis Tools',
            icon: '📊',
            level: NAVIGATION_LEVELS.ANALYSIS
          },
          {
            id: 'optimize',
            label: 'Optimization',
            icon: '🎯',
            level: NAVIGATION_LEVELS.OPTIMIZATION,
            overlay: OVERLAY_TYPES.OPTIMIZATION
          }
        ];
      case NAVIGATION_LEVELS.ANALYSIS:
        return [
          {
            id: 'impact',
            label: 'Impact Analysis',
            icon: '📈',
            overlay: OVERLAY_TYPES.IMPACT
          },
          {
            id: 'sensitivity',
            label: 'Sensitivity Analysis',
            icon: '🔄',
            overlay: OVERLAY_TYPES.SENSITIVITY
          },
          {
            id: 'risk',
            label: 'Risk Assessment',
            icon: '⚠️',
            overlay: OVERLAY_TYPES.RISK
          }
        ];
      default:
        return [];
    }
  }, [currentLevel]);

  // Handle navigation
  const handleNavigation = useCallback((action) => {
    setIsTransitioning(true);

    // Update navigation history
    if (action.level) {
      setNavigationHistory(prev => [...prev, action.level]);
      setCurrentLevel(action.level);
    }

    // Trigger overlay change
    if (action.overlay) {
      onNavigate(action.overlay);
    }

    // Animation timing
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [onNavigate]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (navigationHistory.length > 1) {
      setIsTransitioning(true);

      // Remove current level from history
      const newHistory = navigationHistory.slice(0, -1);
      setNavigationHistory(newHistory);
      setCurrentLevel(newHistory[newHistory.length - 1]);

      // Close overlay if returning to root
      if (newHistory.length === 1) {
        onClose();
      }

      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
  }, [navigationHistory, onClose]);

  return (
    <div className="navigation-manager">
      {/* Breadcrumb Navigation */}
      <div className="navigation-breadcrumb">
        {navigationHistory.map((level, index) => (
          <React.Fragment key={level}>
            {index > 0 && <span className="breadcrumb-separator">›</span>}
            <button
              className="breadcrumb-item"
              onClick={() => {
                if (index < navigationHistory.length - 1) {
                  setNavigationHistory(prev => prev.slice(0, index + 1));
                  setCurrentLevel(level);
                }
              }}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Action Grid */}
      <div className={`action-grid ${isTransitioning ? 'transitioning' : ''}`}>
        {currentLevel !== NAVIGATION_LEVELS.ROOT && (
          <button
            className="back-button"
            onClick={handleBack}
          >
            ‹ Back
          </button>
        )}
        {getAvailableActions().map(action => (
          <button
            key={action.id}
            className={`action-button ${activeOverlay === action.overlay ? 'active' : ''}`}
            onClick={() => handleNavigation(action)}
          >
            <span className="action-icon">{action.icon}</span>
            <span className="action-label">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Context Help */}
      <div className="context-help">
        <button className="help-button" onClick={() => {/* Help system integration */}}>
          <span className="help-icon">?</span>
          <span className="help-label">Help</span>
        </button>
        <div className="keyboard-shortcuts">
          <span className="shortcut-label">ESC</span>
          <span className="shortcut-description">to close</span>
          <span className="shortcut-label">←</span>
          <span className="shortcut-description">to go back</span>
        </div>
      </div>
    </div>
  );
};

export default NavigationManager;
