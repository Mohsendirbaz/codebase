import chroma from 'chroma-js';

class ThemeGenerator {
  constructor() {
    this.apiEndpoint = '/api/theme';
    this.cssRegistryEndpoint = '/api/css-registry';
    this.originalThemeColors = {};
    
    // Initialize by capturing the original theme colors
    this.captureOriginalThemeColors();
  }
  
  // Capture the original theme colors for reset functionality
  captureOriginalThemeColors() {
    const rootStyle = getComputedStyle(document.documentElement);
    this.originalThemeColors = {
      primary: rootStyle.getPropertyValue('--primary-color').trim(),
      secondary: rootStyle.getPropertyValue('--secondary-color').trim(),
      text: rootStyle.getPropertyValue('--text-color').trim(),
      background: rootStyle.getPropertyValue('--background-color').trim(),
      card: rootStyle.getPropertyValue('--card-background').trim(),
      border: rootStyle.getPropertyValue('--border-color').trim(),
      success: rootStyle.getPropertyValue('--success-color').trim(),
      danger: rootStyle.getPropertyValue('--danger-color').trim(),
      warning: rootStyle.getPropertyValue('--warning-color').trim(),
      info: rootStyle.getPropertyValue('--info-color').trim(),
      textSecondary: rootStyle.getPropertyValue('--text-secondary').trim(),
      gradientPrimary: rootStyle.getPropertyValue('--gradient-primary').trim()
    };
  }
  
  // Get original color for reset functionality
  getOriginalColor(colorKey) {
    const cssVarMap = {
      primary: 'primary',
      secondary: 'secondary',
      text: 'text',
      background: 'background',
      card: 'card',
      border: 'border',
      success: 'success',
      danger: 'danger',
      warning: 'warning',
      info: 'info',
      textSecondary: 'textSecondary'
    };
    
    return this.originalThemeColors[cssVarMap[colorKey]] || '';
  }

  // Load current theme colors
  loadCurrentThemeColors() {
    const rootStyle = getComputedStyle(document.documentElement);
    
    return {
      '--primary-color': rootStyle.getPropertyValue('--primary-color').trim(),
      '--secondary-color': rootStyle.getPropertyValue('--secondary-color').trim(),
      '--text-color': rootStyle.getPropertyValue('--text-color').trim(),
      '--background-color': rootStyle.getPropertyValue('--background-color').trim(),
      '--card-background': rootStyle.getPropertyValue('--card-background').trim(),
      '--border-color': rootStyle.getPropertyValue('--border-color').trim(),
      '--success-color': rootStyle.getPropertyValue('--success-color').trim(),
      '--danger-color': rootStyle.getPropertyValue('--danger-color').trim(),
      '--warning-color': rootStyle.getPropertyValue('--warning-color').trim(),
      '--info-color': rootStyle.getPropertyValue('--info-color').trim(),
      '--text-secondary': rootStyle.getPropertyValue('--text-secondary').trim(),
      '--gradient-primary': rootStyle.getPropertyValue('--gradient-primary').trim()
    };
  }

