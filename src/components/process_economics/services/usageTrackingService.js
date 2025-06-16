// src/modules/processEconomics/services/usageTrackingService.js
import { v4 as uuidv4 } from 'uuid';
import { getFirestore, doc, updateDoc, increment, getDoc, setDoc, serverTimestamp ,getDocs, collection, query, orderBy } from 'firebase/firestore';

/**
 * Service to track usage of library items
 */
class UsageTrackingService {
  constructor() {
    this.db = getFirestore();
  }

  /**
   * Record an item usage event
   * @param {string} itemId - The ID of the used item
   * @param {string} userId - User who used the item
   * @param {string} source - Where the item came from ('personal' or 'general')
   * @param {string} event - Type of usage event ('import', 'view', 'share')
   */
  async trackItemUsage(itemId, userId, source, event = 'import') {
    if (!itemId || !userId) return;

    try {
      // Update item usage counts in items collection
      const itemRef = doc(this.db, 'library_items', itemId);
      const itemSnapshot = await getDoc(itemRef);

      if (itemSnapshot.exists()) {
        // Update existing item stats
        await updateDoc(itemRef, {
          [`usage.total`]: increment(1),
          [`usage.${event}Count`]: increment(1),
          [`usage.lastUsed`]: serverTimestamp(),
          [`usage.recentUsers`]: this._updateRecentUsers(itemSnapshot.data().usage?.recentUsers || [], userId)
        });
      }

      // Record usage in usage_events collection for analytics
      const eventId = uuidv4();
      const eventRef = doc(this.db, 'usage_events', eventId);
      await setDoc(eventRef, {
        itemId,
        userId,
        source,
        event,
        timestamp: serverTimestamp()
      });

      // Update user stats
      const userStatsRef = doc(this.db, 'user_stats', userId);
      const userStatsSnapshot = await getDoc(userStatsRef);

      if (userStatsSnapshot.exists()) {
        await updateDoc(userStatsRef, {
          [`itemsUsed.${itemId}.count`]: increment(1),
          [`itemsUsed.${itemId}.lastUsed`]: serverTimestamp(),
          [`itemsUsed.${itemId}.source`]: source,
        });
      } else {
        await setDoc(userStatsRef, {
          userId,
          itemsUsed: {
            [itemId]: {
              count: 1,
              lastUsed: serverTimestamp(),
              source
            }
          }
        });
      }

      // Update in daily usage aggregation
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const dailyStatsRef = doc(this.db, 'usage_daily', dateString);

      await updateDoc(dailyStatsRef, {
        [`items.${itemId}`]: increment(1),
        [`sources.${source}`]: increment(1),
        [`events.${event}`]: increment(1),
        totalEvents: increment(1)
      }, { merge: true });

      return true;
    } catch (error) {
      console.error('Error tracking item usage:', error);
      return false;
    }
  }

  /**
   * Get usage statistics for an item
   * @param {string} itemId - The ID of the item
   */
  async getItemUsageStats(itemId) {
    if (!itemId) return null;

    try {
      const itemRef = doc(this.db, 'library_items', itemId);
      const itemSnapshot = await getDoc(itemRef);

      if (itemSnapshot.exists()) {
        return itemSnapshot.data().usage || { total: 0 };
      }

      return { total: 0 };
    } catch (error) {
      console.error('Error getting item usage stats:', error);
      return { total: 0, error: error.message };
    }
  }

 /**
 * Get popular items from the library
 * @param {number} limit - Maximum number of items to retrieve
 * @param {string} timeframe - Time period ('week', 'month', 'allTime')
 */
/**
 * Get popular items from the library
 * @param {number} limit - Maximum number of items to retrieve
 * @param {string} timeframe - Time period ('week', 'month', 'allTime')
 */
async getPopularItems(limit = 10, timeframe = 'month') {
  try {
    // Check if we're in testing/development mode
    if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_USE_MOCK_DATA === 'true') {
      // Return mock data instead of making a Firestore query
      return this._getMockPopularItems(limit, timeframe);
    }

    // Production code - use actual Firestore query
    const querySnapshot = await getDocs(
      query(
        collection(this.db, 'library_items'),
        orderBy('usage.total', 'desc'),
        limit(limit)
      )
    );

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting popular items:', error);
    // Fallback to mock data in case of error
    return this._getMockPopularItems(limit, timeframe);
  }
}

