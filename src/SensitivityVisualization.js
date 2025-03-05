import React from 'react';

const SensitivityVisualization = ({ visualizationData }) => {
    if (!visualizationData) return null;

    const { parameters, relationships, plots, metadata } = visualizationData;

    const renderPlot = (paramId, plotType, plotData) => {
        if (!plotData || plotData.status !== 'ready') return null;

        return (
            <div className="plot-container" key={`${paramId}-${plotType}`}>
                <h4>{plotType} Plot</h4>
                <img 
                    src={plotData.path} 
                    alt={`${plotType} plot for ${paramId}`}
                    style={{ maxWidth: '100%', height: 'auto' }}
                />
                {plotData.error && (
                    <div className="plot-error">Error: {plotData.error}</div>
                )}
            </div>
        );
    };

    const renderParameter = (paramId, paramData) => {
        const paramPlots = plots[paramId] || {};
        const isSpecialCase = paramData.status?.isSpecialCase;

        return (
            <div 
                key={paramId} 
                className={`parameter-section ${isSpecialCase ? 'special-case' : ''}`}
            >
                <div className="parameter-header">
                    <h3>{paramId}</h3>
                    {isSpecialCase && (
                        <span className="special-case-badge">
                            Special Case vs S13
                        </span>
                    )}
                    <div className="parameter-status">
                        Status: {paramData.status?.processed ? 'Processed' : 'Pending'}
                    </div>
                </div>

                <div className="plots-grid">
                    {Object.entries(paramPlots).map(([plotType, plotData]) => 
                        renderPlot(paramId, plotType, plotData)
                    )}
                </div>

                {paramData.status?.error && (
                    <div className="parameter-error">
                        Error: {paramData.status.error}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="sensitivity-visualization">
            {metadata && (
                <div className="visualization-metadata">
                    <div>Run ID: {metadata.runId}</div>
                    <div>Processing Time: {metadata.processingTime}s</div>
                    <div>Plots Generated: {metadata.plotsGenerated}</div>
                    {metadata.errors.length > 0 && (
                        <div className="metadata-errors">
                            <h4>Errors:</h4>
                            <ul>
                                {metadata.errors.map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <div className="parameters-grid">
                {Object.entries(parameters).map(([paramId, paramData]) => 
                    renderParameter(paramId, paramData)
                )}
            </div>
        </div>
    );
};

export default SensitivityVisualization;
