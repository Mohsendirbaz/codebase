import json
import os
import pandas as pd
import numpy as np
import sys
import importlib.util
import logging
import logging.config
import plotly.express as px

# Determine the directory for log files
log_directory = os.getcwd()

# Define the log file paths
price_optimization_log = os.path.join(log_directory, 'price_optimization.log')
app_cfa_log = os.path.join(log_directory, 'app_CFA.log')

# Configure only essential loggers and shut off others
LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': True,  # Disable all other loggers
    'formatters': {
        'standard': {
            'format': '%(asctime)s - %(message)s',  # Keep format simple and focused
        },
    },
    'handlers': {
        'price_optimization_file': {
            'level': 'INFO',  # Only log INFO and above
            'class': 'logging.FileHandler',  # Corrected the class name
            'formatter': 'standard',
            'filename': price_optimization_log,
            'mode': 'a',  # Append to keep previous logs
        },
        'app_cfa_file': {
            'level': 'INFO',  # Only log INFO and above
            'class': 'logging.FileHandler',  # Corrected the class name
            'formatter': 'standard',
            'filename': app_cfa_log,
            'mode': 'a',  # Append to keep previous logs
        },
    },
    'loggers': {
        'price_optimization': {
            'handlers': ['price_optimization_file'],
            'level': 'INFO',
            'propagate': False,  # Prevent propagation to root logger
        },
        'app_cfa': {
            'handlers': ['app_cfa_file'],
            'level': 'INFO',
            'propagate': False,  # Prevent propagation to root logger
        },
    },
}

# Apply the logging configuration
logging.config.dictConfig(LOGGING_CONFIG)

# Create the individual loggers using getLogger()
price_logger = logging.getLogger('price_optimization')
cfa_logger = logging.getLogger('app_cfa')

# ---------------- Usage Example ----------------

# Log essential messages for price optimization
price_logger.info("Starting price optimization.")
price_logger.info("Initial price set to 100.0.")

# Log essential messages for app_CFA
cfa_logger.info("Loaded CFA matrix.")
cfa_logger.info("Processing CFA data for plant lifetime.")

# ---------------- cfa_logger Setup Block End ----------------


# ---------------- Utility Function Block Start ----------------

# Function to remove existing files
def remove_existing_file(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)
        cfa_logger.info(f"Removed existing file: {file_path}")
    else:
        cfa_logger.info(f"No existing file to remove: {file_path}")

# ---------------- Utility Function Block End ----------------


# ---------------- Revenue and Expense Calculation Block Start ----------------

# Function to calculate annual revenue
def calculate_annual_revenue(numberOfUnitsAmount1, initialSellingPriceAmount1, generalInflationRateAmount2, years, construction_years):
    revenue = [0] * construction_years + [
        int(numberOfUnitsAmount1 * initialSellingPriceAmount1 * (1 + generalInflationRateAmount2) ** (year - construction_years)) 
        for year in range(construction_years, years)
    ]
    cfa_logger.info(f"Annual Revenue: {revenue}")
    return revenue



