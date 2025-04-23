import React, { useState, useEffect } from 'react';
import PlotsTabs from './PlotsTabs';

const SensitivityPlotsTabs = ({ version, S }) => {
    const [parameters, setParameters] = useState([]);
    const [relationships, setRelationships] = useState([]);
    const [selectedParameter, setSelectedParameter] = useState(null);
    const [visualizationData, setVisualizationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSensitivityData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Skip API call if version is empty (during refresh)
                if (!version) {
                    console.log('Skipping sensitivity data fetch - version is empty');
                    return;
                }

                // Extract first enabled parameter from S if available
                let firstParam = null;
                let paramMode = 'percentage';
                let compareToKey = 'S13';

                if (S) {
                    const enabledParams = Object.entries(S)
                        .filter(([_, config]) => config.enabled);

                    if (enabledParams.length > 0) {
                        const [paramId, config] = enabledParams[0];
                        firstParam = paramId;
                        paramMode = config.mode || 'percentage';
                        compareToKey = config.compareToKey || 'S13';
                    }
                }

                // Skip API call if no parameter is available
                if (!firstParam) {
                    console.log('Skipping sensitivity data fetch - no enabled parameters found');
                    setLoading(false);
                    setError("No enabled sensitivity parameters found. Please enable at least one parameter.");
                    return;
                }

                const response = await fetch(`http://localhost:2500/api/sensitivity/visualize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        version: version,
                        param_id: firstParam,
                        mode: paramMode,
                        compareToKey: compareToKey,
                        plotTypes: ['waterfall', 'bar', 'point']
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                setVisualizationData(data);

                // Extract enabled parameters
                const enabledParams = Object.entries(data.parameters || {})
                    .filter(([_, config]) => config.enabled)
                    .map(([id, config]) => ({ 
                        id, 
                        ...config
                    }));

                setParameters(enabledParams);

                // Extract relationships
                setRelationships(data.relationships || []);

                // Set initial selected parameter
                if (enabledParams.length > 0) {
                    setSelectedParameter(enabledParams[0].id);
                }

            } catch (err) {
                console.error('Error fetching sensitivity data:', err);
                setError(`Failed to load sensitivity data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchSensitivityData();
    }, [version, S]);

    const handleParameterChange = (paramId) => {
        setSelectedParameter(paramId);
    };

    // Get plot types for the selected parameter
    const getPlotTypes = () => {
        if (!selectedParameter || !relationships) return [];

        const paramRelationships = relationships.filter(rel => rel.source === selectedParameter);

        if (paramRelationships.length === 0) return [];

        // Collect all plot types across relationships
        return paramRelationships.reduce((types, rel) => {
            return [...types, ...(rel.plotTypes || [])];
        }, []);
    };

    // Determine if we should show the parameter analysis tab
    const hasAnalysisData = selectedParameter && 
                           relationships && 
                           relationships.some(rel => rel.source === selectedParameter);

    return (
        <div className="sensitivity-plots-container">
            {loading ? (
                <div className="sensitivity-loading">Loading sensitivity analysis data...</div>
            ) : error ? (
                <div className="sensitivity-error">{error}</div>
            ) : parameters.length === 0 ? (
                <div className="sensitivity-empty">No sensitivity parameters enabled</div>
            ) : (
                <>
                    <div className="sensitivity-header">
                        <h2>Sensitivity Analysis</h2>
                        <div className="parameter-tabs">
                            {parameters.map(param => (
                                <button 
                                    key={param.id}
                                    className={`parameter-tab ${selectedParameter === param.id ? 'active' : ''}`}
                                    onClick={() => handleParameterChange(param.id)}
                                >
                                    {param.id} ({param.mode})
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedParameter && (
                        <div className="sensitivity-content">
                            <div className="parameter-info">
                                <h3>Parameter: {selectedParameter}</h3>
                                {visualizationData?.parameters[selectedParameter] && (
                                    <div className="parameter-details">
                                        <p>Mode: {visualizationData.parameters[selectedParameter].mode}</p>
                                        {visualizationData.parameters[selectedParameter].status?.error && (
                                            <p className="parameter-error">
                                                Error: {visualizationData.parameters[selectedParameter].status.error}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {hasAnalysisData ? (
                                <div className="plots-wrapper">
                                    <PlotsTabs 
                                        version={version} 
                                        sensitivity={true} 
                                        parameter={selectedParameter}
                                        plotTypes={getPlotTypes()}
                                    />
                                </div>
                            ) : (
                                <div className="no-analysis-data">
                                    No analysis data available for {selectedParameter}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SensitivityPlotsTabs;
