"""
HTML organizer module for sensitivity analysis.

This module provides functions for generating and organizing HTML reports
for sensitivity analysis results.
"""

import os
import json
import time
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

class SensitivityHTMLOrganizer:
    """Organizer for sensitivity HTML reports."""
    
    def __init__(self, base_dir=None, version=1):
        """Initialize the organizer with the base directory and version."""
        if base_dir is None:
            # Use default directory structure
            self.base_dir = os.path.join(
                os.path.dirname(__file__),
                'Original',
                f'Batch({version})',
                f'Results({version})',
                'Sensitivity',
                'Reports'
            )
        else:
            self.base_dir = base_dir
            
        self.version = version
        self.logger = logger
        
        # Create base directory if it doesn't exist
        os.makedirs(self.base_dir, exist_ok=True)
        self.logger.info(f"Using reports directory: {self.base_dir}")
        
        # Create templates directory
        self.templates_dir = os.path.join(self.base_dir, 'templates')
        os.makedirs(self.templates_dir, exist_ok=True)
        
        # Create default templates if they don't exist
        self._create_default_templates()
        
    def _create_default_templates(self):
        """Create default HTML templates."""
        # Main report template
        main_template = os.path.join(self.templates_dir, 'main.html')
        if not os.path.exists(main_template):
            with open(main_template, 'w') as f:
                f.write("""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sensitivity Analysis Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3 {
            color: #2c3e50;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background-color: #f8f9fa;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 5px;
        }
        .parameter-section {
            margin-bottom: 30px;
            padding: 20px;
            background-color: #fff;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .plot-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 20px;
        }
        .plot-item {
            flex: 1;
            min-width: 300px;
            max-width: 500px;
            margin-bottom: 20px;
        }
        .plot-item img {
            max-width: 100%;
            height: auto;
            border: 1px solid #ddd;
        }
        .metadata {
            font-size: 0.9em;
            color: #666;
            margin-top: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Sensitivity Analysis Report</h1>
            <p>Version: {{version}}</p>
            <p>Generated: {{timestamp}}</p>
        </div>
        
        <div class="content">
            {{content}}
        </div>
    </div>
</body>
</html>""")
                
        # Parameter template
        param_template = os.path.join(self.templates_dir, 'parameter.html')
        if not os.path.exists(param_template):
            with open(param_template, 'w') as f:
                f.write("""<div class="parameter-section">
    <h2>Parameter: {{param_id}}</h2>
    <p>Mode: {{mode}}</p>
    <p>Values: {{values}}</p>
    
    <h3>Plots</h3>
    <div class="plot-container">
        {{plots}}
    </div>
    
    <h3>Results</h3>
    <table>
        <thead>
            <tr>
                <th>Variation</th>
                <th>Value</th>
                <th>Change</th>
                <th>% Change</th>
            </tr>
        </thead>
        <tbody>
            {{results}}
        </tbody>
    </table>
</div>""")
                
        # Plot template
        plot_template = os.path.join(self.templates_dir, 'plot.html')
        if not os.path.exists(plot_template):
            with open(plot_template, 'w') as f:
                f.write("""<div class="plot-item">
    <h4>{{plot_type}} Plot: {{param_id}} vs {{compare_to_key}}</h4>
    <img src="{{plot_path}}" alt="{{plot_type}} plot for {{param_id}} vs {{compare_to_key}}">
    <div class="metadata">
        <p>Mode: {{mode}}</p>
        <p>Comparison Type: {{comparison_type}}</p>
    </div>
</div>""")
                
        self.logger.info("Created default HTML templates")
        
    def _read_template(self, template_name):
        """Read a template file."""
        template_path = os.path.join(self.templates_dir, f"{template_name}.html")
        try:
            with open(template_path, 'r') as f:
                return f.read()
        except Exception as e:
            self.logger.error(f"Error reading template {template_name}: {str(e)}")
            return ""
            
    def _replace_placeholders(self, template, replacements):
        """Replace placeholders in a template."""
        for key, value in replacements.items():
            placeholder = f"{{{{{key}}}}}"
            template = template.replace(placeholder, str(value))
        return template
        
    def generate_parameter_html(self, param_id, param_data, plots_data):
        """Generate HTML for a parameter."""
        # Get parameter template
        template = self._read_template('parameter')
        
        # Generate plots HTML
        plots_html = ""
        for plot_type, plot_info in plots_data.get('plots', {}).items():
            for compare_to_key, plot_data in plot_info.items():
                plot_template = self._read_template('plot')
                plot_html = self._replace_placeholders(plot_template, {
                    'plot_type': plot_type.capitalize(),
                    'param_id': param_id,
                    'compare_to_key': compare_to_key,
                    'plot_path': plot_data.get('path', ''),
                    'mode': plot_data.get('mode', ''),
                    'comparison_type': plot_data.get('comparisonType', 'primary')
                })
                plots_html += plot_html
                
        # Generate results HTML
        results_html = ""
        for variation, result in param_data.get('results', {}).items():
            results_html += f"""<tr>
                <td>{variation}</td>
                <td>{result.get('value', '')}</td>
                <td>{result.get('change', '')}</td>
                <td>{result.get('percentChange', '')}%</td>
            </tr>"""
            
        # Replace placeholders
        return self._replace_placeholders(template, {
            'param_id': param_id,
            'mode': param_data.get('mode', ''),
            'values': ', '.join(map(str, param_data.get('values', []))),
            'plots': plots_html,
            'results': results_html
        })
        
    def generate_report(self, sensitivity_data, plots_data, output_file=None):
        """Generate a complete HTML report."""
        # Get main template
        template = self._read_template('main')
        
        # Generate content HTML
        content_html = ""
        for param_id, param_data in sensitivity_data.get('parameters', {}).items():
            if param_id in plots_data:
                param_html = self.generate_parameter_html(param_id, param_data, plots_data[param_id])
                content_html += param_html
                
        # Replace placeholders
        report_html = self._replace_placeholders(template, {
            'version': self.version,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'content': content_html
        })
        
        # Save report if output file is specified
        if output_file:
            try:
                with open(output_file, 'w') as f:
                    f.write(report_html)
                self.logger.info(f"Saved report to {output_file}")
            except Exception as e:
                self.logger.error(f"Error saving report: {str(e)}")
                
        return report_html
        
    def generate_summary_report(self, sensitivity_data, output_file=None):
        """Generate a summary HTML report."""
        # Get main template
        template = self._read_template('main')
        
        # Generate content HTML
        content_html = """<div class="parameter-section">
            <h2>Sensitivity Analysis Summary</h2>
            <table>
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Mode</th>
                        <th>Values</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>"""
                
        for param_id, param_data in sensitivity_data.get('parameters', {}).items():
            content_html += f"""<tr>
                <td>{param_id}</td>
                <td>{param_data.get('mode', '')}</td>
                <td>{', '.join(map(str, param_data.get('values', [])))}</td>
                <td>{param_data.get('status', {}).get('processed', False)}</td>
            </tr>"""
            
        content_html += """</tbody>
            </table>
        </div>"""
        
        # Replace placeholders
        report_html = self._replace_placeholders(template, {
            'version': self.version,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'content': content_html
        })
        
        # Save report if output file is specified
        if output_file:
            try:
                with open(output_file, 'w') as f:
                    f.write(report_html)
                self.logger.info(f"Saved summary report to {output_file}")
            except Exception as e:
                self.logger.error(f"Error saving summary report: {str(e)}")
                
        return report_html

# Example usage
if __name__ == "__main__":
    # Create organizer
    organizer = SensitivityHTMLOrganizer()
    
    # Example sensitivity data
    sensitivity_data = {
        'parameters': {
            'S34': {
                'mode': 'symmetrical',
                'values': [20],
                'results': {
                    '+20%': {'value': 120, 'change': 20, 'percentChange': 20},
                    '-20%': {'value': 80, 'change': -20, 'percentChange': -20}
                }
            }
        }
    }
    
    # Example plots data
    plots_data = {
        'S34': {
            'id': 'S34',
            'plots': {
                'waterfall': {
                    'S13': {
                        'path': '../Symmetrical/waterfall/waterfall_S34_S13_primary.png',
                        'mode': 'symmetrical',
                        'comparisonType': 'primary'
                    }
                }
            }
        }
    }
    
    # Generate report
    report_path = os.path.join(organizer.base_dir, 'sensitivity_report.html')
    organizer.generate_report(sensitivity_data, plots_data, report_path)
    
    # Generate summary report
    summary_path = os.path.join(organizer.base_dir, 'sensitivity_summary.html')
    organizer.generate_summary_report(sensitivity_data, summary_path)
