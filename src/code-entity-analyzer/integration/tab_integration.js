/**
 * Tab Integration
 * 
 * This module handles the integration of code entity analyzer visualizations
 * into the application's tab system, allowing users to view different
 * visualizations in separate tabs.
 */

/**
 * Creates a tab integration for code entity analyzer visualizations
 * @param {Object} tabSystem - The application's tab system
 * @param {Object} options - Integration options
 * @returns {Object} - The tab integration instance
 */
function createTabIntegration(tabSystem, options = {}) {
  const defaultOptions = {
    tabPrefix: 'code-analyzer-',
    defaultTabTitle: 'Code Analysis',
    tabIcon: 'code',
    showCloseButton: true,
    persistTabs: true,
    maxTabs: 10
  };

  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };

  // Create the integration
  const integration = new TabIntegration(tabSystem, mergedOptions);

  return integration;
}

/**
 * Tab Integration class
 */
class TabIntegration {
  /**
   * Constructor
   * @param {Object} tabSystem - The application's tab system
   * @param {Object} options - Integration options
   */
  constructor(tabSystem, options) {
    this.tabSystem = tabSystem;
    this.options = options;
    this.tabs = new Map(); // Maps tab IDs to tab info
    this.activeTabId = null;

    // Initialize
    this.init();
  }

