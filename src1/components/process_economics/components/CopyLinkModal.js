import React, { useState } from 'react';
import { 
  XMarkIcon, 
  ClipboardIcon, 
  CheckIcon,
  EnvelopeIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const CopyLinkModal = ({ item, onClose, sharableLink }) => {
  const [isCopied, setIsCopied] = useState(false);
  
  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharableLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  // Share via email
  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out this Process Economics configuration: ${item.name}`);
    const body = encodeURIComponent(
      `I found this process economics configuration that might be useful:\n\n` +
      `${item.name}\n` +
      `Category: ${item.category}\n` +
      `Description: ${item.description || 'No description provided'}\n\n` +
      `View it here: ${sharableLink}`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };
  
  return (
    <div className="modal-overlay">
      <motion.div 
        className="copy-link-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="modal-header">
          <h3 className="modal-title">Share Configuration</h3>
          <button 
            className="modal-close-button"
            onClick={onClose}
          >
            <XMarkIcon className="close-icon" />
          </button>
        </div>
        
        <div className="modal-content">
          <div className="share-item-info">
            <h4 className="share-item-name">{item.name}</h4>
            <div className="share-item-meta">
              <span className="share-item-category">{item.category}</span>
              <span className="share-item-complexity">
                {item.configuration.currentState.scalingGroups.length} scaling groups
              </span>
            </div>
          </div>
          
          <div className="share-link-section">
            <div className="share-link-header">
              <h4>Sharable Link</h4>
              <p>Share this link with others to give them access to this configuration</p>
            </div>
            
            <div className="share-link-container">
              <div className="share-link-input-container">
                <LinkIcon className="link-icon" />
                <input
                  type="text"
                  className="share-link-input"
                  value={sharableLink}
                  readOnly
                  onClick={(e) => e.target.select()}
                />
              </div>
              
              <button 
                className={`copy-link-button ${isCopied ? 'copied' : ''}`}
                onClick={handleCopyLink}
              >
                {isCopied ? (
                  <>
                    <CheckIcon className="copy-icon" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ClipboardIcon className="copy-icon" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="share-options">
            <button 
              className="share-option-button email"
              onClick={handleEmailShare}
            >
              <EnvelopeIcon className="share-option-icon" />
              <span>Share via Email</span>
            </button>
          </div>
          
          <div className="blockchain-id-section">
            <div className="blockchain-id-label">Blockchain ID:</div>
            <div className="blockchain-id-value">{item.id}</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CopyLinkModal;