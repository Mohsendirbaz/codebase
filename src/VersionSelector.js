import React, { useState, useEffect, useMemo } from 'react';
import './styles/HomePage.CSS/VersionSelector.css';

/**
 * VersionSelector component
 * Allows selecting versions from a grouped list
 * 
 */
const VersionSelector = ({ onVersionSelect }) => {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState('');

  useEffect(() => {
      const fetchVersions = async () => {
          try {
              const response = await fetch('http://localhost:5000/versions');
              if (response.ok) {
                  const data = await response.json();
                  setVersions(data);
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
      const selectedValue = event.target.value;
      setSelectedVersion(selectedValue);
      onVersionSelect(selectedValue);
  };

  return (
      <div className="version-selector">
          <select 
              value={selectedVersion}
              onChange={handleVersionChange}
              className="version-select"
          >
              <option value="">Select Version</option>
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
