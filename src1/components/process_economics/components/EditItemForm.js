import React, { useState } from 'react';
import { TagIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { updatePersonalLibraryItem } from '../services/libraryService';
import { getCurrentUserId } from '../utils/authUtils';
import { categories } from '../data/categoryData';

const EditItemForm = ({ item, onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    name: item.name || '',
    description: item.description || '',
    category: item.category || '',
    modeler: item.modeler || '',
    tags: item.tags || [],
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
  const handleSubmit = async (e) => {
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
    
    try {
      // Prepare updated item data
      const updatedItem = {
        ...item,
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        modeler: formData.modeler.trim(),
        tags: formData.tags,
        dateModified: new Date().toISOString()
      };
      
      // Update in backend
      await updatePersonalLibraryItem(getCurrentUserId(), updatedItem);
      
      // Call save callback
      onSave(updatedItem);
    } catch (error) {
      console.error('Error saving item:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Error saving item. Please try again.'
      }));
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <form className="edit-item-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <div className="form-group">
          <label htmlFor="name">Name <span className="required">*</span></label>
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
            placeholder="Enter modeler's name"
          />
        </div>
      </div>
      
      <div className="form-section">
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
      </div>
      
      {errors.submit && (
        <div className="form-error-message">{errors.submit}</div>
      )}
      
      <div className="form-actions">
        <button 
          type="button" 
          className="cancel-button"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="save-button"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default EditItemForm;