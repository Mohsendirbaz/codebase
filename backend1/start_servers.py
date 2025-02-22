import subprocess
import os

def free_port(port):
    try:
        result = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True, universal_newlines=True)
        if result:
            for line in result.splitlines():
                if f":{port}" in line:
                    pid = int(line.strip().split()[-1])
                    try:
                        subprocess.run(f"taskkill /PID {pid} /F", shell=True, check=True)
                        print(f"Terminated process {pid} using port {port}")
                    except subprocess.CalledProcessError:
                        print(f"Failed to terminate process {pid}. It may have already been terminated.")
    except subprocess.CalledProcessError:
        print(f"No process found using port {port}.")

# Base directory where your Flask apps are located
flask_base_dir = r"C:\Users\Mohse\OneDrive\Documents\GitHub\TeaSpace\backend"

# List of Flask apps to run with their respective ports
flask_apps = [
    ("Front_Subtab_Table.py", 8007),
    ("Front_Subtab_Plot.py", 8008),
    ("Front_Subtab_HTML.py", 8009),
    ("Create_new_batch.py", 8001),
    ("Remove_batch.py ", 7001),
    ("Calculations.py",5007),
    ("PNG.py",5008),
    ("Sub.py", 5009),
   ]

# Base directory where your Node.js scripts are located
node_base_dir = r"C:\Users\Mohse\OneDrive\Documents\GitHub\TeaSpace"

# List of Node.js scripts to run with their respective ports
node_scripts = [
    ("submit_parameter_append.js", 3040),
    ("submitCompleteSet.js", 3052),
  
]

def start_flask_apps():
    flask_processes = []
    for app, port in flask_apps:
        app_path = os.path.join(flask_base_dir, app)
        try:
            process = subprocess.Popen(["python", app_path, "--port", str(port)])
            flask_processes.append(process)
            print(f"Started Flask app '{app}' on port {port}.")
        except Exception as e:
            print(f"Failed to start Flask app '{app}' on port {port}. Error: {e}")
    return flask_processes

def start_node_scripts():
    node_processes = []
    for script, port in node_scripts:
        script_path = os.path.join(node_base_dir, script)
        try:
            process = subprocess.Popen(["node", script_path, "--port", str(port)])
            node_processes.append(process)
            print(f"Started Node.js script '{script}' on port {port}.")
        except Exception as e:
            print(f"Failed to start Node.js script '{script}' on port {port}. Error: {e}")
    return node_processes

if __name__ == "__main__":
    print("Starting servers...")
    
    # Start Flask apps and Node.js scripts
    flask_processes = start_flask_apps()
    node_processes = start_node_scripts()
    
    print("Servers started successfully. Press Ctrl+C to stop.")
    
    try:
        for process in flask_processes + node_processes:
            process.wait()
    except KeyboardInterrupt:
        print("\nTermination signal received. Stopping servers...")
        for process in flask_processes + node_processes:
            process.terminate()
        
        print("Servers terminated. Freeing up ports...")
        
        # Free the ports used by Flask and Node.js processes
        for _, port in flask_apps:
            free_port(port)
        for _, port in node_scripts:
            free_port(port)
        
        print("All ports freed. Exiting.")
