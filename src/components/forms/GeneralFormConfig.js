/**
 * @file GeneralFormConfig.js
 * @description Component for displaying and managing matrix-based form parameters
 * @module forms
 * @requires react, @fortawesome/react-fontawesome, axios, labelReferences
 */
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit, faCheck, faTimes, faSave, faUndo
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
// Import label references for reset functionality.
import * as labelReferences from '../../utils/labelReferences';

/**
 * GeneralFormConfig Component
 * Displays and manages matrix-based form parameters
 */
const GeneralFormConfig = ({
    formValues,
    handleInputChange,
    version,
    filterKeyword,
    V, toggleV,
    R, toggleR,
    F, toggleF,
    RF, toggleRF,
    S, setS,
    setVersion,
    summaryItems,
}) => {
    // Get icon mapping from formValues which now contains matrix structure
    const iconMapping = formValues ? formValues.iconMapping : {};

    // STATE MANAGEMENT
    const [showPopup, setShowPopup] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const [selectedItemId, setSelectedItemId] = useState();
    const [updateStatus, setUpdateStatus] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showFactualPrecedence, setShowFactualPrecedence] = useState(false);
    const [factualPrecedencePosition, setFactualPrecedencePosition] = useState({ top: 0, left: 0 });
    const [factualItemId, setFactualItemId] = useState(null);
    const [editingLabel, setEditingLabel] = useState(null);
    const [tempLabel, setTempLabel] = useState('');
    const [originalLabels, setOriginalLabels] = useState({});
    const [editedLabels, setEditedLabels] = useState({});

    // Transform form values into displayable items with appropriate metadata
    const formItems = Object.keys(formValues?.formMatrix || formValues || {})
        .filter((key) => key.includes(filterKeyword))
        .map((key) => {
            const param = formValues?.formMatrix ? formValues?.formMatrix[key] : formValues?.[key];
            
            // Basic properties
            return {
                id: key,
                label: param.label,
                value: param.value,
                type: param.type || 'number',
                step: param.step,
                remarks: param.remarks,
                vKey: param.dynamicAppendix?.itemState?.vKey,
                rKey: param.dynamicAppendix?.itemState?.rKey,
                fKey: param.dynamicAppendix?.itemState?.fKey,
                rfKey: param.dynamicAppendix?.itemState?.rfKey
            };
        });

    // Simplified render method
    return (
        <>
            <div className="labels-section">
                <button className="update-button" onClick={() => {}}>
                    <FontAwesomeIcon icon={faSave} /> Update Form Labels
                </button>
                <button className="reset-button" onClick={() => {}}>
                    <FontAwesomeIcon icon={faUndo} /> Reset Labels
                </button>
                {updateStatus && <span className="update-status">{updateStatus}</span>}
            </div>

            {/* Form Items */}
            {formItems.map((item) => (
                <div key={item.id} className="form-item-container">
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
                    </div>
                    
                    <div className="main-input-section">
                        <div className="label-container">
                            <div className="label-text">
                                <span>{item.label}</span>
                            </div>
                        </div>
                        
                        {item.type === 'number' && (
                            <div className="input-controls-section">
                                <div className="value-container">
                                    <input
                                        type="number"
                                        id={item.id}
                                        value={item.value || ''}
                                        onChange={(e) => handleInputChange(e, item.id, 'value')}
                                        className="value-input"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </>
    );
};

export default GeneralFormConfig;