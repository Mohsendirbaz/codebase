import React, { createContext, useContext, useState } from 'react';

// Create a context for version state
const VersionStateContext = createContext(null);

// Provider component that wraps the app and makes version state available
export function VersionStateProvider({ children }) {
  // Single source of truth for current version
  const [version, setVersion] = useState('1');
  
  // Single source of truth for selected versions
  // Initialize with no versions selected
  const [selectedVersions, setSelectedVersions] = useState([]);

  // Value object with just the state and setters
  const value = {
    version,
    setVersion,
    selectedVersions,
    setSelectedVersions
  };

  return (
    <VersionStateContext.Provider value={value}>
      {children}
    </VersionStateContext.Provider>
  );
}

// Custom hook to use the version context
export function useVersionState() {
  const context = useContext(VersionStateContext);
  if (!context) {
    throw new Error('useVersionState must be used within a VersionStateProvider');
  }
  return context;
}
