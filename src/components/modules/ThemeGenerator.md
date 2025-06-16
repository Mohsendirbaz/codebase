# ThemeGenerator Class

## Overview
The `ThemeGenerator` class is a utility service that handles theme generation, color manipulation, gradient processing, and CSS registry management. It provides both client-side and server-side theme operations with automatic fallback mechanisms.

## Purpose
- Generate and apply theme colors dynamically
- Process and apply CSS gradients
- Manage theme persistence
- Apply custom CSS to theme files
- Handle color extraction from gradients

## Class Structure

### Constructor
```javascript
constructor() {
  this.apiEndpoint = 'http://localhost:8010/api/theme';
  this.cssRegistryEndpoint = 'http://localhost:8010/api/css-registry';
  this.originalThemeColors = {};
  
  // Initialize by capturing the original theme colors
  this.captureOriginalThemeColors();
}
```

## Key Methods

### captureOriginalThemeColors()
Captures current CSS variables from the document:
```javascript
captureOriginalThemeColors() {
  const rootStyles = getComputedStyle(document.documentElement);
  const cssVariables = Array.from(rootStyles).filter(prop => 
    prop.startsWith('--')
  );
  
  this.originalThemeColors = cssVariables.reduce((acc, varName) => {
    acc[varName] = rootStyles.getPropertyValue(varName).trim();
    return acc;
  }, {});
  
  return this.originalThemeColors;
}
```

### applyGradientToCurrentTheme(gradientString)
Applies a gradient to the current theme:
```javascript
async applyGradientToCurrentTheme(gradientString) {
  // Validate gradient format
  if (!gradientString.startsWith('linear-gradient(')) {
    throw new Error('Invalid gradient format');
  }

  // Extract color stops
  const colorStops = gradientString.match(/(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8})/g);
  
  // Create CSS variables
  const cssVariables = {
    '--gradient': gradientString,
    '--primary-color': colorStops[0],
    '--secondary-color': colorStops[1]
  };

  // Apply via API or fallback to local
}
```

### loadCurrentThemeColors()
Loads theme colors from API or local CSS:
```javascript
async loadCurrentThemeColors() {
  try {
    // Try API first
    const response = await fetch(`${this.apiEndpoint}/current`);
    if (response.ok) {
      return await response.json();
    }
    
    // Fallback to local CSS variables
    return this.getCurrentLocalColors();
  } catch (error) {
    return this.originalThemeColors;
  }
}
```

### applyColorToCurrentTheme(colorKey, value)
Processes and applies color changes:
```javascript
applyColorToCurrentTheme(colorKey, value) {
  // Handle gradient strings
  if (value.trim().startsWith('linear-gradient(')) {
    // Process gradient and extract colors
    // Uses chroma.js for color calculations
  }
  
  // Apply regular color value
  document.documentElement.style.setProperty(`--${colorKey}`, value);
}
```

### applyCssToFiles(files, cssCode)
Applies custom CSS to selected theme files:
```javascript
async applyCssToFiles(files, cssCode) {
  try {
    const response = await fetch(`${this.cssRegistryEndpoint}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files, cssCode }),
    });
    
    if (response.ok) {
      return { success: true, message: 'CSS applied via server API' };
    }
  } catch (error) {
    return { 
      success: false, 
      message: error.message,
      stack: error.stack 
    };
  }
}
```

## Gradient Processing

### Color Extraction from Gradients
When a gradient is provided for a color field:
1. Extracts all color stops using regex
2. Calculates weighted average using chroma.js
3. Weights middle colors more heavily
4. Returns single color value

```javascript
const extractColorFromValue = (val) => {
  if (val.trim().startsWith('linear-gradient(')) {
    const colors = val.match(/#[a-f0-9]{3,8}|rgba?\([^)]+\)/gi);
    if (colors && colors.length > 0) {
      // Calculate weighted average color
      const colorScale = chroma.scale(colors);
      // ... weighted calculation logic
      return avgColor;
    }
  }
  return val;
};
```

## API Integration

### Endpoints
- **Theme API**: `http://localhost:8010/api/theme`
  - GET `/current`: Load current theme
  - POST `/current`: Apply theme changes
  - POST `/save`: Save theme to file

- **CSS Registry API**: `http://localhost:8010/api/css-registry`
  - POST `/apply`: Apply CSS to files

### Fallback Strategy
All API operations have local fallbacks:
1. Try server API first
2. If failed, apply changes locally
3. Log detailed information for debugging

## Error Handling

### Console Logging
Uses console groups for organized logging:
```javascript
console.group('Applying gradient theme');
// ... operations
console.groupEnd();
```

### Validation
- Validates gradient format before processing
- Checks for valid color stops
- Ensures CSS variables exist

## Color Manipulation

### Chroma.js Integration
Uses chroma.js for advanced color operations:
- Color scale creation
- Alpha channel manipulation
- Weighted color averaging
- Color format conversion

## Usage Example
```javascript
const themeGenerator = new ThemeGenerator();

// Apply a gradient
await themeGenerator.applyGradientToCurrentTheme(
  'linear-gradient(145deg, #9333ea, #7928ca)'
);

// Apply a single color
themeGenerator.applyColorToCurrentTheme('primary', '#9333ea');

// Load current colors
const colors = await themeGenerator.loadCurrentThemeColors();

// Apply CSS to files
const result = await themeGenerator.applyCssToFiles(
  ['HomePage1.css', 'HomePage2.css'],
  '.custom { color: var(--primary-color); }'
);
```

## Best Practices
1. Always capture original colors on initialization
2. Use try-catch for all async operations
3. Provide detailed logging for debugging
4. Validate input before processing
5. Maintain fallback mechanisms

## Dependencies
- **chroma-js**: Color manipulation library
- **Fetch API**: For server communication
- **DOM API**: For CSS variable manipulation

## Future Enhancements
- WebSocket support for real-time theme sync
- Theme version control
- Batch color operations
- Advanced gradient patterns (radial, conic)
- Color harmony suggestions
- Theme analytics and usage tracking