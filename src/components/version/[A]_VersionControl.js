import React, { useState, useEffect } from 'react';
import './VersionControl.css';

const VersionControl = ({ 
  version, 
  onVersionChange,
  onRefresh,
  disabled = false
}) => {
  const [localVersion, setLocalVersion] = useState(version);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setLocalVersion(version);
  }, [version]);

  const handleIncrement = () => {
    const newVersion = localVersion + 1;
    setLocalVersion(newVersion);
    onVersionChange(newVersion);
  };

  const handleDecrement = () => {
    if (localVersion > 0) {
      const newVersion = localVersion - 1;
      setLocalVersion(newVersion);
      onVersionChange(newVersion);
    }
  };

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setLocalVersion(value);
      onVersionChange(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  };

  return (
    <div className="version-control">
      <div className="version-input-group">
        <button 
          className="version-button decrement"
          onClick={handleDecrement}
          disabled={disabled || localVersion <= 0}
          title="Previous version"
        >
          -
        </button>
        
        <div className="version-input-container">
          <label htmlFor="versionNumber" className="version-label">
            Version
          </label>
          <input
            id="versionNumber"
            type="number"
            className="version-input"
            value={localVersion}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            min="0"
            disabled={disabled}
          />
        </div>

        <button 
          className="version-button increment"
          onClick={handleIncrement}
          disabled={disabled}
          title="Next version"
        >
          +
        </button>
      </div>

      <button 
        className="refresh-button"
        onClick={onRefresh}
        disabled={disabled}
        title="Refresh version"
      >
        ↻
      </button>
    </div>
  );
};

export default VersionControl;
