# Light Theme Documentation

## Overview
The Light Theme provides a professional and clean design aesthetic with a nature-inspired color palette. Built around a vibrant lime-green primary color (#b6e058) and neutral gray backgrounds, this theme offers excellent readability and a fresh, modern appearance suitable for extended use during daylight hours.

## Architectural Structure

### 1. Color System Architecture

#### Base Color Palette
```css
--primary-color: #b6e058 (Vibrant Lime Green)
--secondary-color: #66bb6a (Fresh Green)
--background-color: #f5f7fa (Light Gray-Blue)
--text-color: #333333 (Dark Charcoal)
```

The light theme employs a nature-inspired color scheme with energetic greens against neutral backgrounds, creating a fresh and professional appearance.

#### Color Philosophy
1. **Primary Accent**: #b6e058 - Energetic lime green for key actions
2. **Secondary Support**: #66bb6a - Softer green for secondary elements
3. **Neutral Base**: #f5f7fa - Soft gray-blue background
4. **High Contrast Text**: #333333 - Near-black for optimal readability

#### Semantic Color System
- **Success**: #28a745 (Consistent green indicator)
- **Danger**: #dc3545 (High-visibility red)
- **Warning**: #ffc107 (Bright amber)
- **Info**: #17a2b8 (Informative cyan)
- **Light**: #f8f9fa (Near-white surfaces)
- **Dark**: #343a40 (Dark gray accents)

### 2. Neumorphic Light Design System

The neumorphic implementation creates soft, tactile interfaces with subtle depth:

#### Shadow Architecture
```css
--neu-light-shadow: rgba(255, 255, 255, 0.8) /* Soft highlight */
--neu-dark-shadow: rgba(166, 180, 200, 0.7) /* Blue-gray shadow */
```

#### Light Neumorphic Properties
- Shadows use cool gray tones for natural depth
- Light shadows create subtle highlights
- Pressed states show realistic depth inversion
- Maintains clarity without harsh contrasts

#### Shadow Hierarchy
1. **Flat**: No elevation for disabled/inactive states
2. **Small** (3px): Subtle elevation for interactive elements
3. **Medium** (5px): Standard card and panel elevation
4. **Large** (8px): Prominent modals and overlays
5. **Pressed**: Inset shadows for active states

#### Gradient System
```css
--neu-gradient-basic: linear-gradient(145deg, #ffffff, #e6e6e6)
--neu-gradient-pressed: linear-gradient(145deg, #e6e6e6, #ffffff)
--neu-gradient-highlight: linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3))
```

### 3. Spacing & Layout System

#### Calculated Spacing Scale
```css
--spacing-unit: 1rem (Base unit)
--spacing-xs: 0.25rem (4px)
--spacing-sm: 0.5rem (8px)
--spacing-md: 1rem (16px)
--spacing-lg: 1.5rem (24px)
--spacing-xl: 2rem (32px)
```

#### Model-Specific Spacing
Dedicated spacing for component models:
- `--model-spacing-xs`: 4px (tight spacing)
- `--model-spacing-sm`: 8px (compact layouts)
- `--model-spacing-md`: 16px (standard spacing)
- `--model-spacing-lg`: 24px (generous spacing)

### 4. Typography System

#### Font Size Scale
```css
--model-font-size-sm: 14px (Secondary text, captions)
--model-font-size-md: 16px (Body text standard)
--model-font-size-lg: 18px (Headings, emphasis)
```

#### Text Color Hierarchy
1. **Primary Text**: #333333 - Maximum readability
2. **Secondary Text**: #6c757d - De-emphasized content
3. **Light Surfaces**: #212529 - Text on light backgrounds
4. **Interactive Text**: Inherits from primary color

### 5. Component Styling System

#### Surface Colors
```css
--sidebar-background: #ffffff (Pure white sidebars)
--card-background: #ffffff (Clean card surfaces)
--input-background: #ffffff (Form field backgrounds)
```

#### Border System
```css
--border-color: #e0e0e0 (Subtle gray borders)
--input-border: #ced4da (Form field borders)
--model-color-border: #dee2e6 (Component borders)
```

#### Border Radius Scale
Two radius systems for different use cases:

**Neumorphic Radii** (Softer corners):
- Small: 8px
- Medium: 10px
- Large: 15px

**Standard Radii** (Sharper definition):
- Small: 4px
- Medium: 8px
- Large: 12px

### 6. Interactive States & Animations

#### Transition Timing
```css
--neu-transition-fast: 0.2s all ease
--neu-transition-medium: 0.3s all ease
--neu-transition-slow: 0.5s all ease
--model-transition-fast: 0.15s ease
--model-transition-medium: 0.3s ease
```

#### Animation Curves
```css
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.83, 0, 0.17, 1)
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)
```

### 7. Spatial Transform System

Advanced 3D capabilities for dynamic interfaces:

```css
--spatial-perspective: 1000px
--spatial-transition-timing: cubic-bezier(0.42, 0, 0.05, 0.99)
--spatial-container-width: 24rem
--spatial-container-height: 16rem
```

### 8. Specialized Components

#### Year Column Styling
```css
--accent-color: #63733f (Olive Green)
--accent-hover-color: #556331 (Darker Olive)
```
The olive green provides an earthy contrast to the lime primary color.

#### Floating Sticker Header
```css
--sticker-float-duration: 5s
--sticker-rotate-degree: 3deg
--sticker-float-distance: -20px
```

### 9. Dark Mode Override Support

The theme includes dark mode media query overrides:

```css
@media (prefers-color-scheme: dark) {
  /* Automatic dark mode adaptation */
  --app-background: #0f172a
  --sidebar-background: #1e293b
  --text-color: #f1f5f9
}
```

This ensures the theme respects system-level dark mode preferences while maintaining the light theme as the primary design.

### 10. Responsive Design System

#### Breakpoint Scale
```css
--breakpoint-sm: 640px (Mobile landscape)
--breakpoint-md: 768px (Tablet portrait)
--breakpoint-lg: 1024px (Desktop)
--breakpoint-xl: 1280px (Large screens)
--breakpoint-2xl: 1536px (Ultra-wide)
```

## Visual Design Patterns

### Light UI Principles
1. **Clarity Through Contrast**: Dark text on light backgrounds
2. **Subtle Depth**: Neumorphic shadows create gentle elevation
3. **Color Restraint**: Vibrant colors used sparingly for emphasis
4. **White Space**: Generous spacing for visual breathing room

### Color Psychology
- **Lime Green Primary**: Energy, growth, innovation
- **Olive Accents**: Stability, nature, harmony
- **Neutral Grays**: Professional, unobtrusive, calming
- **Pure White**: Cleanliness, simplicity, openness

### Surface Hierarchy
1. **Background**: #f5f7fa (Subtle base layer)
2. **Content Surface**: #ffffff (Primary content areas)
3. **Elevated Elements**: Shadow-based elevation
4. **Interactive Surfaces**: Hover state color shifts

## Implementation Guidelines

### Using the Light Theme
1. Apply `.light-theme` class to root element
2. Ensure proper contrast ratios (4.5:1 minimum)
3. Use shadows to indicate elevation hierarchy
4. Implement smooth state transitions

### Best Practices
- Maintain consistent use of the spacing scale
- Apply semantic colors for user feedback
- Use neumorphic effects sparingly for key elements
- Ensure interactive elements have clear hover states

### Accessibility Considerations
- Text contrast exceeds WCAG AA standards
- Focus indicators are clearly visible
- Color is supplemented with other indicators
- Interactive elements have adequate touch targets

### Performance Optimizations
- CSS variables enable efficient theming
- Shadows use GPU-accelerated rendering
- Transitions are optimized for 60fps
- Minimal repaints through transform usage