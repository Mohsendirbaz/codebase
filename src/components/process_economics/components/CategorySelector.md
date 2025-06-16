# CategorySelector.js - Category Filter Component

## Overview

`CategorySelector.js` provides an interactive category filtering interface for the Process Economics Library. It displays categories as selectable pills with dynamic coloring and supports expandable views for large category lists.

## Architecture

### Core Features
- Dynamic category pill display
- Expandable/collapsible for many categories
- Color-coded categories
- Active selection highlighting
- Clear filter option

### State Management
```javascript
const [showAllCategories, setShowAllCategories] = useState(false);
```
- Tracks whether all categories are shown or collapsed

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `categories` | Array | `[]` | List of category names to display |
| `selectedCategory` | String | - | Currently selected category |
| `onSelectCategory` | Function | - | Callback when category is selected |

## Key Features

### Dynamic Display Limit
```javascript
const maxVisibleCategories = 10;
const hasMoreCategories = categories.length > maxVisibleCategories;
```
- Shows first 10 categories by default
- Provides expand button for additional categories
- Smooth transition between states

### Color Coding
```javascript
const getCategoryColor = (category) => {
  const key = category.toLowerCase().replace(/\s+/g, '-');
  return categoryColors[key] || '#6b7280';
}
```
- Maps categories to predefined colors
- Converts category names to kebab-case for lookup
- Falls back to gray for undefined categories

### Interactive Elements

1. **Category Pills**
   - Clickable buttons for each category
   - Visual feedback on selection
   - Dynamic background color when active

2. **Show More Button**
   - Appears when categories exceed limit
   - Displays count of hidden categories
   - Animated chevron icon

3. **Clear Filter**
   - Appears when category is selected
   - Resets to 'all' categories
   - Improves user experience

## CSS Classes

### Structure Classes
- `.category-selector`: Main container
- `.category-selector-header`: Header with icon and label
- `.category-pills`: Pills container
- `.category-pill`: Individual category button

### State Classes
- `.selected`: Active category styling
- `.show-more`: Expand/collapse button
- `.rotated`: Chevron rotation state

## Visual Design

### Icon Usage
- `FunnelIcon`: Header icon indicating filtering
- `ChevronDownIcon`: Expand/collapse indicator

### Color System
- Dynamic colors from `categoryColors` data
- Selected state with background color
- Default gray for undefined categories

## Usage Example

```javascript
<CategorySelector
  categories={['Chemical', 'Energy', 'Manufacturing']}
  selectedCategory="Energy"
  onSelectCategory={(category) => handleCategoryChange(category)}
/>
```

## Responsive Behavior

- Pills wrap to multiple lines as needed
- Maintains readability on small screens
- Touch-friendly button sizes

## Best Practices

1. **Category Management**
   - Keep category names concise
   - Define colors for all expected categories
   - Consider grouping related categories

2. **Performance**
   - Limit initial display for better performance
   - Use CSS transitions for smooth animations
   - Minimize re-renders with proper state management

3. **Accessibility**
   - Clear visual selection indicators
   - Keyboard navigation support
   - Descriptive button labels

This component provides an intuitive and visually appealing way to filter library items by category, enhancing the user's ability to find relevant configurations quickly.