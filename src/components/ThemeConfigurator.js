import React, { useState, useEffect, useCallback, useRef } from 'react';
import ThemeGenerator from '../utils/ThemeGenerator';
import chroma from 'chroma-js';
import './ThemeConfigurator.css';

const ThemeConfigurator = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [paletteType, setPaletteType] = useState('sequential');
    const [numColors, setNumColors] = useState(9);
    const [inputColors, setInputColors] = useState(['#00429d', '#96ffea', '#ffff00']);
    const [resultingPalette, setResultingPalette] = useState([]);
    
    // New state for direct color editing
    const [activeColorTab, setActiveColorTab] = useState('core');
    const [colorBlocks, setColorBlocks] = useState({
        core: {},
        text: {},
        background: {}
    });
    const [originalCSS, setOriginalCSS] = useState('');
    const [editMode, setEditMode] = useState('palette'); // 'palette' or 'direct'
    
    // Keep track of hovered color for showing variable name
    const [hoveredColor, setHoveredColor] = useState(null);
    
    // Refs for getting the current CSS stylesheet
    const cssRef = useRef(null);

    const handleNumColorsChange = (e) => {
        const num = parseInt(e.target.value) || 9;
        setNumColors(Math.max(2, Math.min(15, num)));
    };

    const handleColorChange = (index, color) => {
        const newColors = [...inputColors];
        newColors[index] = color;
        setInputColors(newColors);
        generatePalette(newColors);
    };

    const generatePalette = useCallback((colors = inputColors) => {
        const palette = ThemeGenerator.generatePalette(colors, numColors, paletteType);
        setResultingPalette(palette);
    }, [numColors, paletteType, inputColors]);

    // Load template CSS and parse color blocks on component mount
    useEffect(() => {
        const loadTemplateCSS = async () => {
            try {
                // Import the template CSS
                const response = await fetch('/src/styles/theme-template.css');
                if (!response.ok) {
                    throw new Error(`Failed to fetch template CSS: ${response.statusText}`);
                }
                
                const templateCSS = await response.text();
                setOriginalCSS(templateCSS);
                
                // Parse color blocks from template
                const parsedBlocks = ThemeGenerator.parseThemeColors(templateCSS);
                
                // Fallback to defaults if parsing fails
                if (!parsedBlocks || !parsedBlocks.core || Object.keys(parsedBlocks.core).length === 0) {
                    setColorBlocks({
                        core: {
                            'primary-color': '#00429d',
                            'primary-color-light': '#4771b2',
                            'primary-color-dark': '#002e6d',
                            'secondary-color': '#4771b2'
                        },
                        text: {
                            'text-color': '#424242',
                            'text-color-on-light': '#333333',
                            'text-color-on-dark': '#e0e0e0'
                        },
                        background: {
                            'background-color': '#f8f9fa',
                            'card-background': '#ffffff'
                        }
                    });
                } else {
                    setColorBlocks(parsedBlocks);
                }

                // Apply template class to get base styles
                const themeNames = ThemeGenerator.getThemeNames();
                document.documentElement.classList.add(`${themeNames.template}-theme`);
            } catch (error) {
                console.error('Failed to load template CSS:', error);
                
                // Use fallback values if loading fails
                setColorBlocks({
                    core: {
                        'primary-color': '#00429d',
                        'primary-color-light': '#4771b2',
                        'primary-color-dark': '#002e6d',
                        'secondary-color': '#4771b2'
                    },
                    text: {
                        'text-color': '#424242',
                        'text-color-on-light': '#333333',
                        'text-color-on-dark': '#e0e0e0'
                    },
                    background: {
                        'background-color': '#f8f9fa',
                        'card-background': '#ffffff'
                    }
                });
            }
        };
        
        loadTemplateCSS();
        generatePalette();

        // Cleanup function to remove template class
        return () => {
            const themeNames = ThemeGenerator.getThemeNames();
            document.documentElement.classList.remove(`${themeNames.template}-theme`);
        };
    }, [generatePalette]);

    const handleApply = () => {
        if (editMode === 'palette') {
            // Apply palette-based theme
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const themeMap = {
                'dark': 'dark',
                'fall': 'creative',
                'winter': 'light'
            };
            
            const baseTheme = themeMap[currentTheme] || 'light';
            ThemeGenerator.applyThemeToDOM(resultingPalette, baseTheme);
        } else {
            // Save theme and auto-toggle to creative mode
            ThemeGenerator.saveTheme(colorBlocks);
            
            // Update season state in parent component if available
            if (window.setSeason) {
                window.setSeason('fall');
            }
        }
        
        setIsOpen(false);
    };

    const handlePreview = () => {
        // Apply direct color changes and ensure theme classes are set
        ThemeGenerator.applyDirectColorChanges(colorBlocks);
        
        // Ensure creative theme classes are added
        const themeNames = ThemeGenerator.getThemeNames();
        const themeClasses = Object.values(themeNames).map(name => `${name}-theme`);
        
        // Remove existing theme classes
        document.documentElement.classList.remove(...themeClasses);
        
        // Add creative theme class
        document.documentElement.classList.add(`${themeNames.creative}-theme`);
        
        // Update season state
        document.body.className = 'fall';
    };

    // Handler for direct color changes
    const handleDirectColorChange = (category, colorName, newValue) => {
        if (ThemeGenerator.isValidColor(newValue)) {
            // Update state
            setColorBlocks(prevBlocks => {
                const newBlocks = {...prevBlocks};
                newBlocks[category] = {...newBlocks[category]};
                newBlocks[category][colorName] = newValue;
                return newBlocks;
            });
            
            // Apply immediately
            document.documentElement.style.setProperty(`--${colorName}`, newValue);
            
            // Update related colors if needed
            if (colorName === 'primary-color') {
                document.documentElement.style.setProperty('--primary-color-light', chroma(newValue).brighten(1).hex());
                document.documentElement.style.setProperty('--primary-color-dark', chroma(newValue).darken(1).hex());
                document.documentElement.style.setProperty('--primary-color-alpha', chroma(newValue).alpha(0.7).css());
                document.documentElement.style.setProperty('--primary-hover', chroma(newValue).darken(0.5).hex());
                document.documentElement.style.setProperty('--gradient-primary', 
                    `linear-gradient(145deg, ${chroma(newValue).brighten(0.2).hex()}, ${newValue})`
                );
            }
        }
    };

    // Render color blocks for direct editing
    const renderColorBlocks = (category) => {
        if (!colorBlocks[category] || Object.keys(colorBlocks[category]).length === 0) {
            return <div className="empty-message">No colors found in this category</div>;
        }

        return (
            <div className="color-block-container">
                {Object.entries(colorBlocks[category]).map(([colorName, colorValue]) => (
                    <div 
                        key={colorName} 
                        className="color-block-item"
                        onMouseEnter={() => setHoveredColor(colorName)}
                        onMouseLeave={() => setHoveredColor(null)}
                    >
                        <div 
                            className="color-block-preview" 
                            style={{ backgroundColor: colorValue }}
                        >
                            {hoveredColor === colorName && (
                                <div className="color-block-name">{colorName}</div>
                            )}
                        </div>
                        <input
                            type="color"
                            value={colorValue.startsWith('#') ? colorValue : '#ffffff'}
                            onChange={(e) => handleDirectColorChange(category, colorName, e.target.value)}
                            title={`${colorName}: ${colorValue}`}
                        />
                        <input
                            type="text"
                            value={colorValue}
                            onChange={(e) => handleDirectColorChange(category, colorName, e.target.value)}
                            className="color-block-text-input"
                        />
                    </div>
                ))}
            </div>
        );
    };

    const renderStep = () => {
        if (editMode === 'direct') {
            return (
                <div className="direct-edit-container">
                    <div className="color-category-tabs">
                        <button 
                            className={activeColorTab === 'core' ? 'active' : ''}
                            onClick={() => setActiveColorTab('core')}
                        >
                            Core Colors
                        </button>
                        <button 
                            className={activeColorTab === 'text' ? 'active' : ''}
                            onClick={() => setActiveColorTab('text')}
                        >
                            Text Colors
                        </button>
                        <button 
                            className={activeColorTab === 'background' ? 'active' : ''}
                            onClick={() => setActiveColorTab('background')}
                        >
                            Background Colors
                        </button>
                    </div>
                    
                    <div className="color-blocks-preview">
                        {renderColorBlocks(activeColorTab)}
                    </div>
                </div>
            );
        }
        
        // Original palette-based editing
        switch (currentStep) {
            case 1:
                return (
                    <div className="step-content">
                        <h3>1. What kind of palette do you want to create?</h3>
                        <div className="palette-type-selector">
                            <button 
                                className={paletteType === 'sequential' ? 'active' : ''}
                                onClick={() => setPaletteType('sequential')}
                            >
                                Sequential
                            </button>
                            <button 
                                className={paletteType === 'diverging' ? 'active' : ''}
                                onClick={() => setPaletteType('diverging')}
                            >
                                Diverging
                            </button>
                        </div>
                        <div className="number-selector">
                            <label>Number of colors:</label>
                            <input 
                                type="number" 
                                value={numColors}
                                onChange={handleNumColorsChange}
                                min="2"
                                max="15"
                            />
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="step-content">
                        <h3>2. Select and arrange input colors</h3>
                        <div className="color-inputs">
                            {inputColors.map((color, index) => (
                                <input
                                    key={index}
                                    type="color"
                                    value={color}
                                    onChange={(e) => handleColorChange(index, e.target.value)}
                                />
                            ))}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="step-content">
                        <h3>3. Check and configure the resulting palette</h3>
                        <div className="palette-preview">
                            {resultingPalette.map((color, index) => (
                                <div 
                                    key={index}
                                    className="color-swatch"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="theme-configurator">
            <button 
                className="theme-configurator-toggle"
                onClick={() => setIsOpen(true)}
                title="Customize Theme Colors"
            >
                <span className="color-circle" style={{ backgroundColor: inputColors[0] }}></span>
                ✎
            </button>
            
            {isOpen && (
                <>
                    <div className="theme-configurator-overlay" onClick={() => setIsOpen(false)} />
                    <div className="theme-configurator-dialog">
                        <div className="dialog-header">
                            <h2>Theme Color Configurator</h2>
                            <div className="mode-toggle">
                                <button 
                                    className={editMode === 'palette' ? 'active' : ''}
                                    onClick={() => setEditMode('palette')}
                                >
                                    Palette Generator
                                </button>
                                <button 
                                    className={editMode === 'direct' ? 'active' : ''}
                                    onClick={() => setEditMode('direct')}
                                >
                                    Direct Color Editor
                                </button>
                            </div>
                            <button className="close-button" onClick={() => setIsOpen(false)}>✕</button>
                        </div>
                        
                        <div className="dialog-content">
                            {renderStep()}
                        </div>
                        
                        <div className="dialog-footer">
                            {editMode === 'palette' ? (
                                <>
                                    {currentStep > 1 && (
                                        <button onClick={() => setCurrentStep(step => step - 1)}>
                                            Previous
                                        </button>
                                    )}
                                    {currentStep < 3 ? (
                                        <button onClick={() => setCurrentStep(step => step + 1)}>
                                            Next
                                        </button>
                                    ) : (
                                        <button onClick={handleApply}>
                                            Apply Theme
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="direct-edit-actions">
                                    <button 
                                        className="preview-button"
                                        onClick={handlePreview}
                                    >
                                        Preview
                                    </button>
                                    <button 
                                        className="apply-button"
                                        onClick={handleApply}
                                    >
                                        Save Theme
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ThemeConfigurator;
