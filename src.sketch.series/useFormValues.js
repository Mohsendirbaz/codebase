import { useState } from 'react';
import { faDollarSign, faCogs, faIndustry, faBuilding, faWarehouse, faHandshake, faChartLine, faTools } from '@fortawesome/free-solid-svg-icons';

// Complete property mapping object with updated vAmount nomenclature
const propertyMapping = {
  // Amount10-19 group
  "plantLifetimeAmount10": "Plant Lifetime",
  "bECAmount11": "Bare Erected Cost",
  "numberOfUnitsAmount12": "Number of Units",
  "initialSellingPriceAmount13": "Price",
  "totalOperatingCostPercentageAmount14": "Direct Total Operating Cost Percentage as % of Revenue",
  "engineering_Procurement_and_Construction_EPC_Amount15": "Engineering Procurement and Construction as % of BEC",
  "process_contingency_PC_Amount16": "Process Contingency as % of BEC",
  "project_Contingency_PT_BEC_EPC_PCAmount17": "Project Contingency as % of BEC, EPC, PC",
  "use_direct_operating_expensesAmount18": "Use Direct Operating Expenses",

  // Amount20-29 group
  "depreciationMethodAmount20": "Depreciation Method",
  "loanTypeAmount21": "Loan Type",
  "interestTypeAmount22": "Interest Type",
  "generalInflationRateAmount23": "General Inflation Rate",
  "interestProportionAmount24": "Interest Proportion",
  "principalProportionAmount25": "Principal Proportion",
  "loanPercentageAmount26": "Loan Percentage of TOC",
  "repaymentPercentageOfRevenueAmount27": "Repayment Percentage Of Revenue",
  "numberofconstructionYearsAmount28": "Number of Construction Years",

  // Amount30-39 group
  "iRRAmount30": "Internal Rate of Return",
  "annualInterestRateAmount31": "Annual Interest Rate",
  "stateTaxRateAmount32": "State Tax Rate",
  "federalTaxRateAmount33": "Federal Tax Rate",
  "rawmaterialAmount34": "Feedstock Cost",
  "laborAmount35": "Labor Cost",
  "utilityAmount36": "Utility Cost",
  "maintenanceAmount37": "Maintenance Cost",
  "insuranceAmount38": "Insurance Cost",

  // vAmount40-49 group
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

  // vAmount50-59 group
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

  // vAmount60-69 group
  "vAmount60": "Carbon Capture and Storage",
  "vAmount61": "Convenience Fee"
};

// Complete select options mapping
const selectOptionsMapping = {
  "depreciationMethodAmount20": ['Straight-Line', '5-MACRS', '7-MACRS', '15-MACRS', 'Custom'],
  "loanTypeAmount21": ['simple', 'compounded'],
  "interestTypeAmount22": ['fixed', 'variable'],
  "loanRepaymentFrequencyAmount21": ['quarterly', 'semiannually', 'annually'],
  "use_direct_operating_expensesAmount18": ['True', 'False']
};

// Complete icon mapping with updated vAmount nomenclature
const iconMapping = {
  // Amount10-19 icons
  "bECAmount11": faDollarSign,
  "numberOfUnitsAmount12": faCogs,
  "initialSellingPriceAmount13": faDollarSign,
  "totalOperatingCostPercentageAmount14": faChartLine,
  "engineering_Procurement_and_Construction_EPC_Amount15": faIndustry,
  "process_contingency_PC_Amount16": faCogs,
  "project_Contingency_PT_BEC_EPC_PCAmount17": faTools,
  "plantLifetimeAmount10": faBuilding,

  // Amount20-29 icons
  "depreciationMethodAmount20": faChartLine,
  "loanTypeAmount21": faDollarSign,
  "interestTypeAmount22": faDollarSign,
  "generalInflationRateAmount23": faChartLine,
  "interestProportionAmount24": faDollarSign,
  "principalProportionAmount25": faDollarSign,
  "loanPercentageAmount26": faDollarSign,
  "repaymentPercentageOfRevenueAmount27": faDollarSign,
  "numberofconstructionYearsAmount28": faBuilding,

  // Amount30-39 icons
  "iRRAmount30": faChartLine,
  "annualInterestRateAmount31": faDollarSign,
  "stateTaxRateAmount32": faDollarSign,
  "federalTaxRateAmount33": faDollarSign,
  "rawmaterialAmount34": faWarehouse,
  "laborAmount35": faTools,
  "utilityAmount36": faWarehouse,
  "maintenanceAmount37": faTools,
  "insuranceAmount38": faHandshake,

  // vAmount icons (40-61)
  ...Object.fromEntries(
    Array.from({ length: 22 }, (_, i) => [`vAmount${40 + i}`, faWarehouse])
  )
};

