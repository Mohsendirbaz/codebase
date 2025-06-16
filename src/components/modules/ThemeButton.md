# ThemeButton Component

## Overview
The `ThemeButton` component is a theme selector button that allows users to switch between different themes (dark, light, creative) and provides access to theme customization for the creative theme.

## Purpose
- Enable quick theme switching
- Indicate current active theme
- Provide access to theme customization
- Maintain clean, intuitive theme selection UI

## Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `theme` | String | Yes | Theme identifier ('dark', 'light', 'creative') |
| `currentTheme` | String | Yes | Currently active theme |
| `onThemeChange` | Function | Yes | Callback when theme is selected |

## State Management
```javascript
const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
```
Controls the visibility of the theme configurator modal.

## Event Handlers

### Theme Selection
```javascript
const handleButtonClick = () => {
  // Always change theme when button is clicked
  onThemeChange(theme);
};
```
Triggers theme change when button is clicked.

### Edit Button
```javascript
const handleEditClick = (e) => {
  // Stop propagation to prevent theme change
  e.stopPropagation();
  setIsConfiguratorOpen(true);
};
```
Opens theme configurator without changing the theme.

## Conditional Rendering

### Edit Icon
The edit icon (✏️) appears only when:
1. The button represents the 'creative' theme
2. The creative theme is currently active

```jsx
{theme === 'creative' && currentTheme === 'creative' && (
  <span 
    className="edit-icon" 
    title="Edit Creative Theme"
    onClick={handleEditClick}
  >
    ✏️
  </span>
)}
```

### Button Label
Dynamic label based on theme:
- 'dark' → "Dark"
- 'light' → "Light"
- 'creative' → "Creative"

## Component Structure
```jsx
<div className={`theme-button-container ${currentTheme === theme ? 'active' : ''}`}>
  <button className={`theme-button ${currentTheme === theme ? 'active' : ''}`}>
    {/* Edit icon (conditional) */}
    {/* Theme label */}
  </button>
  {/* Theme configurator modal (conditional) */}
</div>
```

## CSS Classes
- `.theme-button-container`: Wrapper div
- `.theme-button`: Main button element
- `.active`: Applied when theme is currently active
- `.edit-icon`: Styling for the edit pencil icon

## Integration with ThemeConfigurator
When the edit icon is clicked:
1. Opens `ThemeConfigurator` component
2. Passes close handler to configurator
3. Allows real-time theme customization

## Usage Example
```jsx
import ThemeButton from './ThemeButton';

const ThemeSelector = () => {
  const [currentTheme, setCurrentTheme] = useState('light');

  return (
    <div className="theme-selector">
      <ThemeButton
        theme="light"
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
      />
      <ThemeButton
        theme="dark"
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
      />
      <ThemeButton
        theme="creative"
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
      />
    </div>
  );
};
```

## Behavior Flow
1. **Click button**: Changes to that theme immediately
2. **Click edit icon** (creative theme only): Opens configurator without changing theme
3. **Active state**: Visual indicator for current theme
4. **Configurator closed**: Returns to button state

## Accessibility Features
- Title attribute on edit icon for tooltip
- Clear visual active state indication
- Keyboard navigation support (inherited from button element)

## Event Propagation
Uses `e.stopPropagation()` on edit icon to prevent:
- Theme change when editing
- Parent click handlers from firing
- Unintended state changes

## Dependencies
- `ThemeConfigurator`: For theme customization
- `HCSS.css`: For styling

## Best Practices
1. Always provide all three theme options together
2. Ensure currentTheme prop is synchronized with actual theme
3. Handle theme persistence in parent component
4. Provide visual feedback for theme changes

## Future Enhancements
- Add theme preview on hover
- Include theme transition animations
- Support for additional themes
- Keyboard shortcuts for theme switching
- Theme scheduling (auto-switch based on time)