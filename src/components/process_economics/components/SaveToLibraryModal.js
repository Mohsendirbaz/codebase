import React, { useState } from 'react';
import { 
  XMarkIcon, 
  FolderIcon, 
  TagIcon, 
  PlusIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

import { categories } from '../data/categoryData';

const SaveToLibraryModal = ({
  onClose,
  onSave,
  shelves = [],
  isLoadingShelves,
  defaultType = ''
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    modeler: '',
    shelf: 'none',
    tags: [],
    newTag: ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Add a new tag
  const handleAddTag = () => {
    const newTag = formData.newTag.trim();
    if (!newTag) return;
    
    if (formData.tags.includes(newTag)) {
      setErrors(prev => ({
        ...prev,
        newTag: 'Tag already exists'
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, newTag],
      newTag: ''
    }));
  };
  
  // Remove a tag
  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };
  
  // Submit the form
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate
    const validationErrors = {};
    if (!formData.name.trim()) {
      validationErrors.name = 'Name is required';
    }
    if (!formData.category) {
      validationErrors.category = 'Category is required';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSaving(true);
    
    // Call save callback
    onSave(formData);
  };
  
  return (
    <div className="modal-overlay">
      <motion.div 
        className="save-library-modal"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
      >
        <div className="modal-header">
          <h2 className="modal-title">Save to Library</h2>
          <button 
            className="modal-close-button"
            onClick={onClose}
          >
            <XMarkIcon className="close-icon" />
          </button>
        </div>
        
        <form className="save-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="name">Configuration Name <span className="required">*</span></label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Enter a name for this configuration"
                />
                {errors.name && (
                  <div className="error-message">{errors.name}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Enter a description"
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category <span className="required">*</span></label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`form-select ${errors.category ? 'error' : ''}`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <div className="error-message">{errors.category}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="modeler">Modeler Name</label>
                <input
                  id="modeler"
                  name="modeler"
                  type="text"
                  value={formData.modeler}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your name or organization"
                />
              </div>
            </div>
            
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="shelf">Save to Shelf</label>
                {isLoadingShelves ? (
                  <div className="loading-shelves">Loading shelves...</div>
                ) : (
                  <select
                    id="shelf"
                    name="shelf"
                    value={formData.shelf}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="none">No Shelf (All Items)</option>
                    {shelves.map(shelf => (
                      <option key={shelf} value={shelf}>{shelf}</option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="newTag">Tags</label>
                <div className="tag-input-container">
                  <div className="tag-input-with-button">
                    <input
                      id="newTag"
                      name="newTag"
                      type="text"
                      value={formData.newTag}
                      onChange={handleChange}
                      className={`form-input ${errors.newTag ? 'error' : ''}`}
                      placeholder="Add a tag"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="add-tag-button"
                      onClick={handleAddTag}
                    >
                      <PlusIcon className="add-icon" />
                      Add
                    </button>
                  </div>
                  {errors.newTag && (
                    <div className="error-message">{errors.newTag}</div>
                  )}
                </div>
                
                <div className="tags-list">
                  {formData.tags.length > 0 ? (
                    formData.tags.map((tag, index) => (
                      <div key={index} className="tag-item">
                        <TagIcon className="tag-icon" />
                        <span className="tag-text">{tag}</span>
                        <button 
                          type="button"
                          className="remove-tag-button"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <XMarkIcon className="remove-icon" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="no-tags">No tags added yet</div>
                  )}
                </div>
              </div>
              
              <div className="type-info">
                <div className="type-label">Configuration Type:</div>
                <div className="type-value">{defaultType || 'Mixed'}</div>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-button"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="loading-spinner"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="save-icon" />
                  Save to Library
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SaveToLibraryModal;