def calculate_annual_operating_expenses(
    use_direct_operating_expensesAmount1, 
    totalOperatingCostPercentageAmount1, 
    variable_costsAmount4, 
    amounts_per_unitAmount5, 
    MaterialInventory, 
    Labor, 
    utility, 
    maintenance_amount, 
    insurance_amount, 
    annual_revenue, 
    generalInflationRateAmount2, 
    years, 
    construction_years, 
    selected_v, 
    selected_f
):
    
    # Log the start of the function
    cfa_logger.info("Starting calculation of annual operating expenses.")

    # Log the input selected filters
    cfa_logger.info(f"Selected variable costs filter (V): {selected_v}")
    cfa_logger.info(f"Selected fixed costs filter (F): {selected_f}")

    # List of fixed costs (corresponding to selected_f)
    fixed_costs = [MaterialInventory, Labor, utility, maintenance_amount, insurance_amount]

   # Filter variable costs and amounts per unit based on selected_v
    # If 'off', set corresponding value to 0
    variable_costs_filtered = [
        cost if selected_v.get(f'V{i+1}') == 'on' else 0 for i, cost in enumerate(variable_costsAmount4)
    ]
    amounts_per_unit_filtered = [
        amount if selected_v.get(f'V{i+1}') == 'on' else 0 for i, amount in enumerate(amounts_per_unitAmount5)
    ]


    cfa_logger.info(f"Filtered variable costs: {variable_costs_filtered}")
    cfa_logger.info(f"Filtered amounts per unit: {amounts_per_unit_filtered}")

    # Filter fixed costs based on selected_f
    # If 'off', set corresponding value to 0
    fixed_costs_filtered = [
        cost if selected_f.get(f'F{i+1}') == 'on' else 0 for i, cost in enumerate(fixed_costs)
    ]

    cfa_logger.info(f"Filtered fixed costs: {fixed_costs_filtered}")

    # Calculate total fixed cost
    total_fixed_cost = sum(fixed_costs_filtered)
    cfa_logger.info(f"Total fixed costs: {total_fixed_cost}")

    # If direct operating expenses are used, calculate using total operating cost percentage
    if use_direct_operating_expensesAmount1:
        cfa_logger.info("Using direct operating expenses for calculation.")
        expenses = [0] * construction_years + [
            int(totalOperatingCostPercentageAmount1 * revenue) for revenue in annual_revenue[construction_years:]
        ]
        cfa_logger.info(f"Operating expenses (direct method): {expenses}")
    else:
        cfa_logger.info("Using indirect calculation for operating expenses.")
        # Calculate total variable costs (filtered based on selected_v)
        annual_variable_cost = np.sum([
            cost * amount for cost, amount in zip(variable_costs_filtered, amounts_per_unit_filtered)
        ])
        cfa_logger.info(f"Annual variable costs: {annual_variable_cost}")

        # Calculate the total expenses over the years, applying inflation after construction years
        expenses = [0] * construction_years + [
            int((annual_variable_cost + total_fixed_cost) * (1 + generalInflationRateAmount2) ** (year - construction_years)) 
            for year in range(construction_years, years)
        ]
        cfa_logger.info(f"Operating expenses (indirect method): {expenses}")

    # Log the final result
    cfa_logger.info(f"Final operating expenses: {expenses}")
    cfa_logger.info(f"Filtered variable costs returned: {variable_costs_filtered}")
    cfa_logger.info(f"Filtered fixed costs returned: {fixed_costs_filtered}")

    return expenses, variable_costs_filtered, fixed_costs_filtered



