import sys 
import numpy as np
import pandas as pd
import os
import shutil  # For removing directories
import json
import logging
import matplotlib.pyplot as plt
from common_utils import property_mapping  # Import property_mapping
from matplotlib import font_manager
import matplotlib.ticker as ticker

log_file_path = r"C:\Users\Mohse\OneDrive\Documents\GitHub\TeaSpace\backend\PNG.log"
logging.basicConfig(
    filename=log_file_path,
    level=logging.INFO,
    filemode='a'
)

logging.info("Script started.")
logger = logging.getLogger(__name__)



# Base directory for uploads and batches
uploads_dir = r"C:\Users\Mohse\OneDrive\Documents\GitHub\TeaSpace\backend\Original"


# Define paths to save aggregated data and legend information
output_data_dir = os.path.join(uploads_dir, "aggregated_data")
os.makedirs(output_data_dir, exist_ok=True)

# Save datasets as CSV files for use in R
def save_to_csv(data, filename):
    filepath = os.path.join(output_data_dir, filename)
    pd.DataFrame(data).to_csv(filepath, index=False)
    return filepath
# Parse versions and properties
def parse_versions(versions_str):
 
    return list(map(int, versions_str.split(',')))

def parse_properties(properties_str):
   
    return properties_str.split(',')

# Check if command-line arguments are provided, otherwise use defaults
if len(sys.argv) > 4:
    selected_versions = parse_versions(sys.argv[1])
    selected_properties = parse_properties(sys.argv[2])
    remarks_state = sys.argv[3]  # boolean user preference to include baseline remarks
    customized_features_state = sys.argv[4]  # boolean user preference for customized features (from CSV)
else:
    logging.warning("No command-line arguments provided, using default values.")
    selected_versions = [1, 2]  # Example versions for testing
    selected_properties = ["plantLifetimeAmount1"]
    remarks_state = "on"
    customized_features_state = "off"

logging.info(f"Selected versions: {selected_versions}")
logging.info(f"Selected properties: {selected_properties}")
logging.info(f"Include baseline remarks: {remarks_state}")
logging.info(f"Include customized features: {customized_features_state}")
# User preferences as boolean flags
include_in_remarks = True if remarks_state == "on" else False
include_customized_features = True if customized_features_state == "on" else False

# Generate a unique identifier based on the selected versions
versions_identifier = "_".join(map(str, sorted(selected_versions)))

# Function to extract customized features from Filtered_Value_Intervals CSV
def extract_customized_features(filtered_value_intervals_file, include_customized_features, include_in_remarks):
    customized_features = []
    if include_customized_features and os.path.exists(filtered_value_intervals_file):
        filtered_value_intervals_df = pd.read_csv(filtered_value_intervals_file)
        

        for _, row in filtered_value_intervals_df.iterrows():
            prop_id = row['ID']
            start = row['Start']
            end = row['End']
            value = row['Value']
            remarks = row['Remarks']

            if include_in_remarks and remarks:
                customized_features.append(f"{prop_id}: {value}, [{start}-{end}], Remarks: {remarks}")
               
            else:
                customized_features.append(f"{prop_id}: {value}, [{start}-{end}]")
           

    return customized_features


# Initialize dictionaries to store version statistics with row numbers as keys
custom_version_stat = {}
legend_cluster_version_stat = {}

# Calculate cluster_size
cluster_size = len(selected_properties) + 1

for i, selected_version in enumerate(selected_versions, start=1):
    batch_folder = os.path.join(uploads_dir, f'Batch({selected_version})')
    results_folder = os.path.join(batch_folder, f'Results({selected_version})')

    # Collect properties and customized features for this version
    config_file = os.path.join(batch_folder, f'ConfigurationPlotSpec({selected_version})', f'U_configurations({selected_version}).py')
    filtered_value_intervals_file = os.path.join(results_folder, f'Filtered_Value_Intervals({selected_version}).csv')

    # Extract customized features for this version
    customized_features = extract_customized_features(filtered_value_intervals_file, include_customized_features, include_in_remarks)
    
    # Calculate custom_count with cluster_size added
    custom_count_with_cluster = len(customized_features) + cluster_size

    # Store the version and updated custom count under the row number key in custom_version_stat
    custom_version_stat[i] = {
        "version": selected_version,
        "custom_count": custom_count_with_cluster
    }

    # Store the row number, version, and custom count in legend_cluster_version_stat
    legend_cluster_version_stat[i] = {
        "version": selected_version,
        "custom_count": custom_count_with_cluster
    }



