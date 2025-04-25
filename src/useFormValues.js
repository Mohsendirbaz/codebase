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
      },
      // Dynamic appendix for scaling, group, and item state
      dynamicAppendix: {
        scaling: {
          type: null, // 'Amount4', 'Amount5', 'Amount6', 'Amount7', etc.
          factor: 1,
          operation: 'multiply',
          enabled: false,
          baseValue: defaultValues[key] !== undefined ? defaultValues[key] : 0,
          scaledValue: defaultValues[key] !== undefined ? defaultValues[key] : 0,
          notes: ''
        },
        group: {
          id: null,
          name: null,
          isProtected: false
        },
        itemState: {
          vKey: key.includes('vAmount') ? `V${parseInt(key.replace('vAmount', ''))}` : null,
          rKey: key.includes('rAmount') ? `R${parseInt(key.replace('rAmount', ''))}` : null,
          fKey: key.includes('Amount') && parseInt(key.replace(/\D/g, '')) >= 34 && parseInt(key.replace(/\D/g, '')) <= 38 ? `F${parseInt(key.replace(/\D/g, '')) - 33}` : null,
          rfKey: key.includes('Amount') && parseInt(key.replace(/\D/g, '')) >= 80 && parseInt(key.replace(/\D/g, '')) <= 84 ? `RF${parseInt(key.replace(/\D/g, '')) - 79}` : null,
          sKey: key.includes('Amount') ? `S${parseInt(key.replace(/\D/g, ''))}` : null,
          status: 'off' // 'on' or 'off'
        }
      }
    };

    return values;
  }, {});
};

