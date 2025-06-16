# HomePage2.css Documentation

## Overview
HomePage2.css provides styling for tab-based interfaces, content loading states, and layout structures for the HomePage component. This stylesheet focuses on creating a clean, responsive tab system with smooth transitions and organized content areas.

## Architecture Summary

### Component Structure
```
Main Layout
├── .react-tabs (Tab System)
│   ├── .react-tabs__tab-list
│   │   └── .react-tabs__tab
│   │       └── .react-tabs__tab--selected
│   └── Tab Content Areas
├── .content-wrapper
│   ├── .model-zone
│   │   └── .model-selection
│   └── .HomePageTabContent
├── Content States
│   ├── .plot-content
│   └── .html-content
└── Special Components
    ├── .HomePageSectionA
    ├── .logo-container
    └── .left-aligned-text
```

## Visual Design Patterns

### Tab System Design

#### Tab List Structure
```css
.react-tabs__tab-list {
    display: flex;
    gap: 10px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 10px;
}
```
- **Layout**: Horizontal flex container
- **Spacing**: 10px gap between tabs
- **Visual Separator**: Bottom border for clear delineation
- **Margin**: 20px bottom margin for content separation

#### Tab Button Styling
Individual tabs feature:
- **Padding**: 8px vertical, 16px horizontal
- **Border**: 1px solid border with 4px radius
- **Background**: Sidebar background color (theme-aware)
- **Transitions**: 0.2s ease for all properties
- **Interactive**: Cursor pointer for clickability

#### Selected State
```css
.react-tabs__tab--selected {
    background-color: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}
```
- Clear visual distinction with primary color
- White text for contrast
- Matching border color for cohesion

### Layout System

#### Content Wrapper Architecture
- **Display**: Flexbox for side-by-side layout
- **Gap**: 20px spacing between elements
- **Responsive**: Flexible width distribution

#### Model Zone Sidebar
```css
.model-zone {
    width: 300px;
    background-color: var(--sidebar-background);
    border-radius: 8px;
    padding: 20px;
}
```
- Fixed width sidebar (300px)
- Consistent theming with sidebar background
- Rounded corners for modern appearance
- Generous padding for content breathing room

#### Main Content Area
```css
.HomePageTabContent {
    flex: 1;
    background-color: var(--sidebar-background);
    border-radius: 8px;
    padding: 20px;
    overflow: auto;
    padding: 10px 5px; /* Note: Duplicate padding declaration */
}
```
- Flexible width to fill remaining space
- Scrollable overflow for long content
- Inconsistency: Duplicate padding declarations

### Content Loading States

#### Fade-In Animation System
```css
.plot-content,
.html-content {
    opacity: 0;
    transition: opacity 0.3s ease;
}

.plot-content.loaded,
.html-content.loaded {
    opacity: 1;
}
```
- Initial hidden state (opacity: 0)
- Smooth 0.3s transition
- Class-based state management
- Progressive content reveal

### Special Components

#### Logo Container Animation
```css
.logo-container {
    position: relative;
    width: 50px;
    height: 50px;
}

.logo-container img {
    position: absolute;
    opacity: 0;
    transition: opacity 0.3s ease;
}
```
- **Technique**: Layered image switching
- **Size**: Fixed 50x50px container
- **Animation**: Opacity-based transitions
- **States**: `.active` (visible) and `.fade-out` (hidden)

#### Section Styling
```css
.HomePageSectionA {
    padding: 20px;
    background-color: var(--primary-color);
}
```
- Primary color background for emphasis
- Consistent 20px padding
- Used for about/header sections

### Typography and Alignment

#### Text Alignment Helper
```css
.left-aligned-text {
    text-align: left;
    margin: 0;
    padding: 0;
}
```
- Reset margins and padding
- Force left alignment
- Utility class for text content

## CSS Variables Used
- `--border-color`: Consistent border styling
- `--sidebar-background`: Theme-aware background
- `--text-color`: Primary text color
- `--primary-color`: Accent/selection color

## Responsive Considerations
- Flexible content wrapper adapts to screen size
- Fixed sidebar width may need media query adjustments
- Tab system naturally wraps on smaller screens

## Potential Improvements
1. **Padding Conflict**: Remove duplicate padding declaration in `.HomePageTabContent`
2. **Responsive Sidebar**: Add media queries for mobile view
3. **Tab Accessibility**: Consider focus states for keyboard navigation
4. **Loading States**: Add skeleton screens or spinners

## Animation Performance
- Hardware-accelerated opacity transitions
- No layout-triggering properties in animations
- Efficient class-based state management