logging.info(f"legend_cluster_version_stat {legend_cluster_version_stat}")




# Ensure directory exists or clear old files
def prepare_version_directory(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)
      
    else:
        # Clean specific files, not the entire directory
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
               
# Function to format numbers with commas for display, with special handling for specific properties
def format_number(value, prop_id=None):
    if isinstance(value, (int, float)):
        # If the property is 'numberOfUnitsAmount1', format with 2 decimal places
        if prop_id == "initialSellingPriceAmount1":
            return f"{value:,.2f}"  # Format with commas and two decimal places
        else:
            return f"{value:,.0f}"  # Format as integer with commas and no decimal places
    return value  # Return as is if not numeric

# Function to extract selected properties from U_configurations
def extract_selected_properties(config_file, selected_properties, include_in_remarks):
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
                # Format the value with special handling for 'numberOfUnitsAmount1'
                formatted_value = format_number(value, prop_id=prop) if value is not None else value

                if formatted_value is not None:
                    if include_in_remarks and remarks:
                        properties.append(f"{presentable_name}: {formatted_value} {remarks}")
                        logging.info(f"Property extracted with remarks: {presentable_name}: {formatted_value} (Remarks: {remarks})")
                    else:
                        properties.append(f"{presentable_name}: {formatted_value}")
                        logging.info(f"Property extracted without remarks: {presentable_name}: {formatted_value}")

    except Exception as e:
        logging.error(f"Error reading configuration file: {str(e)}")

    return properties








# Initialize lists to store aggregated data
all_annual_cash_flows_net = []
all_annual_revenues = []
all_annual_operating_expenses = []
all_depreciation_schedules = []
all_state_taxes = []
all_federal_taxes = []
all_cumulative_cash_flows = []

# Initialize the cumulative legend items list
cumulative_legend_items = []

# Predefined list of version headers
version_headers = ["Wood Pellet Version", "Coir Pith Version", "Rice Husk Version", "Sawdust Version", "Hambach Version", "Labee Version", "Rubber Wood Chip Version", "RIL 1 (Natural Wood) Version", "RIL 2 (Wood Waste) Version", "RIL 3 (Wood Waste) Version", "Agrol Version", "Verge Grass Version", "Paper Residue Sludge Version"]





# Iterate over each selected version to aggregate data
for i, selected_version in enumerate(selected_versions):
    batch_folder = os.path.join(uploads_dir, f'Batch({selected_version})')
    results_folder = os.path.join(batch_folder, f'Results({selected_version})')

    # Prepare version-specific plot directory
    version_specific_dir = os.path.join(results_folder, f'{versions_identifier}_AnnotatedStaticPlots')
    if os.path.exists(version_specific_dir):
        shutil.rmtree(version_specific_dir)
        
    os.makedirs(version_specific_dir, exist_ok=True)
    

    # Skip if results folder doesn't exist
    if not os.path.exists(results_folder):
        logging.warning(f"Results folder does not exist for version {selected_version}")
        continue

    summary_table = pd.read_csv(os.path.join(results_folder, f"CFA({selected_version}).csv"))
   

    # Log data being loaded
    annual_cash_flow_net = summary_table['After-Tax Cash Flow'].values
    annual_revenue = summary_table['Revenue'].values
    annual_operating_expenses = summary_table['Operating Expenses'].values
    depreciation_schedule = summary_table['Depreciation'].values
    state_taxes = summary_table['State Taxes'].values
    federal_taxes = summary_table['Federal Taxes'].values
    cumulative_cash_flow = summary_table.iloc[:, -1].values  # Extract cumulative cash flow from the last column

    all_annual_cash_flows_net.append(annual_cash_flow_net)
    all_annual_revenues.append(annual_revenue)
    all_annual_operating_expenses.append(annual_operating_expenses)
    all_depreciation_schedules.append(depreciation_schedule)
    all_state_taxes.append(state_taxes)
    all_federal_taxes.append(federal_taxes)
    all_cumulative_cash_flows.append(cumulative_cash_flow)

    

    # Collect properties and customized features for this version
    config_file = os.path.join(batch_folder, f'ConfigurationPlotSpec({selected_version})', f'U_configurations({selected_version}).py')
    properties = extract_selected_properties(config_file, selected_properties, include_in_remarks)

    filtered_value_intervals_file = os.path.join(results_folder, f'Filtered_Value_Intervals({selected_version}).csv')
    customized_features = extract_customized_features(filtered_value_intervals_file, include_customized_features, include_in_remarks)



    header = version_headers[i % len(version_headers)]  # Cycle through if more versions than headers

    # Initialize version_legend with the predefined header
    version_legend = [header]

    
    version_legend.extend(properties + customized_features)

    # Log the version-specific legend before adding to cumulative
 

    # Add to cumulative legend, ensuring version-specific legend is stored
    cumulative_legend_items.append(version_legend)
  

