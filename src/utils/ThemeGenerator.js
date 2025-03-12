import chroma from 'chroma-js';

class ThemeGenerator {
    static getThemeNames() {
        // These will be populated by scanning src/styles directory
        return {
            dark: 'dark',
            normal: 'normal',
            template: 'theme-template',
            creative: 'creative-your-own'
        };
    }

    static getCurrentThemeName() {
        // Get current theme based on body class or data-theme attribute
        const bodyClass = document.body.className;
        const dataTheme = document.documentElement.getAttribute('data-theme');
        
        // Map from season/data-theme to CSS theme name
        const themeMap = {
            'dark': 'dark',
            'winter': 'normal',
            'fall': 'creative-your-own'
        };
        
        return themeMap[bodyClass] || themeMap[dataTheme] || 'normal';
    }
    
    static getThemeCssPath(themeName) {
        const themeFileMap = {
            'dark': '/src/styles/dark-theme.css', 
            'normal': '/src/styles/normal-theme.css',
            'creative-your-own': '/src/styles/creative-your-own-theme.css',
            'theme-template': '/src/styles/theme-template.css'
        };
        
        return themeFileMap[themeName] || themeFileMap['normal'];
    }

    static parseThemeColors(cssContent) {
        const colorBlocks = {
            core: {},
            text: {},
            background: {}
        };

        // Extract Core Colors
        const coreMatch = cssContent.match(/\/\* Core Colors \*\/([^/]*)/);
        if (coreMatch) {
            const coreBlock = coreMatch[1];
            const colorVars = coreBlock.match(/--[\w-]+:\s*([^;]+);/g);
            if (colorVars) {
                colorVars.forEach(variable => {
                    const [name, value] = variable.split(':').map(s => s.trim());
                    colorBlocks.core[name.replace('--', '')] = value;
                });
            }
        }

        // Extract Text Colors
        const textMatch = cssContent.match(/\/\* Text Colors \*\/([^/]*)/);
        if (textMatch) {
            const textBlock = textMatch[1];
            const colorVars = textBlock.match(/--[\w-]+:\s*([^;]+);/g);
            if (colorVars) {
                colorVars.forEach(variable => {
                    const [name, value] = variable.split(':').map(s => s.trim());
                    colorBlocks.text[name.replace('--', '')] = value;
                });
            }
        }

        // Extract Background Colors
        const bgMatch = cssContent.match(/\/\* Background Colors \*\/([^/]*)/);
        if (bgMatch) {
            const bgBlock = bgMatch[1];
            const colorVars = bgBlock.match(/--[\w-]+:\s*([^;]+);/g);
            if (colorVars) {
                colorVars.forEach(variable => {
                    const [name, value] = variable.split(':').map(s => s.trim());
                    colorBlocks.background[name.replace('--', '')] = value;
                });
            }
        }

        return colorBlocks;
    }

    static baseThemes = {
        dark: {
            primary: '#1a237e',
            background: '#121a2e',
            text: '#ffffff',
            border: '#2a3f5f'
        },
        normal: {
            primary: '#4a90e2',
            background: '#f5f7fa',
            text: '#2c3e50',
            border: '#dce1e8'
        },
        'theme-template': {
            primary: '#00429d',
            background: '#f8f9fa',
            text: '#424242',
            border: '#e1e8ed'
        }
    };

    static generatePalette(colors, numColors, type) {
        if (type === 'sequential') {
            return chroma.scale(colors)
                .mode('lab')
                .colors(numColors);
        } else { // diverging
            const midpoint = Math.floor(numColors / 2);
            const scale1 = chroma.scale([colors[0], colors[1]])
                .mode('lab')
                .colors(midpoint + 1);
            
            const scale2 = chroma.scale([colors[1], colors[2]])
                .mode('lab')
                .colors(numColors - midpoint);
            
            return [...scale1.slice(0, -1), ...scale2];
        }
    }

