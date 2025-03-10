import io from 'socket.io-client';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000; // Start with 2 seconds
    }

    connect() {
        if (this.socket) {
            return;
        }

        this.socket = io('http://localhost:5000', {
            reconnection: true,
            reconnectionDelay: this.reconnectDelay,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: this.maxReconnectAttempts
        });

        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            this.isConnected = false;
        });

        this.socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        this.socket.on('connection_status', (data) => {
            console.log('Connection status:', data);
        });

        // Handle reconnection
        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`Reconnection attempt ${attemptNumber}`);
            this.reconnectAttempts = attemptNumber;
        });

        this.socket.on('reconnect_failed', () => {
            console.error('WebSocket reconnection failed after maximum attempts');
        });
    }

    startAnalysis(analysisId, type, parameters, totalSteps) {
        if (!this.isConnected) {
            console.error('WebSocket not connected');
            return;
        }

        this.socket.emit('start_analysis', {
            analysis_id: analysisId,
            type,
            parameters,
            total_steps: totalSteps
        });
    }

    onProgressUpdate(callback) {
        this.socket.on('progress_update', callback);
    }

    onAnalysisComplete(callback) {
        this.socket.on('analysis_complete', callback);
    }

    cancelAnalysis(analysisId) {
        if (!this.isConnected) {
            console.error('WebSocket not connected');
            return;
        }

        this.socket.emit('cancel_analysis', {
            analysis_id: analysisId
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export default websocketService;