# Example list of fonts to choose from
    available_fonts = ['Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia']

    # You can select the font of your choice from the list
    chosen_title_font = 'Georgia'
    chosen_axis_font = 'Georgia'
    chosen_legend_font = 'Georgia'
    legend_item_spacing = 1  # Space between legend items
# Colors and markers for the plots
colors = plt.cm.tab20(np.linspace(0, 1, len(selected_versions)))
markers = ['o', 's', 'D', '^', 'v', '<', '>', 'p', 'h', '*']

# Plot function with cumulative legend and save for each version
def plot_aggregated(datasets, title, xlabel, ylabel, filename, title_font=chosen_title_font, axis_font=chosen_axis_font, legend_font=chosen_legend_font, title_size=18, label_size=14):
    fig, ax = plt.subplots(figsize=(10, 6))

    for i, dataset in enumerate(datasets):
        if len(dataset) == 0:
            logging.warning(f"Dataset {i} for {title} is empty.")
        else:
            ax.plot(dataset, color=colors[i], marker=markers[i % len(markers)], linestyle='-', linewidth=1, markersize=5)

    # Apply title and labels with custom fonts
        ax.set_title(title, fontsize=title_size, fontname=title_font, weight='bold', loc='center', pad=20)
        ax.set_xlabel(xlabel, fontsize=label_size, fontname=axis_font)
        ax.set_ylabel(ylabel, fontsize=label_size, fontname=axis_font)
    # Set X-ticks with customized intervals and labels (for example, every 5 years)
        xtick_positions = np.arange(0, len(datasets[0]), 5)  # Customize x-ticks every 5 points (adjust as needed)
        ax.set_xticks(xtick_positions)
        ax.set_xticklabels([f"{i}" for i in xtick_positions], fontsize=12, fontname=axis_font)
    # Set y-tick format with comma separation
        ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, pos: f'${int(x):,}'))

        # Customize font properties for yticks
        plt.yticks(fontname=axis_font)
    # Construct the custom legend with colors and markers corresponding to the plot
    legend_handles = []
    for i, sublist in enumerate(cumulative_legend_items):
        version_color = colors[i]
        version_marker = markers[i % len(markers)]
        version_header = sublist[0]

        # Create a handle for the version header with the corresponding color and marker
        header_handle = ax.plot([], [], color=version_color, marker=version_marker, linestyle='None',label=version_header, markersize=8, markeredgewidth=2, alpha=0.9, markerfacecolor="none")[0]
        legend_handles.append(header_handle)

        # Loop through the rest of the items for the version
        for item in sublist[1:]:
            item_handle = ax.plot([], [], color=version_color, marker=version_marker, linestyle='None', label=item, markersize=6, markeredgewidth=1.5, alpha=0.7)[0]
            legend_handles.append(item_handle)
