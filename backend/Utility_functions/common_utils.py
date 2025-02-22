import importlib.util
import numpy as np

property_mapping = {
    "plantLifetimeAmount10": "Plant",
    "bECAmount11": "Bare Erected Cost",
    "numberOfUnitsAmount12": "Number of Units",
    "initialSellingPriceAmount13": "Price",
    "totalOperatingCostPercentageAmount14": "Direct Total Operating Cost Percentage as % of Revenue",
    "engineering_Procurement_and_Construction_EPC_Amount15": "Engineering Procurement and Construction as % of BEC",
    "process_contingency_PC_Amount16": "Process Contingency as % of BEC",
    "project_Contingency_PT_BEC_EPC_PCAmount17": "Project Contingency as % of BEC, EPC, PC",
    "use_direct_operating_expensesAmount18": "Use Direct Operating Expenses",
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
    "vAmount40": "Additional Annualized CAPEX (TOC)(Node 1: Biomass Plantation)",
    "vAmount41": "Additional Annualized CAPEX (TOC)(Node 2: Clean Up and Pressurizing)",
    "vAmount42": "Additional Annualized CAPEX (TOC)(Node 3: T&S)",
    "vAmount43": "45 Q (mt CO2)",
    "vAmount44": "45 V (kg H2)",
    "vAmount45": "Premium of Adopting Sustainable Farming Practices ($ Feedstock basis)",
    "vAmount46": "Transport Cost (kg H2 basis)",
    "vAmount47": "Storage Cost (kg H2 basis)",
    "vAmount48": "Total Operating Costs",
    "vAmount49": "Distance to Viability (Post Analysis Measure)",
    "vAmount50": "Additional Annualized CAPEX (+% TOC($))(Node 1: Biomass Plantation)",
    "vAmount51": "Additional Annualized CAPEX (+% TOC($))(Node 2: Clean Up and Pressurizing)",
    "vAmount52": "Additional Annualized CAPEX (+% TOC($))(Node 3: T&S)",
    "vAmount53": "45 Q ($/mt CO2)",
    "vAmount54": "45 V ($/kg H2)",
    "vAmount55": "Premium of Adopting Sustainable Farming Practices (+% $ Feedstock basis)",
    "vAmount56": "Transport Cost ($/kg H2)",
    "vAmount57": "Storage Cost ($/kg H2)",
    "vAmount58": "Total Operating Costs +% OPEX($)",
    "vAmount59": "Distance to Viability (Post Analysis Measure)",
    "vAmount60": "Carbon Capture and Storage",
    "vAmount61": "Convenience Fee"
}



def extract_properties(config_file):
    spec = importlib.util.spec_from_file_location("config", config_file)
    config = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(config)
    properties = {key: getattr(config, key, None) for key in property_mapping.keys()}
    return properties

