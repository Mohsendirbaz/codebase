import React from 'react';

/**
 * Get nested object value using path string (e.g., "economics.cost")
 */
const getNestedValue = (obj, path) => {
  if (!path) return obj;
  const parts = path.split('.');
  let value = obj;
  for (const part of parts) {
    if (value === null || value === undefined) return undefined;
    value = value[part];
  }
  return value;
};

/**
 * PathwayComparisonChart - Horizontal bar chart for pathway comparison
 * 
 * @param {Object} props - Component props
 * @param {Array} props.pathways - Array of pathway objects
 * @param {String} props.dataKey - Path to the data value in pathway object
 * @param {Function} props.format - Function to format the display value
 * @param {Boolean} props.ascending - Whether lower values are better (true) or higher (false)
 * @param {String} props.color - Base color for the chart
 */
const PathwayComparisonChart = ({
  pathways = [],
  dataKey,
  format = (value) => value,
  ascending = true,
  color = '#4682b4'
}) => {
  if (!pathways || pathways.length === 0) return null;
  
  // Extract data values
  const data = pathways.map(pathway => ({
    id: pathway.id,
    name: pathway.name,
    value: getNestedValue(pathway, dataKey),
    category: pathway.category,
    isHardToDecarbonize: pathway.isHardToDecarbonize
  })).filter(item => item.value !== undefined && item.value !== null);
  
  // Sort by value
  data.sort((a, b) => ascending ? a.value - b.value : b.value - a.value);
  
  // Find min and max values for scaling
  const minValue = Math.min(...data.map(d => d.value));
  const maxValue = Math.max(...data.map(d => d.value));
  
  // Calculate bar widths as percentage of max
  const normalizedData = data.map(item => ({
    ...item,
    width: ((item.value - minValue) / (maxValue - minValue || 1)) * 100
  }));
  
  return (
    <div className="pathway-comparison-chart">
      {normalizedData.map(item => (
        <div key={item.id} className="chart-bar-container">
          <div className="chart-bar-label">
            <span className={`category-indicator ${item.category}`}></span>
            {item.name}
          </div>
          <div className="chart-bar-wrapper">
            <div 
              className={`chart-bar ${item.isHardToDecarbonize ? 'hard-to-decarbonize' : ''}`}
              style={{ 
                width: `${ascending ? 100 - item.width : item.width}%`,
                backgroundColor: item.isHardToDecarbonize ? '#e74c3c' : color
              }}
            ></div>
            <div className="chart-bar-value">
              {format(item.value)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PathwayComparisonChart;