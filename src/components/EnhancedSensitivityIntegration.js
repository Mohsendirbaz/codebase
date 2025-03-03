import React, { useState, useEffect } from 'react';
import './EnhancedSensitivityIntegration.css';

/**
 * EnhancedSensitivityIntegration component for interacting with the enhanced sensitivity API.
 * This component demonstrates how to use the enhanced sensitivity API endpoints.
 */
const EnhancedSensitivityIntegration = () => {
    // State variables
    const [selectedVersions, setSelectedVersions] = useState([1]);
    const [V, setV] = useState({ V1: "on", V2: "off" });
    const [F, setF] = useState({ F1: "on", F2: "on", F3: "on", F4: "on", F5: "on" });
    const [selectedCalculationOption, setSelectedCalculationOption] = useState("calculateForPrice");
    const [target_row, setTargetRow] = useState(20);
    const [S, setS] = useState({
        S34: {
            mode: "symmetrical",
            values: [20],
            enabled: true,
            compareToKey: "S13",
            comparisonType: "primary",
            waterfall: true,
            bar: true,
            point: true
        }
    });
    
    // Status and results
    const [analysisRunning, setAnalysisRunning] = useState(false);
    const [configStatus, setConfigStatus] = useState(null);
    const [runStatus, setRunStatus] = useState(null);
    const [results, setResults] = useState(null);
    const [calculatedPrices, setCalculatedPrices] = useState({});
    const [error, setError] = useState(null);
    
    /**
     * Handle the generation of sensitivity configurations
     */
    const handleGenerateConfigurations = async () => {
        setAnalysisRunning(true);
        setError(null);
        
        try {
            // Prepare request payload
            const requestPayload = {
                selectedVersions,
                selectedV: V,
                selectedF: F,
                selectedCalculationOption,
                targetRow: target_row,
                SenParameters: S,
            };
            
            console.log('Generating sensitivity configurations:', requestPayload);
            
            // Call the enhanced sensitivity configure endpoint
            const response = await fetch('http://127.0.0.1:27890/enhanced/sensitivity/configure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload),
            });
            
            // Process the response
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate sensitivity configurations');
            }
            
            const result = await response.json();
            console.log('Sensitivity configurations generated successfully:', result);
            setConfigStatus(result);
            
        } catch (error) {
            console.error('Error generating sensitivity configurations:', error);
            setError(error.message);
        } finally {
            setAnalysisRunning(false);
        }
    };
    
    /**
     * Handle the execution of sensitivity calculations
     */
    const handleRunCalculations = async () => {
        setAnalysisRunning(true);
        setError(null);
        
        try {
            console.log('Running sensitivity calculations...');
            
            // Call the enhanced sensitivity runs endpoint
            const response = await fetch('http://127.0.0.1:27890/enhanced/runs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            
            // Process the response
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to run sensitivity calculations');
            }
            
            const result = await response.json();
            console.log('Sensitivity calculations completed successfully:', result);
            setRunStatus(result);
            
            // Fetch the results
            await fetchResults();
            
        } catch (error) {
            console.error('Error running sensitivity calculations:', error);
            setError(error.message);
        } finally {
            setAnalysisRunning(false);
        }
    };
    
    /**
     * Fetch sensitivity results
     */
    const fetchResults = async () => {
        try {
            console.log('Fetching sensitivity results...');
            
            // Call the enhanced sensitivity results endpoint
            const response = await fetch('http://127.0.0.1:27890/enhanced/sensitivity/results');
            
            // Process the response
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch sensitivity results');
            }
            
            const result = await response.json();
            console.log('Sensitivity results fetched successfully:', result);
            setResults(result);
            
            // Extract calculated prices
            if (result.results && result.results.raw_prices) {
                setCalculatedPrices(result.results.raw_prices);
            }
            
        } catch (error) {
            console.error('Error fetching sensitivity results:', error);
            setError(error.message);
        }
    };
    
    /**
     * Add a new sensitivity parameter
     */
    const addSensitivityParameter = (paramId) => {
        setS(prevS => ({
            ...prevS,
            [paramId]: {
                mode: "symmetrical",
                values: [20],
                enabled: true,
                compareToKey: "S13",
                comparisonType: "primary",
                waterfall: true,
                bar: true,
                point: true
            }
        }));
    };
    
    /**
     * Remove a sensitivity parameter
     */
    const removeSensitivityParameter = (paramId) => {
        setS(prevS => {
            const newS = { ...prevS };
            delete newS[paramId];
            return newS;
        });
    };
    
    /**
     * Update a sensitivity parameter
     */
    const updateSensitivityParameter = (paramId, field, value) => {
        setS(prevS => ({
            ...prevS,
            [paramId]: {
                ...prevS[paramId],
                [field]: value
            }
        }));
    };
    
    /**
     * Render the sensitivity parameters
     */
    const renderSensitivityParameters = () => {
        return Object.entries(S).map(([paramId, config]) => (
            <div key={paramId} className="sensitivity-parameter">
                <h4>{paramId}</h4>
                <div className="parameter-controls">
                    <div>
                        <label>
                            Mode:
                            <select
                                value={config.mode}
                                onChange={(e) => updateSensitivityParameter(paramId, 'mode', e.target.value)}
                            >
                                <option value="symmetrical">Symmetrical</option>
                                <option value="multipoint">Multipoint</option>
                            </select>
                        </label>
                    </div>
                    <div>
                        <label>
                            Values:
                            <input
                                type="number"
                                value={config.values[0] || 0}
                                onChange={(e) => updateSensitivityParameter(
                                    paramId, 
                                    'values', 
                                    [parseFloat(e.target.value)]
                                )}
                            />
                        </label>
                    </div>
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                checked={config.enabled}
                                onChange={(e) => updateSensitivityParameter(paramId, 'enabled', e.target.checked)}
                            />
                            Enabled
                        </label>
                    </div>
                    <div>
                        <label>
                            Compare To:
                            <input
                                type="text"
                                value={config.compareToKey || ''}
                                onChange={(e) => updateSensitivityParameter(paramId, 'compareToKey', e.target.value)}
                            />
                        </label>
                    </div>
                    <div>
                        <button onClick={() => removeSensitivityParameter(paramId)}>
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        ));
    };
    
    /**
     * Render the calculated prices
     */
    const renderCalculatedPrices = () => {
        if (Object.keys(calculatedPrices).length === 0) {
            return <p>No calculated prices available.</p>;
        }
        
        return (
            <table className="calculated-prices">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Mode</th>
                        <th>Variation</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(calculatedPrices).map(([key, price]) => {
                        const [paramId, mode, variation] = key.split('_');
                        return (
                            <tr key={key}>
                                <td>{paramId}</td>
                                <td>{mode}</td>
                                <td>{variation}</td>
                                <td>${price.toFixed(2)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };
    
    return (
        <div className="enhanced-sensitivity-integration">
            <h2>Enhanced Sensitivity Analysis</h2>
            
            {error && (
                <div className="error-message">
                    <p>Error: {error}</p>
                </div>
            )}
            
            <div className="sensitivity-controls">
                <h3>Sensitivity Parameters</h3>
                {renderSensitivityParameters()}
                <button 
                    onClick={() => addSensitivityParameter(`S${Math.floor(Math.random() * 50) + 10}`)}
                    disabled={analysisRunning}
                >
                    Add Parameter
                </button>
            </div>
            
            <div className="action-buttons">
                <button 
                    onClick={handleGenerateConfigurations}
                    disabled={analysisRunning}
                >
                    1. Generate Configurations
                </button>
                <button 
                    onClick={handleRunCalculations}
                    disabled={analysisRunning || !configStatus}
                >
                    2. Run Calculations
                </button>
                <button 
                    onClick={fetchResults}
                    disabled={analysisRunning || !runStatus}
                >
                    3. Fetch Results
                </button>
            </div>
            
            {analysisRunning && (
                <div className="loading">
                    <p>Processing... Please wait.</p>
                </div>
            )}
            
            {configStatus && (
                <div className="status-section">
                    <h3>Configuration Status</h3>
                    <pre>{JSON.stringify(configStatus, null, 2)}</pre>
                </div>
            )}
            
            {runStatus && (
                <div className="status-section">
                    <h3>Run Status</h3>
                    <pre>{JSON.stringify(runStatus, null, 2)}</pre>
                </div>
            )}
            
            {results && (
                <div className="results-section">
                    <h3>Results</h3>
                    <div className="calculated-prices-section">
                        <h4>Calculated Prices</h4>
                        {renderCalculatedPrices()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedSensitivityIntegration;