// Main hook implementation
const useFormValues = () => {
  const [formValues, setFormValues] = useState(initializeFormValues());

  // Initialize S state for sensitivity analysis (now also stored in formValues.dynamicAppendix)
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

  // Initialize F state for factor parameters (now also stored in formValues.dynamicAppendix)
  const [F, setF] = useState({ F1: 'on', F2: 'on', F3: 'on', F4: 'on', F5: 'on' });

  // Initialize V state for process quantities variables (now also stored in formValues.dynamicAppendix)
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

  // Initialize SubDynamicPlots state for subplot selection
  const [subDynamicPlots, setSubDynamicPlots] = useState({
    SP1: 'off', // Annual Cash Flows
    SP2: 'off', // Annual Revenues
    SP3: 'off', // Annual Operating Expenses
    SP4: 'off', // Loan Repayment Terms
    SP5: 'off', // Depreciation Schedules
    SP6: 'off', // State Taxes
    SP7: 'off', // Federal Taxes
    SP8: 'off', // Cumulative Cash Flows
    SP9: 'off', // Reserved for future use
  });

  // Initialize R state for revenue variables (now also stored in formValues.dynamicAppendix)
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

  // Initialize RF state for fixed revenue parameters (now also stored in formValues.dynamicAppendix)
  const [RF, setRF] = useState({ RF1: 'on', RF2: 'on', RF3: 'on', RF4: 'on', RF5: 'on' });

  // Initialize reset options state
  const [showResetOptions, setShowResetOptions] = useState(false);
  const [resetOptions, setResetOptions] = useState({
    S: true,
    F: true,
    V: true,
    R: true,
    RF: true,
    SP: true
  });

  // Initialize dynamic plots options state
  const [showDynamicPlotsOptions, setShowDynamicPlotsOptions] = useState(false);

  // Initialize run options state
  const [showRunOptions, setShowRunOptions] = useState(false);
  const [runOptions, setRunOptions] = useState({
    useSummaryItems: true,
    includeRemarks: false,
    includeCustomFeatures: false
  });

  // Note: scalingGroups, scalingBaseCosts, and finalResults are now integrated into formValues.dynamicAppendix
  // These states are kept for backward compatibility but will be synchronized with the formValues structure

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
  // Now also updates formValues.dynamicAppendix.scaling
  const handleFinalResultsGenerated = (summaryItems, filterKeyword) => {
    // Update the finalResults state for backward compatibility
    setFinalResults(prev => ({
      ...prev,
      [filterKeyword]: summaryItems
    }));

    // Update the corresponding formValues.dynamicAppendix.scaling
    setFormValues(prevValues => {
      const updatedValues = { ...prevValues };

      // Process each summary item
      summaryItems.forEach(item => {
        const formKey = item.id;

        // Only update if this form key exists
        if (updatedValues[formKey]) {
          updatedValues[formKey] = {
            ...updatedValues[formKey],
            dynamicAppendix: {
              ...updatedValues[formKey].dynamicAppendix,
              scaling: {
                ...updatedValues[formKey].dynamicAppendix.scaling,
                type: filterKeyword,
                scaledValue: item.finalResult || item.value,
                baseValue: item.baseValue || updatedValues[formKey].value,
                enabled: true
              }
            }
          };
        }
      });

      return updatedValues;
    });
  };

  // Toggle functions for F, V, R, and RF states - now also updates formValues.dynamicAppendix
  const toggleF = (key) => {
    const newStatus = F[key] === 'off' ? 'on' : 'off';

    // Update the F state
    setF((prev) => ({
      ...prev,
      [key]: newStatus,
    }));

    // Update the corresponding formValues.dynamicAppendix.itemState
    setFormValues(prevValues => {
      const updatedValues = { ...prevValues };

      // Find all form values with this F key in their dynamicAppendix
      Object.keys(updatedValues).forEach(formKey => {
        if (updatedValues[formKey].dynamicAppendix?.itemState?.fKey === key) {
          updatedValues[formKey] = {
            ...updatedValues[formKey],
            dynamicAppendix: {
              ...updatedValues[formKey].dynamicAppendix,
              itemState: {
                ...updatedValues[formKey].dynamicAppendix.itemState,
                status: newStatus
              }
            }
          };
        }
      });

      return updatedValues;
    });
  };

  const toggleV = (key) => {
    const newStatus = V[key] === 'off' ? 'on' : 'off';

    // Update the V state
    setV((prev) => ({
      ...prev,
      [key]: newStatus,
    }));

    // Update the corresponding formValues.dynamicAppendix.itemState
    setFormValues(prevValues => {
      const updatedValues = { ...prevValues };

      // Find all form values with this V key in their dynamicAppendix
      Object.keys(updatedValues).forEach(formKey => {
        if (updatedValues[formKey].dynamicAppendix?.itemState?.vKey === key) {
          updatedValues[formKey] = {
            ...updatedValues[formKey],
            dynamicAppendix: {
              ...updatedValues[formKey].dynamicAppendix,
              itemState: {
                ...updatedValues[formKey].dynamicAppendix.itemState,
                status: newStatus
              }
            }
          };
        }
      });

      return updatedValues;
    });
  };

  const toggleR = (key) => {
    const newStatus = R[key] === 'off' ? 'on' : 'off';

    // Update the R state
    setR((prev) => ({
      ...prev,
      [key]: newStatus,
    }));

    // Update the corresponding formValues.dynamicAppendix.itemState
    setFormValues(prevValues => {
      const updatedValues = { ...prevValues };

      // Find all form values with this R key in their dynamicAppendix
      Object.keys(updatedValues).forEach(formKey => {
        if (updatedValues[formKey].dynamicAppendix?.itemState?.rKey === key) {
          updatedValues[formKey] = {
            ...updatedValues[formKey],
            dynamicAppendix: {
              ...updatedValues[formKey].dynamicAppendix,
              itemState: {
                ...updatedValues[formKey].dynamicAppendix.itemState,
                status: newStatus
              }
            }
          };
        }
      });

      return updatedValues;
    });
  };

  const toggleSubDynamicPlot = (key) => {
    setSubDynamicPlots((prev) => ({
      ...prev,
      [key]: prev[key] === 'off' ? 'on' : 'off',
    }));
  };

  const toggleRF = (key) => {
    const newStatus = RF[key] === 'off' ? 'on' : 'off';

    // Update the RF state
    setRF((prev) => ({
      ...prev,
      [key]: newStatus,
    }));

    // Update the corresponding formValues.dynamicAppendix.itemState
    setFormValues(prevValues => {
      const updatedValues = { ...prevValues };

      // Find all form values with this RF key in their dynamicAppendix
      Object.keys(updatedValues).forEach(formKey => {
        if (updatedValues[formKey].dynamicAppendix?.itemState?.rfKey === key) {
          updatedValues[formKey] = {
            ...updatedValues[formKey],
            dynamicAppendix: {
              ...updatedValues[formKey].dynamicAppendix,
              itemState: {
                ...updatedValues[formKey].dynamicAppendix.itemState,
                status: newStatus
              }
            }
          };
        }
      });

      return updatedValues;
    });
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

  const resetFormItemValues = (options = { S: true, F: true, V: true, R: true, RF: true, SP: true }) => {
    // Initialize new form values
    const newFormValues = initializeFormValues();

    // Get current form values to preserve any data we don't want to reset
    const currentFormValues = { ...formValues };

    // If we're not resetting certain options, preserve their values in the dynamicAppendix
    Object.keys(newFormValues).forEach(key => {
      if (!options.S && currentFormValues[key]?.dynamicAppendix?.itemState?.sKey) {
        // Preserve S state in dynamicAppendix
        newFormValues[key].dynamicAppendix.itemState.status = 
          currentFormValues[key].dynamicAppendix.itemState.status;
      }

      if (!options.F && currentFormValues[key]?.dynamicAppendix?.itemState?.fKey) {
        // Preserve F state in dynamicAppendix
        newFormValues[key].dynamicAppendix.itemState.status = 
          currentFormValues[key].dynamicAppendix.itemState.status;
      }

      if (!options.V && currentFormValues[key]?.dynamicAppendix?.itemState?.vKey) {
        // Preserve V state in dynamicAppendix
        newFormValues[key].dynamicAppendix.itemState.status = 
          currentFormValues[key].dynamicAppendix.itemState.status;
      }

      if (!options.R && currentFormValues[key]?.dynamicAppendix?.itemState?.rKey) {
        // Preserve R state in dynamicAppendix
        newFormValues[key].dynamicAppendix.itemState.status = 
          currentFormValues[key].dynamicAppendix.itemState.status;
      }

      if (!options.RF && currentFormValues[key]?.dynamicAppendix?.itemState?.rfKey) {
        // Preserve RF state in dynamicAppendix
        newFormValues[key].dynamicAppendix.itemState.status = 
          currentFormValues[key].dynamicAppendix.itemState.status;
      }
    });

    // Set the updated form values
    setFormValues(newFormValues);

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

    // Reset SubDynamicPlots state if selected
    if (options.SP) {
      setSubDynamicPlots({
        SP1: 'off',
        SP2: 'off',
        SP3: 'off',
        SP4: 'off',
        SP5: 'off',
        SP6: 'off',
        SP7: 'off',
        SP8: 'off',
        SP9: 'off',
      });
    }

    // Reset scaling-related states if any of the options are selected
    if (options.S || options.F || options.V || options.R || options.RF) {
      // Reset scaling groups
      setScalingGroups([]);

      // Reset scaling base costs
      setScalingBaseCosts({
        Amount4: [],
        Amount5: [],
        Amount6: [],
        Amount7: []
      });

      // Reset final results
      setFinalResults({
        Amount4: [],
        Amount5: [],
        Amount6: [],
        Amount7: []
      });
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

  // Dynamic plots options handlers
  const handleDynamicPlots = () => {
    // Show the dynamic plots options popup
    setShowDynamicPlotsOptions(true);
  };

  const handleDynamicPlotsOptionChange = (option) => {
    toggleSubDynamicPlot(option);
  };

  const handleDynamicPlotsConfirm = () => {
    // Hide the dynamic plots options popup
    setShowDynamicPlotsOptions(false);
    // The actual functionality will be handled in HomePage.js
    // This just closes the popup
  };

  const handleDynamicPlotsCancel = () => {
    setShowDynamicPlotsOptions(false);
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

  // Enhanced setScalingGroups function that also updates formValues.dynamicAppendix.group
  const setScalingGroupsWithFormSync = (newGroups) => {
    // Update the scalingGroups state for backward compatibility
    setScalingGroups(newGroups);

    // Update the corresponding formValues.dynamicAppendix.group
    setFormValues(prevValues => {
      const updatedValues = { ...prevValues };

      // First, reset all group associations
      Object.keys(updatedValues).forEach(formKey => {
        if (updatedValues[formKey].dynamicAppendix) {
          updatedValues[formKey] = {
            ...updatedValues[formKey],
            dynamicAppendix: {
              ...updatedValues[formKey].dynamicAppendix,
              group: {
                id: null,
                name: null,
                isProtected: false
              }
            }
          };
        }
      });

      // Then, set the new group associations based on the items in each group
      newGroups.forEach(group => {
        group.items.forEach(item => {
          const formKey = item.id;

          // Only update if this form key exists
          if (updatedValues[formKey]) {
            updatedValues[formKey] = {
              ...updatedValues[formKey],
              dynamicAppendix: {
                ...updatedValues[formKey].dynamicAppendix,
                group: {
                  id: group.id,
                  name: group.name,
                  isProtected: group.isProtected || false
                },
                scaling: {
                  ...updatedValues[formKey].dynamicAppendix.scaling,
                  type: group._scalingType || updatedValues[formKey].dynamicAppendix.scaling.type,
                  factor: item.scalingFactor || updatedValues[formKey].dynamicAppendix.scaling.factor,
                  operation: item.operation || updatedValues[formKey].dynamicAppendix.scaling.operation,
                  enabled: item.enabled !== undefined ? item.enabled : updatedValues[formKey].dynamicAppendix.scaling.enabled,
                  baseValue: item.baseValue || updatedValues[formKey].dynamicAppendix.scaling.baseValue,
                  scaledValue: item.scaledValue || updatedValues[formKey].dynamicAppendix.scaling.scaledValue,
                  notes: item.notes || updatedValues[formKey].dynamicAppendix.scaling.notes
                }
              }
            };
          }
        });
      });

      return updatedValues;
    });
  };

  // Enhanced setScalingBaseCosts function that also updates formValues.dynamicAppendix.scaling
  const setScalingBaseCostsWithFormSync = (newBaseCosts) => {
    // Update the scalingBaseCosts state for backward compatibility
    setScalingBaseCosts(newBaseCosts);

    // Update the corresponding formValues.dynamicAppendix.scaling
    setFormValues(prevValues => {
      const updatedValues = { ...prevValues };

      // Process each scaling type and its base costs
      Object.entries(newBaseCosts).forEach(([scalingType, baseCosts]) => {
        baseCosts.forEach(cost => {
          const formKey = cost.id;

          // Only update if this form key exists
          if (updatedValues[formKey]) {
            updatedValues[formKey] = {
              ...updatedValues[formKey],
              dynamicAppendix: {
                ...updatedValues[formKey].dynamicAppendix,
                scaling: {
                  ...updatedValues[formKey].dynamicAppendix.scaling,
                  type: scalingType,
                  baseValue: cost.value || cost.baseValue || updatedValues[formKey].value
                }
              }
            };
          }
        });
      });

      return updatedValues;
    });
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
    subDynamicPlots,
    setSubDynamicPlots,
    toggleSubDynamicPlot,
    R,
    setR,
    toggleR,
    RF,
    setRF,
    toggleRF,
    scalingGroups,
    // Replace setScalingGroups with the enhanced version
    setScalingGroups: setScalingGroupsWithFormSync,
    scalingBaseCosts,
    // Replace setScalingBaseCosts with the enhanced version
    setScalingBaseCosts: setScalingBaseCostsWithFormSync,
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
    // Dynamic plots options popup states and functions
    showDynamicPlotsOptions,
    setShowDynamicPlotsOptions,
    handleDynamicPlots,
    handleDynamicPlotsOptionChange,
    handleDynamicPlotsConfirm,
    handleDynamicPlotsCancel,
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
