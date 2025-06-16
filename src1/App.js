import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import ErrorBoundary from './utils/ErrorBoundary';
import './components/process_economics/styles/LibrarySystem.css'
import './components/find_factual_precedence/styles/FactualPrecedence.css'


function getColorFromTheme(themeClass, varName) {
    const el = document.createElement("div");
    el.className = themeClass;
    el.style.display = "none";
    document.body.appendChild(el);

    const val = getComputedStyle(el).getPropertyValue(varName).trim();
    document.body.removeChild(el);
    return val;
}

function getAverageThemeColor(varName, themes) {
    const hexToRgb = (hex) =>
        hex.match(/\w\w/g).map((x) => parseInt(x, 16));

    const rgbToHex = (rgb) =>
        "#" + rgb.map((x) => x.toString(16).padStart(2, "0")).join("");

    const rgbs = themes.map((theme) =>
        hexToRgb(getColorFromTheme(theme, varName))
    );

    const avg = rgbs[0].map((_, i) =>
        Math.floor(rgbs.reduce((sum, rgb) => sum + rgb[i], 0) / rgbs.length)
    );

    return rgbToHex(avg);
}

function applyAverageColors() {
    const avgText = getAverageThemeColor("--text-color", [
        "light-theme",
        "dark-theme",
        "creative-theme"
    ]);

    document.documentElement.style.setProperty("--avg-text-color", avgText);
}

function App() {
    useEffect(() => {
        applyAverageColors(); // Call after mount
    }, []);

    return (
        <ErrorBoundary>
            <Router>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                </Routes>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
