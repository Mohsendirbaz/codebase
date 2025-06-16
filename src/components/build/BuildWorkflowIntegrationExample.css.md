# Build Workflow Integration Example CSS

## Overview
Stylesheet for the BuildWorkflowIntegrationExample component, providing a complete mock file editor interface with integrated build panel styling. Demonstrates professional IDE-like appearance with syntax highlighting simulation.

## Architecture

### Layout Structure
1. **Container System**
   - Flexbox-based layout
   - Full viewport height
   - Column direction with nested flex areas

2. **Component Areas**
   - Header: Dark toolbar with actions
   - Content: Side-by-side editor and panel
   - Responsive: Stacks on mobile devices

## Core Styles

### File Editor Container
- **Display**: Flex column layout
- **Height**: 100vh for full screen
- **Background**: Light gray (#f8f9fa)
- **Font**: System font stack

### Header Section
- **Theme**: Dark (#343a40)
- **Layout**: Space-between alignment
- **Padding**: 12px 16px
- **Border**: Bottom separator

### Editor Area
- **Background**: Pure white
- **Font**: Monospace for code
- **Overflow**: Auto-scrolling
- **Border**: Right edge separator

## Special Features

### Simulated Line Numbers
```css
counter-reset: line;
padding-left: 3.5em;
```
- CSS counter system
- Absolute positioned background
- Gray numbered sidebar

### Syntax Highlighting Classes
- `.keyword`: Blue (#007bff) bold
- `.string`: Green (#28a745)
- `.comment`: Gray (#6c757d) italic
- `.function`: Orange (#fd7e14)
- `.tag`: Pink (#e83e8c)

## Button Styling

### Action Buttons
- **Base**: Dark gray (#495057)
- **Hover**: Lighter gray (#6c757d)
- **Shape**: 4px border radius
- **Spacing**: 8px gap between buttons

## Responsive Design

### Breakpoint: 768px
- **Layout Change**: Column stacking
- **Border Adjustment**: Bottom instead of right
- **Min Height**: 300px for editor

## Integration Styles

### Build Panel Override
```css
.file-editor-content .build-workflow-panel {
  height: auto;
}
```
- Removes fixed height
- Allows natural content flow
- Maintains panel flexibility

## Color Palette
- **Background**: #f8f9fa (light)
- **Editor**: #ffffff (white)
- **Header**: #343a40 (dark)
- **Borders**: #dee2e6 (gray)
- **Text**: #212529 (near black)
- **Line Numbers**: #6c757d (muted)

## Typography
- **Primary**: System font stack
- **Code**: 'Courier New', monospace
- **Font Size**: 14px for code
- **Line Height**: 1.5 for readability

## Layout Dimensions
- **Header Height**: ~49px
- **Padding**: 16px standard
- **Button Padding**: 6px 12px
- **Line Number Width**: 3em

## Transition Effects
- Button hover: 0.2s background-color
- Smooth color transitions
- No jarring visual changes