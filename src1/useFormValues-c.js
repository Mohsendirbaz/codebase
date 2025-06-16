import { useState } from 'react';
import { faDollarSign, faCogs, faIndustry, faBuilding, faWarehouse, faHandshake, faChartLine, faTools } from '@fortawesome/free-solid-svg-icons';

// Optimized property mapping with consistent naming
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
    ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`vAmount${40 + i}`, `v${40 + i}`])),
    ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`rAmount${60 + i}`, `r${60 + i}`])),
    "RFAmount80": "Material Revenue",
    "RFAmount81": "Labor Revenue",
    "RFAmount82": "Utility Revenue",
    "RFAmount83": "Maintenance Revenue",
    "RFAmount84": "Insurance Revenue",
};

// Compact select options mapping
const selectOptionsMapping = {
    "depreciationMethodAmount20": ['Straight-Line', '5-MACRS', '7-MACRS', '15-MACRS', 'Custom'],
    "loanTypeAmount21": ['simple', 'compounded'],
    "interestTypeAmount22": ['fixed', 'variable'],
    "loanRepaymentFrequencyAmount21": ['quarterly', 'semiannually', 'annually'],
    "use_direct_operating_expensesAmount18": ['True', 'False'],
    "use_direct_revenueAmount19": ['True', 'False']
};

// Icon mapping with category-based grouping for efficiency
const iconMapping = {
    // Financial icons
    ...Object.fromEntries(['bECAmount11', 'initialSellingPriceAmount13', 'loanTypeAmount21', 'interestTypeAmount22',
        'interestProportionAmount24', 'principalProportionAmount25', 'loanPercentageAmount26',
        'repaymentPercentageOfRevenueAmount27', 'annualInterestRateAmount31', 'stateTaxRateAmount32',
        'federalTaxRateAmount33'].map(key => [key, faDollarSign])),

    // Analysis & metrics icons
    ...Object.fromEntries(['totalOperatingCostPercentageAmount14', 'depreciationMethodAmount20', 'generalInflationRateAmount23',
        'iRRAmount30'].map(key => [key, faChartLine])),

    // Equipment & process icons
    ...Object.fromEntries(['numberOfUnitsAmount12', 'process_contingency_PC_Amount16', 'project_Contingency_PT_BEC_EPC_PCAmount17',
        'laborAmount35', 'maintenanceAmount37'].map(key => [key, faTools])),

    // Building & construction icons
    ...Object.fromEntries(['plantLifetimeAmount10', 'numberofconstructionYearsAmount28'].map(key => [key, faBuilding])),

    // Industry icons
    "engineering_Procurement_and_Construction_EPC_Amount15": faIndustry,

    // Commercial icons
    ...Object.fromEntries(['use_direct_operating_expensesAmount18', 'use_direct_revenueAmount19', 'insuranceAmount38',
        'RFAmount84'].map(key => [key, faHandshake])),

    // Materials & resources icons
    ...Object.fromEntries(['rawmaterialAmount34', 'utilityAmount36', 'RFAmount80', 'RFAmount82'].map(key => [key, faWarehouse])),

    // Dynamic icons for bulk items
    ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`vAmount${40 + i}`, faWarehouse])),
    ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`rAmount${60 + i}`, faWarehouse])),

    // Labor revenue icon
    "RFAmount81": faTools,
    "RFAmount83": faTools,
};

