import { createContext, useContext, useReducer, useCallback } from 'react';

// Action Types
const SET_CURRENT_VERSION = 'SET_CURRENT_VERSION';
const SET_SELECTED_VERSIONS = 'SET_SELECTED_VERSIONS';
const UPDATE_BATCH_INFO = 'UPDATE_BATCH_INFO';
const SET_VERSION_HISTORY = 'SET_VERSION_HISTORY';

// Initial State
const initialState = {
  currentVersion: 1,
  selectedVersions: [],
  batchInfo: {},
  versionHistory: [],
  context: 'default'
};

// Reducer
function versionReducer(state, action) {
  switch (action.type) {
    case SET_CURRENT_VERSION:
      return {
        ...state,
        currentVersion: action.payload,
        selectedVersions: state.selectedVersions.includes(action.payload)
          ? state.selectedVersions
          : [...state.selectedVersions, action.payload]
      };
    
    case SET_SELECTED_VERSIONS:
      return {
        ...state,
        selectedVersions: action.payload,
        currentVersion: action.payload.includes(state.currentVersion)
          ? state.currentVersion
          : action.payload[0] || state.currentVersion
      };
    
    case UPDATE_BATCH_INFO:
      return {
        ...state,
        batchInfo: {
          ...state.batchInfo,
          ...action.payload
        }
      };
    
    case SET_VERSION_HISTORY:
      return {
        ...state,
        versionHistory: action.payload
      };
    
    default:
      return state;
  }
}

// Context
const VersionStateContext = createContext(null);
const VersionDispatchContext = createContext(null);

// Provider Component
export function VersionStateProvider({ children }) {
  const [state, dispatch] = useReducer(versionReducer, initialState);

  // Action Creators
  const setCurrentVersion = useCallback((version) => {
    dispatch({ type: SET_CURRENT_VERSION, payload: version });
  }, []);

  const setSelectedVersions = useCallback((versions) => {
    dispatch({ type: SET_SELECTED_VERSIONS, payload: versions });
  }, []);

  const updateBatchInfo = useCallback((info) => {
    dispatch({ type: UPDATE_BATCH_INFO, payload: info });
  }, []);

  const setVersionHistory = useCallback((history) => {
    dispatch({ type: SET_VERSION_HISTORY, payload: history });
  }, []);

  // Value object with state and actions
  const value = {
    state,
    actions: {
      setCurrentVersion,
      setSelectedVersions,
      updateBatchInfo,
      setVersionHistory
    }
  };

  return (
    <VersionStateContext.Provider value={value}>
      <VersionDispatchContext.Provider value={dispatch}>
        {children}
      </VersionDispatchContext.Provider>
    </VersionStateContext.Provider>
  );
}

// Custom Hooks
export function useVersionState() {
  const context = useContext(VersionStateContext);
  if (!context) {
    throw new Error('useVersionState must be used within a VersionStateProvider');
  }
  return context;
}

export function useVersionDispatch() {
  const dispatch = useContext(VersionDispatchContext);
  if (!dispatch) {
    throw new Error('useVersionDispatch must be used within a VersionStateProvider');
  }
  return dispatch;
}

// Selector Hooks
export function useCurrentVersion() {
  const { state } = useVersionState();
  return state.currentVersion;
}

export function useSelectedVersions() {
  const { state } = useVersionState();
  return state.selectedVersions;
}

export function useBatchInfo() {
  const { state } = useVersionState();
  return state.batchInfo;
}

export function useVersionHistory() {
  const { state } = useVersionState();
  return state.versionHistory;
}

// Action Hooks
export function useVersionActions() {
  const { actions } = useVersionState();
  return actions;
}
