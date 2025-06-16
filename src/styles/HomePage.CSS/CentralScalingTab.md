# CentralScalingTab.css Documentation

## Overview
This stylesheet implements a sophisticated tabbed interface for the Central Scaling feature, utilizing CSS custom properties (variables) for theming and providing smooth animations and responsive behavior.

## CSS Variables Used
The component relies heavily on CSS custom properties for consistent theming:
- `--app-background`: Main application background
- `--primary-color`: Primary brand color
- `--card-background`: Card/panel backgrounds
- `--sidebar-background`: Secondary backgrounds
- `--border-color`: Standard borders
- `--text-color`: Primary text
- `--text-secondary`: Secondary text
- `--model-color-background-hover`: Hover states
- `--spacing-*`: Spacing scale (xs, sm, md, lg, xl)

## Core Components

### 1. Main Container
```css
.central-scaling-container
```
- **Layout**: Full-width container with rounded corners
- **Styling**:
  - Background: Application background color
  - Border radius: Extra large (var(--spacing-xl))
  - Shadow: Subtle elevation (0 4px 6px)
  - Padding: Large spacing for content breathing room
- **Purpose**: Primary wrapper for entire scaling interface

### 2. Header Elements

#### Title
```css
.central-scaling-title
```
- **Typography**: 1.5rem, 600 weight
- **Color**: Primary brand color
- **Spacing**: Small bottom margin
- **Role**: Main section identifier

#### Description
```css
.central-scaling-description
```
- **Typography**: 0.95rem for secondary information
- **Color**: Primary color (maintains brand consistency)
- **Spacing**: Large bottom margin
- **Purpose**: Contextual information for users

### 3. Tab System

#### Tab List Container
```css
.central-scaling-tab-list
```
- **Layout**: Flexbox with gap spacing
- **Features**:
  - Horizontal scrolling with hidden scrollbar
  - Background with card/sidebar color fallback
  - Border for definition
  - Rounded corners for pill-like appearance
- **Overflow**: Custom scrollbar hiding for all browsers

#### Individual Tabs
```css
.central-scaling-tab
```
- **Design**:
  - Flexible sizing with equal distribution
  - Centered content with icon support
  - Smooth transitions (0.3s)
  - Transparent border for hover effect
- **States**:
  - Default: App background, secondary text
  - Hover: Model hover background, primary text
  - Active: Same as hover
  - Selected: Primary color background, white text

#### Tab Icons
```css
.central-scaling-tab-icon
```
- **Dimensions**: 18x18px
- **Purpose**: Visual indicators for tab types

### 4. Content Panels

#### Panel Container
```css
.central-scaling-panels
```
- **Styling**: Consistent with app background
- **Border radius: Extra large for visual continuity
- **Padding**: Medium for content spacing

#### Individual Panel
```css
.central-scaling-panel
```
- **Animation**: fadeIn effect (0.3s ease-out)
- **Purpose**: Smooth content transitions

### 5. Scaling Type Information

#### Description Container
```css
.scaling-type-description
```
- **Layout**: Flexbox with icon and text
- **Background**: Sidebar background for contrast
- **Spacing**: Medium gap and padding
- **Visual**: Rounded corners for modern look

#### Type Icon
```css
.scaling-type-icon
```
- **Size**: 24x24px
- **Color**: Primary brand color
- **Purpose**: Visual category identification

#### Typography
```css
.scaling-type-description h3
.scaling-type-description p
```
- **Heading**: 1.1rem, 600 weight, primary text
- **Paragraph**: 0.9rem, secondary text
- **Spacing**: Minimal margins for tight layout

### 6. Animations

#### Fade In Animation
```css
@keyframes fadeIn
```
- **Effect**: Opacity fade with slight upward movement
- **Duration**: Integrated with panel transitions
- **Transform**: 10px translateY for subtle entrance

### 7. Enhanced Tooltip System
```css
.scaling-tab-tooltip
```
- **Positioning**: Absolute, centered above tab
- **Styling**:
  - Sidebar background with primary text
  - Rounded corners with shadow
  - Small font size (0.8rem)
- **Behavior**:
  - Hidden by default
  - Appears on tab hover
  - Non-interactive (pointer-events: none)

## Responsive Design

### Mobile Breakpoint (≤768px)
```css
@media (max-width: 768px)
```
- **Tab Adjustments**:
  - Reduced padding for space efficiency
  - Tab list allows wrapping for vertical stacking
- **Goal**: Maintain functionality on smaller screens

## Visual Design System

### Spacing Scale
- Extra Small (xs): Used for minimal gaps
- Small (sm): Tab icons, minor spacing
- Medium (md): General spacing, gaps
- Large (lg): Major padding, section spacing
- Extra Large (xl): Border radius, major margins

### Shadow System
- Subtle elevation: `0 4px 6px rgba(0, 0, 0, 0.05)`
- Tab selection: `0 2px 4px rgba(0, 0, 0, 0.1)`
- Tooltip: `0 2px 8px rgba(0, 0, 0, 0.15)`

### Transition Timing
- Standard: 0.3s ease (tabs, panels)
- Quick: 0.2s ease (tooltips)
- Consistent timing creates cohesive feel

## Usage Context
This stylesheet supports:
- Multi-tab scaling interfaces
- Icon-based navigation
- Smooth content transitions
- Responsive tab systems
- Tooltip enhancements

## Best Practices
1. Use CSS variables for consistent theming
2. Maintain the established spacing scale
3. Keep animations subtle and functional
4. Ensure responsive behavior on all devices
5. Use semantic class names for maintainability

## Performance Optimization
- GPU-accelerated transforms for animations
- Efficient selectors without deep nesting
- Transition only necessary properties
- Hidden scrollbars don't impact performance

## Accessibility Considerations
- Clear visual states for tabs
- Sufficient color contrast
- Focus states inherited from button elements
- Tooltips provide additional context
- Responsive design ensures mobile usability