# ---------------- Revenue and Expense Calculation Block End ----------------import pandas as pd

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
    columns = ['Year', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9']
    variable_opex_table = pd.DataFrame(0, index=range(plant_lifetime), columns=columns)
    variable_opex_table['Year'] = range(1, plant_lifetime + 1)

    for (start_year, end_year), variable_costs in variable_costs_results.items():
        variable_costs = pad_or_trim(variable_costs, 9)
        for year in range(start_year, end_year + 1):
            year_idx = year - 1
            if 0 <= year_idx < plant_lifetime:
                variable_opex_table.loc[year_idx, 'V1':'V9'] = variable_costs

    return variable_opex_table

def generate_cumulative_opex_table(fixed_costs_results, variable_costs_results, expenses_results, plant_lifetime):
    columns = ['Year', 'F1', 'F2', 'F3', 'F4', 'F5', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'Operating Expenses']
    cumulative_opex_table = pd.DataFrame(0, index=range(plant_lifetime), columns=columns)
    cumulative_opex_table['Year'] = range(1, plant_lifetime + 1)

    for (start_year, end_year), fixed_costs in fixed_costs_results.items():
        fixed_costs = pad_or_trim(fixed_costs, 5)
        for year in range(start_year, end_year + 1):
            year_idx = year - 1
            if 0 <= year_idx < plant_lifetime:
                cumulative_opex_table.loc[year_idx, 'F1':'F5'] = fixed_costs

    for (start_year, end_year), variable_costs in variable_costs_results.items():
        variable_costs = pad_or_trim(variable_costs, 9)
        for year in range(start_year, end_year + 1):
            year_idx = year - 1
            if 0 <= year_idx < plant_lifetime:
                cumulative_opex_table.loc[year_idx, 'V1':'V9'] = variable_costs

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

    fixed_opex_table.to_csv(os.path.join(results_folder, f"Fixed_Opex_Table_{version}.csv"), index=False)
    variable_opex_table.to_csv(os.path.join(results_folder, f"Variable_Opex_Table_{version}.csv"), index=False)
    cumulative_opex_table.to_csv(os.path.join(results_folder, f"Cumulative_Opex_Table_{version}.csv"), index=False)

    cfa_logger.info(f"Saved Opex tables for version {version}")


# Function to calculate state tax
def calculate_state_tax(revenue, stateTaxRateAmount3, operating_expenses, depreciation):
    taxable_income = revenue - operating_expenses - depreciation
    tax = max(taxable_income, 0) * stateTaxRateAmount3
    cfa_logger.info(f"State Tax for revenue {revenue}: {tax}")
    return tax

# Function to calculate federal tax
def calculate_federal_tax(revenue, federalTaxRateAmount3, operating_expenses, depreciation):
    taxable_income = revenue - operating_expenses - depreciation
    tax = max(taxable_income, 0) * federalTaxRateAmount3
    cfa_logger.info(f"Federal Tax for revenue {revenue}: {tax}")
    return tax

# ---------------- Tax Calculation Block End ----------------


# ---------------- Config Module Handling Block Start ----------------

# Function to read the config module from a JSON file
def read_config_module(file_path):
    with open(file_path, 'r') as f:
        return json.load(f)

# ---------------- Config Module Handling Block End ----------------

    
# ---------------- Revenue and Expense Calculation from Config Block Start ----------------

def calculate_revenue_and_expenses_from_modules(config_received, config_matrix_df, results_folder, version, selected_v, selected_f, price):
    cfa_logger.info("Starting to calculate revenue and expenses.")
    price_logger.info("Starting to calculate revenue and expenses.")
    # Extract parameters
    plant_lifetime = config_received.plantLifetimeAmount1
    construction_years = config_received.numberofconstructionYearsAmount2
    price_logger.info(f"Starting price optimization with initial price: {price:.2f}")
    BEC = config_received.BECAmount1
    EPC = config_received.Engineering_Procurement_and_Construction_EPC_BECAmount1 
    PC = config_received.Process_contingency_PC_BECAmount1
    PT = config_received.Project_Contingency_PT_BEC_EPC_PCAmount1

    TOC = BEC + EPC * BEC + PC * (BEC + EPC * BEC) + PT * (BEC + EPC * BEC + PC * (BEC + EPC * BEC))

    cfa_logger.info(f"Total Overnight Cost (TOC) calculated: {TOC}")

    CFA_matrix = pd.DataFrame(np.zeros(((plant_lifetime + construction_years), 10)),
                            columns=['Year', 'Revenue', 'Operating Expenses', 'Loan', 'Depreciation', 'State Taxes', 'Federal Taxes', 'After-Tax Cash Flow','Discounted Cash Flow', 'Cumulative Cash Flow'])
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

    # Iterate through the config matrix
    for idx, row in config_matrix_df.iterrows():
        start_year = int(row['start']) + construction_years
        end_year = int(row['end']) + construction_years

        config_module_file = os.path.join(results_folder, f"{version}_config_module_{row['start']}_{row['end']}.json")
        if not os.path.exists(config_module_file):
            cfa_logger.warning(f"Config module file not found: {config_module_file}")
            continue

        config_module = read_config_module(config_module_file)
        
        annual_revenue = calculate_annual_revenue(
            config_module['numberOfUnitsAmount1'],
            price,
            config_module['generalInflationRateAmount2'],
            plant_lifetime + construction_years,
            construction_years
        )

        annual_operating_expenses, variable_costs, fixed_costs = calculate_annual_operating_expenses(
            config_module['use_direct_operating_expensesAmount1'],
            config_module['totalOperatingCostPercentageAmount1'],
            config_module['variable_costsAmount4'],
            config_module['amounts_per_unitAmount5'],
            config_module['rawmaterialAmount3'],
            config_module['LaborAmount3'],
            config_module['utilityAmount3'],
            config_module['MaintenanceAmount3'],
            config_module['InsuranceAmount3'],
            annual_revenue,
            config_module['generalInflationRateAmount2'],
            plant_lifetime + construction_years,
            construction_years,
            selected_v,
            selected_f
        )

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
    cfa_logger.info(f"CFA matrix saved as {CFA_matrix_file}")


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
            cfa_year = year
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

    # Create a matrix for distance from paying taxes
    distance_matrix = pd.DataFrame(0, index=range(len(CFA_matrix)), columns=['Potentially Taxable Income', 'Fraction of TOC'])

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
    cfa_logger.info(f"Distance matrix saved as {distance_matrix_file}")

    # Calculate the sum of the fraction of TOC (sigma)
    sigma = distance_matrix['Fraction of TOC'].sum()

    # Determine the depreciation period based on sigma
    depreciation_end_year = None
    cumulative_fraction = 0
    for i in range(construction_years, len(CFA_matrix)):
        cumulative_fraction += distance_matrix.at[i, 'Fraction of TOC']
        if cumulative_fraction > 1:
            depreciation_end_year = i
            price_logger.info(f"cumulative_fraction: {cumulative_fraction}, {depreciation_end_year}, {sigma}")
            cfa_logger.info(f"cumulative_fraction: {cumulative_fraction}")
            cfa_logger.info(f"depreciation_end_year: {depreciation_end_year}")
            break

    # Populate depreciation in the CFA matrix
    if depreciation_end_year:
        for year in range(construction_years, depreciation_end_year):
            depreciation_value = int(distance_matrix.at[year, 'Fraction of TOC'] * TOC)
            CFA_matrix.at[year, 'Depreciation'] = depreciation_value

        remaining_toc = int(TOC - CFA_matrix['Depreciation'].sum())
        CFA_matrix.at[depreciation_end_year, 'Depreciation'] = remaining_toc

    cfa_logger.info("Depreciation populated in CFA matrix.")

    # ---------------- Tax Calculation and After-Tax Cash Flow Block Start ----------------

    # Calculate and populate state and federal taxes in the CFA matrix
    for year in range(construction_years, plant_lifetime + construction_years):
        revenue = CFA_matrix.at[year, 'Revenue']
        operating_expenses = CFA_matrix.at[year, 'Operating Expenses']
        depreciation = CFA_matrix.at[year, 'Depreciation']

        state_tax = calculate_state_tax(revenue, config_received.stateTaxRateAmount3, operating_expenses, depreciation)
        federal_tax = calculate_federal_tax(revenue, config_received.federalTaxRateAmount3, operating_expenses, depreciation)

        CFA_matrix.at[year, 'State Taxes'] = state_tax
        CFA_matrix.at[year, 'Federal Taxes'] = federal_tax

        after_tax_cash_flow = revenue - operating_expenses - state_tax - federal_tax
        CFA_matrix.at[year, 'After-Tax Cash Flow'] = after_tax_cash_flow
        Discounted_cash_flow = after_tax_cash_flow/(1 + config_received.IRRAmount3) ** (year - construction_years + 1)
        CFA_matrix.at[year, 'Discounted Cash Flow'] = Discounted_cash_flow
    
        cumulative_cash_flow += Discounted_cash_flow
        CFA_matrix.at[year, 'Cumulative Cash Flow'] = cumulative_cash_flow
        

    # ---------------- CFA Matrix Saving Block Start ----------------

    CFA_matrix_file = os.path.join(results_folder, f"CFA({version}).csv")
    remove_existing_file(CFA_matrix_file)
    CFA_matrix.to_csv(CFA_matrix_file, index=False)
    cfa_logger.info(f"CFA matrix saved as {CFA_matrix_file}")

    # ---------------- Economic Summary and Plotting Block Start ----------------
    

    # ---------------- Economic Summary and Plotting Block Start ----------------

    # Calculate economic summary
    operational_years = plant_lifetime - construction_years
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

    economic_summary = pd.DataFrame({
        'Metric': [
            
            'IRR',
            'Calculated Price',
            'Total Overnight Cost (TOC)',
            'Average Annual Revenue',
            'Average Annual Operating Expenses',
            'Average Annual Depreciation',
            'Average Annual State Taxes',
            'Average Annual Federal Taxes',
            'Average Annual After-Tax Cash Flow',
            'Average Annual Discounted Cash Flow',
            'Cumulative NPV'
        ],
        'Value': [
           
            f"{config_received.IRRAmount3:.2%}",
             f"${price:,.4f}",
            f"${TOC:,.0f}",
            f"${average_annual_revenue:,.0f}",
            f"${average_annual_operating_expenses:,.0f}",
            f"${average_annual_depreciation:,.0f}",
            f"${average_annual_state_taxes:,.0f}",
            f"${average_annual_federal_taxes:,.0f}",
            f"${average_annual_after_tax_cash_flow:,.0f}",
            f"${average_annual_discounted_cash_flow:,.0f}",
            f"${cumulative_npv:,.0f}"
        ]
    })

    economic_summary_file = os.path.join(results_folder, f"Economic_Summary({version}).csv")
    remove_existing_file(economic_summary_file)  # Remove if the file already exists
    economic_summary.to_csv(economic_summary_file, index=False)
    cfa_logger.info(f"Economic summary saved as {economic_summary_file}")

    # Generate and save the pie chart for relative magnitudes using Plotly
    labels = [
        'Average Annual Revenue',
        'Average Annual Operating Expenses',
        'Average Annual State Taxes',
        'Average Annual Federal Taxes'
    ]
    sizes = [
        average_annual_revenue,
        average_annual_operating_expenses,
        average_annual_state_taxes,
        average_annual_federal_taxes
    ]

    # Create pie chart
    pie_chart = px.pie(values=sizes, names=labels, title='Economic Breakdown')

    # Save pie chart to results folder
    pie_chart_file = os.path.join(results_folder, f"Economic_Breakdown_Pie_Chart({version}).html")
    pie_chart.write_html(pie_chart_file)
    cfa_logger.info(f"Pie chart saved as {pie_chart_file}")

    # ---------------- Economic Summary and Plotting Block End ----------------

    target_row = construction_years+plant_lifetime-1
    current_npv = CFA_matrix.at[target_row, "Cumulative Cash Flow"]
    # Convergence tolerance
    TOLERANCE_LOWER = -0.0001*CFA_matrix.at[construction_years+1, 'Revenue']
    TOLERANCE_UPPER = 0.0001*CFA_matrix.at[construction_years+1, 'Revenue']
    iteration = 0  # Track the number of iterations
    price_logger.info(f"Retrieved NPV: {current_npv:.2f} from row {target_row}")  
    # Optimization loop
    while current_npv < TOLERANCE_LOWER or current_npv > TOLERANCE_UPPER:
        iteration += 1
        price_logger.info(f"Iteration {iteration}: Current NPV: {current_npv:.2f}, Price: {price:.2f}")

        if current_npv < TOLERANCE_LOWER:
            # Increase price by 10% if NPV is negative
            pp=1.001
            price *= pp
            price_logger.info(f"NPV {current_npv:.2f} < 0. Increasing price by {1-pp:.4f} New price: {price:.2f}")
        elif current_npv > TOLERANCE_UPPER:
            # Decrease price by 10% if NPV is positive
            pn=0.999
            price *= pn
            price_logger.info(f"NPV {current_npv:.2f} >= 0. Decreasing price by {1-pn:.4f} New price: {price:.2f}")
        else:
            # If within tolerance, break the loop
            price_logger.info(f"NPV {current_npv:.2f} is within tolerance. Optimization complete.")
            break

        # Recalculate NPV with the updated price
        current_npv = calculate_revenue_and_expenses_from_modules(
            config_received, config_matrix_df, results_folder, version, selected_v, selected_f
        , price)
        price_logger.info(f"Recalculated NPV: {current_npv:.2f}")

    # Check if NPV is within the tolerance range
    if TOLERANCE_LOWER < current_npv < TOLERANCE_UPPER:
        final_price = price
        price_logger.info(f"Optimization converged. Final Price: {final_price:.2f}, Final NPV: {current_npv:.2f}")
        return final_price
    else:
        price_logger.info("Failed to converge within the defined tolerance.")
        return None
# ---------------- Main Function Block Start ----------------

# Main function to load config matrix and run the update
def main(version, selected_v, selected_f):
    # Set the path to the directory containing the modules
    code_files_path = r"C:\Users\Mohse\OneDrive\Documents\GitHub\TeaSpace\backend\Original"
    results_folder = os.path.join(code_files_path, f"Batch({version})", f"Results({version})")
    config_matrix_file = os.path.join(results_folder, f"Configuration_Matrix({version}).csv")

    # Check if the config matrix file exists
    if not os.path.exists(config_matrix_file):
        cfa_logger.info(f"Config matrix file not found: {config_matrix_file}")
        return

    # Load the config matrix
    config_matrix_df = pd.read_csv(config_matrix_file)
    cfa_logger.info(f"Config matrix loaded: {config_matrix_file}")

    # Set the path to the directory containing the configurations
    config_file = os.path.join(code_files_path,f"Batch({version})", f"ConfigurationPlotSpec({version})", f"configurations({version}).py")
    if not os.path.exists(config_file):
        cfa_logger.info(f"Configuration file not found: {config_file}")
        return
    

    spec = importlib.util.spec_from_file_location("config", config_file)
    config_received = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(config_received)
    global price  # Use the global price variable
    price=config_received.initialSellingPriceAmount1
    cfa_logger.info("Configuration module loaded successfully.")

    # Run the update and calculate revenue and expenses from pre-existing config modules
    calculate_revenue_and_expenses_from_modules(config_received, config_matrix_df, results_folder, version, selected_v, selected_f, price), 

# Accept version, selected_v, and selected_f as command-line arguments
if __name__ == "__main__":
    version = sys.argv[1] if len(sys.argv) > 1 else 1
    selected_v = json.loads(sys.argv[2]) if len(sys.argv) > 2 else [0] * 9  # Default to mask with 9 zeros for V
    selected_f = json.loads(sys.argv[3]) if len(sys.argv) > 3 else [0] * 5  # Default to mask with 5 zeros for F
    print(f"{selected_f} and {selected_v}")
    cfa_logger.info(f"Script started with version: {version}, V selections: {selected_v}, and F selections: {selected_f}")
    main(version, selected_v, selected_f)
    cfa_logger.info("Script finished execution.")
