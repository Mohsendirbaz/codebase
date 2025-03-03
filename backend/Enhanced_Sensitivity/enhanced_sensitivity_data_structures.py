"""
Enhanced Sensitivity Data Structures

This module provides data models for sensitivity parameters, variations, etc.,
and validation functions for input data.
"""

import logging
import sys
import os
import json
from typing import Dict, List, Any, Optional, Union, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'enhanced_sensitivity.log'))
    ]
)
logger = logging.getLogger(__name__)

class SensitivityParameter:
    """
    Data model for a sensitivity parameter.
    """
    
    def __init__(self, param_id, mode="symmetrical", values=None, enabled=True, 
                 compare_to_key=None, comparison_type="primary", 
                 waterfall=False, bar=False, point=False):
        """
        Initialize a sensitivity parameter.
        
        Args:
            param_id (str): Parameter ID (e.g., "S34")
            mode (str, optional): Mode ("symmetrical" or "multipoint"). Defaults to "symmetrical".
            values (list, optional): List of variation values. Defaults to None.
            enabled (bool, optional): Whether the parameter is enabled. Defaults to True.
            compare_to_key (str, optional): Parameter to compare to. Defaults to None.
            comparison_type (str, optional): Comparison type ("primary" or "secondary"). Defaults to "primary".
            waterfall (bool, optional): Whether to generate waterfall plot. Defaults to False.
            bar (bool, optional): Whether to generate bar plot. Defaults to False.
            point (bool, optional): Whether to generate point plot. Defaults to False.
        """
        self.param_id = param_id
        self.mode = mode
        self.values = values or []
        self.enabled = enabled
        self.compare_to_key = compare_to_key
        self.comparison_type = comparison_type
        self.waterfall = waterfall
        self.bar = bar
        self.point = point
        
    def to_dict(self):
        """
        Convert the parameter to a dictionary.
        
        Returns:
            dict: Dictionary representation of the parameter
        """
        return {
            "mode": self.mode,
            "values": self.values,
            "enabled": self.enabled,
            "compareToKey": self.compare_to_key,
            "comparisonType": self.comparison_type,
            "waterfall": self.waterfall,
            "bar": self.bar,
            "point": self.point
        }
        
    @classmethod
    def from_dict(cls, param_id, param_dict):
        """
        Create a parameter from a dictionary.
        
        Args:
            param_id (str): Parameter ID
            param_dict (dict): Dictionary representation of the parameter
            
        Returns:
            SensitivityParameter: Created parameter
        """
        return cls(
            param_id=param_id,
            mode=param_dict.get("mode", "symmetrical"),
            values=param_dict.get("values", []),
            enabled=param_dict.get("enabled", True),
            compare_to_key=param_dict.get("compareToKey"),
            comparison_type=param_dict.get("comparisonType", "primary"),
            waterfall=param_dict.get("waterfall", False),
            bar=param_dict.get("bar", False),
            point=param_dict.get("point", False)
        )

class SensitivityVariation:
    """
    Data model for a sensitivity variation.
    """
    
    def __init__(self, param_id, mode, variation, original_value=None, new_value=None, price=None):
        """
        Initialize a sensitivity variation.
        
        Args:
            param_id (str): Parameter ID (e.g., "S34")
            mode (str): Mode ("symmetrical" or "multipoint")
            variation (float): Variation value (e.g., 10.0 for +10%)
            original_value (float, optional): Original parameter value. Defaults to None.
            new_value (float, optional): New parameter value. Defaults to None.
            price (float, optional): Calculated price. Defaults to None.
        """
        self.param_id = param_id
        self.mode = mode
        self.variation = variation
        self.variation_str = f"{variation:+.2f}"
        self.original_value = original_value
        self.new_value = new_value
        self.price = price
        
    def to_dict(self):
        """
        Convert the variation to a dictionary.
        
        Returns:
            dict: Dictionary representation of the variation
        """
        return {
            "param_id": self.param_id,
            "mode": self.mode,
            "variation": self.variation,
            "variation_str": self.variation_str,
            "original_value": self.original_value,
            "new_value": self.new_value,
            "price": self.price
        }
        
    @classmethod
    def from_dict(cls, variation_dict):
        """
        Create a variation from a dictionary.
        
        Args:
            variation_dict (dict): Dictionary representation of the variation
            
        Returns:
            SensitivityVariation: Created variation
        """
        return cls(
            param_id=variation_dict.get("param_id"),
            mode=variation_dict.get("mode"),
            variation=variation_dict.get("variation"),
            original_value=variation_dict.get("original_value"),
            new_value=variation_dict.get("new_value"),
            price=variation_dict.get("price")
        )

