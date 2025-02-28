"""
Calculation streaming module for the CFA price optimization process.
This module provides Flask routes for streaming real-time price optimization updates.
"""

import os
import json
import time
import threading
import logging
from datetime import datetime
from flask import Flask, Response, jsonify, request
from flask_cors import CORS

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler("calculation_streaming.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("calculation_streaming")

# Global dictionary to store active monitoring threads
active_monitors = {}

class PriceOptimizationMonitor:
    """
    Class to monitor price optimization status files and emit SSE events.
    """
    def __init__(self, version):
        """Initialize the monitor for a specific version."""
        self.version = version
        self.status_file_path = self._get_status_file_path()
        self.running = False
        self.clients = []
        self.last_data = None
        self.last_modified_time = 0
        logger.info(f"Initialized monitor for version {version}, status file: {self.status_file_path}")
    
    def _get_status_file_path(self):
        """Get the path to the status file for this version."""
        # Construct path to the status file
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        results_folder = os.path.join(
            base_path, "backend", "Original", 
            f"Batch({self.version})", f"Results({self.version})"
        )
        return os.path.join(results_folder, f"price_optimization_status_{self.version}.json")
    
    def _get_fallback_price_file(self):
        """Get the path to the optimal price file as a fallback."""
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        results_folder = os.path.join(
            base_path, "backend", "Original", 
            f"Batch({self.version})", f"Results({self.version})"
        )
        return os.path.join(results_folder, f"optimal_price_{self.version}.json")
    
    def add_client(self, client_queue):
        """Add a client to the monitor."""
        self.clients.append(client_queue)
        logger.info(f"Client added to monitor for version {self.version}. Total clients: {len(self.clients)}")
        
        # If we already have data, send it to the new client immediately
        if self.last_data:
            client_queue.put(self.last_data)
        
        # Start the monitoring thread if not already running
        if not self.running:
            self.start()
    
    def remove_client(self, client_queue):
        """Remove a client from the monitor."""
        if client_queue in self.clients:
            self.clients.remove(client_queue)
            logger.info(f"Client removed from monitor for version {self.version}. Remaining clients: {len(self.clients)}")
        
        # Stop the monitoring thread if no clients remain
        if not self.clients and self.running:
            self.stop()
    
    def start(self):
        """Start the monitoring thread."""
        self.running = True
        thread = threading.Thread(target=self._monitor_loop)
        thread.daemon = True
        thread.start()
        logger.info(f"Monitoring thread started for version {self.version}")
    
    def stop(self):
        """Stop the monitoring thread."""
        self.running = False
        logger.info(f"Monitoring stopped for version {self.version}")
        
        # Remove this monitor from the global active monitors
        if self.version in active_monitors:
            del active_monitors[self.version]
    
    def _monitor_loop(self):
        """Main monitoring loop to check for file changes and notify clients."""
        check_interval = 0.5  # Check every half second
        consecutive_errors = 0
        max_errors = 20  # Stop monitoring after this many consecutive errors
        
        while self.running and consecutive_errors < max_errors:
            try:
                # Check if the status file exists
                if os.path.exists(self.status_file_path):
                    # Get the last modified time
                    current_modified_time = os.path.getmtime(self.status_file_path)
                    
                    # If the file has been modified since our last check
                    if current_modified_time > self.last_modified_time:
                        self.last_modified_time = current_modified_time
                        
                        # Read the file and parse the JSON
                        with open(self.status_file_path, 'r') as f:
                            status_data = json.load(f)
                        
                        # Prepare the event data
                        event_data = {
                            'version': self.version,
                            'price': status_data.get('current_price'),
                            'npv': status_data.get('current_npv'),
                            'iteration': status_data.get('iteration', 0),
                            'complete': status_data.get('complete', False),
                            'success': status_data.get('success', False),
                            'error': status_data.get('error'),
                            'timestamp': datetime.now().isoformat()
                        }
                        
                        # Store the last data for new clients
                        self.last_data = event_data
                        
                        # Notify all clients
                        for client in list(self.clients):
                            try:
                                client.put(event_data)
                            except Exception as e:
                                logger.error(f"Error sending to client: {str(e)}")
                                self.clients.remove(client)
                        
                        # If calculation is complete, send one more message then stop
                        if status_data.get('complete', False):
                            logger.info(f"Calculation complete for version {self.version}")
                            time.sleep(1)  # Give clients time to process the last message
                            for client in list(self.clients):
                                try:
                                    client.put({
                                        'version': self.version,
                                        'complete': True,
                                        'message': "Calculation complete",
                                        'timestamp': datetime.now().isoformat()
                                    })
                                except Exception:
                                    pass
                            # Stop monitoring
                            self.stop()
                            break
                        
                        consecutive_errors = 0
                    
                # If status file doesn't exist, check for optimal price file
                elif os.path.exists(self._get_fallback_price_file()):
                    try:
                        with open(self._get_fallback_price_file(), 'r') as f:
                            price_data = json.load(f)
                        
                        # Prepare the event data
                        event_data = {
                            'version': self.version,
                            'price': price_data.get('price'),
                            'npv': price_data.get('npv'),
                            'complete': True,
                            'success': True,
                            'message': "Calculation was completed previously",
                            'timestamp': datetime.now().isoformat()
                        }
                        
                        # Store the last data for new clients
                        self.last_data = event_data
                        
                        # Notify all clients
                        for client in list(self.clients):
                            try:
                                client.put(event_data)
                            except Exception:
                                self.clients.remove(client)
                        
                        # Stop monitoring
                        logger.info(f"Found optimal price file for version {self.version}")
                        self.stop()
                        break
                        
                    except Exception as e:
                        logger.error(f"Error reading optimal price file: {str(e)}")
                        consecutive_errors += 1
                
                else:
                    # Neither file exists yet
                    consecutive_errors += 1
                    if consecutive_errors % 5 == 0:  # Log every 5th error
                        logger.warning(f"Status file not found for version {self.version}, consecutive errors: {consecutive_errors}")
                
            except Exception as e:
                logger.error(f"Error in monitoring loop for version {self.version}: {str(e)}")
                consecutive_errors += 1
            
            # Sleep before next check
            time.sleep(check_interval)
        
        if consecutive_errors >= max_errors:
            logger.error(f"Too many consecutive errors for version {self.version}, stopping monitor")
            # Notify clients of the error
            for client in self.clients:
                try:
                    client.put({
                        'version': self.version,
                        'error': "Monitoring stopped due to too many errors",
                        'complete': True,
                        'timestamp': datetime.now().isoformat()
                    })
                except Exception:
                    pass
            self.stop()

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    CORS(app)
    
    @app.route('/price/<version>', methods=['GET'])
    def get_price(version):
        """API endpoint to get the latest calculated price for a version."""
        try:
            version = str(version)
            base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            results_folder = os.path.join(
                base_path, "backend", "Original", 
                f"Batch({version})", f"Results({version})"
            )
            
            # Try to read from the optimal price file first
            price_file_path = os.path.join(results_folder, f"optimal_price_{version}.json")
            if os.path.exists(price_file_path):
                with open(price_file_path, 'r') as f:
                    price_data = json.load(f)
                return jsonify({'price': price_data.get('price'), 'npv': price_data.get('npv')})
            
            # If that doesn't exist, check the status file
            status_file_path = os.path.join(results_folder, f"price_optimization_status_{version}.json")
            if os.path.exists(status_file_path):
                with open(status_file_path, 'r') as f:
                    status_data = json.load(f)
                return jsonify({'price': status_data.get('current_price'), 'npv': status_data.get('current_npv')})
            
            # If neither file exists, return an error
            return jsonify({'error': 'Price data not found'}), 404
            
        except Exception as e:
            logger.error(f"Error getting price for version {version}: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/stream_price/<version>', methods=['GET'])
    def stream_price(version):
        """SSE endpoint to stream real-time price optimization updates."""
        version = str(version)
        
        def generate():
            """Generator function for the SSE stream."""
            # Create a queue for this client
            client_queue = queue.Queue()
            
            # Get or create a monitor for this version
            if version not in active_monitors:
                active_monitors[version] = PriceOptimizationMonitor(version)
            
            # Add this client to the monitor
            active_monitors[version].add_client(client_queue)
            
            try:
                while True:
                    # Wait for data from the monitor
                    try:
                        data = client_queue.get(timeout=30)  # 30 second timeout
                        yield f"data: {json.dumps(data)}\n\n"
                        
                        # If calculation is complete, end the stream
                        if data.get('complete', False):
                            break
                    except queue.Empty:
                        # Send a heartbeat after timeout
                        yield f"data: {json.dumps({'heartbeat': True, 'timestamp': datetime.now().isoformat()})}\n\n"
            except GeneratorExit:
                # Client disconnected
                pass
            finally:
                # Remove this client from the monitor
                if version in active_monitors:
                    active_monitors[version].remove_client(client_queue)
        
        return Response(generate(), mimetype='text/event-stream')
    
    @app.route('/run', methods=['POST'])
    def run_calculation():
        """API endpoint to run the price optimization calculation."""
        try:
            data = request.json
            versions = data.get('selectedVersions', [])
            selected_v = data.get('selectedV', {})
            selected_f = data.get('selectedF', {})
            calculation_option = data.get('selectedCalculationOption')
            target_row = data.get('targetRow')
            optimization_params = data.get('optimizationParams', {})
            
            # Validate required parameters
            if not versions:
                return jsonify({'error': 'No versions specified'}), 400
            
            # Start the calculation process (this should be implemented based on your backend structure)
            # Example implementation:
            for version in versions:
                # Create a thread for each version to run the calculation
                thread = threading.Thread(
                    target=run_version_calculation,
                    args=(version, selected_v, selected_f, calculation_option, target_row, optimization_params)
                )
                thread.daemon = True
                thread.start()
            
            return jsonify({'status': 'success', 'message': 'Calculation started'})
            
        except Exception as e:
            logger.error(f"Error starting calculation: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    return app

def run_version_calculation(version, selected_v, selected_f, calculation_option, target_row, optimization_params):
    """
    Run the calculation for a specific version.
    This function should be implemented to call your existing calculation code.
    """
    try:
        # Import your calculation module
        import sys
        import os
        
        # Add the path to the calculation module
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sys.path.append(os.path.join(base_path, "backend"))
        
        # Import the calculation module
        from update_config_modules_with_CFA_7 import main as run_cfa
        
        # Get version-specific optimization parameters or use global
        version_str = str(version)
        params = optimization_params.get(version_str, optimization_params.get('global', {}))
        
        tolerance_lower = params.get('toleranceLower', -1000)
        tolerance_upper = params.get('toleranceUpper', 1000)
        increase_rate = params.get('increaseRate', 1.02)
        decrease_rate = params.get('decreaseRate', 0.985)
        
        logger.info(f"Starting calculation for version {version}")
        logger.info(f"Parameters: target_row={target_row}, calculation_option={calculation_option}")
        logger.info(f"Optimization params: tolerance={tolerance_lower}/{tolerance_upper}, rates={increase_rate}/{decrease_rate}")
        
        # Run the calculation
        run_cfa(
            version=version_str,
            selected_v=selected_v,
            selected_f=selected_f,
            target_row=int(target_row) if target_row else None,
            tolerance_lower=tolerance_lower,
            tolerance_upper=tolerance_upper,
            increase_rate=increase_rate,
            decrease_rate=decrease_rate,
            selected_calculation_option=calculation_option
        )
        
        logger.info(f"Calculation completed for version {version}")
        
    except Exception as e:
        logger.error(f"Error running calculation for version {version}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())

if __name__ == '__main__':
    import queue
    app = create_app()
    app.run(host='0.0.0.0', port=5007, threaded=True)