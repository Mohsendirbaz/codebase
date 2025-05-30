import os
import re
import json
import ast
from pathlib import Path
from analyze_python_files import PythonDependencyAnalyzer

class FrontendPortGroupAnalyzer:
    def __init__(self, base_dir, frontend_entry_point="src/HomePage.js"):
        self.base_dir = Path(base_dir)
        self.frontend_entry_point = Path(frontend_entry_point)
        self.port_groups = {}
        self.port_to_file = {}
        self.file_to_port = {}
        self.port_connected_files = {}
        self.port_functionality = {}
        self.python_analyzer = PythonDependencyAnalyzer(
            os.path.join(base_dir, "backend"), 
            os.path.join(base_dir, "start_servers.py")
        )

    def extract_frontend_port_calls(self):
        """Extract port calls from the frontend entry point."""
        full_path = self.base_dir / self.frontend_entry_point
        port_calls = {}

        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Look for fetch calls with localhost or 127.0.0.1 URLs
            fetch_pattern = r'fetch\([\'"]http://(?:localhost|127\.0\.0\.1):(\d+)([^\'"]*)[\'"]'
            matches = re.findall(fetch_pattern, content, re.DOTALL)

            for port, endpoint in matches:
                port = port.strip()
                endpoint = endpoint.strip()

                if port not in port_calls:
                    port_calls[port] = []

                if endpoint and endpoint not in port_calls[port]:
                    port_calls[port].append(endpoint)

        except Exception as e:
            print(f"Error extracting port calls from {full_path}: {e}")

        return port_calls

    def identify_port_groups(self):
        """Identify groups of ports that work together in processes."""
        port_calls = self.extract_frontend_port_calls()

        # Get port information from the Python analyzer
        self.python_analyzer.analyze()
        self.port_to_file = self.python_analyzer.port_to_file
        self.file_to_port = self.python_analyzer.file_to_port
        self.port_connected_files = self.python_analyzer.port_connected_files

        # Group ports by functionality based on endpoint patterns
        functionality_groups = {
            "sensitivity": [],
            "calculation": [],
            "visualization": [],
            "data_management": [],
            "configuration": [],
            "other": []
        }

        # Explicitly add ports 2500, 2600, and 2751 to sensitivity group as per issue description
        sensitivity_ports = ["2500", "2600", "2751"]
        for port in sensitivity_ports:
            if port not in functionality_groups["sensitivity"]:
                functionality_groups["sensitivity"].append(port)

        for port, endpoints in port_calls.items():
            # Determine functionality based on endpoints or port ranges
            if any("sensitivity" in endpoint.lower() for endpoint in endpoints) or port in sensitivity_ports:
                if port not in functionality_groups["sensitivity"]:
                    functionality_groups["sensitivity"].append(port)
            elif any("run" in endpoint.lower() for endpoint in endpoints) or port in ["5007"]:
                functionality_groups["calculation"].append(port)
            elif any(("plot" in endpoint.lower() or "png" in endpoint.lower() or "album" in endpoint.lower()) for endpoint in endpoints) or port in ["5008", "5009", "8008", "8009"]:
                functionality_groups["visualization"].append(port)
            elif any(("batch" in endpoint.lower() or "upload" in endpoint.lower()) for endpoint in endpoints) or port in ["7001", "8001", "8007"]:
                functionality_groups["data_management"].append(port)
            elif any("config" in endpoint.lower() for endpoint in endpoints) or port in ["5000", "5002"]:
                functionality_groups["configuration"].append(port)
            else:
                functionality_groups["other"].append(port)

        # Create port groups based on functionality
        self.port_groups = {
            "sensitivity_ports": functionality_groups["sensitivity"],
            "calculation_ports": functionality_groups["calculation"],
            "visualization_ports": functionality_groups["visualization"],
            "data_management_ports": functionality_groups["data_management"],
            "configuration_ports": functionality_groups["configuration"],
            "other_ports": functionality_groups["other"]
        }

        # Map ports to their functionality
        self.port_functionality = {}
        for functionality, ports in functionality_groups.items():
            for port in ports:
                self.port_functionality[port] = functionality

        return self.port_groups

    def generate_report(self, output_file="frontend-port-groups-report.json"):
        """Generate a JSON report of the port groups analysis."""
        # First run the Python analyzer to get port information
        self.python_analyzer.analyze()

        # Then identify port groups
        self.identify_port_groups()

        # Create the report
        report = {
            "portGroups": self.port_groups,
            "portFunctionality": self.port_functionality,
            "portToFile": self.port_to_file,
            "fileToPort": self.file_to_port,
            "portConnectedFiles": self.port_connected_files
        }

        # Add detailed port information
        port_details = {}
        for port, functionality in self.port_functionality.items():
            port_details[port] = {
                "functionality": functionality,
                "main_file": self.port_to_file.get(port, "Unknown"),
                "connected_files": self.port_connected_files.get(port, {}).get("connected_files", [])
            }

        report["portDetails"] = port_details

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)

        print(f"Frontend port groups report generated: {output_file}")
        return report

def main():
    base_dir = Path(__file__).parent.parent.parent  # repository root

    analyzer = FrontendPortGroupAnalyzer(base_dir, "src/HomePage.js")
    analyzer.generate_report(base_dir / "frontend-port-groups-report.json")

if __name__ == "__main__":
    main()