// Optimized default values with dynamic generation
const defaultValues = {
    // Core financial defaults
    bECAmount11: 300000, numberOfUnitsAmount12: 30000, initialSellingPriceAmount13: 2,
    totalOperatingCostPercentageAmount14: 0.1, engineering_Procurement_and_Construction_EPC_Amount15: 0,
    process_contingency_PC_Amount16: 0, project_Contingency_PT_BEC_EPC_PCAmount17: 0,
    use_direct_operating_expensesAmount18: "False", use_direct_revenueAmount19: "False",
    plantLifetimeAmount10: 20, numberofconstructionYearsAmount28: 1,

    // Loan and depreciation defaults
    depreciationMethodAmount20: "Straight-Line", loanTypeAmount21: "simple",
    interestTypeAmount22: "fixed", generalInflationRateAmount23: 0,
    interestProportionAmount24: 0.5, principalProportionAmount25: 0.5,
    loanPercentageAmount26: 0.2, repaymentPercentageOfRevenueAmount27: 0.1,

    // Rate and tax defaults
    iRRAmount30: 0.05, annualInterestRateAmount31: 0.04,
    stateTaxRateAmount32: 0.05, federalTaxRateAmount33: 0.21,

    // Operational cost defaults
    rawmaterialAmount34: 10000, laborAmount35: 24000, utilityAmount36: 5000,
    maintenanceAmount37: 2500, insuranceAmount38: 500,

    // Revenue defaults (matching operational costs)
    RFAmount80: 10000, RFAmount81: 24000, RFAmount82: 5000, RFAmount83: 2500, RFAmount84: 500,

    // Dynamic defaults for vAmount and rAmount
    ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`vAmount${40 + i}`, 1])),
    ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`rAmount${60 + i}`, 1]))
};

