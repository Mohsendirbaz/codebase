import React, { useEffect, useCallback, useRef } from 'react';
import './AnalysisVisualizationIntegration.css';

// Analysis state types
const ANALYSIS_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  ERROR: 'error'
};

// Visualization update types
const UPDATE_TYPE = {
  DATA: 'data',
  LAYOUT: 'layout',
  STYLE: 'style'
};

class StateManager {
  constructor() {
    this.analysisState = {
      parameters: {
        active: new Set(),
        pending: new Set(),
        completed: new Set(),
        failed: new Map(),
        metadata: new Map()
      },
      process: {
        status: ANALYSIS_STATUS.IDLE,
        progress: 0,
        currentBatch: null,
        queue: []
      },
      results: {
        current: new Map(),
        history: [],
        comparisons: new Map()
      }
    };

    this.visualizationState = {
      display: {
        layout: {
          type: 'grid',
          config: {
            columns: 2,
            spacing: 16,
            alignment: 'start'
          },
          responsive: {
            breakpoints: new Map(),
            current: null
          }
        },
        style: {
          theme: 'light',
          colors: {
            primary: ['#007bff', '#28a745', '#dc3545'],
            secondary: ['#6c757d', '#17a2b8', '#ffc107'],
            emphasis: ['#0056b3', '#1e7e34', '#bd2130']
          },
          typography: {
            scale: 1,
            family: 'system-ui, -apple-system, sans-serif',
            weights: [400, 500, 600]
          },
          animation: {
            enabled: true,
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }
        },
        interaction: {
          active: new Set(),
          hover: null,
          selected: new Set(),
          focus: {
            element: null,
            reason: null
          }
        }
      },
      data: {
        transforms: new Map(),
        filters: {
          active: new Map(),
          pipeline: [],
          cache: {
            lastUpdate: Date.now(),
            filtered: new Set()
          }
        },
        aggregation: {
          level: 'parameter',
          method: 'average',
          groups: new Map(),
          results: new Map()
        }
      },
      sync: {
        lastAnalysisId: null,
        pendingUpdates: new Set(),
        updateQueue: []
      }
    };

    // Performance optimization
    this.updateDebounceTimeout = null;
    this.updateBatchSize = 10;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Analysis state updates
  updateAnalysisState = (update) => {
    const { type, payload } = update;

    switch (type) {
      case 'START_ANALYSIS':
        this.analysisState.process.status = ANALYSIS_STATUS.RUNNING;
        this.analysisState.process.progress = 0;
        break;

      case 'UPDATE_PROGRESS':
        this.analysisState.process.progress = payload.progress;
        break;

      case 'COMPLETE_ANALYSIS':
        this.analysisState.process.status = ANALYSIS_STATUS.IDLE;
        this.analysisState.results.current.set(payload.id, payload.result);
        this.analysisState.results.history.push({
          id: payload.id,
          timestamp: Date.now(),
          parameters: Array.from(this.analysisState.parameters.active),
          summary: payload.summary
        });
        break;

      case 'ERROR_ANALYSIS':
        this.analysisState.process.status = ANALYSIS_STATUS.ERROR;
        this.analysisState.parameters.failed.set(payload.parameter, payload.error);
        break;

      default:
        console.warn(`Unknown analysis update type: ${type}`);
    }

    this.triggerVisualizationUpdate();
  };

  // Visualization state updates
  updateVisualizationState = (update) => {
    const { type, payload } = update;

    switch (type) {
      case 'UPDATE_LAYOUT':
        Object.assign(this.visualizationState.display.layout.config, payload);
        break;

      case 'UPDATE_STYLE':
        Object.assign(this.visualizationState.display.style, payload);
        break;

      case 'UPDATE_INTERACTION':
        Object.assign(this.visualizationState.display.interaction, payload);
        break;

      case 'UPDATE_DATA_TRANSFORM':
        this.visualizationState.data.transforms.set(payload.id, payload.transform);
        break;

      default:
        console.warn(`Unknown visualization update type: ${type}`);
    }

    this.processPendingUpdates();
  };

  // State synchronization
  syncStates = () => {
    // Sync analysis results to visualization
    const newResults = Array.from(this.analysisState.results.current.entries());
    for (const [id, result] of newResults) {
      if (!this.visualizationState.sync.pendingUpdates.has(id)) {
        this.visualizationState.sync.pendingUpdates.add(id);
        this.visualizationState.sync.updateQueue.push({
          type: UPDATE_TYPE.DATA,
          target: id,
          payload: result
        });
      }
    }

    // Update visualization layout based on analysis state
    if (this.analysisState.process.status === ANALYSIS_STATUS.RUNNING) {
      this.visualizationState.display.interaction.active = new Set([
        ...this.analysisState.parameters.active
      ]);
    }

    this.processPendingUpdates();
  };

  // Update processing
  processPendingUpdates = () => {
    clearTimeout(this.updateDebounceTimeout);
    this.updateDebounceTimeout = setTimeout(() => {
      const updates = this.visualizationState.sync.updateQueue.splice(0, this.updateBatchSize);
      
      for (const update of updates) {
        this.visualizationState.sync.pendingUpdates.delete(update.target);
        
        // Process update based on type
        switch (update.type) {
          case UPDATE_TYPE.DATA:
            this.processDataUpdate(update);
            break;
          case UPDATE_TYPE.LAYOUT:
            this.processLayoutUpdate(update);
            break;
          case UPDATE_TYPE.STYLE:
            this.processStyleUpdate(update);
            break;
        }
      }

      // Clean up old cache entries
      this.manageCaches();

      if (this.visualizationState.sync.updateQueue.length > 0) {
        this.processPendingUpdates();
      }
    }, 16); // ~60fps
  };

  // Cache management
  manageCaches = () => {
    const now = Date.now();

    // Clean up transform cache
    for (const [id, transform] of this.visualizationState.data.transforms) {
      if (transform.cache && now - transform.cache.lastAccess > this.cacheTimeout) {
        transform.cache.clear();
      }
    }

    // Clean up filter cache
    if (now - this.visualizationState.data.filters.cache.lastUpdate > this.cacheTimeout) {
      this.visualizationState.data.filters.cache.filtered.clear();
    }

    // Trim history if needed
    while (this.analysisState.results.history.length > 100) {
      this.analysisState.results.history.shift();
    }
  };

  // Helper methods for update processing
  processDataUpdate = (update) => {
    const { target, payload } = update;
    
    // Apply transforms
    let transformedData = payload;
    for (const transform of this.visualizationState.data.transforms.values()) {
      if (transform.type === 'scale' || transform.type === 'normalize') {
        transformedData = this.applyTransform(transform, transformedData);
      }
    }

    // Apply filters
    if (this.visualizationState.data.filters.active.size > 0) {
      transformedData = this.applyFilters(transformedData);
    }

    // Update aggregation if needed
    if (this.visualizationState.data.aggregation.level !== 'parameter') {
      transformedData = this.aggregateData(transformedData);
    }

    // Store processed result
    this.visualizationState.data.results.set(target, transformedData);
  };

  processLayoutUpdate = (update) => {
    const { payload } = update;
    Object.assign(this.visualizationState.display.layout.config, payload);
  };

  processStyleUpdate = (update) => {
    const { payload } = update;
    Object.assign(this.visualizationState.display.style, payload);
  };

  // Data processing helpers
  applyTransform = (transform, data) => {
    if (transform.cache?.has(data)) {
      return transform.cache.get(data);
    }

    let result;
    switch (transform.type) {
      case 'scale':
        result = this.scaleData(data, transform.config);
        break;
      case 'normalize':
        result = this.normalizeData(data, transform.config);
        break;
      default:
        result = data;
    }

    if (transform.cache) {
      transform.cache.set(data, result);
    }

    return result;
  };

  applyFilters = (data) => {
    const filters = Array.from(this.visualizationState.data.filters.active.values());
    return filters.reduce((filtered, filter) => {
      return this.filterData(filtered, filter);
    }, data);
  };

  aggregateData = (data) => {
    const { level, method, groups } = this.visualizationState.data.aggregation;
    return this.aggregateByLevel(data, level, method, groups);
  };

  // Utility methods
  scaleData = (data, config) => {
    const { scale = 1, offset = 0 } = config;
    return typeof data === 'number' ? data * scale + offset : data;
  };

  normalizeData = (data, config) => {
    const { min = 0, max = 1 } = config;
    if (typeof data !== 'number') return data;
    return (data - min) / (max - min);
  };

  filterData = (data, filter) => {
    const { predicate } = filter;
    return predicate(data);
  };

  aggregateByLevel = (data, level, method, groups) => {
    if (level === 'parameter' || !data) return data;

    const groupMap = level === 'group' ? groups : new Map([['all', Array.from(groups.values()).flat()]]);
    
    return Array.from(groupMap.entries()).reduce((result, [groupId, parameters]) => {
      result[groupId] = parameters.reduce((acc, param) => {
        const value = data[param];
        if (value === undefined) return acc;
        
        switch (method) {
          case 'sum':
            return acc + value;
          case 'average':
            return acc + value / parameters.length;
          case 'weighted':
            const weight = this.analysisState.parameters.metadata.get(param)?.weight || 1;
            return acc + value * weight;
          default:
            return acc;
        }
      }, 0);
      return result;
    }, {});
  };
}

const AnalysisVisualizationIntegration = ({
  onAnalysisUpdate,
  onVisualizationUpdate,
  children
}) => {
  const stateManager = useRef(new StateManager());

  const handleAnalysisUpdate = useCallback((update) => {
    stateManager.current.updateAnalysisState(update);
    if (onAnalysisUpdate) {
      onAnalysisUpdate(stateManager.current.analysisState);
    }
  }, [onAnalysisUpdate]);

  const handleVisualizationUpdate = useCallback((update) => {
    stateManager.current.updateVisualizationState(update);
    if (onVisualizationUpdate) {
      onVisualizationUpdate(stateManager.current.visualizationState);
    }
  }, [onVisualizationUpdate]);

  useEffect(() => {
    const syncInterval = setInterval(() => {
      stateManager.current.syncStates();
    }, 1000);

    return () => clearInterval(syncInterval);
  }, []);

  return (
    <div className="analysis-visualization-integration">
      {React.Children.map(children, child =>
        React.cloneElement(child, {
          onAnalysisUpdate: handleAnalysisUpdate,
          onVisualizationUpdate: handleVisualizationUpdate,
          analysisState: stateManager.current.analysisState,
          visualizationState: stateManager.current.visualizationState
        })
      )}
    </div>
  );
};

export default AnalysisVisualizationIntegration;
