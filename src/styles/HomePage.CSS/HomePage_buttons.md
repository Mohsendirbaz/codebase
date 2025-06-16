# HomePage_buttons.css Documentation

## Overview
This comprehensive CSS file (543 lines) implements an extensive button system for a complex form interface. It features multiple button categories, sophisticated layout systems, responsive design, and specialized styling for various action types including configuration, visualization, batch operations, and sensitivity controls.

## File Structure & Architecture

### 1. **Form Container Layout System** (Lines 1-94)

#### Main Container Structure
```css
.form-panel-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  gap: 8px;
  margin: 8px 0;
}
```

#### Layout Hierarchy
1. **Form Panel Container** - Top-level wrapper
2. **Form Action Buttons** - Button group container
3. **Button Rows** - Categorized button layouts:
   - `.button-row` - Generic row layout
   - `.config-row` - Configuration buttons
   - `.checkbox-row` - Checkbox controls
   - `.visualization-row` - Visualization actions
   - `.step-content` - Batch operations
   - `.practical-row` - Primary actions

#### Row Specifications
- Standard gap: `calc(var(--model-spacing-sm) * 2)`
- Consistent padding: 8px vertical
- Flex wrap enabled for responsive behavior
- Font size emphasis: 24px for visibility

### 2. **Selector Components** (Lines 85-129)

#### Compact Selector Design
```css
.selectors-container {
  display: flex;
  flex-direction: row;
  gap: 5px;
  margin-top: 4px;
  width: 100%;
  padding: 2px;
}
```

#### Input Controls
- **Calculation Row** - Tight 5px gaps
- **Radio Labels** - 24px font with flex alignment
- **Target Row Input** - Compact 50x20px inputs
  - Centered text
  - Custom border and background colors

### 3. **Core Button Styling** (Lines 142-182)

#### Base Button Properties
```css
.form-action-buttons button {
  font-weight: bold;
  padding: 16px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 150px;
  min-height: calc(16px * 2 + 1.2em);
  position: relative;
  overflow: hidden;
  line-height: 1.2;
  margin: 0 10px 0 0 !important;
  height: auto;
  white-space: nowrap;
}
```

**Design Decisions:**
- Fixed minimum dimensions for consistency
- Bold text for prominence
- 8px border radius for modern appearance
- 0.3s transition for smooth interactions
- No text wrapping for clarity

### 4. **Button Category Styling** (Lines 165-308)

#### Configuration Buttons
```css
.form-action-buttons .config-row button {
  background-color: var(--primary-color);
  color: var(--button-text);
}
```
- Primary color scheme
- Transform on hover (-2px vertical)
- Shadow elevation effects

#### Visualization Buttons
```css
.form-action-buttons .visualization-row button {
  background-color: var(--info-color);
  color: var(--button-text);
  flex: 0 0 auto;
  font-size: 24px;
}
```

#### Practical Action Buttons
1. **Run CFA** - Warning color (#FFA500)
2. **Submit Complete Set** - Success color
3. **Reset** - Danger color

#### Batch Operation Buttons
- **Create New Batch** - Danger color (primary action)
- **Remove Current Batch** - Text color (secondary action)
- Min-width: 180px for prominence

### 5. **State Management** (Lines 309-327)

#### Disabled State
```css
.form-action-buttons button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

#### Loading Animation
```css
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}
```
- Applied to Run CFA button when disabled
- 1.5s infinite animation

### 6. **Version Input System** (Lines 336-366)

#### Container Design
```css
.version-input-container {
  display: flex;
  align-items: center;
  min-width: 100px;
  margin-left: 10px;
  gap: 4px;
  margin-right: auto;
}
```

#### Input Styling
- Multiple height definitions (35px min, 22px actual)
- 60px width for version numbers
- Pill-shaped design (40px border radius)
- Centered text alignment

### 7. **Responsive Design** (Lines 399-419)

#### Mobile Breakpoint (≤768px)
```css
@media (max-width: 768px) {
  .form-action-buttons button {
    min-width: 120px;
    padding: 12px 16px;
    margin-bottom: 8px;
  }
  .practical-row .tooltip-container {
    flex: 1 1 45%;
  }
}
```

### 8. **Icon Management** (Lines 421-443)

#### SVG Icon Constraints
```css
.form-action-buttons button svg {
    width: 16px;
    height: 16px;
    max-width: 16px;
    max-height: 16px;
    vertical-align: middle;
}
```

#### iOS Optimization
```css
@supports (-webkit-touch-callout: none) {
    .form-action-buttons button svg {
        transform: scale(0.9);
    }
}
```

### 9. **Specialized Button Classes** (Lines 446-543)

#### Sensitivity Button
```css
.sensitivity-btn1 {
  padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
  cursor: pointer;
  font-weight: bold;
  border: 1px solid var(--border-color);
  border-radius: var(--neu-border-radius-sm);
  transition: all var(--model-transition-medium, 0.3s ease);
}
```

#### Action Button Variants
- `.action-button-sensitivity` - Primary color with hover darkening
- `.action-button-efficacy` - Same styling pattern
- `.action-button-factual` - Consistent with above

#### Primary Action Button
```css
.action-button.primary {
  background-color: var(--primary-color);
  color: white;
  border: 2px solid #2a70c2;
  box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.2), 
              -3px -3px 6px rgba(255, 255, 255, 0.1);
}
```

## Design System Patterns

### Color Coding System
```css
--primary-color    /* Configuration actions */
--info-color       /* Visualization tools */
--warning-color    /* CFA operations */
--success-color    /* Submit actions */
--danger-color     /* Reset/Delete operations */
```

### Shadow System
- Base: `3px 3px 6px` dark, `-3px -3px 6px` light
- Hover: `4px 4px 8px` dark, `-4px -4px 8px` light
- Focus: `0 0 0 3px` with transparency

### Spacing Constants
- Button padding: 16px vertical, 20px horizontal
- Row gaps: 8-12px typical
- Container margins: 8px standard

### Typography
- Button font: Bold weight
- Size variations: 11px-24px
- Line height: 1.2 for compact display

## Interactive Behaviors

### Hover Effects
1. Background color change
2. 2px upward translation
3. Shadow elevation increase
4. Border color darkening

### Focus Management
- Outline removal with shadow replacement
- 3px focus ring with color transparency
- Consistent across all button types

### Active States
- Transform reduction
- Shadow compression
- Background darkening

## Performance Optimizations
- Transform-based animations
- Specific transition properties
- GPU-accelerated effects
- Minimal reflow triggers

## Accessibility Features
- Minimum touch targets (150px width)
- High contrast colors
- Focus indicators
- Disabled state clarity
- No reliance on color alone

## Browser Compatibility
- Modern flexbox layouts
- CSS custom properties
- Media queries
- Feature queries (@supports)
- No vendor prefixes required