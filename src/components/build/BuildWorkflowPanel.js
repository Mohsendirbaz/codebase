import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faSpinner,
  faExclamationTriangle,
  faTimes,
  faCog,
  faPlay,
  faFastForward,
  faVial,
  faRocket,
  faChevronRight,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import './BuildWorkflowPanel.css';

/**
 * BuildWorkflowPanel Component
 * 
 * A sidebar panel that provides build workflow options and status information
 * to be integrated next to file edit views.
 * 
 * @param {Object} props - Component props
 * @param {string} props.context - The context in which the panel is being used (e.g., 'fileEditor')
 * @param {Object} props.file - The current file being edited
 * @param {Function} props.onBuild - Callback function when build is triggered
 * @param {Function} props.onTest - Callback function when test is triggered
 * @param {Function} props.onDeploy - Callback function when deploy is triggered
 */
const BuildWorkflowPanel = ({ 
  context = 'fileEditor', 
  file = null, 
  onBuild = () => {}, 
  onTest = () => {}, 
  onDeploy = () => {} 
}) => {
  // State for build status
  const [buildStatus, setBuildStatus] = useState('idle'); // idle, building, success, failed, warning
  const [buildTime, setBuildTime] = useState(null);
  const [buildLogs, setBuildLogs] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState('actions');
  const [buildConfig, setBuildConfig] = useState({
    environment: 'development',
    minify: true,
    sourceMaps: true,
    analyze: false
  });

  // Mock build process
  const triggerBuild = (type = 'full') => {
    setBuildStatus('building');
    setBuildLogs(prev => [...prev, `Starting ${type} build at ${new Date().toLocaleTimeString()}`]);
    
    // Simulate build process
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate for demo
      
      if (success) {
        setBuildStatus('success');
        setBuildLogs(prev => [...prev, `Build completed successfully at ${new Date().toLocaleTimeString()}`]);
        setBuildTime(`${Math.floor(Math.random() * 10) + 2}s`);
      } else {
        setBuildStatus('failed');
        setBuildLogs(prev => [...prev, `Build failed at ${new Date().toLocaleTimeString()}`]);
      }
      
      // Call the callback
      onBuild({ status: success ? 'success' : 'failed', type });
    }, 3000);
  };

  // Mock test process
  const triggerTest = () => {
    setBuildStatus('building');
    setBuildLogs(prev => [...prev, `Running tests at ${new Date().toLocaleTimeString()}`]);
    
    // Simulate test process
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate for demo
      
      if (success) {
        setBuildStatus('success');
        setBuildLogs(prev => [...prev, `Tests passed at ${new Date().toLocaleTimeString()}`]);
      } else {
        setBuildStatus('warning');
        setBuildLogs(prev => [...prev, `Some tests failed at ${new Date().toLocaleTimeString()}`]);
      }
      
      // Call the callback
      onTest({ status: success ? 'success' : 'warning' });
    }, 2000);
  };

  // Mock deploy process
  const triggerDeploy = () => {
    setBuildStatus('building');
    setBuildLogs(prev => [...prev, `Starting deployment at ${new Date().toLocaleTimeString()}`]);
    
    // Simulate deploy process
    setTimeout(() => {
      const success = Math.random() > 0.15; // 85% success rate for demo
      
      if (success) {
        setBuildStatus('success');
        setBuildLogs(prev => [...prev, `Deployment completed successfully at ${new Date().toLocaleTimeString()}`]);
      } else {
        setBuildStatus('failed');
        setBuildLogs(prev => [...prev, `Deployment failed at ${new Date().toLocaleTimeString()}`]);
      }
      
      // Call the callback
      onDeploy({ status: success ? 'success' : 'failed' });
    }, 4000);
  };

  // Handle build configuration changes
  const handleConfigChange = (key, value) => {
    setBuildConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Status icon mapping
  const statusIcons = {
    idle: null,
    building: <FontAwesomeIcon icon={faSpinner} spin />,
    success: <FontAwesomeIcon icon={faCheck} className="status-success" />,
    warning: <FontAwesomeIcon icon={faExclamationTriangle} className="status-warning" />,
    failed: <FontAwesomeIcon icon={faTimes} className="status-error" />
  };

  // Status text mapping
  const statusText = {
    idle: 'Ready',
    building: 'Building...',
    success: 'Build Successful',
    warning: 'Build Completed with Warnings',
    failed: 'Build Failed'
  };

  return (
    <div className={`build-workflow-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Header */}
      <div className="build-panel-header">
        <div className="build-panel-title">
          <FontAwesomeIcon icon={faCog} className="build-icon" />
          <span>Build Workflow</span>
        </div>
        <button 
          className="toggle-button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
        >
          <FontAwesomeIcon icon={isExpanded ? faChevronRight : faChevronDown} />
        </button>
      </div>

      {/* Content (only visible when expanded) */}
      {isExpanded && (
        <div className="build-panel-content">
          {/* Status Section */}
          <div className="build-status-section">
            <div className="status-indicator">
              {statusIcons[buildStatus]}
              <span className={`status-text status-${buildStatus}`}>{statusText[buildStatus]}</span>
            </div>
            {buildTime && buildStatus !== 'building' && (
              <div className="build-time">
                Last build: {buildTime}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="build-panel-tabs">
            <button 
              className={`tab-button ${activeSection === 'actions' ? 'active' : ''}`}
              onClick={() => setActiveSection('actions')}
            >
              Actions
            </button>
            <button 
              className={`tab-button ${activeSection === 'config' ? 'active' : ''}`}
              onClick={() => setActiveSection('config')}
            >
              Config
            </button>
            <button 
              className={`tab-button ${activeSection === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveSection('logs')}
            >
              Logs
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Actions Tab */}
            {activeSection === 'actions' && (
              <div className="actions-section">
                <button 
                  className="action-button primary"
                  onClick={() => triggerBuild('full')}
                  disabled={buildStatus === 'building'}
                >
                  <FontAwesomeIcon icon={faPlay} />
                  <span>Build</span>
                </button>
                <button 
                  className="action-button"
                  onClick={() => triggerBuild('quick')}
                  disabled={buildStatus === 'building'}
                >
                  <FontAwesomeIcon icon={faFastForward} />
                  <span>Quick Build</span>
                </button>
                <button 
                  className="action-button"
                  onClick={triggerTest}
                  disabled={buildStatus === 'building'}
                >
                  <FontAwesomeIcon icon={faVial} />
                  <span>Test</span>
                </button>
                <button 
                  className="action-button"
                  onClick={triggerDeploy}
                  disabled={buildStatus === 'building'}
                >
                  <FontAwesomeIcon icon={faRocket} />
                  <span>Deploy</span>
                </button>
              </div>
            )}

            {/* Config Tab */}
            {activeSection === 'config' && (
              <div className="config-section">
                <div className="config-item">
                  <label htmlFor="environment">Environment:</label>
                  <select 
                    id="environment"
                    value={buildConfig.environment}
                    onChange={(e) => handleConfigChange('environment', e.target.value)}
                  >
                    <option value="development">Development</option>
                    <option value="testing">Testing</option>
                    <option value="production">Production</option>
                  </select>
                </div>
                <div className="config-item checkbox">
                  <input 
                    type="checkbox" 
                    id="minify" 
                    checked={buildConfig.minify}
                    onChange={(e) => handleConfigChange('minify', e.target.checked)}
                  />
                  <label htmlFor="minify">Minify output</label>
                </div>
                <div className="config-item checkbox">
                  <input 
                    type="checkbox" 
                    id="sourceMaps" 
                    checked={buildConfig.sourceMaps}
                    onChange={(e) => handleConfigChange('sourceMaps', e.target.checked)}
                  />
                  <label htmlFor="sourceMaps">Generate source maps</label>
                </div>
                <div className="config-item checkbox">
                  <input 
                    type="checkbox" 
                    id="analyze" 
                    checked={buildConfig.analyze}
                    onChange={(e) => handleConfigChange('analyze', e.target.checked)}
                  />
                  <label htmlFor="analyze">Bundle analysis</label>
                </div>
              </div>
            )}

            {/* Logs Tab */}
            {activeSection === 'logs' && (
              <div className="logs-section">
                {buildLogs.length === 0 ? (
                  <div className="empty-logs">No build logs available</div>
                ) : (
                  <ul className="log-list">
                    {buildLogs.map((log, index) => (
                      <li key={index} className="log-item">{log}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Current File Info (if in file editor context) */}
          {context === 'fileEditor' && file && (
            <div className="current-file-info">
              <div className="file-label">Current File:</div>
              <div className="file-name">{file.name}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BuildWorkflowPanel;