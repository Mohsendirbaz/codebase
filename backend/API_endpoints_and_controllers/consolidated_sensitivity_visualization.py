import os
import json
import argparse
import sys
import csv
import re
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
import shutil
from collections import defaultdict

# Hardcoded property mapping
property_mapping = {
    "plantLifetimeAmount10": "Plant Lifetime",
    "bECAmount11": "Bare Erected Cost",
    "numberOfUnitsAmount12": "Number of Units",
    "initialSellingPriceAmount13": "Price",
    "totalOperatingCostPercentageAmount14": "Direct Total Operating Cost Percentage as % of Revenue",
    "engineering_Procurement_and_Construction_EPC_Amount15": "Engineering Procurement and Construction as % of BEC",
    "process_contingency_PC_Amount16": "Process Contingency as % of BEC",
    "project_Contingency_PT_BEC_EPC_PCAmount17": "Project Contingency as % of BEC, EPC, PC",
    "use_direct_operating_expensesAmount18": "Use Direct Operating Expenses",
    "use_direct_revenueAmount19": "Use Direct Revenue",
    "depreciationMethodAmount20": "Depreciation Method",
    "loanTypeAmount21": "Loan Type",
    "interestTypeAmount22": "Interest Type",
    "generalInflationRateAmount23": "General Inflation Rate",
    "interestProportionAmount24": "Interest Proportion",
    "principalProportionAmount25": "Principal Proportion",
    "loanPercentageAmount26": "Loan Percentage of TOC",
    "repaymentPercentageOfRevenueAmount27": "Repayment Percentage Of Revenue",
    "numberofconstructionYearsAmount28": "Number of Construction Years",
    "iRRAmount30": "Internal Rate of Return",
    "annualInterestRateAmount31": "Annual Interest Rate",
    "stateTaxRateAmount32": "State Tax Rate",
    "federalTaxRateAmount33": "Federal Tax Rate",
    "rawmaterialAmount34": "Feedstock Cost",
    "laborAmount35": "Labor Cost",
    "utilityAmount36": "Utility Cost",
    "maintenanceAmount37": "Maintenance Cost",
    "insuranceAmount38": "Insurance Cost",
    "vAmount40": "v40",
    "vAmount41": "v41",
    "vAmount42": "v42",
    "vAmount43": "v43",
    "vAmount44": "v44",
    "vAmount45": "v45",
    "vAmount46": "v46",
    "vAmount47": "v47",
    "vAmount48": "v48",
    "vAmount49": "v49",
    "vAmount50": "v50",
    "vAmount51": "v51",
    "vAmount52": "v52",
    "vAmount53": "v53",
    "vAmount54": "v54",
    "vAmount55": "v55",
    "vAmount56": "v56",
    "vAmount57": "v57",
    "vAmount58": "v58",
    "vAmount59": "v59",
    "rAmount60": "r60",
    "rAmount61": "r61",
    "rAmount62": "r62",
    "rAmount63": "r63",
    "rAmount64": "r64",
    "rAmount65": "r65",
    "rAmount66": "r66",
    "rAmount67": "r67",
    "rAmount68": "r68",
    "rAmount69": "r69",
    "rAmount70": "r70",
    "rAmount71": "r71",
    "rAmount72": "r72",
    "rAmount73": "r73",
    "rAmount74": "r74",
    "rAmount75": "r75",
    "rAmount76": "r76",
    "rAmount77": "r77",
    "rAmount78": "r78",
    "rAmount79": "r79",
}

def calculate_modified_value(original_value, mode, variation_value):
    """
    Calculate the modified value based on the variation mode and original value.

    Args:
        original_value (float): The original parameter value
        mode (str): The variation mode (percentage, directvalue, absolutedeparture)
        variation_value (float): The variation value

    Returns:
        float: The modified parameter value
    """
    if mode.lower() == 'percentage':
        # For percentage mode, apply percentage change
        return original_value * (1 + variation_value/100)
    elif mode.lower() == 'directvalue':
        # For direct value mode, use variation value directly
        return variation_value
    elif mode.lower() == 'absolutedeparture':
        # For absolute departure mode, add variation to the original value
        return original_value + variation_value
    elif mode.lower() == 'montecarlo':
        # For Monte Carlo mode, use percentage mode logic for now
        return original_value * (1 + variation_value/100)
    else:
        # Default to percentage mode for unknown modes
        return original_value * (1 + variation_value/100)

