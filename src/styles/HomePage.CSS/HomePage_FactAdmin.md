# HomePage_FactAdmin.css Documentation

## Overview
This extensive CSS file (423 lines) implements a comprehensive fact administration interface with neumorphic design patterns. It features CRUD operations, interactive animations, state management, and responsive design for managing a fact-based content system.

## File Structure & Architecture

### 1. **Container & Layout Structure** (Lines 1-26)

#### Main Container
```css
.fact-admin-container {
  padding: var(--spacing-md);
  background-color: var(--neu-background);
  border-radius: var(--neu-border-radius-md);
  box-shadow: var(--neu-shadow-md);
  transition: var(--neu-transition-medium);
}
```
- Neumorphic design foundation
- Medium transitions for smooth interactions
- Consistent spacing using CSS variables

#### Header Layout
- `.fact-admin-header` - Flex layout with space-between alignment
- `.fact-admin-title` - Large font size with secondary color
- Bottom border for visual separation

### 2. **Summary Cards System** (Lines 27-78)

#### Card Structure
- `.facts-summary` - Flex container with gap spacing
- `.summary-card` - Individual stat cards with:
  - Neumorphic gradient backgrounds
  - Centered content alignment
  - Hover and active state transformations
  
#### Interactive States
```css
.summary-card:hover {
  box-shadow: var(--neu-shadow-lg);
}
.summary-card:active, 
.summary-card:focus-within {
  box-shadow: var(--neu-pressed-shadow);
  background: var(--neu-gradient-pressed);
}
```

### 3. **Action Buttons & Controls** (Lines 79-191)

#### Reset Button Design
- Danger color theming
- Multiple interaction states (hover, active, focus, focus-visible)
- Target pseudo-class animation:
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

#### Form Controls
- `.add-fact-form` - Flex layout with gap spacing
- Textarea with neumorphic inset shadow
- Multi-state focus management

### 4. **Fact List Interface** (Lines 192-278)

#### List Structure
- `.fact-admin-list` - Unstyled list container
- `.fact-admin-item` - Individual fact entries with:
  - Neumorphic styling
  - Hover elevation effects
  - Target highlighting animation

#### Animation System
```css
@keyframes highlight-target {
  0%, 100% { background: var(--neu-gradient-basic); }
  50% { background: var(--neu-gradient-highlight); }
}
```

#### Content Organization
- `.fact-admin-content` - Main text area
- `.fact-admin-stats` - Metadata display (agrees, pinned status)
- `.fact-admin-actions` - Button group for operations

### 5. **Button System** (Lines 279-342)

#### Base Button Styling
```css
.fact-admin-btn {
  padding: var(--model-spacing-xs) var(--model-spacing-sm);
  border: none;
  border-radius: var(--neu-border-radius-sm);
  cursor: pointer;
  transition: var(--neu-transition-fast);
  box-shadow: var(--neu-shadow-sm);
  background: var(--neu-gradient-basic);
}
```

#### Button Variants
- **Edit Button** - Secondary color theme
- **Reset Button** - Info color theme
- **Delete Button** - Danger color theme

Each variant includes:
- Base color state
- Hover color transformation
- Focus outline management
- Active pressed states

### 6. **Edit Mode Interface** (Lines 343-400)

#### Edit Form Layout
- `.fact-edit-form` - Full-width flex container
- Textarea with responsive resizing
- Dual-action button group (save/cancel)

#### Textarea Enhancements
- Border color transitions on hover
- Complex focus shadow layering
- Neumorphic inset appearance

### 7. **Empty State & Animations** (Lines 401-423)

#### No Facts Message
```css
.no-facts-message {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-secondary);
  font-style: italic;
}
```

#### Highlight Animation
- 2-second ease timing
- Gradient background transitions
- Dark theme compatibility

## Design System Integration

### Neumorphic Design Language
- Consistent use of gradient backgrounds
- Multi-layer shadow system:
  - `var(--neu-shadow-sm)` - Base elevation
  - `var(--neu-shadow-md)` - Hover state
  - `var(--neu-shadow-lg)` - Active interaction
  - `var(--neu-pressed-shadow)` - Pressed state

### Color Theming
```css
/* Color usage patterns */
--secondary-color    /* Primary actions */
--danger-color      /* Destructive actions */
--info-color        /* Informational elements */
--text-secondary    /* Muted text */
```

### Spacing System
- Extra small: `var(--spacing-xs)`
- Small: `var(--spacing-sm)` / `var(--model-spacing-sm)`
- Medium: `var(--spacing-md)` / `var(--model-spacing-md)`
- Large: `var(--spacing-lg)`
- Extra large: `var(--spacing-xl)`

### Typography Scale
- Small: `var(--model-font-size-sm)`
- Medium: `var(--model-font-size-md)`
- Large: `var(--model-font-size-lg)`
- Dynamic scaling: `calc(var(--model-font-size-lg) * 1.2)`

## Interactive State Management

### Focus Management Hierarchy
1. Basic focus - outline removal
2. Shadow-based focus indication
3. Focus-visible for keyboard navigation
4. Focus-within for container states

### Animation Timing
- Fast transitions: `var(--neu-transition-fast)`
- Medium transitions: `var(--neu-transition-medium)`
- Highlight duration: 2s ease
- Pulse duration: 1s ease-in-out

## Accessibility Features
- Comprehensive focus-visible support
- High contrast focus indicators
- Semantic color usage
- Keyboard navigation support
- ARIA-friendly structure

## Performance Optimizations
- GPU-accelerated transforms
- Transition-specific properties
- Efficient shadow rendering
- Minimal repaints via transforms

## Browser Compatibility
- Modern flexbox layouts
- CSS custom properties
- Advanced pseudo-class selectors
- No vendor prefixes required
- Progressive enhancement approach