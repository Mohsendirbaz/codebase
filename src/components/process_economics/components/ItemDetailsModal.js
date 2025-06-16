import React, { useState } from 'react';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon,
  ShareIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  PencilIcon,
  CheckIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

import ScalingGroupsPreview from './ScalingGroupsPreview';
import '../styles/ScalingGroupsPreview.css';
import EditItemForm from './EditItemForm';

const ItemDetailsModal = ({ 
  item, 
  onClose,
  onImport,
  isPersonal
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Generate snippet of the configuration for sharing
  const configSnippet = `// ${item.name} - ${item.category}
// Created by: ${item.modeler || 'Unknown'}
// Generated from Process Economics Library

const scalingConfig = ${JSON.stringify(item.configuration, null, 2).slice(0, 500)}...
// Full configuration has ${item.configuration.currentState.scalingGroups.length} scaling groups`;

  // Handle copying the snippet
  const handleCopySnippet = () => {
    navigator.clipboard.writeText(configSnippet);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Count groups and items
  const groupCount = item.configuration.currentState.scalingGroups.length;
  const itemCount = item.configuration.currentState.scalingGroups.reduce(
    (sum, group) => sum + group.items.length, 
    0
  );

  return (
    <div className="modal-overlay">
      <motion.div 
        className="item-details-modal"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
      >
        <div className="modal-header">
          <div className="modal-title">
            {isEditing ? (
              <h2>Edit Item</h2>
            ) : (
              <h2>{item.name}</h2>
            )}
          </div>

          {!isEditing && (
            <div className="modal-actions">
              {isPersonal && (
                <button 
                  className="modal-action-button"
                  onClick={() => setIsEditing(true)}
                  title="Edit"
                >
                  <PencilIcon className="modal-action-icon" />
                </button>
              )}

              <button 
                className="modal-action-button"
                onClick={() => onImport(item.configuration)}
                title="Import"
              >
                <ArrowDownTrayIcon className="modal-action-icon" />
              </button>

              <button 
                className="modal-action-button close"
                onClick={onClose}
                title="Close"
              >
                <XMarkIcon className="modal-action-icon" />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <EditItemForm 
            item={item}
            onCancel={() => setIsEditing(false)}
            onSave={(updatedItem) => {
              // Handle saving the updated item
              setIsEditing(false);
            }}
          />
        ) : (
          <>
            <div className="modal-tabs">
              <button 
                className={`modal-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`modal-tab ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Configuration Details
              </button>
              <button 
                className={`modal-tab ${activeTab === 'share' ? 'active' : ''}`}
                onClick={() => setActiveTab('share')}
              >
                Share & Export
              </button>
            </div>

            <div className="modal-content">
              {activeTab === 'overview' && (
                <div className="item-overview">
                  <div className="item-header-info">
                    <div className="item-badges">
                      <span className="item-category-badge">{item.category}</span>
                      <span className="item-type-badge">
                        {item.configuration.metadata.scalingType || 'Mixed'}
                      </span>
                    </div>

                    <p className="item-description">{item.description}</p>
                  </div>

                  <div className="item-details-grid">
                    <div className="details-section">
                      <h3>Configuration Details</h3>
                      <div className="details-list">
                        <div className="details-item">
                          <span className="details-label">Scaling Groups:</span>
                          <span className="details-value">{groupCount}</span>
                        </div>
                        <div className="details-item">
                          <span className="details-label">Total Items:</span>
                          <span className="details-value">{itemCount}</span>
                        </div>
                        <div className="details-item">
                          <span className="details-label">Created:</span>
                          <span className="details-value">
                            {formatDate(item.dateAdded)}
                          </span>
                        </div>
                        {item.dateModified && (
                          <div className="details-item">
                            <span className="details-label">Modified:</span>
                            <span className="details-value">
                              {formatDate(item.dateModified)}
                            </span>
                          </div>
                        )}
                        {item.modeler && (
                          <div className="details-item">
                            <span className="details-label">Created By:</span>
                            <span className="details-value modeler">
                              {item.modeler}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="tags-section">
                      <h3>Tags</h3>
                      {item.tags && item.tags.length > 0 ? (
                        <div className="tag-cloud">
                          {item.tags.map(tag => (
                            <span key={tag} className="detail-tag">{tag}</span>
                          ))}
                        </div>
                      ) : (
                        <p>No tags</p>
                      )}
                    </div>
                  </div>

                  <div className="scaling-preview-section">
                    <h3>Scaling Groups Preview</h3>
                    <ScalingGroupsPreview 
                      scalingGroups={item.configuration.currentState.scalingGroups}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="configuration-details">
                  <div className="configuration-summary">
                    <h3>Configuration Structure</h3>
                    <p>This configuration contains {groupCount} scaling groups with a total of {itemCount} items.</p>
                  </div>

                  <div className="groups-breakdown">
                    {item.configuration.currentState.scalingGroups.map((group, index) => (
                      <div key={group.id} className="scaling-group-detail">
                        <div className="group-header">
                          <h4>
                            {index === 0 ? (
                              <span className="default-badge">Default</span>
                            ) : null}
                            {group.name}
                          </h4>
                          <span className="item-count">
                            {group.items.length} items
                          </span>
                        </div>

                        <div className="group-items-list">
                          {group.items.slice(0, 5).map((groupItem, itemIndex) => (
                            <div key={itemIndex} className="group-item">
                              <span className="item-label">
                                {groupItem.label || `Item ${itemIndex + 1}`}
                              </span>
                              <div className="item-operation">
                                <span className="operation-name">
                                  {groupItem.operation || 'multiply'}
                                </span>
                                <span className="operation-factor">
                                  {groupItem.scalingFactor || 1}
                                </span>
                              </div>
                            </div>
                          ))}
                          {group.items.length > 5 && (
                            <div className="more-items">
                              +{group.items.length - 5} more items
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="configuration-metadata">
                    <h3>Metadata</h3>
                    <div className="metadata-table">
                      <div className="metadata-row">
                        <span className="metadata-key">Version:</span>
                        <span className="metadata-value">
                          {item.configuration.version || '1.0.0'}
                        </span>
                      </div>
                      <div className="metadata-row">
                        <span className="metadata-key">Export Date:</span>
                        <span className="metadata-value">
                          {item.configuration.metadata?.exportDate 
                            ? formatDate(item.configuration.metadata.exportDate)
                            : 'Unknown'}
                        </span>
                      </div>
                      <div className="metadata-row">
                        <span className="metadata-key">Description:</span>
                        <span className="metadata-value">
                          {item.configuration.metadata?.description || 'No description'}
                        </span>
                      </div>
                      <div className="metadata-row">
                        <span className="metadata-key">Scaling Type:</span>
                        <span className="metadata-value">
                          {item.configuration.metadata?.scalingType || 'Mixed'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'share' && (
                <div className="share-export-panel">
                  <div className="share-section">
                    <h3>Share Configuration</h3>
                    <p>Share this configuration with others using the unique link or code snippet below.</p>

                    <div className="link-section">
                      <h4>Sharable Link</h4>
                      <div className="copy-link-container">
                        <input 
                          type="text"
                          readOnly
                          value={`${window.location.origin}/process-economics/item/${item.id}`}
                          className="link-input"
                        />
                        <button 
                          className="copy-button"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/process-economics/item/${item.id}`);
                            alert('Link copied to clipboard!');
                          }}
                        >
                          <ClipboardIcon className="copy-icon" />
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="snippet-section">
                      <div className="snippet-header">
                        <h4>Code Snippet</h4>
                        <button 
                          className="copy-snippet-button"
                          onClick={handleCopySnippet}
                        >
                          {isCopied ? (
                            <>
                              <CheckIcon className="copy-icon" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <ClipboardIcon className="copy-icon" />
                              Copy Snippet
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="code-snippet">
                        <code>{configSnippet}</code>
                      </pre>
                    </div>
                  </div>

                  <div className="export-section">
                    <h3>Export Options</h3>
                    <p>Export this configuration in different formats.</p>

                    <div className="export-buttons">
                      <button className="export-button">
                        <DocumentTextIcon className="export-icon" />
                        Export as JSON
                      </button>
                      <button className="export-button">
                        <CodeBracketIcon className="export-icon" />
                        Export as JavaScript
                      </button>
                    </div>
                  </div>

                  <div className="config-id-section">
                    <h4>Configuration ID</h4>
                    <div className="config-id">
                      <span className="id-label">Blockchain ID:</span>
                      <span className="id-value">{item.id}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ItemDetailsModal;