// Complete default values initialization
const defaultValues = {
  // Amount10-19 defaults
  bECAmount11: 200_000,
  numberOfUnitsAmount12: 30000,
  initialSellingPriceAmount13: 2,
  totalOperatingCostPercentageAmount14: 0.1,
  engineering_Procurement_and_Construction_EPC_Amount15: 0,
  process_contingency_PC_Amount16: 0,
  project_Contingency_PT_BEC_EPC_PCAmount17: 0,
  use_direct_operating_expensesAmount18: 'False',
  plantLifetimeAmount10: 20,

  // Amount20-29 defaults
  numberofconstructionYearsAmount28: 1,
  depreciationMethodAmount20: 'Straight-Line',
  loanTypeAmount21: 'simple',
  interestTypeAmount22: 'fixed',
  generalInflationRateAmount23: 0,
  interestProportionAmount24: 0.5,
  principalProportionAmount25: 0.5,
  loanPercentageAmount26: 0.2,
  repaymentPercentageOfRevenueAmount27: 0.1,

  // Amount30-39 defaults
  iRRAmount30: 0.05,
  annualInterestRateAmount31: 0.04,
  stateTaxRateAmount32: 0.05,
  federalTaxRateAmount33: 0.21,
  rawmaterialAmount34: 10000,
  laborAmount35: 24000,
  utilityAmount36: 5000,
  maintenanceAmount37: 2500,
  insuranceAmount38: 500,

  // vAmount defaults (40-61)
  ...Object.fromEntries(
    Array.from({ length: 22 }, (_, i) => [`vAmount${40 + i}`, 0])
  )
};

// Form values initialization function
const initializeFormValues = () => {
  return Object.keys(propertyMapping).reduce((values, key) => {
    let stepValue = (typeof defaultValues[key] === 'number' && !selectOptionsMapping[key])
    ? Math.round((defaultValues[key] * 0.20) * 1000) / 1000 // Default step calculation with 20% rule, keeping up to 3 decimal places
    : '';

    values[key] = {
      id: key,
      value: defaultValues[key] !== undefined ? defaultValues[key] : '',
      type: selectOptionsMapping[key] ? 'select' : (typeof defaultValues[key] === 'number' ? 'number' : 'text'),
      label: propertyMapping[key],
      placeholder: defaultValues[key] !== undefined ? defaultValues[key] : '',
      step: stepValue,
      options: selectOptionsMapping[key] || [],
      remarks: "",
      remarksStyle: { color: '#007bff !important' },
      efficacyPeriod: {
        start: {
          value: 0,
          type: 'number',
          label: 'Start',
          step: 1,
          min: 0,
          max: 1000,
        },
        end: {
          value: defaultValues['plantLifetimeAmount10'],
          type: 'number',
          label: 'End',
          step: 1,
          min: 0,
          max: 1000,
        }
      }
    };

    return values;
  }, {});
};

// Main hook implementation
const useFormValues = () => {
  const [formValues, setFormValues] = useState(initializeFormValues());

  const handleInputChange = (e, id, type, subType = null) => {
    let { value } = e.target;

    if (type === 'number') {
      value = parseFloat(value);
      if (isNaN(value)) {
        value = null;
      }
    }

    setFormValues(prevValues => {
      if (subType) {
        return {
          ...prevValues,
          [id]: {
            ...prevValues[id],
            [type]: {
              ...prevValues[id][type],
              [subType]: {
                ...prevValues[id][type][subType],
                value: value
              }
            }
          }
        };
      } else {
        return {
          ...prevValues,
          [id]: {
            ...prevValues[id],
            [type]: value
          }
        };
      }
    });
  };

  const resetFormItemValues = () => {
    setFormValues(initializeFormValues());
  };

  const handleReset = () => {
    resetFormItemValues();
  };

  return {
    formValues,
    handleInputChange,
    setFormValues,
    resetFormItemValues,
    handleReset,
    propertyMapping,
    iconMapping
  };
};

export default useFormValues;