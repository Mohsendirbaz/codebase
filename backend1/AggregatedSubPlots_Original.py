import os
import pandas as pd
import numpy as np
import json
import logging
import re
import sys
from common_utils import property_mapping

# Define the base directory for your uploads and batches
uploads_dir = r"C:\Users\md8w7\OneDrive University of Missouri\Desktop\ImportantFiles\Milestone4\backend\Original"

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


# Function to format numbers with commas for display, with special handling for specific properties
def format_number(value, prop_id=None):
    if isinstance(value, (int, float)):
        # Properties requiring two decimal places
        decimal_properties = [
            "initialSellingPriceAmount1", 
            "interestProportionAmount2",
            "principalProportionAmount2",
            "loanPercentageAmount2",
            "repaymentPercentageOfRevenueAmount2",
            "iRRAmount3",
            "annualInterestRateAmount3",
            "stateTaxRateAmount3",
            "federalTaxRateAmount3",
            "generalInflationRateAmount2",
            "process_contingency_PC_BECAmount1",
            "project_Contingency_PT_BEC_EPC_PCAmount1",
            "totalOperatingCostPercentageAmount1",
            "engineering_Procurement_and_Construction_EPC_BECAmount1",
            "project_Contingency_PT_BEC_EPC_PCAmount1",
            "owners_Costs_OCAmount1"
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
                formatted_value = format_number(value,prop_id=prop) if value is not None else value

                if formatted_value is not None:
                    if include_remarks and remarks:
                        properties.append(f"{presentable_name}: {formatted_value} {remarks}")
                        logging.info(f"Property extracted with remarks: {presentable_name}: {formatted_value} (Remarks: {remarks})")
                        logging.info(f"include_remarks{properties}")
                    else:
                        properties.append(f"{presentable_name}: {formatted_value}")
                        logging.info(f"Property extracted without remarks: {presentable_name}: {formatted_value}")
                        logging.info(f"Exclude_remarks {properties}")
    except Exception as e:
        logging.error(f"Error reading configuration file: {str(e)}")
  
    return properties



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
            hover_text += f" ({remarks})"
        
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
hover_texts = {metric: [] for metric in metrics_data}

# Process each selected version
for version in selected_versions:
    version_dir = os.path.join(uploads_dir, f'Batch({version})', f'Results({version})')
    batch_folder = os.path.join(uploads_dir, f'Batch({version})')
    results_folder = os.path.join(batch_folder, f'Results({version})')
    config_file = os.path.join(batch_folder, f'ConfigurationPlotSpec({version})', f'U_configurations({version}).py')
    config_matrix_file = os.path.join(version_dir, f"Configuration_Matrix({version}).csv")
    config_matrix_df = pd.read_csv(config_matrix_file)

    properties = extract_selected_properties(config_file, selected_properties, include_remarks)
    interval_hover_text_SP = extract_selected_properties(config_file, selected_properties, include_remarks)
    
    # Read CFA table
    CFA_table_path = os.path.join(version_dir, f"CFA({version}).csv")
    if not os.path.exists(CFA_table_path):
        logging.error(f"CFA table not found for version {version}")
        continue

    CFA_table = pd.read_csv(CFA_table_path)
    
    # Extract real data for each metric
    metrics_data['Annual_Cash_Flows'].append(CFA_table['After-Tax Cash Flow'].tolist())
    metrics_data['Annual_Revenues'].append(CFA_table['Revenue'].tolist())
    metrics_data['Annual_Operating_Expenses'].append(CFA_table['Operating Expenses'].tolist())
    metrics_data['Loan_Repayment_Terms'].append(CFA_table.get('Loan Repayment', pd.Series(np.zeros(len(CFA_table)))).tolist())
    metrics_data['Depreciation_Schedules'].append(CFA_table['Depreciation'].tolist())
    metrics_data['State_Taxes'].append(CFA_table['State Taxes'].tolist())
    metrics_data['Federal_Taxes'].append(CFA_table['Federal Taxes'].tolist())
    metrics_data['Cumulative_Cash_Flows'].append(CFA_table['Cumulative Cash Flow'].tolist())
    

    # Fill hover texts for each time interval
    for _, row in config_matrix_df.iterrows():
          start, end = row['start'], row['end']
    year_range = range(start, end + 1)
    filtered_values = row['filtered_values']
    
    # Generate hover text for this segment (e.g., for 'Cash Flow' or 'SP')
    interval_hover_text_CF = extract_hover_text(filtered_values, include_remarks, customized_features)
    interval_hover_text = combine_hover_texts(interval_hover_text_CF, interval_hover_text_SP)

    # For each year in the range, assign hover text for each metric
    for year in year_range:
        for metric in hover_texts_for_version:
            # Append hover text with year information, e.g., "Year: 2021, Cash Flow: $5000"
            hover_text_with_year = f"Year: {year}, {interval_hover_text}"
            hover_texts_for_version[metric].append(hover_text_with_year)
        
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
       
        all_hover_texts[key]['active'].append(False) 

    # Prepare subplot names by replacing underscores with spaces
    subplot_names = [f"{metric_name.replace('_', ' ')}" for metric_name in metrics_data]

        # Generate the HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Financial Analysis Plots</title>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
        <style>
            .button-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
                gap: 5px;
                margin-top: 10px;
            }}
            .button-grid button {{
                padding: 6px 8px;
                font-size: 18px;
                margin: 0;
            }}
            .reset-button {{
                display: inline-block;
                width: 60px;
                height: 25px;
                padding: 4px;
                font-size: 10px;
                margin-left: 5px;
                background-color: lightgrey;
                border: 1px solid #000;
                cursor: pointer;
                text-align: center;
            }}
            #plot {{
                width: 100%;
                height: 500px;
            }}
        </style>
    </head>
    <body>
        <div id="plot"></div>
        <div class="button-grid">
            <button id="fix-button" disabled>Press 1 to fix the hover</button>
            <button id="release-button" disabled>Press 2 to release the hover</button>
            <button id="global-reset-button">Global Reset</button>
        </div>

        <script type="text/javascript">
            const selected_versions = {json.dumps(selected_versions)};
            const metrics = {json.dumps(list(metrics_data.keys()))};
            const metrics_data = {json.dumps(metrics_data)};
            const hover_texts = {json.dumps(all_hover_texts)};

            let traces = [];
            let annotations = [];
            let hoverTextStatus = {{}};
            let currentHoverPoint = null;

            const marker_styles = [
                {{symbol: "circle", size: 6}},
                {{symbol: "square", size: 6}},
                {{symbol: "diamond", size: 6}},
                {{symbol: "cross", size: 6}},
                {{symbol: "triangle-up", size: 6}},
                {{symbol: "triangle-down", size: 6}},
                {{symbol: "pentagon", size: 6}},
                {{symbol: "hexagon", size: 6}},
            ];

            // Create traces for each version and metric
            metrics.forEach((metric, metricIdx) => {{
                selected_versions.forEach((version, vIdx) => {{
                    traces.push({{
                        x: Array.from({{length: metrics_data[metric][vIdx].length}}, (_, i) => i + 1),
                        y: metrics_data[metric][vIdx],
                        type: 'scatter',
                        mode: ''lines+markers'',
                        name: metric.replace(/_/g, ' ') + ' - Version ' + version,
                        text: hover_texts[metric]['data'][vIdx],
                        hoverinfo: 'text',
                        marker: marker_styles[vIdx % marker_styles.length],
                        xaxis: 'x' + (metricIdx + 1),
                        yaxis: 'y' + (metricIdx + 1)
                    }});
                }});
            }});

            // Layout for the 4x2 grid with hardcoded subplot titles and one global legend
            const layout = {{
                grid: {{ rows: 4, columns: 2, pattern: 'independent' }},
                hovermode: 'closest',
                annotations: [],
                showlegend: true,
                title: 'Financial Analysis Subplots with Different Versions',
                legend: {{
                    font: {{ size: 16 }}
                }}
            }};


           

            // Plot all traces
            Plotly.newPlot('plot', traces, layout);

            document.getElementById('fix-button').disabled = false;
            document.getElementById('release-button').disabled = false;

            document.getElementById('plot').on('plotly_hover', function(eventData) {{
                currentHoverPoint = eventData.points[0];
            }});

            function toggleHoverText(fix) {{
                if (currentHoverPoint !== null) {{
                    const pointKey = `${{currentHoverPoint.curveNumber}}-${{currentHoverPoint.pointIndex}}`;
                    if (fix) {{
                        hoverTextStatus[pointKey] = true;
                        const hoverAnnotation = {{
                            x: currentHoverPoint.x,
                            y: currentHoverPoint.y,
                            text: currentHoverPoint.text,
                            showarrow: true,
                            arrowhead: 5,
                            ax: 0,
                            ay: -70,
                            axref: 'pixel',
                            ayref: 'pixel'
                        }};
                        annotations.push(hoverAnnotation);
                        Plotly.relayout('plot', {{ annotations: annotations }});
                    }} else {{
                        hoverTextStatus[pointKey] = false;
                        annotations = annotations.filter(ann => ann.x !== currentHoverPoint.x || ann.y !== currentHoverPoint.y);
                        Plotly.relayout('plot', {{ annotations: annotations }});
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
                document.getElementById('fix-button').textContent = 'Press 1 to fix the hover';
                document.getElementById('release-button').textContent = 'Press 2 to release the hover';
            }}

            document.getElementById('global-reset-button').addEventListener('click', globalReset);
        </script>
    </body>
    </html>
    """





    # Save the HTML content into a file for each version
    for version in selected_versions:
        version_dir = os.path.join(uploads_dir, f'Batch({version})', f'Results({version})', f'v{versions_identifier}_DynamicSubPlots')
        output_file = os.path.join(version_dir, f'Financial_Analysis_Plots_{versions_identifier}.html')

        # Ensure the directory exists
        os.makedirs(version_dir, exist_ok=True)

        # Write the HTML content to the file
        with open(output_file, 'w') as file:
            file.write(html_content)

        logging.info(f"HTML file saved successfully at: {output_file}")


    # Preprocess metric names to be more readable
    cleaned_metric_names = [
        "Annual Cash Flows", 
        "Annual Revenues", 
        "Annual Operating Expenses", 
        "Loan Repayment Terms", 
        "Depreciation Schedules", 
        "State Taxes", 
        "Federal Taxes", 
        "Cumulative Cash Flows"
    ]
    # Save the HTML content into a file for each version

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

    for key, status in selected_v.items():
        if status == 'on' and key != 'V9':  # For individual metrics
            metric_idx = int(key[1:]) - 1  # Get the metric index (V1 -> 0, V2 -> 1, etc.)
            metric_name = list(metrics_data.keys())[metric_idx]  # Get the raw metric name
            logging.info(f"Generating HTML for metric: {metric_name}")
            clean_metric_title = cleaned_metric_names[metric_idx]  # Get the cleaned name
            abv = metric_abbreviations[metric_name]
            # Create HTML content for the specific metric
            html_content = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Financial Analysis - {clean_metric_title}</title>
                <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
                <style>
                    .button-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); /* Set a standard min width */
            gap: 5px;
            margin-top: 10px;
        }}

        .button-grid button {{
            padding: 6px 8px; /* Increase padding slightly for better button proportion */
            font-size: 50px; /* Increase font size for readability */
            margin: 0; /* Remove extra left margin */
        }}

        .subplot-container {{
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: 10px; /* Add gap for spacing if there are multiple subplots */
        }}

        .subplot {{
            width: 100%; /* Make subplot take full width within the container */
            max-width: 300px; /* Set a max width to prevent excessive stretching */
            display: block; /* Adjust to fit in standard block context */
        }}

        .reset-button {{
            display: inline-block;
            width: 60px; /* Standardize width */
            height: 25px; /* Increase height for better visibility */
            padding: 4px;
            font-size: 10px; /* Increase font size slightly */
            margin-left: 5px;
            background-color: lightgrey;
            border: 1px solid #000;
            cursor: pointer;
            text-align: center; /* Center text within the button */
        }}
                </style>
            </head>
            <body>
                <div id="plot"></div>

                 <div class="button-grid">
                    <button id="fix-button" disabled>Press 1 to fix the hover</button>
                    <button id="release-button" disabled>Press 2 to release the hover</button>
                    <button id="global-reset-button">Global Reset</button>
                </div>

                <script type="text/javascript">
                    const selected_versions = {json.dumps(selected_versions)};
                    const metric = '{metric_name}';
                    const metrics_data = {json.dumps(metrics_data)};
                    const hover_texts = {json.dumps(all_hover_texts)};
                    let traces = [];
                    let annotations = [];
                    let hoverTextStatus = {{}};
                    let currentHoverPoint = null;

                    const marker_styles = [
                        {{symbol: "circle", size: 6}},
                        {{symbol: "square", size: 6}},
                        {{symbol: "diamond", size: 6}},
                        {{symbol: "cross", size: 6}},
                        {{symbol: "triangle-up", size: 6}},
                        {{symbol: "triangle-down", size: 6}},
                        {{symbol: "pentagon", size: 6}},
                        {{symbol: "hexagon", size: 6}},
                    ];

                    // Create traces for the selected metric
                    selected_versions.forEach((version, vIdx) => {{
                        traces.push({{
                            x: Array.from({{length: metrics_data[metric][vIdx].length}}, (_, i) => i + 1),
                            y: metrics_data[metric][vIdx],
                            type: 'scatter',
                            mode: 'lines+markers',
                            name: '{clean_metric_title} - Version ' + version,
                            text: hover_texts[metric]['data'][vIdx],
                            hoverinfo: 'text',
                            marker: marker_styles[vIdx],
                        }});
                    }});

                    const layout = {{
                        grid: {{ rows: 1, columns: 1, pattern: 'independent' }},
                        paper_bgcolor: 'rgba(240,240,240,1)',
                        plot_bgcolor: 'rgba(255,255,255,1)',
                        hovermode: 'closest',
                        title: 'Financial Analysis - {clean_metric_title}',
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

                            if (fix) {{
                                hoverTextStatus[pointKey] = true;
                                const hoverAnnotation = {{
                                    x: currentHoverPoint.x,
                                    y: currentHoverPoint.y,
                                    text: currentHoverPoint.text,
                                    showarrow: true,
                                    arrowhead: 5,
                                    ax: 0,
                                    ay: -70,
                                    axref: 'pixel',
                                    ayref: 'pixel'
                                }};
                                annotations.push(hoverAnnotation);
                                Plotly.relayout('plot', {{ annotations: annotations }});
                            }} else {{
                                hoverTextStatus[pointKey] = false;
                                annotations = annotations.filter(
                                    ann => ann.x !== currentHoverPoint.x || ann.y !== currentHoverPoint.y
                                );
                                Plotly.relayout('plot', {{ annotations: annotations }});
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
            

            # Set the output directory for individual metrics
            output_dir = os.path.join(
                uploads_dir, f'Batch({versions_identifier})',
                f'Results({versions_identifier})', f'v{versions_identifier}_{abv}DynamicSubPlots'
            )
        else:  # Handle V9 for the full grid layout
            output_dir = os.path.join(
                uploads_dir, f'Batch({versions_identifier})',
                f'Results({versions_identifier})', f'v{versions_identifier}_DynamicSubPlots'
            )


    print("HTML files generated for each active metric and version.")