    static applyToTheme(colors, theme) {
        const baseColors = this.baseThemes[theme];
        const midpoint = Math.floor(colors.length / 2);

        return {
            '--primary-color': colors[midpoint],
            '--primary-color-light': colors[Math.floor(colors.length * 0.75)],
            '--primary-color-lighter': colors[colors.length - 1],
            '--primary-color-dark': colors[Math.floor(colors.length * 0.25)],
            '--primary-color-darker': colors[0],
            '--background-color': baseColors.background,
            '--text-color': baseColors.text,
            '--border-color': baseColors.border,
            '--hover-background': chroma(baseColors.background).darken(0.1).hex(),
            '--card-background': theme === 'dark' 
                ? chroma(baseColors.background).brighten(0.2).hex()
                : baseColors.background,
            '--card-shadow': theme === 'dark'
                ? '0 4px 6px rgba(0, 0, 0, 0.3)'
                : '0 4px 6px rgba(0, 0, 0, 0.1)',
            '--input-field-shadow': theme === 'dark'
                ? 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
                : 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
            '--gradient-primary': `linear-gradient(145deg, ${colors[Math.floor(colors.length * 0.75)]}, ${colors[midpoint]})`,
            '--primary-hover': colors[Math.floor(colors.length * 0.25)],
            '--border-radius-lg': '8px',
            '--form-item-shadow': theme === 'dark'
                ? '0 2px 4px rgba(0, 0, 0, 0.3)'
                : '0 2px 4px rgba(0, 0, 0, 0.1)',
            '--form-item-hover-shadow': theme === 'dark'
                ? '0 4px 8px rgba(0, 0, 0, 0.4)'
                : '0 4px 8px rgba(0, 0, 0, 0.15)'
        };
    }

