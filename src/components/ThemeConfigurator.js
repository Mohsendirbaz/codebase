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
                // Import the template CSS directly as a module
                import('../styles/theme-template.css')
                    .then(module => {
                        // Get CSS content from computed styles
                        const templateCSS = getComputedThemeCSS('theme-template');
                        setOriginalCSS(templateCSS);
                        
                        // Parse color blocks from template
                        const parsedBlocks = ThemeGenerator.parseThemeColors(templateCSS);
                        
                        // Apply the blocks if parsing succeeded
                        if (parsedBlocks && parsedBlocks.core && Object.keys(parsedBlocks.core).length > 0) {
                            console.log("Successfully parsed theme template colors:", 
                                Object.keys(parsedBlocks.core).length, "core colors,",
                                Object.keys(parsedBlocks.text).length, "text colors,",
                                Object.keys(parsedBlocks.background).length, "background colors");
                            
                            // Store both as current and default colors
                            setColorBlocks(parsedBlocks);
                            setDefaultColorBlocks(JSON.parse(JSON.stringify(parsedBlocks)));
                        } else {
                            console.warn("Failed to parse theme colors, using fallback values");
                            useFallbackColors();
                        }
                    })
                    .catch(error => {
                        console.error("Error importing CSS module:", error);
                        useFallbackColors();
                    });
                
                // Apply template class to get base styles
                const themeNames = ThemeGenerator.getThemeNames();
                document.documentElement.classList.add(`${themeNames.template}-theme`);
            } catch (error) {
                console.error('Failed to process template CSS:', error);
                useFallbackColors();
            }
        };
        
        // Helper to extract CSS from computed styles
        const getComputedThemeCSS = (themeName) => {
            // Find the theme's CSS rules
            let cssText = '';
            const styleSheets = document.styleSheets;
            for (let i = 0; i < styleSheets.length; i++) {
                try {
                    const rules = styleSheets[i].cssRules || styleSheets[i].rules;
                    if (!rules) continue;
                    
                    for (let j = 0; j < rules.length; j++) {
                        const rule = rules[j];
                        if (rule.selectorText && rule.selectorText.includes(`.${themeName}`)) {
                            cssText += rule.cssText;
                        }
                    }
                } catch (e) {
                    console.warn('Error accessing stylesheet rules:', e);
                }
            }
            return cssText;
        };
        
        // Helper for fallback colors
        const useFallbackColors = () => {
            const fallbackColors = {
                core: {
                    'primary-color': '#00429d',
                    'primary-color-light': '#4771b2',
                    'primary-color-dark': '#002e6d',
                    'primary-color-alpha': 'rgba(0, 66, 157, 0.7)',
                    'secondary-color': '#4771b2',
                    'secondary-color-light': '#8abccf',
                    'secondary-color-dark': '#2e59a8',
                },
                text: {
                    'text-color': '#424242',
                    'text-color-on-light': '#333333',
                    'text-color-on-dark': '#e0e0e0',
                    'text-secondary': '#6c757d',
                    'tab-text-color': 'darkblue',
                    'link-color': '#4771b2',
                    'link-hover-color': '#00429d',
                    'label-color': '#6c757d',
                },
                background: {
                    'background-color': '#f8f9fa',
                    'app-background': '#f8f9fa',
                    'sidebar-background': '#ffffff',
                    'card-background': '#ffffff',
                    'input-background': '#ffffff',
                    'bg-color': '#f0f0f0',
                    'disabled-background': '#e9ecef',
                    'scaling-container-bg': '#ffffff',
                    'scaling-item-bg': '#f0f0f0'
                }
            };
            
            // Set both current and default colors
            setColorBlocks(fallbackColors);
            setDefaultColorBlocks(JSON.parse(JSON.stringify(fallbackColors)));
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

    // Store original/default values for reset functionality
    const [defaultColorBlocks, setDefaultColorBlocks] = useState({
        core: {},
        text: {},
        background: {}
    });

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

    // Reset a single color to its default value
    const handleResetColor = (category, colorName) => {
        const defaultValue = defaultColorBlocks[category]?.[colorName];
        if (defaultValue) {
            handleDirectColorChange(category, colorName, defaultValue);
        }
    };

    // Reset all colors in a category
    const handleResetCategory = (category) => {
        const defaults = defaultColorBlocks[category];
        if (defaults) {
            Object.entries(defaults).forEach(([colorName, value]) => {
                handleDirectColorChange(category, colorName, value);
            });
        }
    };

    // Render color blocks for direct editing
    const renderColorBlocks = (category) => {
        if (!colorBlocks[category] || Object.keys(colorBlocks[category]).length === 0) {
            return <div className="empty-message">No colors found in this category</div>;
        }

        return (
            <>
                <div className="category-header">
                    <h3>{category.charAt(0).toUpperCase() + category.slice(1)} Colors</h3>
                    <button 
                        className="reset-category-button"
                        onClick={() => handleResetCategory(category)}
                        title={`Reset all ${category} colors to default`}
                    >
                        Reset All {category.charAt(0).toUpperCase() + category.slice(1)} Colors
                    </button>
                </div>
                <div className="color-block-container">
                    {Object.entries(colorBlocks[category]).map(([colorName, colorValue]) => (
                        <div 
                            key={colorName} 
                            className="color-block-item"
                            onMouseEnter={() => setHoveredColor(colorName)}
                            onMouseLeave={() => setHoveredColor(null)}
                        >
                            <div className="color-block-header">
                                <span className="color-name">{colorName}</span>
                                <button
                                    className="reset-color-button"
                                    onClick={() => handleResetColor(category, colorName)}
                                    title={`Reset to default: ${defaultColorBlocks[category]?.[colorName] || 'unknown'}`}
                                >
                                    ↺
                                </button>
                            </div>
                            <div 
                                className="color-block-preview" 
                                style={{ backgroundColor: colorValue }}
                            >
                                {hoveredColor === colorName && (
                                    <div className="color-block-name">{colorName}</div>
                                )}
                            </div>
                            <div className="color-inputs-row">
                                <div className="color-picker-container">
                                    <input
                                        type="color"
                                        value={colorValue.startsWith('#') ? colorValue : '#ffffff'}
                                        onChange={(e) => handleDirectColorChange(category, colorName, e.target.value)}
                                        className="color-picker-input"
                                        title="Click to open color picker"
                                    />
                                    <div 
                                        className="color-picker-overlay"
                                        style={{ 
                                            backgroundColor: colorValue.startsWith('#') ? colorValue : '#ffffff',
                                            color: chroma(colorValue).luminance() > 0.5 ? '#000000' : '#ffffff'
                                        }}
                                    >
                                        <span>🎨</span>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={colorValue}
                                    onChange={(e) => handleDirectColorChange(category, colorName, e.target.value)}
                                    className="color-block-text-input"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    // Reset all colors to defaults
    const handleResetAllColors = () => {
        Object.keys(defaultColorBlocks).forEach(category => {
            handleResetCategory(category);
        });
    };

    const renderStep = () => {
        if (editMode === 'direct') {
            return (
                <div className="direct-edit-container">
                    <div className="editor-header">
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
                        <button 
                            className="reset-all-button"
                            onClick={handleResetAllColors}
                            title="Reset all colors to default values"
                        >
                            Reset All Colors
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
