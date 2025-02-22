from flask import Response
import json
import logging
import os
import time
import subprocess

def setup_price_stream_logging():
    """Configure logging for price streaming"""
    log_directory = os.getcwd()
    price_stream_log = os.path.join(log_directory, 'price_stream.log')
    
    # Create logger
    logger = logging.getLogger('price_stream')
    logger.setLevel(logging.DEBUG)
    
    # Create file handler
    handler = logging.FileHandler(price_stream_log)
    handler.setLevel(logging.DEBUG)
    
    # Create formatter
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    
    # Add handler to logger
    logger.addHandler(handler)
    
    return logger

def parse_price_from_log(line):
    """Parse price information from log lines"""
    try:
        if "'primary_result'" in line and "'secondary_result'" in line:
            # Extract data between single quotes
            parts = line.split("'primary_result': ")[1].split(",'secondary_result': ")
            if len(parts) >= 1:
                try:
                    npv = float(parts[0].strip())
                    return npv
                except ValueError:
                    return None
    except Exception as e:
        logging.error(f"Error parsing price from log: {e}")
        return None
    return None

def stream_price(version):
    """Stream price calculations from the price optimization log"""
    logger = setup_price_stream_logging()
    log_file = os.path.join(os.getcwd(), 'price_optimization.log')
    
    try:
        logger.info(f"Starting price stream for version {version}")
        
        # Initialize variables for tracking the last position in the log file
        last_position = 0
        last_price = None
        consecutive_same_price = 0
        max_consecutive_same = 3  # Maximum number of times to send the same price
        
        while True:
            try:
                with open(log_file, 'r') as f:
                    # Seek to the last known position
                    f.seek(last_position)
                    
                    # Read new lines
                    new_lines = f.readlines()
                    
                    # Update the last position
                    last_position = f.tell()
                    
                    for line in new_lines:
                        npv = parse_price_from_log(line)
                        if npv is not None:
                            if npv == last_price:
                                consecutive_same_price += 1
                            else:
                                consecutive_same_price = 0
                                
                            last_price = npv
                            
                            # Only yield if we haven't seen this price too many times
                            if consecutive_same_price < max_consecutive_same:
                                yield f"data: {json.dumps({'price': npv})}\n\n"
                                logger.info(f"Streamed price {npv} for version {version}")
                            
                            # If we've hit convergence, send a complete message and exit
                            if -1000 <= npv <= 1000:
                                yield f"data: {json.dumps({'price': npv, 'complete': True})}\n\n"
                                logger.info(f"Price convergence reached for version {version}")
                                return
                
                # Small delay to prevent excessive CPU usage
                time.sleep(0.1)
                
            except FileNotFoundError:
                logger.warning(f"Log file not found, waiting for creation: {log_file}")
                time.sleep(1)
                continue
            except Exception as e:
                logger.error(f"Error reading log file: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                return
                
    except Exception as e:
        logger.error(f"Stream price error: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

def register_price_stream_routes(app):
    """Register price streaming routes with the Flask application"""
    @app.route('/stream_price/<version>')
    def stream_price_endpoint(version):
        return Response(
            stream_price(version),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        )