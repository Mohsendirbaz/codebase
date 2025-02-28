import React from 'react';
import { useVersionState } from './contexts/VersionStateContext';

const MultiVersionSelector = ({ maxVersions = 20 }) => {
  const { selectedVersions, updateSelectedVersions, version, setVersion } = useVersionState();

  // Generate array of version numbers from 1 to maxVersions
  const versionNumbers = Array.from({ length: maxVersions }, (_, i) => (i + 1).toString());

  const handleVersionChange = (event) => {
    const selectedOptions = Array.from(event.target.selectedOptions, (option) => option.value);
    // Convert string values to numbers for consistency
    const numericVersions = selectedOptions.map(v => parseInt(v, 10));
    updateSelectedVersions(numericVersions);
    
    // If the current version is not in the selected versions and at least one version is selected,
    // update the current version to the first selected version
    if (numericVersions.length > 0 && !numericVersions.includes(parseInt(version, 10))) {
      setVersion(numericVersions[0].toString());
    }
  };

  return (
    <div className="version-selector-container">
      <label htmlFor="version-multi-selector" className="label-common">Versions to Process:</label>
      <select
        id="version-multi-selector"
        multiple
        value={selectedVersions.map(v => v.toString())}
        onChange={handleVersionChange}
        className="form-item"
      >
        {versionNumbers.map((versionNum) => (
          <option key={versionNum} value={versionNum}>
            {versionNum}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MultiVersionSelector;
