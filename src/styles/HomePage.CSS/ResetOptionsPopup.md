# ResetOptionsPopup.css Documentation

## Overview
The ResetOptionsPopup.css stylesheet defines a modal dialog component designed for presenting reset options to users. This lightweight yet functional component implements a classic modal pattern with overlay, centered content, and action controls.

## Architectural Structure

### 1. Modal Overlay System

#### Full-Screen Overlay
```css
.reset-options-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
```

**Key Features:**
- **Fixed Positioning**: Covers entire viewport
- **Semi-transparent Background**: 50% black overlay
- **Flexbox Centering**: Content automatically centered
- **High Z-index**: Ensures modal appears above other content

### 2. Modal Container Design

#### Popup Window
```css
.reset-options-popup {
  background-color: var(--background-color, #fff);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  padding: 20px;
  width: 400px;
  max-width: 90%;
}
```

**Design Characteristics:**
- **Theming Support**: CSS variable with fallback
- **Rounded Corners**: 8px for modern appearance
- **Shadow Depth**: Subtle elevation effect
- **Responsive Width**: Fixed with percentage constraint

### 3. Content Structure

#### Title Styling
```css
.reset-options-popup h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: var(--text-color, #333);
  font-size: 18px;
  text-align: center;
}
```
- **Typography**: 18px centered heading
- **Spacing**: No top margin, 15px bottom
- **Color**: Theme-aware with fallback

#### Checkbox Row Layout
```css
.reset-options-popup .checkbox-row {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}
```
- **Consistent Spacing**: 10px between options
- **Flex Layout**: Horizontal alignment
- **Center Alignment**: Vertically centered items

### 4. Interactive Elements

#### Label and Checkbox Design
```css
.reset-option-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: var(--text-color, #333);
  font-size: 16px;
}

.reset-option-label input[type="checkbox"] {
  margin-right: 10px;
  cursor: pointer;
  width: 18px;
  height: 18px;
}
```

**Interaction Design:**
- **Clickable Labels**: Entire label is interactive
- **Visual Feedback**: Pointer cursor on hover
- **Checkbox Sizing**: 18x18px for touch targets
- **Spacing**: 10px gap between checkbox and text

### 5. Action Button System

#### Button Container
```css
.reset-options-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}
```
- **Layout**: Horizontal with space-between
- **Separation**: 20px top margin from content

#### Button Styling
```css
.reset-confirm-button,
.reset-cancel-button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  border: 1px solid var(--border-color, #ccc);
}
```

**Common Properties:**
- **Padding**: Comfortable click target
- **Border Radius**: Subtle rounding
- **Typography**: 14px for readability
- **Border**: Consistent outline

#### Confirm Button
```css
.reset-confirm-button {
  background-color: var(--primary-color, #007bff);
  color: white;
}

.reset-confirm-button:hover {
  background-color: #0056b3;
}
```
- **Primary Action**: Blue background (#007bff)
- **High Contrast**: White text
- **Hover State**: Darker blue (#0056b3)

#### Cancel Button
```css
.reset-cancel-button {
  background-color: var(--background-color, #fff);
  color: var(--text-color, #333);
}

.reset-cancel-button:hover {
  background-color: #f0f0f0;
}
```
- **Secondary Action**: Background color match
- **Text Color**: Theme-aware
- **Hover State**: Light gray background

## Design Patterns

### Color System
- **Primary Color**: `var(--primary-color, #007bff)`
- **Background**: `var(--background-color, #fff)`
- **Text**: `var(--text-color, #333)`
- **Border**: `var(--border-color, #ccc)`
- **Fallbacks**: Hard-coded values for compatibility

### Layout Strategy
- **Flexbox**: Primary layout mechanism
- **Fixed Dimensions**: 400px width with responsive constraint
- **Consistent Spacing**: 20px padding, standardized margins

### Interactive Feedback
- **Cursor Changes**: Pointer for interactive elements
- **Hover States**: Color transitions for buttons
- **Visual Hierarchy**: Primary vs secondary actions

## Accessibility Considerations

### Keyboard Support
- **Focus Management**: Modal trap implementation expected
- **Tab Order**: Natural flow through checkboxes and buttons
- **Interactive Labels**: Click target extension

### Screen Reader Compatibility
- **Semantic Structure**: Heading hierarchy
- **Label Association**: Checkbox labels properly connected
- **Button Roles**: Clear action identification

## Responsive Design

### Mobile Optimization
```css
max-width: 90%;
```
- **Width Constraint**: Prevents edge overflow
- **Padding Preservation**: Maintains 5% margins
- **Content Reflow**: Natural text wrapping

## Integration Requirements

### CSS Variables Required
1. `--background-color`: Modal background
2. `--text-color`: Text elements
3. `--primary-color`: Confirm button
4. `--border-color`: Button borders

### Expected HTML Structure
- Overlay container with popup child
- H3 heading for title
- Checkbox rows with labels
- Button container with two actions

## Usage Patterns

### State Management
- **Visibility**: Toggle overlay display
- **Selection**: Track checkbox states
- **Actions**: Handle confirm/cancel events

### Animation Opportunities
While not defined in CSS:
- Fade in/out transitions
- Scale animations
- Backdrop blur effects

## Performance Considerations

1. **Simple Structure**: Minimal CSS complexity
2. **No Animations**: Instant display/hide
3. **Efficient Selectors**: Direct class targeting
4. **Minimal Repaints**: Static layout

## Best Practices

1. **Maintain Focus Management**: Trap focus within modal
2. **Provide Escape Key**: Close on ESC press
3. **Click Outside**: Close on overlay click
4. **Loading States**: Disable buttons during processing
5. **Error Handling**: Display validation messages