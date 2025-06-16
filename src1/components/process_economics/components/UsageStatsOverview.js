// src/modules/processEconomics/components/UsageStatsOverview.js
import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ChartBarIcon, 
  UserIcon, 
  ClockIcon, 
  BuildingLibraryIcon,
  Squares2X2Icon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { FireIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

import { usageTracker } from '../services/usageTrackingService';

const UsageStatsOverview = ({ userId, onClose }) => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');
  
  // Load usage statistics
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        // This would be implemented in the usageTracker service
        const userStats = await usageTracker.getUserStats(userId, timeframe);
        const systemStats = await usageTracker.getSystemStats(timeframe);
        
        setStats({
          user: userStats,
          system: systemStats
        });
      } catch (error) {
        console.error('Error loading usage statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStats();
  }, [userId, timeframe]);
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (isLoading) {
    return (
      <div className="usage-stats-loading">
        <div className="loading-spinner"></div>
        <span>Loading usage statistics...</span>
      </div>
    );
  }
  
  // Display placeholder data if stats not available yet
  const placeholderStats = {
    user: {
      totalImports: 42,
      totalViews: 87,
      totalShares: 13,
      mostUsedItems: [
        { id: '1', name: 'Capital Cost Estimator', usage: 15 },
        { id: '2', name: 'Operating Cost Model', usage: 12 },
        { id: '3', name: 'NPV Calculator', usage: 8 }
      ],
      recentActivity: [
        { action: 'import', itemName: 'Refinery Scale-Up', date: '2023-05-01T14:32:00Z' },
        { action: 'view', itemName: 'Chemical Process Model', date: '2023-04-29T09:15:00Z' },
        { action: 'share', itemName: 'Production Forecast', date: '2023-04-28T11:23:00Z' }
      ]
    },
    system: {
      topItems: [
        { id: '1', name: 'Standard Cost Model', usage: 253 },
        { id: '2', name: 'Lifecycle Analysis', usage: 198 },
        { id: '3', name: 'ROI Calculator', usage: 172 }
      ],
      totalItems: 126,
      totalImports: 1452,
      activeUsers: 47
    }
  };
  
  const displayStats = stats || placeholderStats;
  
  return (
    <motion.div 
      className="usage-stats-overview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="stats-overview-header">
        <h2>
          <ChartBarIcon className="header-icon" />
          Usage Statistics
        </h2>
        
        <div className="timeframe-selector">
          <button 
            className={`timeframe-button ${timeframe === 'week' ? 'active' : ''}`}
            onClick={() => setTimeframe('week')}
          >
            Week
          </button>
          <button 
            className={`timeframe-button ${timeframe === 'month' ? 'active' : ''}`}
            onClick={() => setTimeframe('month')}
          >
            Month
          </button>
          <button 
            className={`timeframe-button ${timeframe === 'year' ? 'active' : ''}`}
            onClick={() => setTimeframe('year')}
          >
            Year
          </button>
          <button 
            className={`timeframe-button ${timeframe === 'all' ? 'active' : ''}`}
            onClick={() => setTimeframe('all')}
          >
            All Time
          </button>
        </div>
        
        <button className="refresh-button" onClick={() => setTimeframe(timeframe)}>
          <ArrowPathIcon className="refresh-icon" />
          Refresh
        </button>
        
        <button className="close-stats-button" onClick={onClose}>
          <XMarkIcon className="close-icon" />
        </button>
      </div>
      
      <div className="stats-content">
        <div className="stats-section user-stats">
          <h3>
            <UserIcon className="section-icon" />
            Your Activity
          </h3>
          
          <div className="stats-cards">
            <div className="stats-card">
              <div className="stats-card-value">{displayStats.user.totalImports}</div>
              <div className="stats-card-label">Imports</div>
            </div>
            
            <div className="stats-card">
              <div className="stats-card-value">{displayStats.user.totalViews}</div>
              <div className="stats-card-label">Views</div>
            </div>
            
            <div className="stats-card">
              <div className="stats-card-value">{displayStats.user.totalShares}</div>
              <div className="stats-card-label">Shares</div>
            </div>
          </div>
          
          <div className="stats-detail-section">
            <h4>Your Most Used Items</h4>
            <div className="most-used-items">
              {displayStats.user.mostUsedItems.map((item, index) => (
                <div key={index} className="most-used-item">
                  <div className="item-rank">{index + 1}</div>
                  <div className="item-name">{item.name}</div>
                  <div className="item-usage">{item.usage} uses</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="stats-detail-section">
            <h4>Recent Activity</h4>
            <div className="recent-activity">
              {displayStats.user.recentActivity.map((activity, index) => (
                <div key={index} className="activity-entry">
                  <div className="activity-icon">
                    {activity.action === 'import' && <Squares2X2Icon />}
                    {activity.action === 'view' && <UserIcon />}
                    {activity.action === 'share' && <BuildingLibraryIcon />}
                  </div>
                  <div className="activity-details">
                    <div className="activity-action">
                      {activity.action === 'import' ? 'Imported' : 
                       activity.action === 'view' ? 'Viewed' : 'Shared'}
                    </div>
                    <div className="activity-item-name">{activity.itemName}</div>
                    <div className="activity-date">{formatDate(activity.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="stats-section system-stats">
          <h3>
            <FireIcon className="section-icon" />
            Community Trends
          </h3>
          
          <div className="stats-cards">
            <div className="stats-card">
              <div className="stats-card-value">{displayStats.system.totalItems}</div>
              <div className="stats-card-label">Available Items</div>
            </div>
            
            <div className="stats-card">
              <div className="stats-card-value">{displayStats.system.totalImports}</div>
              <div className="stats-card-label">Total Uses</div>
            </div>
            
            <div className="stats-card">
              <div className="stats-card-value">{displayStats.system.activeUsers}</div>
              <div className="stats-card-label">Active Users</div>
            </div>
          </div>
          
          <div className="stats-detail-section">
            <h4>Most Popular Configurations</h4>
            <div className="popular-items">
              {displayStats.system.topItems.map((item, index) => (
                <div key={index} className="popular-item">
                  <div className="item-rank">{index + 1}</div>
                  <div className="item-name">{item.name}</div>
                  <div className="item-usage">{item.usage} uses</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="stats-trends">
            <h4>Usage Trends</h4>
            <div className="trends-chart">
              {/* Trends chart would be implemented with recharts */}
              <div className="chart-placeholder">
                <p>Usage trend visualization would appear here</p>
                <p>Implementation would use recharts or similar library</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UsageStatsOverview;