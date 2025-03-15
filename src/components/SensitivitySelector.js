import React, { useState, useRef, useEffect } from 'react';
import './SensitivitySelector.css';

const Dialog = ({ show, onClose, children, triggerRef, isClosing }) => {
    if (!show) return null;

    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (show && triggerRef.current) {
            const buttonRect = triggerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // Calculate if we have enough space below the button
            const spaceBelow = viewportHeight - buttonRect.bottom;
            const spaceAbove = buttonRect.top;

            // Default to showing below the button
            let top = buttonRect.bottom + 140;

            // If not enough space below, show above
            if (spaceBelow < 400 && spaceAbove > spaceBelow) {
                top = buttonRect.top - 8;
            }

            // Center horizontally relative to button
            let left = buttonRect.left *0.3+ (buttonRect.width / 2);

            setPosition({ top, left });
        }
    }, [show, triggerRef]);

    return (
        <div className="sensitivity-overlay" onClick={onClose}>
            <div
                className={`sensitivity-dialog ${isClosing ? 'closing' : ''}`}
                style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`
                }}
            >
                <div className="sensitivity-dialog-inner" onClick={(e) => e.stopPropagation()}>{children}</div>
            </div>
        </div>
    );
};

const SensitivityAnalysisSelector = ({ sKey = '', onSensitivityChange = () => {}, S, setS }) => {
    const triggerButtonRef = useRef(null);
    const [showDialog, setShowDialog] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Use the state from S prop directly
    const currentS = S[sKey];

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowDialog(false);
            setIsClosing(false);
        }, 300);
    };

    const handleModeToggle = (mode) => {
        setS(prev => {
            const currentS = prev[sKey];
            const currentMode = currentS.mode;

            if (mode === currentMode) {
                // Reset to initial state structure while preserving other fields
                return {
                    ...prev,
                    [sKey]: {
                        ...currentS,
                        mode: null,
                        values: [],
                        enabled: false
                    }
                };
            }

            // For S34-S38, set value to 20 when switching to symmetrical mode
            const values = mode === 'symmetrical' 
                ? (sKey >= 'S34' && sKey <= 'S38' ? [20] : [])
                : (currentS.values || []);

            return {
                ...prev,
                [sKey]: {
                    ...currentS,
                    mode,
                    values,
                    enabled: true
                }
            };
        });
    };

    const handleSymmetricalChange = (value) => {
        setS(prev => {
            const currentS = prev[sKey];
            return {
                ...prev,
                [sKey]: {
                    ...currentS,
                    mode: 'symmetrical',
                    values: [value],
                    enabled: true
                }
            };
        });
    };

    const handleMultiplePointChange = (idx, value) => {
        setS(prev => {
            const currentS = prev[sKey];
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
            const currentS = prev[sKey];
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
            const currentS = prev[sKey];
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
            const currentS = prev[sKey];
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
        const currentS = S[sKey];
        
        // Preserve the existing state structure while updating
        onSensitivityChange(sKey, {
            ...currentS,  // Keep all existing properties
            mode: currentS.mode,
            values: currentS.values || [],
            enabled: true,
            compareToKey: currentS.compareToKey || '',
            comparisonType: currentS.comparisonType || null,
            waterfall: currentS.waterfall || false,
            bar: currentS.bar || false,
            point: currentS.point || false
        });

        handleClose();
    };

    const handleReset = () => {
        // Reset to the initial state structure from HomePage
        setS(prev => ({
            ...prev,
            [sKey]: {
                mode: null,
                values: [],
                enabled: false,
                compareToKey: '',
                comparisonType: null,
                waterfall: false,
                bar: false,
                point: false
            }
        }));
    };

    const compareOptions = Array.from({ length: 52 }, (_, i) => `S${i + 10}`)
        .filter(option => option !== sKey);

    return (
        <div className="sensitivity-module">
            <button
                ref={triggerButtonRef}
                className="sensitivity-btn1 primary-btn1"
                onClick={() => setShowDialog(true)}
            >
                Sensitivity
            </button>

            <Dialog
                show={showDialog}
                onClose={handleClose}
                triggerRef={triggerButtonRef}
                isClosing={isClosing}
            >
                <div className="sensitivity-content">
                    <div className="sensitivity-header">
                        <h2 className="sensitivity-title">
                            Sensitivity Analysis
                            <span className="parameter-key">{sKey}</span>
                        </h2>
                        <button onClick={handleClose} className="close-button">×</button>
                    </div>

                    <div className="mode-selection">
                        <div
                            className={`mode-box ${currentS.mode === 'symmetrical' ? 'selected' : ''}`}
                            onClick={() => handleModeToggle('symmetrical')}
                        >
                            <div className="mode-header">
                                <input
                                    type="checkbox"
                                    checked={currentS.mode === 'symmetrical'}
                                    onChange={() => {}}
                                    className="mode-checkbox"
                                />
                                <span>Symmetrical (±n%)</span>
                            </div>
                            {currentS.mode === 'symmetrical' && (
                                <input
                                    type="number"
                                    value={sKey >= 'S34' && sKey <= 'S38' ? 20 : (currentS.values?.[0] || '')}
                                    onChange={(e) => handleSymmetricalChange(e.target.value)}
                                    placeholder="Enter percentage"
                                    className="value-input"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            )}
                        </div>

                        <div
                            className={`mode-box ${currentS.mode === 'multiple' ? 'selected' : ''}`}
                            onClick={() => handleModeToggle('multiple')}
                        >
                            <div className="mode-header">
                                <input
                                    type="checkbox"
                                    checked={currentS.mode === 'multiple'}
                                    onChange={() => {}}
                                    className="mode-checkbox"
                                />
                                <span>Multiple Points (must be ascending)</span>
                            </div>
                            {currentS.mode === 'multiple' && (
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
                                            <option key={option} value={option}>{option}</option>
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
                        {currentS.mode && (
                            <button onClick={handleReset} className="reset-button">
                                Reset
                            </button>
                        )}
                        <button onClick={handleClose} className="cancel-button">
                            Cancel
                        </button>
                        <button onClick={handleSaveChanges} className="save-button">
                            Save Changes
                        </button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default SensitivityAnalysisSelector;