  /**
   * Initialize the tab integration
   */
  init() {
    // Load persisted tabs if enabled
    if (this.options.persistTabs) {
      this.loadPersistedTabs();
    }

    // Listen for tab system events
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for tab system events
   */
  setupEventListeners() {
    // Listen for tab close events
    if (this.tabSystem.on) {
      this.tabSystem.on('tabClose', (tabId) => {
        if (this.tabs.has(tabId)) {
          this.handleTabClose(tabId);
        }
      });

      this.tabSystem.on('tabActivate', (tabId) => {
        if (this.tabs.has(tabId)) {
          this.activeTabId = tabId;
        }
      });
    }
  }

  /**
   * Create a new tab for a visualization
   * @param {string} visualizationType - The type of visualization ('component-graph', 'state-flow', 'dependency-heatmap', 'code-entity-analysis')
   * @param {Object} visualizationData - The data for the visualization
   * @param {Object} visualizationOptions - Options for the visualization
   * @param {string} title - Optional title for the tab
   * @returns {string} - The ID of the created tab
   */
  createVisualizationTab(visualizationType, visualizationData, visualizationOptions = {}, title = '') {
    // Check if we've reached the maximum number of tabs
    if (this.tabs.size >= this.options.maxTabs) {
      console.warn(`Maximum number of tabs (${this.options.maxTabs}) reached. Close some tabs before creating new ones.`);
      return null;
    }

    // Generate a unique ID for the tab
    const tabId = `${this.options.tabPrefix}${visualizationType}-${Date.now()}`;

    // Determine the tab title
    const tabTitle = title || this.getDefaultTitleForVisualization(visualizationType);

    // Create the tab content container
    const contentContainer = document.createElement('div');
    contentContainer.id = `${tabId}-content`;
    contentContainer.className = 'code-analyzer-visualization-container';
    contentContainer.style.width = '100%';
    contentContainer.style.height = '100%';

    // Create the tab
    const tab = this.tabSystem.createTab({
      id: tabId,
      title: tabTitle,
      icon: this.options.tabIcon,
      content: contentContainer,
      closable: this.options.showCloseButton
    });

    // Store tab information
    this.tabs.set(tabId, {
      id: tabId,
      type: visualizationType,
      title: tabTitle,
      data: visualizationData,
      options: visualizationOptions,
      visualization: null // Will be set after rendering
    });

    // Activate the tab
    this.tabSystem.activateTab(tabId);
    this.activeTabId = tabId;

    // Render the visualization
    this.renderVisualization(tabId);

    // Persist tabs if enabled
    if (this.options.persistTabs) {
      this.persistTabs();
    }

    return tabId;
  }

  /**
   * Render a visualization in a tab
   * @param {string} tabId - The ID of the tab
   */
  renderVisualization(tabId) {
    const tabInfo = this.tabs.get(tabId);
    if (!tabInfo) {
      console.error(`Tab with ID ${tabId} not found`);
      return;
    }

    const contentContainer = document.getElementById(`${tabId}-content`);
    if (!contentContainer) {
      console.error(`Content container for tab ${tabId} not found`);
      return;
    }

    // Clear any existing content
    contentContainer.innerHTML = '';

    // Create the visualization based on type
    switch (tabInfo.type) {
      case 'component-graph':
        this.renderComponentGraph(tabInfo, contentContainer);
        break;
      case 'state-flow':
        this.renderStateFlow(tabInfo, contentContainer);
        break;
      case 'dependency-heatmap':
        this.renderDependencyHeatmap(tabInfo, contentContainer);
        break;
      case 'code-entity-analysis':
        this.renderCodeEntityAnalysis(tabInfo, contentContainer);
        break;
      default:
        console.error(`Unknown visualization type: ${tabInfo.type}`);
    }
  }

  /**
   * Render a component graph visualization
   * @param {Object} tabInfo - Information about the tab
   * @param {HTMLElement} container - The container element
   */
  renderComponentGraph(tabInfo, container) {
    try {
      // Placeholder for component graph visualization
      container.innerHTML = `<div class="visualization-placeholder">
        <h3>Component Graph Visualization</h3>
        <p>This is a placeholder for the component graph visualization.</p>
        <p>In a real implementation, this would render a graph of components and their relationships.</p>
      </div>`;

      // Store the visualization instance
      tabInfo.visualization = { type: 'component-graph' };

      // Add resize handler
      this.setupResizeHandler(tabInfo, container);
    } catch (error) {
      console.error('Error rendering component graph:', error);
      container.innerHTML = `<div class="error-message">Error rendering component graph: ${error.message}</div>`;
    }
  }

  /**
   * Render a state flow diagram visualization
   * @param {Object} tabInfo - Information about the tab
   * @param {HTMLElement} container - The container element
   */
  renderStateFlow(tabInfo, container) {
    try {
      // Placeholder for state flow diagram visualization
      container.innerHTML = `<div class="visualization-placeholder">
        <h3>State Flow Diagram</h3>
        <p>This is a placeholder for the state flow diagram visualization.</p>
        <p>In a real implementation, this would render a diagram of state transitions.</p>
      </div>`;

      // Store the visualization instance
      tabInfo.visualization = { type: 'state-flow' };

      // Add resize handler
      this.setupResizeHandler(tabInfo, container);
    } catch (error) {
      console.error('Error rendering state flow diagram:', error);
      container.innerHTML = `<div class="error-message">Error rendering state flow diagram: ${error.message}</div>`;
    }
  }

  /**
   * Render a dependency heatmap visualization
   * @param {Object} tabInfo - Information about the tab
   * @param {HTMLElement} container - The container element
   */
  renderDependencyHeatmap(tabInfo, container) {
    try {
      // Placeholder for dependency heatmap visualization
      container.innerHTML = `<div class="visualization-placeholder">
        <h3>Dependency Heatmap</h3>
        <p>This is a placeholder for the dependency heatmap visualization.</p>
        <p>In a real implementation, this would render a heatmap of dependencies between components.</p>
      </div>`;

      // Store the visualization instance
      tabInfo.visualization = { type: 'dependency-heatmap' };

      // Add resize handler
      this.setupResizeHandler(tabInfo, container);
    } catch (error) {
      console.error('Error rendering dependency heatmap:', error);
      container.innerHTML = `<div class="error-message">Error rendering dependency heatmap: ${error.message}</div>`;
    }
  }

  /**
   * Render a code entity analysis visualization
   * @param {Object} tabInfo - Information about the tab
   * @param {HTMLElement} container - The container element
   */
  renderCodeEntityAnalysis(tabInfo, container) {
    try {
      // Placeholder for code entity analysis visualization
      container.innerHTML = `<div class="visualization-placeholder">
        <h3>Code Entity Analysis</h3>
        <p>This is a placeholder for the code entity analysis visualization.</p>
        <p>In a real implementation, this would render an analysis of code entities and their relationships.</p>
      </div>`;

      // Store the visualization instance
      tabInfo.visualization = { type: 'code-entity-analysis' };

      // Add resize handler
      this.setupResizeHandler(tabInfo, container);
    } catch (error) {
      console.error('Error rendering code entity analysis:', error);
      container.innerHTML = `<div class="error-message">Error rendering code entity analysis: ${error.message}</div>`;
    }
  }

  /**
   * Set up a resize handler for a visualization
   * @param {Object} tabInfo - Information about the tab
   * @param {HTMLElement} container - The container element
   */
  setupResizeHandler(tabInfo, container) {
    // Create a resize observer to handle container size changes
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;

        // Resize the visualization if it has a resize method
        if (tabInfo.visualization && typeof tabInfo.visualization.resize === 'function') {
          tabInfo.visualization.resize(width, height);
        }
      }
    });

    // Start observing the container
    resizeObserver.observe(container);

    // Store the observer for cleanup
    tabInfo.resizeObserver = resizeObserver;
  }

  /**
   * Handle tab close event
   * @param {string} tabId - The ID of the tab being closed
   */
  handleTabClose(tabId) {
    const tabInfo = this.tabs.get(tabId);
    if (!tabInfo) return;

    // Clean up resources
    if (tabInfo.resizeObserver) {
      tabInfo.resizeObserver.disconnect();
    }

    // Remove the tab from our map
    this.tabs.delete(tabId);

    // Persist tabs if enabled
    if (this.options.persistTabs) {
      this.persistTabs();
    }
  }

  /**
   * Get the default title for a visualization type
   * @param {string} visualizationType - The type of visualization
   * @returns {string} - The default title
   */
  getDefaultTitleForVisualization(visualizationType) {
    switch (visualizationType) {
      case 'component-graph':
        return 'Component Graph';
      case 'state-flow':
        return 'State Flow Diagram';
      case 'dependency-heatmap':
        return 'Dependency Heatmap';
      case 'code-entity-analysis':
        return 'Code Entity Analysis';
      default:
        return this.options.defaultTabTitle;
    }
  }

  /**
   * Persist tabs to localStorage
   */
  persistTabs() {
    try {
      // Convert tabs map to array for storage
      const tabsArray = Array.from(this.tabs.entries()).map(([id, tabInfo]) => ({
        id,
        type: tabInfo.type,
        title: tabInfo.title,
        data: tabInfo.data,
        options: tabInfo.options
      }));

      // Store in localStorage
      localStorage.setItem('codeAnalyzerTabs', JSON.stringify(tabsArray));
      localStorage.setItem('codeAnalyzerActiveTab', this.activeTabId);
    } catch (error) {
      console.error('Error persisting tabs:', error);
    }
  }

  /**
   * Load persisted tabs from localStorage
   */
  loadPersistedTabs() {
    try {
      // Get tabs from localStorage
      const tabsJson = localStorage.getItem('codeAnalyzerTabs');
      if (!tabsJson) return;

      const tabsArray = JSON.parse(tabsJson);
      const activeTabId = localStorage.getItem('codeAnalyzerActiveTab');

      // Recreate tabs
      tabsArray.forEach(tabInfo => {
        this.createVisualizationTab(
          tabInfo.type,
          tabInfo.data,
          tabInfo.options,
          tabInfo.title
        );
      });

      // Activate the previously active tab
      if (activeTabId && this.tabs.has(activeTabId)) {
        this.tabSystem.activateTab(activeTabId);
        this.activeTabId = activeTabId;
      }
    } catch (error) {
      console.error('Error loading persisted tabs:', error);
    }
  }

  /**
   * Update the data for a visualization in a tab
   * @param {string} tabId - The ID of the tab
   * @param {Object} newData - The new data for the visualization
   */
  updateVisualizationData(tabId, newData) {
    const tabInfo = this.tabs.get(tabId);
    if (!tabInfo) {
      console.error(`Tab with ID ${tabId} not found`);
      return;
    }

    // Update the data
    tabInfo.data = newData;

    // Update the visualization if it has an updateData method
    if (tabInfo.visualization && typeof tabInfo.visualization.updateData === 'function') {
      tabInfo.visualization.updateData(newData);
    } else {
      // Re-render the visualization
      this.renderVisualization(tabId);
    }

    // Persist tabs if enabled
    if (this.options.persistTabs) {
      this.persistTabs();
    }
  }

  /**
   * Get all tabs
   * @returns {Array} - Array of tab information objects
   */
  getAllTabs() {
    return Array.from(this.tabs.values());
  }

  /**
   * Get the active tab
   * @returns {Object|null} - The active tab information or null if no active tab
   */
  getActiveTab() {
    if (!this.activeTabId) return null;
    return this.tabs.get(this.activeTabId) || null;
  }

  /**
   * Close all tabs
   */
  closeAllTabs() {
    // Get all tab IDs
    const tabIds = Array.from(this.tabs.keys());

    // Close each tab
    tabIds.forEach(tabId => {
      this.tabSystem.closeTab(tabId);
    });

    // Clear our internal state
    this.tabs.clear();
    this.activeTabId = null;

    // Clear persisted tabs
    if (this.options.persistTabs) {
      localStorage.removeItem('codeAnalyzerTabs');
      localStorage.removeItem('codeAnalyzerActiveTab');
    }
  }
}

// Export the module
export default {
  createTabIntegration,
  TabIntegration
};
