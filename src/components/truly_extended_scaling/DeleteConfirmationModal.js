import React from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

/**
 * DeleteConfirmationModal - A modal that appears when a user attempts to delete a scaling group
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {Object} props.groupToDelete - The scaling group that will be deleted
 * @param {Array} props.affectedGroups - Array of groups that will be affected by the deletion
 * @param {Function} props.onConfirm - Function to call when deletion is confirmed with the selected option
 */
const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  groupToDelete, 
  affectedGroups = [],
  onConfirm 
}) => {
  const [selectedOption, setSelectedOption] = React.useState('adjust');

  if (!isOpen || !groupToDelete) return null;

  const handleConfirm = () => {
    onConfirm(selectedOption);
    onClose();
  };

  const options = [
    { 
      id: 'adjust', 
      label: 'Delete and adjust calculations', 
      description: 'Recalculate all subsequent groups based on the new chain of calculations.',
      impact: 'Values in all subsequent groups will change to maintain mathematical relationships.'
    },
    { 
      id: 'preserve', 
      label: 'Delete and preserve current values', 
      description: 'Keep the current calculated values in subsequent groups, but break the mathematical chain.',
      impact: 'Mathematical relationships will be broken, but current values will be preserved.'
    },
    { 
      id: 'reset', 
      label: 'Delete and reset to base values', 
      description: 'Reset all subsequent groups to use their original base values.',
      impact: 'All subsequent groups will revert to their original values before any scaling was applied.'
    }
  ];

  return (
    <div className="modal-overlay">
      <motion.div 
        className="delete-confirmation-modal"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
      >
        <div className="modal-header warning">
          <ExclamationTriangleIcon className="warning-icon" />
          <h2>Confirm Scaling Group Deletion</h2>
        </div>
        
        <div className="modal-content">
          <p className="delete-warning">
            You are about to delete the scaling group <strong>{groupToDelete.name}</strong>.
          </p>
          
          {affectedGroups.length > 0 ? (
            <div className="affected-groups">
              <h3>This will affect {affectedGroups.length} subsequent scaling group{affectedGroups.length !== 1 ? 's' : ''}:</h3>
              <ul className="affected-groups-list">
                {affectedGroups.map((group, index) => (
                  <li key={group.id || index} className="affected-group-item">
                    <span className="group-name">{group.name}</span>
                    <span className="item-count">({group.items.length} items)</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="no-affected-groups">
              No other scaling groups will be affected by this deletion.
            </p>
          )}
          
          {affectedGroups.length > 0 && (
            <div className="deletion-options">
              <h3>How would you like to handle the remaining calculations?</h3>
              
              <div className="options-list">
                {options.map(option => (
                  <div 
                    key={option.id} 
                    className={`option-item ${selectedOption === option.id ? 'selected' : ''}`}
                    onClick={() => setSelectedOption(option.id)}
                  >
                    <div className="option-header">
                      <input 
                        type="radio" 
                        id={option.id} 
                        name="deletionOption" 
                        value={option.id}
                        checked={selectedOption === option.id}
                        onChange={() => setSelectedOption(option.id)}
                      />
                      <label htmlFor={option.id}>{option.label}</label>
                    </div>
                    
                    <div className="option-details">
                      <p className="option-description">{option.description}</p>
                      <div className="option-impact">
                        <span className="impact-label">Impact:</span>
                        <span className="impact-text">{option.impact}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="help-section">
            <QuestionMarkCircleIcon className="help-icon" />
            <p className="help-text">
              Scaling groups form a chain of calculations where each group builds upon the results of the previous one.
              Deleting a group in the middle of this chain will affect how subsequent calculations are performed.
            </p>
          </div>
        </div>
        
        <div className="modal-actions">
          <button 
            className="cancel-button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="confirm-button warning"
            onClick={handleConfirm}
          >
            Delete Group
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteConfirmationModal;