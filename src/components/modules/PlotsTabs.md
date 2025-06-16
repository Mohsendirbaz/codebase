# PlotsTabs Component Documentation

## Overview
The `PlotsTabs` component is a sophisticated plot visualization system that displays categorized and grouped plots from the backend API. It supports both regular plots and sensitivity analysis plots, with dynamic loading, categorization, and interactive tab navigation.

## Component Architecture

### Core Features
1. **Dynamic Plot Loading**: Fetches plots from backend based on version
2. **Category/Group Organization**: Two-level hierarchical navigation
3. **Sensitivity Mode Support**: Special handling for sensitivity plots
4. **Image Transformation**: Automatic path normalization and URL construction
5. **Lazy Loading**: Progressive image loading with visual feedback
6. **Error Handling**: Comprehensive error states and messages

### Props Interface
```javascript
{
  version: string,        // Batch version identifier
  sensitivity: boolean    // Toggle between regular/sensitivity plots (default: false)
}
```

## State Management

### Component State
```javascript
const [plotCategories, setPlotCategories] = useState([]);     // Top-level categories
const [selectedCategory, setSelectedCategory] = useState(null); // Active category
const [plotGroups, setPlotGroups] = useState({});            // Groups per category
const [selectedGroup, setSelectedGroup] = useState(null);      // Active group
const [plots, setPlots] = useState([]);                       // Current plot data
const [loading, setLoading] = useState(true);                 // Loading state
const [error, setError] = useState(null);                     // Error messages
const [imagesLoaded, setImagesLoaded] = useState({});        // Image load tracking
```

## API Integration

### Endpoint Selection
The component dynamically selects the appropriate API endpoint:

```javascript
const endpoint = sensitivity 
  ? `http://localhost:5008/api/sensitivity-plots/${version}`
  : `http://localhost:5008/api/plots/${version}`;
```

### Data Organization
Plots are organized into a two-level hierarchy:

```javascript
// Level 1: Categories
const categories = [...new Set(data.map(plot => plot.category))];

// Level 2: Groups within categories
const groupsByCategory = {};
categories.forEach(category => {
  const categoryPlots = data.filter(plot => plot.category === category);
  const groups = [...new Set(categoryPlots.map(plot => plot.group))];
  groupsByCategory[category] = groups;
});
```

## Plot Data Structure

### Expected Plot Object
```javascript
{
  category: string,     // Top-level category
  group: string,        // Sub-group within category
  path: string,         // File path to plot image
  title: string,        // Display title (optional)
  description: string   // Plot description (optional)
}
```

## Path Transformation

### URL Construction
The component transforms file paths to proper URLs:

```javascript
transformPath = (path) => {
  // Normalize backslashes to forward slashes
  const normalizedPath = path.replace(/\\/g, '/');
  
  // Extract batch version
  const batchMatch = normalizedPath.match(/Batch\((\d+)\)/);
  if (!batchMatch) return normalizedPath;
  
  const batchVersion = batchMatch[1];
  
  // Construct URL
  return `http://localhost:5008/images/Batch(${batchVersion})/Results(${batchVersion})/${normalizedPath.split('Results(')[1]}`;
};
```

## Navigation System

### Two-Level Tab Navigation
1. **Category Tabs**: Primary navigation level
2. **Group Tabs**: Secondary navigation within selected category

### Navigation Handlers
```javascript
handleCategoryChange = (category) => {
  setSelectedCategory(category);
  
  // Auto-select first group in new category
  if (plotGroups[category] && plotGroups[category].length > 0) {
    setSelectedGroup(plotGroups[category][0]);
  } else {
    setSelectedGroup(null);
    setPlots([]);
  }
};

handleGroupChange = (group) => {
  setSelectedGroup(group);
};
```

## Data Fetching

### Initial Load
Fetches all plots and organizes them:

```javascript
useEffect(() => {
  const fetchPlots = async () => {
    // Skip if no version
    if (!version) return;
    
    // Fetch data
    // Organize by category/group
    // Set initial selections
    // Handle errors
  };
  
  fetchPlots();
}, [version, sensitivity]);
```

### Group-Specific Fetch
Loads plots when group selection changes:

```javascript
useEffect(() => {
  if (selectedCategory && selectedGroup) {
    const fetchPlotsByGroup = async () => {
      const endpoint = sensitivity 
        ? `http://localhost:5008/api/sensitivity-plots/${version}/${selectedCategory}/${selectedGroup}`
        : `http://localhost:5008/api/plots/${version}/${selectedCategory}/${selectedGroup}`;
      
      // Fetch and update plots
    };
    
    fetchPlotsByGroup();
  }
}, [selectedCategory, selectedGroup, version, sensitivity]);
```

## Component Structure

### DOM Hierarchy
```html
<div className="plots-tabs-container">
  <!-- Category tabs -->
  <div className="plots-category-tabs">
    <button className="category-tab">...</button>
  </div>
  
  <!-- Group tabs -->
  <div className="plots-group-tabs">
    <button className="group-tab">...</button>
  </div>
  
  <!-- Plot display area -->
  <div className="plots-display-area">
    <div className="plots-grid">
      <div className="plot-container">
        <h3 className="plot-title">...</h3>
        <CustomizableImage />
        <p className="plot-description">...</p>
      </div>
    </div>
  </div>