def format_value(value):
    """Format the value for display in axis labels"""
    if isinstance(value, float):
        # Format as currency for values over 100
        if abs(value) >= 100:
            return f"${value:,.0f}"
        # Format with 2 decimal places for smaller values
        return f"${value:.2f}"
    return str(value)

def get_property_key_for_s_param(s_param):
    """
    Dynamically determine the property key for an S parameter.

    Args:
        s_param (str): S parameter (e.g., "S34")

    Returns:
        str: Property key or None if not found
    """
    # Extract the number part of the S parameter
    match = re.match(r"S(\d+)", s_param)
    if not match:
        return None

    param_num = match.group(1)

    # Look for matching property keys
    for key in property_mapping.keys():
        if key.endswith(f"Amount{param_num}"):
            return key

    return None

def add_compare_to_key_label(s_param, compare_to_key, property_mapping, datapoints):
    """
    Generate a label for the compareToKey parameter.

    Args:
        s_param (str): The parameter ID (e.g. "S34")
        compare_to_key (str): The comparison key (e.g. "S13")
        property_mapping (dict): Dictionary of property names
        datapoints (dict): Datapoints dictionary

    Returns:
        str: The compareToKey label
    """
    # Get the property key for the compareToKey
    property_key = get_property_key_for_s_param(compare_to_key)
    if property_key is None or property_key not in property_mapping:
        return compare_to_key

    # Get the presentable name
    presentable_name = property_mapping[property_key]

    # Get baseline value if available
    combined_key = f"{s_param},{compare_to_key}"
    baseline_value = None

    if combined_key in datapoints:
        baseline_data = datapoints[combined_key].get("baseline", {})
        if baseline_data and len(baseline_data) > 0:
            baseline_key = next(iter(baseline_data))
            baseline_value = float(baseline_key)

    # If baseline value is available, include it in the label
    if baseline_value is not None:
        return f"{presentable_name} ({format_value(baseline_value)})"
    else:
        return presentable_name

def find_paths(version):
    """
    Find all required paths for the given version.

    Args:
        version (str): Version number

    Returns:
        dict: Dictionary of paths
    """
    # Try different possible locations for the codebase root
    possible_roots = [
        # Current directory method
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        # Hard-coded path as seen in the error
        r"C:\Users\Mohse\IdeaProjects2\codebase",
        # Alternative with backend included
        r"C:\Users\Mohse\IdeaProjects2\codebase\backend"
    ]

    paths = {}

    # Try each possible root until we find the calsen_paths.json file
    for root in possible_roots:
        test_path = os.path.join(root, "Original")

        test_calsen_path = os.path.join(
            test_path,
            f"Batch({version})",
            f"Results({version})",
            "Sensitivity",
            "Reports",
            "calsen_paths.json"
        )

        test_datapoints_path = os.path.join(
            test_path,
            f"Batch({version})",
            f"Results({version})",
            f"SensitivityPlotDatapoints_{version}.json"
        )

        if os.path.exists(test_calsen_path) and os.path.exists(test_datapoints_path):
            paths["code_files_path"] = test_path
            paths["calsen_paths_file"] = test_calsen_path
            paths["datapoints_file"] = test_datapoints_path
            paths["results_dir"] = os.path.join(test_path, f"Batch({version})", f"Results({version})")
            paths["sensitivity_dir"] = os.path.join(paths["results_dir"], "Sensitivity")
            print(f"Found required files at: {test_path}")
            return paths

    return None