  // Apply color change to the current theme
  applyColorToCurrentTheme(colorKey, value) {
    // Handle gradient strings - extract the first color if needed
    const extractColorFromValue = (val) => {
      if (typeof val !== 'string') return val;
      
      // Check if this is a gradient and properly process it
      if (val.trim().startsWith('linear-gradient(')) {
        try {
          // If this is a gradient string but we're applying to a color, extract the first color
          // For gradients tab, this should work directly
          if (colorKey === 'gradient') {
            return val; // Keep the full gradient string
          }
          
          // For color fields, we need to extract a color from the gradient
          const colorMatch = val.match(/#[a-f0-9]{3,8}|rgba?\([^)]+\)/i);
          if (colorMatch && colorMatch[0]) {
            // Log for debugging
            console.log(`Extracted ${colorMatch[0]} from gradient for ${colorKey}`);
            return colorMatch[0];
          }
          // If no color match, return a default
          return '#8a2be2';
        } catch (err) {
          console.warn('Error processing gradient:', err);
          return '#8a2be2';
        }
      }
      
      return val;
    };
    
    const cssVarMap = {
      primary: '--primary-color',
      secondary: '--secondary-color',
      text: '--text-color',
      background: '--background-color',
      card: '--card-background',
      border: '--border-color',
      success: '--success-color',
      danger: '--danger-color',
      warning: '--warning-color',
      info: '--info-color',
      textSecondary: '--text-secondary'
    };
    
    const cssVar = cssVarMap[colorKey];
    
    if (cssVar) {
      // Get a valid color value
      const colorValue = extractColorFromValue(value);
      
      // Set the CSS variable on the root element
      document.documentElement.style.setProperty(cssVar, colorValue);
      
      // Update derived colors based on the changed color
      if (colorKey === 'primary') {
        try {
          const primary = chroma(colorValue);
          const primaryLight = primary.brighten(0.8).saturate(0.1).hex();
          const primaryDark = primary.darken(0.8).saturate(0.1).hex();
          
          document.documentElement.style.setProperty('--primary-color-light', primaryLight);
          document.documentElement.style.setProperty('--primary-color-dark', primaryDark);
          document.documentElement.style.setProperty('--primary-color-alpha', chroma(colorValue).alpha(0.7).css());
          document.documentElement.style.setProperty('--button-primary-bg', colorValue);
          document.documentElement.style.setProperty('--button-primary-hover-bg', primaryDark);
          document.documentElement.style.setProperty('--model-color-primary', colorValue);
          document.documentElement.style.setProperty('--model-color-primary-light', primaryLight);
        } catch (err) {
          console.warn('Error processing primary color:', err);
        }
      }
      
      if (colorKey === 'secondary') {
        try {
          const secondary = chroma(colorValue);
          const secondaryLight = secondary.brighten(0.8).saturate(0.1).hex();
          const secondaryDark = secondary.darken(0.8).saturate(0.1).hex();
          
          document.documentElement.style.setProperty('--secondary-color-light', secondaryLight);
          document.documentElement.style.setProperty('--secondary-color-dark', secondaryDark);
          document.documentElement.style.setProperty('--button-secondary-bg', colorValue);
          document.documentElement.style.setProperty('--button-secondary-hover-bg', secondaryDark);
        } catch (err) {
          console.warn('Error processing secondary color:', err);
        }
      }
      
      if (colorKey === 'success') {
        try {
          document.documentElement.style.setProperty('--success-hover', chroma(colorValue).darken(0.8).hex());
          document.documentElement.style.setProperty('--model-color-success', colorValue);
          document.documentElement.style.setProperty('--model-color-success-light', chroma(colorValue).brighten(0.8).hex());
        } catch (err) {
          console.warn('Error processing success color:', err);
        }
      }
      
      if (colorKey === 'danger') {
        try {
          document.documentElement.style.setProperty('--danger-hover', chroma(colorValue).darken(0.8).hex());
          document.documentElement.style.setProperty('--model-color-danger', colorValue);
          document.documentElement.style.setProperty('--model-color-danger-light', chroma(colorValue).brighten(0.8).hex());
        } catch (err) {
          console.warn('Error processing danger color:', err);
        }
      }
      
      if (colorKey === 'warning') {
        try {
          document.documentElement.style.setProperty('--warning-hover', chroma(colorValue).darken(0.8).hex());
        } catch (err) {
          console.warn('Error processing warning color:', err);
        }
      }
      
      if (colorKey === 'info') {
        try {
          document.documentElement.style.setProperty('--info-hover', chroma(colorValue).darken(0.8).hex());
        } catch (err) {
          console.warn('Error processing info color:', err);
        }
      }
      
      if (colorKey === 'text') {
        document.documentElement.style.setProperty('--model-color-text', colorValue);
      }
      
      if (colorKey === 'background') {
        document.documentElement.style.setProperty('--app-background', colorValue);
      }
    }
  }
  
  // Apply gradient to the current theme
  applyGradientToCurrentTheme(gradientString) {
    document.documentElement.style.setProperty('--gradient-primary', gradientString);
  }

  // Reset theme to original values
  resetTheme() {
    // Track the original theme class to restore it afterward
    const originalThemeClass = Array.from(document.documentElement.classList)
      .find(cls => cls.endsWith('-theme'));
    
    // Reset all colors to their original values
    Object.entries(this.originalThemeColors).forEach(([key, value]) => {
      if (key === 'gradientPrimary') {
        document.documentElement.style.setProperty('--gradient-primary', value);
      } else {
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        document.documentElement.style.setProperty(cssVar, value);
      }
    });
    
    // Reset derived colors
    const primary = chroma(this.originalThemeColors.primary);
    const primaryLight = primary.brighten(0.8).saturate(0.1).hex();
    const primaryDark = primary.darken(0.8).saturate(0.1).hex();
    
    document.documentElement.style.setProperty('--primary-color-light', primaryLight);
    document.documentElement.style.setProperty('--primary-color-dark', primaryDark);
    document.documentElement.style.setProperty('--primary-color-alpha', chroma(this.originalThemeColors.primary).alpha(0.7).css());
    document.documentElement.style.setProperty('--button-primary-bg', this.originalThemeColors.primary);
    document.documentElement.style.setProperty('--button-primary-hover-bg', primaryDark);
    document.documentElement.style.setProperty('--model-color-primary', this.originalThemeColors.primary);
    document.documentElement.style.setProperty('--model-color-primary-light', primaryLight);
    
    const secondary = chroma(this.originalThemeColors.secondary);
    const secondaryLight = secondary.brighten(0.8).saturate(0.1).hex();
    const secondaryDark = secondary.darken(0.8).saturate(0.1).hex();
    
    document.documentElement.style.setProperty('--secondary-color-light', secondaryLight);
    document.documentElement.style.setProperty('--secondary-color-dark', secondaryDark);
    document.documentElement.style.setProperty('--button-secondary-bg', this.originalThemeColors.secondary);
    document.documentElement.style.setProperty('--button-secondary-hover-bg', secondaryDark);
    
    // Ensure spatial variables are reset
    document.documentElement.style.setProperty('--spatial-gradient-start', this.originalThemeColors.primary);
    document.documentElement.style.setProperty('--spatial-gradient-end', primaryLight);
    
    // Make sure we restore the original theme class
    if (originalThemeClass) {
      document.documentElement.classList.remove('dark-theme', 'normal-theme', 'creative-theme');
      document.documentElement.classList.add(originalThemeClass);
    }
  }

  // Generate CSS content for creative theme
  generateCreativeThemeCss(themeData) {
    const { colors, gradients } = themeData;
    
    // Get primary and derived colors
    const primary = colors.primary || '#8a2be2';
    const primaryObj = chroma(primary);
    const primaryLight = primaryObj.brighten(0.8).saturate(0.1).hex();
    const primaryDark = primaryObj.darken(0.8).saturate(0.1).hex();
    
    // Get secondary and derived colors
    const secondary = colors.secondary || '#00bcd4';
    const secondaryObj = chroma(secondary);
    const secondaryLight = secondaryObj.brighten(0.8).saturate(0.1).hex();
    const secondaryDark = secondaryObj.darken(0.8).saturate(0.1).hex();
    
    // Other colors
    const text = colors.text || '#424242';
    const textSecondary = colors.textSecondary || chroma(text).alpha(0.7).css();
    const background = colors.background || '#f8f9fa';
    const cardBackground = colors.card || '#ffffff';
    const borderColor = colors.border || '#e0e0e0';
    
    // State colors
    const success = colors.success || '#28a745';
    const successHover = chroma(success).darken(0.8).hex();
    const danger = colors.danger || '#dc3545';
    const dangerHover = chroma(danger).darken(0.8).hex();
    const warning = colors.warning || '#ffc107';
    const warningHover = chroma(warning).darken(0.8).hex();
    const info = colors.info || '#17a2b8';
    const infoHover = chroma(info).darken(0.8).hex();
    
    // Build the CSS while preserving the layout variables
    return `/* Creative Theme - Vibrant & Energetic */
:root.creative-theme {
    --primary-color: ${primary};
    --secondary-color: ${secondary};
    --text-color: ${text};
    --background-color: ${background};
    --sidebar-background: ${cardBackground};
    --card-background: ${cardBackground};
    --border-color: ${borderColor};
    --success-color: ${success};
    --danger-color: ${danger};
    --warning-color: ${warning};
    --info-color: ${info};
    --light-color: #f8f9fa;
    --dark-color: #343a40;
    --text-secondary: ${textSecondary};
    --input-background: ${cardBackground};
    --input-border: ${borderColor};
    --shadow-dark: rgba(166, 180, 200, 0.8);
    --shadow-light: rgba(255, 255, 255, 0.9);
    --gradient-primary: ${gradients.primary || `linear-gradient(145deg, ${primaryLight}, ${primary})`};

    /* Spacing */
    --model-spacing-xs: 4px;
    --model-spacing-sm: 8px;
    --model-spacing-md: 16px;
    --model-spacing-lg: 24px;

    /* Colors */
    --model-color-background: ${cardBackground};
    --model-color-background-alt: ${background};
    --model-color-background-hover: ${chroma(background).darken(0.1).hex()};
    --model-color-text: ${text};
    --model-color-border: ${borderColor};
    --model-color-primary: ${primary};
    --model-color-primary-light: ${primaryLight};
    --model-color-success: ${success};
    --model-color-success-light: ${chroma(success).brighten(0.8).hex()};
    --model-color-danger: ${danger};
    --model-color-danger-light: ${chroma(danger).brighten(0.8).hex()};

    /* Dark mode colors */
    --model-color-background-dark: #212529;
    --model-color-background-alt-dark: #343a40;
    --model-color-border-dark: #495057;

    /* Border radius */
    --model-border-radius-sm: 4px;
    --model-border-radius-md: 8px;
    --model-border-radius-lg: 12px;

    /* Shadows */
    --model-shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
    --model-shadow-md: 0 4px 6px rgba(0,0,0,0.15);
    --model-shadow-lg: 0 10px 15px rgba(0,0,0,0.2);

    /* Transitions */
    --model-transition-fast: 0.15s ease;
    --model-transition-medium: 0.3s ease;

    /* Font sizes */
    --model-font-size-sm: 14px;
    --model-font-size-md: 16px;
    --model-font-size-lg: 18px;

    /* Spatial Transform Variables */
    --spatial-perspective: 1000px;
    --spatial-perspective-origin-x: 0%;
    --spatial-perspective-origin-y: 0%;
    --spatial-transition-timing: cubic-bezier(0.42, 0, 0.05, 0.99);
    --spatial-transition-duration: 0.5s;
    --spatial-container-width: 24rem;
    --spatial-container-height: 16rem;
    --spatial-element-radius: 0.75rem;
    --spatial-gradient-start: ${primary};
    --spatial-gradient-end: ${primaryLight};
    --spatial-shadow-intensity: 2xl;
    --spatial-text-size: 1.5rem;
}

html{
    /* Critical Layout Variables */
    --spacing-unit: 1rem;
    --spacing-xs: calc(var(--spacing-unit) * 0.25);
    --spacing-sm: calc(var(--spacing-unit) * 0.5);
    --spacing-md: var(--spacing-unit);
    --spacing-lg: calc(var(--spacing-unit) * 1.5);
    --spacing-xl: calc(var(--spacing-unit) * 2);
  
    /* Theme Variables */
    --app-background: ${background};
    --sidebar-background: ${cardBackground};
    --border-color: ${borderColor};
    --text-color: ${text};
    --text-secondary: ${textSecondary};
    --primary-color: ${primary};
}`;
  }
  
  // Preview the creative theme without saving
  previewTheme(themeData) {
    // Generate CSS
    const cssContent = this.generateCreativeThemeCss(themeData);
    
    // Switch to creative theme mode if not already
    if (!document.documentElement.classList.contains('creative-theme')) {
      document.documentElement.classList.remove('dark-theme', 'normal-theme');
      document.documentElement.classList.add('creative-theme');
    }
    
    return cssContent;
  }
  
  // Save to creative theme
  async saveToCreativeTheme(themeData) {
    try {
      // Generate CSS content
      const cssContent = this.generateCreativeThemeCss(themeData);
      
      // Try to save via server API first
      try {
        const response = await fetch(`${this.apiEndpoint}/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ css: cssContent }),
        });
        
        if (response.ok) {
          // Switch to creative theme mode if not already
          if (!document.documentElement.classList.contains('creative-theme')) {
            document.documentElement.classList.remove('dark-theme', 'normal-theme');
            document.documentElement.classList.add('creative-theme');
          }
          
          // Return success
          return { success: true };
        } else {
          // If server save fails, fall back to client-side download
          const errorData = await response.json();
          console.error('Server save failed:', errorData.message || 'Unknown error');
          throw new Error(errorData.message || 'Server save failed');
        }
      } catch (error) {
        console.warn('Server save failed, falling back to client download:', error);
        
        // Create a download link for the CSS file
        const blob = new Blob([cssContent], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'creative-theme.css';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Switch to creative theme mode if not already
        if (!document.documentElement.classList.contains('creative-theme')) {
          document.documentElement.classList.remove('dark-theme', 'normal-theme');
          document.documentElement.classList.add('creative-theme');
        }
        
        // Return partial success with client fallback
        return { 
          success: true, 
          clientFallback: true, 
          message: 'Server save failed, but theme was downloaded to your computer' 
        };
      }
    } catch (error) {
      console.error('Theme save failed:', error);
      return { success: false, message: error.message };
    }
  }
  
  // Apply CSS to selected files
  async applyCssToFiles(files, cssCode) {
    try {
      // Try to save via server API first
      try {
        const response = await fetch(`${this.cssRegistryEndpoint}/apply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files, cssCode }),
        });
        
        if (response.ok) {
          return { success: true };
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Server failed to apply CSS');
        }
      } catch (error) {
        console.warn('Server CSS apply failed:', error);
        
        // For CSS registry, we don't have a client fallback
        // We could potentially generate separate CSS files, but that's beyond the scope
        return { 
          success: false, 
          message: 'Failed to apply CSS to files. Server error: ' + error.message
        };
      }
    } catch (error) {
      console.error('CSS application failed:', error);
      return { success: false, message: error.message };
    }
  }
}

export default ThemeGenerator;
