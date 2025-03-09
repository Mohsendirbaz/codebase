import { useEffect, useRef, useCallback, useState } from 'react';
const { v4: uuidv4 } = require('uuid');

/**
 * @typedef {Object} WebSocketMessage
 * @property {string} type - Message type
 * @property {*} data - Message data
 * @property {string} timestamp - Message timestamp
 */

/**
 * @typedef {Object} AnalysisProgress
 * @property {number} progress - Progress percentage
 * @property {number} step - Current step
 * @property {number} total_steps - Total steps
 * @property {string} status - Current status
 * @property {number|null} time_remaining - Estimated time remaining
 * @property {boolean} has_errors - Whether errors occurred
 * @property {*} latest_results - Latest analysis results
 */

/**
 * @typedef {Object} WebSocketHook
 * @property {boolean} connected - Connection status
 * @property {function(string, *, number=): string} startAnalysis - Start analysis function
 * @property {function(string): void} cancelAnalysis - Cancel analysis function
 * @property {Object.<string, AnalysisProgress>} progress - Analysis progress by ID
 * @property {Error|null} error - Connection error if any
 */

const WS_URL = 'ws://localhost:5000/realtime';
const RECONNECT_DELAY = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * WebSocket hook for real-time analysis
 * @returns {WebSocketHook}
 */
export const useWebSocket = () => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({});
  
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef();

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        wsRef.current = null;

        // Attempt to reconnect if not at max attempts
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, RECONNECT_DELAY);
        } else {
          setError(new Error('Maximum reconnection attempts reached'));
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError(new Error('WebSocket connection error'));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setError(err);
    }
  }, []);

  const handleMessage = useCallback((message) => {
    switch (message.type) {
      case 'progress_update':
        setProgress(prev => ({
          ...prev,
          [message.data.analysis_id]: message.data
        }));
        break;

      case 'analysis_complete':
        setProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[message.data.analysis_id];
          return newProgress;
        });
        break;

      case 'error':
        setError(new Error(message.data.message));
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }, []);

  const startAnalysis = useCallback((type, parameters, totalSteps = 100) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const analysisId = uuidv4();
    wsRef.current.send(JSON.stringify({
      type: 'start_analysis',
      data: {
        analysis_id: analysisId,
        type,
        parameters,
        total_steps: totalSteps
      }
    }));

    setProgress(prev => ({
      ...prev,
      [analysisId]: {
        progress: 0,
        step: 0,
        total_steps: totalSteps,
        status: 'starting',
        time_remaining: null,
        has_errors: false,
        latest_results: null
      }
    }));

    return analysisId;
  }, []);

  const cancelAnalysis = useCallback((analysisId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    wsRef.current.send(JSON.stringify({
      type: 'cancel_analysis',
      data: { analysis_id: analysisId }
    }));

    setProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[analysisId];
      return newProgress;
    });
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);

  return {
    connected,
    startAnalysis,
    cancelAnalysis,
    progress,
    error
  };
};

// Example usage:
/*
const MyComponent = () => {
  const { connected, startAnalysis, cancelAnalysis, progress, error } = useWebSocket();

  const handleStartAnalysis = () => {
    try {
      const analysisId = startAnalysis('sensitivity', {
        parameters: [...],
        constraints: {...}
      });
      
      // Store analysisId if needed for cancellation
    } catch (err) {
      console.error('Failed to start analysis:', err);
    }
  };

  // Monitor progress
  useEffect(() => {
    Object.entries(progress).forEach(([analysisId, data]) => {
      console.log(`Analysis ${analysisId}: ${data.progress}% complete`);
      if (data.latest_results) {
        // Handle intermediate results
      }
    });
  }, [progress]);

  return (
    <div>
      {!connected && <div>Connecting to analysis server...</div>}
      {error && <div>Error: {error.message}</div>}
      <button onClick={handleStartAnalysis}>Start Analysis</button>
      {Object.entries(progress).map(([id, data]) => (
        <div key={id}>
          Analysis {id}: {data.progress}%
          <button onClick={() => cancelAnalysis(id)}>Cancel</button>
        </div>
      ))}
    </div>
  );
};
*/
