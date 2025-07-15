import React, { useState, useEffect } from 'react';
import { apiCircuitBreaker, checkServiceHealth } from '../../utils/axiosConfig';
import './NetworkStatusIndicator.css';

const NetworkStatusIndicator = ({ serviceUrl = 'http://localhost:3060' }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [circuitBreakerState, setCircuitBreakerState] = useState(null);
  const [lastChecked, setLastChecked] = useState(new Date());
  const [showDetails, setShowDetails] = useState(false);

  // Check network status
  useEffect(() => {
    const checkNetwork = async () => {
      const online = navigator.onLine;
      setIsOnline(online);

      if (online) {
        // Check if our specific service is available
        const serviceHealthy = await checkServiceHealth(serviceUrl);
        setIsOnline(serviceHealthy);
      }

      // Get circuit breaker state
      const cbState = apiCircuitBreaker.getState();
      setCircuitBreakerState(cbState);
      setLastChecked(new Date());
    };

    // Initial check
    checkNetwork();

    // Set up periodic checks
    const interval = setInterval(checkNetwork, 30000); // Check every 30 seconds

    // Listen for online/offline events
    window.addEventListener('online', checkNetwork);
    window.addEventListener('offline', () => setIsOnline(false));

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', checkNetwork);
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, [serviceUrl]);

  // Check for pending feedback
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);
  useEffect(() => {
    const checkPendingFeedback = () => {
      const pending = JSON.parse(localStorage.getItem('pendingFeedback') || '[]');
      setPendingFeedbackCount(pending.length);
    };

    checkPendingFeedback();
    const interval = setInterval(checkPendingFeedback, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!isOnline) return 'red';
    if (circuitBreakerState?.state === 'OPEN') return 'orange';
    if (circuitBreakerState?.state === 'HALF_OPEN') return 'yellow';
    return 'green';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (circuitBreakerState?.state === 'OPEN') return 'Service Unavailable';
    if (circuitBreakerState?.state === 'HALF_OPEN') return 'Recovering';
    return 'Online';
  };

  const retryPendingFeedback = async () => {
    if (!isOnline) {
      alert('Cannot retry while offline');
      return;
    }

    const pending = JSON.parse(localStorage.getItem('pendingFeedback') || '[]');
    const failed = [];

    for (const feedback of pending) {
      try {
        const response = await fetch(`${serviceUrl}/api/factual-precedence/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedback)
        });

        if (!response.ok) {
          failed.push(feedback);
        }
      } catch (error) {
        failed.push(feedback);
      }
    }

    localStorage.setItem('pendingFeedback', JSON.stringify(failed));
    setPendingFeedbackCount(failed.length);
    
    if (failed.length === 0) {
      alert('All pending feedback submitted successfully!');
    } else {
      alert(`Submitted ${pending.length - failed.length} of ${pending.length} feedback items`);
    }
  };

  return (
    <div className="network-status-indicator">
      <div 
        className={`status-badge ${getStatusColor()}`}
        onClick={() => setShowDetails(!showDetails)}
        title="Click for details"
      >
        <span className="status-dot"></span>
        <span className="status-text">{getStatusText()}</span>
      </div>

      {showDetails && (
        <div className="status-details">
          <h4>Network Status Details</h4>
          <div className="detail-row">
            <span>Browser Online:</span>
            <span>{navigator.onLine ? 'Yes' : 'No'}</span>
          </div>
          <div className="detail-row">
            <span>Service Available:</span>
            <span>{isOnline ? 'Yes' : 'No'}</span>
          </div>
          {circuitBreakerState && (
            <>
              <div className="detail-row">
                <span>Circuit Breaker:</span>
                <span>{circuitBreakerState.state}</span>
              </div>
              <div className="detail-row">
                <span>Failure Count:</span>
                <span>{circuitBreakerState.failureCount}</span>
              </div>
              {circuitBreakerState.nextAttempt && (
                <div className="detail-row">
                  <span>Next Retry:</span>
                  <span>{circuitBreakerState.nextAttempt}</span>
                </div>
              )}
            </>
          )}
          <div className="detail-row">
            <span>Last Checked:</span>
            <span>{lastChecked.toLocaleTimeString()}</span>
          </div>
          {pendingFeedbackCount > 0 && (
            <div className="pending-feedback">
              <p>{pendingFeedbackCount} feedback items pending</p>
              <button onClick={retryPendingFeedback}>Retry Submission</button>
            </div>
          )}
          <div className="status-info">
            <p><strong>What this means:</strong></p>
            {!isOnline && (
              <p>The application is working offline. Data will be cached locally and synced when connection is restored.</p>
            )}
            {circuitBreakerState?.state === 'OPEN' && (
              <p>Too many failed requests. The system will automatically retry after a cooldown period.</p>
            )}
            {circuitBreakerState?.state === 'HALF_OPEN' && (
              <p>Testing connection recovery. If successful, normal operation will resume.</p>
            )}
            {isOnline && circuitBreakerState?.state === 'CLOSED' && (
              <p>Everything is working normally. Data is being fetched from the server.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkStatusIndicator;