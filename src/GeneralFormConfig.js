import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFormValues from './useFormValues';
import Popup from './components/modules/Efficacy';
import { faEdit, faCheck, faTimes, faSave, faUndo } from '@fortawesome/free-solid-svg-icons';
import SensitivityAnalysisSelector from './components/modules/SensitivitySelector';
import axios from 'axios';
import { propertyMapping as referenceLabels } from './utils/LabelReferences';

const getLatestPlantLifetime = (formValues) => {
  const filteredValues = Object.values(formValues).filter(item => item.id === 'plantLifetimeAmount10');
  return filteredValues.length > 0 ? filteredValues[0].value : 40;
};

const GeneralFormConfig = ({ formValues, handleInputChange, version, filterKeyword, V, toggleV, F, toggleF, S, setS, setVersion }) => {
  const { iconMapping } = useFormValues();
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [selectedItemId, setSelectedItemId] = useState();
  const [editingLabel, setEditingLabel] = useState(null);
  const [tempLabel, setTempLabel] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [originalLabels, setOriginalLabels] = useState({});

  // Helper function to get corresponding S number
  const getSNumber = (key) => {
    const match = key.match(/Amount(\d+)/);
    if (!match) return null;

    const num = parseInt(match[1]);
    if (num >= 10 && num <= 79) return `S${num}`; // S10-S79
    return null;
  };

  // Helper function to get V number
  const getVNumber = (vAmountNum) => {
    const num = parseInt(vAmountNum);
    if (num >= 40 && num <= 49) return `V${num - 39}`;
    if (num >= 50 && num <= 59) return `V${num - 49}`;
    if (num >= 50 && num <= 69) return `R${num - 59}`;
    if (num >= 50 && num <= 79) return `R${num - 69}`;

    return null;
  };

  const getFNumber = (key) => {
    const match = key.match(/Amount(\d+)/);
    if (!match) return null;

    const num = parseInt(match[1]);
    if (num >= 34 && num <= 38) return `F${num - 33}`;
    return null;
  };

  // Updated formItems to include S numbers
  const formItems = Object.keys(formValues)
    .filter((key) => key.includes(filterKeyword))
    .map((key) => {
      const vKey = key.includes('vAmount') ? getVNumber(key.replace('vAmount', '')) : null;
      const fKey = getFNumber(key);
      const sKey = getSNumber(key);
      return {
        id: key,
        vKey,
        fKey,
        sKey,
        ...formValues[key]
      };
    });
    
  // Store original labels when component mounts
  useEffect(() => {
    if (Object.keys(originalLabels).length === 0) {
      const labels = {};
      Object.entries(formValues).forEach(([key, value]) => {
        labels[key] = value.label;
      });
      setOriginalLabels(labels);
    }
  }, [formValues]);

  // Updated to immediately apply labels locally
  const handleLabelEdit = (itemId) => {
    setEditingLabel(itemId);
    setTempLabel(formValues[itemId].label);
  };

  // Updated to take effect locally immediately
  const handleLabelSave = (itemId) => {
    handleInputChange({ target: { value: tempLabel } }, itemId, 'label');
    setEditingLabel(null);
  };

  const handleCancelEdit = () => {
    setEditingLabel(null);
    setTempLabel('');
  };

  const handleIncrement = (itemId) => {
    const item = formValues[itemId];
    const newValue = parseFloat(item.value) + parseFloat(item.step);
    handleInputChange({ target: { value: newValue } }, itemId, 'value');
  };

  const handleDecrement = (itemId) => {
    const item = formValues[itemId];
    const newValue = parseFloat(item.value) - parseFloat(item.step);
    handleInputChange({ target: { value: newValue } }, itemId, 'value');
  };

  const handleScheduleClick = (e, itemId) => {
    const rect = e.target.getBoundingClientRect();
    setPopupPosition({
      top: rect.top + window.scrollY + 100,
      left: rect.left + rect.width + 10,
    });
    setSelectedItemId(itemId);

    const latestPlantLifetime = getLatestPlantLifetime(formValues);
    const efficacyPeriod = formValues[itemId].efficacyPeriod || {};
    handleInputChange({ target: { value: latestPlantLifetime } }, itemId, 'efficacyPeriod', 'end');

    setShowPopup(true);
  };

  // Function to handle updating form labels in both files
  const handleUpdateFormLabels = async () => {
    try {
      setUpdateStatus('Updating labels...');

      // Collect all updated labels from formValues
      const updatedLabels = {};
      Object.entries(formValues).forEach(([key, value]) => {
        updatedLabels[key] = value.label;
      });

      // Call backend API to update files
      const response = await axios.post('http://localhost:3060/api/update-form-labels', {
        labels: updatedLabels
      });

      if (response.data.success) {
        setUpdateStatus('Labels updated successfully!');
        setTimeout(() => setUpdateStatus(''), 3000);
      } else {
        setUpdateStatus('Update failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error updating form labels:', error);
      setUpdateStatus('Update failed: ' + error.message);
    }
  };
  
  // Function to reset labels to original values
  const handleResetLabels = () => {
    if (!originalLabels || Object.keys(originalLabels).length === 0) {
      setUpdateStatus('No original labels to restore');
      return;
    }
    
    // Confirm reset
    if (window.confirm('Are you sure you want to reset all labels to their original values?')) {
      try {
        // Apply original labels to all form items
        Object.entries(originalLabels).forEach(([key, label]) => {
          if (formValues[key]) {
            handleInputChange({ target: { value: label } }, key, 'label');
          }
        });
        
        setUpdateStatus('Labels reset to original values');
        setTimeout(() => setUpdateStatus(''), 3000);
      } catch (error) {
        console.error('Error resetting labels:', error);
        setUpdateStatus('Reset failed: ' + error.message);
      }
    }
  };

  return (
    <>
      {/* Label Management Section */}
      <div className="labels-section">
        <button 
          className="update-button"
          onClick={handleUpdateFormLabels}
        >
          <FontAwesomeIcon icon={faSave} /> Update Form Labels
        </button>
        <button 
          className="reset-button"
          onClick={handleResetLabels}
        >
          <FontAwesomeIcon icon={faUndo} /> Reset Labels
        </button>
        {updateStatus && <span className="update-status">{updateStatus}</span>}
      </div>

      {formItems.map((item) => (
        <div key={item.id} className={`form-item-container ${item.id === selectedItemId ? 'highlighted-container' : ''}`}>

          {/* Priority Section: F/V Checkboxes */}
          <div className="checkbox-section">
            {item.vKey && (
              <div className="checkbox-group">
                <span className="checkbox-label">{item.vKey}</span>
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={V[item.vKey] === 'on'}
                  onChange={() => toggleV(item.vKey)}
                />
              </div>
            )}
            {item.fKey && (
              <div className="checkbox-group">
                <span className="checkbox-label">{item.fKey}</span>
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={F[item.fKey] === 'on'}
                  onChange={() => toggleF(item.fKey)}
                />
              </div>
            )}
          </div>

          {/* Main Input Section */}
          <div className="main-input-section">
            {/* Label and Icon */}
            <div className="label-container">
              {iconMapping[item.id] && (
                <FontAwesomeIcon icon={iconMapping[item.id]} className="input-icon" />
              )}
              {editingLabel === item.id ? (
                <div className="edit-label-container">
                  <input
                    type="text"
                    value={tempLabel}
                    onChange={(e) => setTempLabel(e.target.value)}
                    className="label-edit-input"
                  />
                  <div className="edit-actions">
                    <FontAwesomeIcon
                      icon={faCheck}
                      onClick={() => handleLabelSave(item.id)}
                      className="edit-icon save"
                    />
                    <FontAwesomeIcon
                      icon={faTimes}
                      onClick={handleCancelEdit}
                      className="edit-icon cancel"
                    />
                  </div>
                </div>
              ) : (
                <div className="label-text">
                  <FontAwesomeIcon
                    icon={faEdit}
                    onClick={() => handleLabelEdit(item.id)}
                    className="edit-icon"
                  />
                  <span>{item.label}</span>
                </div>
              )}
            </div>

            {/* Value Input and Controls */}
            {item.type === 'number' && (
              <div className="input-controls-section">
                <div className="value-container">
                  <input
                    type="number"
                    id={item.id}
                    value={item.value !== undefined && item.value !== null && !isNaN(item.value) ? item.value : ''}
                    onChange={(e) => {
                      let value = parseFloat(e.target.value);
                      value = isNaN(value) ? null : value;
                      handleInputChange({ target: { value } }, item.id, 'value');
                    }}
                    className="value-input"
                    placeholder={item.placeholder}
                    step={item.step}
                  />
                  <div className="increment-controls">
                    <button className="control-button1" onClick={() => handleDecrement(item.id)}>-</button>
                    <button className="control-button2" onClick={() => handleIncrement(item.id)}>+</button>
                  </div>
                </div>

                {/* Step Input */}
                <div className="step-container">
                  <input
                    type="number"
                    id={`${item.id}-step`}
                    value={item.step !== undefined && item.step !== null && !isNaN(item.step) ? item.step : ''}
                    onChange={(e) => {
                      let step = parseFloat(e.target.value);
                      step = isNaN(step) ? '' : step;
                      handleInputChange({ target: { value: step } }, item.id, 'step');
                    }}
                    className="step-input"
                    placeholder="Step Value"
                  />
                </div>
                <div className="remarks-container">
                  <input
                    type="text"
                    id={`${item.id}-remarks`}
                    value={item.remarks || ''}
                    onChange={(e) => handleInputChange({ target: { value: e.target.value } }, item.id, 'remarks')}
                    placeholder="Add remarks"
                    className="remarks-input remarks-important"
                  />
                </div>
                {/* Action Buttons */}
                <div className="action-buttons">
                  {item.sKey && (
                    <SensitivityAnalysisSelector
                      sKey={item.sKey}
                      onSensitivityChange={(sKey, config) => {
                        setS(prev => ({
                          ...prev,
                          [sKey]: config
                        }));
                      }}
                      S={S}
                      setS={setS}
                      version={version}
                    />
                  )}
                  <button
                    className="action-button primary"
                    onClick={(e) => handleScheduleClick(e, item.id)}
                  >
                    Specify Efficacy Period<br/>
                    (overrides basevalues for specified intervals)
                  </button>
                  <button
                    className="action-button factual"
                    onClick={(e) => handleScheduleClick(e, item.id)}
                  >
                    Find Factual Precedence
                  </button>
                </div>
              </div>
            )}

            {/* Select Input */}
            {item.type === 'select' && (
              <div className="input-controls-section">
                <div className="value-container">
                  <select
                    id={item.id}
                    value={item.value || ''}
                    onChange={(e) => handleInputChange(e, item.id, 'value')}
                    className="select-input"
                  >
                    {item.options.map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                
                <div className="remarks-container">
                  <input
                    type="text"
                    id={`${item.id}-remarks`}
                    value={item.remarks || ''}
                    onChange={(e) => handleInputChange({ target: { value: e.target.value } }, item.id, 'remarks')}
                    placeholder="Add remarks"
                    className="remarks-input remarks-important"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="action-buttons">
                  {item.sKey && (
                    <SensitivityAnalysisSelector
                      sKey={item.sKey}
                      onSensitivityChange={(sKey, config) => {
                        setS(prev => ({
                          ...prev,
                          [sKey]: config
                        }));
                      }}
                      S={S}
                      setS={setS}
                      version={version}
                    />
                  )}
                  <button
                    className="action-button primary"
                    onClick={(e) => handleScheduleClick(e, item.id)}
                  >
                    Specify Efficacy Period<br/>
                    (overrides basevalues for specified intervals)
                  </button>
                  <button
                    className="action-button factual"
                    onClick={(e) => handleScheduleClick(e, item.id)}
                  >
                    Find Factual Precedence
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Popup */}
      {selectedItemId && (
        <Popup
          show={showPopup}
          position={popupPosition}
          onClose={() => {
            setShowPopup(false);
            setSelectedItemId(null); // Reset the selectedItemId to remove highlighting
          }}
          formValues={formValues}
          handleInputChange={handleInputChange}
          id={selectedItemId}
          onVersionChange={(newVersion) => setVersion(newVersion)}
          version={version}
          itemId={selectedItemId}
        />
      )}
    </>
  );
};

export default GeneralFormConfig;
