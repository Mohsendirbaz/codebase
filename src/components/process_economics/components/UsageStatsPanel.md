# UsageStatsPanel Component

## Overview
The `UsageStatsPanel` component displays detailed usage statistics for an individual item. It provides a comprehensive breakdown of usage metrics, timeline information, recent users, and placeholder for usage trends visualization.

## Component Architecture

### Props Interface
```javascript
{
  itemId: string,           // Unique identifier for the item
  initialStats: Object      // Optional pre-loaded statistics
}
```

### State Management
```javascript
const [stats, setStats] = useState(initialStats || { total: 0 });
const [isLoading, setIsLoading] = useState(false);
const [timeframe, setTimeframe] = useState('allTime');
```

## Core Features

### 1. Usage Metrics Display
Four key metrics presented in card format:
- **Total Uses**: Aggregate of all usage types
- **Imports**: Number of times imported
- **Views**: Number of times viewed
- **Shares**: Number of times shared

### 2. Timeline Information
Three critical dates tracked:
- **Created**: When the item was first created
- **Last Used**: Most recent usage with relative time
- **Most Active**: Date with highest usage activity

### 3. Recent Users Section
Displays users who recently interacted with the item:
- User avatar with initial
- User name (or "Anonymous User")
- Relative time of last use

## Data Structure

### Stats Object Schema
```javascript
{
  total: number,              // Total usage count
  importCount: number,        // Number of imports
  viewCount: number,          // Number of views
  shareCount: number,         // Number of shares
  dateCreated: timestamp,     // Creation timestamp
  lastUsed: timestamp,        // Last usage timestamp
  mostActiveDate: timestamp,  // Peak usage date
  recentUsers: Array<{
    name: string,
    lastUsed: timestamp
  }>
}
```

## Data Loading Pattern

### Conditional Loading
Only fetches detailed stats if not provided initially:
```javascript
useEffect(() => {
  if (!initialStats || !initialStats.detailed) {
    setIsLoading(true);
    
    usageTracker.getItemUsageStats(itemId)
      .then(detailedStats => {
        setStats(detailedStats || { total: 0 });
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching usage stats:', error);
        setIsLoading(false);
      });
  }
}, [itemId, initialStats]);
```

## Time Formatting

### Timestamp Handling
Supports both Firestore and standard timestamps:
```javascript
const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
```

### Relative Time Display
Uses Intl.RelativeTimeFormat for human-readable times:
```javascript
const getRelativeTime = (timestamp) => {
  // ... 
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays > -30) return rtf.format(diffInDays, 'day');
  
  const diffInMonths = Math.round(diffInDays / 30);
  return rtf.format(diffInMonths, 'month');
};
```

## Component Structure

```
UsageStatsPanel
├── Summary Cards Section
│   ├── Total Uses Card
│   ├── Imports Card
│   ├── Views Card
│   └── Shares Card
├── Details Section
│   ├── Timeline
│   │   ├── Created Date
│   │   ├── Last Used Date
│   │   └── Most Active Date
│   └── Recent Users
│       └── User List
│           ├── Avatar
│           ├── Name
│           └── Last Used
└── Usage Trends
    └── Chart Placeholder
```

## Visual Design

### Card Layout
Each metric card contains:
```jsx
<div className="usage-card {type}">
  <div className="usage-card-content">
    <div className="usage-card-icon">
      <Icon />
    </div>
    <div className="usage-card-data">
      <div className="usage-card-value">{value}</div>
      <div className="usage-card-label">{label}</div>
    </div>
  </div>
</div>
```

### Icon Mapping
- Total Uses: ChartBarIcon
- Imports: DownloadIcon
- Views: EyeIcon
- Shares: ShareIcon
- Timeline: CalendarIcon
- Recent Users: UsersIcon

## CSS Architecture

### Component Classes
```css
.usage-stats-panel         // Root container
.usage-summary-cards       // Cards container
.usage-card               // Individual metric card
.usage-details-section    // Details area
.usage-section            // Section wrapper
.usage-timeline           // Timeline list
.recent-users-list        // Users list
.usage-trends             // Trends area
```

### Card Type Modifiers
```css
.usage-card.total         // Total uses styling
.usage-card.imports       // Imports styling
.usage-card.views         // Views styling
.usage-card.shares        // Shares styling
```

## Loading States

### Loading Display
```jsx
if (isLoading) {
  return (
    <div className="usage-stats-loading">
      <div className="loading-spinner"></div>
      <span>Loading usage statistics...</span>
    </div>
  );
}
```

## Timeline Features

### Date Formatting
Standard format for all dates:
```javascript
return date.toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});
```

### Relative Time
Shows both absolute and relative times:
```jsx
<div className="timeline-date">
  {formatTimestamp(stats.lastUsed)}
  {stats.lastUsed && (
    <span className="relative-time">
      ({getRelativeTime(stats.lastUsed)})
    </span>
  )}
</div>
```

## Recent Users Display

### User Avatar
Simple initial-based avatars:
```jsx
<div className="user-avatar">
  {user.name?.charAt(0) || '?'}
</div>
```

### Empty State
Handles missing user data gracefully:
```jsx
<div className="no-recent-users">
  No recent user data available
</div>
```

## Chart Placeholder

Currently includes placeholder for future implementation:
```jsx
<div className="chart-placeholder">
  <p>Usage trends visualization would appear here</p>
  <p>Implementation would use recharts or similar library</p>
</div>
```

## Integration Points

### With Usage Tracking Service
```javascript
import { usageTracker } from '../services/usageTrackingService';

// Fetches detailed stats
usageTracker.getItemUsageStats(itemId)
```

### With Parent Components
- Can receive pre-loaded stats for performance
- Self-contained loading logic
- No callbacks needed (display-only)

## Performance Considerations

1. **Conditional Fetching**: Only loads if needed
2. **Error Boundaries**: Graceful error handling
3. **Minimal Re-renders**: No unnecessary state updates
4. **Efficient Formatting**: Caches date calculations

## Accessibility Features

1. **Semantic HTML**: Proper structure
2. **Loading Announcements**: Screen reader friendly
3. **Icon Labels**: Descriptive icon usage
4. **Contrast Ratios**: Accessible color choices

## Error Handling

### Failed Data Fetch
- Logs error to console
- Sets loading to false
- Shows default empty state

### Missing Data
- Defaults to 0 for counts
- Shows "Never" for missing dates
- Handles null users array

## Best Practices Demonstrated

1. **Progressive Enhancement**: Works with partial data
2. **Defensive Programming**: Null checks throughout
3. **Internationalization**: Uses Intl APIs
4. **Component Isolation**: Self-contained logic

## Usage Example

```jsx
// With pre-loaded stats
<UsageStatsPanel 
  itemId="config-123"
  initialStats={preloadedStats}
/>

// Without initial stats (will fetch)
<UsageStatsPanel 
  itemId="config-456"
/>
```

## Future Enhancements

1. **Interactive Charts**: Click to filter by date
2. **User Profiles**: Link to user details
3. **Export Options**: Download usage data
4. **Comparison View**: Compare multiple items
5. **Real-time Updates**: Live usage tracking
6. **Breakdown by Type**: Separate view/import/share trends
7. **Geographic Data**: Usage by location
8. **Custom Timeframes**: Filter stats by date range