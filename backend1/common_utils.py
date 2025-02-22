import importlib.util
import numpy as np

property_mapping = {
  "plantLifetimeAmount1": "Plant Lifetime",
  "bECAmount1": "Bare Erected Cost",
  "numberOfUnitsAmount1": "Number of Units",
  "initialSellingPriceAmount1": "Price",
  "totalOperatingCostPercentageAmount1": "Direct Total Operating Cost Percentage as % of Revenue",
  "engineering_Procurement_and_Construction_EPC_BECAmount1": "Engineering Procurement and Construction as % of BEC",
  "process_contingency_PC_BECAmount1": "Process Contingency as % of BEC",
  "project_Contingency_PT_BEC_EPC_PCAmount1": "Project Contingency as % of BEC, EPC, PC",
  "use_direct_operating_expensesAmount1": "Use Direct Operating Expenses",
  "depreciationMethodAmount2": "Depreciation Method",
  "loanTypeAmount2": "Loan Type",
  "interestTypeAmount2": "Interest Type",
  "generalInflationRateAmount2": "General Inflation Rate",
  "interestProportionAmount2": "Interest Proportion",
  "principalProportionAmount2": "Principal Proportion",
  "loanPercentageAmount2": "Loan Percentage of TOC",
  "repaymentPercentageOfRevenueAmount2": "Repayment Percentage Of Revenue",
  "numberofconstructionYearsAmount2": "Number of Construction Years",
  "iRRAmount3": "Internal Rate of Return",
  "annualInterestRateAmount3": "Annual Interest Rate",
  "stateTaxRateAmount3": "State Tax Rate",
  "federalTaxRateAmount3": "Federal Tax Rate",
  "rawmaterialAmount3": "Feedstock Cost",
  "laborAmount3": "Labor Cost",
  "utilityAmount3": "Utility Cost",
  "maintenanceAmount3": "Maintenance Cost",
  "insuranceAmount3": "Insurance Cost",
   "gCAmount4": "Additional Annualized CAPEX (TOC)(Node 1: Biomass Plantation )",
  "ammoniaAmount4": "Additional Annualized CAPEX (TOC)(Node 2: Clean Up and Pressurizing)",
  "sulfuricAcidAmount4": "Additional Annualized CAPEX (TOC)(Node 3: T&S)",
  "fluorineAmount4": "45 Q (mt CO2)",
  "fluorsparTransportAmount4": "45 V (kg H2)",
  "naturalGasAmount4": "Premium of Adopting Sustainable Farming Practices ($ Feedstock basis)",
  "electricityAmount4": "Transport Cost (kg H2 basis)",
  "processWaterAmount4": "Storage Cost (kg H2 basis)",
  "coolingWaterAmount4": "Total Operating Costs",
  "incentiveAmount4": "Distance to Viability (Post Analysis Measure)" ,
  "gCAmount5": "Additional Annualized CAPEX (+% TOC($))(Node 1: Biomass Plantation)", 
  "ammoniaAmount5": "Additional Annualized CAPEX (+% TOC($))(Node 2: Clean Up and Pressurizing)",
  "sulfuricAcidAmount5": "Additional Annualized CAPEX (+% TOC($))(Node 3: T&S)",
  "fluorineAmount5": "45 Q ($/mt CO2)",
  "fluorsparTransportAmount5": "45 V ($/kg H2)",
  "naturalGasAmount5": "Premium of Adopting Sustainable Farming Practices (+% $ Feedstock basis)",
  "electricityAmount5": "Transport Cost ($/kg H2)",
  "processWaterAmount5": "Storage Cost ($/kg H2)",
  "coolingWaterAmount5": "Total Operating Costs +% OPEX($)",
  "incentiveAmount5": "Distance to Viability (Post Analysis Measure)",
  "labourcostAmount6": "Carbon Capture and Storage",
  "operatorsAmount6": "Convenience Fee",
}



def extract_properties(config_file):
    spec = importlib.util.spec_from_file_location("config", config_file)
    config = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(config)
    properties = {key: getattr(config, key, None) for key in property_mapping.keys()}
    return properties

def set_default_values(config, required_params):
    for param, default_value in required_params.items():
        if not hasattr(config, param):
            setattr(config, param, default_value)

def extend_to_length(array, length, fill_value=0):
    if len(array) < length:
        return np.pad(array, (0, length - len(array)), 'constant', constant_values=(fill_value,))
    return array[:length]

def calculate_depreciation_schedule(cost, depreciation_type, depreciation_years, plant_lifetime, number_of_construction_years):
    if depreciation_type == 'MACRS':
        if depreciation_years == 5:
            rates = [0.20, 0.32, 0.192, 0.1152, 0.1152, 0.0576]
        else:
            raise ValueError("Unsupported MACRS recovery period")
        depreciation_schedule = [cost * rate for rate in rates]
    elif depreciation_type == 'Straight-Line':
        annual_depreciation = cost / depreciation_years
        depreciation_schedule = [annual_depreciation] * depreciation_years
    else:
        raise ValueError("Unsupported depreciation type")
    return extend_to_length(depreciation_schedule, plant_lifetime - number_of_construction_years)
