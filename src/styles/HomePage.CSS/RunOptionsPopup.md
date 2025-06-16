# RunOptionsPopup.css Documentation

## Overview
The RunOptionsPopup.css stylesheet defines a modal dialog component specifically designed for presenting run configuration options. Nearly identical to ResetOptionsPopup in structure, this component demonstrates a consistent modal pattern implementation with subtle naming variations for specific use cases.

## Architectural Structure

### 1. Modal Overlay Implementation

#### Full-Screen Backdrop
```css
.run-options-popup-overlay {
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

**Technical Specifications:**
- **Coverage**: Full viewport with fixed positioning
- **Backdrop**: 50% opacity black overlay
- **Content Centering**: Flexbox alignment
- **Stacking Order**: Z-index 1000 for modal priority

### 2. Modal Container Architecture

#### Popup Window Design
```css
.run-options-popup {
  background-color: var(--background-color, #fff);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  padding: 20px;
  width: 400px;
  max-width: 90%;
}
```

**Design Characteristics:**
- **Theming**: CSS variable with white fallback
- **Border Radius**: 8px for modern aesthetics
- **Shadow**: 20% opacity for subtle depth
- **Responsive Constraint**: 90% max-width for mobile

### 3. Content Organization

#### Title Treatment
```css
.run-options-popup h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: var(--text-color, #333);
  font-size: 18px;
  text-align: center;
}
```
- **Typography**: 18px centered heading
- **Spacing**: Zero top margin, 15px bottom
- **Color**: Theme-integrated with fallback

#### Option Row Structure
```css
.run-options-popup .checkbox-row {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}
```
- **Layout**: Horizontal flex container
- **Spacing**: 10px vertical separation
- **Alignment**: Centered vertically

### 4. Interactive Components

#### Label-Checkbox Pairing
```css
.run-option-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: var(--text-color, #333);
  font-size: 16px;
}

.run-option-label input[type="checkbox"] {
  margin-right: 10px;
  cursor: pointer;
  width: 18px;
  height: 18px;
}
```

**Interaction Design:**
- **Extended Click Area**: Entire label clickable
- **Visual Feedback**: Pointer cursor indication
- **Touch-Friendly**: 18x18px checkbox size
- **Clear Association**: 10px spacing

### 5. Action Button Framework

#### Button Container Layout
```css
.run-options-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}
```
- **Distribution**: Space-between alignment
- **Separation**: 20px from content above

#### Base Button Styling
```css
.run-confirm-button,
.run-cancel-button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  border: 1px solid var(--border-color, #ccc);
}
```

**Shared Properties:**
- **Padding**: Comfortable touch target
- **Border**: Consistent 1px outline
- **Typography**: 14px for readability
- **Interaction**: Pointer cursor

#### Primary Action (Confirm)
```css
.run-confirm-button {
  background-color: var(--primary-color, #007bff);
  color: white;
}

.run-confirm-button:hover {
  background-color: #0056b3;
}
```
- **Visual Weight**: Primary blue (#007bff)
- **Contrast**: White text on color
- **Hover Feedback**: Darker blue shade

#### Secondary Action (Cancel)
```css
.run-cancel-button {
  background-color: var(--background-color, #fff);
  color: var(--text-color, #333);
}

.run-cancel-button:hover {
  background-color: #f0f0f0;
}
```
- **Neutral Styling**: Matches background
- **Text Color**: Theme-consistent
- **Hover State**: Light gray tint

## Design Patterns

### Color Palette
- **Primary Action**: `var(--primary-color, #007bff)`
- **Background**: `var(--background-color, #fff)`
- **Text**: `var(--text-color, #333)`
- **Borders**: `var(--border-color, #ccc)`
- **Hover Blues**: `#0056b3` (darker primary)
- **Hover Grays**: `#f0f0f0` (light neutral)

### Layout Philosophy
- **Flexbox-First**: All layouts use flexbox
- **Fixed Dimensions**: 400px base width
- **Responsive Scaling**: Percentage constraints
- **Consistent Spacing**: 20px, 15px, 10px, 8px rhythm

### Interaction Patterns
- **Cursor Feedback**: Pointer for all interactive elements
- **Hover States**: Color transitions on buttons
- **Click Targets**: Extended through labels

## Component Similarities

### Comparison with ResetOptionsPopup
This component shares 95% of its styling with ResetOptionsPopup, differing only in:
- Class name prefixes (`run-` vs `reset-`)
- Semantic purpose (run configuration vs reset options)

This pattern suggests:
1. **Consistency**: Unified modal design language
2. **Maintainability**: Potential for shared base styles
3. **Predictability**: Users experience familiar patterns

## Accessibility Considerations

### Keyboard Interaction
- **Tab Navigation**: Natural flow through options
- **Focus Management**: Expected modal trap
- **Label Associations**: Proper checkbox connections

### Screen Reader Support
- **Heading Structure**: Clear h3 title
- **Button Semantics**: Action clarity
- **Option Labels**: Descriptive text

## Responsive Behavior

### Mobile Constraints
- **Width Limiting**: 90% max-width
- **Padding Preservation**: Edge spacing maintained
- **Touch Targets**: 18px checkboxes adequate

## Integration Requirements

### Required Variables
1. `--background-color`: Modal and button backgrounds
2. `--text-color`: All text elements
3. `--primary-color`: Confirm button
4. `--border-color`: Button outlines

### Expected HTML Structure
```html
<div class="run-options-popup-overlay">
  <div class="run-options-popup">
    <h3>Title</h3>
    <div class="checkbox-row">
      <label class="run-option-label">
        <input type="checkbox">
        Option text
      </label>
    </div>
    <div class="run-options-buttons">
      <button class="run-cancel-button">Cancel</button>
      <button class="run-confirm-button">Run</button>
    </div>
  </div>
</div>
```

## Usage Patterns

### State Management
- **Visibility**: Toggle overlay display property
- **Options**: Track checkbox states
- **Actions**: Handle confirm/cancel callbacks

### Enhancement Opportunities
Current CSS lacks:
- Transition animations
- Loading states
- Disabled states
- Error messaging

## Performance Analysis

1. **Minimal Complexity**: Simple, flat CSS
2. **No Animations**: Instant show/hide
3. **Efficient Selectors**: Direct class targeting
4. **Static Layout**: No dynamic calculations

## Recommendations

### Code Optimization
1. **Share Base Styles**: Extract common modal CSS
2. **Use CSS Modules**: Prevent naming conflicts
3. **Add Transitions**: Smooth open/close animations

### Feature Enhancements
1. **Loading States**: Disable during processing
2. **Validation**: Error state styling
3. **Keyboard Shortcuts**: ESC to close
4. **Focus Management**: Auto-focus first option

### Maintenance
1. **Consolidate Duplicates**: Merge with ResetOptionsPopup base
2. **Document Differences**: Clear use case separation
3. **Version Control**: Track style evolution