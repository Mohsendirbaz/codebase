import { useState } from 'react';
import { faDollarSign, faCogs, faIndustry, faBuilding, faWarehouse, faHandshake, faChartLine, faTools } from '@fortawesome/free-solid-svg-icons';

// Complete property mapping object with updated vAmount nomenclature
const propertyMapping = {
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
  "vAmount55": "v551",
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
  "RFAmount80": "Material Revenue",
  "RFAmount81": "Labor Revenue",
  "RFAmount82": "Utility Revenue",
  "RFAmount83": "Maintenance Revenue",
  "RFAmount84": "Insurance Revenue",
};

// Complete select options mapping
const selectOptionsMapping = {
  "depreciationMethodAmount20": ['Straight-Line', '5-MACRS', '7-MACRS', '15-MACRS', 'Custom'],
  "loanTypeAmount21": ['simple', 'compounded'],
  "interestTypeAmount22": ['fixed', 'variable'],
  "loanRepaymentFrequencyAmount21": ['quarterly', 'semiannually', 'annually'],
  "use_direct_operating_expensesAmount18": ['True', 'False'],
  "use_direct_revenueAmount19": ['True', 'False']
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
  "use_direct_operating_expensesAmount18": faHandshake,
  "use_direct_revenueAmount19": faHandshake,

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

  // vAmount icons (40-79)
  ...Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [`vAmount${40 + i}`, faWarehouse])
  ),
  ...Object.fromEntries(
    Array.from({ length: 40 }, (_, i) => [`rAmount${60 + i}`, faWarehouse])
  ),

  // RFAmount icons (80-84)
  "RFAmount80": faWarehouse,
  "RFAmount81": faTools,
  "RFAmount82": faWarehouse,
  "RFAmount83": faTools,
  "RFAmount84": faHandshake,
};

