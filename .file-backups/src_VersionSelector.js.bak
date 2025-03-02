import React, { useMemo } from 'react';
import { useVersionState } from './contexts/VersionStateContext';
import './VersionSelector.css';

/**
 * VersionSelector component
 * Allows selecting versions from a grouped list
 */
const VersionSelector = ({ maxVersions = 20, batchInfo = {} }) => {
  // Get state and setters directly from context
  const { selectedVersions, setSelectedVersions } = useVersionState();

  // Group versions into batches
  const batchGroups = useMemo(() => {
    const groups = {};
    Array.from({ length: maxVersions }, (_, i) => i + 1).forEach(version => {
      const batchId = batchInfo[version]?.batchId || Math.ceil(version / 5); // Group every 5 versions by default
      if (!groups[batchId]) {
        groups[batchId] = {
          id: batchId,
          name: batchInfo[version]?.batchName || `Batch ${batchId}`,
          versions: []
        };
      }
      groups[batchId].versions.push(version);
    });
    return Object.values(groups);
  }, [maxVersions, batchInfo]);

  // Toggle a single version selection
  const handleVersionToggle = (version) => {
    setSelectedVersions(prev => 
      prev.includes(version)
        ? prev.filter(v => v !== version)
        : [...prev, version]
    );
  };

  // Toggle all versions in a batch
  const handleBatchSelect = (batchId) => {
    const group = batchGroups.find(g => g.id === batchId);
    if (!group) return;

    const allSelected = group.versions.every(v => selectedVersions.includes(v));
    if (allSelected) {
      setSelectedVersions(prev => prev.filter(v => !group.versions.includes(v)));
    } else {
      setSelectedVersions(prev => [...new Set([...prev, ...group.versions])]);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e, action, type = 'item') => {
    // Enter or Space for selection
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
      return;
    }

    // Batch shortcuts (only when focused on group header)
    if (type === 'header') {
      if (e.key === 'a' && e.ctrlKey) {
        // Ctrl+A to select all in group
        e.preventDefault();
        action();
        return;
      }
    }

    // Navigation shortcuts
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const next = e.target.nextElementSibling;
        if (next && next.tabIndex === 0) next.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prev = e.target.previousElementSibling;
        if (prev && prev.tabIndex === 0) prev.focus();
        break;
      case 'Home':
        e.preventDefault();
        e.target.parentElement.firstElementChild.focus();
        break;
      case 'End':
        e.preventDefault();
        e.target.parentElement.lastElementChild.focus();
        break;
      default:
        break;
    }
  };

  return (
    <div 
      className="version-selector"
      role="region"
      aria-label="Version Selection"
    >
      {batchGroups.map(group => (
        <div key={group.id} className="version-group">
          <div 
            className={`group-header ${
              group.versions.every(v => selectedVersions.includes(v)) ? 'all-selected' : ''
            }`}
            onClick={() => handleBatchSelect(group.id)}
            onKeyDown={(e) => handleKeyDown(e, () => handleBatchSelect(group.id), 'header')}
            role="button"
            tabIndex={0}
            aria-expanded="true"
            aria-controls={`version-list-${group.id}`}
          >
            <div className="group-title">
              <span className="group-name">{group.name}</span>
              <span className="group-count">
                {group.versions.filter(v => selectedVersions.includes(v)).length} 
                / {group.versions.length}
              </span>
            </div>
          </div>
          <div 
            className="version-list"
            id={`version-list-${group.id}`}
            role="list"
          >
            {group.versions.map(version => (
              <div 
                key={version}
                className={`version-item ${
                  selectedVersions.includes(version) ? 'selected' : ''
                }`}
                onClick={() => handleVersionToggle(version)}
                onKeyDown={(e) => handleKeyDown(e, () => handleVersionToggle(version), 'item')}
                role="listitem"
                tabIndex={0}
                aria-selected={selectedVersions.includes(version)}
              >
                <div className="version-info">
                  <span className="version-number">Model {version}</span>
                  {batchInfo[version]?.description && (
                    <span className="version-description">
                      {batchInfo[version].description}
                    </span>
                  )}
                </div>
                <div className="version-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedVersions.includes(version)}
                    onChange={() => handleVersionToggle(version)}
                    onClick={e => e.stopPropagation()}
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none'
                    }}
                    aria-label={`Select Version ${version}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VersionSelector;
