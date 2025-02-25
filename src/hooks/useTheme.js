import { useState, useEffect } from 'react';

/**
 * @typedef {'winter' | 'fall' | 'dark'} ThemeType
 */

/**
 * Custom hook for managing theme state and related operations
 * @param {Object} options - Hook options
 * @param {ThemeType} [options.initialTheme='winter'] - Initial theme value
 * @returns {Object} Theme state and handlers
 */
const useTheme = ({ initialTheme = 'winter' } = {}) => {
    const [season, setSeason] = useState(initialTheme);

    // Theme management effect
    useEffect(() => {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', season);

        if (season !== 'dark') {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `${process.env.PUBLIC_URL}/styles/${season}.css`;

            const oldLink = document.querySelector('link[href*="/styles/"][href$=".css"]');
            if (oldLink) {
                oldLink.remove();
            }

            document.head.appendChild(link);
        }
    }, [season]);

    /**
     * Handle theme change with transition effects
     * @param {ThemeType} newSeason - The new theme to apply
     */
    const handleThemeChange = (newSeason) => {
        const themeRibbon = document.querySelector('.theme-ribbon');
        const currentLogo = document.querySelector('.logo-container img.active');
        const newLogo = document.querySelector(
            `.logo-container img[alt="${newSeason === 'winter' ? 'MU Logo' : newSeason === 'fall' ? 'US Biomass Logo' : 'Blue Parrot Logo'}"]`
        );
        const buttons = document.querySelectorAll('.theme-button');
        const targetButton =
            newSeason === 'dark' ? buttons[2] : newSeason === 'fall' ? buttons[0] : buttons[1];

        if (themeRibbon && themeRibbon.classList.contains('theme-transition')) {
            return;
        }

        if (themeRibbon) {
            const targetButtonRect = targetButton?.getBoundingClientRect();
            const ribbonRect = themeRibbon.getBoundingClientRect();
            const creativeButton = buttons[0]?.getBoundingClientRect();

            if (targetButtonRect && ribbonRect && creativeButton) {
                const startX = ribbonRect.right - targetButtonRect.right + 35;
                const startY = ribbonRect.bottom - targetButtonRect.bottom;
                const endX = ribbonRect.right - creativeButton.right + 35;
                const endY = ribbonRect.bottom - creativeButton.bottom;

                // Set position variables for the glow effect
                themeRibbon.style.setProperty('--glow-start-x', `${startX}px`);
                themeRibbon.style.setProperty('--glow-start-y', `${startY}px`);
                themeRibbon.style.setProperty('--glow-end-x', `${endX}px`);
                themeRibbon.style.setProperty('--glow-end-y', `${endY}px`);
                themeRibbon.style.setProperty('--transition-duration', '1.2s');
            }

            // Add transition classes with proper timing
            requestAnimationFrame(() => {
                themeRibbon.classList.add(newSeason === 'dark' ? 'to-dark' : 'to-light');
                themeRibbon.classList.add('theme-transition');

                // Handle logo transition with proper timing
                if (currentLogo) {
                    currentLogo.classList.add('fade-out');
                    currentLogo.classList.remove('active');
                }

                // Delay the new logo appearance to sync with the theme transition
                if (newLogo) {
                    setTimeout(() => {
                        newLogo.classList.add('active');
                    }, 300);
                }

                // Clean up classes after all transitions complete
                setTimeout(() => {
                    themeRibbon.classList.remove('theme-transition', 'to-dark', 'to-light');
                    if (currentLogo) {
                        currentLogo.classList.remove('fade-out');
                    }
                }, 1200);
            });
        }

        // Update theme state
        setSeason(newSeason);
        document.body.className = newSeason;

        // Apply theme-specific styles
        const themeColors = {
            dark: '#2196F3',
            fall: '#FF9800',
            winter: '#4CAF50'
        };
        document.documentElement.style.setProperty('--primary-color', themeColors[newSeason]);
    };

    return {
        season,
        setSeason,
        handleThemeChange,
    };
};

export default useTheme;