// Complete default values initialization
const defaultValues = {
  // Amount10-19 defaults
  bECAmount11: 300000,
  numberOfUnitsAmount12: 30000,
  initialSellingPriceAmount13: 2,
  totalOperatingCostPercentageAmount14: 0.1,
  engineering_Procurement_and_Construction_EPC_Amount15: 0,
  process_contingency_PC_Amount16: 0,
  project_Contingency_PT_BEC_EPC_PCAmount17: 0,
  use_direct_operating_expensesAmount18: "False",
  use_direct_revenueAmount19: "False",
  plantLifetimeAmount10: 20,

  // Amount20-29 defaults
  numberofconstructionYearsAmount28: 1,
  depreciationMethodAmount20: "Straight-Line",
  loanTypeAmount21: "simple",
  interestTypeAmount22: "fixed",
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

  // RFAmount80-84 defaults
  RFAmount80: 10000,
  RFAmount81: 24000,
  RFAmount82: 5000,
  RFAmount83: 2500,
  RFAmount84: 500,

  ...Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`vAmount${40 + i}`,1])
  ),
  ...Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`rAmount${60 + i}`,1])
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

  // Initialize S state for sensitivity analysis
  const [S, setS] = useState(() => {
    const initialS = {};
    for (let i = 10; i <= 84; i++) {
      initialS[`S${i}`] = {
        mode: null,
        values: [],
        enabled: false,
        compareToKey: '',
        comparisonType: null,
        waterfall: false,
        bar: false,
        point: false
      };
    }
    return initialS;
  });

  // Initialize F state for factor parameters
  const [F, setF] = useState({ F1: 'on', F2: 'on', F3: 'on', F4: 'on', F5: 'on' });
  // Initialize V state for process quantities variables
  const [V, setV] = useState({
    V1: 'off',
    V2: 'off',
    V3: 'off',
    V4: 'off',
    V5: 'off',
    V6: 'off',
    V7: 'off',
    V8: 'off',
    V9: 'off',
    V10: 'off',
  });

  // Initialize R state for revenue variables
  const [R, setR] = useState({
    R1: 'off',
    R2: 'off',
    R3: 'off',
    R4: 'off',
    R5: 'off',
    R6: 'off',
    R7: 'off',
    R8: 'off',
    R9: 'off',
    R10: 'off',
  });

  // Initialize RF state for fixed revenue parameters
  const [RF, setRF] = useState({ RF1: 'on', RF2: 'on', RF3: 'on', RF4: 'on', RF5: 'on' });

  // Initialize reset options state
  const [showResetOptions, setShowResetOptions] = useState(false);
  const [resetOptions, setResetOptions] = useState({
    S: true,
    F: true,
    V: true,
    R: true,
    RF: true
  });

  // Initialize run options state
  const [showRunOptions, setShowRunOptions] = useState(false);
  const [runOptions, setRunOptions] = useState({
    useSummaryItems: true,
    includeRemarks: false,
    includeCustomFeatures: false
  });

  // Initialize scalingGroups state for scaling operations
  const [scalingGroups, setScalingGroups] = useState([]);

  // Initialize scalingBaseCosts state
  const [scalingBaseCosts, setScalingBaseCosts] = useState({
    Amount4: [], // Process Quantities
    Amount5: [], // Process Costs
    Amount6: [], // Revenue Quantities
    Amount7: []  // Revenue Prices
  });

  // Initialize finalResults state for storing scaling operation results
  const [finalResults, setFinalResults] = useState({
    Amount4: [],
    Amount5: [],
    Amount6: [],
    Amount7: []
  });

  // Handler for receiving final results from ExtendedScaling
  const handleFinalResultsGenerated = (summaryItems, filterKeyword) => {
    setFinalResults(prev => ({
      ...prev,
      [filterKeyword]: summaryItems
    }));
  };

  // Toggle functions for F, V, and R states
  const toggleF = (key) => {
    setF((prev) => ({
      ...prev,
      [key]: prev[key] === 'off' ? 'on' : 'off',
    }));
  };

  const toggleV = (key) => {
    setV((prev) => ({
      ...prev,
      [key]: prev[key] === 'off' ? 'on' : 'off',
    }));
  };

  const toggleR = (key) => {
    setR((prev) => ({
      ...prev,
      [key]: prev[key] === 'off' ? 'on' : 'off',
    }));
  };

  const toggleRF = (key) => {
    setRF((prev) => ({
      ...prev,
      [key]: prev[key] === 'off' ? 'on' : 'off',
    }));
  };

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

  const resetFormItemValues = (options = { S: true, F: true, V: true, R: true, RF: true }) => {
    // Always reset form values
    setFormValues(initializeFormValues());

    // Reset S state if selected
    if (options.S) {
      const initialS = {};
      for (let i = 10; i <= 84; i++) {
        initialS[`S${i}`] = {
          mode: null,
          values: [],
          enabled: false,
          compareToKey: '',
          comparisonType: null,
          waterfall: false,
          bar: false,
          point: false
        };
      }
      setS(initialS);
    }

    // Reset F state if selected
    if (options.F) {
      setF({ F1: 'on', F2: 'on', F3: 'on', F4: 'on', F5: 'on' });
    }

    // Reset V state if selected
    if (options.V) {
      setV({
        V1: 'off',
        V2: 'off',
        V3: 'off',
        V4: 'off',
        V5: 'off',
        V6: 'off',
        V7: 'off',
        V8: 'off',
        V9: 'off',
        V10: 'off',
      });
    }

    // Reset R state if selected
    if (options.R) {
      setR({
        R1: 'off',
        R2: 'off',
        R3: 'off',
        R4: 'off',
        R5: 'off',
        R6: 'off',
        R7: 'off',
        R8: 'off',
        R9: 'off',
        R10: 'off',
      });
    }

    // Reset RF state if selected
    if (options.RF) {
      setRF({ RF1: 'on', RF2: 'on', RF3: 'on', RF4: 'on', RF5: 'on' });
    }

    // Hide the reset options popup
    setShowResetOptions(false);
  };

  const handleReset = () => {
    // Show the reset options popup
    setShowResetOptions(true);
  };

  const handleResetOptionChange = (option) => {
    setResetOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleResetConfirm = () => {
    resetFormItemValues(resetOptions);
  };

  const handleResetCancel = () => {
    setShowResetOptions(false);
  };

  // Run options handlers
  const handleRun = () => {
    // Show the run options popup
    setShowRunOptions(true);
  };

  const handleRunOptionChange = (option) => {
    setRunOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleRunConfirm = () => {
    // Hide the run options popup
    setShowRunOptions(false);
    // The actual run functionality will be handled in HomePage.js
    // This just closes the popup
  };

  const handleRunCancel = () => {
    setShowRunOptions(false);
  };

  return {
    formValues,
    handleInputChange,
    setFormValues,
    resetFormItemValues,
    handleReset,
    propertyMapping,
    iconMapping,
    // Return the new states and functions
    S,
    setS,
    F,
    setF,
    toggleF,
    V,
    setV,
    toggleV,
    R,
    setR,
    toggleR,
    RF,
    setRF,
    toggleRF,
    scalingGroups,
    setScalingGroups,
    scalingBaseCosts,
    setScalingBaseCosts,
    finalResults,
    setFinalResults,
    handleFinalResultsGenerated,
    // Reset options popup states and functions
    showResetOptions,
    setShowResetOptions,
    resetOptions,
    setResetOptions,
    handleResetOptionChange,
    handleResetConfirm,
    handleResetCancel,
    // Run options popup states and functions
    showRunOptions,
    setShowRunOptions,
    runOptions,
    setRunOptions,
    handleRun,
    handleRunOptionChange,
    handleRunConfirm,
    handleRunCancel
  };
};

export default useFormValues;
