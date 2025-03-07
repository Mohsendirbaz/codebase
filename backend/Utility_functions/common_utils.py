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
   "vAmount60": "v60",
  "vAmount61": "v61",
  "vAmount62": "v62",
  "vAmount63": "v63",
  "vAmount64": "v64",
  "vAmount65": "v65",
  "vAmount66": "v66",
  "vAmount67": "v67",
  "vAmount68": "v68",
  "vAmount69": "v69",

  "vAmount70": "v70",
  "vAmount71": "v71",
  "vAmount72": "v72",
  "vAmount73": "v73",
  "vAmount74": "v74",
  "vAmount75": "v75",
  "vAmount76": "v76",
  "vAmount77": "v77",
  "vAmount78": "v78",
  "vAmount79": "v79",
}



def extract_properties(config_file):
    spec = importlib.util.spec_from_file_location("config", config_file)
    config = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(config)
    properties = {key: getattr(config, key, None) for key in property_mapping.keys()}
    return properties

