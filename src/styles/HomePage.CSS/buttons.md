# Buttons CSS Documentation

## Overview
`buttons.css` provides a comprehensive button styling system with semantic variants, size options, and consistent interactive states. The system uses CSS custom properties for theming and follows neumorphic design principles.

## Core Button Styles

### Base Button (`.btn`)
The foundation class for all buttons in the system.

#### Properties
- **Padding**: Uses `--btn-padding` custom property, defaults to `12px 24px`
- **Border Radius**: Uses `--btn-border-radius`, defaults to `8px`
- **Border**: None (flat design)
- **Font Weight**: Bold
- **Cursor**: Pointer
- **Transition**: All properties animate with `--transition-medium` (defaults to 0.3s ease)
- **Box Shadow**: Neumorphic shadow using `--neu-shadow-sm`
- **Background**: `--btn-bg` custom property, falls back to `--background-light`
- **Color**: `--btn-text` custom property, falls back to `--text-primary`
- **Height**: Fixed at 40px for consistency

#### Layout
- Display: `inline-flex`
- Alignment: Center (both axes)
- Gap: 8px between icon and text

## Interactive States

### Hover State
- Enhanced box shadow (`--neu-shadow-md`)
- Subtle upward movement: `translateY(-2px)`
- Creates "lifting" effect on hover

### Focus State
- Removes default outline
- Adds focus ring: `0 0 0 3px var(--focus-ring-color)`
- Ensures accessibility compliance

## Semantic Variants

### Primary Button (`.btn-primary`)
- Background: `--primary-color`
- Text: `--text-on-primary`
- Main call-to-action buttons

### Success Button (`.btn-success`)
- Background: `--success-color`
- Text: `--text-on-success`
- Confirmation and positive actions

### Danger Button (`.btn-danger`)
- Background: `--danger-color`
- Text: `--text-on-danger`
- Destructive or warning actions

### Secondary Button (`.btn-secondary`)
- Background: `--secondary-color`
- Text: `--text-on-secondary`
- Alternative or less important actions

## Size Variants

### Small Button (`.btn-sm`)
- Padding: `8px 16px`
- Height: 32px
- Font Size: 0.875rem (14px)
- Compact interface elements

### Large Button (`.btn-lg`)
- Padding: `16px 32px`
- Height: 48px
- Font Size: 1.125rem (18px)
- Prominent actions

## CSS Custom Properties Used

### Layout Properties
- `--btn-padding`: Button padding
- `--btn-border-radius`: Corner radius
- `--transition-medium`: Animation duration

### Color Properties
- `--btn-bg`: Button background color
- `--btn-text`: Button text color
- `--background-light`: Default background
- `--text-primary`: Default text color
- `--focus-ring-color`: Focus indicator color

### Semantic Colors
- `--primary-color` / `--text-on-primary`
- `--success-color` / `--text-on-success`
- `--danger-color` / `--text-on-danger`
- `--secondary-color` / `--text-on-secondary`

### Shadow Properties
- `--neu-shadow-sm`: Small neumorphic shadow
- `--neu-shadow-md`: Medium neumorphic shadow

## Usage Examples

### Basic Button
```html
<button class="btn">Default Button</button>
```

### Semantic Variants
```html
<button class="btn btn-primary">Primary Action</button>
<button class="btn btn-success">Confirm</button>
<button class="btn btn-danger">Delete</button>
<button class="btn btn-secondary">Cancel</button>
```

### Size Variants
```html
<button class="btn btn-sm">Small Button</button>
<button class="btn btn-lg">Large Button</button>
```

### Combined Classes
```html
<button class="btn btn-primary btn-lg">Large Primary Button</button>
<button class="btn btn-danger btn-sm">Small Delete Button</button>
```

### With Icons
```html
<button class="btn btn-success">
  <i class="icon-check"></i>
  Save Changes
</button>
```

## Design Principles

1. **Consistency**: Fixed heights ensure uniform appearance
2. **Flexibility**: CSS custom properties allow easy theming
3. **Accessibility**: Clear focus states for keyboard navigation
4. **Responsiveness**: Flexible padding adapts to content
5. **Modern Design**: Neumorphic shadows and smooth transitions
6. **Semantic Meaning**: Color variants convey action intent