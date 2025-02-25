/**
 * Service functions for configuration operations
 */

/**
 * Load configuration for a version
 * @param {string} version - The version to load configuration for
 * @returns {Promise<{filteredValues: Array}>} The configuration values
 */
export const loadConfiguration = async (version) => {
    try {
        const response = await fetch('http://localhost:5000/load_configuration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ version }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error loading configuration:', error);
        throw error;
    }
};

/**
 * Process configuration values for form state
 * @param {Array} filteredValues - The filtered values from the server
 * @returns {Object} The processed values ready for form state
 */
export const processConfigValues = (filteredValues) => {
    return filteredValues.reduce((acc, item) => {
        let { id, value, remarks } = item;
        
        // Process string values
        if (typeof value === 'string') {
            value = value.trim().replace(/^"|"$/g, '');
            value = isNaN(value) ? value : parseFloat(value);
        }

        // Build the form value object
        acc[id] = {
            value: typeof value === 'number' ? value : acc[id]?.value,
            remarks: remarks !== undefined ? remarks : acc[id]?.remarks,
        };

        return acc;
    }, {});
};

/**
 * Transform form values for submission
 * @param {Object} formValues - The form values to transform
 * @returns {Array} The transformed values ready for submission
 */
export const transformFormValues = (formValues) => {
    return Object.keys(formValues)
        .filter((key) =>
            ['Amount1', 'Amount2', 'Amount3', 'Amount4', 'Amount5', 'Amount6'].some((amt) =>
                key.includes(amt)
            )
        )
        .map((key) => {
            const item = formValues[key];
            const efficacyPeriod = item.efficacyPeriod || {};
            
            return {
                id: key,
                value: item.value,
                senParam: item.senParam,
                lifeStage: efficacyPeriod.lifeStage?.value,
                duration: efficacyPeriod.duration?.value,
                remarks: item.remarks || '',
            };
        });
};

/**
 * Initialize sensitivity parameters
 * @returns {Object} The initial sensitivity parameters
 */
export const initializeSensitivityParams = () => {
    const initialS = {};
    
    // Initialize all parameters (S10-S61)
    for (let i = 10; i <= 61; i++) {
        initialS[`S${i}`] = {
            mode: null,
            values: [],
            enabled: false,
            compareToKey: '',
            comparisonType: null,
            waterfall: false,
            bar: false,
            point: false,
        };
    }
    
    // Enable and configure specific parameters (S34-S38)
    for (let i = 34; i <= 38; i++) {
        initialS[`S${i}`] = {
            ...initialS[`S${i}`],
            mode: 'symmetrical',
            enabled: true,
            compareToKey: 'S13',
            comparisonType: 'primary',
            waterfall: true,
            bar: true,
            point: true,
        };
    }
    
    return initialS;
};

/**
 * Get sensitivity key for a subtab
 * @param {string} activeSubTab - The active subtab
 * @returns {string} The sensitivity key
 */
export const getSensitivityKey = (activeSubTab) => {
    const keyMap = {
        'ProjectConfig': '10',
        'LoanConfig': '20',
        'RatesConfig': '30',
        'Process1Config': '40',
        'Process2Config': '50'
    };

    return `S${keyMap[activeSubTab] || '10'}`;
};
