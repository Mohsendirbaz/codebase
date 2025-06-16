/**
 * Matrix State Atoms for ModEcon Matrix System
 * 
 * This module provides Jotai atoms for managing the state of the ModEcon Matrix System.
 * It implements the Matrix State Management System described in the documentation,
 * providing a multi-dimensional approach to parameter management across versions,
 * zones, and time periods.
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { atomFamily } from 'jotai/utils';

// ===== Version Management =====

/**
 * Atom for storing all available versions
 */
export const versionsAtom = atomWithStorage('modecon-versions', [
  { id: 'v1', label: 'Base Case', description: 'Default scenario' },
  { id: 'v2', label: 'High Growth', description: 'Optimistic scenario with high growth rates' },
  { id: 'v3', label: 'Conservative', description: 'Conservative scenario with lower growth rates' },
]);

/**
 * Atom for the currently active version
 */
export const activeVersionAtom = atomWithStorage('modecon-active-version', 'v1');

/**
 * Atom family for version inheritance configuration
 * Each version can inherit from another version with a specified percentage
 */
export const versionInheritanceAtom = atomFamily(
  (versionId) => atomWithStorage(`modecon-version-inheritance-${versionId}`, {
    sourceVersionId: null,
    percentage: 100,
  }),
  (a, b) => a === b
);

// ===== Zone Management =====

/**
 * Atom for storing all available zones
 */
export const zonesAtom = atomWithStorage('modecon-zones', [
  { id: 'z1', label: 'Local', description: 'Local market segment' },
  { id: 'z2', label: 'Export', description: 'Export market segment' },
  { id: 'z3', label: 'Global', description: 'Global market segment' },
]);

/**
 * Atom for the currently active zone
 */
export const activeZoneAtom = atomWithStorage('modecon-active-zone', 'z1');

// ===== Parameter Management =====

/**
 * Atom for storing all available parameters
 */
export const parametersAtom = atomWithStorage('modecon-parameters', [
  { 
    id: 'p1', 
    name: 'Growth Rate', 
    description: 'Annual growth rate', 
    type: 'percentage',
    defaultValue: { value: 0.05 }
  },
  { 
    id: 'p2', 
    name: 'Initial Investment', 
    description: 'Initial investment amount', 
    type: 'currency',
    defaultValue: { value: 1000000 }
  },
  { 
    id: 'p3', 
    name: 'Operating Costs', 
    description: 'Annual operating costs', 
    type: 'currency',
    defaultValue: { value: 500000 }
  },
]);

// ===== Matrix Values =====

/**
 * Atom family for matrix values
 * Each matrix value is identified by a combination of version, zone, and parameter
 */
export const matrixValueAtom = atomFamily(
  (key) => {
    const [versionId, zoneId, parameterId] = key.split(':');
    return atomWithStorage(`modecon-matrix-value-${key}`, {
      value: null,
      efficacyPeriods: [{ start: '2025-01-01', end: '2030-12-31' }],
    });
  },
  (a, b) => a === b
);

/**
 * Helper function to get the matrix value atom for a specific version, zone, and parameter
 */
export const getMatrixValueAtom = (versionId, zoneId, parameterId) => {
  return matrixValueAtom(`${versionId}:${zoneId}:${parameterId}`);
};

// ===== Scaling System =====

/**
 * Atom for storing all scaling groups
 */
export const scalingGroupsAtom = atomWithStorage('modecon-scaling-groups', [
  { id: 'g1', name: 'Sensitivity Group 1', order: 1 },
  { id: 'g2', name: 'Sensitivity Group 2', order: 2 },
]);

/**
 * Atom for storing all scaling items
 */
export const scalingItemsAtom = atomWithStorage('modecon-scaling-items', [
  { 
    id: 's1', 
    parameterId: 'p1', 
    groupId: 'g1', 
    type: 'percentage', 
    value: { value: 0.1 },
    efficacyPeriods: [{ start: '2025-01-01', end: '2030-12-31' }],
  },
  { 
    id: 's2', 
    parameterId: 'p2', 
    groupId: 'g1', 
    type: 'multiplier', 
    value: { value: 1.2 },
    efficacyPeriods: [{ start: '2025-01-01', end: '2025-12-31' }],
  },
]);

