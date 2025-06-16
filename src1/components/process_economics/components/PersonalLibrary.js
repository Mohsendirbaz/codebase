import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  FolderPlusIcon, 
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

import ShelfSelector from './ShelfSelector';
import ItemCard from './ItemCard';
import { updatePersonalLibrary, createShelf, removeShelf, renameShelf } from '../services/libraryService';

const PersonalLibrary = ({ 
  items, 
  setItems, 
  onImportConfiguration, 
  userId,
  isSearchView = false 
}) => {
  const [selectedShelf, setSelectedShelf] = useState('all');
  const [shelves, setShelves] = useState(['favorites']);
  const [isAddingShelf, setIsAddingShelf] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [editingShelf, setEditingShelf] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  
  // Extract shelves from items
  useEffect(() => {
    if (!items || items.length === 0) return;
    
    const extractedShelves = new Set(['favorites']);
    items.forEach(item => {
      if (item.shelf) {
        extractedShelves.add(item.shelf);
      }
    });
    
    setShelves(Array.from(extractedShelves));
  }, [items]);
  
  // Add a new shelf
  const handleAddShelf = async () => {
    if (!newShelfName.trim()) return;
    
    const shelfName = newShelfName.trim();
    if (shelves.includes(shelfName)) {
      alert('A shelf with this name already exists');
      return;
    }
    
    const updatedShelves = [...shelves, shelfName];
    setShelves(updatedShelves);
    
    // Save to backend
    await createShelf(userId, shelfName);
    
    setNewShelfName('');
    setIsAddingShelf(false);
  };
  
  // Remove a shelf
  const handleRemoveShelf = async (shelf) => {
    if (shelf === 'all' || shelf === 'favorites') {
      alert('Cannot remove this shelf');
      return;
    }
    
    if (!confirm(`Are you sure you want to remove the "${shelf}" shelf?`)) {
      return;
    }
    
    // Remove shelf name from items on this shelf (items remain in library)
    const updatedItems = items.map(item => {
      if (item.shelf === shelf) {
        return { ...item, shelf: null };
      }
      return item;
    });
    
    setItems(updatedItems);
    
    // Update shelves list
    const updatedShelves = shelves.filter(s => s !== shelf);
    setShelves(updatedShelves);
    
    // Save to backend
    await removeShelf(userId, shelf);
    await updatePersonalLibrary(userId, updatedItems);
    
    // If we were viewing the shelf that was removed, switch to 'all'
    if (selectedShelf === shelf) {
      setSelectedShelf('all');
    }
  };
  
  // Rename a shelf
  const handleRenameShelf = async (oldName, newName) => {
    if (oldName === 'all' || oldName === 'favorites') {
      alert('Cannot rename this shelf');
      return;
    }
    
    if (!newName.trim()) {
      return;
    }
    
    if (shelves.includes(newName.trim()) && newName.trim() !== oldName) {
      alert('A shelf with this name already exists');
      return;
    }
    
    // Update shelf name in items
    const updatedItems = items.map(item => {
      if (item.shelf === oldName) {
        return { ...item, shelf: newName.trim() };
      }
      return item;
    });
    
    setItems(updatedItems);
    
    // Update shelves list
    const updatedShelves = shelves.map(s => s === oldName ? newName.trim() : s);
    setShelves(updatedShelves);
    
    // Save to backend
    await renameShelf(userId, oldName, newName.trim());
    await updatePersonalLibrary(userId, updatedItems);
    
    // If we were viewing the shelf that was renamed, switch to the new name
    if (selectedShelf === oldName) {
      setSelectedShelf(newName.trim());
    }
    
    setEditingShelf(null);
  };
  
  // Handle drag and drop to move items between shelves
  const handleDragStart = (item) => {
    setDraggedItem(item);
  };
  
  const handleDrop = async (shelfName) => {
    if (!draggedItem) return;
    
    // Update item's shelf
    const updatedItems = items.map(item => {
      if (item.id === draggedItem.id) {
        return { ...item, shelf: shelfName === 'all' ? null : shelfName };
      }
      return item;
    });
    
    setItems(updatedItems);
    
    // Save to backend
    await updatePersonalLibrary(userId, updatedItems);
    
    setDraggedItem(null);
  };
  
  // Filter items based on selected shelf
  const filteredItems = items.filter(item => {
    if (selectedShelf === 'all') {
      return true;
    } else if (selectedShelf === 'favorites') {
      return item.isFavorite;
    } else {
      return item.shelf === selectedShelf;
    }
  });
  
  // Handle toggling an item as favorite
  const handleToggleFavorite = async (id, isFavorite) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        return { ...item, isFavorite };
      }
      return item;
    });
    
    setItems(updatedItems);
    
    // Save to backend
    await updatePersonalLibrary(userId, updatedItems);
  };
  
  // Handle moving an item to a shelf
  const handleMoveToShelf = async (id, shelf) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        return { ...item, shelf: shelf === 'all' ? null : shelf };
      }
      return item;
    });
    
    setItems(updatedItems);
    
    // Save to backend
    await updatePersonalLibrary(userId, updatedItems);
  };
  
  // If this is a search view, render a simpler version
  if (isSearchView) {
    return (
      <div className="library-items-grid">
        {filteredItems.map(item => (
          <ItemCard 
            key={item.id}
            item={item}
            onImport={onImportConfiguration}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className="personal-library">
      <div className="personal-library-shelves" 
        onDragOver={(e) => e.preventDefault()}>
        <h2>My Shelves</h2>
        
        <ShelfSelector 
          shelves={shelves}
          selectedShelf={selectedShelf}
          onSelectShelf={setSelectedShelf}
          onRemoveShelf={handleRemoveShelf}
          editingShelf={editingShelf}
          setEditingShelf={setEditingShelf}
          onRenameShelf={handleRenameShelf}
          onDrop={handleDrop}
        />
        
        {isAddingShelf ? (
          <div className="add-shelf-form">
            <input
              type="text"
              value={newShelfName}
              onChange={(e) => setNewShelfName(e.target.value)}
              placeholder="Shelf name"
              className="shelf-name-input"
              autoFocus
            />
            <div className="shelf-form-actions">
              <button 
                className="shelf-action-button confirm"
                onClick={handleAddShelf}
              >
                Add
              </button>
              <button 
                className="shelf-action-button cancel"
                onClick={() => {
                  setIsAddingShelf(false);
                  setNewShelfName('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button 
            className="add-shelf-button"
            onClick={() => setIsAddingShelf(true)}
          >
            <FolderPlusIcon className="add-shelf-icon" />
            <span>Add New Shelf</span>
          </button>
        )}
      </div>
      
      <div className="personal-library-content">
        <h2>
          {selectedShelf === 'all' 
            ? 'All Items' 
            : selectedShelf === 'favorites' 
              ? 'Favorites'
              : `Shelf: ${selectedShelf}`}
        </h2>
        
        <div className="library-items-grid">
          <AnimatePresence>
            {filteredItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                layoutId={item.id}
                draggable
                onDragStart={() => handleDragStart(item)}
              >
                <ItemCard 
                  item={item}
                  onImport={onImportConfiguration}
                  onToggleFavorite={handleToggleFavorite}
                  onMoveToShelf={handleMoveToShelf}
                  shelves={shelves}
                  isPersonal={true}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {filteredItems.length === 0 && (
          <div className="empty-shelf">
            <p>No items in this shelf</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalLibrary;