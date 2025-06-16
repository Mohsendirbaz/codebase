import React, { useState, useEffect, useMemo } from 'react';
import capacityTracker from '../../services/CapacityTrackingService';
import '../../styles/HomePage.CSS/TimeParameterMatrix.css';

/**
 * TimeParameterMatrix component
 * 
 * Visualizes parameters, scaling groups, and their efficacy periods across time units (years)
 * Highlights conflicts where the degree of freedom constraint is violated
 * 
 * @param {Object} props
 * @param {Object} props.parameters - Object containing parameters with efficacy periods
 * @param {Object} props.scalingGroups - Object containing scaling groups for each parameter
 * @param {number} props.plantLifetime - The plant lifetime in years
 * @param {Function} props.onConflictClick - Function to call when a conflict is clicked
 */
const TimeParameterMatrix = ({ 
  parameters, 
  scalingGroups = {}, 
  plantLifetime = 20, 
  onConflictClick 
}) => {
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedParam, setSelectedParam] = useState(null);
  const [selectedScalingGroup, setSelectedScalingGroup] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [viewMode, setViewMode] = useState('parameter'); // 'parameter' or 'scalingGroup'
  const [flattenedParameters, setFlattenedParameters] = useState([]);

  // Generate years array from 1 to plantLifetime
  const years = useMemo(() => {
    return Array.from({ length: plantLifetime }, (_, i) => i + 1);
  }, [plantLifetime]);

  // Flatten parameters and scaling groups into a single array for matrix display
  useEffect(() => {
    if (!parameters || !scalingGroups) return;

    const flattened = [];

    if (viewMode === 'parameter') {
      // Just show parameters
      Object.keys(parameters).forEach(paramId => {
        flattened.push({ type: 'parameter', id: paramId });
      });
    } else {
      // Show parameters with their scaling groups
      Object.keys(parameters).forEach(paramId => {
        const paramScalingGroups = scalingGroups[paramId] || [];

        if (paramScalingGroups.length === 0) {
          // If no scaling groups, just show the parameter
          flattened.push({ type: 'parameter', id: paramId });
        } else {
          // Add each scaling group
          paramScalingGroups.forEach(sgId => {
            flattened.push({ 
              type: 'scalingGroup', 
              id: `${paramId}_${sgId}`,
              paramId,
              scalingGroupId: sgId
            });
          });
        }
      });
    }

    setFlattenedParameters(flattened);
  }, [parameters, scalingGroups, viewMode]);

  // Find all conflicts across parameters and years
  useEffect(() => {
    if (!parameters || !scalingGroups) return;

    const allConflicts = [];

    Object.entries(parameters).forEach(([paramId, param]) => {
      if (!param.efficacyPeriods || !Array.isArray(param.efficacyPeriods)) return;

      // For this example, we'll check conflicts at the parameter level
      // In a real app, conflicts would be checked at the parameter-scaling group level
      const paramScalingGroups = scalingGroups[paramId] || [0]; // Default scaling group if none exist

      paramScalingGroups.forEach(sgId => {
        const paramConflicts = capacityTracker.findDegreeOfFreedomConflicts(
          paramId, 
          param.efficacyPeriods, 
          plantLifetime
        );

        paramConflicts.forEach(year => {
          allConflicts.push({ paramId, scalingGroupId: sgId, year });
        });
      });
    });

    setConflicts(allConflicts);

    // Update plant lifetime usage
    capacityTracker.updatePlantLifetimeUsage(plantLifetime);
  }, [parameters, scalingGroups, plantLifetime]);

  // Check if a cell has a conflict
  const hasConflict = (item, year) => {
    if (item.type === 'parameter') {
      return conflicts.some(conflict => 
        conflict.paramId === item.id && conflict.year === year
      );
    } else {
      return conflicts.some(conflict => 
        conflict.paramId === item.paramId && 
        conflict.scalingGroupId === item.scalingGroupId && 
        conflict.year === year
      );
    }
  };

  // Check if a parameter or scaling group is active for a specific year
  const isActive = (item, year) => {
    if (item.type === 'parameter') {
      const param = parameters[item.id];
      if (!param || !param.efficacyPeriods || !Array.isArray(param.efficacyPeriods)) {
        return false;
      }

      return param.efficacyPeriods.some(period => 
        year >= period.start && year <= period.end
      );
    } else {
      // For scaling groups, check the parent parameter's efficacy periods
      // In a real app, each scaling group would have its own efficacy periods
      const param = parameters[item.paramId];
      if (!param || !param.efficacyPeriods || !Array.isArray(param.efficacyPeriods)) {
        return false;
      }

      return param.efficacyPeriods.some(period => 
        year >= period.start && year <= period.end
      );
    }
  };

  // Get cell class based on its state
  const getCellClass = (item, year) => {
    if (hasConflict(item, year)) {
      return 'cell conflict';
    }

    if (isActive(item, year)) {
      return 'cell active';
    }

    return 'cell inactive';
  };

  // Handle cell click
  const handleCellClick = (item, year) => {
    if (item.type === 'parameter') {
      setSelectedParam(item.id);
      setSelectedScalingGroup(null);
    } else {
      setSelectedParam(item.paramId);
      setSelectedScalingGroup(item.scalingGroupId);
    }

    setSelectedYear(year);

    if (hasConflict(item, year) && onConflictClick) {
      if (item.type === 'parameter') {
        onConflictClick(item.id, 0, year); // Use default scaling group 0
      } else {
        onConflictClick(item.paramId, item.scalingGroupId, year);
      }
    }
  };

  // Get tooltip content for a cell
  const getTooltipContent = (item, year) => {
    let content = '';

    if (item.type === 'parameter') {
      const param = parameters[item.id];
      if (!param) return '';

      const isActiveCell = isActive(item, year);
      const hasConflictHere = hasConflict(item, year);

      content = `Parameter: ${item.id}\nYear: ${year}\n`;

      if (isActiveCell) {
        content += 'Status: Active\n';

        // Find which efficacy periods include this year
        const relevantPeriods = param.efficacyPeriods.filter(period => 
          year >= period.start && year <= period.end
        );

        if (relevantPeriods.length > 0) {
          content += `Efficacy Periods:\n`;
          relevantPeriods.forEach((period, index) => {
            content += `  ${index + 1}. Years ${period.start}-${period.end}`;
            if (period.value !== undefined) {
              content += ` (Value: ${period.value})`;
            }
            content += '\n';
          });
        }
      } else {
        content += 'Status: Inactive\n';
      }

      if (hasConflictHere) {
        content += '\nCONFLICT: Multiple values for this year\n';
        content += 'Click to resolve';
      }
    } else {
      // Scaling group cell
      const param = parameters[item.paramId];
      if (!param) return '';

      const isActiveCell = isActive(item, year);
      const hasConflictHere = hasConflict(item, year);

      content = `Parameter: ${item.paramId}\nScaling Group: ${item.scalingGroupId}\nYear: ${year}\n`;

      if (isActiveCell) {
        content += 'Status: Active\n';

        // In a real app, we would show scaling group specific efficacy periods
        // For this example, we're using the parameter's efficacy periods
        const relevantPeriods = param.efficacyPeriods.filter(period => 
          year >= period.start && year <= period.end
        );

        if (relevantPeriods.length > 0) {
          content += `Efficacy Periods:\n`;
          relevantPeriods.forEach((period, index) => {
            content += `  ${index + 1}. Years ${period.start}-${period.end}`;
            if (period.value !== undefined) {
              content += ` (Value: ${period.value})`;
            }
            content += '\n';
          });
        }
      } else {
        content += 'Status: Inactive\n';
      }

      if (hasConflictHere) {
        content += '\nCONFLICT: Multiple values for this year\n';
        content += 'Click to resolve';
      }
    }

    return content;
  };

  // Get display label for matrix row
  const getRowLabel = (item) => {
    if (item.type === 'parameter') {
      return item.id;
    } else {
      return `${item.paramId}[${item.scalingGroupId}]`;
    }
  };

  // Toggle view mode between parameters and scaling groups
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'parameter' ? 'scalingGroup' : 'parameter');
  };

  // Render the matrix
  return (
    <div className="time-parameter-matrix">
      <div className="matrix-controls">
        <h3>Parameter-Time Matrix</h3>
        <button 
          className="view-toggle-button" 
          onClick={toggleViewMode}
        >
          {viewMode === 'parameter' ? 'Show Scaling Groups' : 'Show Parameters Only'}
        </button>
      </div>

      <div className="matrix-description">
        This matrix shows when parameters and scaling groups are active across the plant lifetime.
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color inactive"></div>
            <span>Inactive</span>
          </div>
          <div className="legend-item">
            <div className="legend-color active"></div>
            <span>Active</span>
          </div>
          <div className="legend-item">
            <div className="legend-color conflict"></div>
            <span>Conflict</span>
          </div>
        </div>
      </div>

      <div className="matrix-container">
        <div className="matrix-header">
          <div className="corner-cell"></div>
          {years.map(year => (
            <div key={`year-${year}`} className="year-header">
              {year}
            </div>
          ))}
        </div>

        <div className="matrix-body">
          {flattenedParameters.map((item, index) => (
            <div key={`row-${index}`} className="matrix-row">
              <div className={`param-label ${item.type === 'scalingGroup' ? 'scaling-group-label' : ''}`}>
                {getRowLabel(item)}
              </div>
              {years.map(year => {
                const cellId = `${item.id || item.paramId + '_' + item.scalingGroupId}-${year}`;
                const isHovered = hoveredCell === cellId;

                return (
                  <div
                    key={cellId}
                    id={cellId}
                    className={`${getCellClass(item, year)} ${isHovered ? 'hovered' : ''}`}
                    onClick={() => handleCellClick(item, year)}
                    onMouseEnter={() => setHoveredCell(cellId)}
                    onMouseLeave={() => setHoveredCell(null)}
                    title={getTooltipContent(item, year)}
                  >
                    {isHovered && (
                      <div className="cell-tooltip">
                        {getTooltipContent(item, year)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="conflicts-summary">
          <h4>Conflicts Detected</h4>
          <p>There are {conflicts.length} conflicts where parameters/scaling groups have multiple values for the same year.</p>
          <p>Click on red cells to resolve conflicts.</p>
        </div>
      )}

      <div className="matrix-footer">
        <p className="degree-of-freedom-note">
          <strong>Degree of Freedom Constraint:</strong> Only one value per parameter per scaling group per time unit (year) is allowed.
        </p>
        <p>
          Each scaling group enjoys the same customization capabilities as base parameters, 
          allowing unique sensitivity variations for every time unit.
        </p>
      </div>
    </div>
  );
};

export default TimeParameterMatrix;