class SensitivityConfiguration:
    """
    Data model for a sensitivity configuration.
    """
    
    def __init__(self, version=1, selected_v=None, selected_f=None, 
                 calculation_option="calculateForPrice", target_row=20, 
                 sen_parameters=None):
        """
        Initialize a sensitivity configuration.
        
        Args:
            version (int, optional): Version number. Defaults to 1.
            selected_v (dict, optional): Dictionary of selected V parameters. Defaults to None.
            selected_f (dict, optional): Dictionary of selected F parameters. Defaults to None.
            calculation_option (str, optional): Calculation option. Defaults to "calculateForPrice".
            target_row (int, optional): Target row. Defaults to 20.
            sen_parameters (dict, optional): Dictionary of sensitivity parameters. Defaults to None.
        """
        self.version = version
        self.selected_v = selected_v or {f"V{i+1}": "off" for i in range(10)}
        self.selected_f = selected_f or {f"F{i+1}": "off" for i in range(5)}
        self.calculation_option = calculation_option
        self.target_row = target_row
        self.sen_parameters = {}
        
        # Convert sen_parameters dictionary to SensitivityParameter objects
        if sen_parameters:
            for param_id, param_dict in sen_parameters.items():
                self.sen_parameters[param_id] = SensitivityParameter.from_dict(param_id, param_dict)
        
    def to_dict(self):
        """
        Convert the configuration to a dictionary.
        
        Returns:
            dict: Dictionary representation of the configuration
        """
        # Convert sen_parameters to dictionary
        sen_parameters_dict = {}
        for param_id, param in self.sen_parameters.items():
            sen_parameters_dict[param_id] = param.to_dict()
            
        return {
            "versions": [self.version],
            "selectedV": self.selected_v,
            "selectedF": self.selected_f,
            "selectedCalculationOption": self.calculation_option,
            "targetRow": self.target_row,
            "SenParameters": sen_parameters_dict
        }
        
    @classmethod
    def from_dict(cls, config_dict):
        """
        Create a configuration from a dictionary.
        
        Args:
            config_dict (dict): Dictionary representation of the configuration
            
        Returns:
            SensitivityConfiguration: Created configuration
        """
        return cls(
            version=config_dict.get("versions", [1])[0],
            selected_v=config_dict.get("selectedV"),
            selected_f=config_dict.get("selectedF"),
            calculation_option=config_dict.get("selectedCalculationOption", "calculateForPrice"),
            target_row=config_dict.get("targetRow", 20),
            sen_parameters=config_dict.get("SenParameters")
        )

def validate_parameter_id(param_id):
    """
    Validate a parameter ID.
    
    Args:
        param_id (str): Parameter ID to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not isinstance(param_id, str):
        logger.warning(f"Parameter ID must be a string: {param_id}")
        return False
        
    if not param_id.startswith('S'):
        logger.warning(f"Parameter ID must start with 'S': {param_id}")
        return False
        
    if not param_id[1:].isdigit():
        logger.warning(f"Parameter ID must have a numeric suffix: {param_id}")
        return False
        
    param_num = int(param_id[1:])
    if not (10 <= param_num <= 61):
        logger.warning(f"Parameter number must be between 10 and 61: {param_id}")
        return False
        
    return True

def validate_mode(mode):
    """
    Validate a sensitivity mode.
    
    Args:
        mode (str): Mode to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not isinstance(mode, str):
        logger.warning(f"Mode must be a string: {mode}")
        return False
        
    if mode.lower() not in ["symmetrical", "multipoint"]:
        logger.warning(f"Mode must be 'symmetrical' or 'multipoint': {mode}")
        return False
        
    return True

