# CapacityMapPanel.css Documentation

## Overview
This stylesheet provides styling for the CapacityMapPanel component, which visualizes capacity usage across different levels (global, category, and local) with progress indicators and configuration controls.

## Component Structure
The styles integrate with Ant Design (antd) components while providing custom styling for capacity visualization sections.

## Core Sections

### 1. Global Usage Section
```css
.global-usage-section
```
- **Purpose**: Primary container for global capacity metrics
- **Styling**:
  - Padding: 16px for comfortable spacing
  - Background: Light gray (#f8f9fa) for visual distinction
  - Border radius: 8px for modern appearance
  - Bottom margin: 16px for section separation
- **Visual Hierarchy**: Elevated importance through background color

### 2. Sub-sections Layout
```css
.category-usage-section,
.local-usage-section,
.capacity-config-section
```
- **Layout**: Consistent vertical padding (8px)
- **Purpose**: Standardized spacing for different capacity levels
- **Design Pattern**: Minimal styling to let content drive visual weight

### 3. Ant Design Component Customizations

#### Progress Text Enhancement
```css
.ant-progress-text
```
- **Typography**: Bold font weight
- **Purpose**: Emphasizes percentage values in progress bars
- **Impact**: Improves readability of capacity metrics

#### Card Sizing
```css
.ant-card-small .ant-card-body
```
- **Spacing**: Reduced padding (12px) for compact cards
- **Use Case**: Space-efficient display of multiple capacity cards
- **Trade-off**: Balances information density with readability

#### Slider Labels
```css
.ant-slider-mark-text
```
- **Font Size**: 12px for secondary information
- **Purpose**: Provides scale markers without overwhelming the interface
- **Context**: Used in capacity threshold configuration

#### Alert Styling
```css
.ant-alert-info .ant-alert-message
```
- **Color**: Ant Design primary blue (#1890ff)
- **Font Weight**: Bold for emphasis
- **Purpose**: Highlights important capacity-related notifications

## Design Philosophy

### Visual Hierarchy
1. **Global usage**: Prominent background and spacing
2. **Sub-sections**: Minimal styling for flexibility
3. **Interactive elements**: Enhanced through Ant Design overrides

### Color Scheme
- **Background**: #f8f9fa (subtle gray)
- **Primary Action**: #1890ff (Ant Design blue)
- **Text**: Inherited for consistency

### Spacing System
- **Large**: 16px (section padding, margins)
- **Medium**: 12px (card padding)
- **Small**: 8px (sub-section padding)

## Integration Points

### Ant Design Components
The stylesheet works with:
- `Progress`: Capacity visualization bars
- `Card`: Information containers
- `Slider`: Threshold configuration
- `Alert`: Status notifications

### Component Dependencies
- Expects Ant Design CSS to be loaded
- Designed for CapacityMapPanel.js component
- Works with capacity tracking services

## Responsive Behavior
While no explicit media queries are defined:
- Uses relative units for flexibility
- Ant Design components handle basic responsiveness
- Layout adapts through parent containers

## Usage Guidelines

### Implementation
```jsx
<div className="global-usage-section">
  <Progress percent={75} />
</div>

<div className="category-usage-section">
  <Card size="small">
    {/* Category capacity content */}
  </Card>
</div>
```

### Best Practices
1. Use `.global-usage-section` for primary metrics
2. Apply sub-section classes for consistent spacing
3. Leverage Ant Design components with custom overrides
4. Maintain the established spacing system

## Performance Considerations
- Minimal custom styles reduce CSS overhead
- Leverages Ant Design's optimized components
- No complex selectors or calculations
- Simple class-based styling for fast rendering

## Accessibility Notes
- Bold text improves readability for progress values
- Sufficient color contrast maintained
- Relies on Ant Design's accessibility features
- Clear visual hierarchy aids navigation

## Future Considerations
- Could add dark theme support
- Might benefit from CSS custom properties
- Consider animation for progress updates
- Potential for more granular responsive breakpoints