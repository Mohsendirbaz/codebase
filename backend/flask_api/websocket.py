from flask_socketio import SocketIO, emit
from typing import Dict, Any, Optional
import logging
import json
from datetime import datetime

# Configure logger
logger = logging.getLogger(__name__)

# Initialize SocketIO
socketio = SocketIO(cors_allowed_origins="*")

class AnalysisProgress:
    def __init__(self, total_steps: int):
        self.total_steps = total_steps
        self.current_step = 0
        self.start_time = datetime.now()
        self.status = "running"
        self.results: Dict[str, Any] = {}
        self.errors: list = []

    def update(self, step: int, status: str, results: Optional[Dict] = None, error: Optional[str] = None):
        self.current_step = step
        self.status = status
        
        if results:
            self.results.update(results)
        
        if error:
            self.errors.append(error)
            logger.error(f"Analysis error: {error}")

        # Calculate progress percentage
        progress = (step / self.total_steps) * 100 if self.total_steps > 0 else 0
        
        # Calculate estimated time remaining
        elapsed_time = (datetime.now() - self.start_time).total_seconds()
        if progress > 0:
            estimated_total = elapsed_time * (100 / progress)
            time_remaining = max(0, estimated_total - elapsed_time)
        else:
            time_remaining = None

        return {
            "progress": progress,
            "step": step,
            "total_steps": self.total_steps,
            "status": status,
            "time_remaining": time_remaining,
            "has_errors": len(self.errors) > 0,
            "latest_results": results
        }

# Store active analyses
active_analyses: Dict[str, AnalysisProgress] = {}

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f"Client connected: {request.sid}")
    emit('connection_status', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('start_analysis')
def handle_start_analysis(data):
    """
    Handle analysis start request
    
    Expected data format:
    {
        "analysis_id": "unique_id",
        "type": "sensitivity|monte_carlo|optimization",
        "parameters": {...},
        "total_steps": 100
    }
    """
    try:
        analysis_id = data.get('analysis_id')
        if not analysis_id:
            raise ValueError("Analysis ID is required")

        total_steps = data.get('total_steps', 100)
        active_analyses[analysis_id] = AnalysisProgress(total_steps)
        
        emit('analysis_started', {
            'analysis_id': analysis_id,
            'status': 'started',
            'timestamp': datetime.now().isoformat()
        })
        
        logger.info(f"Analysis {analysis_id} started")
        
    except Exception as e:
        logger.error(f"Error starting analysis: {str(e)}")
        emit('error', {'message': str(e)})

@socketio.on('update_progress')
def handle_progress_update(data):
    """
    Handle progress updates from analysis processes
    
    Expected data format:
    {
        "analysis_id": "unique_id",
        "step": current_step,
        "status": "running|complete|error",
        "results": {...},
        "error": "error message if any"
    }
    """
    try:
        analysis_id = data.get('analysis_id')
        if not analysis_id or analysis_id not in active_analyses:
            raise ValueError("Invalid analysis ID")

        analysis = active_analyses[analysis_id]
        progress_data = analysis.update(
            step=data.get('step', analysis.current_step),
            status=data.get('status', 'running'),
            results=data.get('results'),
            error=data.get('error')
        )

        emit('progress_update', {
            'analysis_id': analysis_id,
            **progress_data
        })

        # If analysis is complete or errored, clean up
        if data.get('status') in ['complete', 'error']:
            emit('analysis_complete', {
                'analysis_id': analysis_id,
                'status': data.get('status'),
                'results': analysis.results,
                'errors': analysis.errors,
                'timestamp': datetime.now().isoformat()
            })
            del active_analyses[analysis_id]

    except Exception as e:
        logger.error(f"Error updating progress: {str(e)}")
        emit('error', {'message': str(e)})

@socketio.on('cancel_analysis')
def handle_cancel_analysis(data):
    """
    Handle analysis cancellation request
    
    Expected data format:
    {
        "analysis_id": "unique_id"
    }
    """
    try:
        analysis_id = data.get('analysis_id')
        if not analysis_id or analysis_id not in active_analyses:
            raise ValueError("Invalid analysis ID")

        analysis = active_analyses[analysis_id]
        analysis.status = "cancelled"
        
        emit('analysis_cancelled', {
            'analysis_id': analysis_id,
            'timestamp': datetime.now().isoformat()
        })
        
        del active_analyses[analysis_id]
        
        logger.info(f"Analysis {analysis_id} cancelled")
        
    except Exception as e:
        logger.error(f"Error cancelling analysis: {str(e)}")
        emit('error', {'message': str(e)})

def emit_calculation_progress(analysis_id: str, progress_data: Dict[str, Any]):
    """
    Utility function to emit calculation progress from other parts of the application
    
    Args:
        analysis_id: Unique identifier for the analysis
        progress_data: Dictionary containing progress information
    """
    try:
        if analysis_id in active_analyses:
            analysis = active_analyses[analysis_id]
            progress_update = analysis.update(
                step=progress_data.get('step', analysis.current_step),
                status=progress_data.get('status', 'running'),
                results=progress_data.get('results'),
                error=progress_data.get('error')
            )
            
            socketio.emit('progress_update', {
                'analysis_id': analysis_id,
                **progress_update
            })
            
            if progress_data.get('status') in ['complete', 'error']:
                socketio.emit('analysis_complete', {
                    'analysis_id': analysis_id,
                    'status': progress_data.get('status'),
                    'results': analysis.results,
                    'errors': analysis.errors,
                    'timestamp': datetime.now().isoformat()
                })
                del active_analyses[analysis_id]
    
    except Exception as e:
        logger.error(f"Error emitting calculation progress: {str(e)}")
        socketio.emit('error', {'message': str(e)})
