// src/modules/processEconomics/components/ItemCard.js (modified)
import React, { useState, useEffect } from 'react';
import { 
  ArrowDownTrayIcon,
  StarIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  FolderIcon,
  TrashIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

import ItemDetailsModal from './ItemDetailsModal';
import CopyLinkModal from './CopyLinkModal';
import UsageIndicator from './UsageIndicator';
import { deleteFromPersonalLibrary } from '../services/libraryService';
import { usageTracker } from '../services/usageTrackingService';
import { getCurrentUserId } from '../utils/authUtils';

const ItemCard = ({ 
  item,
  onImport,
  onToggleFavorite,
  onMoveToShelf,
  shelves = [],
  isPersonal = false,
  onAddToPersonal,
  viewMode = 'grid'
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShelfSelector, setShowShelfSelector] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [usageStats, setUsageStats] = useState(null);
  
  // Fetch usage statistics for this item
  useEffect(() => {
    const loadUsageStats = async () => {
      const stats = await usageTracker.getItemUsageStats(item.id);
      setUsageStats(stats);
    };
    
    loadUsageStats();
  }, [item.id]);
  
  // Determine complexity level
  const groupCount = item.configuration.currentState.scalingGroups.length;
  const complexity = 
    groupCount <= 2 ? 'Simple' :
    groupCount <= 5 ? 'Medium' : 'Complex';
  
  // Handle importing an item with usage tracking
  const handleImport = () => {
    // Track usage
    usageTracker.trackItemUsage(
      item.id, 
      getCurrentUserId(), 
      isPersonal ? 'personal' : 'general',
      'import'
    );
    
    // Call the original import function
    onImport(item.configuration);
  };
  
  // Handle viewing item details with usage tracking
  const handleViewDetails = () => {
    // Track view event
    usageTracker.trackItemUsage(
      item.id, 
      getCurrentUserId(), 
      isPersonal ? 'personal' : 'general',
      'view'
    );
    
    setShowDetails(true);
  };
  
  // Handle sharing an item with usage tracking
  const handleShare = () => {
    // Track share event
    usageTracker.trackItemUsage(
      item.id, 
      getCurrentUserId(), 
      isPersonal ? 'personal' : 'general',
      'share'
    );
    
    setShowShareModal(true);
  };
  
  // Handle deleting an item
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }
    
    try {
      await deleteFromPersonalLibrary(getCurrentUserId(), item.id);
      // After successful deletion, the parent component should refresh the items list
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };
  
  // Generate a sharable link for the item
  const getSharableLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/process-economics/item/${item.id}`;
  };
  
  // List view renders a different layout
  if (viewMode === 'list') {
    return (
      <div className="item-list-view">
        <div className="item-list-main" onClick={handleViewDetails}>
          <div className="item-list-title">
            {isPersonal && (
              <button 
                className="favorite-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item.id, !item.isFavorite);
                }}
              >
                {item.isFavorite ? (
                  <StarIconSolid className="star-icon filled" />
                ) : (
                  <StarIcon className="star-icon" />
                )}
              </button>
            )}
            <h3>{item.name}</h3>
            {usageStats && usageStats.total > 0 && (
              <UsageIndicator count={usageStats.total} compact={true} />
            )}
          </div>
          <div className="item-list-category">{item.category}</div>
          <div className="item-list-meta">
            <div className="item-list-complexity">{complexity}</div>
            <div className="item-list-groups">{groupCount} groups</div>
            {item.modeler && (
              <div className="item-list-modeler">By: {item.modeler}</div>
            )}
          </div>
        </div>
        
        <div className="item-list-actions">
          <button 
            className="item-action-button primary"
            onClick={handleImport}
            title="Import configuration"
          >
            <ArrowDownTrayIcon className="action-icon" />
          </button>
          
          <button 
            className="item-action-button"
            onClick={handleShare}
            title="Share"
          >
            <ShareIcon className="action-icon" />
          </button>
          
          <button 
            className="item-action-button"
            onClick={() => setShowMenu(!showMenu)}
            title="More options"
          >
            <EllipsisHorizontalIcon className="action-icon" />
          </button>
          
          {showMenu && (
            <div className="item-menu">
              {!isPersonal && (
                <button 
                  className="item-menu-option"
                  onClick={() => {
                    setShowMenu(false);
                    onAddToPersonal(item, getCurrentUserId());
                  }}
                >
                  <FolderIcon className="menu-icon" />
                  <span>Add to Personal Library</span>
                </button>
              )}
              
              {isPersonal && (
                <>
                  <button 
                    className="item-menu-option"
                    onClick={() => {
                      setShowMenu(false);
                      setShowShelfSelector(true);
                    }}
                  >
                    <FolderIcon className="menu-icon" />
                    <span>Move to Shelf</span>
                  </button>
                  
                  <button 
                    className="item-menu-option delete"
                    onClick={() => {
                      setShowMenu(false);
                      handleDelete();
                    }}
                  >
                    <TrashIcon className="menu-icon" />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          )}
          
          {showShelfSelector && (
            <div className="shelf-selector-menu">
              <div className="shelf-selector-header">
                <h4>Select Shelf</h4>
                <button 
                  className="close-button"
                  onClick={() => setShowShelfSelector(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="shelf-options">
                <button 
                  className="shelf-option"
                  onClick={() => {
                    onMoveToShelf(item.id, 'all');
                    setShowShelfSelector(false);
                  }}
                >
                  All Items (No Shelf)
                </button>
                
                {shelves.map(shelf => (
                  <button 
                    key={shelf}
                    className="shelf-option"
                    onClick={() => {
                      onMoveToShelf(item.id, shelf);
                      setShowShelfSelector(false);
                    }}
                  >
                    {shelf}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {showDetails && (
          <ItemDetailsModal 
            item={item}
            onClose={() => setShowDetails(false)}
            onImport={handleImport}
            isPersonal={isPersonal}
            usageStats={usageStats}
          />
        )}
        
        {showShareModal && (
          <CopyLinkModal
            item={item}
            onClose={() => setShowShareModal(false)}
            sharableLink={getSharableLink()}
          />
        )}
      </div>
    );
  }
  
  // Default grid view
  return (
    <motion.div 
      className="item-card"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="item-card-header">
        <div className="item-title-row">
          <h3 
            className="item-title"
            onClick={handleViewDetails}
          >
            {item.name}
          </h3>
          
          {isPersonal && (
            <button 
              className="favorite-button"
              onClick={() => onToggleFavorite(item.id, !item.isFavorite)}
            >
              {item.isFavorite ? (
                <StarIconSolid className="star-icon filled" />
              ) : (
                <StarIcon className="star-icon" />
              )}
            </button>
          )}
        </div>
        
        <div className="item-category-row">
          <div className="item-category">{item.category}</div>
          {usageStats && usageStats.total > 0 && (
            <UsageIndicator count={usageStats.total} />
          )}
        </div>
      </div>
      
      <div className="item-card-body" onClick={handleViewDetails}>
        <div className="item-metadata">
          <div className="metadata-row">
            <span className="metadata-label">Complexity:</span>
            <span className={`complexity-badge ${complexity.toLowerCase()}`}>
              {complexity}
            </span>
          </div>
          
          <div className="metadata-row">
            <span className="metadata-label">Groups:</span>
            <span className="metadata-value">{groupCount}</span>
          </div>
          
          <div className="metadata-row">
            <span className="metadata-label">Type:</span>
            <span className="metadata-value">
              {item.configuration.metadata.scalingType || 'Mixed'}
            </span>
          </div>
          
          {item.shelf && (
            <div className="metadata-row">
              <span className="metadata-label">Shelf:</span>
              <span className="metadata-value shelf">{item.shelf}</span>
            </div>
          )}
          
          {item.modeler && (
            <div className="metadata-row">
              <span className="metadata-label">Modeler:</span>
              <span className="metadata-value">{item.modeler}</span>
            </div>
          )}
        </div>
        
        {item.tags && item.tags.length > 0 && (
          <div className="item-tags">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="item-tag">{tag}</span>
            ))}
            {item.tags.length > 3 && (
              <span className="more-tags">+{item.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
      
      <div className="item-card-actions">
        <button 
          className="item-action-button primary"
          onClick={handleImport}
          title="Import configuration"
        >
          <ArrowDownTrayIcon className="action-icon" />
          <span>Import</span>
        </button>
        
        <button 
          className="item-action-button"
          onClick={handleShare}
          title="Share"
        >
          <ShareIcon className="action-icon" />
        </button>
        
        <div className="item-menu-container">
          <button 
            className="item-action-button"
            onClick={() => setShowMenu(!showMenu)}
            title="More options"
          >
            <EllipsisHorizontalIcon className="action-icon" />
          </button>
          
          {showMenu && (
            <div className="item-menu">
              {!isPersonal && (
                <button 
                  className="item-menu-option"
                  onClick={() => {
                    setShowMenu(false);
                    onAddToPersonal(item, getCurrentUserId());
                  }}
                >
                  <FolderIcon className="menu-icon" />
                  <span>Add to Personal Library</span>
                </button>
              )}
              
              {isPersonal && (
                <>
                  <button 
                    className="item-menu-option"
                    onClick={() => {
                      setShowMenu(false);
                      setShowShelfSelector(true);
                    }}
                  >
                    <FolderIcon className="menu-icon" />
                    <span>Move to Shelf</span>
                  </button>
                  
                  <button 
                    className="item-menu-option delete"
                    onClick={() => {
                      setShowMenu(false);
                      handleDelete();
                    }}
                  >
                    <TrashIcon className="menu-icon" />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {showShelfSelector && (
        <div className="shelf-selector-menu">
          <div className="shelf-selector-header">
            <h4>Select Shelf</h4>
            <button 
              className="close-button"
              onClick={() => setShowShelfSelector(false)}
            >
              ×
            </button>
          </div>
          
          <div className="shelf-options">
            <button 
              className="shelf-option"
              onClick={() => {
                onMoveToShelf(item.id, 'all');
                setShowShelfSelector(false);
              }}
            >
              All Items (No Shelf)
            </button>
            
            {shelves.map(shelf => (
              <button 
                key={shelf}
                className="shelf-option"
                onClick={() => {
                  onMoveToShelf(item.id, shelf);
                  setShowShelfSelector(false);
                }}
              >
                {shelf}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {showDetails && (
        <ItemDetailsModal 
          item={item}
          onClose={() => setShowDetails(false)}
          onImport={handleImport}
          isPersonal={isPersonal}
          usageStats={usageStats}
        />
      )}
      
      {showShareModal && (
        <CopyLinkModal
          item={item}
          onClose={() => setShowShareModal(false)}
          sharableLink={getSharableLink()}
        />
      )}
    </motion.div>
  );
};

export default ItemCard;