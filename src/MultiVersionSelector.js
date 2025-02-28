import React from 'react';
import { useVersionState } from './contexts/VersionStateContext';

/**
 * MultiVersionSelector component
 * Allows selecting multiple versions from a dropdown
 */
const MultiVersionSelector = ({ maxVersions = 20 }) => {
  // Get state and setters directly from context
  const { selectedVersions, setSelectedVersions } = useVersionState();

  // Generate array of version numbers from 1 to maxVersions
  const versionNumbers = Array.from({ length: maxVersions }, (_, i) => (i + 1).toString());

  // Set initial state with no versions selected
  React.useEffect(() => {
    if (selectedVersions.length === 0) {
      setSelectedVersions([]);
    }
  }, []);

  // Handle selection changes
  const handleVersionChange = (event) => {
    // Get selected options from the multi-select
    const selectedOptions = Array.from(event.target.selectedOptions, (option) => option.value);
    
    // Convert string values to numbers for consistency
    const numericVersions = selectedOptions.map(v => parseInt(v, 10));
    
    // Update the selected versions state
    setSelectedVersions(numericVersions);
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
