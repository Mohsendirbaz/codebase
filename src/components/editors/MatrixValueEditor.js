import React, { useState, useEffect } from 'react';
import '../../../styles/HomePage.CSS/Consolidated.css';

/**
 * @file MatrixValueEditor.js
 * @description Matrix Value Editor Component
 * @module components/editors/MatrixValueEditor
 * @requires react
 */

/**
 * Matrix Value Editor Component
 * Provides UI for editing matrix values for a specific parameter
 * 
 * @param {Object} props - Component props
 * @param {string} props.paramId - Parameter ID
 * @param {Object} props.formMatrix - Form matrix object
 * @param {Object} props.versions - Versions object
 * @param {Object} props.zones - Zones object
 * @param {Function} props.updateParameterValue - Function to update parameter value
 * @param {Function} props.onClose - Function to close the editor
 */
function MatrixValueEditor({ paramId, formMatrix, versions, zones, updateParameterValue, onClose }) {
  const [selectedVersion, setSelectedVersion] = useState(versions.active);
  const [selectedZone, setSelectedZone] = useState(zones.active);
  const [currentValue, setCurrentValue] = useState('');
  const [editing, setEditing] = useState(false);

  // Get parameter from form matrix
  const parameter = formMatrix[paramId];

  // Set initial value based on selected version and zone
  useEffect(() => {
    if (parameter &&
        parameter.matrix[selectedVersion] &&
        parameter.matrix[selectedVersion][selectedZone] !== undefined) {
      setCurrentValue(parameter.matrix[selectedVersion][selectedZone]);
    } else {
      setCurrentValue('');
    }
  }, [parameter, selectedVersion, selectedZone]);

  // Handle value change
  const handleValueChange = (e) => {
    setCurrentValue(e.target.value);
  };

  // Handle save
  const handleSave = () => {
    // Parse numeric values
    let valueToSave = currentValue;
    if (parameter.type === 'number' && currentValue !== '') {
      valueToSave = parseFloat(currentValue);
      if (isNaN(valueToSave)) valueToSave = 0;
    }

    // Update parameter value
    updateParameterValue(paramId, valueToSave, selectedVersion, selectedZone);

    // Exit edit mode
    setEditing(false);
  };

  // Get inheritance info
  const getInheritanceInfo = () => {
    if (!parameter.inheritance[selectedVersion]) {
      return null;
    }

    const inheritance = parameter.inheritance[selectedVersion];
    if (!inheritance.source) {
      return null;
    }

    return {
      source: inheritance.source,
      sourceLabel: versions.metadata[inheritance.source]?.label || inheritance.source,
      percentage: inheritance.percentage
    };
  };

  return (
    <div className="matrix-value-editor">
      <div className="editor-header">
        <h3>Edit {parameter?.label || paramId}</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="editor-selectors">
        <div className="version-selector">
          <label>Version:</label>
          <select
            value={selectedVersion}
            onChange={e => setSelectedVersion(e.target.value)}
          >
            {versions.list.map(version => (
              <option key={version} value={version}>
                {versions.metadata[version]?.label || version}
              </option>
            ))}
          </select>
        </div>

        <div className="zone-selector">
          <label>Zone:</label>
          <select
            value={selectedZone}
            onChange={e => setSelectedZone(e.target.value)}
          >
            {zones.list.map(zone => (
              <option key={zone} value={zone}>
                {zones.metadata[zone]?.label || zone}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="editor-value">
        {editing ? (
          <div className="edit-mode">
            <input
              type={parameter?.type === 'number' ? 'number' : 'text'}
              value={currentValue}
              onChange={handleValueChange}
              autoFocus
            />
            <div className="edit-buttons">
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="view-mode">
            <div className="current-value">
              {currentValue === '' ? (
                <span className="empty-value">No value set</span>
              ) : (
                <span>{currentValue}</span>
              )}
            </div>
            <button onClick={() => setEditing(true)}>Edit</button>
          </div>
        )}
      </div>

      {/* Inheritance info */}
      {getInheritanceInfo() && (
        <div className="inheritance-info">
          <p>
            Inherits {getInheritanceInfo().percentage}% from{' '}
            <strong>{getInheritanceInfo().sourceLabel}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

export default MatrixValueEditor;