import os
import pandas as pd
import numpy as np
import json
import logging
import re
import sys
from pathlib import Path
# Configure backend directory in path
BACKEND_DIR = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if str(BACKEND_DIR) not in sys.path:
    sys.path.append(str(BACKEND_DIR))

# Now we can import from other backend modules
from Utility_functions.common_utils import property_mapping

# Define the base directory for your uploads and batches
ORIGINAL_DIR = Path(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
uploads_dir = ORIGINAL_DIR / "public" / "Original"

# Initialize logging
log_file_path = os.path.join(os.getcwd(), 'app_executionSub.log')
logging.basicConfig(filename=log_file_path, level=logging.INFO, format='%(asctime)s %(message)s')

# Parse versions and properties
def parse_versions(versions_str):
 
    return list(map(int, versions_str.split(',')))

def parse_properties(properties_str):
   
    return properties_str.split(',')

# Check if command-line arguments are provided, otherwise use defaults
if len(sys.argv) > 5:
    selected_versions = parse_versions(sys.argv[1])
    selected_properties = parse_properties(sys.argv[2])
    remarks_state = sys.argv[3]
    customized_features_state = sys.argv[4]
    selected_v = json.loads(sys.argv[5]) if len(sys.argv) > 5 else [0] * 10  # Default to mask with 9 zeros for V
    logging.info(f"Selected Subplots: {selected_v}")
else:
    logging.warning("No command-line arguments provided, using default values.")
    selected_versions = [1, 2]  # Example versions for testing
    selected_properties = ["Annual_Cash_Flows", "Annual_Revenues"]
    remarks_state = "on"
    customized_features_state = "off"
    

include_remarks = True if remarks_state == "on" else False
customized_features = True if customized_features_state == "on" else False

versions_identifier = "_".join(map(str, sorted(selected_versions)))

# Function to preprocess and remove double-double quotes
def preprocess_json_string(json_str):
    
    json_str = re.sub(r'""', '"', json_str)  # Remove redundant double quotes
    return json_str


def format_number(value, prop_id=None):
    if isinstance(value, (int, float)):
        # Properties requiring two decimal places
        decimal_properties = [
           "initialSellingPriceAmount13", 
            "interestProportionAmount24",
            "principalProportionAmount25",
            "loanPercentageAmount26",
            "repaymentPercentageOfRevenueAmount27",
            "iRRAmount30",
            "annualInterestRateAmount31",
            "stateTaxRateAmount32",
            "federalTaxRateAmount33",
            "generalInflationRateAmount23",
            "process_contingency_PC_Amount16",
            "project_Contingency_PT_BEC_EPC_PCAmount17",
            "totalOperatingCostPercentageAmount14",
            "engineering_Procurement_and_Construction_EPC_Amount15",
        ]
        
        # Properties requiring integer formatting
        integer_properties = [
            
        ]

        # Check for properties needing two decimal places
        if prop_id in decimal_properties:
            return f"{value:,.2f}"  # Format with commas and two decimal places
        elif prop_id in integer_properties:
            return f"{value:,.0f}"  # Format as integer with commas and no decimal places
        else:
            return f"{value:,.0f}"  # Default integer formatting if property not specified
    return value  # Return as is if not numeric


# Function to extract selected properties from U_configurations
def extract_selected_properties(config_file, selected_properties, include_remarks):
    properties = []
    version_headers = ""  # Initialize version_headers as an empty string

    try:
        with open(config_file, 'r') as file:
            data = file.read()

        lines = data.split('\n')
        should_append = False
        filtered_values_content = ""

        for line in lines:
            if 'filteredValues' in line:
                should_append = True
            if should_append:
                filtered_values_content += line
                if '}' in line:
                    break

        filtered_values_content = filtered_values_content.replace("'", '"')
        filtered_values_dict = json.loads(filtered_values_content)

        for prop in selected_properties:
            prop_data = next((item for item in filtered_values_dict['filteredValues'] if item.get("id") == prop), None)
            if prop_data:
                value = prop_data.get("value", None)
                remarks = prop_data.get("remarks", "")
                presentable_name = property_mapping.get(prop, prop)
                # Format the value if it's numeric
                formatted_value = format_number(value, prop_id=prop) if value is not None else value

                # Check if the property is bECAmount1 and assign its remarks to version_headers
                if prop == "bECAmount1" and remarks:
                    version_headers = remarks  # Assign remarks to version_headers

                if formatted_value is not None:
                    if include_remarks and remarks:
                        properties.append(f"{presentable_name}: {formatted_value} {remarks}")
                        logging.info(f"Property extracted with remarks: {presentable_name}: {formatted_value} (Remarks: {remarks})")
                    else:
                        properties.append(f"{presentable_name}: {formatted_value}")
                        logging.info(f"Property extracted without remarks: {presentable_name}: {formatted_value}")

    except Exception as e:
        logging.error(f"Error reading configuration file: {str(e)}")

    return version_headers, properties  # Return both version_headers and properties




# Function to extract hover text from filtered values string
def extract_hover_text(filtered_values_str, include_remarks, customized_features):
    
    if not customized_features:
        return None
     
    hover_text_lines = []
    filtered_values_str = preprocess_json_string(filtered_values_str)
    
    try:
        filtered_values = json.loads(filtered_values_str)
    except json.JSONDecodeError as e:
        logging.error(f"Error decoding JSON: {e}")
        return ""

    for entry in filtered_values:
        key = entry.get("id", "Unknown ID")
        value = entry.get("value", "Unknown Value")
        remarks = entry.get("remarks", None)
        
        mapped_key = property_mapping.get(key, key)  # Map the property name using the mapping
        hover_text = f"{mapped_key}: {value}"
        
        if include_remarks and remarks:
            hover_text += f" {remarks}"
        
        hover_text_lines.append(hover_text)
        logging.info(f"Hover text extracted: {hover_text}")
    return "<br>".join(hover_text_lines)


# Function to prioritize and combine hover texts
def combine_hover_texts(interval_hover_text_CF, interval_hover_text_SP):
    # Check if interval_hover_text_CF is None and initialize as empty list if so
    if interval_hover_text_CF is None:
        cf_list = []
    else:
        cf_list = interval_hover_text_CF.split("<br>")
    
    # Check if interval_hover_text_SP is None and initialize as empty list if so
    if interval_hover_text_SP is None:
        sp_list = []
    else:
        sp_list = interval_hover_text_SP  # Assuming this is already a list
    
    # Prioritize properties by combining lists with properties first
    combined_list = sp_list + cf_list
    
    # Convert back to the desired format with "<br>" separation
    return "<br>".join(combined_list)



# Initialize lists to store aggregated data
metrics_data = {
    'Annual_Cash_Flows': [],
    'Annual_Revenues': [],
    'Annual_Operating_Expenses': [],
    'Loan_Repayment_Terms': [],
    'Depreciation_Schedules': [],
    'State_Taxes': [],
    'Federal_Taxes': [],
    'Cumulative_Cash_Flows': []
}
# Initialize the all_hover_texts structure for hover text data and toggle state
all_hover_texts = {
    'Annual_Cash_Flows': {'data': [], 'active': []},
    'Annual_Revenues': {'data': [], 'active': []},
    'Annual_Operating_Expenses': {'data': [], 'active': []},
    'Loan_Repayment_Terms': {'data': [], 'active': []},
    'Depreciation_Schedules': {'data': [], 'active': []},
    'State_Taxes': {'data': [], 'active': []},
    'Federal_Taxes': {'data': [], 'active': []},
    'Cumulative_Cash_Flows': {'data': [], 'active': []}
}

hover_texts = {metric: [] for metric in metrics_data}
all_version_headers = []
# Process each selected version
for version in selected_versions:
    version_dir = os.path.join(uploads_dir, f'Batch({version})', f'Results({version})')
    batch_folder = os.path.join(uploads_dir, f'Batch({version})')
    results_folder = os.path.join(batch_folder, f'Results({version})')
    config_file = os.path.join(batch_folder, f'ConfigurationPlotSpec({version})', f'U_configurations({version}).py')

   
    version_headers, interval_hover_text_SP = extract_selected_properties(config_file, selected_properties, include_remarks)
    # Store the version header for this version
    all_version_headers.append(version_headers)
    logging.info(f"Version headers: {version_headers}")
    # Read CFA table
    CFA_table_path = os.path.join(version_dir, f"CFA({version}).csv")
    if not os.path.exists(CFA_table_path):
        logging.error(f"CFA table not found for version {version}")
        continue

    CFA_table = pd.read_csv(CFA_table_path)
    
    # Extract real data for each metric
    metrics_data['Annual_Cash_Flows'].append(CFA_table['After-Tax Cash Flow'].tolist())
    logging.info(f"metrics_data_aggregation {metrics_data['Annual_Cash_Flows']}")
    metrics_data['Annual_Revenues'].append(CFA_table['Revenue'].tolist())
    metrics_data['Annual_Operating_Expenses'].append(CFA_table['Operating Expenses'].tolist())
    metrics_data['Loan_Repayment_Terms'].append(CFA_table.get('Loan Repayment', pd.Series(np.zeros(len(CFA_table)))).tolist())
    metrics_data['Depreciation_Schedules'].append(CFA_table['Depreciation'].tolist())
    metrics_data['State_Taxes'].append(CFA_table['State Taxes'].tolist())
    metrics_data['Federal_Taxes'].append(CFA_table['Federal Taxes'].tolist())
    metrics_data['Cumulative_Cash_Flows'].append(CFA_table['Cumulative Cash Flow'].tolist())


    # Get hover text from configuration matrix
    config_matrix_file = os.path.join(version_dir, f"Configuration_Matrix({version}).csv")
    config_matrix_df = pd.read_csv(config_matrix_file)

    hover_text_for_version = {metric: [] for metric in metrics_data}

    for _, row in config_matrix_df.iterrows():
        start, end = row['start'], row['end']
        filtered_values = row['filtered_values']
        interval_hover_text_CF = extract_hover_text(filtered_values, include_remarks, customized_features)
        interval_hover_text = combine_hover_texts(interval_hover_text_CF, interval_hover_text_SP)
        
        for i in range(start, end + 1):
            for metric in metrics_data:
                hover_text_for_version[metric].append(interval_hover_text)

    for metric in hover_texts:
        hover_texts[metric].append(hover_text_for_version[metric])
# Temporary storage for hover text for the current version
    hover_texts_for_version = {
        'Annual_Cash_Flows': [],
        'Annual_Revenues': [],
        'Annual_Operating_Expenses': [],
        'Loan_Repayment_Terms': [],
        'Depreciation_Schedules': [],
        'State_Taxes': [],
        'Federal_Taxes': [],
        'Cumulative_Cash_Flows': []
    }
    # Fill hover texts for each time interval
    for _, row in config_matrix_df.iterrows():
        start, end = row['start'], row['end']
        filtered_values = row['filtered_values']
        interval_hover_text_CF = extract_hover_text(filtered_values, include_remarks, customized_features)
        interval_hover_text = combine_hover_texts(interval_hover_text_CF, interval_hover_text_SP)
        
        for i in range(start, end + 1):
            hover_texts_for_version['Annual_Cash_Flows'].append(interval_hover_text)
            hover_texts_for_version['Annual_Revenues'].append(interval_hover_text)
            hover_texts_for_version['Annual_Operating_Expenses'].append(interval_hover_text)
            hover_texts_for_version['Loan_Repayment_Terms'].append(interval_hover_text)
            hover_texts_for_version['Depreciation_Schedules'].append(interval_hover_text)
            hover_texts_for_version['State_Taxes'].append(interval_hover_text)
            hover_texts_for_version['Federal_Taxes'].append(interval_hover_text)
            hover_texts_for_version['Cumulative_Cash_Flows'].append(interval_hover_text)

    # Append the hover text and set default "inactive" state for this version
    for key in all_hover_texts:
        all_hover_texts[key]['data'].append(hover_texts_for_version[key])
        logging.info(f"all_hover_texts {all_hover_texts[key]['data']}")
        all_hover_texts[key]['active'].append(False) 

    logging.info(f"metrics_data_aggregation {metrics_data['Annual_Cash_Flows']}")


    metric_abbreviations = {
            'Annual_Cash_Flows': 'ACF',
            'Annual_Revenues': 'ARV',
            'Annual_Operating_Expenses': 'AOE',
            'Loan_Repayment_Terms': 'LRT',
            'Depreciation_Schedules': 'DSC',
            'State_Taxes': 'STX',
            'Federal_Taxes': 'FTX',
            'Cumulative_Cash_Flows': 'CCF'
        }
    # List of metrics to match against 'V1' to 'V8'
    metrics_list = list(metric_abbreviations.keys())


# Function to save HTML content to both the aggregated folder and individual version folders
def save_html_content(html_content, metric_name, version, versions_identifier):
    """
    Save the HTML content in both Results(versions_identifier) and Results(version) folders.
    """
   
    # 1. Individual version folder: Results(version)
    version_dir = os.path.join(
        uploads_dir, f'Batch({version})', f'Results({version})', f'v{versions_identifier}_{metric_name}_Plot'
    )
    os.makedirs(version_dir, exist_ok=True)
    version_file = os.path.join(version_dir, f'{metric_name}_Plot.html')

    with open(version_file, 'w') as file:
        file.write(html_content)
    logging.info(f"HTML file saved in version folder at: {version_file}")

    # 2. Cumulative version folder
    Cumulative_version_dir = os.path.join(
        uploads_dir, f'Batch({version})', f'Results({version})', f'v{versions_identifier}_Cumulative_Plot'
    )
    os.makedirs(Cumulative_version_dir, exist_ok=True)
    Cumulative_version_file = os.path.join(Cumulative_version_dir, f'{metric_name}_Cumulative_Plot.html')

    with open(Cumulative_version_file, 'w') as file:
        file.write(html_content)
    logging.info(f"HTML file saved in cumulative folder at: {Cumulative_version_file}")
#version_headers = ["Standard Version", "Standard Fully Automated", "Scaled Version", "Scaled Fully Automated","Wood Pellet Version", "Coir Pith Version", "Rice Husk Version", "RIL 1 (Natural Wood) Version", "RIL 2 (Wood Waste) Version", "Agrol Version", "Verge Grass Version", "Paper Residue Sludge Version"]

# Loop through selected versions and save the corresponding plots
for key, status in selected_v.items():
    if status == 'on' and key != 'V9':  # Handle individual metrics
        metric_idx = int(key[1:]) - 1
        metric_name = list(metrics_data.keys())[metric_idx]

        traces_names = [f"{metric_name.replace('_', ' ')} - {all_version_headers[i]}"
                        for i in range(len(selected_versions))]
        logging.info(f"Traces names: {traces_names}")
        # Define colors for each version
        version_colors =[
     "#ff0000",  # Red
     "#0000ff",  # Blue
    "#ff6e31",  # Orange
    "#00a600",  # Chartreuse Green
    "#12c9ca",  # Cyan
    "#8b00ff",  # Indigo
    "#9400D3",  # Dark Violet
    "#f215a5",  # Violet/Magenta
    "#ff1493"   # Deep Pink
]
     # Generate the HTML content for the metric
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Financial Analysis - {metric_name.replace('_', ' ').title()}</title>
            <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            <style>
            .plot-container {{
    width: 50%;
    margin: 0 auto;
}}
.button-grid {{
    width: 50%;
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin: 15px auto;
    padding: 0 5px;
}}
.button-grid button {{
    flex: 1;
    padding: 8px 12px;
    font-size: 14px;
    white-space: nowrap;
    border: none;
    border-radius: 4px;
    background-color: #f8f9fa;
    color: #495057;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    cursor: pointer;
}}
.button-grid button:hover {{
    background-color: #e9ecef;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}}
.button-grid button:active {{
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}}
.button-grid button:disabled {{
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}}
#plot {{
    width: 100%;
    height: 500px;
}}
            </style>
        </head>
        <body>
        <div class="plot-container">
            <div id="plot"></div>
            <div class="button-grid">
                <button id="fix-button" disabled>Press 1 to fix hover</button>
                <button id="release-button" disabled>Press 2 to release hover</button>
                <button id="global-reset-button">Global Reset</button>
            </div>
</div>
            <script type="text/javascript">
                const metric = '{metric_name}';
                const selected_versions = {json.dumps(selected_versions)};
                const metrics_data = {json.dumps(metrics_data)};
                const hover_texts = {json.dumps(all_hover_texts)};
                const traces_names = {json.dumps(traces_names)};
                const version_colors = {json.dumps(version_colors)};
                let annotations = [];
                let hoverTextStatus = {{}};
                let currentHoverPoint = null;
                let traces = [];

                const marker_styles = [
                    {{ symbol: "circle", size: 6 }},
                    {{ symbol: "square", size: 6 }},
                    {{ symbol: "diamond", size: 6 }},
                    {{ symbol: "cross", size: 6 }},
                    {{ symbol: "triangle-up", size: 6 }},
                    {{ symbol: "triangle-down", size: 6 }},
                    {{ symbol: "pentagon", size: 6 }},
                    {{ symbol: "hexagon", size: 6 }}
                ];

                for (let vIdx = 0; vIdx < selected_versions.length; vIdx++) {{
                    const version = selected_versions[vIdx];
                    traces.push({{
                        x: Array.from({{ length: metrics_data[metric][vIdx].length }}, (_, i) => i + 1),
                        y: metrics_data[metric][vIdx],
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: traces_names[vIdx],
                        text: hover_texts[metric]['data'][vIdx],
                        hoverinfo: 'text',
                        marker: {{ ...marker_styles[vIdx % marker_styles.length], color: version_colors[vIdx % version_colors.length] }}
                    }});
                }}

                const layout = {{
                    grid: {{ rows: 1, columns: 1, pattern: 'independent' }},
                    hovermode: 'closest',
                    title: `{metric_name.replace('_', ' ').title()}`,
                    annotations: [],
                }};

                Plotly.newPlot('plot', traces, layout);

                document.getElementById('fix-button').disabled = false;
                document.getElementById('release-button').disabled = false;

                document.getElementById('plot').on('plotly_hover', function(eventData) {{
                    currentHoverPoint = eventData.points[0];
                }});

                function toggleHoverText(fix) {{
                    if (currentHoverPoint !== null) {{
                        const pointKey = `${{currentHoverPoint.curveNumber}}-${{currentHoverPoint.pointIndex}}`;
                        const color = version_colors[currentHoverPoint.curveNumber % version_colors.length];  // Get color for version

                        if (fix) {{
                            hoverTextStatus[pointKey] = true;
                            const hoverAnnotation = {{
                                x: currentHoverPoint.x,
                                y: currentHoverPoint.y,
                                text: `<span style="color:${{color}};">${{currentHoverPoint.text}}</span>`,  // Apply color to text
                                showarrow: true,
                                arrowhead: 5,
                                ax: 0,
                                ay: -70,
                                axref: 'pixel',
                                ayref: 'pixel'
                            }};
                            annotations.push(hoverAnnotation);
                            Plotly.relayout('plot', {{ annotations }});
                        }} else {{
                            hoverTextStatus[pointKey] = false;
                            annotations = annotations.filter(ann => ann.x !== currentHoverPoint.x || ann.y !== currentHoverPoint.y);
                            Plotly.relayout('plot', {{ annotations }});
                        }}
                    }}
                }}

                document.addEventListener('keydown', (event) => {{
                    if (event.key === '1') {{
                        toggleHoverText(true);
                    }} else if (event.key === '2') {{
                        toggleHoverText(false);
                    }}
                }});

                function globalReset() {{
                    hoverTextStatus = {{}};
                    annotations = [];
                    Plotly.relayout('plot', {{ annotations: [] }});
                }}

                document.getElementById('global-reset-button').addEventListener('click', globalReset);
            </script>
        </body>
        </html>
        """

        # Save the HTML content in both places
        for version in selected_versions:
            save_html_content(html_content, metric_name, version, versions_identifier)