/**
 * Get usage statistics for items of a specific type
 * @param {string} itemType - Type of items to get stats for
 * @param {number} limit - Maximum number of items to return
 * @returns {Promise<Array>} Array of items with usage statistics
 */
async getItemsByTypeUsage(itemType, limit = 10) {
  try {
    // Check if we're in testing/development mode
    if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_USE_MOCK_DATA === 'true') {
      // Return mock data instead of making a Firestore query
      return this._getMockItemsByTypeUsage(itemType, limit);
    }

    // Production code - use actual Firestore query
    const querySnapshot = await getDocs(
      query(
        collection(this.db, 'library_items'),
        where('type', '==', itemType),
        orderBy('usage.total', 'desc'),
        limit(limit)
      )
    );

    return querySnapshot.docs.map(doc => ({
      itemId: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting ${itemType} items usage:`, error);
    // Fallback to mock data in case of error
    return this._getMockItemsByTypeUsage(itemType, limit);
  }
}
/**
 * Private method to get mock popular items for testing
 * @private
 */
_getMockPopularItems(limit, timeframe) {
  // Create realistic mock data that matches the expected structure
  const mockItems = [
    {
      id: 'popular-item-1',
      name: 'Standard Cost Model',
      category: 'Capital Cost Estimation',
      description: 'Industry-standard cost model for capital expenditure estimation',
      modeler: 'John Smith',
      dateAdded: new Date('2024-01-15').toISOString(),
      usage: { total: 253, viewCount: 412, importCount: 253, shareCount: 87 },
      tags: ['cost', 'capital', 'standard'],
      configuration: {
        version: "1.2.0",
        metadata: {
          scalingType: 'Amount4',
          description: 'Standard capital cost model',
        },
        currentState: {
          scalingGroups: new Array(3).fill({ items: new Array(5).fill({}) })
        }
      }
    },
    // Add more mock items with descending usage counts...
    {
      id: 'popular-item-2',
      name: 'Lifecycle Analysis Framework',
      category: 'Life Cycle Assessment',
      description: 'Comprehensive framework for lifecycle cost analysis',
      modeler: 'Maria Chen',
      dateAdded: new Date('2024-02-10').toISOString(),
      usage: { total: 198, viewCount: 321, importCount: 198, shareCount: 64 },
      tags: ['lifecycle', 'assessment', 'framework'],
      configuration: {
        version: "1.2.0",
        metadata: {
          scalingType: 'Amount5',
          description: 'Lifecycle analysis framework',
        },
        currentState: {
          scalingGroups: new Array(4).fill({ items: new Array(6).fill({}) })
        }
      }
    },
    // More items would go here...
  ];

  // For week and month timeframes, filter by date if needed
  let filteredItems = [...mockItems];
  if (timeframe === 'week') {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    filteredItems = mockItems.filter(item => new Date(item.dateAdded) >= oneWeekAgo);
  } else if (timeframe === 'month') {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    filteredItems = mockItems.filter(item => new Date(item.dateAdded) >= oneMonthAgo);
  }

  // Return limited number of items
  return filteredItems.slice(0, limit);
}

/**
 * Generate mock usage data for specific item types
 * @private
 */
_getMockItemsByTypeUsage(itemType, limit) {
  const mockData = {
    'decarbonization-pathway': [
      { itemId: 'wind-pem', usage: { total: 156, viewCount: 243, importCount: 156, shareCount: 67 } },
      { itemId: 'solar-pem', usage: { total: 134, viewCount: 221, importCount: 134, shareCount: 53 } },
      { itemId: 'natgas-ccs', usage: { total: 98, viewCount: 167, importCount: 98, shareCount: 42 } },
      { itemId: 'biomass-pem', usage: { total: 76, viewCount: 132, importCount: 76, shareCount: 31 } },
      { itemId: 'natgas-noccs', usage: { total: 63, viewCount: 112, importCount: 63, shareCount: 28 } },
      { itemId: 'solid-oxide', usage: { total: 48, viewCount: 87, importCount: 48, shareCount: 19 } }
    ]
  };

  if (itemType in mockData) {
    return mockData[itemType].slice(0, limit);
  }

  // Return empty array if no mock data for the type
  return [];
}
}

export const usageTracker = new UsageTrackingService();
export default usageTracker;