    static applyThemeToDOM(themeVars, theme) {
        const themeNames = this.getThemeNames();
        const themeClasses = Object.values(themeNames).map(name => `${name}-theme`);
        
        // Remove existing theme classes
        document.documentElement.classList.remove(...themeClasses);
        
        // If theme is template, switch to creative mode
        if (theme === themeNames.template) {
            document.documentElement.classList.add(`${themeNames.creative}-theme`);
            // Also update the season state in L_1_HomePage
            const seasonMap = {
                [themeNames.dark]: 'dark',
                [themeNames.normal]: 'winter',
                [themeNames.template]: 'fall',
                [themeNames.creative]: 'fall'
            };
            document.body.className = seasonMap[themeNames.creative];
        } else {
            document.documentElement.classList.add(`${theme}-theme`);
        }
        
        // Apply CSS variables
        Object.entries(themeVars).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });
    }

    static applyDirectColorChanges(colorBlocks, theme = 'creative-your-own') {
        const themeNames = this.getThemeNames();
        const themeClasses = Object.values(themeNames).map(name => `${name}-theme`);
        
        // Remove existing theme classes
        document.documentElement.classList.remove(...themeClasses);
        
        // Add theme template class first to get base styles
        document.documentElement.classList.add('theme-template-theme');
        
        // Then add specific theme class
        document.documentElement.classList.add(`${theme}-theme`);
        
        // Update season state
        const seasonMap = {
            [themeNames.dark]: 'dark',
            [themeNames.normal]: 'winter',
            [themeNames.template]: 'fall',
            [themeNames.creative]: 'fall'
        };
        document.body.className = seasonMap[themeNames.creative];
        
        // Apply core colors
        Object.entries(colorBlocks.core || {}).forEach(([key, value]) => {
            document.documentElement.style.setProperty(`--${key}`, value);
        });
        
        // Apply text colors
        Object.entries(colorBlocks.text || {}).forEach(([key, value]) => {
            document.documentElement.style.setProperty(`--${key}`, value);
        });
        
        // Apply background colors
        Object.entries(colorBlocks.background || {}).forEach(([key, value]) => {
            document.documentElement.style.setProperty(`--${key}`, value);
        });
    }

    static getCurrentThemeCSS() {
        return document.querySelector('style[data-theme]')?.textContent || '';
    }

    static updateColorInBlocks(colorBlocks, category, colorName, newValue) {
        if (colorBlocks[category] && colorBlocks[category].hasOwnProperty(colorName)) {
            colorBlocks[category][colorName] = newValue;
        }
        return colorBlocks;
    }

    static generateCSSFromColorBlocks(colorBlocks) {
        let css = ':root.creative-your-own-theme {\n';
        
        // Add Core Colors block
        css += '    /* Core Colors */\n';
        Object.entries(colorBlocks.core || {}).forEach(([key, value]) => {
            css += `    --${key}: ${value};\n`;
        });
        css += '\n';
        
        // Add Text Colors block
        css += '    /* Text Colors */\n';
        Object.entries(colorBlocks.text || {}).forEach(([key, value]) => {
            css += `    --${key}: ${value};\n`;
        });
        css += '\n';
        
        // Add Background Colors block
        css += '    /* Background Colors */\n';
        Object.entries(colorBlocks.background || {}).forEach(([key, value]) => {
            css += `    --${key}: ${value};\n`;
        });
        css += '\n';
        
        // Add constant properties from template
        css += '    /* Layout Properties - Constant */\n';
        css += '    --spacing-unit: 1rem;\n';
        css += '    --spacing-xs: 0.25rem;\n';
        css += '    --spacing-sm: 0.5rem;\n';
        css += '    --spacing-md: 1rem;\n';
        css += '    --spacing-lg: 1.5rem;\n';
        css += '    --spacing-xl: 2rem;\n';
        css += '\n';
        
        css += '    /* Typography - Constant */\n';
        css += '    --font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;\n';
        css += '    --font-family-monospace: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;\n';
        css += '    --font-size-xs: 0.75rem;\n';
        css += '    --font-size-sm: 0.875rem;\n';
        css += '    --font-size-md: 1rem;\n';
        css += '    --font-size-lg: 1.25rem;\n';
        css += '    --font-size-xl: 1.5rem;\n';
        css += '\n';
        
        css += '    /* Animation Properties - Constant */\n';
        css += '    --transition-fast: 0.2s ease;\n';
        css += '    --transition-medium: 0.3s ease;\n';
        css += '    --transition-slow: 0.5s ease;\n';
        css += '    --disabled-opacity: 0.65;\n';
        
        css += '}\n';
        
        return css;
    }

    static saveTheme(colorBlocks) {
        // Generate CSS content for the creative theme
        const css = this.generateCSSFromColorBlocks(colorBlocks);
        
        // Create an AJAX request to save the file server-side
        // This is a placeholder - in a real application, this would be an API call to save the file
        const saveRequest = new XMLHttpRequest();
        saveRequest.open('POST', '/api/save-theme', false); // Synchronous for simplicity
        saveRequest.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        
        try {
            saveRequest.send(JSON.stringify({
                filename: 'creative-your-own-theme.css',
                content: css
            }));
            
            console.log('Theme saved successfully to creative-your-own-theme.css');
        } catch (error) {
            console.error('Failed to save theme file:', error);
            // Fallback to client-side download if server save fails
            this.downloadThemeFile(css);
        }
        
        // Auto-toggle to creative theme
        const themeNames = this.getThemeNames();
        const themeClasses = Object.values(themeNames).map(name => `${name}-theme`);
        
        // Remove existing theme classes
        document.documentElement.classList.remove(...themeClasses);
        
        // Add creative theme class
        document.documentElement.classList.add(`${themeNames.creative}-theme`);
        
        // Update season state to fall (which corresponds to creative theme)
        document.body.className = 'fall';
        
        // Update data-theme attribute for consistency
        document.documentElement.setAttribute('data-theme', 'fall');
        
        // Apply the colors immediately
        this.applyDirectColorChanges(colorBlocks, themeNames.creative);
        
        return {
            success: true,
            message: 'Theme saved and applied in creative mode',
            cssContent: css
        };
    }
    
    // Helper to download theme file as a fallback
    static downloadThemeFile(css) {
        // Create a Blob containing the CSS
        const blob = new Blob([css], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        
        // Create a link to download the file
        const link = document.createElement('a');
        link.href = url;
        link.download = 'creative-your-own-theme.css';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('Theme downloaded as creative-your-own-theme.css');
    }

    static isValidColor(color) {
        try {
            return chroma(color).hex() !== undefined;
        } catch (e) {
            return false;
        }
    }
}

export default ThemeGenerator;
