import React, { useCallback } from 'react';
import './SelectionPanel.css';

const SelectionPanel = ({
  available,
  selected,
  filtered,
  searchQuery,
  error,
  loading,
  onSelect,
  onSelectAll,
  onSelectNone,
  onSearch,
  onRefresh
}) => {
  const handleSearchChange = useCallback((e) => {
    onSearch(e.target.value);
  }, [onSearch]);

  const handleVersionToggle = useCallback((version) => {
    onSelect(version);
  }, [onSelect]);

  const renderVersionItem = useCallback((version) => {
    const isSelected = selected.includes(version);
    return (
      <div 
        key={version}
        className={`version-item ${isSelected ? 'selected' : ''}`}
      >
        <label className="version-item__label">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleVersionToggle(version)}
            className="version-item__checkbox"
          />
          <span className="version-item__text">
            CFA Version {version}
          </span>
        </label>
      </div>
    );
  }, [selected, handleVersionToggle]);

  const renderNoResults = useCallback(() => {
    if (loading) {
      return (
        <div className="version-list__loading">
          Loading versions...
        </div>
      );
    }
    
    return (
      <div className="version-list__empty">
        {searchQuery
          ? `No versions found matching "${searchQuery}"`
          : 'No CFA versions available'}
      </div>
    );
  }, [searchQuery, loading]);

  const renderSelectionSummary = useCallback(() => {
    if (selected.length === 0) return 'No versions selected';
    if (selected.length === available.length && available.length > 0) return 'All versions selected';
    return `${selected.length} version${selected.length === 1 ? '' : 's'} selected`;
  }, [selected.length, available.length]);

  return (
    <div className="selection-panel">
      <div className="selection-panel__header">
        <div className="selection-panel__search">
          <input
            type="text"
            placeholder="Search CFA versions..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
            disabled={loading || available.length === 0}
          />
        </div>
        <div className="selection-panel__controls">
          <button
            className="control-button"
            onClick={onSelectAll}
            disabled={loading || available.length === 0}
          >
            Select All
          </button>
          <button
            className="control-button"
            onClick={onSelectNone}
            disabled={loading || selected.length === 0}
          >
            Clear
          </button>
          <button
            className="control-button refresh"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh available versions"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="selection-panel__error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button 
            className="error-retry"
            onClick={onRefresh}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      )}

      <div className="selection-panel__summary">
        <span className="summary-text">
          {renderSelectionSummary()}
        </span>
        {searchQuery && (
          <span className="filter-text">
            Filtering: {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </span>
        )}
        {loading && (
          <span className="loading-indicator">Loading...</span>
        )}
      </div>

      <div className="selection-panel__list">
        {loading ? (
          renderNoResults()
        ) : filtered.length > 0 ? (
          <div className="version-list">
            {filtered.map(renderVersionItem)}
          </div>
        ) : (
          renderNoResults()
        )}
      </div>

      {selected.length > 0 && (
        <div className="selection-panel__footer">
          <div className="selected-versions">
            <h4 className="selected-versions__title">Selected Versions:</h4>
            <div className="selected-versions__tags">
              {selected.map(version => (
                <span 
                  key={version}
                  className="version-tag"
                  onClick={() => handleVersionToggle(version)}
                >
                  {version}
                  <button 
                    className="version-tag__remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVersionToggle(version);
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectionPanel;