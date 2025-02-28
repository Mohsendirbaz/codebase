import json
import os
import pandas as pd
import numpy as np
import sys
import importlib.util
import logging
import logging.config
import time
import threading
import traceback
from datetime import datetime

# Import custom modules for plotting and economic summary
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from Visualization_generators.cfa_plotting import (
    generate_economic_breakdown_pie_chart,
    generate_operational_cost_pie_chart_dynamic,
    generate_operational_cost_pie_chart_static
)
from Data_processors_and_transformers.economic_summary import generate_economic_summary

# ---------------- Logging Setup Block Start ----------------

# Set up logging for CFA calculations
log_directory = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Logs")
os.makedirs(log_directory, exist_ok=True)
log_file_path = os.path.join(log_directory, 'CFA_CALC.log')

# Configure logging to focus on critical calculation steps
logging.basicConfig(
    filename=log_file_path,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s: %(message)s',
    filemode='a'
)

# Create a separate logger for price optimization
price_logger = logging.getLogger("price_optimization")
price_logger.setLevel(logging.INFO)
price_handler = logging.FileHandler(log_file_path)
price_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s: %(message)s'))
price_logger.addHandler(price_handler)

# Ensure logs are immediately written to file
logging.getLogger().handlers[0].flush()
price_logger.handlers[0].flush()

# Log script startup
logging.info("=" * 80)
logging.info("CFA CALCULATION SCRIPT STARTED")
logging.info("=" * 80)
price_logger.info("Price optimization module initialized")

# ---------------- Logging Setup Block End ----------------


# ---------------- Utility Function Block Start ----------------

# Function to remove existing files
def remove_existing_file(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)
        logging.debug(f"Removed existing file: {file_path}")
    else:
        logging.debug(f"No existing file to remove: {file_path}")

# ---------------- Utility Function Block End ----------------


# ---------------- Revenue and Expense Calculation Block Start ----------------

# Function to calculate annual revenue
def calculate_annual_revenue(numberOfUnitsAmount12, initialSellingPriceAmount13, generalInflationRateAmount23, years, construction_years):
    revenue = [0] * construction_years + [
        int(numberOfUnitsAmount12 * initialSellingPriceAmount13 * (1 + generalInflationRateAmount23)) 
        for year in range(construction_years, years)
    ]
    return revenue


def calculate_annual_operating_expenses(
    use_direct_operating_expensesAmount18, 
    totalOperatingCostPercentageAmount14, 
    variable_costsAmount4, 
    amounts_per_unitAmount5, 
    MaterialInventory, 
    Labor, 
    utility, 
    maintenance_amount, 
    insurance_amount, 
    annual_revenue, 
    generalInflationRateAmount23, 
    years, 
    construction_years, 
    selected_v, 
    selected_f
):
    

    # List of fixed costs (corresponding to selected_f)
    fixed_costs = [MaterialInventory, Labor, utility, maintenance_amount, insurance_amount]

    # Filter variable costs and amounts per unit based on selected_v
    # If 'off', set corresponding value to 0
    variable_costs_filtered = [
        round(cost * (1 + generalInflationRateAmount23)) if selected_v.get(f'V{i+1}') == 'on' else 0
        for i, cost in enumerate(variable_costsAmount4)
    ]
    amounts_per_unit_filtered = [
        amount if selected_v.get(f'V{i+1}') == 'on' else 0 for i, amount in enumerate(amounts_per_unitAmount5)
    ]

    # Filter fixed costs based on selected_f
    # If 'off', set corresponding value to 0
    fixed_costs_filtered = [
    round(cost * (1 + generalInflationRateAmount23)) if selected_f.get(f'F{i+1}') == 'on' else 0
    for i, cost in enumerate(fixed_costs)
]

    # Calculate total fixed cost
    total_fixed_cost = sum(fixed_costs_filtered)

    # Calculate expenses based on method
    if use_direct_operating_expensesAmount18:
        logging.info("Using direct operating expenses calculation")
        expenses = [0] * construction_years + [
            int(totalOperatingCostPercentageAmount14 * revenue) for revenue in annual_revenue[construction_years:]
        ]
    else:
        logging.info("Using indirect operating expenses calculation")
        annual_variable_cost = np.sum([
            cost * amount for cost, amount in zip(variable_costs_filtered, amounts_per_unit_filtered)
        ])
        expenses = [0] * construction_years + [
            int((annual_variable_cost + total_fixed_cost) * (1 + generalInflationRateAmount23)) 
            for year in range(construction_years, years)
        ]

    return expenses, variable_costs_filtered, fixed_costs_filtered


# ---------------- Revenue and Expense Calculation Block End ----------------

# ---------------- Opex Table Generation Functions ----------------

# Helper function to pad or trim costs
def pad_or_trim(costs, target_length):
    if len(costs) < target_length:
        return costs + [0] * (target_length - len(costs))
    return costs[:target_length]


# ---------------- OPEX Generation Block (Three Tables) ----------------

def generate_fixed_opex_table(fixed_costs_results, plant_lifetime):
    columns = ['Year', 'F1', 'F2', 'F3', 'F4', 'F5']
    fixed_opex_table = pd.DataFrame(0, index=range(plant_lifetime), columns=columns)
    fixed_opex_table['Year'] = range(1, plant_lifetime + 1)

    for (start_year, end_year), fixed_costs in fixed_costs_results.items():
        fixed_costs = pad_or_trim(fixed_costs, 5)
        for year in range(start_year, end_year + 1):
            year_idx = year - 1
            if 0 <= year_idx < plant_lifetime:
                fixed_opex_table.loc[year_idx, 'F1':'F5'] = fixed_costs

    return fixed_opex_table

def generate_variable_opex_table(variable_costs_results, plant_lifetime):
    columns = ['Year', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10']
    variable_opex_table = pd.DataFrame(0, index=range(plant_lifetime), columns=columns)
    variable_opex_table['Year'] = range(1, plant_lifetime + 1)

    for (start_year, end_year), variable_costs in variable_costs_results.items():
        variable_costs = pad_or_trim(variable_costs, 10)
        for year in range(start_year, end_year + 1):
            year_idx = year - 1
            if 0 <= year_idx < plant_lifetime:
                variable_opex_table.loc[year_idx, 'V1':'V10'] = variable_costs

    return variable_opex_table

def generate_cumulative_opex_table(fixed_costs_results, variable_costs_results, expenses_results, plant_lifetime):
    columns = ['Year', 'F1', 'F2', 'F3', 'F4', 'F5', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10','Operating Expenses']
    cumulative_opex_table = pd.DataFrame(0, index=range(plant_lifetime), columns=columns)
    cumulative_opex_table['Year'] = range(1, plant_lifetime + 1)

    for (start_year, end_year), fixed_costs in fixed_costs_results.items():
        fixed_costs = pad_or_trim(fixed_costs, 5)
        for year in range(start_year, end_year + 1):
            year_idx = year - 1
            if 0 <= year_idx < plant_lifetime:
                cumulative_opex_table.loc[year_idx, 'F1':'F5'] = fixed_costs

    for (start_year, end_year), variable_costs in variable_costs_results.items():
        variable_costs = pad_or_trim(variable_costs, 10)
        for year in range(start_year, end_year + 1):
            year_idx = year - 1
            if 0 <= year_idx < plant_lifetime:
                cumulative_opex_table.loc[year_idx, 'V1':'V10'] = variable_costs

    for (start_year, end_year), expenses in expenses_results.items():
        for year in range(start_year, end_year + 1):
            year_idx = year - 1
            if 0 <= year_idx < plant_lifetime:
                cumulative_opex_table.loc[year_idx, 'Operating Expenses'] = expenses[year - start_year]

    return cumulative_opex_table

def save_opex_tables(fixed_costs_results, variable_costs_results, expenses_results, plant_lifetime, results_folder, version):
    fixed_opex_table = generate_fixed_opex_table(fixed_costs_results, plant_lifetime)
    variable_opex_table = generate_variable_opex_table(variable_costs_results, plant_lifetime)
    cumulative_opex_table = generate_cumulative_opex_table(fixed_costs_results, variable_costs_results, expenses_results, plant_lifetime)

    fixed_opex_table.to_csv(os.path.join(results_folder, f"Fixed_Opex_Table_({version}).csv"), index=False)
    variable_opex_table.to_csv(os.path.join(results_folder, f"Variable_Opex_Table_({version}).csv"), index=False)
    cumulative_opex_table.to_csv(os.path.join(results_folder, f"Cumulative_Opex_Table_({version}).csv"), index=False)


# Function to calculate state tax
def calculate_state_tax(revenue, stateTaxRateAmount32, operating_expenses, depreciation):
    taxable_income = revenue - operating_expenses - depreciation
    tax = max(taxable_income, 0) * stateTaxRateAmount32
  
    return tax

# Function to calculate federal tax
def calculate_federal_tax(revenue, federalTaxRateAmount33, operating_expenses, depreciation):
    taxable_income = revenue - operating_expenses - depreciation
    tax = max(taxable_income, 0) * federalTaxRateAmount33
   
    return tax

# ---------------- Tax Calculation Block End ----------------


# ---------------- Config Module Handling Block Start ----------------

# Function to read the config module from a JSON file
def read_config_module(file_path):
    with open(file_path, 'r') as f:
        return json.load(f)

# ---------------- Config Module Handling Block End ----------------


# ---------------- Price Optimization Status Tracking Block Start ----------------

def initialize_optimization_status_file(version, target_row, tolerance_lower, tolerance_upper, increase_rate, decrease_rate):
    """
    Initialize the price optimization status file at the beginning of the process.
    
    Parameters:
    - version: The batch version number
    - target_row: The row at which NPV should be zeroed
    - tolerance_lower: Lower bound of acceptable NPV
    - tolerance_upper: Upper bound of acceptable NPV
    - increase_rate: Rate at which to increase price when NPV is too low
    - decrease_rate: Rate at which to decrease price when NPV is too high
    
    Returns:
    - status_file_path: Path to the created status file
    """
    # Enhanced logging for debugging
    logging.info("=" * 80)
    logging.info("INITIALIZING PRICE OPTIMIZATION STATUS FILE")
    logging.info(f"Version: {version}, Target Row: {target_row}")
    logging.info(f"Tolerance: Lower={tolerance_lower}, Upper={tolerance_upper}")
    logging.info(f"Adjustment Rates: Increase={increase_rate}, Decrease={decrease_rate}")
    
    # Ensure path exists
    code_files_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backend", "Original")
    results_folder = os.path.join(code_files_path, f"Batch({version})", f"Results({version})")
    
    logging.info(f"Results folder path: {results_folder}")
    
    # Create directory if it doesn't exist
    try:
        os.makedirs(results_folder, exist_ok=True)
        logging.info(f"Ensured results folder exists: {results_folder}")
    except Exception as e:
        logging.error(f"Failed to create results folder: {str(e)}")
        logging.error(traceback.format_exc())
    
    # Create status file path
    status_file_path = os.path.join(results_folder, f"price_optimization_status_{version}.json")
    logging.info(f"Status file path: {status_file_path}")
    
    # Initial status data
    status_data = {
        "version": version,
        "target_row": target_row,
        "tolerance_lower": tolerance_lower,
        "tolerance_upper": tolerance_upper,
        "increase_rate": increase_rate,
        "decrease_rate": decrease_rate,
        "start_time": datetime.now().isoformat(),
        "current_price": None,
        "current_npv": None,
        "iteration": 0,
        "iterations": [],
        "complete": False,
        "success": False,
        "error": None,
        "last_updated": datetime.now().isoformat()
    }
    
    try:
        with open(status_file_path, 'w') as f:
            json.dump(status_data, f, indent=2)
        logging.info(f"Successfully created price optimization status file: {status_file_path}")
        
        # Verify file was created
        if os.path.exists(status_file_path):
            file_size = os.path.getsize(status_file_path)
            logging.info(f"Verified file exists: {status_file_path} (Size: {file_size} bytes)")
        else:
            logging.error(f"File creation verification failed: {status_file_path} does not exist")
    except Exception as e:
        logging.error(f"Failed to create price optimization status file: {str(e)}")
        logging.error(traceback.format_exc())
    
    # Ensure logs are immediately written to file
    logging.getLogger().handlers[0].flush()
    if hasattr(price_logger, 'handlers') and price_logger.handlers:
        price_logger.handlers[0].flush()
    
    return status_file_path

def update_optimization_status(status_file_path, price=None, npv=None, iteration=None, 
                              complete=None, success=None, error=None):
    """
    Update the price optimization status file with new information.
    
    Parameters:
    - status_file_path: Path to the status file
    - price: Current price being tested
    - npv: Current NPV result
    - iteration: Current iteration number
    - complete: Whether optimization is complete
    - success: Whether optimization was successful
    - error: Any error message
    """
    if not os.path.exists(status_file_path):
        logging.error(f"Status file does not exist: {status_file_path}")
        return
    
    try:
        # Load current status
        with open(status_file_path, 'r') as f:
            status_data = json.load(f)
        
        # Update fields
        update_time = datetime.now().isoformat()
        status_data["last_updated"] = update_time
        
        if price is not None:
            status_data["current_price"] = price
        
        if npv is not None:
            status_data["current_npv"] = npv
        
        if iteration is not None:
            status_data["iteration"] = iteration
            # Add to iterations history
            status_data["iterations"].append({
                "iteration": iteration,
                "price": price,
                "npv": npv,
                "timestamp": update_time
            })
        
        if complete is not None:
            status_data["complete"] = complete
        
        if success is not None:
            status_data["success"] = success
        
        if error is not None:
            status_data["error"] = error
        
        # Write updated status
        with open(status_file_path, 'w') as f:
            json.dump(status_data, f, indent=2)
            
        # Also log to the standard log file
        if price is not None and npv is not None:
            price_logger.info(f"Iteration {iteration}: Price ${price:.2f}, NPV ${npv:.2f}")
            
    except Exception as e:
        logging.error(f"Failed to update price optimization status: {str(e)}")
        logging.error(traceback.format_exc())

# ---------------- Price Optimization Status Tracking Block End ----------------

# ---------------- Price Optimization Function Block Start ----------------
def optimize_price(version, config_received, config_matrix_df, results_folder, selected_v, selected_f, 
                  target_row, tolerance_lower=-1000, tolerance_upper=1000, 
                  increase_rate=1.02, decrease_rate=0.985):
    """
    Iteratively finds the optimal selling price that brings the NPV at target_row close to zero.
    
    Parameters:
    - version: Batch version
    - config_received: Configuration object
    - config_matrix_df: Configuration matrix dataframe
    - results_folder: Folder to store results
    - selected_v: Dictionary of selected variable costs
    - selected_f: Dictionary of selected fixed costs
    - target_row: Row at which NPV should be zeroed
    - tolerance_lower: Lower bound of acceptable NPV
    - tolerance_upper: Upper bound of acceptable NPV
    - increase_rate: Rate at which to increase price when NPV is too low
    - decrease_rate: Rate at which to decrease price when NPV is too high
    
    Returns:
    - final_price: The optimized selling price
    """
    # Initialize status tracking
    status_file_path = initialize_optimization_status_file(
        version, target_row, tolerance_lower, tolerance_upper, increase_rate, decrease_rate
    )
    
    # Log start of price optimization
    logging.info(f"Starting price optimization for version {version}")
    logging.info(f"Target row: {target_row}, Tolerance: {tolerance_lower} to {tolerance_upper}")
    logging.info(f"Adjustment rates: Increase {increase_rate}, Decrease {decrease_rate}")
    price_logger.info(f"Starting price optimization for version {version}")
    
    # Get the initial selling price from the first config module
    first_config_module_file = os.path.join(results_folder, f"{version}_config_module_1.json")
    
    try:
        with open(first_config_module_file, 'r') as f:
            first_config_module = json.load(f)
        price = first_config_module['initialSellingPriceAmount13']
        logging.info(f"Initial selling price: ${price:.2f}")
    except Exception as e:
        error_msg = f"Failed to read initial selling price: {str(e)}"
        logging.error(error_msg)
        update_optimization_status(status_file_path, error=error_msg, complete=True, success=False)
        raise ValueError(error_msg)
    
    # Initialize variables for the optimization loop
    iteration = 0
    npv = None
    max_iterations = 100  # Safety limit
    price_history = []
    
    # Update status with initial price
    update_optimization_status(status_file_path, price=price, iteration=iteration)
    
    # Start optimization loop
    while iteration < max_iterations:
        iteration += 1
        price_history.append(price)
        
        logging.info(f"Iteration {iteration}: Testing price ${price:.2f}")
        
        try:
            # Calculate NPV using current price
            result = calculate_revenue_and_expenses_from_modules(
                config_received, config_matrix_df, results_folder, version,
                selected_v, selected_f, price, target_row, iteration
            )
            
            if result is None:
                error_msg = "Calculation returned None result"
                logging.error(error_msg)
                update_optimization_status(status_file_path, price=price, error=error_msg, 
                                         complete=True, success=False, iteration=iteration)
                break
            
            npv = result['primary_result']
            logging.info(f"Iteration {iteration}: NPV = ${npv:.2f}")
            
            # Update status with current results
            update_optimization_status(status_file_path, price=price, npv=npv, iteration=iteration)
            
            # Check if NPV is within tolerance bounds
            if tolerance_lower <= npv <= tolerance_upper:
                logging.info(f"Optimal price found: ${price:.2f} with NPV ${npv:.2f}")
                price_logger.info(f"Optimal price found: ${price:.2f} with NPV ${npv:.2f}")
                update_optimization_status(status_file_path, price=price, npv=npv, 
                                         complete=True, success=True, iteration=iteration)
                break
            
            # Adjust price based on NPV
            old_price = price
            if npv < tolerance_lower:
                # NPV too low, increase price
                price = price * increase_rate
                logging.info(f"NPV too low (${npv:.2f}), increasing price from ${old_price:.2f} to ${price:.2f}")
            else:
                # NPV too high, decrease price
                price = price * decrease_rate
                logging.info(f"NPV too high (${npv:.2f}), decreasing price from ${old_price:.2f} to ${price:.2f}")
            
            # Check for oscillation (if we've seen this price before)
            if len(price_history) > 3 and any(abs(price - hist_price) < 0.01 for hist_price in price_history[:-1]):
                logging.warning(f"Price oscillation detected at ${price:.2f}, adjusting approach")
                # Use a more conservative adjustment
                if npv < tolerance_lower:
                    price = old_price * (1 + (increase_rate - 1) / 2)
                else:
                    price = old_price * (1 - (1 - decrease_rate) / 2)
            
            # Round to 2 decimal places
            price = round(price, 2)
            
        except Exception as e:
            error_msg = f"Error in price optimization iteration {iteration}: {str(e)}"
            logging.error(error_msg)
            logging.error(traceback.format_exc())
            price_logger.error(error_msg)
            update_optimization_status(status_file_path, price=price, error=error_msg, 
                                     complete=True, success=False, iteration=iteration)
            raise
    
    # Check if we reached max iterations
    if iteration >= max_iterations:
        logging.warning(f"Reached maximum iterations ({max_iterations}) without convergence")
        price_logger.warning(f"Reached maximum iterations ({max_iterations}) without convergence")
        update_optimization_status(status_file_path, price=price, npv=npv, complete=True, 
                                 success=False, error="Reached maximum iterations", iteration=iteration)
    
    # Save the final price to a dedicated file for easy retrieval
    price_file_path = os.path.join(results_folder, f"optimal_price_{version}.json")
    try:
        with open(price_file_path, 'w') as f:
            json.dump({"price": price, "npv": npv}, f)
        logging.info(f"Saved optimal price to {price_file_path}")
    except Exception as e:
        logging.error(f"Failed to save optimal price file: {str(e)}")
    
    return price

# ---------------- Price Optimization Function Block End ----------------

# ---------------- Revenue and Expense Calculation from Config Block Start ----------------

def calculate_revenue_and_expenses_from_modules(config_received, config_matrix_df, results_folder, version, selected_v, selected_f, price=None, target_row=None, iteration=0, selected_calculation_option=None):
    # Add this near the beginning of the function
    if price is not None and target_row is not None:
        logging.info(f"Running calculation with price ${price:.2f} for target row {target_row}, iteration {iteration}")
    
    # Extract parameters
    plant_lifetime = config_received.plantLifetimeAmount10
    construction_years = config_received.numberofconstructionYearsAmount28

    BEC = config_received.bECAmount11
    EPC = config_received.engineering_Procurement_and_Construction_EPC_Amount15 
    PC = config_received.process_contingency_PC_Amount16
    PT = config_received.project_Contingency_PT_BEC_EPC_PCAmount17

    TOC = BEC + EPC * BEC + PC * (BEC + EPC * BEC) + PT * (BEC + EPC * BEC + PC * (BEC + EPC * BEC))

    logging.info(f"TOC calculated: ${TOC:,.2f}")

    CFA_matrix = pd.DataFrame(np.zeros(((plant_lifetime + construction_years), 10)),
                              columns=['Year', 'Revenue', 'Operating Expenses', 'Loan', 'Depreciation', 'State Taxes', 'Federal Taxes', 'After-Tax Cash Flow','Discounted Cash Flow' ,'Cumulative Cash Flow'])
    CFA_matrix['Year'] = range(1, len(CFA_matrix) + 1)

    # Complete set for CFA matrix
    revenue_results = {}
    expenses_results = {}
    fixed_costs_results = {}
    variable_costs_results = {}

    # Operational set for OPEX (without construction years)
    revenue_operational = {}
    expenses_operational = {}
    fixed_costs_operational = {}
    variable_costs_operational = {}
    module_selling_price_operational = {}

    # Initialize dictionaries for each cost component
    feedstock_cost_operational = {}
    labor_cost_operational = {}
    utility_cost_operational = {}
    maintenance_cost_operational = {}
    insurance_cost_operational = {}

    # Iterate through the config matrix
    for idx, row in config_matrix_df.iterrows():
        start_year = int(row['start']) + construction_years
        end_year = int(row['end']) + construction_years
        length = int(row['end']) - int(row['start']) + 1
        config_module_file = os.path.join(results_folder, f"{version}_config_module_{row['start']}.json")
        if not os.path.exists(config_module_file):
            logging.error(f"Missing config module for year {row['start']}")
            continue

        config_module = read_config_module(config_module_file)

        # Determine which price to use based on target_row
        if price is not None and target_row is not None:
            if int(row['start'])+1 > target_row:
                # Use the initial selling price if the period is after the target row
                selling_price = config_module['initialSellingPriceAmount13']
                logging.info(f"Using initial selling price ${selling_price:.2f} for period {row['start']}-{row['end']}")
            else:
                # Use the calculated price if the period is before or at the target row
                selling_price = price
                logging.info(f"Using calculated price ${price:.2f} for period {row['start']}-{row['end']}")
        else:
            # Default to initial selling price if no price or target_row provided
            selling_price = config_module['initialSellingPriceAmount13']

        annual_revenue = calculate_annual_revenue(
            config_module['numberOfUnitsAmount12'],
            selling_price,
            config_module['generalInflationRateAmount23'],
            plant_lifetime + construction_years,
            construction_years
        )

        annual_operating_expenses, variable_costs, fixed_costs = calculate_annual_operating_expenses(
            config_module['use_direct_operating_expensesAmount18'],
            config_module['totalOperatingCostPercentageAmount14'],
            config_module['variable_costsAmount4'],
            config_module['amounts_per_unitAmount5'],
            config_module['rawmaterialAmount34'],
            config_module['laborAmount35'],
            config_module['utilityAmount36'],
            config_module['maintenanceAmount37'],
            config_module['insuranceAmount38'],
            annual_revenue,
            config_module['generalInflationRateAmount23'],
            plant_lifetime + construction_years,
            construction_years,
            selected_v,
            selected_f
        )
        adjusted_length_calculation = length - 1
        # Store individual cost components for each row
        feedstock_cost_operational[idx] = config_module['rawmaterialAmount34'] * max(adjusted_length_calculation, 1)
        labor_cost_operational[idx] = config_module['laborAmount35'] * max(adjusted_length_calculation, 1)
        utility_cost_operational[idx] = config_module['utilityAmount36'] * max(adjusted_length_calculation, 1)
        maintenance_cost_operational[idx] = config_module['maintenanceAmount37'] * max(adjusted_length_calculation, 1)
        insurance_cost_operational[idx] = config_module['insuranceAmount38'] * max(adjusted_length_calculation, 1)
        # Store module selling price for each row
        module_selling_price_operational[idx] = selling_price * max(adjusted_length_calculation, 1)
        
        # Calculate running averages for each cost component
        average_feedstock_cost_operational = sum(feedstock_cost_operational.values()) / (idx + 1)
        average_labor_cost_operational = sum(labor_cost_operational.values()) / (idx + 1)
        average_utility_cost_operational = sum(utility_cost_operational.values()) / (idx + 1)
        average_maintenance_cost_operational = sum(maintenance_cost_operational.values()) / (idx + 1)
        average_insurance_cost_operational = sum(insurance_cost_operational.values()) / (idx + 1)
        average_selling_price_operational = sum(module_selling_price_operational.values()) / (idx + 1)
        
        # Store for CFA
        revenue_results[(start_year, end_year)] = annual_revenue
        expenses_results[(start_year, end_year)] = annual_operating_expenses
        fixed_costs_results[(start_year, end_year)] = fixed_costs
        variable_costs_results[(start_year, end_year)] = variable_costs

        # Store for OPEX
        operational_start_year = int(row['start'])
        operational_end_year = int(row['end'])

        revenue_operational[(operational_start_year, operational_end_year)] = annual_revenue[construction_years:]
        expenses_operational[(operational_start_year, operational_end_year)] = annual_operating_expenses[construction_years:]
        fixed_costs_operational[(operational_start_year, operational_end_year)] = fixed_costs
        variable_costs_operational[(operational_start_year, operational_end_year)] = variable_costs

    # Save OPEX tables
    save_opex_tables(fixed_costs_operational, variable_costs_operational, expenses_operational, plant_lifetime, results_folder, version)

    # Populate CFA matrix
    for idx, row in config_matrix_df.iterrows():
        start_year = int(row['start']) + construction_years
        end_year = int(row['end']) + construction_years

        annual_revenue = revenue_results.get((start_year, end_year), [])
        annual_operating_expenses = expenses_results.get((start_year, end_year), [])

        for year in range(start_year, end_year + 1):
            cfa_year = year
            if year < len(annual_revenue):
                CFA_matrix.at[cfa_year, 'Revenue'] = annual_revenue[year]
            if year < len(annual_operating_expenses):
                CFA_matrix.at[cfa_year, 'Operating Expenses'] = annual_operating_expenses[year]

    # Save CFA matrix
    CFA_matrix_file = os.path.join(results_folder, f"CFA({version}).csv")
    remove_existing_file(CFA_matrix_file)
    CFA_matrix.to_csv(CFA_matrix_file, index=False)
  


    # Second loop to place results in the correct places in the CFA matrix
    for idx, row in config_matrix_df.iterrows():
        start_year = int(row['start']) + construction_years
        end_year = int(row['end']) + construction_years
        length = int(row['length'])
      
        # Get the results for the current interval
        annual_revenue = revenue_results.get((start_year, end_year), [])
       
        annual_operating_expenses = expenses_results.get((start_year, end_year), [])

        # Update the CFA matrix with annual revenue and expenses
        for year in range(start_year, end_year + 1):
            cfa_year = year-1
           
            if year < len(annual_revenue):
             
                CFA_matrix.at[cfa_year, 'Revenue'] = annual_revenue[year]
         
            if year < len(annual_operating_expenses):
                CFA_matrix.at[cfa_year, 'Operating Expenses'] = annual_operating_expenses[year]

    # ---------------- Construction Year Handling Block Start ----------------

    # Populate the CFA matrix for construction years
    cumulative_cash_flow = 0
    for year in range(construction_years):
        operating_expenses = -TOC / construction_years
        CFA_matrix.loc[year, 'Operating Expenses'] = operating_expenses
        CFA_matrix.loc[year, 'Cumulative Cash Flow'] = cumulative_cash_flow + operating_expenses
        cumulative_cash_flow += operating_expenses

    # ---------------- Construction Year Handling Block End ----------------


    # ---------------- Tax Exemption and Depreciation Calculation Block Start ----------------

    # Create a matrix for distance from paying taxes with appropriate data types
    distance_matrix = pd.DataFrame({
        'Potentially Taxable Income': [0] * len(CFA_matrix),
        'Fraction of TOC': [0.0] * len(CFA_matrix)  # Use float type for this column
    })

    # Calculate the difference (revenue - operating expenses) and (revenue - operating expenses)/TOC
    for i in range(construction_years, len(CFA_matrix)):
        revenue = CFA_matrix.at[i, 'Revenue']
        operating_expenses = CFA_matrix.at[i, 'Operating Expenses']
        distance_matrix.at[i, 'Potentially Taxable Income'] = revenue - operating_expenses
        distance_matrix.at[i, 'Fraction of TOC'] = round((revenue - operating_expenses) / TOC, 9)

    # Save the distance matrix
    distance_matrix_file = os.path.join(results_folder, f"Distance_From_Paying_Taxes({version}).csv")
    remove_existing_file(distance_matrix_file)  # Remove if the file already exists
    distance_matrix.to_csv(distance_matrix_file, index=False)


    # Calculate the sum of the fraction of TOC (sigma)
    sigma = distance_matrix['Fraction of TOC'].sum()

    # Determine the depreciation period based on sigma
    depreciation_end_year = None
    cumulative_fraction = 0
    for i in range(construction_years, len(CFA_matrix)):
        cumulative_fraction += distance_matrix.at[i, 'Fraction of TOC']
        if cumulative_fraction > 1:
            depreciation_end_year = i
            break

    # Populate depreciation in the CFA matrix
    if depreciation_end_year:
        for year in range(construction_years, depreciation_end_year):
            depreciation_value = int(distance_matrix.at[year, 'Fraction of TOC'] * TOC)
            CFA_matrix.at[year, 'Depreciation'] = depreciation_value

        remaining_toc = int(TOC - CFA_matrix['Depreciation'].sum())
        CFA_matrix.at[depreciation_end_year, 'Depreciation'] = remaining_toc


    # ---------------- Tax Calculation and After-Tax Cash Flow Block Start ----------------

    # Calculate and populate state and federal taxes in the CFA matrix
    for year in range(construction_years, plant_lifetime + construction_years):
        revenue = CFA_matrix.at[year, 'Revenue']
        operating_expenses = CFA_matrix.at[year, 'Operating Expenses']
        depreciation = CFA_matrix.at[year, 'Depreciation']

        state_tax = calculate_state_tax(revenue, config_received.stateTaxRateAmount32, operating_expenses, depreciation)
        federal_tax = calculate_federal_tax(revenue, config_received.federalTaxRateAmount33, operating_expenses, depreciation)

        CFA_matrix.at[year, 'State Taxes'] = state_tax
        CFA_matrix.at[year, 'Federal Taxes'] = federal_tax

        after_tax_cash_flow = revenue - operating_expenses - state_tax - federal_tax
        CFA_matrix.at[year, 'After-Tax Cash Flow'] = after_tax_cash_flow
        Discounted_cash_flow = after_tax_cash_flow/(1 + config_received.iRRAmount30)
        CFA_matrix.at[year, 'Discounted Cash Flow'] = Discounted_cash_flow
    
        cumulative_cash_flow += Discounted_cash_flow
        CFA_matrix.at[year, 'Cumulative Cash Flow'] = cumulative_cash_flow


    CFA_matrix = CFA_matrix.astype(int)

    # ---------------- CFA Matrix Saving Block Start ----------------

    CFA_matrix_file = os.path.join(results_folder, f"CFA({version}).csv")
    remove_existing_file(CFA_matrix_file)
    CFA_matrix.to_csv(CFA_matrix_file, index=False)

    

    # ---------------- Economic Summary and Plotting Block Start ----------------

    # Calculate economic summary metrics
    operational_years = plant_lifetime
    total_revenue = CFA_matrix.loc[construction_years:, 'Revenue'].sum()
    total_operating_expenses = CFA_matrix.loc[construction_years:, 'Operating Expenses'].sum()
    total_depreciation = CFA_matrix.loc[construction_years:, 'Depreciation'].sum()
    total_state_taxes = CFA_matrix.loc[construction_years:, 'State Taxes'].sum()
    total_federal_taxes = CFA_matrix.loc[construction_years:, 'Federal Taxes'].sum()
    total_after_tax_cash_flow = CFA_matrix.loc[construction_years:, 'After-Tax Cash Flow'].sum()
    total_discounted_cash_flow = CFA_matrix.loc[construction_years:, 'Discounted Cash Flow'].sum()
    cumulative_npv = CFA_matrix.loc[construction_years:, 'Cumulative Cash Flow'].iloc[-1]

    average_annual_revenue = total_revenue / operational_years
    average_annual_operating_expenses = total_operating_expenses / operational_years
    average_annual_depreciation = total_depreciation / operational_years
    average_annual_state_taxes = total_state_taxes / operational_years
    average_annual_federal_taxes = total_federal_taxes / operational_years
    average_annual_discounted_cash_flow = total_discounted_cash_flow / operational_years
    average_annual_after_tax_cash_flow = total_after_tax_cash_flow / operational_years

    # Prepare economic data for summary and plotting
    economic_data = {
        'iRRAmount30': config_received.iRRAmount30,
        'TOC': TOC,
        'average_annual_revenue': average_annual_revenue,
        'average_annual_operating_expenses': average_annual_operating_expenses,
        'average_annual_depreciation': average_annual_depreciation,
        'average_annual_state_taxes': average_annual_state_taxes,
        'average_annual_federal_taxes': average_annual_federal_taxes,
        'average_annual_after_tax_cash_flow': average_annual_after_tax_cash_flow,
        'cumulative_npv': cumulative_npv
    }

    # Generate and save economic summary table using the imported module
    generate_economic_summary(economic_data, selected_calculation_option, results_folder, version)

    # Generate and save economic breakdown pie chart using the imported module
    generate_economic_breakdown_pie_chart(results_folder, version, economic_data)

    # Prepare operational cost data for plotting
    operational_costs = {
        'average_feedstock_cost': average_feedstock_cost_operational,
        'average_labor_cost': average_labor_cost_operational,
        'average_utility_cost': average_utility_cost_operational,
        'average_maintenance_cost': average_maintenance_cost_operational,
        'average_insurance_cost': average_insurance_cost_operational
    }

    # Generate and save operational cost pie charts (dynamic and static) using the imported modules
    generate_operational_cost_pie_chart_dynamic(results_folder, version, operational_costs)
    generate_operational_cost_pie_chart_static(results_folder, version, operational_costs, selected_f)

    # ---------------- Economic Summary and Plotting Block End ----------------

    # If target_row is provided, return the NPV at that row for price optimization
    if target_row is not None and price is not None:
        NPV_year = target_row  # Set the NPV year to the target row
        npv = CFA_matrix.at[NPV_year, 'Cumulative Cash Flow']
        logging.info(f"Calculated Current NPV: {npv:.2f} from row {NPV_year}, iteration: {iteration}")
        price_logger.info(f"Iteration {iteration}: Price ${price:.2f}, NPV ${npv:.2f}")
        
        # Flush log handlers to ensure logs are written
        logging.getLogger().handlers[0].flush()
        price_logger.handlers[0].flush()
        
        # Return the calculated NPV and iteration count
        return {
            'primary_result': npv,
            'secondary_result': iteration,
        }
    
    return None

# ---------------- Main Function Block Start ----------------

# Main function to load config matrix and run the update
def main(version, selected_v, selected_f, target_row=None, tolerance_lower=-1000, tolerance_upper=1000, 
         increase_rate=1.02, decrease_rate=0.985, selected_calculation_option=None, sen_parameters=None):
    """
    Main function to load config matrix and run the update with price optimization if requested.
    
    Parameters:
    - version: Batch version
    - selected_v: Dictionary of selected variable costs
    - selected_f: Dictionary of selected fixed costs
    - target_row: Row at which NPV should be zeroed (for price optimization)
    - tolerance_lower: Lower bound of acceptable NPV
    - tolerance_upper: Upper bound of acceptable NPV
    - increase_rate: Rate at which to increase price when NPV is too low
    - decrease_rate: Rate at which to decrease price when NPV is too high
    - selected_calculation_option: Calculation option (e.g., 'calculateForPrice')
    - sen_parameters: Sensitivity parameters
    """
    logging.info(f"Starting main function with parameters:")
    logging.info(f"  - Version: {version}")
    logging.info(f"  - Selected V: {selected_v}")
    logging.info(f"  - Selected F: {selected_f}")
    logging.info(f"  - Target row: {target_row}")
    logging.info(f"  - Tolerance bounds: {tolerance_lower}/{tolerance_upper}")
    logging.info(f"  - Adjustment rates: {increase_rate}/{decrease_rate}")
    logging.info(f"  - Calculation option: {selected_calculation_option}")
    
    # Set the path to the directory containing the modules
    code_files_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backend", "Original")
    results_folder = os.path.join(code_files_path, f"Batch({version})", f"Results({version})")
    config_matrix_file = os.path.join(results_folder, f"General_Configuration_Matrix({version}).csv")
    
    logging.info(f"Paths:")
    logging.info(f"  - Code files path: {code_files_path}")
    logging.info(f"  - Results folder: {results_folder}")
    logging.info(f"  - Config matrix file: {config_matrix_file}")

    # Check if the config matrix file exists
    if not os.path.exists(config_matrix_file):
        logging.error(f"Config matrix file not found: {config_matrix_file}")
        return

    # Load the config matrix
    try:
        config_matrix_df = pd.read_csv(config_matrix_file)
        logging.info(f"Successfully loaded config matrix with {len(config_matrix_df)} rows")
        logging.info(f"Config matrix columns: {config_matrix_df.columns.tolist()}")
    except Exception as e:
        logging.error(f"Error loading config matrix: {str(e)}")
        return
    
    # Handle price optimization if required
    if target_row is not None and selected_calculation_option == 'calculateForPrice':
        logging.info(f"Starting price optimization with target row {target_row}")
        
        try:
            # Load the first config module to get config_received
            config_module_file = os.path.join(results_folder, f"{version}_config_module_1.json")
            config_module = read_config_module(config_module_file)
            
            # Create config_received object from module file
            class ConfigObject:
                def __init__(self, config_dict):
                    for key, value in config_dict.items():
                        setattr(self, key, value)
            
            config_received = ConfigObject(config_module)
            
            # Run price optimization
            optimal_price = optimize_price(
                version, config_received, config_matrix_df, results_folder,
                selected_v, selected_f, int(target_row),
                tolerance_lower, tolerance_upper,
                increase_rate, decrease_rate
            )
            
            logging.info(f"Price optimization complete. Optimal price: ${optimal_price:.2f}")
            
            # Run final calculation with the optimal price
            calculate_revenue_and_expenses_from_modules(
                config_received, config_matrix_df, results_folder, version,
                selected_v, selected_f, optimal_price, None, 0, selected_calculation_option
            )
            
        except Exception as e:
            logging.error(f"Error during price optimization: {str(e)}")
            logging.error(traceback.format_exc())
            price_logger.error(f"Error during price optimization: {str(e)}")
    
    # If not doing price optimization, run a regular calculation
    else:
        try:
            # Load the first config module to get config_received
            config_module_file = os.path.join(results_folder, f"{version}_config_module_1.json")
            config_module = read_config_module(config_module_file)
            
            # Create config_received object from module file
            class ConfigObject:
                def __init__(self, config_dict):
                    for key, value in config_dict.items():
                        setattr(self, key, value)
            
            config_received = ConfigObject(config_module)
            
            # Run regular calculation
            calculate_revenue_and_expenses_from_modules(
                config_received, config_matrix_df, results_folder, version,
                selected_v, selected_f, None, None, 0, selected_calculation_option
            )
            
            logging.info(f"Regular CFA calculation completed for version {version}")
            
        except Exception as e:
            logging.error(f"Error during regular calculation: {str(e)}")
            logging.error(traceback.format_exc())
    
    # Ensure all logs are written
    logging.getLogger().handlers[0].flush()
    if price_logger.handlers:
        price_logger.handlers[0].flush()
    
    logging.info("=" * 80)
    logging.info("CFA CALCULATION SCRIPT COMPLETED")
    logging.info("=" * 80)

# Run the script if called directly
if __name__ == "__main__":
    # Parse command line arguments
    import argparse
    import json
    
    parser = argparse.ArgumentParser(description='Run CFA calculation with optional price optimization')
    parser.add_argument('--version', type=str, required=True, help='Version number')
    parser.add_argument('--calculation-option', type=str, default=None, help='Calculation option, e.g., calculateForPrice')
    parser.add_argument('--target-row', type=int, default=None, help='Target row for price optimization')
    parser.add_argument('--tolerance-lower', type=float, default=-1000, help='Lower tolerance bound for NPV')
    parser.add_argument('--tolerance-upper', type=float, default=1000, help='Upper tolerance bound for NPV')
    parser.add_argument('--increase-rate', type=float, default=1.02, help='Rate to increase price when NPV is too low')
    parser.add_argument('--decrease-rate', type=float, default=0.985, help='Rate to decrease price when NPV is too high')
    
    # Add arguments for selected_v and selected_f as JSON strings
    parser.add_argument('--selected-v', type=str, default=None, help='JSON string of selected V states')
    parser.add_argument('--selected-f', type=str, default=None, help='JSON string of selected F states')
    parser.add_argument('--sen-parameters', type=str, default=None, help='JSON string of sensitivity parameters')
    
    args = parser.parse_args()
    
    # Set up default V and F dictionaries
    default_v = {f'V{i}': 'on' if i == 1 else 'off' for i in range(1, 11)}
    default_f = {f'F{i}': 'on' for i in range(1, 6)}
    
    # Parse JSON strings if provided
    selected_v = default_v
    selected_f = default_f
    sen_parameters = {}
    
    if args.selected_v:
        try:
            selected_v = json.loads(args.selected_v)
        except json.JSONDecodeError:
            logging.error(f"Invalid JSON for selected_v: {args.selected_v}")
    
    if args.selected_f:
        try:
            selected_f = json.loads(args.selected_f)
        except json.JSONDecodeError:
            logging.error(f"Invalid JSON for selected_f: {args.selected_f}")
    
    if args.sen_parameters:
        try:
            sen_parameters = json.loads(args.sen_parameters)
        except json.JSONDecodeError:
            logging.error(f"Invalid JSON for sen_parameters: {args.sen_parameters}")
    
    # Call main function with command line arguments
    main(
        version=args.version,
        selected_v=selected_v,
        selected_f=selected_f,
        target_row=args.target_row,
        tolerance_lower=args.tolerance_lower,
        tolerance_upper=args.tolerance_upper,
        increase_rate=args.increase_rate,
        decrease_rate=args.decrease_rate,
        selected_calculation_option=args.calculation_option,
        sen_parameters=sen_parameters
    )
