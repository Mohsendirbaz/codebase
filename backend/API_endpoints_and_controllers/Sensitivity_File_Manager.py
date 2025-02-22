import os
import json
import logging
import shutil
from datetime import datetime
from typing import Dict, List, Optional

class SensitivityFileManager:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        self.logger = logging.getLogger('sensitivity_file_manager')
        
        # Define standard directory structure
        self.directory_structure = {
            'configurations': 'ConfigurationPlotSpec',
            'results': 'Results',
            'sensitivity': {
                'symmetrical': 'Symmetrical',
                'multipoint': 'Multipoint'
            },
            'reports': 'Analysis_Reports',
            'cache': 'Calculation_Cache'
        }
        
        # Initialize directory structure
        self._initialize_directories()

    def _initialize_directories(self):
        """Creates the standard directory structure if it doesn't exist."""
        try:
            for batch_num in range(1, 11):  # Assuming batches 1-10
                batch_path = os.path.join(self.base_dir, f'Batch({batch_num})')
                
                # Create main directories
                for dir_type, dir_name in self.directory_structure.items():
                    if isinstance(dir_name, dict):
                        # Handle nested directories (like sensitivity)
                        parent_dir = os.path.join(batch_path, f'Results({batch_num})', 'Sensitivity')
                        for subdir_type, subdir_name in dir_name.items():
                            os.makedirs(os.path.join(parent_dir, subdir_name), exist_ok=True)
                    else:
                        os.makedirs(os.path.join(batch_path, f'{dir_name}({batch_num})'), exist_ok=True)
                        
                # Create reports directory
                reports_dir = os.path.join(batch_path, f'Results({batch_num})', 'Reports')
                os.makedirs(reports_dir, exist_ok=True)
                
        except Exception as e:
            self.logger.error(f"Error initializing directory structure: {str(e)}")
            raise

    def get_plot_path(self, version: int, mode: str, plot_type: str, param_id: str, 
                     compare_to_key: str, comparison_type: str) -> str:
        """Constructs the full path for a plot file."""
        plot_name = f"{plot_type}_{param_id}_{compare_to_key}_{comparison_type}.png"
        return os.path.join(
            self.base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity',
            mode.capitalize(),
            plot_name
        )

    def store_calculation_result(self, version: int, param_id: str, 
                               result_data: Dict, mode: str) -> str:
        """Stores calculation results in JSON format."""
        result_path = os.path.join(
            self.base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity',
            mode.capitalize(),
            f"{param_id}_results.json"
        )
        
        with open(result_path, 'w') as f:
            json.dump(result_data, f, indent=4)
        
        return result_path

    def create_analysis_report(self, version: int, analysis_data: Dict) -> str:
        """Creates an HTML report from analysis results."""
        report_dir = os.path.join(
            self.base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Reports'
        )
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_path = os.path.join(report_dir, f'sensitivity_analysis_{timestamp}.html')
        
        # Generate HTML content
        html_content = self._generate_html_report(analysis_data, version)
        
        with open(report_path, 'w') as f:
            f.write(html_content)
        
        return report_path

    def _generate_html_report(self, analysis_data: Dict, version: int) -> str:
        """Generates HTML content for the analysis report."""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sensitivity Analysis Report - Version {version}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .plot-container {{ margin: 20px 0; }}
                .result-table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
                .result-table th, .result-table td {{ 
                    border: 1px solid #ddd; padding: 8px; text-align: left; 
                }}
            </style>
        </head>
        <body>
            <h1>Sensitivity Analysis Report</h1>
            <h2>Version {version}</h2>
        """
        
        # Add analysis sections
        for param_id, data in analysis_data.items():
            html += f"""
            <div class="analysis-section">
                <h3>Parameter: {param_id}</h3>
                <p>Analysis Mode: {data['mode']}</p>
                <div class="plot-container">
                    {''.join(f'<img src="{plot_path}" alt="{plot_type} plot" style="max-width: 100%; margin: 10px 0;">' 
                            for plot_type, plot_path in data['plots'].items())}
                </div>
                <table class="result-table">
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                    </tr>
                    {''.join(f'<tr><td>{k}</td><td>{v}</td></tr>' 
                            for k, v in data['results'].items())}
                </table>
            </div>
            """
        
        html += """
        </body>
        </html>
        """
        
        return html

    def cache_calculation_data(self, version: int, param_id: str, 
                             calculation_data: Dict) -> str:
        """Caches intermediate calculation results."""
        cache_path = os.path.join(
            self.base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Calculation_Cache',
            f"{param_id}_cache.json"
        )
        
        with open(cache_path, 'w') as f:
            json.dump(calculation_data, f, indent=4)
        
        return cache_path

    def cleanup_cache(self, version: int, older_than_days: int = 7):
        """Cleans up cached calculation data older than specified days."""
        cache_dir = os.path.join(
            self.base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Calculation_Cache'
        )
        
        current_time = datetime.now()
        for file_name in os.listdir(cache_dir):
            file_path = os.path.join(cache_dir, file_name)
            file_modified = datetime.fromtimestamp(os.path.getmtime(file_path))
            if (current_time - file_modified).days > older_than_days:
                os.remove(file_path)

    def archive_analysis(self, version: int, archive_name: Optional[str] = None) -> str:
        """Archives analysis results and reports."""
        if not archive_name:
            archive_name = f"sensitivity_analysis_v{version}_{datetime.now().strftime('%Y%m%d')}"
        
        source_dir = os.path.join(
            self.base_dir,
            f'Batch({version})',
            f'Results({version})'
        )
        
        archive_path = os.path.join(self.base_dir, 'Archives', f"{archive_name}.zip")
        os.makedirs(os.path.dirname(archive_path), exist_ok=True)
        
        shutil.make_archive(
            os.path.splitext(archive_path)[0],
            'zip',
            source_dir
        )
        
        return archive_path