def validate_values(values):
    """
    Validate sensitivity values.
    
    Args:
        values (list): Values to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not isinstance(values, list):
        logger.warning(f"Values must be a list: {values}")
        return False
        
    if not values:
        logger.warning("Values list cannot be empty")
        return False
        
    for value in values:
        if not isinstance(value, (int, float)):
            logger.warning(f"Value must be a number: {value}")
            return False
            
    return True

def validate_parameter(param_id, param_config):
    """
    Validate a sensitivity parameter.
    
    Args:
        param_id (str): Parameter ID
        param_config (dict): Parameter configuration
        
    Returns:
        bool: True if valid, False otherwise
    """
    # Validate parameter ID
    if not validate_parameter_id(param_id):
        return False
        
    # Validate mode
    if "mode" in param_config and not validate_mode(param_config["mode"]):
        return False
        
    # Validate values
    if "values" in param_config and not validate_values(param_config["values"]):
        return False
        
    # Validate enabled
    if "enabled" in param_config and not isinstance(param_config["enabled"], bool):
        logger.warning(f"Enabled must be a boolean: {param_config['enabled']}")
        return False
        
    # Validate compareToKey
    if "compareToKey" in param_config and param_config["compareToKey"] is not None:
        if not validate_parameter_id(param_config["compareToKey"]):
            return False
            
    # Validate comparisonType
    if "comparisonType" in param_config and param_config["comparisonType"] not in ["primary", "secondary"]:
        logger.warning(f"Comparison type must be 'primary' or 'secondary': {param_config['comparisonType']}")
        return False
        
    # Validate plot types
    for plot_type in ["waterfall", "bar", "point"]:
        if plot_type in param_config and not isinstance(param_config[plot_type], bool):
            logger.warning(f"{plot_type} must be a boolean: {param_config[plot_type]}")
            return False
            
    return True

def validate_configuration(config):
    """
    Validate a sensitivity configuration.
    
    Args:
        config (dict): Configuration to validate
        
    Returns:
        tuple: (is_valid, errors) - Boolean indicating if the configuration is valid and a list of errors
    """
    errors = []
    
    # Validate versions
    if "versions" not in config or not config["versions"]:
        errors.append("Missing or empty 'versions' field")
    elif not isinstance(config["versions"], list):
        errors.append(f"'versions' must be a list: {config['versions']}")
    elif not all(isinstance(v, int) for v in config["versions"]):
        errors.append(f"All versions must be integers: {config['versions']}")
        
    # Validate selectedV
    if "selectedV" not in config:
        errors.append("Missing 'selectedV' field")
    elif not isinstance(config["selectedV"], dict):
        errors.append(f"'selectedV' must be a dictionary: {config['selectedV']}")
        
    # Validate selectedF
    if "selectedF" not in config:
        errors.append("Missing 'selectedF' field")
    elif not isinstance(config["selectedF"], dict):
        errors.append(f"'selectedF' must be a dictionary: {config['selectedF']}")
        
    # Validate selectedCalculationOption
    if "selectedCalculationOption" not in config:
        errors.append("Missing 'selectedCalculationOption' field")
    elif not isinstance(config["selectedCalculationOption"], str):
        errors.append(f"'selectedCalculationOption' must be a string: {config['selectedCalculationOption']}")
    elif config["selectedCalculationOption"] not in ["calculateForPrice", "freeFlowNPV"]:
        errors.append(f"'selectedCalculationOption' must be 'calculateForPrice' or 'freeFlowNPV': {config['selectedCalculationOption']}")
        
    # Validate targetRow
    if "targetRow" not in config:
        errors.append("Missing 'targetRow' field")
    elif not isinstance(config["targetRow"], int):
        errors.append(f"'targetRow' must be an integer: {config['targetRow']}")
        
    # Validate SenParameters
    if "SenParameters" not in config:
        errors.append("Missing 'SenParameters' field")
    elif not isinstance(config["SenParameters"], dict):
        errors.append(f"'SenParameters' must be a dictionary: {config['SenParameters']}")
    else:
        # Validate each parameter
        for param_id, param_config in config["SenParameters"].items():
            if not validate_parameter(param_id, param_config):
                errors.append(f"Invalid parameter: {param_id}")
                
    return len(errors) == 0, errors

def get_property_id(param_id):
    """
    Get the property ID for a sensitivity parameter.
    
    Args:
        param_id (str): Parameter ID (e.g., "S34")
        
    Returns:
        str: Property ID (e.g., "rawmaterialAmount34")
    """
    # Extract parameter number (e.g., S10 -> 10)
    if not validate_parameter_id(param_id):
        return None
    
    param_num = int(param_id[1:])
    
    # Define parameter mappings
    param_mappings = {
        10: "plantLifetimeAmount10",
        11: "bECAmount11",
        12: "numberOfUnitsAmount12",
        13: "initialSellingPriceAmount13",
        14: "totalOperatingCostPercentageAmount14",
        15: "engineering_Procurement_and_Construction_EPC_Amount15",
        16: "process_contingency_PC_Amount16",
        17: "project_Contingency_PT_BEC_EPC_PCAmount17",
        18: "use_direct_operating_expensesAmount18",
        20: "depreciationMethodAmount20",
        21: "loanTypeAmount21",
        22: "interestTypeAmount22",
        23: "generalInflationRateAmount23",
        24: "interestProportionAmount24",
        25: "principalProportionAmount25",
        26: "loanPercentageAmount26",
        27: "repaymentPercentageOfRevenueAmount27",
        28: "numberofconstructionYearsAmount28",
        30: "iRRAmount30",
        31: "annualInterestRateAmount31",
        32: "stateTaxRateAmount32",
        33: "federalTaxRateAmount33",
        34: "rawmaterialAmount34",
        35: "laborAmount35",
        36: "utilityAmount36",
        37: "maintenanceAmount37",
        38: "insuranceAmount38"
    }
    
    # Get property ID
    property_id = param_mappings.get(param_num)
    if not property_id:
        logger.warning(f"No property mapping found for parameter {param_id}")
        return None
        
    return property_id

def get_display_name(param_id):
    """
    Get the display name for a sensitivity parameter.
    
    Args:
        param_id (str): Parameter ID (e.g., "S34")
        
    Returns:
        str: Display name (e.g., "Raw Material")
    """
    # Get property ID
    property_id = get_property_id(param_id)
    if not property_id:
        return param_id
    
    # Define display names
    display_names = {
        "plantLifetimeAmount10": "Plant Lifetime",
        "bECAmount11": "BEC",
        "numberOfUnitsAmount12": "Number of Units",
        "initialSellingPriceAmount13": "Initial Selling Price",
        "totalOperatingCostPercentageAmount14": "Total Operating Cost Percentage",
        "engineering_Procurement_and_Construction_EPC_Amount15": "EPC",
        "process_contingency_PC_Amount16": "Process Contingency",
        "project_Contingency_PT_BEC_EPC_PCAmount17": "Project Contingency",
        "use_direct_operating_expensesAmount18": "Direct Operating Expenses",
        "depreciationMethodAmount20": "Depreciation Method",
        "loanTypeAmount21": "Loan Type",
        "interestTypeAmount22": "Interest Type",
        "generalInflationRateAmount23": "General Inflation Rate",
        "interestProportionAmount24": "Interest Proportion",
        "principalProportionAmount25": "Principal Proportion",
        "loanPercentageAmount26": "Loan Percentage",
        "repaymentPercentageOfRevenueAmount27": "Repayment Percentage of Revenue",
        "numberofconstructionYearsAmount28": "Number of Construction Years",
        "iRRAmount30": "IRR",
        "annualInterestRateAmount31": "Annual Interest Rate",
        "stateTaxRateAmount32": "State Tax Rate",
        "federalTaxRateAmount33": "Federal Tax Rate",
        "rawmaterialAmount34": "Raw Material",
        "laborAmount35": "Labor",
        "utilityAmount36": "Utility",
        "maintenanceAmount37": "Maintenance",
        "insuranceAmount38": "Insurance"
    }
    
    # Get display name
    display_name = display_names.get(property_id, property_id)
    return display_name

# Example usage
if __name__ == "__main__":
    # Create example configuration
    example_config = {
        "versions": [1],
        "selectedV": {"V1": "on", "V2": "off"},
        "selectedF": {"F1": "on", "F2": "on", "F3": "on", "F4": "on", "F5": "on"},
        "selectedCalculationOption": "calculateForPrice",
        "targetRow": 20,
        "SenParameters": {
            "S34": {
                "mode": "symmetrical",
                "values": [20],
                "enabled": True,
                "compareToKey": "S13",
                "comparisonType": "primary",
                "waterfall": True,
                "bar": True,
                "point": True
            }
        }
    }
    
    # Validate configuration
    is_valid, errors = validate_configuration(example_config)
    if is_valid:
        print("Configuration is valid")
    else:
        print(f"Configuration is invalid: {errors}")
        
    # Create SensitivityConfiguration object
    config = SensitivityConfiguration.from_dict(example_config)
    print(f"Configuration: {config.to_dict()}")
    
    # Get property ID and display name
    param_id = "S34"
    property_id = get_property_id(param_id)
    display_name = get_display_name(param_id)
    print(f"Parameter: {param_id}, Property ID: {property_id}, Display Name: {display_name}")
