import React, { useState, useRef, useEffect } from 'react';
import './SensitivitySelector.css';
import useFormValues from '../useFormValues';

const Dialog = ({ show, onClose, children, triggerRef, isClosing }) => {
    if (!show) return null;

    const [position, setPosition] = useState({ top: 0, left: 0 });

    // Debounce function to prevent rapid position updates
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Debounced position calculation
    const calculatePosition = debounce(() => {
        if (show && triggerRef.current) {
            const buttonRect = triggerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // Calculate if we have enough space below the button
            const spaceBelow = viewportHeight - buttonRect.bottom;
            const spaceAbove = buttonRect.top;

            // Default to showing below the button
            let top = buttonRect.bottom + 8;

            // If not enough space below, show above
            if (spaceBelow < 400 && spaceAbove > spaceBelow) {
                top = buttonRect.top - 8;
            }

            // Center horizontally relative to button
            let left = buttonRect.left * 0.3 + (buttonRect.width / 2);

            setPosition({ top, left });
        }
    }, 50); // 50ms debounce time

    useEffect(() => {
        if (show) {
            // Initial position calculation
            calculatePosition();
            
            // Add resize listener with debounce
            window.addEventListener('resize', calculatePosition);
            
            // Cleanup
            return () => {
                window.removeEventListener('resize', calculatePosition);
            };
        }
    }, [show, triggerRef]);

    return (
        <div className="sensitivity-overlay" onClick={onClose}>
            <div
                className={`sensitivity-dialog ${isClosing ? 'closing' : ''}`}
                style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                }}
            >
                <div className="sensitivity-dialog-inner" onClick={(e) => e.stopPropagation()}>{children}</div>
            </div>
        </div>
    );
};

