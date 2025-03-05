"""
Economic Summary Module

This module contains functions for generating and saving economic summary tables
for Cash Flow Analysis (CFA). It formats calculated metrics into a summary table
and saves it to the appropriate location.
"""

import os
import pandas as pd
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def remove_existing_file(file_path):
    """
    Remove a file if it exists.
    
    Args:
        file_path (str): Path to the file to remove
    """
    if os.path.exists(file_path):
        os.remove(file_path)
        logging.debug(f"Removed existing file: {file_path}")
    else:
        logging.debug(f"No existing file to remove: {file_path}")

def generate_economic_summary(economic_data, selected_calculation_option, results_folder, version):
    """
    Generate and save an economic summary table.
    
    Args:
        economic_data (dict): Dictionary containing economic data with keys:
            - iRRAmount30: Internal Rate of Return
            - TOC: Total Overnight Cost
            - average_annual_revenue: Average Annual Revenue
            - average_annual_operating_expenses: Average Annual Operating Expenses
            - average_annual_depreciation: Average Annual Depreciation
            - average_annual_state_taxes: Average Annual State Taxes
            - average_annual_federal_taxes: Average Annual Federal Taxes
            - average_annual_after_tax_cash_flow: Average Annual After-Tax Cash Flow
            - cumulative_npv: Cumulative NPV
        selected_calculation_option (str): Selected calculation option
        results_folder (str): Path to the folder where results will be saved
        version (str): Version identifier
    """
    # Create economic summary DataFrame
    economic_summary = pd.DataFrame({
        'Metric': [
            'Internal Rate of Return',
            'Total Overnight Cost (TOC)',
            'Average Annual Revenue',
            'Average Annual Operating Expenses',
            'Average Annual Depreciation',
            'Average Annual State Taxes',
            'Average Annual Federal Taxes',
            'Average Annual After-Tax Cash Flow',
            'Cumulative NPV',
            'Calculation Mode'
        ],
        'Value': [
            f"{economic_data['iRRAmount30']:.2%}",
            f"${economic_data['TOC']:,.0f}",
            f"${economic_data['average_annual_revenue']:,.0f}",
            f"${economic_data['average_annual_operating_expenses']:,.0f}",
            f"${economic_data['average_annual_depreciation']:,.0f}",
            f"${economic_data['average_annual_state_taxes']:,.0f}",
            f"${economic_data['average_annual_federal_taxes']:,.0f}",
            f"${economic_data['average_annual_after_tax_cash_flow']:,.0f}",
            f"${economic_data['cumulative_npv']:,.0f}",
            selected_calculation_option
        ]
    })

    # Save economic summary to CSV
    economic_summary_file = os.path.join(results_folder, f"Economic_Summary({version}).csv")
    remove_existing_file(economic_summary_file)  # Remove if the file already exists
    economic_summary.to_csv(economic_summary_file, index=False)
    
    logging.info(f"Economic summary saved to {economic_summary_file}")
    
    return economic_summary
