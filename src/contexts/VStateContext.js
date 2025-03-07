import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Create a context for the V state
const VStateContext = createContext();

// Provider component that wraps the app and makes V state available to any child component that calls useVState()
export function VStateProvider({ children }) {
  // Initial state for V1-V10 toggles
  const [V, setV] = useState({
    V1: 'on',
    V2: 'off',
    V3: 'off',
    V4: 'off',
    V5: 'off',
    V6: 'off',
    V7: 'off',
    V8: 'off',
    V9: 'off',
    V10: 'off',
  });

  // Toggle function for V state
  const toggleV = useCallback((key) => {
    setV((prev) => ({
      ...prev,
      [key]: prev[key] === 'off' ? 'on' : 'off',
    }));
  }, []);

  // Direct setter function for V state
  const setVState = useCallback((key, value) => {
    setV((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Subscribe to changes in V state
  useEffect(() => {
    // This effect can be used to broadcast changes to external systems if needed
    // For example, you could emit events, update localStorage, or sync with a server
    console.log('V state updated:', V);
  }, [V]);

  // The value that will be provided to consumers of this context
  const value = {
    V,
    toggleV,
    setVState
  };

  return (
    <VStateContext.Provider value={value}>
      {children}
    </VStateContext.Provider>
  );
}

// Custom hook to access the V state context
export function useVState() {
  const context = useContext(VStateContext);
  if (context === undefined) {
    throw new Error('useVState must be used within a VStateProvider');
  }
  return context;
}