const SensitivityAnalysisSelector = ({ sKey = '', onSensitivityChange = () => {}, S, setS, version }) => {
    const triggerButtonRef = useRef(null);
    const [showDialog, setShowDialog] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const { propertyMapping } = useFormValues();

    // Default state object
    const defaultState = {
        mode: null,
        values: [],
        enabled: false,
        compareToKey: '',
        comparisonType: null,
        waterfall: false,
        bar: false,
        point: false
    };

    // Use the state from S prop with fallback to default state
    const currentS = (S && S[sKey]) || defaultState;
    
    // Convert symmetrical mode to multiple mode for backward compatibility
    useEffect(() => {
        if (S && S[sKey] && S[sKey].mode === 'symmetrical') {
            // Convert symmetrical mode to multiple
            setS(prev => ({
                ...prev,
                [sKey]: {
                    ...prev[sKey],
                    mode: 'multiple'
                }
            }));
        }
    }, [S, sKey, setS]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowDialog(false);
            setIsClosing(false);
        }, 300);
    };

    const handleModeToggle = (mode) => {
        setS(prev => {
            const currentS = prev[sKey] || defaultState;
            const currentMode = currentS.mode;

            if (mode === currentMode) {
                return {
                    ...prev,
                    [sKey]: defaultState
                };
            }

            return {
                ...prev,
                [sKey]: {
                    ...currentS,
                    mode,
                    values: currentS.values || [],
                    enabled: true
                }
            };
        });
    };

    // Keep this function for backward compatibility but now it sets mode to 'multiple'
    const handleSymmetricalChange = (value) => {
        setS(prev => {
            const currentS = prev[sKey] || defaultState;
            return {
                ...prev,
                [sKey]: {
                    ...currentS,
                    mode: 'multiple',  // Changed from 'symmetrical' to 'multiple'
                    values: [value],
                    enabled: true
                }
            };
        });
    };

    const handleMultiplePointChange = (idx, value) => {
        setS(prev => {
            const currentS = prev[sKey] || defaultState;
            const currentValues = currentS.values || [];
            const newValues = Array(6).fill('');

            currentValues.forEach((v, i) => {
                if (i < 6) newValues[i] = v;
            });

            newValues[idx] = value;

            const numbers = newValues
                .filter(p => p !== '')
                .map(Number)
                .filter(n => !isNaN(n));

            if (numbers.length > 1 && !numbers.every((n, i) => i === 0 || n > numbers[i - 1])) {
                alert('Values must be in ascending order');
                return prev;
            }

            return {
                ...prev,
                [sKey]: {
                    ...currentS,
                    mode: 'multiple',
                    values: newValues,
                    enabled: true
                }
            };
        });
    };

    const handleCompareToChange = (value) => {
        setS(prev => {
            const currentS = prev[sKey] || defaultState;
            return {
                ...prev,
                [sKey]: {
                    ...currentS,
                    compareToKey: value
                }
            };
        });
    };

    const handleComparisonTypeChange = (type) => {
        setS(prev => {
            const currentS = prev[sKey] || defaultState;
            return {
                ...prev,
                [sKey]: {
                    ...currentS,
                    comparisonType: type
                }
            };
        });
    };

    const handlePlotTypeChange = (plotType) => {
        setS(prev => {
            const currentS = prev[sKey] || defaultState;
            return {
                ...prev,
                [sKey]: {
                    ...currentS,
                    [plotType]: !currentS[plotType]
                }
            };
        });
    };

    const handleSaveChanges = () => {
        const currentS = S[sKey] || defaultState;

        // Ensure mode is 'multiple' if it was 'symmetrical'
        const mode = currentS.mode === 'symmetrical' ? 'multiple' : currentS.mode;
        
        // Create configuration object
        const configData = {
            mode,
            values: currentS.values || [],
            enabled: true,
            compareToKey: currentS.compareToKey || '',
            comparisonType: currentS.comparisonType || null,
            waterfall: currentS.waterfall || false,
            bar: currentS.bar || false,
            point: currentS.point || false
        };
        
        // Log/register this change if version is provided
        if (version) {
            fetch('http://localhost:5000/register_sensitivity_change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sKey,
                    configData,
                    version,
                    timestamp: new Date().toISOString(),
                })
            }).catch(error => {
                console.error('Error registering sensitivity change:', error);
            });
        }

        onSensitivityChange(sKey, configData);
        handleClose();
    };

    const handleReset = () => {
        setS(prev => ({
            ...prev,
            [sKey]: defaultState
        }));

        onSensitivityChange(sKey, defaultState);
    };

    // Get compare options from property mapping
    const compareOptions = Object.keys(propertyMapping)
        .filter(key => key !== sKey)
        .map(key => ({ key, label: propertyMapping[key] }));

    return (
        <div className="sensitivity-module">
            <button
                ref={triggerButtonRef}
                className="sensitivity-btn1 primary-btn1"
                onClick={() => setShowDialog(true)}
            >
                Sensitivity Analysis<br/>
                (allows analysis of multiple basevalues at once)
            </button>

            <Dialog
                show={showDialog}
                onClose={handleClose}
                triggerRef={triggerButtonRef}
                isClosing={isClosing}
            >
                <div className="sensitivity-selector-content">
                    <div className="sensitivity-selector-header">
                        <h2 className="sensitivity-title">
                            Sensitivity Analysis
                            <span className="parameter-key">{sKey}</span>
                        </h2>
                        <button onClick={handleClose} className="close-button">×</button>
                    </div>

                    <div className="mode-selection">
                        <div
                            className={`mode-box ${currentS.mode === 'multiple' || currentS.mode === 'symmetrical' ? 'selected' : ''}`}
                            onClick={() => handleModeToggle('multiple')}
                        >
                            <div className="mode-header">
                                <input
                                    type="checkbox"
                                    checked={currentS.mode === 'multiple' || currentS.mode === 'symmetrical'}
                                    onChange={() => {}}
                                    className="mode-checkbox"
                                />
                                <span>Multiple Points (must be ascending)</span>
                            </div>
                            {(currentS.mode === 'multiple' || currentS.mode === 'symmetrical') && (
                                <div className="points-grid" onClick={(e) => e.stopPropagation()}>
                                    <div className="point-inputs">
                                        {Array(6).fill(null).map((_, idx) => (
                                            <input
                                                key={idx}
                                                type="number"
                                                value={currentS.values?.[idx] || ''}
                                                onChange={(e) => handleMultiplePointChange(idx, e.target.value)}
                                                placeholder={idx < 3 ? `-n${idx + 1}` : `+n${idx - 2}`}
                                                className="value-input"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {currentS.mode && (
                        <div className="additional-settings">
                            <div className="settings-row">
                                <div className="compare-section">
                                    <label>Compare to:</label>
                                    <select
                                        value={currentS.compareToKey || ''}
                                        onChange={(e) => handleCompareToChange(e.target.value)}
                                        className="compare-select"
                                    >
                                        <option value="">Select parameter</option>
                                        {compareOptions.map(option => (
                                            <option key={option.key} value={option.key}>
                                                {option.label} ({option.key})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {currentS.compareToKey && (
                                    <div className="axis-section">
                                        <label className="axis-radio">
                                            <input
                                                type="radio"
                                                name="axisType"
                                                value="primary"
                                                checked={currentS.comparisonType === 'primary'}
                                                onChange={() => handleComparisonTypeChange('primary')}
                                            />
                                            As primary (x axis)
                                        </label>
                                        <label className="axis-radio">
                                            <input
                                                type="radio"
                                                name="axisType"
                                                value="secondary"
                                                checked={currentS.comparisonType === 'secondary'}
                                                onChange={() => handleComparisonTypeChange('secondary')}
                                            />
                                            As secondary (y axis)
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="plot-section">
                                <label className="plot-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={currentS.waterfall || false}
                                        onChange={() => handlePlotTypeChange('waterfall')}
                                    />
                                    Waterfall
                                </label>
                                <label className="plot-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={currentS.bar || false}
                                        onChange={() => handlePlotTypeChange('bar')}
                                    />
                                    Bar plot
                                </label>
                                <label className="plot-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={currentS.point || false}
                                        onChange={() => handlePlotTypeChange('point')}
                                    />
                                    Point plot
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="sensitivity-footer">
                        <button onClick={handleSaveChanges} className="save-button">
                            Save Changes
                        </button>
                        {currentS.mode && (
                            <button onClick={handleReset} className="reset-button">
                                Reset
                            </button>
                        )}
                        <button onClick={handleClose} className="cancel-button">
                            Cancel
                        </button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default SensitivityAnalysisSelector;
