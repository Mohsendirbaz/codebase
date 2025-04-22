import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon, 
  ArrowDownOnSquareIcon, 
   FolderArrowDownIcon, 
  TagIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import { motion } from 'framer-motion';

/**
 * Process Economics Library Module
 *
 * A component for managing a library of pre-costed items with scaling configurations
 * that can be searched, filtered, and imported into the current project.
 */
const ProcessEconomicsLibrary = ({
  onImportConfiguration,  // Callback when importing a configuration
  onClose,                // Callback to close the library panel
  currentConfiguration,   // Current active configuration for potential saving
  filterKeyword = ''      // Current working scaling type/category
}) => {
  // State for library items
  const [libraryItems, setLibraryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [complexityFilter, setComplexityFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Import/Export state
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveCategory, setSaveCategory] = useState('');
  const [saveTags, setSaveTags] = useState([]);
  const [saveTagInput, setSaveTagInput] = useState('');

  // References
  const fileInputRef = useRef(null);

  // Available categories for filtering
  const categories = [
    "Heat Exchangers",
    "Pumps & Compressors",
    "Vessels & Tanks",
    "Reactors",
    "Separation Equipment",
    "Material Handling",
    "Utilities"
  ];

  // Load library items from localStorage or external API
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        // First check localStorage
        const savedLibrary = localStorage.getItem('processEconomicsLibrary');
        if (savedLibrary) {
          const parsedLibrary = JSON.parse(savedLibrary);
          setLibraryItems(parsedLibrary);
          setFilteredItems(parsedLibrary);
          return;
        }

        // If no localStorage data, could fetch from server
        // const response = await fetch('api/process-economics-library');
        // const data = await response.json();
        // setLibraryItems(data);
        // setFilteredItems(data);

        // For demo, set some sample data
        const sampleData = getSampleLibraryItems();
        setLibraryItems(sampleData);
        setFilteredItems(sampleData);
      } catch (error) {
        console.error('Error loading library:', error);
      }
    };

    loadLibrary();
  }, []);

  // Filter library items based on search term and filters
  useEffect(() => {
    let results = [...libraryItems];

    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      results = results.filter(item =>
        selectedCategories.includes(item.category)
      );
    }

    // Apply complexity filter (number of scaling groups)
    if (complexityFilter !== null) {
      results = results.filter(item => {
        const groupCount = item.configuration.currentState.scalingGroups.length;

        switch(complexityFilter) {
          case 'simple':
            return groupCount <= 2;
          case 'medium':
            return groupCount > 2 && groupCount <= 5;
          case 'complex':
            return groupCount > 5;
          default:
            return true;
        }
      });
    }

    // If filterKeyword is provided, prioritize items of that type
    if (filterKeyword) {
      results.sort((a, b) => {
        const aType = a.configuration.metadata.scalingType;
        const bType = b.configuration.metadata.scalingType;

        if (aType === filterKeyword && bType !== filterKeyword) return -1;
        if (aType !== filterKeyword && bType === filterKeyword) return 1;
        return 0;
      });
    }

    setFilteredItems(results);
  }, [libraryItems, searchTerm, selectedCategories, complexityFilter, filterKeyword]);

  // Toggle category selection
  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Set complexity filter
  const setComplexity = (complexity) => {
    setComplexityFilter(prev => prev === complexity ? null : complexity);
  };

  // Save current configuration to library
  const saveToLibrary = () => {
    if (!saveName.trim()) {
      alert('Please provide a name for this configuration');
      return;
    }

    const newItem = {
      id: `item-${Date.now()}`,
      name: saveName,
      category: saveCategory || 'Uncategorized',
      description: `Saved on ${new Date().toLocaleDateString()}`,
      tags: saveTags,
      dateAdded: new Date().toISOString(),
      configuration: currentConfiguration || {
        version: "1.2.0",
        metadata: {
          exportDate: new Date().toISOString(),
          exportedBy: "ProcessEconomicsLibrary",
          description: "Saved from current project",
          scalingType: filterKeyword || "mixed"
        },
        currentState: {
          selectedGroupIndex: 0,
          scalingGroups: [],
          protectedTabs: [],
          tabConfigs: []
        }
      }
    };

    const updatedLibrary = [...libraryItems, newItem];
    setLibraryItems(updatedLibrary);

    // Save to localStorage
    localStorage.setItem('processEconomicsLibrary', JSON.stringify(updatedLibrary));

    // Reset form
    setIsSaving(false);
    setSaveName('');
    setSaveCategory('');
    setSaveTags([]);
  };

  // Add tag to current save item
  const addTag = () => {
    if (saveTagInput.trim() && !saveTags.includes(saveTagInput.trim())) {
      setSaveTags(prev => [...prev, saveTagInput.trim()]);
      setSaveTagInput('');
    }
  };

  // Remove tag from current save item
  const removeTag = (tag) => {
    setSaveTags(prev => prev.filter(t => t !== tag));
  };

  // Import configuration from library
  const importFromLibrary = (item) => {
    if (onImportConfiguration) {
      onImportConfiguration(item.configuration);
    }
    // Close library after import
    if (onClose) onClose();
  };

  // Import from file
  const importFromFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target.result);

        // Check if it's a valid configuration
        if (!importedConfig.version || !importedConfig.metadata) {
          alert('Invalid configuration file');
          return;
        }

        // Show save dialog to add to library
        setSelectedItem({
          configuration: importedConfig
        });
        setIsSaving(true);
        setSaveName(importedConfig.metadata.description || 'Imported Configuration');
        setSaveCategory('');
        setSaveTags([]);

      } catch (error) {
        console.error('Error importing file:', error);
        alert('Error importing file');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.readAsText(file);
  };

  // Export item to file
  const exportToFile = (item) => {
    const config = JSON.stringify(item.configuration, null, 2);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.name.replace(/\s+/g, '-').toLowerCase()}-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Delete item from library
  const deleteFromLibrary = (itemId) => {
    if (confirm('Are you sure you want to delete this item from the library?')) {
      const updatedLibrary = libraryItems.filter(item => item.id !== itemId);
      setLibraryItems(updatedLibrary);

      // Save to localStorage
      localStorage.setItem('processEconomicsLibrary', JSON.stringify(updatedLibrary));
    }
  };

  // Render item details
  const renderItemDetails = (item) => {
    if (!item) return null;

    // Count scaling groups
    const groupCount = item.configuration.currentState.scalingGroups?.length || 0;

    // Determine complexity label
    let complexityLabel = 'Simple';
    if (groupCount > 5) complexityLabel = 'Complex';
    else if (groupCount > 2) complexityLabel = 'Medium';

    return (
      <div className="library-item-details">
        <h3>{item.name}</h3>
        <p className="item-description">{item.description}</p>

        <div className="item-metadata">
          <div className="metadata-row">
            <span className="metadata-label">Category:</span>
            <span className="metadata-value">{item.category}</span>
          </div>
          <div className="metadata-row">
            <span className="metadata-label">Scaling Type:</span>
            <span className="metadata-value">{item.configuration.metadata.scalingType || 'Mixed'}</span>
          </div>
          <div className="metadata-row">
            <span className="metadata-label">Complexity:</span>
            <span className="metadata-value">{complexityLabel} ({groupCount} scaling groups)</span>
          </div>
          <div className="metadata-row">
            <span className="metadata-label">Added:</span>
            <span className="metadata-value">{new Date(item.dateAdded).toLocaleDateString()}</span>
          </div>
        </div>

        {item.tags.length > 0 && (
          <div className="item-tags">
            {item.tags.map(tag => (
              <span key={tag} className="item-tag">{tag}</span>
            ))}
          </div>
        )}

        <div className="item-actions">
          <button
            className="action-button import-button"
            onClick={() => importFromLibrary(item)}
          >
            Import Configuration
          </button>
          <button
            className="action-button export-button"
            onClick={() => exportToFile(item)}
          >
            Export to File
          </button>
          <button
            className="action-button delete-button"
            onClick={() => deleteFromLibrary(item.id)}
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="process-economics-library">
      <div className="library-header">
        <h2>
          <BookOpenIcon className="header-icon" />
          Process Economics Library
        </h2>
        <button className="close-button" onClick={onClose}>
          <XMarkIcon className="close-icon" />
        </button>
      </div>

      <div className="library-toolbar">
        <div className="search-container">
          <MagnifyingGlassIcon as MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-L"
          />
        </div>

        <div className="toolbar-actions">
          <button
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="button-icon" />
            Filters
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="file-input-hidden"
            accept=".json"
            onChange={importFromFile}
            style={{ display: 'none' }}
          />

          <button
            className="import-button"
            onClick={() => fileInputRef.current.click()}
          >
            < FolderArrowDownIcon className="button-icon" />
            Import from File
          </button>
        </div>
      </div>

      {showFilters && (
        <motion.div
          className="filters-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          <div className="filter-section">
            <h3>Categories</h3>
            <div className="category-filters">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-filter ${selectedCategories.includes(category) ? 'selected' : ''}`}
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>Complexity</h3>
            <div className="complexity-filters">
              <button
                className={`complexity-filter ${complexityFilter === 'simple' ? 'selected' : ''}`}
                onClick={() => setComplexity('simple')}
              >
                Simple (1-2 groups)
              </button>
              <button
                className={`complexity-filter ${complexityFilter === 'medium' ? 'selected' : ''}`}
                onClick={() => setComplexity('medium')}
              >
                Medium (3-5 groups)
              </button>
              <button
                className={`complexity-filter ${complexityFilter === 'complex' ? 'selected' : ''}`}
                onClick={() => setComplexity('complex')}
              >
                Complex (6+ groups)
              </button>
            </div>
          </div>

          <div className="filter-actions">
            <button
              className="clear-filters"
              onClick={() => {
                setSelectedCategories([]);
                setComplexityFilter(null);
              }}
            >
              Clear Filters
            </button>
          </div>
        </motion.div>
      )}

      <div className="library-content">
        <div className="items-panel">
          <div className="items-header">
            <h3>Library Items {filteredItems.length > 0 && `(${filteredItems.length})`}</h3>
            <div className="sort-options">
              <select className="sort-select">
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
                <option value="category">Sort by Category</option>
              </select>
            </div>
          </div>

          <div className="items-list">
            {filteredItems.length === 0 ? (
              <div className="no-items">
                <p>No items found matching your criteria</p>
              </div>
            ) : (
              filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`library-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="item-preview">
                    <h4 className="item-name">{item.name}</h4>
                    <p className="item-category">{item.category}</p>
                    <p className="item-scaling-type">
                      Type: {item.configuration.metadata.scalingType || 'Mixed'}
                    </p>
                    <div className="item-groups-count">
                      {item.configuration.currentState.scalingGroups?.length || 0} scaling groups
                    </div>
                  </div>
                  <div className="item-preview-actions">
                    <button
                      className="preview-action import"
                      onClick={(e) => {
                        e.stopPropagation();
                        importFromLibrary(item);
                      }}
                      title="Import into current project"
                    >
                      <ArrowDownTrayIcon className="preview-action-icon" />
                    </button>
                    <button
                      className="preview-action adjust"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                      }}
                      title="View details"
                    >
                      <AdjustmentsHorizontalIcon className="preview-action-icon" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="details-panel">
          {selectedItem ? (
            renderItemDetails(selectedItem)
          ) : (
            <div className="no-selection">
              <p>Select an item to view details</p>
            </div>
          )}
        </div>
      </div>

      {isSaving && (
        <div className="modal-overlay">
          <div className="save-modal">
            <h3>Save Configuration to Library</h3>

            <div className="form-group">
              <label htmlFor="saveName">Name:</label>
              <input
                id="saveName"
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Enter a name for this configuration"
                className="save-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="saveCategory">Category:</label>
              <select
                id="saveCategory"
                value={saveCategory}
                onChange={(e) => setSaveCategory(e.target.value)}
                className="save-select"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="saveTags">Tags:</label>
              <div className="tags-input-container">
                <input
                  id="saveTags"
                  type="text"
                  value={saveTagInput}
                  onChange={(e) => setSaveTagInput(e.target.value)}
                  placeholder="Add tags (press Enter after each tag)"
                  className="save-input tag-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <button className="add-tag-button" onClick={addTag}>
                  <TagIcon className="tag-icon" />
                  Add
                </button>
              </div>

              {saveTags.length > 0 && (
                <div className="tags-list">
                  {saveTags.map(tag => (
                    <div key={tag} className="tag-item">
                      <span className="tag-text">{tag}</span>
                      <button
                        className="remove-tag-button"
                        onClick={() => removeTag(tag)}
                      >
                        <XMarkIcon className="remove-icon" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setIsSaving(false)}
              >
                Cancel
              </button>
              <button 
                className="save-confirm-button"
                onClick={saveToLibrary}
                disabled={!saveName.trim()}
              >
                Save to Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sample library items for demo purposes
const getSampleLibraryItems = () => [
  {
    id: 'item-1',
    name: 'Shell & Tube Heat Exchanger',
    category: 'Heat Exchangers',
    description: 'Standard shell & tube heat exchanger with six-tenths rule scaling',
    tags: ['heat transfer', 'shell & tube', 'standard'],
    dateAdded: '2025-01-15T00:00:00.000Z',
    configuration: {
      version: "1.2.0",
      metadata: {
        exportDate: '2025-01-15T00:00:00.000Z',
        exportedBy: "ProcessEconomicsLibrary",
        description: "Shell & Tube Heat Exchanger",
        scalingType: "Amount4"
      },
      currentState: {
        selectedGroupIndex: 0,
        scalingGroups: [
          {
            id: 'default',
            name: 'Default Scaling',
            items: []
          },
          {
            id: 'group-1',
            name: 'Capacity Scaling',
            items: []
          }
        ],
        protectedTabs: [],
        tabConfigs: [
          {
            id: 'default',
            label: 'Default Scaling'
          },
          {
            id: 'group-1',
            label: 'Capacity Scaling'
          }
        ]
      }
    }
  },
  {
    id: 'item-2',
    name: 'Centrifugal Pump',
    category: 'Pumps & Compressors',
    description: 'Standard centrifugal pump with flow and head scaling factors',
    tags: ['pump', 'centrifugal', 'flow', 'basic'],
    dateAdded: '2025-01-20T00:00:00.000Z',
    configuration: {
      version: "1.2.0",
      metadata: {
        exportDate: '2025-01-20T00:00:00.000Z',
        exportedBy: "ProcessEconomicsLibrary",
        description: "Centrifugal Pump",
        scalingType: "Amount5"
      },
      currentState: {
        selectedGroupIndex: 0,
        scalingGroups: [
          {
            id: 'default',
            name: 'Default Scaling',
            items: []
          },
          {
            id: 'group-1',
            name: 'Flow Scaling',
            items: []
          },
          {
            id: 'group-2',
            name: 'Head Scaling',
            items: []
          }
        ],
        protectedTabs: [],
        tabConfigs: [
          {
            id: 'default',
            label: 'Default Scaling'
          },
          {
            id: 'group-1',
            label: 'Flow Scaling'
          },
          {
            id: 'group-2',
            label: 'Head Scaling'
          }
        ]
      }
    }
  },
  {
    id: 'item-3',
    name: 'Packed Distillation Column',
    category: 'Separation Equipment',
    description: 'Complex distillation column with multiple scaling factors and cost components',
    tags: ['distillation', 'separation', 'complex', 'packed column'],
    dateAdded: '2025-02-05T00:00:00.000Z',
    configuration: {
      version: "1.2.0",
      metadata: {
        exportDate: '2025-02-05T00:00:00.000Z',
        exportedBy: "ProcessEconomicsLibrary",
        description: "Packed Distillation Column",
        scalingType: "Amount5"
      },
      currentState: {
        selectedGroupIndex: 0,
        scalingGroups: [
          {
            id: 'default',
            name: 'Default Scaling',
            items: []
          },
          {
            id: 'group-1',
            name: 'Column Scaling',
            items: []
          },
          {
            id: 'group-2',
            name: 'Packing Scaling',
            items: []
          },
          {
            id: 'group-3',
            name: 'Internals Scaling',
            items: []
          },
          {
            id: 'group-4',
            name: 'Condenser Scaling',
            items: []
          },
          {
            id: 'group-5',
            name: 'Reboiler Scaling',
            items: []
          },
          {
            id: 'group-6',
            name: 'Installation Scaling',
            items: []
          }
        ],
        protectedTabs: [],
        tabConfigs: [
          {
            id: 'default',
            label: 'Default Scaling'
          },
          {
            id: 'group-1',
            label: 'Column Scaling'
          },
          {
            id: 'group-2',
            label: 'Packing Scaling'
          },
          {
            id: 'group-3',
            label: 'Internals Scaling'
          },
          {
            id: 'group-4',
            label: 'Condenser Scaling'
          },
          {
            id: 'group-5',
            label: 'Reboiler Scaling'
          },
          {
            id: 'group-6',
            label: 'Installation Scaling'
          }
        ]
      }
    }
  },
  {
    id: 'item-4',
    name: 'Fixed-Bed Reactor',
    category: 'Reactors',
    description: 'Tubular fixed-bed catalytic reactor with volume and pressure scaling',
    tags: ['reactor', 'catalytic', 'fixed-bed', 'chemical processing'],
    dateAdded: '2025-02-10T00:00:00.000Z',
    configuration: {
      version: "1.2.0",
      metadata: {
        exportDate: '2025-02-10T00:00:00.000Z',
        exportedBy: "ProcessEconomicsLibrary",
        description: "Fixed-Bed Reactor",
        scalingType: "Amount4"
      },
      currentState: {
        selectedGroupIndex: 0,
        scalingGroups: [
          {
            id: 'default',
            name: 'Default Scaling',
            items: []
          },
          {
            id: 'group-1',
            name: 'Volume Scaling',
            items: []
          },
          {
            id: 'group-2',
            name: 'Pressure Scaling',
            items: []
          },
          {
            id: 'group-3',
            name: 'Material Scaling',
            items: []
          }
        ],
        protectedTabs: [],
        tabConfigs: [
          {
            id: 'default',
            label: 'Default Scaling'
          },
          {
            id: 'group-1',
            label: 'Volume Scaling'
          },
          {
            id: 'group-2',
            label: 'Pressure Scaling'
          },
          {
            id: 'group-3',
            label: 'Material Scaling'
          }
        ]
      }
    }
  },
  {
    id: 'item-5',
    name: 'Storage Tank',
    category: 'Vessels & Tanks',
    description: 'Simple storage tank with volume-based scaling',
    tags: ['storage', 'tank', 'simple'],
    dateAdded: '2025-01-05T00:00:00.000Z',
    configuration: {
      version: "1.2.0",
      metadata: {
        exportDate: '2025-01-05T00:00:00.000Z',
        exportedBy: "ProcessEconomicsLibrary",
        description: "Storage Tank",
        scalingType: "Amount4"
      },
      currentState: {
        selectedGroupIndex: 0,
        scalingGroups: [
          {
            id: 'default',
            name: 'Default Scaling',
            items: []
          },
          {
            id: 'group-1',
            name: 'Volume Scaling',
            items: []
          }
        ],
        protectedTabs: [],
        tabConfigs: [
          {
            id: 'default',
            label: 'Default Scaling'
          },
          {
            id: 'group-1',
            label: 'Volume Scaling'
          }
        ]
      }
    }
  }
];

// CSS styles for the component
const styles = `
.process-economics-library {
  display: flex;
  flex-direction: column;
  background-color: #f5f8fa;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 1200px;
  height: 80vh;
  margin: 40px auto;
  overflow: hidden;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2c3e50;
  color: white;
  padding: 16px 24px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.library-header h2 {
  display: flex;
  align-items: center;
  margin: 0;
  font-size: 1.5rem;
}

.header-icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
}

.close-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
}

.close-icon {
  width: 20px;
  height: 20px;
}

.library-toolbar {
  display: flex;
  padding: 16px 24px;
  background-color: #f0f4f8;
  border-bottom: 1px solid #e1e8ed;
  flex-wrap: wrap;
  gap: 16px;
}

.search-container {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #64748b;
}

.search-input-L {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.toolbar-actions button {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  border: none;
  background-color: #334155;
  color: white;
  transition: background-color 0.2s;
}

.toolbar-actions button:hover {
  background-color: #1e293b;
}

.toolbar-actions button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.button-icon {
  width: 18px;
  height: 18px;
  margin-right: 8px;
}

.filters-panel {
  background-color: #f8fafc;
  padding: 16px 24px;
  border-bottom: 1px solid #e1e8ed;
  overflow: hidden;
}

.filter-section {
  margin-bottom: 16px;
}

.filter-section h3 {
  font-size: 1rem;
  margin-top: 0;
  margin-bottom: 8px;
  color: #334155;
}

.category-filters, .complexity-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-filter, .complexity-filter {
  padding: 6px 12px;
  border-radius: 4px;
  background-color: #e2e8f0;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  transition: all 0.2s;
}

.category-filter:hover, .complexity-filter:hover {
  background-color: #cbd5e1;
}

.category-filter.selected, .complexity-filter.selected {
  background-color: #3b82f6;
  color: white;
  border-color: #2563eb;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.clear-filters {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: underline;
}

.library-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.items-panel {
  width: 40%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e1e8ed;
  overflow: hidden;
}

.items-header {
  padding: 16px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.items-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #334155;
}

.sort-select {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
}

.items-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.library-item {
  padding: 16px;
  border-radius: 6px;
  background-color: white;
  border: 1px solid #e2e8f0;
  margin-bottom: 12px;
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
  display: flex;
  justify-content: space-between;
}

.library-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-color: #d1d5db;
}

.library-item.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.item-preview {
  flex: 1;
}

.item-name {
  margin: 0 0 8px 0;
  font-size: 1.05rem;
  color: #1e293b;
}

.item-category {
  font-size: 0.9rem;
  color: #64748b;
  margin: 4px 0;
}

.item-scaling-type {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 4px 0;
}

.item-groups-count {
  margin-top: 8px;
  font-size: 0.85rem;
  color: #4b5563;
  padding: 2px 8px;
  background-color: #f1f5f9;
  border-radius: 4px;
  display: inline-block;
}

.item-preview-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-action {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-action:hover {
  background-color: #f1f5f9;
}

.preview-action-icon {
  width: 18px;
  height: 18px;
  color: #64748b;
}

.preview-action.import:hover .preview-action-icon {
  color: #3b82f6;
}

.preview-action.adjust:hover .preview-action-icon {
  color: #10b981;
}

.no-items {
  padding: 24px;
  text-align: center;
  color: #64748b;
}

.details-panel {
  width: 60%;
  overflow-y: auto;
  padding: 24px;
}

.library-item-details {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.library-item-details h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.4rem;
  color: #0f172a;
}

.item-description {
  color: #475569;
  margin-bottom: 24px;
  line-height: 1.5;
}

.item-metadata {
  margin-bottom: 24px;
  background-color: #f8fafc;
  border-radius: 6px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.metadata-row {
  display: flex;
  margin-bottom: 8px;
}

.metadata-row:last-child {
  margin-bottom: 0;
}

.metadata-label {
  width: 120px;
  color: #64748b;
  font-weight: 500;
}

.metadata-value {
  color: #1e293b;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.item-tag {
  padding: 4px 12px;
  background-color: #e2e8f0;
  border-radius: 16px;
  font-size: 0.8rem;
  color: #475569;
}

.item-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  border: none;
  transition: background-color 0.2s;
}

.import-button {
  background-color: #3b82f6;
  color: white;
}

.import-button:hover {
  background-color: #2563eb;
}

.export-button {
  background-color: #14b8a6;
  color: white;
}

.export-button:hover {
  background-color: #0d9488;
}

.delete-button {
  background-color: #ef4444;
  color: white;
}

.delete-button:hover {
  background-color: #dc2626;
}

.no-selection {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 1.1rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.save-modal {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  width: 500px;
  max-width: 95%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.save-modal h3 {
  margin-top: 0;
  margin-bottom: 24px;
  font-size: 1.3rem;
  color: #0f172a;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label-L {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #334155;
}

.save-input, .save-select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  font-size: 0.95rem;
}

.tags-input-container {
  display: flex;
  gap: 8px;
}

.tag-input {
  flex: 1;
}

.add-tag-button {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
}

.tag-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tag-item {
  display: flex;
  align-items: center;
  padding: 4px 8px 4px 12px;
  background-color: #e2e8f0;
  border-radius: 16px;
  font-size: 0.85rem;
}

.tag-text {
  margin-right: 4px;
}

.remove-tag-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-icon {
  width: 14px;
  height: 14px;
  color: #64748b;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.cancel-button {
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
}

.save-confirm-button {
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  background-color: #3b82f6;
  border: none;
  color: white;
}

.save-confirm-button:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}
`;

// Render component with styles
const StyledProcessEconomicsLibrary = (props) => {
  // Insert styles into document
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  return <ProcessEconomicsLibrary {...props} />;
};

export default StyledProcessEconomicsLibrary;