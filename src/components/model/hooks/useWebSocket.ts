import { useEffect, useRef, useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface AnalysisProgress {
  progress: number;
  step: number;
  total_steps: number;
  status: string;
  time_remaining: number | null;
  has_errors: boolean;
  latest_results: any;
}

export interface WebSocketHook {
  connected: boolean;
  startAnalysis: (type: string, parameters: any, totalSteps?: number) => string;
  cancelAnalysis: (analysisId: string) => void;
  progress: Record<string, AnalysisProgress>;
  error: Error | null;
}

const WS_URL = 'ws://localhost:5000/realtime';
const RECONNECT_DELAY = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;

export const useWebSocket = (): WebSocketHook => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<Record<string, AnalysisProgress>>({});
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

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
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setError(err as Error);
    }
  }, []);

  const handleMessage = useCallback((message: WebSocketMessage) => {
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

  const startAnalysis = useCallback((
    type: string,
    parameters: any,
    totalSteps: number = 100
  ): string => {
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

  const cancelAnalysis = useCallback((analysisId: string) => {
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