</div>
```

## Image Loading

### Progressive Loading
Tracks individual image load states:

```javascript
const handleImageLoad = (index) => {
  setImagesLoaded(prev => ({ ...prev, [index]: true }));
};
```

### Visual Feedback
```javascript
<div className={`plot-container ${imagesLoaded[index] ? 'loaded' : ''}`}>
  <CustomizableImage
    onLoad={() => handleImageLoad(index)}
    className={imagesLoaded[index] ? 'loaded' : ''}
  />
</div>
```

## Error Handling

### Error States
1. **No Version**: Skips API call during refresh
2. **API Errors**: Displays error message
3. **Empty Data**: Shows "No plots available"
4. **Network Errors**: Catches and displays fetch errors

### Error Display
```javascript
{loading ? (
  <div className="plots-loading">Loading plots...</div>
) : error ? (
  <div className="plots-error">{error}</div>
) : plots.length === 0 ? (
  <div className="plots-empty">No plots available for this selection</div>
) : (
  // Display plots
)}
```

## CSS Classes

### Container Classes
- `.plots-tabs-container`: Main wrapper
- `.plots-category-tabs`: Category tab container
- `.plots-group-tabs`: Group tab container
- `.plots-display-area`: Plot display region

### Navigation Classes
- `.category-tab`: Category button
- `.group-tab`: Group button
- `.active`: Active tab state

### Display Classes
- `.plots-grid`: Grid layout for plots
- `.plot-container`: Individual plot wrapper
- `.plot-title`: Plot title text
- `.plot-description`: Plot description text
- `.loaded`: Loaded image state

### State Classes
- `.plots-loading`: Loading message
- `.plots-error`: Error message
- `.plots-empty`: Empty state message

## Usage Examples

### Basic Usage
```javascript
import PlotsTabs from './components/modules/PlotsTabs';

function Dashboard() {
  return <PlotsTabs version="12345" />;
}
```

### Sensitivity Mode
```javascript
<PlotsTabs 
  version="12345" 
  sensitivity={true} 
/>
```

### In Results Tab
```javascript
{activeTab === 'Results' && (
  <PlotsTabs 
    version={currentVersion} 
    sensitivity={false}
  />
)}
```

## Performance Optimizations

### Conditional Fetching
- Skips API calls when version is empty
- Prevents unnecessary re-fetches
- Caches data within component lifecycle

### Image Optimization
- Uses CustomizableImage for enhanced loading
- Progressive loading with visual feedback
- Lazy loading support

## Integration with CustomizableImage

The component leverages CustomizableImage for enhanced image display:

```javascript
<CustomizableImage
  src={transformPath(plot.path)}
  alt={plot.title || `Plot ${index + 1}`}
  width="100%"
  height="auto"
  onLoad={() => handleImageLoad(index)}
  className={imagesLoaded[index] ? 'loaded' : ''}
/>
```

## API Response Format

### Expected Response Structure
```javascript
// Regular plots
[
  {
    category: "Financial Analysis",
    group: "Revenue Projections",
    path: "path/to/plot.png",
    title: "Monthly Revenue",
    description: "Revenue trends over time"
  },
  // ... more plots
]

// Sensitivity plots
[
  {
    category: "Sensitivity Analysis",
    group: "Parameter S10",
    path: "path/to/sensitivity_plot.png",
    title: "S10 Sensitivity",
    description: "Impact of parameter S10"
  },
  // ... more plots
]
```

## Future Enhancement Possibilities

1. **Plot Filtering**: Search and filter within categories
2. **Zoom Functionality**: Click to enlarge plots
3. **Export Options**: Download individual or bulk plots
4. **Comparison View**: Side-by-side plot comparison
5. **Annotations**: Add notes to plots
6. **Real-time Updates**: WebSocket for live plot updates
7. **Plot Metadata**: Display additional plot information
8. **Thumbnail View**: Compact grid with previews
9. **Slideshow Mode**: Automatic plot rotation
10. **Custom Ordering**: Drag-and-drop plot arrangement