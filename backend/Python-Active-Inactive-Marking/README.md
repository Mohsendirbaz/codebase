# Python Active Files Tracker

This module helps you identify which Python files in your project are actively used (imported directly or indirectly from your entry point) and which files are inactive (not imported from the entry point). It also maps port numbers to files for Flask applications and detects even slight connections between files.

## How to Use

### Generate the Python Files Report

To generate a new `python-active-files-report.json` file:

#### Option 1: Using the Batch File

Simply run the batch file in the project root:

```
run_python_analyzer.bat
```

#### Option 2: Using Python Directly

```
cd codebase
python backend\Python-Active-Inactive-Marking\analyze_python_files.py
```

The script will:
- Find all Python files in the backend directory
- Analyze imports between files to build a dependency graph
- Detect subprocess calls and other execution mechanisms
- Identify active and inactive files with different levels of involvement
- Extract port numbers from Flask applications
- Generate a report file at `python-active-files-report.json` in your project root

### Generate the Frontend Port Groups Report

To generate a new `frontend-port-groups-report.json` file that analyzes port groups based on the frontend:

#### Option 1: Using the Batch File

Simply run the batch file in the project root:

```
run_frontend_port_analyzer.bat
```

#### Option 2: Using Python Directly

```
cd codebase
python backend\Python-Active-Inactive-Marking\analyze_frontend_ports.py
```

The script will:
- Analyze the HomePage.js file to identify API calls to backend services
- Group ports based on their functionality (sensitivity, calculation, visualization, etc.)
- Identify which ports work together in specific processes
- Combine frontend analysis with backend file connections
- Generate a report file at `frontend-port-groups-report.json` in your project root

### Understanding the Reports

#### Python Active Files Report

The `python-active-files-report.json` file contains:

- `activeFiles`: Array of files that are connected (directly or indirectly) to the entry point
- `inactiveFiles`: Array of files that are not connected to the entry point
- `standaloneFiles`: Array of files that don't import any other files and aren't called by other files
- `dependencyLayers`: Object mapping layer numbers to arrays of files in that layer
  - Layer 0 contains the entry point
  - Layer 1 contains files directly imported by the entry point
  - Layer 2 contains files imported by layer 1 files, and so on
- `importedBy`: Object mapping file paths to arrays of files that import them
- `portToFile`: Object mapping port numbers to the files that use them
- `fileToPort`: Object mapping file paths to the port numbers they use
- `fileConnections`: Object mapping file paths to their connections with other files
  - `imports`: Array of files imported by this file
  - `all_imports`: Array of all files imported directly or indirectly by this file
  - `subprocess_calls`: Array of files called via subprocess by this file
  - `all_subprocess_calls`: Array of all files called directly or indirectly via subprocess by this file
  - `connection_level`: Level of involvement ("high", "medium", "low", "indirect", or "none")
- `subprocessCalls`: Object mapping file paths to arrays of files they call via subprocess
- `portConnectedFiles`: Object mapping port numbers to information about connected files
  - `main_file`: The main file associated with this port
  - `connected_files`: Array of files connected to the main file

#### Frontend Port Groups Report

The `frontend-port-groups-report.json` file contains:

- `portGroups`: Object grouping ports by functionality
  - `sensitivity_ports`: Array of ports related to sensitivity analysis
  - `calculation_ports`: Array of ports related to calculations
  - `visualization_ports`: Array of ports related to visualization
  - `data_management_ports`: Array of ports related to data management
  - `configuration_ports`: Array of ports related to configuration
  - `other_ports`: Array of ports with other functionalities
- `portFunctionality`: Object mapping port numbers to their functionality
- `portToFile`: Object mapping port numbers to the files that use them
- `fileToPort`: Object mapping file paths to the port numbers they use
- `portConnectedFiles`: Object mapping port numbers to information about connected files
- `portDetails`: Object with detailed information about each port
  - `functionality`: The functionality category of the port
  - `main_file`: The main file associated with this port
  - `connected_files`: Array of files connected to the main file

## How It Works

The analyzer performs the following steps:

1. **Find Python Files**: Scans the backend directory for all Python files
2. **Extract Imports**: Parses each file to extract its imports
3. **Extract Subprocess Calls**: Detects when files are executed via subprocess.run, subprocess.Popen, etc.
4. **Build File Connections**: Creates a comprehensive map of all connections between files
5. **Map Imports to Files**: Maps module imports to actual file paths
6. **Build Dependency Graph**: Creates a graph of file dependencies
7. **Identify Active Files**: Traverses the dependency graph from the entry point, including subprocess calls
8. **Extract Port Numbers**: Finds port numbers in Flask applications
9. **Generate Report**: Creates a JSON report with all the collected information

## Connection Levels

Files are assigned a connection level based on how they interact with other files:

- **High**: Files that both import other files and call other files via subprocess
- **Medium**: Files that call other files via subprocess but don't import them
- **Low**: Files that only import other files
- **None**: Files with no connections to other files

## Use Cases

### Identifying Unused Files

Check the `inactiveFiles` section in the generated report to see which files are not being used.

### Understanding Project Structure

Examine the `dependencyLayers` section to understand the structure of your project.

### Finding Port Usage

Use the `portToFile`, `fileToPort`, and `portConnectedFiles` mappings to understand which ports are being used by which files and what other files are connected to each port.

### Detecting Indirect Connections

The `fileConnections` and `subprocessCalls` sections help identify files that are connected through mechanisms other than direct imports, such as subprocess calls.

## Troubleshooting

- If the analysis doesn't find any active files, check that your entry point is correctly specified
- If import statements aren't being detected, check the supported import formats in the code
- If subprocess calls aren't being detected, check the supported patterns in the code
- If port numbers aren't being detected, make sure they're specified in the format `app.run(port=XXXX)` or `app.run(..., port=XXXX)`
