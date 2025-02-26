import React, { createContext, useContext, useState, useCallback } from 'react';

const VersionStateContext = createContext(null);

export function VersionStateProvider({ children }) {
  const [version, setVersion] = useState('1');
  const [selectedVersions, setSelectedVersions] = useState([]);

  const updateVersion = useCallback((newVersion) => {
    setVersion(newVersion);
  }, []);

  const updateSelectedVersions = useCallback((versions) => {
    setSelectedVersions(versions);
  }, []);

  const value = {
    version,
    selectedVersions,
    updateVersion,
    updateSelectedVersions
  };

  return (
    <VersionStateContext.Provider value={value}>
      {children}
    </VersionStateContext.Provider>
  );
}

export function useVersionState() {
  const context = useContext(VersionStateContext);
  if (!context) {
    throw new Error('useVersionState must be used within a VersionStateProvider');
  }
  return context;
}