def extract_metrics_from_economic_summary(version, selection_vector, paths):
    """
    Extract metrics from Economic Summary CSV files based on selection vector
    and append them to calsen_paths.json.

    Args:
        version (str): Version number
        selection_vector (list): Binary vector indicating which metrics to extract
        paths (dict): Dictionary of paths

    Returns:
        dict: Updated calsen_paths data
    """
    # Define metrics list for reference
    metrics_list = [
        'Internal Rate of Return',
        'Average Selling Price (Project Life Cycle)',
        'Total Overnight Cost (TOC)',
        'Average Annual Revenue',
        'Average Annual Operating Expenses',
        'Average Annual Depreciation',
        'Average Annual State Taxes',
        'Average Annual Federal Taxes',
        'Average Annual After-Tax Cash Flow',
        'Cumulative NPV',
        'Calculation Mode'
    ]

    # Use selection vector to determine which metrics to extract
    if not selection_vector or len(selection_vector) != len(metrics_list):
        # Default selection: Average Selling Price
        selection_vector = [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    # Load calsen_paths.json
    try:
        with open(paths["calsen_paths_file"], 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading calsen_paths.json: {e}")
        return None

    # Keep track of processed files
    processed_files = 0
    skipped_files = 0

    # Process each key in path_sets
    for s_param, param_data in data["path_sets"].items():
        # Process each variation
        for var_str, var_data in param_data["variations"].items():
            # Use the Econ_var_dir to locate Economic Summary file
            economic_summary_file = os.path.join(
                var_data["Econ_var_dir"],
                f"Economic_Summary({version}).csv"
            )

            # Check if file exists
            if not os.path.exists(economic_summary_file):
                print(f"Warning: File not found: {economic_summary_file}")
                skipped_files += 1
                continue

            # Read the CSV file
            try:
                with open(economic_summary_file, 'r', newline='') as csvfile:
                    reader = csv.reader(csvfile)
                    rows = list(reader)

                    # Extract selected metrics based on the selection vector
                    selected_metrics = {}
                    for i, selected in enumerate(selection_vector):
                        if selected == 1 and i < len(rows):
                            if len(rows[i]) >= 2:  # Ensure row has at least two columns
                                metric_name = rows[i][0]
                                metric_value = rows[i][1]
                                selected_metrics[metric_name] = metric_value

                    # Add selected metrics to the JSON
                    if selected_metrics:
                        var_data["metrics"] = selected_metrics
                        processed_files += 1

            except Exception as e:
                print(f"Error processing {economic_summary_file}: {e}")
                skipped_files += 1

    print(f"Extracted metrics: Processed {processed_files} files, skipped {skipped_files} files")
    return data

def add_axis_labels(version, data, paths):
    """
    Add axis labels to the JSON data.

    Args:
        version (str): Version number
        data (dict): JSON data to update
        paths (dict): Dictionary of paths

    Returns:
        dict: Updated JSON data
    """
    # Load datapoints file
    try:
        with open(paths["datapoints_file"], 'r') as f:
            datapoints = json.load(f)
    except Exception as e:
        print(f"Error loading datapoints file: {e}")
        return data

    # Keep track of processed parameters
    processed_params = 0
    skipped_params = 0

    # Process each key in path_sets
    for s_param, param_data in data["path_sets"].items():
        # Get the parameter name from mapping
        property_key = get_property_key_for_s_param(s_param)
        if property_key is None or property_key not in property_mapping:
            print(f"Warning: No property mapping found for {s_param}")
            skipped_params += 1
            continue

        # Get the presentable name
        presentable_name = property_mapping[property_key]

        # Get the compare to key
        compare_to_key = param_data.get("compareToKey", "S13")
        combined_key = f"{s_param},{compare_to_key}"

        # Get the mode
        mode = param_data["mode"]

        # Get baseline value from datapoints file
        baseline_value = None
        if combined_key in datapoints:
            baseline_data = datapoints[combined_key].get("baseline", {})
            if baseline_data and len(baseline_data) > 0:
                baseline_key = next(iter(baseline_data))
                baseline_value = float(baseline_key)
                print(f"Found baseline value {baseline_value} for {s_param}")

        if baseline_value is None:
            print(f"Warning: No baseline value found for {s_param}. Using fallback.")
            # Fallback value
            baseline_value = 1000

        # Create the variations list in the order they appear in the JSON
        variation_values = []

        # Get data points to determine the actual modified values
        data_points = {}
        if combined_key in datapoints:
            data_points = datapoints[combined_key].get("data", {})

        # We need to use the variations as defined in the path_sets, in their original order
        for var_str, var_data in param_data["variations"].items():
            variation_value = var_data["variation"]

            # Find the modified value in the datapoints or calculate it
            modified_value = None

            # Try to find in datapoints
            for point_key in data_points:
                # Convert both to float for comparison
                try:
                    calculated_value = calculate_modified_value(baseline_value, mode, variation_value)
                    point_value = float(point_key)
                    # Use a small epsilon for float comparison
                    if abs(calculated_value - point_value) < 0.001 * abs(point_value):
                        modified_value = point_value
                        break
                except (ValueError, TypeError):
                    continue

            # If not found, calculate it
            if modified_value is None:
                modified_value = calculate_modified_value(baseline_value, mode, variation_value)

            # Add to variations list
            variation_values.append(format_value(modified_value))

        # Create the axis label string without quotes
        axis_label = presentable_name + " (" + ", ".join(variation_values) + ")"

        # Add the compareToKey label
        compare_to_key_label = add_compare_to_key_label(s_param, compare_to_key, property_mapping, datapoints)

        # Add the labels to the parameter data
        ordered_keys = list(param_data.keys())
        compare_to_key_index = ordered_keys.index("compareToKey") if "compareToKey" in ordered_keys else 0

        # Create a new ordered dictionary with axisLabel and compareToKeyLabel inserted
        new_param_data = {}
        for i, key in enumerate(ordered_keys):
            if i == compare_to_key_index:
                new_param_data["axisLabel"] = axis_label
                new_param_data["compareToKeyLabel"] = compare_to_key_label
            new_param_data[key] = param_data[key]

        # Replace the original parameter data with the new one
        data["path_sets"][s_param] = new_param_data
        processed_params += 1
        print(f"Added axis labels for {s_param}: {axis_label}")

    print(f"Added axis labels: Processed {processed_params} parameters, skipped {skipped_params} parameters")
    return data

def generate_plots(version, data, paths):
    """
    Generate plots based on the JSON data.

    Args:
        version (str): Version number
        data (dict): JSON data with axis labels
        paths (dict): Dictionary of paths

    Returns:
        list: List of generated plot file paths
    """
    # Get SenParameters from payload
    sen_parameters = data["payload"]["SenParameters"]

    # Override all comparisonTypes to "primary (x axis)"
    for s_param, param_data in data["path_sets"].items():
        param_data["comparisonType"] = "primary (x axis)"

    # Load datapoints
    try:
        with open(paths["datapoints_file"], 'r') as f:
            datapoints = json.load(f)
    except Exception as e:
        print(f"Error loading datapoints file: {e}")
        return []

    # Special handling for S80, S89, and S13/S82
    special_mapping = {
        "S80": [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],  # Vector assignment for S80
        "S89": [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],  # Vector assignment for S89
        "S82": "S13"  # Treat S82 identical to S13
    }

    # Group parameters by their compareToKey
    param_groups = defaultdict(list)

    # Process parameters in order to track which one is first for each compareToKey
    for s_param, param_data in data["path_sets"].items():
        compare_to_key = param_data.get("compareToKey", "")

        # Handle special case for S82/S13
        if compare_to_key == "S82":
            compare_to_key = "S13"
            param_data["compareToKey"] = "S13"

        if compare_to_key:
            param_groups[compare_to_key].append(s_param)

    # Create a list of unique compareToKey values to maintain order
    compare_to_keys = list(param_groups.keys())

    # Initialize plot configurations
    plot_configs = []

    # For each compareToKey, initialize plot configurations
    for compare_to_key in compare_to_keys:
        group_params = param_groups[compare_to_key]

        # Sort to ensure consistent ordering
        group_params.sort()

        print(f"\nInitializing plot group for {compare_to_key}:")
        print(f"  Parameters: {', '.join(group_params)}")

        # Get plot types for these parameters
        for s_param in group_params:
            if s_param in sen_parameters:
                param_config = sen_parameters[s_param]

                # Process each plot type
                for plot_type in ["bar", "point", "waterfall"]:
                    if param_config.get(plot_type, False):
                        # Get mode from parameter data
                        mode = data["path_sets"][s_param].get("mode", "percentage")
                        mode_dir = mode.capitalize()
                        plot_type_dir = plot_type.capitalize()

                        # Create plot configuration
                        plot_config = {
                            "x_param": compare_to_key,
                            "y_param": s_param,
                            "plot_type": plot_type,
                            "mode": mode,
                            "mode_dir": mode_dir,
                            "plot_type_dir": plot_type_dir,
                            "output_dir": os.path.join(paths["sensitivity_dir"], mode_dir, plot_type_dir),
                            "axis_label": data["path_sets"][s_param].get("axisLabel", s_param),
                            "compare_to_key_label": data["path_sets"][s_param].get("compareToKeyLabel", compare_to_key),
                            "data_points": {}
                        }

                        # Get datapoints for this parameter combination
                        combined_key = f"{s_param},{compare_to_key}"
                        if combined_key in datapoints:
                            plot_config["baseline"] = datapoints[combined_key].get("baseline", {})
                            plot_config["variations"] = datapoints[combined_key].get("data", {})

                        plot_configs.append(plot_config)
                        print(f"  Initialized {plot_type} plot for {s_param} vs {compare_to_key}")

    # Create output directories
    for config in plot_configs:
        os.makedirs(config["output_dir"], exist_ok=True)

    # Generate plots
    generated_plots = []

    for config in plot_configs:
        # Extract x and y values from datapoints
        x_values = []
        y_values = []

        # Get the metrics for variations
        s_param = config["y_param"]
        variations = {}

        if s_param in data["path_sets"]:
            for var_str, var_data in data["path_sets"][s_param]["variations"].items():
                if "metrics" in var_data:
                    metric_value = None
                    for metric_name, value in var_data["metrics"].items():
                        # Use the first metric (Average Selling Price typically)
                        try:
                            # Remove $ and , from metric value
                            value_str = value.replace('$', '').replace(',', '')
                            if value_str.endswith('%'):
                                value_str = value_str[:-1]
                            metric_value = float(value_str)
                            break
                        except (ValueError, TypeError):
                            continue

                    if metric_value is not None:
                        # Get variation value and modified value
                        variation_value = var_data["variation"]
                        variations[variation_value] = metric_value

        # Process baseline and variations to get plot points
        if config["baseline"]:
            baseline_x = float(next(iter(config["baseline"].keys())))

            # Add baseline point
            if baseline_x is not None:
                # Find corresponding metric value
                baseline_y = None
                for var_value, metric_value in variations.items():
                    if var_value == 0:  # Baseline typically has variation 0
                        baseline_y = metric_value
                        break

                if baseline_y is not None:
                    x_values.append(baseline_x)
                    y_values.append(baseline_y)

        # Add variation points
        for x_str in config["variations"]:
            x_val = float(x_str)

            # Find corresponding metric value
            y_val = None
            for var_value, metric_value in variations.items():
                # Calculate the modified value based on baseline and variation
                if config["baseline"]:
                    baseline_x = float(next(iter(config["baseline"].keys())))
                    modified_value = calculate_modified_value(baseline_x, config["mode"], var_value)

                    # If this modified value matches the x value
                    if abs(modified_value - x_val) < 0.001 * abs(x_val):
                        y_val = metric_value
                        break

            if y_val is not None:
                x_values.append(x_val)
                y_values.append(y_val)

        # Sort points by x value
        if x_values and y_values:
            points = sorted(zip(x_values, y_values), key=lambda p: p[0])
            x_values = [p[0] for p in points]
            y_values = [p[1] for p in points]

            # Create plot
            plt.figure(figsize=(10, 6))

            if config["plot_type"] == "bar":
                # Create bar plot
                bars = plt.bar(range(len(x_values)), y_values, color='skyblue', edgecolor='navy')

                # Set x-ticks at proper positions with formatted x values
                plt.xticks(range(len(x_values)), [format_value(x) for x in x_values], rotation=45, ha='right')

                # Add value labels on top of bars
                for i, bar in enumerate(bars):
                    plt.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.02 * max(y_values),
                             f'{y_values[i]:.2f}', ha='center', va='bottom', fontweight='bold')

            elif config["plot_type"] == "waterfall":
                # Calculate differences for waterfall
                diffs = [y_values[0]] + [y_values[i] - y_values[i-1] for i in range(1, len(y_values))]
                bottom = np.zeros(len(diffs))
                for i in range(1, len(diffs)):
                    bottom[i] = bottom[i-1] + diffs[i-1]

                # Use different colors for positive and negative values
                colors = ['green' if diff >= 0 else 'red' for diff in diffs]
                bars = plt.bar(range(len(x_values)), diffs, bottom=bottom, color=colors, edgecolor='black')

                # Set x-ticks with proper labels
                plt.xticks(range(len(x_values)), [format_value(x) for x in x_values], rotation=45, ha='right')

                # Add value labels
                for i, bar in enumerate(bars):
                    yval = bottom[i] + diffs[i]
                    plt.text(bar.get_x() + bar.get_width()/2., yval + 0.02 * max(y_values),
                             f'{yval:.2f}', ha='center', va='bottom', fontweight='bold')

            else:  # Default to point/line plot
                # Create line plot with markers
                plt.plot(x_values, y_values, 'o-', markersize=8, linewidth=2, color='blue')

                # Set x-ticks at data points
                plt.xticks(x_values, [format_value(x) for x in x_values], rotation=45, ha='right')

                # Add data point labels
                for i, (x, y) in enumerate(zip(x_values, y_values)):
                    plt.annotate(f'{y:.2f}', xy=(x, y), xytext=(0, 10),
                                 textcoords='offset points', ha='center', va='bottom',
                                 fontweight='bold', bbox=dict(boxstyle='round,pad=0.3', fc='yellow', alpha=0.5))

            # Format y-axis ticks with dollar signs if appropriate
            plt.gca().yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'${x:.2f}'))

            # Set labels with clear, descriptive text
            plt.xlabel(config["compare_to_key_label"], fontsize=12, fontweight='bold')
            plt.ylabel(config["axis_label"].split(" (")[0], fontsize=12, fontweight='bold')

            # Create a descriptive title combining parameter names and plot type
            title_parts = []
            title_parts.append(f"{config['plot_type'].capitalize()} Plot")
            title_parts.append(config["axis_label"].split(" (")[0])  # Parameter name without variations
            title_parts.append(f"vs {config['compare_to_key_label'].split(' (')[0]}")

            plt.title(" - ".join(title_parts), fontsize=14, fontweight='bold')

            # Add grid for better readability
            plt.grid(True, linestyle='--', alpha=0.7)

            # Ensure proper margins
            plt.subplots_adjust(bottom=0.15, left=0.15)

            # Add a legend if there are multiple datasets (for future expansion)
            # plt.legend()

            # Save plot
            plot_file_name = f"{config['y_param']}_{config['x_param']}_{config['plot_type']}.png"
            plot_file_path = os.path.join(config["output_dir"], plot_file_name)

            plt.savefig(plot_file_path, dpi=300, bbox_inches='tight')
            plt.close()

            generated_plots.append(plot_file_path)
            print(f"  Generated plot: {plot_file_path}")

    print(f"\nPlot generation complete. Created {len(generated_plots)} plot files.")
    return generated_plots

