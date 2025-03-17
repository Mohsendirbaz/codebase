import React, { useState, useEffect } from 'react';
import './styles/HomePage.CSS/VersionSelector.css';
import versionEventEmitter from './utils/eventEmitter';
import './styles/HomePage.CSS/CommonSelector.css';

/**
 * VersionSelector component
 * Allows selecting versions from a grouped list
 * Emits 'versionChange' events when selection changes
 */
const VersionSelector = () => {
  const [versions, setVersions] = useState([]);
  const [selectedVersions, setSelectedVersions] = useState([]);

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
      setSelectedVersions(selectedValues);
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

export default VersionSelector;
