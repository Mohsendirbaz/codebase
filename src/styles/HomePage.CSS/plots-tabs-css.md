# plots-tabs-css.css Documentation

## Overview
The plots-tabs-css.css stylesheet implements a sophisticated tabbed plotting interface with category and group navigation, responsive grid layouts, and theme support. It's designed for displaying multiple data visualizations with smooth loading states and interactive hover effects.

## Architecture Overview

### Component Structure
```
.plots-tabs-container
├── .plots-category-tabs (Primary navigation)
│   └── .category-tab
├── .plots-group-tabs (Secondary navigation)
│   └── .group-tab
└── .plots-display-area (Content area)
    └── .plots-grid
        └── .plot-container
            ├── .plot-title
            ├── img (Plot visualization)
            └── .plot-description
```

### CSS Variable System
```css
--primary-color: var(--button-background, #3a7ca5);
--border-color: var(--border-color, #e0e0e0);
--text-color: var(--text-color, #333);
--background-color: var(--background-color, #fff);
--hover-color: var(--hover-color, #f0f0f0);
--shadow-color: var(--shadow-color, rgba(0, 0, 0, 0.1));
```
- **Theming**: Supports dynamic theme switching
- **Fallbacks**: Default values for each variable
- **Inheritance**: Can override at parent level

## Core Components

### 1. Container System
```css
.plots-tabs-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
```
- **Layout**: Full-size vertical flex container
- **Overflow**: Hidden to contain child scrolling
- **Purpose**: Main wrapper for entire plotting interface

### 2. Navigation Systems

#### Category Tabs (Primary)
```css
.plots-category-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    padding: 8px;
    background-color: var(--background-color);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 10;
}

.category-tab {
    padding: 8px 16px;
    background-color: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 4px 4px 0 0;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--text-color);
    font-weight: normal;
    position: relative;
    bottom: -1px;
}

.category-tab.active {
    background-color: var(--primary-color);
    color: white;
    border-bottom-color: var(--primary-color);
    font-weight: bold;
}
```
- **Design**: Tab metaphor with connected appearance
- **Interaction**: Smooth color transitions
- **Active State**: Primary color with white text
- **Sticky**: Remains visible during scroll

#### Group Tabs (Secondary)
```css
.plots-group-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    padding: 8px;
    background-color: var(--background-color);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 40px;
    z-index: 9;
}

.group-tab {
    padding: 6px 12px;
    background-color: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--text-color);
    font-size: 0.9em;
}
```
- **Hierarchy**: Smaller than category tabs
- **Style**: Fully rounded (pill-like)
- **Position**: Sticky below category tabs
- **Purpose**: Sub-categorization within categories

### 3. Content Display Area
```css
.plots-display-area {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    background-color: var(--background-color);
}
```
- **Scrolling**: Vertical scroll for plot grid
- **Flexibility**: Expands to fill available space
- **Padding**: Consistent spacing around content

### 4. Plot Grid System
```css
.plots-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
}
```
- **Layout**: Responsive grid with auto-fill
- **Columns**: Minimum 300px, maximum 1fr
- **Gap**: 24px for visual separation
- **Responsiveness**: Automatically adjusts columns

### 5. Plot Container Cards
```css
.plot-container {
    display: flex;
    flex-direction: column;
    background-color: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px var(--shadow-color);
    transition: transform 0.2s ease, opacity 0.5s ease;
    opacity: 0.7;
}

.plot-container.loaded {
    opacity: 1;
}

.plot-container:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 8px var(--shadow-color);
}
```
- **Design**: Card-based with rounded corners
- **States**: Loading (0.7 opacity) vs loaded (1.0)
- **Interaction**: Lift effect on hover
- **Shadow**: Subtle elevation effect

### 6. Plot Content Elements

#### Title Section
```css
.plot-title {
    padding: 12px;
    margin: 0;
    background-color: var(--background-color);
    border-bottom: 1px solid var(--border-color);
    font-size: 1rem;
    font-weight: bold;
    color: var(--text-color);
}
```

#### Description Section
```css
.plot-description {
    padding: 12px;
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-color);
    opacity: 0.9;
}
```

### 7. Loading States

#### Status Messages
```css
.plots-loading,
.plots-error,
.plots-empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: var(--text-color);
    font-style: italic;
}

.plots-error {
    color: #e74c3c;
}
```
- **Layout**: Centered flex display
- **Height**: Fixed 200px for consistency
- **Typography**: Italic for status differentiation
- **Error State**: Red color for visibility

#### Image Loading Animation
```css
.plot-container img {
    width: 100%;
    height: auto;
    transition: opacity 0.5s ease;
    opacity: 0.7;
    background: linear-gradient(110deg, 
        var(--background-color) 30%, 
        var(--hover-color) 50%, 
        var(--background-color) 70%);
    background-size: 200% 100%;
    animation: loading-shine 1.2s infinite;
}

.plot-container img.loaded {
    opacity: 1;
    background: none;
    animation: none;
}

@keyframes loading-shine {
    to {
        background-position-x: -200%;
    }
}
```
- **Effect**: Shimmer loading animation
- **Technique**: Animated gradient background
- **Transition**: Smooth opacity change on load
- **Performance**: CSS-only animation

