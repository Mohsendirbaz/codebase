import React from 'react';
import '../styles/HomePage.CSS/Consolidated.css';

/**
 * @file VersionZoneManager.js
 * @description Version & Zone Management Component
 * @module managers/VersionZoneManager
 * @requires react
 */

/**
 * Version & Zone Management Component
 * Provides UI for managing versions and zones in matrix form values
 * 
 * @param {Object} props - Component props
 * @param {Object} props.versions - Versions object with list, active, and metadata properties
 * @param {Object} props.zones - Zones object with list, active, and metadata properties
 * @param {Function} props.createVersion - Function to create a new version
 * @param {Function} props.setActiveVersion - Function to set the active version
 * @param {Function} props.createZone - Function to create a new zone
 * @param {Function} props.setActiveZone - Function to set the active zone
 */
function VersionZoneManager({ versions = {}, zones = {}, createVersion, setActiveVersion, createZone, setActiveZone }) {
  // Ensure versions and zones have the required properties with default values
  const versionsList = versions.list || [];
  const versionsActive = versions.active || '';
  const versionsMetadata = versions.metadata || {};

  const zonesList = zones.list || [];
  const zonesActive = zones.active || '';
  const zonesMetadata = zones.metadata || {};

  return (
    <div className="matrix-selectors">
      <div className="version-selector">
        <h3>Version</h3>
        <select
          value={versionsActive}
          onChange={e => setActiveVersion(e.target.value)}
        >
          {versionsList.map(version => (
            <option key={version} value={version}>
              {versionsMetadata[version]?.label || version}
            </option>
          ))}
        </select>
        <button onClick={() => {
          const label = prompt("Enter name for new version:", `Version ${versionsList.length + 1}`);
          if (label) createVersion(label);
        }}>+ New Version</button>
      </div>

      <div className="zone-selector">
        <h3>Zone</h3>
        <select
          value={zonesActive}
          onChange={e => setActiveZone(e.target.value)}
        >
          {zonesList.map(zone => (
            <option key={zone} value={zone}>
              {zonesMetadata[zone]?.label || zone}
            </option>
          ))}
        </select>
        <button onClick={() => {
          const label = prompt("Enter name for new zone:", `Zone ${zonesList.length + 1}`);
          if (label) createZone(label);
        }}>+ New Zone</button>
      </div>
    </div>
  );
}

export default VersionZoneManager;