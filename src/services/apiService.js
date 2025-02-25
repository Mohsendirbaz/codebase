// API service functions for handling all network requests

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

export const createNewBatch = async () => {
    try {
        const response = await fetch('http://127.0.0.1:8001/create_new_batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Batch creation failed', error);
        throw error;
    }
};

export const removeBatch = async (version) => {
    try {
        const response = await fetch('http://127.0.0.1:7001/Remove_batch', {
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
        console.error('Error during batch removal:', error);
        throw error;
    }
};

export const checkAndCreateUploads = async () => {
    try {
        const response = await fetch('http://127.0.0.1:8007/check_and_create_uploads', {
            method: 'POST',
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Analysis failed', error);
        throw error;
    }
};

export const runAnalysis = async (selectedVersions, selectedV, selectedF, selectedCalculationOption, targetRow, SenParameters) => {
    try {
        const response = await fetch('http://127.0.0.1:5007/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                selectedVersions,
                selectedV,
                selectedF,
                selectedCalculationOption,
                targetRow,
                SenParameters,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error during analysis:', error);
        throw error;
    }
};

export const generatePngPlots = async (selectedVersions, selectedProperties, remarks, customizedFeatures) => {
    try {
        const response = await fetch('http://127.0.0.1:5008/generate_png_plots', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                selectedVersions,
                selectedProperties,
                remarks,
                customizedFeatures,
                S: {} // Empty sensitivity params for now
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error during PNG generation:', error);
        throw error;
    }
};

export const runSub = async (selectedVersions, selectedProperties, remarks, customizedFeatures, selectedV) => {
    try {
        const response = await fetch('http://127.0.0.1:5009/runSub', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                selectedVersions,
                selectedProperties,
                remarks,
                customizedFeatures,
                selectedV,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error during analysis:', error);
        throw error;
    }
};

export const submitCompleteSet = async (version, formValues) => {
    const formItems = Object.keys(formValues)
        .filter((key) =>
            ['Amount1', 'Amount2', 'Amount3', 'Amount4', 'Amount5', 'Amount6'].some((amt) =>
                key.includes(amt)
            )
        )
        .map((key) => ({
            id: key,
            ...formValues[key],
        }));

    const filteredValues = formItems.map((item) => {
        const efficacyPeriod = formValues[item.id].efficacyPeriod || {};
        return {
            id: item.id,
            value: item.value,
            senParam: item.senParam,
            lifeStage: efficacyPeriod.lifeStage?.value,
            duration: efficacyPeriod.duration?.value,
            remarks: item.remarks || '',
        };
    });

    try {
        const response = await fetch(`http://127.0.0.1:3052/append/${version}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filteredValues }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.text();
    } catch (error) {
        console.error('Error during parameter submission:', error);
        throw error;
    }
};

export const fetchHtmlFiles = async (version) => {
    try {
        const response = await fetch(`http://localhost:8009/api/album_html/${version}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching HTML files:', error);
        throw error;
    }
};

export const fetchImages = async (version) => {
    try {
        const response = await fetch(`http://localhost:8008/api/album/${version}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching images:', error);
        throw error;
    }
};

export const fetchCsvFiles = async (version) => {
    try {
        const response = await fetch(`http://localhost:8007/api/csv-files/${version}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching CSV files:', error);
        throw error;
    }
};
