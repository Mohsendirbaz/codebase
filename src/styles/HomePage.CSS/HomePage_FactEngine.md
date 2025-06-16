# HomePage_FactEngine.css Documentation

## Overview
This CSS file implements a sophisticated floating fact engine interface with neumorphic design, collapsible functionality, and rich interactive features. The component appears as a fixed-position panel that manages fact display, pinning, and user interactions.

## File Structure & Architecture

### 1. **Container Positioning & Layout** (Lines 1-14)

#### Fixed Positioning Strategy
```css
.fact-engine-container {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 350px;
  z-index: 100;
  max-height: 500px;
  overflow-y: auto;
}
```

**Key Design Decisions:**
- Absolute positioning for overlay behavior
- Fixed 350px width for consistent display
- High z-index (100) for layer management
- Scrollable content with 500px max height
- Neumorphic shadow for depth perception

### 2. **Collapsible Header System** (Lines 15-55)

#### Header Structure
```css
.fact-engine-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--secondary-color);
  color: white;
  cursor: pointer;
}
```

#### Interactive States
- Base state: Secondary color background
- Hover state: Success color transformation
- Active state: Light success with dark text

#### Toggle Animation
```css
.fact-engine-toggle {
  transition: transform var(--neu-transition-medium);
}
.fact-engine-toggle.collapsed {
  transform: rotate(180deg);
}
```

### 3. **Body Content Management** (Lines 56-65)

#### Collapse Animation
```css
.fact-engine-body.collapsed {
  max-height: 0;
  padding: 0 var(--spacing-md);
  overflow: hidden;
}
```
- Smooth height transition
- Maintained horizontal padding
- Hidden overflow for clean collapse

### 4. **Fact Card System** (Lines 66-108)

#### Card Design
```css
.fact-card {
  background: var(--neu-gradient-basic);
  border-radius: var(--neu-border-radius-md);
  border-left: 4px solid var(--secondary-color);
  box-shadow: var(--neu-shadow-sm);
}
```

#### State Variations
- **Pinned State**: Info color border, highlight gradient
- **Hover State**: Elevated shadow
- **Focus State**: Outline with offset
- **Target State**: Animated border highlight

#### Target Animation
```css
@keyframes card-target-highlight {
  0%, 100% { border-left-color: var(--secondary-color); }
  50% { 
    border-left-color: var(--info-color); 
    border-left-width: 6px; 
  }
}
```

### 5. **Content Typography** (Lines 109-126)

#### Text Styling
- `.fact-text` - Small font size with 1.4 line height
- `.fact-footer` - Flex layout for metadata
- `.agree-count` - Icon + text combination

### 6. **Interactive Button System** (Lines 127-199)

#### Base Button Design
```css
.fact-btn {
  font-size: var(--model-font-size-sm);
  padding: var(--model-spacing-xs) var(--model-spacing-sm);
  display: flex;
  align-items: center;
  transition: var(--neu-transition-fast);
  background: var(--neu-gradient-basic);
  box-shadow: var(--neu-shadow-sm);
}
```

#### Button Animation
```css
@keyframes btn-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

#### Button Variants
1. **Agree Button** - Secondary/success color scheme
2. **Pin Button** - Info/primary color scheme
3. **Unpin Button** - Muted secondary colors

### 7. **Generate Button** (Lines 200-237)

#### Full-Width Action Button
```css
.generate-btn {
  width: 100%;
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm);
  font-weight: 600;
}
```
- Prominent positioning with top margin
- Bold text for emphasis
- Full interaction state suite

### 8. **Pinned Facts Section** (Lines 238-250)

#### Section Design
- Top border separator
- Dedicated header styling
- Small font with bold weight
- Secondary color theming

### 9. **Entry Animation** (Lines 252-268)

#### Fade-In Effect
```css
@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(-10px); 
    box-shadow: var(--neu-flat-shadow);
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
    box-shadow: var(--neu-shadow-sm);
  }
}
```
- Combines opacity, transform, and shadow
- 0.5s ease timing for smooth entry
- Applied via `.new-fact` class

### 10. **Responsive Design** (Lines 270-278)

#### Mobile Adaptation (≤768px)
```css
@media (max-width: 768px) {
  .fact-engine-container {
    width: calc(100% - var(--spacing-xl));
    right: var(--spacing-md);
    top: 70px;
  }
}
```
- Full width minus padding
- Adjusted top position for mobile headers
- Maintained right-side positioning

## Design System Integration

### Neumorphic Design Elements
- Gradient backgrounds for depth
- Multi-level shadow system
- Pressed state interactions
- Smooth transitions throughout

### Color System Usage
```css
--secondary-color     /* Primary brand color */
--info-color         /* Informational accents */
--text-color         /* Main text */
--text-secondary     /* Muted text */
--neu-background     /* Base backgrounds */
```

### Spacing Consistency
- Small: `var(--spacing-sm)`
- Medium: `var(--spacing-md)`
- Large: `var(--spacing-xl)`
- Component: `var(--model-spacing-xs/sm)`

### Border & Radius System
- Medium radius: `var(--neu-border-radius-md)`
- Large radius: `var(--neu-border-radius-lg)`
- Small radius: `var(--neu-border-radius-sm)`
- Accent borders: 4px solid left border

## Interactive Features

### State Management
1. **Collapsed/Expanded** - Header click toggle
2. **Pinned/Unpinned** - Fact state persistence
3. **Hover/Active** - Visual feedback
4. **Focus Management** - Keyboard accessibility

### Animation Library
- Rotation: 180° toggle animation
- Scale: 1.1x pulse effect
- Fade: Opacity + transform combination
- Highlight: Border color/width animation

## Performance Considerations
- GPU-accelerated transforms
- Efficient transition properties
- Minimal reflow triggers
- Optimized shadow rendering

## Accessibility Features
- Focus-visible support
- Keyboard navigation ready
- High contrast focus indicators
- Semantic color usage
- Screen reader friendly structure

## Browser Support
- Modern flexbox layouts
- CSS custom properties
- Advanced animations
- Media queries
- No vendor prefixes needed