def save_updated_data(data, paths):
    """
    Save the updated JSON data.

    Args:
        data (dict): JSON data to save
        paths (dict): Dictionary of paths

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        with open(paths["calsen_paths_file"], 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Successfully saved updated JSON to {paths['calsen_paths_file']}")
        return True
    except Exception as e:
        print(f"Error saving JSON: {e}")
        return False

def run_sensitivity_visualization(version, selection_vector=None):
    """
    Main function to run the sensitivity visualization pipeline.

    Args:
        version (str): Version number
        selection_vector (list, optional): Binary vector for metric selection

    Returns:
        bool: True if successful, False otherwise
    """
    # Find all required paths
    paths = find_paths(version)
    if not paths:
        print("Error: Could not find required files")
        return False

    # Extract metrics from Economic Summary CSV files
    data = extract_metrics_from_economic_summary(version, selection_vector, paths)
    if not data:
        print("Error: Failed to extract metrics")
        return False

    # Add axis labels to JSON data
    data = add_axis_labels(version, data, paths)

    # Save updated JSON data
    if not save_updated_data(data, paths):
        print("Error: Failed to save updated JSON data")
        return False

    # Generate plots
    generated_plots = generate_plots(version, data, paths)

    return len(generated_plots) > 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run sensitivity visualization pipeline')
    parser.add_argument('version', type=str, help='Version number (e.g. "4")')
    parser.add_argument('--vector', type=str, help='Comma-separated binary selection vector (e.g. "1,0,1,0,0,0,0,0,0,0,0")')

    args = parser.parse_args()

    # Process selection vector if provided
    selection_vector = None
    if args.vector:
        try:
            selection_vector = [int(x.strip()) for x in args.vector.split(',')]
            # Validate each element is 0 or 1
            for val in selection_vector:
                if val not in [0, 1]:
                    raise ValueError(f"Invalid value in selection vector: {val}")
        except ValueError as e:
            print(f"Error parsing selection vector: {e}")
            sys.exit(1)

    # Run the pipeline
    success = run_sensitivity_visualization(args.version, selection_vector)

    if success:
        print("Sensitivity visualization pipeline completed successfully")
        sys.exit(0)
    else:
        print("Sensitivity visualization pipeline failed")
        sys.exit(1)