// Main hook implementation with optimized state initialization
const useFormValues = () => {
    // Initialize versions state
    const [versions, setVersionsState] = useState({
        list: ["v1"],
        active: "v1",
        metadata: {
            "v1": {
                label: "Base Case",
                description: "Default financial case",
                created: Date.now(),
                modified: Date.now()
            }
        }
    });

    // Initialize zones state
    const [zones, setZonesState] = useState({
        list: ["z1"],
        active: "z1",
        metadata: {
            "z1": {
                label: "Local",
                description: "Local market zone",
                created: Date.now()
            }
        }
    });

    // Initialize form matrix with dynamic calculation
    const [formMatrix, setFormMatrix] = useState(() => {
        return Object.keys(propertyMapping).reduce((matrix, key) => {
            const isNumber = typeof defaultValues[key] === 'number';
            const isSelect = selectOptionsMapping[key] !== undefined;
            const stepValue = isNumber && !isSelect ? Math.round((defaultValues[key] * 0.20) * 1000) / 1000 : '';

            // Create parameter object with matrix structure
            matrix[key] = {
                id: key,
                label: propertyMapping[key],
                type: isSelect ? 'select' : (isNumber ? 'number' : 'text'),
                placeholder: defaultValues[key] !== undefined ? defaultValues[key] : '',
                step: stepValue,
                options: selectOptionsMapping[key] || [],
                remarks: "",
                remarksStyle: { color: '#007bff !important' },
                efficacyPeriod: {
                    start: { value: 0, type: 'number', label: 'Start', step: 1, min: 0, max: 1000 },
                    end: { value: defaultValues['plantLifetimeAmount10'], type: 'number', label: 'End', step: 1, min: 0, max: 1000 }
                },
                // Matrix structure for versions and zones
                versions: {
                    "v1": {
                        label: "Base Case",
                        isActive: true
                    }
                },
                zones: {
                    "z1": {
                        label: "Local",
                        isActive: true
                    }
                },
                matrix: {
                    "v1": {
                        "z1": defaultValues[key] !== undefined ? defaultValues[key] : ''
                    }
                },
                inheritance: {
                    "v1": {
                        source: null,
                        percentage: 100
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
            return matrix;
        }, {});
    });

    // Combined formValues object with matrix structure
    const formValues = {
        formMatrix,
        versions,
        zones,
        iconMapping
    };

    // Initialize analysis states using functional initialization
    const [S, setS] = useState(() => Object.fromEntries(
        Array.from({ length: 70 }, (_, i) => [`S${i + 10}`, {
            mode: null, values: [], enabled: false, compareToKey: '',
            comparisonType: null, waterfall: false, bar: false, point: false
        }])
    ));

    // Initialize toggle states with optimized structure
    const [F, setF] = useState(() => Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`F${i + 1}`, 'on'])));
    const [RF, setRF] = useState(() => Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`RF${i + 1}`, 'on'])));

    const createOffToggleState = (prefix, count) => Object.fromEntries(
        Array.from({ length: count }, (_, i) => [`${prefix}${i + 1}`, 'off'])
    );

    const [V, setV] = useState(() => createOffToggleState('V', 10));
    const [R, setR] = useState(() => createOffToggleState('R', 10));

    // Initialize reset and scaling states
    const [showResetOptions, setShowResetOptions] = useState(false);
    const [resetOptions, setResetOptions] = useState({ S: true, F: true, V: true, R: true, RF: true, SP: true });
    const [scalingGroups, setScalingGroups] = useState([]);
    const [scalingBaseCosts, setScalingBaseCosts] = useState({
        Amount4: [], Amount5: [], Amount6: [], Amount7: []
    });
    const [finalResults, setFinalResults] = useState({
        Amount4: [], Amount5: [], Amount6: [], Amount7: []
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

    // Initialize dynamic plots options state
    const [showDynamicPlotsOptions, setShowDynamicPlotsOptions] = useState(false);

    // Initialize run options state
    const [showRunOptions, setShowRunOptions] = useState(false);
    const [runOptions, setRunOptions] = useState({
        useSummaryItems: true,
        includeRemarks: false,
        includeCustomFeatures: false
    });

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

    // Matrix-aware version and zone management functions
    const setActiveVersion = (versionId) => {
        setVersionsState(prev => ({
            ...prev,
            active: versionId
        }));
    };

    const setActiveZone = (zoneId) => {
        setZonesState(prev => ({
            ...prev,
            active: zoneId
        }));
    };

    const createVersion = (label, description = null, baseVersion = null) => {
        // Generate version ID
        const versionId = `v${versions.list.length + 1}`;

        // Update versions state
        setVersionsState(prev => {
            const newVersions = {
                ...prev,
                list: [...prev.list, versionId],
                metadata: {
                    ...prev.metadata,
                    [versionId]: {
                        label,
                        description: description || `Version created on ${new Date().toLocaleString()}`,
                        created: Date.now(),
                        modified: Date.now(),
                        baseVersion
                    }
                }
            };
            return newVersions;
        });

        // Update form matrix to include the new version
        setFormMatrix(prev => {
            const updatedMatrix = { ...prev };

            // For each parameter, add the new version
            Object.keys(updatedMatrix).forEach(paramId => {
                const param = updatedMatrix[paramId];

                // Add version to parameter versions
                param.versions[versionId] = {
                    label,
                    isActive: false
                };

                // Initialize matrix for this version
                param.matrix[versionId] = {};

                // Set inheritance from base version if provided
                if (baseVersion) {
                    param.inheritance[versionId] = {
                        source: baseVersion,
                        percentage: 70  // Default to 70% inheritance
                    };

                    // Copy values from base version with 70% inheritance
                    Object.keys(param.matrix[baseVersion] || {}).forEach(zoneId => {
                        const baseValue = param.matrix[baseVersion][zoneId];
                        param.matrix[versionId][zoneId] = baseValue;
                    });
                } else {
                    param.inheritance[versionId] = {
                        source: null,
                        percentage: 100  // No inheritance
                    };

                    // Initialize with default values
                    Object.keys(param.zones).forEach(zoneId => {
                        param.matrix[versionId][zoneId] = defaultValues[paramId] !== undefined ? defaultValues[paramId] : '';
                    });
                }
            });

            return updatedMatrix;
        });

        return versionId;
    };

    const createZone = (label, description = null) => {
        // Generate zone ID
        const zoneId = `z${zones.list.length + 1}`;

        // Update zones state
        setZonesState(prev => {
            const newZones = {
                ...prev,
                list: [...prev.list, zoneId],
                metadata: {
                    ...prev.metadata,
                    [zoneId]: {
                        label,
                        description: description || `Zone created on ${new Date().toLocaleString()}`,
                        created: Date.now()
                    }
                }
            };
            return newZones;
        });

        // Update form matrix to include the new zone
        setFormMatrix(prev => {
            const updatedMatrix = { ...prev };

            // For each parameter, add the new zone
            Object.keys(updatedMatrix).forEach(paramId => {
                const param = updatedMatrix[paramId];

                // Add zone to parameter zones
                param.zones[zoneId] = {
                    label,
                    isActive: false
                };

                // Initialize matrix for this zone in all versions
                Object.keys(param.versions).forEach(versionId => {
                    // For new zone, use value from first existing zone as default
                    const firstZone = Object.keys(param.matrix[versionId])[0];
                    const defaultValue = firstZone ? param.matrix[versionId][firstZone] : 
                        (defaultValues[paramId] !== undefined ? defaultValues[paramId] : '');

                    param.matrix[versionId][zoneId] = defaultValue;
                });
            });

            return updatedMatrix;
        });

        return zoneId;
    };

    // Matrix-aware parameter value update function
    const updateParameterValue = (paramId, value, versionId = null, zoneId = null) => {
        // Use active version/zone if not specified
        const targetVersion = versionId || versions.active;
        const targetZone = zoneId || zones.active;

        setFormMatrix(prev => {
            // Skip if parameter doesn't exist
            if (!prev[paramId]) return prev;

            const updatedMatrix = { ...prev };
            const param = { ...updatedMatrix[paramId] };

            // Ensure matrix structure exists
            if (!param.matrix[targetVersion]) {
                param.matrix[targetVersion] = {};
            }

            // Update the value
            param.matrix[targetVersion][targetZone] = value;

            // Apply inheritance if needed
            Object.keys(param.inheritance).forEach(version => {
                const inheritance = param.inheritance[version];
                if (version !== targetVersion && inheritance.source === targetVersion && inheritance.percentage < 100) {
                    // Calculate inherited value
                    const sourceValue = value;
                    const currentValue = param.matrix[version][targetZone] || 0;
                    const inheritPercent = inheritance.percentage / 100;

                    // inherited value = (current * (1 - inherit%)) + (source * inherit%)
                    const newValue = (currentValue * (1 - inheritPercent)) + (sourceValue * inheritPercent);
                    param.matrix[version][targetZone] = newValue;
                }
            });

            updatedMatrix[paramId] = param;
            return updatedMatrix;
        });

        return true;
    };

    // Matrix-aware input change handler
    const handleInputChange = (e, id, type, subType = null) => {
        const { value: rawValue } = e.target;
        const value = type === 'number' ? (parseFloat(rawValue) || null) : rawValue;

        if (type === 'value') {
            // Update matrix value
            updateParameterValue(id, value);
        } else if (subType && type === 'efficacyPeriod') {
            // Update efficacy period
            setFormMatrix(prev => {
                const updatedMatrix = { ...prev };
                if (!updatedMatrix[id]) return updatedMatrix;

                const param = { ...updatedMatrix[id] };
                param.efficacyPeriod = {
                    ...param.efficacyPeriod,
                    [subType]: {
                        ...param.efficacyPeriod[subType],
                        value
                    }
                };

                updatedMatrix[id] = param;
                return updatedMatrix;
            });
        } else {
            // Update other properties
            setFormMatrix(prev => {
                const updatedMatrix = { ...prev };
                if (!updatedMatrix[id]) return updatedMatrix;

                updatedMatrix[id] = {
                    ...updatedMatrix[id],
                    [type]: value
                };

                return updatedMatrix;
            });
        }
    };

    // Reset functionality with matrix-aware implementation
    const resetFormItemValues = (options = resetOptions) => {
        // Reset versions if requested
        if (options.versions) {
            setVersionsState({
                list: ["v1"],
                active: "v1",
                metadata: {
                    "v1": {
                        label: "Base Case",
                        description: "Default financial case",
                        created: Date.now(),
                        modified: Date.now()
                    }
                }
            });
        }

        // Reset zones if requested
        if (options.zones) {
            setZonesState({
                list: ["z1"],
                active: "z1",
                metadata: {
                    "z1": {
                        label: "Local",
                        description: "Local market zone",
                        created: Date.now()
                    }
                }
            });
        }

        // Always reset form matrix
        setFormMatrix(Object.keys(propertyMapping).reduce((matrix, key) => {
            const isNumber = typeof defaultValues[key] === 'number';
            const isSelect = selectOptionsMapping[key] !== undefined;
            const stepValue = isNumber && !isSelect ? Math.round((defaultValues[key] * 0.20) * 1000) / 1000 : '';

            // Create parameter object with matrix structure
            matrix[key] = {
                id: key,
                label: propertyMapping[key],
                type: isSelect ? 'select' : (isNumber ? 'number' : 'text'),
                placeholder: defaultValues[key] !== undefined ? defaultValues[key] : '',
                step: stepValue,
                options: selectOptionsMapping[key] || [],
                remarks: "",
                remarksStyle: { color: '#007bff !important' },
                efficacyPeriod: {
                    start: { value: 0, type: 'number', label: 'Start', step: 1, min: 0, max: 1000 },
                    end: { value: defaultValues['plantLifetimeAmount10'], type: 'number', label: 'End', step: 1, min: 0, max: 1000 }
                },
                // Matrix structure for versions and zones
                versions: {
                    "v1": {
                        label: "Base Case",
                        isActive: true
                    }
                },
                zones: {
                    "z1": {
                        label: "Local",
                        isActive: true
                    }
                },
                matrix: {
                    "v1": {
                        "z1": defaultValues[key] !== undefined ? defaultValues[key] : ''
                    }
                },
                inheritance: {
                    "v1": {
                        source: null,
                        percentage: 100
                    }
                },
                // Dynamic appendix for scaling, group, and item state
                dynamicAppendix: {
                    scaling: {
                        type: null,
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
            return matrix;
        }, {}));

        // Conditionally reset other states based on options
        if (options.S) setS(Object.fromEntries(
            Array.from({ length: 70 }, (_, i) => [`S${i + 10}`, {
                mode: null, values: [], enabled: false, compareToKey: '',
                comparisonType: null, waterfall: false, bar: false, point: false
            }])
        ));

        if (options.F) setF(Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`F${i + 1}`, 'on'])));
        if (options.RF) setRF(Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`RF${i + 1}`, 'on'])));
        if (options.V) setV(createOffToggleState('V', 10));
        if (options.R) setR(createOffToggleState('R', 10));

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

        setShowResetOptions(false);
    };

    // Reset UI handlers
    const handleReset = () => setShowResetOptions(true);
    const handleResetOptionChange = (option) => setResetOptions(prev => ({ ...prev, [option]: !prev[option] }));
    const handleResetConfirm = () => resetFormItemValues(resetOptions);
    const handleResetCancel = () => setShowResetOptions(false);

    // SubDynamicPlots toggle function
    const toggleSubDynamicPlot = (key) => {
        setSubDynamicPlots((prev) => ({
            ...prev,
            [key]: prev[key] === 'off' ? 'on' : 'off',
        }));
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

    // Results handler
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

    // Update resetOptions to include versions and zones
    const updatedResetOptions = {
        ...resetOptions,
        versions: true,
        zones: true
    };

    return {
        // Matrix-based form values
        formValues,
        formMatrix,
        setFormMatrix,

        // Version and zone management
        versions,
        setActiveVersion,
        createVersion,

        zones,
        setActiveZone,
        createZone,

        // Parameter value management
        updateParameterValue,
        handleInputChange,

        // Reset functionality
        resetFormItemValues,
        handleReset,

        // Original properties and mappings
        propertyMapping,
        iconMapping,

        // Analysis states
        S, setS,
        F, setF, toggleF,
        V, setV, toggleV,
        R, setR, toggleR,
        RF, setRF, toggleRF,

        // Subplot management
        subDynamicPlots,
        setSubDynamicPlots,
        toggleSubDynamicPlot,

        // Scaling management
        scalingGroups,
        setScalingGroups: setScalingGroupsWithFormSync,
        scalingBaseCosts,
        setScalingBaseCosts: setScalingBaseCostsWithFormSync,
        finalResults,
        setFinalResults,
        handleFinalResultsGenerated,

        // Reset options popup states and functions
        showResetOptions,
        setShowResetOptions,
        resetOptions: updatedResetOptions,
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
