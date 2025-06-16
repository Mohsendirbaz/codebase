/**
 * Renders a usage indicator component that displays the number of times a configuration has been used.
 * 
 * @component
 * @param {Object} props - The component props
 * @param {number} props.count - The number of times the configuration has been used
 * @param {boolean} [props.compact=false] - Whether to render a compact version of the indicator
 * @returns {React.ReactElement} A usage indicator with an icon and optional count
 * 
 * @example
 * // Full version
 * <UsageIndicator count={42} />
 * 
 * @example 
 * // Compact version
 * <UsageIndicator count={10} compact />
 */
// src/modules/processEconomics/components/UsageIndicator.js
import React from 'react';
import { ChartBarIcon, FireIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';

const UsageIndicator = ({ count, compact = false }) => {
  // Determine indicator level
  const getUsageLevel = (count) => {
    if (count >= 100) return 'very-high';
    if (count >= 50) return 'high';
    if (count >= 20) return 'medium';
    if (count >= 5) return 'low';
    return 'very-low';
  };
  
  const usageLevel = getUsageLevel(count);
  const tooltipId = `usage-tooltip-${Math.random().toString(36).substring(2, 9)}`;
  
  // Compact version for list views
  if (compact) {
    return (
      <>
        <span 
          className={`usage-indicator-compact ${usageLevel}`}
          data-tooltip-id={tooltipId}
          data-tooltip-content={`Used ${count} times`}
        >
          <FireIcon className="usage-icon" />
        </span>
        <Tooltip id={tooltipId} />
      </>
    );
  }
  
  // Full version
  return (
    <div 
      className={`usage-indicator ${usageLevel}`}
      data-tooltip-id={tooltipId}
      data-tooltip-content={`This configuration has been used ${count} times`}
    >
      <ChartBarIcon className="usage-icon" />
      <span className="usage-count">{count}</span>
      <Tooltip id={tooltipId} />
    </div>
  );
};

export default UsageIndicator;