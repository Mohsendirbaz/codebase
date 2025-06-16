/**
 * A React component that displays comprehensive usage statistics for an item.
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {string} props.itemId - Unique identifier for the item being tracked
 * @param {Object} [props.initialStats] - Optional initial usage statistics
 * 
 * @returns {React.ReactElement} A panel displaying usage metrics including total uses, 
 * imports, views, shares, timeline, recent users, and a placeholder for usage trends.
 * 
 * @example
 * <UsageStatsPanel itemId="123" initialStats={preloadedStats} />
 */
// src/modules/processEconomics/components/UsageStatsPanel.js
import React, { useState, useEffect } from 'react';
import { 
  DownloadIcon, 
  EyeIcon, 
  ShareIcon, 
  ChartBarIcon,
  UsersIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline';
import { usageTracker } from '../services/usageTrackingService';

const UsageStatsPanel = ({ itemId, initialStats }) => {
  const [stats, setStats] = useState(initialStats || { total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('allTime');
  
  // Fetch detailed stats if needed
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
  
  // Format a timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    
    // Handle Firestore timestamp objects
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get relative time (e.g., "2 days ago")
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Never';
    
    // Handle Firestore timestamp objects
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const now = new Date();
    const diffInMs = date.getTime() - now.getTime();
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays > -30) return rtf.format(diffInDays, 'day');
    
    const diffInMonths = Math.round(diffInDays / 30);
    return rtf.format(diffInMonths, 'month');
  };
  
  if (isLoading) {
    return (
      <div className="usage-stats-loading">
        <div className="loading-spinner"></div>
        <span>Loading usage statistics...</span>
      </div>
    );
  }
  
  return (
    <div className="usage-stats-panel">
      <div className="usage-summary-cards">
        <div className="usage-card total">
          <div className="usage-card-content">
            <div className="usage-card-icon">
              <ChartBarIcon />
            </div>
            <div className="usage-card-data">
              <div className="usage-card-value">{stats.total || 0}</div>
              <div className="usage-card-label">Total Uses</div>
            </div>
          </div>
        </div>
        
        <div className="usage-card imports">
          <div className="usage-card-content">
            <div className="usage-card-icon">
              <DownloadIcon />
            </div>
            <div className="usage-card-data">
              <div className="usage-card-value">{stats.importCount || 0}</div>
              <div className="usage-card-label">Imports</div>
            </div>
          </div>
        </div>
        
        <div className="usage-card views">
          <div className="usage-card-content">
            <div className="usage-card-icon">
              <EyeIcon />
            </div>
            <div className="usage-card-data">
              <div className="usage-card-value">{stats.viewCount || 0}</div>
              <div className="usage-card-label">Views</div>
            </div>
          </div>
        </div>
        
        <div className="usage-card shares">
          <div className="usage-card-content">
            <div className="usage-card-icon">
              <ShareIcon />
            </div>
            <div className="usage-card-data">
              <div className="usage-card-value">{stats.shareCount || 0}</div>
              <div className="usage-card-label">Shares</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="usage-details-section">
        <div className="usage-section">
          <h3 className="usage-section-title">
            <CalendarIcon className="section-icon" />
            <span>Timeline</span>
          </h3>
          
          <div className="usage-timeline">
            <div className="timeline-entry">
              <div className="timeline-label">Created:</div>
              <div className="timeline-date">{formatTimestamp(stats.dateCreated)}</div>
            </div>
            
            <div className="timeline-entry">
              <div className="timeline-label">Last Used:</div>
              <div className="timeline-date">
                {formatTimestamp(stats.lastUsed)}
                {stats.lastUsed && (
                  <span className="relative-time">
                    ({getRelativeTime(stats.lastUsed)})
                  </span>
                )}
              </div>
            </div>
            
            <div className="timeline-entry">
              <div className="timeline-label">Most Active:</div>
              <div className="timeline-date">{formatTimestamp(stats.mostActiveDate)}</div>
            </div>
          </div>
        </div>
        
        <div className="usage-section">
          <h3 className="usage-section-title">
            <UsersIcon className="section-icon" />
            <span>Recent Users</span>
          </h3>
          
          {stats.recentUsers && stats.recentUsers.length > 0 ? (
            <div className="recent-users-list">
              {stats.recentUsers.map((user, index) => (
                <div key={index} className="recent-user">
                  <div className="user-avatar">
                    {user.name?.charAt(0) || '?'}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.name || 'Anonymous User'}</div>
                    {user.lastUsed && (
                      <div className="user-last-used">
                        Last used {getRelativeTime(user.lastUsed)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-recent-users">
              No recent user data available
            </div>
          )}
        </div>
      </div>
      
      <div className="usage-trends">
        <h3 className="usage-section-title">Usage Trends</h3>
        <div className="usage-chart">
          {/* Chart would be implemented with a library like recharts */}
          <div className="chart-placeholder">
            <p>Usage trends visualization would appear here</p>
            <p>Implementation would use recharts or similar library</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageStatsPanel;