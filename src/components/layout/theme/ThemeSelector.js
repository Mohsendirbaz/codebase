import React from 'react';

const ThemeSelector = ({ season, handleThemeChange }) => {
    return (
        <div className="theme-ribbon">
            <div className="logo-container"></div>
            <div className="theme-buttons">
                <button
                    className={`theme-button ${season === 'fall' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('fall')}
                >
                    Creative
                </button>
                <button
                    className={`theme-button ${season === 'winter' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('winter')}
                >
                    Normal
                </button>
                <button
                    className={`theme-button ${season === 'dark' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                >
                    Dark
                </button>
            </div>
        </div>
    );
};

export default ThemeSelector;