# Split legend into multiple boxes if the number of items exceeds thresholds (15, 30, 45, etc.)
    items_per_legend_box = 15
    legend_boxes = [legend_handles[i:i + items_per_legend_box] for i in range(0, len(legend_handles), items_per_legend_box)]

    title_font = font_manager.FontProperties(family='Georgia', size=12)

    # Add the custom legend with the colored and marked items
   # Loop over each legend box and add it to the plot
    for box_index, handles in enumerate(legend_boxes):
        ax.legend(
            handles=handles,
            loc='center left',
            bbox_to_anchor=(1.05 + box_index * 0.2, 0.5),  # Adjust spacing for each box
            frameon=True,
            fancybox=True,
            edgecolor='black',
            fontsize=10,
            labelspacing=legend_item_spacing,
            prop={'family': legend_font},
            title=f'Investment Scenario Configurations ({box_index + 1})',
            title_fontproperties=title_font
        )
    # Add grid lines for both horizontal and vertical axes
    ax.grid(True, which='both', axis='x', linestyle='--', linewidth=0.5)  # Vertical grid lines
    ax.grid(True, which='both', axis='y', linestyle='--', linewidth=0.5)  # Horizontal grid lines
    # Set plot background color and finalize layout
    ax.set_facecolor('#f0f0f0')  # Light grey background
    # Adjust layout to ensure nothing is cut off
    plt.tight_layout(rect=[0, 0, 0.75, 1])

    plt.savefig(filename, bbox_inches='tight')
   
    plt.close()
    
# Plot and save for each version
for selected_version in selected_versions:
    version_specific_dir = os.path.join(uploads_dir, f'Batch({selected_version})', f'Results({selected_version})', f'{versions_identifier}_LBAnnotatedStaticPlots')
    # Create the directory if it doesn't exist
    os.makedirs(version_specific_dir, exist_ok=True)
    filename_suffix = f'_{versions_identifier}.png'

    plot_aggregated(all_annual_cash_flows_net, 'Aggregated Annual Cash Flow Net', 'Year', 'Net Cash Flow', f'{version_specific_dir}/aggregated_annual_cash_flow_net{filename_suffix}')
    plot_aggregated(all_annual_revenues, 'Aggregated Annual Revenue', 'Year', 'Revenue', f'{version_specific_dir}/aggregated_revenue{filename_suffix}')
    plot_aggregated(all_annual_operating_expenses, 'Aggregated Annual Operating Expenses', 'Year', 'Operating Expenses', f'{version_specific_dir}/aggregated_operating_expenses{filename_suffix}')
    plot_aggregated(all_depreciation_schedules, 'Aggregated Depreciation', 'Year', 'Depreciation', f'{version_specific_dir}/aggregated_depreciation{filename_suffix}')
    plot_aggregated(all_state_taxes, 'Aggregated State Taxes', 'Year', 'State Taxes', f'{version_specific_dir}/aggregated_state_taxes{filename_suffix}')
    plot_aggregated(all_federal_taxes, 'Aggregated Federal Taxes', 'Year', 'Federal Taxes', f'{version_specific_dir}/aggregated_federal_taxes{filename_suffix}')
    plot_aggregated(all_cumulative_cash_flows, 'Aggregated Cumulative Cash Flow', 'Year', 'Cumulative Cash Flow', f'{version_specific_dir}/aggregated_cumulative_cash_flow{filename_suffix}')
    # Save each dataset
cash_flow_path = save_to_csv(all_annual_cash_flows_net, "all_annual_cash_flows_net.csv")
revenue_path = save_to_csv(all_annual_revenues, "all_annual_revenues.csv")
expenses_path = save_to_csv(all_annual_operating_expenses, "all_annual_operating_expenses.csv")
depreciation_path = save_to_csv(all_depreciation_schedules, "all_depreciation_schedules.csv")
state_taxes_path = save_to_csv(all_state_taxes, "all_state_taxes.csv")
federal_taxes_path = save_to_csv(all_federal_taxes, "all_federal_taxes.csv")
cumulative_cash_flow_path = save_to_csv(all_cumulative_cash_flows, "all_cumulative_cash_flows.csv")

# Save cumulative legend items to a JSON file
legend_path = os.path.join(output_data_dir, "cumulative_legend_items.json")
with open(legend_path, 'w') as legend_file:
    json.dump(cumulative_legend_items, legend_file)

logging.info("All data and legend information saved for R script.")
logging.info("All plots completed successfully.")
print("All plots completed successfully.")
