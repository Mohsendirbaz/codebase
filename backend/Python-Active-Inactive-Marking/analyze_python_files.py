import os
import re
import json
import ast
from pathlib import Path

class PythonDependencyAnalyzer:
    def __init__(self, base_dir, entry_point="start_servers.py"):
        self.base_dir = Path(base_dir)
        self.entry_point = Path(entry_point)
        self.all_python_files = []
        self.active_files = []
        self.inactive_files = []
        self.standalone_files = []
        self.dependency_layers = {}
        self.imported_by = {}
        self.port_to_file = {}
        self.file_to_port = {}
        self.imports_map = {}
        self.subprocess_calls = {}  # Map of files that call other files via subprocess
        self.file_connections = {}  # Map of all connections between files (imports, subprocess calls, etc.)
        self.port_connected_files = {}  # Map of files connected to each port

    def find_all_python_files(self):
        """Find all Python files in the base directory and its subdirectories."""
        python_files = []
        for root, _, files in os.walk(self.base_dir):
            for file in files:
                if file.endswith('.py'):
                    file_path = Path(root) / file
                    rel_path = file_path.relative_to(self.base_dir.parent)
                    python_files.append(str(rel_path).replace('/', '\\'))

        self.all_python_files = python_files
        return python_files

    def extract_imports(self, file_path):
        """Extract imports from a Python file."""
        full_path = self.base_dir.parent / file_path
        imports = []

        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()

            try:
                tree = ast.parse(content)
                for node in ast.walk(tree):
                    # Handle regular imports
                    if isinstance(node, ast.Import):
                        for name in node.names:
                            imports.append(name.name)

                    # Handle from ... import ...
                    elif isinstance(node, ast.ImportFrom):
                        if node.module:
                            imports.append(node.module)
            except SyntaxError:
                # If AST parsing fails, use regex as fallback
                import_regex = r'^\s*(?:from\s+([.\w]+)\s+import|import\s+([.\w]+))'
                for line in content.splitlines():
                    match = re.match(import_regex, line)
                    if match:
                        module = match.group(1) or match.group(2)
                        imports.append(module)
        except Exception as e:
            print(f"Error extracting imports from {file_path}: {e}")

        return imports

    def extract_subprocess_calls(self, file_path):
        """Extract subprocess calls to other Python files."""
        full_path = self.base_dir.parent / file_path
        subprocess_calls = []

        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Look for subprocess.run, subprocess.Popen, os.system calls with python
            subprocess_patterns = [
                # subprocess.run(['python', 'path/to/script.py', ...])
                r'subprocess\.run\(\s*\[.*?[\'"]python[\'"].*?[\'"]([^\'"]+\.py)[\'"]',
                # subprocess.Popen(['python', 'path/to/script.py', ...])
                r'subprocess\.Popen\(\s*\[.*?[\'"]python[\'"].*?[\'"]([^\'"]+\.py)[\'"]',
                # os.system('python path/to/script.py ...')
                r'os\.system\(\s*[\'"]python\s+([^\'"]+\.py)',
                # Direct path references like os.path.join(..., 'script.py')
                r'os\.path\.join\(.*?[\'"]([^\'"]+\.py)[\'"]',
                # Path variables defined with os.path.join
                r'os\.path\.join\(.*?[\'"]([^\'"]+(\\|\/)[^\'"]+(\\|\/))[\'"].*?[\'"]([^\'"]+\.py)[\'"]'
            ]

            # First, extract any variable definitions that contain Python file paths
            path_variables = {}
            path_var_pattern = r'(\w+)\s*=\s*.*?[\'"]([^\'"]+\.py)[\'"]'
            path_var_matches = re.findall(path_var_pattern, content, re.DOTALL)
            for var_name, path in path_var_matches:
                path_variables[var_name] = path.replace('/', '\\')

            # Also look for lists/arrays of Python file paths
            path_list_pattern = r'(\w+)\s*=\s*\[(.*?)\]'
            path_list_matches = re.findall(path_list_pattern, content, re.DOTALL)
            for var_name, list_content in path_list_matches:
                # Extract paths from the list
                list_paths = re.findall(r'[\'"]([^\'"]+\.py)[\'"]', list_content)
                if list_paths:
                    path_variables[var_name] = [p.replace('/', '\\') for p in list_paths]

            # Also look for dictionaries with Python file paths
            path_dict_pattern = r'(\w+)\s*=\s*\{(.*?)\}'
            path_dict_matches = re.findall(path_dict_pattern, content, re.DOTALL)
            for var_name, dict_content in path_dict_matches:
                # Extract paths from the dictionary
                dict_paths = re.findall(r'[\'"]([^\'"]+\.py)[\'"]', dict_content)
                if dict_paths:
                    path_variables[var_name] = [p.replace('/', '\\') for p in dict_paths]

            # Look for script file lists like SCRIPT_FILES = ['script.py']
            script_list_pattern = r'(\w+)\s*=\s*\[(.*?)\]'
            script_list_matches = re.findall(script_list_pattern, content, re.DOTALL)
            for var_name, list_content in script_list_matches:
                # Extract script paths from the list
                script_paths = re.findall(r'[\'"]([^\'"]+\.py)[\'"]', list_content)
                if script_paths:
                    # Store the script paths in path_variables
                    path_variables[var_name] = [p.replace('/', '\\') for p in script_paths]

                    # Look for for loops that iterate over this variable
                    for_loop_pattern = r'for\s+(\w+)\s+in\s+' + re.escape(var_name) + r'(.*?)subprocess\.run\('
                    for_loop_matches = re.findall(for_loop_pattern, content, re.DOTALL)

                    if for_loop_matches:
                        # If found, add all script paths to subprocess_calls
                        for script_path in script_paths:
                            # Check if it's a relative path or just a filename
                            if '/' not in script_path and '\\' not in script_path:
                                # Try to find the file in the Visualization_generators directory
                                # This is specific to the pattern in PNG.py
                                if "PNG.py" in file_path:
                                    # Look for SCRIPT_DIR definition
                                    script_dir_pattern = r'SCRIPT_DIR\s*=.*?[\'"](.+?)[\'"]'
                                    script_dir_match = re.search(script_dir_pattern, content)
                                    if script_dir_match:
                                        script_dir = script_dir_match.group(1)
                                        if "Visualization_generators" in script_dir:
                                            # Try to find the file in the Visualization_generators directory
                                            for py_file in self.all_python_files:
                                                if "Visualization_generators" in py_file and py_file.endswith(script_path):
                                                    subprocess_calls.append(py_file)
                                                    break
                                    else:
                                        # If SCRIPT_DIR not found, try the same directory
                                        dir_name = os.path.dirname(file_path)
                                        potential_path = os.path.join(dir_name, script_path)
                                        if potential_path in self.all_python_files:
                                            subprocess_calls.append(potential_path)
                                else:
                                    # Try to find the file in the same directory
                                    dir_name = os.path.dirname(file_path)
                                    potential_path = os.path.join(dir_name, script_path)
                                    if potential_path in self.all_python_files:
                                        subprocess_calls.append(potential_path)
                            else:
                                # Check if it's a path relative to the project root
                                for py_file in self.all_python_files:
                                    if py_file.endswith(script_path) or script_path.endswith(py_file):
                                        subprocess_calls.append(py_file)
                                        break

            for pattern in subprocess_patterns:
                matches = re.findall(pattern, content, re.DOTALL)
                for match in matches:
                    # Handle different pattern matches
                    if isinstance(match, tuple):
                        # For the os.path.join pattern with directory and filename
                        if len(match) >= 4 and match[3].endswith('.py'):
                            script_path = os.path.join(match[0], match[3]).replace('/', '\\')
                        else:
                            script_path = match[0].replace('/', '\\')
                    else:
                        script_path = match.replace('/', '\\')

                    # Check if it's a relative path or just a filename
                    if '\\' not in script_path:
                        # Try to find the file in the same directory
                        dir_name = os.path.dirname(file_path)
                        potential_path = os.path.join(dir_name, script_path)
                        if potential_path in self.all_python_files:
                            subprocess_calls.append(potential_path)
                    else:
                        # Check if it's a path relative to the project root
                        for py_file in self.all_python_files:
                            if py_file.endswith(script_path) or script_path.endswith(py_file):
                                subprocess_calls.append(py_file)
                                break

                    # Look for run_script or similar function calls that might use the path variables
                    run_script_pattern = r'run_script\(\s*(\w+)'
                    run_script_matches = re.findall(run_script_pattern, content)
                    for var_name in run_script_matches:
                        if var_name in path_variables:
                            var_value = path_variables[var_name]
                            if isinstance(var_value, list):
                                # If it's a list of paths, add each one
                                for path in var_value:
                                    for py_file in self.all_python_files:
                                        if py_file.endswith(path) or path.endswith(py_file):
                                            subprocess_calls.append(py_file)
                                            break
                            else:
                                # If it's a single path
                                for py_file in self.all_python_files:
                                    if py_file.endswith(var_value) or var_value.endswith(py_file):
                                        subprocess_calls.append(py_file)
                                        break

                    # Also look for iteration over path lists that might call run_script
                    for var_name, var_value in path_variables.items():
                        if isinstance(var_value, list):
                            # Check if this variable is iterated over in a for loop
                            for_loop_pattern = r'for\s+\w+\s+in\s+' + re.escape(var_name)
                            if re.search(for_loop_pattern, content):
                                # If it is, add all paths in the list
                                for path in var_value:
                                    for py_file in self.all_python_files:
                                        if py_file.endswith(path) or path.endswith(py_file):
                                            subprocess_calls.append(py_file)
                                            break

                    # Special case for Calculations.py: Look for COMMON_PYTHON_SCRIPTS and CALCULATION_SCRIPTS
                    if "Calculations.py" in file_path:
                        # Look for specific patterns used in Calculations.py
                        common_scripts_pattern = r'COMMON_PYTHON_SCRIPTS\s*=\s*\[(.*?)\]'
                        calc_scripts_pattern = r'CALCULATION_SCRIPTS\s*=\s*\{(.*?)\}'

                        # Extract paths from COMMON_PYTHON_SCRIPTS
                        common_scripts_match = re.search(common_scripts_pattern, content, re.DOTALL)
                        if common_scripts_match:
                            common_scripts_content = common_scripts_match.group(1)
                            common_paths = re.findall(r'os\.path\.join\(.*?[\'"]([^\'"]+(\\|\/)[^\'"]+(\\|\/))[\'"].*?[\'"]([^\'"]+\.py)[\'"]', common_scripts_content)
                            for match in common_paths:
                                if len(match) >= 4:
                                    script_path = os.path.join(match[0], match[3]).replace('/', '\\')
                                    for py_file in self.all_python_files:
                                        if py_file.endswith(script_path.split('\\')[-1]):
                                            subprocess_calls.append(py_file)
                                            break

                        # Extract paths from CALCULATION_SCRIPTS
                        calc_scripts_match = re.search(calc_scripts_pattern, content, re.DOTALL)
                        if calc_scripts_match:
                            calc_scripts_content = calc_scripts_match.group(1)
                            calc_paths = re.findall(r'os\.path\.join\(.*?[\'"]([^\'"]+(\\|\/)[^\'"]+(\\|\/))[\'"].*?[\'"]([^\'"]+\.py)[\'"]', calc_scripts_content)
                            for match in calc_paths:
                                if len(match) >= 4:
                                    script_path = os.path.join(match[0], match[3]).replace('/', '\\')
                                    for py_file in self.all_python_files:
                                        if py_file.endswith(script_path.split('\\')[-1]):
                                            subprocess_calls.append(py_file)
                                            break

        except Exception as e:
            print(f"Error extracting subprocess calls from {file_path}: {e}")

        return subprocess_calls

    def extract_port_number(self, file_path):
        """Extract port number from a Flask application."""
        full_path = self.base_dir.parent / file_path
        port = None

        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Look for app.run(port=XXXX) or app.run(..., port=XXXX)
            port_regex = r'app\.run\(.*?port\s*=\s*(\d+)'
            match = re.search(port_regex, content)
            if match:
                port = int(match.group(1))
        except Exception as e:
            print(f"Error extracting port from {file_path}: {e}")

        return port

    def map_imports_to_files(self):
        """Map module imports to actual file paths."""
        # Create a mapping of module names to file paths
        module_to_file = {}
        for file_path in self.all_python_files:
            # Convert file path to potential module name
            module_path = file_path.replace('.py', '').replace('\\', '.')
            module_name = module_path.split('.')[-1]
            module_to_file[module_name] = file_path

            # Also map the full module path
            module_to_file[module_path] = file_path

        # Map imports to actual file paths
        for file_path in self.all_python_files:
            imports = self.extract_imports(file_path)
            file_imports = []

            for imp in imports:
                # Try to find the imported module in our files
                if imp in module_to_file:
                    file_imports.append(module_to_file[imp])
                else:
                    # Try to match partial module names
                    for module, path in module_to_file.items():
                        if module.endswith('.' + imp) or module == imp:
                            file_imports.append(path)
                            break

            self.imports_map[file_path] = file_imports

    def build_file_connections(self):
        """Build a comprehensive map of all connections between files."""
        # Initialize direct connections first
        # Start with import connections
        for file_path, imports in self.imports_map.items():
            if file_path not in self.file_connections:
                self.file_connections[file_path] = {
                    "imports": imports.copy(),  # Use copy to avoid modifying the original
                    "all_imports": [],  # Will hold all nested imports
                    "subprocess_calls": [],
                    "all_subprocess_calls": [],  # Will hold all nested subprocess calls
                    "connection_level": "none"  # Will be updated later
                }
            else:
                self.file_connections[file_path]["imports"] = imports.copy()

        # Add subprocess connections
        for file_path in self.all_python_files:
            subprocess_calls = self.extract_subprocess_calls(file_path)
            self.subprocess_calls[file_path] = subprocess_calls

            if file_path not in self.file_connections:
                self.file_connections[file_path] = {
                    "imports": [],
                    "all_imports": [],
                    "subprocess_calls": subprocess_calls.copy(),
                    "all_subprocess_calls": [],
                    "connection_level": "none"  # Will be updated later
                }
            else:
                self.file_connections[file_path]["subprocess_calls"] = subprocess_calls.copy()

        # Now build nested connections using depth-first search
        for file_path in self.all_python_files:
            # Skip if we've already processed this file's nested connections
            if self.file_connections[file_path].get("all_imports") or self.file_connections[file_path].get("all_subprocess_calls"):
                continue

            # Find all nested imports
            visited_imports = set()
            self._find_nested_imports(file_path, visited_imports)
            self.file_connections[file_path]["all_imports"] = list(visited_imports)

            # Find all nested subprocess calls
            visited_subprocess = set()
            self._find_nested_subprocess_calls(file_path, visited_subprocess)
            self.file_connections[file_path]["all_subprocess_calls"] = list(visited_subprocess)

        # Determine connection level for each file based on direct and nested connections
        for file_path, connections in self.file_connections.items():
            direct_imports = connections["imports"]
            direct_subprocess = connections["subprocess_calls"]
            all_imports = connections["all_imports"]
            all_subprocess = connections["all_subprocess_calls"]

            if direct_imports and direct_subprocess:
                connections["connection_level"] = "high"  # Both direct imports and subprocess calls
            elif direct_subprocess:
                connections["connection_level"] = "medium"  # Only direct subprocess calls
            elif direct_imports:
                connections["connection_level"] = "low"  # Only direct imports
            elif all_imports or all_subprocess:
                connections["connection_level"] = "indirect"  # Only nested connections
            else:
                connections["connection_level"] = "none"  # No connections

    def _find_nested_imports(self, file_path, visited, depth=0, max_depth=10):
        """Recursively find all nested imports for a file."""
        # Avoid infinite recursion
        if depth > max_depth:
            return

        # Get direct imports for this file
        direct_imports = self.file_connections[file_path]["imports"]

        for imported_file in direct_imports:
            # Skip if we've already visited this file or it's the same as the current file
            if imported_file in visited or imported_file == file_path:
                continue

            # Add to visited set
            visited.add(imported_file)

            # Recursively find nested imports
            if imported_file in self.file_connections:
                self._find_nested_imports(imported_file, visited, depth + 1, max_depth)

    def _find_nested_subprocess_calls(self, file_path, visited, depth=0, max_depth=10):
        """Recursively find all nested subprocess calls for a file."""
        # Avoid infinite recursion
        if depth > max_depth:
            return

        # Get direct subprocess calls for this file
        direct_calls = self.file_connections[file_path]["subprocess_calls"]

        for called_file in direct_calls:
            # Skip if we've already visited this file or it's the same as the current file
            if called_file in visited or called_file == file_path:
                continue

            # Add to visited set
            visited.add(called_file)

            # Recursively find nested subprocess calls
            if called_file in self.file_connections:
                self._find_nested_subprocess_calls(called_file, visited, depth + 1, max_depth)

    def build_imported_by_map(self):
        """Build a map of which files import each file."""
        for file_path, imports in self.imports_map.items():
            for imported_file in imports:
                if imported_file not in self.imported_by:
                    self.imported_by[imported_file] = []
                if file_path not in self.imported_by[imported_file]:
                    self.imported_by[imported_file].append(file_path)

    def identify_active_files(self):
        """Identify active files by traversing the dependency graph from the entry point."""
        # Start with the entry point
        active_files = [str(self.entry_point)]
        visited = set(active_files)

        # Also include files from start_servers.py's flask_apps list
        try:
            with open(self.entry_point, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract flask_apps list
            flask_apps_regex = r'flask_apps\s*=\s*\[(.*?)\]'
            match = re.search(flask_apps_regex, content, re.DOTALL)
            if match:
                flask_apps_str = match.group(1)
                # Extract file paths and ports
                app_entries = re.findall(r'\(r?"([^"]+)"\s*,\s*(\d+)\)', flask_apps_str)
                for app_path, port in app_entries:
                    app_path = app_path.replace('/', '\\')
                    if app_path not in visited:
                        active_files.append(app_path)
                        visited.add(app_path)

                    # Map port to file and file to port
                    self.port_to_file[port] = app_path
                    self.file_to_port[app_path] = int(port)

                    # Initialize port_connected_files
                    if port not in self.port_connected_files:
                        self.port_connected_files[port] = {
                            "main_file": app_path,
                            "connected_files": []
                        }
        except Exception as e:
            print(f"Error extracting flask_apps from {self.entry_point}: {e}")

        # BFS to find all active files through imports and subprocess calls
        queue = list(active_files)
        while queue:
            current_file = queue.pop(0)

            # Get imports from this file
            imports = self.imports_map.get(current_file, [])
            for imported_file in imports:
                if imported_file not in visited:
                    active_files.append(imported_file)
                    visited.add(imported_file)
                    queue.append(imported_file)

                    # Add to port_connected_files if current_file is associated with a port
                    for port, port_info in self.port_connected_files.items():
                        if port_info["main_file"] == current_file and imported_file not in port_info["connected_files"]:
                            port_info["connected_files"].append(imported_file)

            # Get subprocess calls from this file
            subprocess_calls = self.subprocess_calls.get(current_file, [])
            for called_file in subprocess_calls:
                if called_file not in visited:
                    active_files.append(called_file)
                    visited.add(called_file)
                    queue.append(called_file)

                    # Add to port_connected_files if current_file is associated with a port
                    for port, port_info in self.port_connected_files.items():
                        if port_info["main_file"] == current_file and called_file not in port_info["connected_files"]:
                            port_info["connected_files"].append(called_file)

                    # Special case for CFA.py: Check if it imports consolidated_cfa_new.py
                    if "CFA.py" in called_file:
                        try:
                            with open(self.base_dir.parent / called_file, 'r', encoding='utf-8') as f:
                                cfa_content = f.read()

                            # Look for imports of consolidated_cfa_new.py
                            if "consolidated_cfa_new" in cfa_content:
                                for py_file in self.all_python_files:
                                    if "consolidated_cfa_new.py" in py_file and py_file not in visited:
                                        active_files.append(py_file)
                                        visited.add(py_file)
                                        queue.append(py_file)

                                        # Add to port_connected_files
                                        for port, port_info in self.port_connected_files.items():
                                            if port_info["main_file"] == current_file and py_file not in port_info["connected_files"]:
                                                port_info["connected_files"].append(py_file)
                        except Exception as e:
                            print(f"Error checking CFA.py imports: {e}")

        # Special case for Calculations.py port 5007: Add all Configuration_management and Core_calculation_engines files
        for port, port_info in self.port_connected_files.items():
            if port == "5007" or port == 5007:  # Port 5007 is Calculations.py
                # Add all Configuration_management files
                for py_file in self.all_python_files:
                    if "Configuration_management" in py_file and py_file not in active_files:
                        active_files.append(py_file)
                        visited.add(py_file)
                        if py_file not in port_info["connected_files"]:
                            port_info["connected_files"].append(py_file)

                # Add all Core_calculation_engines files
                for py_file in self.all_python_files:
                    if "Core_calculation_engines" in py_file and py_file not in active_files:
                        active_files.append(py_file)
                        visited.add(py_file)
                        if py_file not in port_info["connected_files"]:
                            port_info["connected_files"].append(py_file)

        self.active_files = active_files

        # Identify inactive files
        self.inactive_files = [f for f in self.all_python_files if f not in self.active_files]

        # Identify standalone files (files that don't import any other files and aren't called by subprocess)
        self.standalone_files = [f for f in self.all_python_files 
                                if not self.imports_map.get(f) and 
                                not any(f in calls for calls in self.subprocess_calls.values())]

    def build_dependency_layers(self):
        """Build dependency layers starting from the entry point."""
        # Start with the entry point in layer 0
        self.dependency_layers = {0: [str(self.entry_point)]}
        visited = {str(self.entry_point): 0}  # file -> layer

        # BFS to build layers
        current_layer = 0
        while True:
            next_layer = current_layer + 1
            self.dependency_layers[next_layer] = []

            for file_path in self.dependency_layers[current_layer]:
                imports = self.imports_map.get(file_path, [])
                for imported_file in imports:
                    if imported_file not in visited:
                        self.dependency_layers[next_layer].append(imported_file)
                        visited[imported_file] = next_layer

            if not self.dependency_layers[next_layer]:
                del self.dependency_layers[next_layer]
                break

            current_layer = next_layer

    def extract_all_port_numbers(self):
        """Extract port numbers from all Python files."""
        for file_path in self.all_python_files:
            port = self.extract_port_number(file_path)
            if port:
                self.port_to_file[str(port)] = file_path
                self.file_to_port[file_path] = port

    def analyze(self):
        """Run the full analysis."""
        print("Finding all Python files...")
        self.find_all_python_files()

        print("Extracting imports and building dependency map...")
        self.map_imports_to_files()

        print("Building file connections map...")
        self.build_file_connections()

        print("Building imported_by map...")
        self.build_imported_by_map()

        print("Identifying active files...")
        self.identify_active_files()

        print("Building dependency layers...")
        self.build_dependency_layers()

        print("Extracting port numbers...")
        self.extract_all_port_numbers()

        return {
            "activeFiles": self.active_files,
            "inactiveFiles": self.inactive_files,
            "standaloneFiles": self.standalone_files,
            "dependencyLayers": self.dependency_layers,
            "importedBy": self.imported_by,
            "portToFile": self.port_to_file,
            "fileToPort": self.file_to_port,
            "fileConnections": self.file_connections,
            "subprocessCalls": self.subprocess_calls,
            "portConnectedFiles": self.port_connected_files
        }

    def generate_report(self, output_file="python-active-files-report.json"):
        """Generate a JSON report of the analysis."""
        report = self.analyze()

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)

        print(f"Report generated: {output_file}")
        return report

def main():
    base_dir = Path(__file__).parent.parent  # backend directory
    repo_root = base_dir.parent  # repository root

    analyzer = PythonDependencyAnalyzer(base_dir, repo_root / "start_servers.py")
    analyzer.generate_report(repo_root / "python-active-files-report.json")

if __name__ == "__main__":
    main()