## Theme Support

### Dark Theme
```css
.dark-theme .plots-tabs-container-1 {
    --primary-color: #4d7ea8;
    --border-color: #444;
    --text-color: #eee;
    --background-color: #222;
    --hover-color: #333;
    --shadow-color: rgba(0, 0, 0, 0.3);
}
```

### Light Theme
```css
.light-theme .plots-tabs-container-1 {
    --primary-color: #3a7ca5;
    --border-color: #ddd;
    --text-color: #333;
    --background-color: #fff;
    --hover-color: #f5f5f5;
    --shadow-color: rgba(0, 0, 0, 0.1);
}
```

### Creative Theme
```css
.creative-theme .plots-tabs-container-1 {
    --primary-color: #6a8eae;
    --border-color: #c4beb9;
    --text-color: #594a3c;
    --background-color: #f5f0e9;
    --hover-color: #ebe5dc;
    --shadow-color: rgba(89, 74, 60, 0.1);
}
```

## Responsive Design

### Mobile Breakpoint (768px)
```css
@media screen and (max-width: 768px) {
    .plots-grid {
        grid-template-columns: 1fr;
    }
    
    .category-tab, .group-tab {
        padding: 6px 10px;
        font-size: 0.9em;
    }
}
```
- **Grid**: Single column layout
- **Tabs**: Reduced padding and font size
- **Optimization**: Better mobile usability

## Visual Design Patterns

### Interactive States
1. **Hover Effects**
   - Tabs: Background color change
   - Cards: Lift with enhanced shadow
   - Smooth transitions (0.2s)

2. **Active States**
   - Bold text weight
   - Primary color background
   - White text for contrast

3. **Loading States**
   - Reduced opacity (0.7)
   - Shimmer animation
   - Gradual fade-in

### Typography Hierarchy
- **Category Tabs**: Normal weight, standard size
- **Group Tabs**: 0.9em, slightly smaller
- **Plot Titles**: Bold, 1rem
- **Descriptions**: 0.9rem, 0.9 opacity

### Spacing System
- **Container Padding**: 8px (tabs), 16px (display area)
- **Grid Gap**: 24px between plots
- **Element Padding**: 12px (consistent internal spacing)
- **Tab Gap**: 2px minimal separation

## Performance Optimizations

### Animation Performance
1. **Transform Usage**: Hardware-accelerated hover effects
2. **Opacity Transitions**: Smooth without reflow
3. **Background Animation**: CSS-only shimmer effect
4. **Limited Properties**: Only essential animations

### Layout Efficiency
1. **Sticky Positioning**: Reduces repaints
2. **Grid Auto-fill**: Dynamic without JavaScript
3. **Overflow Control**: Contained scrolling areas
4. **Z-index Management**: Logical layering

## Usage Guidelines

### Implementation
```html
<div class="plots-tabs-container">
    <div class="plots-category-tabs">
        <div class="category-tab active">Revenue</div>
        <div class="category-tab">Costs</div>
    </div>
    <div class="plots-group-tabs">
        <div class="group-tab active">Monthly</div>
        <div class="group-tab">Quarterly</div>
    </div>
    <div class="plots-display-area">
        <div class="plots-grid">
            <div class="plot-container loaded">
                <h3 class="plot-title">Revenue Trend</h3>
                <img src="plot.png" class="loaded" alt="Revenue plot">
                <p class="plot-description">Monthly revenue analysis</p>
            </div>
        </div>
    </div>
</div>
```

### JavaScript Integration
```javascript
// Handle tab switching
categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        setActiveTab(tab);
        loadPlots(tab.dataset.category);
    });
});

// Handle image loading
plotImages.forEach(img => {
    img.addEventListener('load', () => {
        img.classList.add('loaded');
        img.closest('.plot-container').classList.add('loaded');
    });
});
```

## Best Practices

### Performance
1. Lazy load plot images
2. Use loading states for better UX
3. Implement virtual scrolling for many plots
4. Cache loaded images

### Accessibility
1. Add ARIA labels to tabs
2. Implement keyboard navigation
3. Provide alt text for plot images
4. Ensure color contrast compliance

### Maintenance
1. Use CSS variables for easy theming
2. Keep consistent naming conventions
3. Document plot categories and groups
4. Test across different screen sizes

## Potential Enhancements

### Feature Suggestions
1. Plot zoom/fullscreen capability
2. Export plot functionality
3. Plot comparison mode
4. Search/filter capabilities
5. Plot metadata tooltips
6. Animated plot transitions
7. Customizable grid layouts