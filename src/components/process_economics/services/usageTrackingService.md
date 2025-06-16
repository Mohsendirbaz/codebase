# Usage Tracking Service Documentation

## Overview

The `usageTrackingService.js` module provides comprehensive tracking and analytics for library item usage. It monitors user interactions, maintains usage statistics, and provides insights into popular items and usage patterns.

## Class: UsageTrackingService

### Constructor
```javascript
constructor()
```
Initializes the service with Firestore database connection.

## API Methods

### `trackItemUsage(itemId, userId, source, event)`

Records a usage event for a library item.

**Signature:**
```javascript
async trackItemUsage(itemId: string, userId: string, source: string, event?: string) => Promise<boolean>
```

**Parameters:**
- `itemId` - Unique identifier of the used item
- `userId` - ID of the user who used the item
- `source` - Origin of the item ('personal' or 'general')
- `event` - Type of usage event (default: 'import')
  - `'import'` - Item was imported/used
  - `'view'` - Item was viewed
  - `'share'` - Item was shared

**Returns:**
- Boolean indicating success status

**Tracking Updates:**
1. Item usage counts in `library_items` collection
2. Usage event record in `usage_events` collection
3. User statistics in `user_stats` collection
4. Daily aggregation in `usage_daily` collection

### `getItemUsageStats(itemId)`

Retrieves usage statistics for a specific item.

**Signature:**
```javascript
async getItemUsageStats(itemId: string) => Promise<Object|null>
```

**Parameters:**
- `itemId` - ID of the item

**Returns:**
- Usage statistics object or null if not found
- Includes error message on failure

**Response Structure:**
```javascript
{
  total: number,
  viewCount?: number,
  importCount?: number,
  shareCount?: number,
  lastUsed?: Timestamp,
  recentUsers?: Array<string>,
  error?: string           // Only on error
}
```

### `getPopularItems(limit, timeframe)`

Retrieves the most popular items based on usage.

**Signature:**
```javascript
async getPopularItems(limit?: number, timeframe?: string) => Promise<Array>
```

**Parameters:**
- `limit` - Maximum items to retrieve (default: 10)
- `timeframe` - Time period (default: 'month')
  - `'week'` - Last 7 days
  - `'month'` - Last 30 days
  - `'allTime'` - All time

**Returns:**
- Array of popular items sorted by usage count
- Falls back to mock data in development/error scenarios

### `getItemsByTypeUsage(itemType, limit)`

Gets usage statistics for items of a specific type.

**Signature:**
```javascript
async getItemsByTypeUsage(itemType: string, limit?: number) => Promise<Array>
```

**Parameters:**
- `itemType` - Type of items to query
- `limit` - Maximum results (default: 10)

**Returns:**
- Array of items with usage statistics
- Falls back to mock data on error

## Data Structures

### Usage Event Record
```javascript
{
  itemId: string,
  userId: string,
  source: string,          // 'personal' or 'general'
  event: string,           // 'import', 'view', 'share'
  timestamp: Timestamp
}
```

### Item Usage Statistics
```javascript
{
  total: number,           // Total usage count
  viewCount: number,       // View events
  importCount: number,     // Import events
  shareCount: number,      // Share events
  lastUsed: Timestamp,     // Last usage time
  recentUsers: Array<string>  // Recent user IDs
}
```

### User Statistics
```javascript
{
  userId: string,
  itemsUsed: {
    [itemId]: {
      count: number,
      lastUsed: Timestamp,
      source: string
    }
  }
}
```

### Daily Aggregation
```javascript
{
  date: string,            // YYYY-MM-DD format
  items: {
    [itemId]: number      // Usage count
  },
  sources: {
    personal: number,
    general: number
  },
  events: {
    import: number,
    view: number,
    share: number
  },
  totalEvents: number
}
```

## Tracking Methodologies

### Multi-Level Tracking
1. **Item Level** - Updates item document with usage counts
2. **Event Level** - Creates individual event records
3. **User Level** - Tracks per-user item usage
4. **Daily Level** - Aggregates daily statistics

### Recent Users Management
```javascript
_updateRecentUsers(currentUsers, newUserId)
```
- Maintains list of recent users (up to 10)
- Prevents duplicates
- FIFO replacement strategy

### Increment Operations
Uses Firestore's atomic increment:
```javascript
[`usage.total`]: increment(1)
```

## Error Handling Approaches

### Graceful Degradation
- All methods return safe defaults on error
- Errors logged to console
- Operations continue despite individual failures

### Fallback Strategies
1. **Development Mode** - Returns mock data
2. **Firebase Errors** - Falls back to mock data
3. **Missing Data** - Returns empty statistics

### Error Response Patterns
- `trackItemUsage()` - Returns false on error
- `getItemUsageStats()` - Returns `{total: 0, error: message}`
- `getPopularItems()` - Returns mock popular items
- `getItemsByTypeUsage()` - Returns empty array or mock data

## Mock Data Strategies

### Popular Items Mock
```javascript
{
  id: string,
  name: string,
  category: string,
  description: string,
  modeler: string,
  dateAdded: ISO string,
  usage: {
    total: number,
    viewCount: number,
    importCount: number,
    shareCount: number
  },
  tags: Array<string>,
  configuration: Object
}
```

### Type-Specific Mock Data
Predefined mock data for:
- `'decarbonization-pathway'` - 6 pathway items with usage

### Mock Data Features
- Realistic usage counts
- Descending popularity order
- Time-filtered results for week/month
- Consistent data structure

## Integration Patterns

### Environment Detection
```javascript
if (process.env.NODE_ENV === 'development' || 
    process.env.REACT_APP_USE_MOCK_DATA === 'true') {
  return this._getMockPopularItems(limit, timeframe);
}
```

### Firestore Collections
- `library_items` - Item documents with usage stats
- `usage_events` - Individual usage events
- `user_stats` - Per-user statistics
- `usage_daily` - Daily aggregations

### Atomic Updates
```javascript
await updateDoc(itemRef, {
  [`usage.total`]: increment(1),
  [`usage.${event}Count`]: increment(1)
});
```

## Usage Examples

```javascript
import usageTracker from './usageTrackingService';

// Track an import event
await usageTracker.trackItemUsage(
  'item-123',
  'user-456',
  'general',
  'import'
);

// Get item statistics
const stats = await usageTracker.getItemUsageStats('item-123');
console.log(`Item used ${stats.total} times`);

// Get popular items this week
const popular = await usageTracker.getPopularItems(5, 'week');

// Get popular decarbonization pathways
const pathways = await usageTracker.getItemsByTypeUsage(
  'decarbonization-pathway',
  10
);
```

## Performance Considerations

### Batch Operations
- Multiple Firestore updates per tracking event
- Consider batch writes for high-volume scenarios

### Daily Aggregation
- Reduces query complexity for analytics
- Pre-computed daily statistics

### Index Requirements
Firestore indexes needed for:
- `library_items` - order by `usage.total`
- `usage_events` - query by `timestamp`
- `user_stats` - query by `userId`

## Testing Considerations

### Mock Mode
- Activated by environment variables
- Predictable mock data
- No Firestore operations

### Test Scenarios
```javascript
// Test tracking
const result = await usageTracker.trackItemUsage(
  'test-item',
  'test-user',
  'personal'
);
expect(result).toBe(true);

// Test popular items
const items = await usageTracker.getPopularItems(5, 'week');
expect(items).toHaveLength(5);
expect(items[0].usage.total).toBeGreaterThan(items[1].usage.total);
```

## Singleton Export

The service is exported as a singleton instance:
```javascript
export const usageTracker = new UsageTrackingService();
export default usageTracker;
```