import React, { useState } from 'react';
import { 
  FolderIcon, 
  StarIcon, 
  Squares2X2Icon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const ShelfSelector = ({ 
  shelves, 
  selectedShelf, 
  onSelectShelf,
  onRemoveShelf,
  editingShelf,
  setEditingShelf,
  onRenameShelf,
  onDrop
}) => {
  const [newShelfName, setNewShelfName] = useState('');
  
  // Handle drag over for all shelves
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  // Handle drop on a specific shelf
  const handleShelfDrop = (e, shelfName) => {
    e.preventDefault();
    onDrop(shelfName);
  };
  
  // Special shelves (All and Favorites)
  const specialShelves = [
    {
      id: 'all',
      name: 'All Items',
      icon: Squares2X2Icon
    },
    {
      id: 'favorites',
      name: 'Favorites',
      icon: StarIcon
    }
  ];
  
  return (
    <div className="shelf-selector">
      <div className="shelves-list">
        <div className="special-shelves">
          {specialShelves.map(shelf => (
            <div
              key={shelf.id}
              className={`shelf-item ${selectedShelf === shelf.id ? 'selected' : ''}`}
              onClick={() => onSelectShelf(shelf.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleShelfDrop(e, shelf.id)}
            >
              <shelf.icon className="shelf-icon" />
              <span className="shelf-name">{shelf.name}</span>
            </div>
          ))}
        </div>
        
        {shelves.length > 0 && shelves.some(shelf => !['all', 'favorites'].includes(shelf)) && (
          <>
            <div className="shelf-divider">
              <span>Custom Shelves</span>
            </div>
            
            <div className="custom-shelves">
              {shelves
                .filter(shelf => !['all', 'favorites'].includes(shelf))
                .map(shelf => (
                  <motion.div
                    key={shelf}
                    className={`shelf-item custom ${selectedShelf === shelf ? 'selected' : ''}`}
                    onClick={() => onSelectShelf(shelf)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleShelfDrop(e, shelf)}
                  >
                    <div className="shelf-main">
                      <FolderIcon className="shelf-icon" />
                      
                      {editingShelf === shelf ? (
                        <input
                          type="text"
                          className="shelf-edit-input"
                          defaultValue={shelf}
                          autoFocus
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (value !== shelf && value.trim()) {
                              onRenameShelf(shelf, value);
                            } else {
                              setEditingShelf(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const value = e.target.value;
                              if (value !== shelf && value.trim()) {
                                onRenameShelf(shelf, value);
                              } else {
                                setEditingShelf(null);
                              }
                            } else if (e.key === 'Escape') {
                              setEditingShelf(null);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="shelf-name">{shelf}</span>
                      )}
                    </div>
                    
                    <div className="shelf-actions">
                      <button
                        className="shelf-action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingShelf(shelf);
                        }}
                        title="Rename shelf"
                      >
                        <PencilIcon className="shelf-action-icon" />
                      </button>
                      <button
                        className="shelf-action-button remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveShelf(shelf);
                        }}
                        title="Remove shelf"
                      >
                        <TrashIcon className="shelf-action-icon" />
                      </button>
                    </div>
                  </motion.div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShelfSelector;