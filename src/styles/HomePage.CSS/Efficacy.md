# Efficacy.css Documentation

## Overview
The Efficacy.css file provides styling for popup-based efficacy interface components, focusing on interactive time-based controls and user feedback elements. This CSS module creates a sophisticated popup system with sliders, timelines, and status messages.

## Architecture Summary

### Component Hierarchy
```
.popup-container
├── .popup-content
│   ├── .duration-display
│   │   └── .plant-lifetime
│   ├── .slider-container
│   │   ├── .slider-label
│   │   ├── .slider-input
│   │   └── .slider-value
│   ├── .timeline-bar
│   │   ├── .timeline-highlight
│   │   └── .timeline-marker
│   └── Status Messages
│       ├── .success-message
│       └── .error-message
├── .popup-close
└── .popup-footer
    └── .button (primary/secondary)
```

## Visual Design Patterns

### Animation System
The file implements a smooth animation system for popup interactions:

1. **Entry Animation (`popupSlideIn`)**
   - Duration: 0.3s ease-out
   - Movement: translateY(-20px) to translateY(0)
   - Opacity: 0 to 1
   - Creates a subtle slide-down effect

2. **Exit Animation (`popupSlideOut`)**
   - Duration: 0.3s ease-in
   - Movement: translateY(0) to translateY(-20px)
   - Opacity: 1 to 0
   - Reverses the entry animation for consistency

3. **Fading Effects**
   - Success messages: 0.3s opacity transition
   - Used for temporary status notifications

### Layout System

#### Popup Container
- **Positioning**: Absolute positioning for overlay behavior
- **Dimensions**: 400px width, max 90vw for responsive design
- **Styling**: White background (#ffffff), 8px rounded corners
- **Shadow**: Subtle elevation with rgba(0, 0, 0, 0.1)
- **Z-index**: 1001 for proper layering

#### Content Structure
- **Padding**: Consistent 20px for content area
- **Typography**: #333 color for primary text, #666 for secondary
- **Spacing**: Systematic margin-bottom values (20px sections, 8px elements)

### Interactive Elements

#### Slider Component
```css
/* Custom Range Input Styling */
- Track: 4px height, #e5e7eb background
- Thumb: 16px circular, primary color
- Hover effect: Scale(1.2) on thumb
- Cross-browser support (webkit/moz)
```

#### Timeline Visualization
- **Bar**: 8px height with rounded corners
- **Highlight**: Dynamic width with primary color
- **Markers**: Positioned absolutely with -25px top offset
- **Visual hierarchy**: Clear distinction between base and active states

### Color Scheme
```css
Primary Colors:
- Background: #ffffff (popup)
- Text Primary: #333
- Text Secondary: #666
- Border/Track: #e5e7eb
- Success: #10b981
- Error: #ef4444
- Dynamic: var(--primary-color)
```

### Component-Specific Styling

#### Status Messages
1. **Success Message**
   - Green background (#10b981)
   - White text for contrast
   - Padding: 10px uniform
   - Transition support for fade animations

2. **Error Message**
   - Red background (#ef4444)
   - Identical structure to success
   - No transition (persistent display)

#### Button System
- **Base Styles**: 8px vertical, 16px horizontal padding
- **States**: Disabled state with 50% opacity
- **Variants**: Primary (theme color) and Secondary (#e5e7eb)
- **Interactions**: 0.2s ease transitions for all properties

### Responsive Considerations
- Maximum width constraint (90vw) prevents overflow on mobile
- Font sizes use rem units for scalability
- Flexible spacing with margin/padding values

## CSS Variables Used
- `--primary-color`: Theme-dependent primary color for buttons and highlights

## Accessibility Features
- Clear hover states on interactive elements
- Sufficient color contrast ratios
- Disabled state visual indicators
- Focus-friendly button and input styling

## Performance Optimizations
- Hardware-accelerated transforms for animations
- Transition properties limited to specific attributes
- Efficient selector specificity