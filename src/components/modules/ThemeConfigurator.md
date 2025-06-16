# ThemeConfigurator Component

## Overview
The `ThemeConfigurator` component is a comprehensive theme customization interface that allows users to modify colors, create gradients, and apply custom CSS to theme files. It provides real-time preview and persistent theme modifications.

## Purpose
- Enable visual theme customization
- Create and apply color gradients
- Manage theme-specific CSS rules
- Provide real-time theme preview
- Save custom theme configurations

## Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onClose` | Function | Yes | Callback to close the configurator |

## State Management

### Colors State
```javascript
const [colors, setColors] = useState({
  primary: '',
  secondary: '',
  text: '',
  background: '',
  card: '',
  border: '',
  success: '',
  danger: '',
  warning: '',
  info: '',
  textSecondary: ''
});
```

### Gradients State
```javascript
const [gradients, setGradients] = useState({
  color1: '#9333ea',
  color2: '#7928ca',
  angle: '145deg',
  extraColor: '',
  extraPosition: '50%',
  useExtraColor: false
});
```

### CSS Registry State
```javascript
const [cssRegistry, setCssRegistry] = useState({
  selectedFiles: [],
  cssCode: '',
  status: ''
});
```

### UI State
- `activeTab`: Current active tab ('colors', 'gradients', 'css')
- `colorsChanged`: Array tracking modified colors
- `saveStatus`: Status of save operations

## Tabs

### 1. Colors Tab
Organized color pickers for:

#### Primary & Secondary Colors
- Primary color with gradient support
- Secondary color

#### Text & Background
- Main text color
- Secondary text color
- Background color

#### Component Colors
- Card background
- Border color

#### State Colors
- Success (green)
- Danger (red)
- Warning (yellow)
- Info (blue)

### 2. Gradients Tab
Interactive gradient generator with:
- Start and end color pickers
- Angle slider (0-360 degrees)
- Optional intermediate color
- Position control for intermediate color
- Live preview
- Copy-to-clipboard functionality

### 3. CSS Registry Tab
Custom CSS application system:
- File selector for target CSS files
- CSS code editor with syntax highlighting hints
- Theme variable reference
- Apply CSS to multiple files

## Key Features

### Real-time Preview
Changes are applied immediately to the current theme:
```javascript
themeGenerator.current.applyColorToCurrentTheme(colorKey, value);
```

### Gradient Processing
Handles both color values and gradient strings:
```javascript
if (value.trim().startsWith('linear-gradient(')) {
  // Process gradient
  themeGenerator.current.applyGradientToCurrentTheme(value);
  // Extract primary color from gradient
}
```

### Color Reset
Individual color reset buttons and global reset:
```javascript
const resetColor = (colorKey) => {
  const originalColor = themeGenerator.current.getOriginalColor(colorKey);
  handleColorChange(colorKey, originalColor);
};
```

### Theme Persistence
Saves theme to server or downloads as fallback:
```javascript
const result = await themeGenerator.current.saveToCreativeTheme(themeData);
```

## Available CSS Files
```javascript
const availableCssFiles = [
  'HomePage_AboutUs.css',
  'HomePage_buttons.css',
  'HomePage_FactAdmin.css',
  'HomePage_monitoring.css',
  'HomePage_selectors.css',
  'HomePage1.css',
  'HomePage2.css',
  'HomePage3.css',
  'HomePage4.css',
  'HomePage5.css',
  'HomePage6.css'
];
```

## Theme Variables
Available CSS variables for use in custom CSS:
- `--primary-color`
- `--secondary-color`
- `--text-color`
- `--background-color`
- `--card-background`
- `--border-color`
- `--success-color`
- `--danger-color`
- `--warning-color`
- `--info-color`
- `--text-secondary`
- `--gradient-primary`

## Component Integration
Uses `ThemeGenerator` class for theme operations:
- Loading current theme colors
- Applying color changes
- Saving theme configurations
- Managing CSS registry

## User Interface

### Color Input Groups
Each color has:
1. Color swatch (visual preview)
2. Color picker input
3. Text input for hex values
4. Reset button (when modified)

### Gradient Preview
```jsx
<div className="gradient-preview" style={{ 
  background: generateGradientString(),
  height: '100px',
  borderRadius: '8px'
}}>
```

### Status Feedback
```jsx
{saveStatus && (
  <div className={`save-status ${saveStatus.state}`}>
    {saveStatus.message}
  </div>
)}
```

## Usage Flow
1. **Open configurator** from creative theme button
2. **Select tab** for desired customization type
3. **Make changes** with real-time preview
4. **Apply theme** to save changes
5. **Close configurator** to return to app

## Error Handling
- Server save failures fall back to client download
- Invalid gradient formats are caught and handled
- CSS application errors display status messages

## Best Practices
1. Test color combinations for accessibility
2. Use theme variables in custom CSS
3. Preview changes before applying
4. Keep gradient angles consistent
5. Document custom CSS modifications

## Example Custom CSS
```css
.my-class {
  color: var(--primary-color);
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  background: var(--gradient-primary);
}
```

## Future Enhancements
- Import/export theme configurations
- Preset theme templates
- Color accessibility checker
- CSS validation
- Theme sharing functionality
- Undo/redo for changes