// src/modules/processEconomics/components/LibraryHeader.js
import React from 'react';
import { 
  XMarkIcon, 
  BookOpenIcon, 
  ChartBarIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

const LibraryHeader = ({ onClose, onToggleUsageStats, showUsageStats }) => {
  return (
    <div className="library-header">
      <div className="library-title">
        <BookOpenIcon className="library-logo" />
        <h1 className="library-name">Process Economics Library</h1>
      </div>
      
      <div className="library-actions">
        <button 
          className="header-action-button tooltip-container"
          onClick={onToggleUsageStats}
          title={showUsageStats ? "Return to library" : "View usage statistics"}
        >
          <ChartBarIcon className="header-action-icon" />
          <span className="tooltip">
            {showUsageStats ? "Return to library" : "Usage statistics"}
          </span>
        </button>
        
        <button 
          className="header-action-button tooltip-container"
          onClick={() => window.open('/help/process-economics-library', '_blank')}
          title="Help & documentation"
        >
          <InformationCircleIcon className="header-action-icon" />
          <span className="tooltip">Help & documentation</span>
        </button>
        
        <button 
          className="header-action-button tooltip-container"
          onClick={() => window.open('/tutorials/process-economics', '_blank')}
          title="Tutorials"
        >
          <QuestionMarkCircleIcon className="header-action-icon" />
          <span className="tooltip">Tutorials</span>
        </button>
        
        <button 
          className="header-action-button close tooltip-container"
          onClick={onClose}
          title="Close library"
        >
          <XMarkIcon className="header-action-icon" />
          <span className="tooltip">Close</span>
        </button>
      </div>
    </div>
  );
};

export default LibraryHeader;