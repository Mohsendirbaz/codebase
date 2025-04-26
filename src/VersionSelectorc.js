import React, { useState, useEffect } from 'react';
import './styles/HomePage.CSS/VersionSelector.css';
import versionEventEmitter from './state/EventEmitter';
import './styles/HomePage.CSS/CommonSelector.css';

/**
 * VersionSelectorc component
 * Allows selecting versions from a grouped list
 * Emits 'versionChange' events when selection changes
 * @param {Array} selectedVersions - Array of selected version IDs
 */
const VersionSelectorc = ({ selectedVersions }) => {
  const [versions, setVersions] = useState([]);

  useEffect(() => {
      const fetchVersions = async () => {
          try {
              const response = await fetch('http://localhost:8002/versions');
              if (response.ok) {
                  const data = await response.json();
                  setVersions(data.versions.map(v => ({ id: v, name: `Version ${v}` })));
              } else {
                  console.error('Failed to fetch versions');
              }
          } catch (error) {
              console.error('Error fetching versions:', error);
          }
      };
      fetchVersions();
  }, []);

  const handleVersionChange = (event) => {
      const selectedValues = Array.from(event.target.selectedOptions)
          .map(option => option.value);
      versionEventEmitter.emit('versionChange', 
          selectedValues.length === 1 ? selectedValues[0] : selectedValues);
  };

  return (
      <div className="version-selector">
          <select 
              multiple
              value={selectedVersions}
              onChange={handleVersionChange}
              className="version-select"
          >
              {versions.map((version) => (
                  <option key={version.id} value={version.id}>
                      {version.name}
                  </option>
              ))}
          </select>
      </div>
  );
};    

export default VersionSelectorc;