/**
 * Atom family for scaling item values
 * Each scaling item value is identified by a combination of version, zone, and scaling item
 */
export const scalingItemValueAtom = atomFamily(
  (key) => {
    const [versionId, zoneId, scalingItemId] = key.split(':');
    return atomWithStorage(`modecon-scaling-item-value-${key}`, {
      value: null,
      efficacyPeriods: [{ start: '2025-01-01', end: '2030-12-31' }],
    });
  },
  (a, b) => a === b
);

// ===== History Tracking =====

/**
 * Atom for storing history entries
 */
export const historyEntriesAtom = atomWithStorage('modecon-history', []);

/**
 * Atom for the current history index
 */
export const historyIndexAtom = atom(0);

/**
 * Function to add a history entry
 */
export const addHistoryEntry = (state, action, description) => {
  const newEntry = {
    timestamp: new Date().toISOString(),
    action,
    description,
    state,
  };
  
  return (prevHistory) => {
    // Remove any entries after the current index (for redo functionality)
    const newHistory = prevHistory.slice(0, state.historyIndex + 1);
    return [...newHistory, newEntry];
  };
};

// ===== Derived State =====

/**
 * Atom for the current matrix state (combination of active version and zone)
 */
export const currentMatrixStateAtom = atom(
  (get) => {
    const activeVersion = get(activeVersionAtom);
    const activeZone = get(activeZoneAtom);
    return { versionId: activeVersion, zoneId: activeZone };
  }
);

/**
 * Atom for the calculated values after applying scaling
 */
export const calculatedValuesAtom = atom(
  (get) => {
    const { versionId, zoneId } = get(currentMatrixStateAtom);
    const parameters = get(parametersAtom);
    const scalingGroups = get(scalingGroupsAtom);
    const scalingItems = get(scalingItemsAtom);
    
    // Sort scaling groups by order
    const sortedGroups = [...scalingGroups].sort((a, b) => a.order - b.order);
    
    // Initialize calculated values with base values
    const calculatedValues = {};
    
    // Get base values for all parameters
    parameters.forEach(param => {
      const matrixValue = get(getMatrixValueAtom(versionId, zoneId, param.id));
      calculatedValues[param.id] = matrixValue.value || param.defaultValue;
    });
    
    // Apply scaling groups in order
    sortedGroups.forEach(group => {
      // Get scaling items for this group
      const groupItems = scalingItems.filter(item => item.groupId === group.id);
      
      // Apply each scaling item
      groupItems.forEach(item => {
        const paramId = item.parameterId;
        const baseValue = calculatedValues[paramId];
        
        if (baseValue) {
          // Get scaling item value for this version and zone
          const scalingValue = get(scalingItemValueAtom(`${versionId}:${zoneId}:${item.id}`));
          
          // Apply scaling based on type
          if (item.type === 'percentage') {
            calculatedValues[paramId] = {
              ...baseValue,
              value: baseValue.value * (1 + (scalingValue.value || item.value.value))
            };
          } else if (item.type === 'multiplier') {
            calculatedValues[paramId] = {
              ...baseValue,
              value: baseValue.value * (scalingValue.value || item.value.value)
            };
          } else if (item.type === 'absolute') {
            calculatedValues[paramId] = {
              ...baseValue,
              value: baseValue.value + (scalingValue.value || item.value.value)
            };
          }
        }
      });
    });
    
    return calculatedValues;
  }
);

// ===== API Integration =====

/**
 * Function to synchronize state with the backend
 */
export const synchronizeWithBackend = async () => {
  try {
    // Implement API calls to synchronize state with PostgreSQL and ClickHouse
    // This would typically involve fetching data from the backend and updating the atoms
    // or sending updated data to the backend
    
    // Example implementation:
    // const response = await fetch('/api/matrix/sync', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     versions: get(versionsAtom),
    //     zones: get(zonesAtom),
    //     parameters: get(parametersAtom),
    //     // Additional state to synchronize
    //   })
    // });
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to synchronize with backend');
    // }
    // 
    // const data = await response.json();
    // 
    // // Update atoms with data from backend
    // set(versionsAtom, data.versions);
    // set(zonesAtom, data.zones);
    // set(parametersAtom, data.parameters);
    // // Update additional atoms
    
    return true;
  } catch (error) {
    console.error('Error synchronizing with backend:', error);
    return false;
  }
};