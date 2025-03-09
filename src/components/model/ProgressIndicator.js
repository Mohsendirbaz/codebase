import React from 'react';
import PropTypes from 'prop-types';
import './neumorphic-progress.css';

const formatTimeRemaining = (seconds) => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const getProgressClass = (percentage) => {
  const roundedProgress = Math.round(percentage / 10) * 10;
  return `progress-bar progress-bar-${roundedProgress}`;
};

const ProgressIndicator = ({
  progress,
  onCancel,
  className = ''
}) => {
  const {
    progress: percentage,
    step,
    total_steps,
    status,
    time_remaining,
    has_errors,
    latest_results
  } = progress;

  const statusColor = has_errors ? 'error' : 
    status === 'complete' ? 'success' : 
    status === 'running' ? 'running' : 'pending';

  return (
    <div className={`progress-indicator ${className} ${statusColor}`}>
      <div className="progress-header">
        <div className="progress-title">
          <span className="status-dot"></span>
          <span className="status-text">{status}</span>
        </div>
        {onCancel && status !== 'complete' && (
          <button 
            className="cancel-button"
            onClick={onCancel}
            aria-label="Cancel analysis"
          >
            ✕
          </button>
        )}
      </div>

      <div className="progress-bar-container">
        <div className={getProgressClass(percentage)}>
          <div className="progress-glow"></div>
        </div>
        <span className="progress-percentage">{Math.round(percentage)}%</span>
      </div>

      <div className="progress-details">
        <div className="progress-step">
          Step {step} of {total_steps}
        </div>
        {time_remaining !== null && (
          <div className="time-remaining">
            {formatTimeRemaining(time_remaining)} remaining
          </div>
        )}
      </div>

      {latest_results && (
        <div className="latest-results">
          <h4>Latest Results</h4>
          <div className="results-content">
            {Object.entries(latest_results).map(([key, value]) => (
              <div key={key} className="result-item">
                <span className="result-key">{key}:</span>
                <span className="result-value">
                  {typeof value === 'number' ? value.toFixed(4) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {has_errors && (
        <div className="error-indicator">
          <span className="error-icon">⚠️</span>
          <span className="error-text">Errors detected during analysis</span>
        </div>
      )}
    </div>
  );
};

ProgressIndicator.propTypes = {
  progress: PropTypes.shape({
    progress: PropTypes.number.isRequired,
    step: PropTypes.number.isRequired,
    total_steps: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    time_remaining: PropTypes.number,
    has_errors: PropTypes.bool.isRequired,
    latest_results: PropTypes.object
  }).isRequired,
  onCancel: PropTypes.func,
  className: PropTypes.string
};

export default ProgressIndicator;
