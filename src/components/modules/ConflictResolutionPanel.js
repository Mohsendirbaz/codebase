import React, { useState, useEffect } from 'react';
import '../../styles/HomePage.CSS/ConflictResolutionPanel.css';

/**
 * ConflictResolutionPanel component
 * 
 * Helps users resolve conflicts where the degree of freedom constraint is violated
 * (multiple values for the same parameter-scaling group combination in the same year)
 * 
 * @param {Object} props
 * @param {string} props.paramId - The parameter ID with a conflict
 * @param {number} props.scalingGroupId - The scaling group ID with a conflict
 * @param {number} props.year - The year with a conflict
 * @param {Array} props.conflictingPeriods - Array of efficacy periods that conflict
 * @param {Function} props.onResolve - Function to call when conflict is resolved
 * @param {Function} props.onCancel - Function to call when resolution is cancelled
 */
const ConflictResolutionPanel = ({ 
  paramId, 
  scalingGroupId, 
  year, 
  conflictingPeriods = [], 
  onResolve, 
  onCancel 
}) => {
  const [selectedResolution, setSelectedResolution] = useState(null);
  const [customStartYear, setCustomStartYear] = useState(year);
  const [customEndYear, setCustomEndYear] = useState(year);
  const [resolutionMethod, setResolutionMethod] = useState('adjust');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with the first period if available
  useEffect(() => {
    if (conflictingPeriods.length > 0) {
      setSelectedResolution(0);
    }
  }, [conflictingPeriods]);

  // Get the maximum year from all periods
  const getMaxYear = () => {
    if (!conflictingPeriods || conflictingPeriods.length === 0) return year;

    return Math.max(...conflictingPeriods.map(period => period.end || 0));
  };

  // Handle resolution method change
  const handleMethodChange = (method) => {
    setResolutionMethod(method);

    // Reset custom years when switching to 'adjust'
    if (method === 'adjust') {
      setCustomStartYear(year);
      setCustomEndYear(year);
    }
  };

  // Handle resolution submission
  const handleSubmit = () => {
    if (!onResolve) return;

    setIsSubmitting(true);

    try {
      let resolution;

      if (resolutionMethod === 'select') {
        // Keep one period, remove others
        resolution = {
          type: 'select',
          keepPeriodIndex: selectedResolution,
          paramId,
          scalingGroupId,
          year
        };
      } else if (resolutionMethod === 'adjust') {
        // Adjust period boundaries
        resolution = {
          type: 'adjust',
          adjustments: conflictingPeriods.map((period, index) => {
            // If this is the first period and year is at the start, adjust the end
            if (index === 0 && period.start === year) {
              return {
                ...period,
                end: year - 1
              };
            }
            // If this is the last period and year is at the end, adjust the start
            else if (index === conflictingPeriods.length - 1 && period.end === year) {
              return {
                ...period,
                start: year + 1
              };
            }
            // Otherwise split the period
            else {
              return {
                ...period,
                // If year is in the middle, split into two periods
                split: year
              };
            }
          }),
          paramId,
          scalingGroupId,
          year
        };
      } else if (resolutionMethod === 'custom') {
        // Custom adjustment
        resolution = {
          type: 'custom',
          customStart: customStartYear,
          customEnd: customEndYear,
          paramId,
          scalingGroupId,
          year
        };
      }

      onResolve(resolution);
    } catch (error) {
      console.error('Error resolving conflict:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If no conflicting periods, show a message
  if (!conflictingPeriods || conflictingPeriods.length === 0) {
    return (
      <div className="conflict-resolution-panel">
        <h3>No Conflicts Found</h3>
        <p>There are no conflicting efficacy periods for {paramId} (Scaling Group {scalingGroupId}) in year {year}.</p>
        <div className="resolution-actions">
          <button className="cancel-button" onClick={onCancel}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="conflict-resolution-panel">
      <h3>Resolve Conflict</h3>
      <div className="conflict-info">
        <p>
          <strong>Parameter:</strong> {paramId}
        </p>
        <p>
          <strong>Scaling Group:</strong> {scalingGroupId}
        </p>
        <p>
          <strong>Year:</strong> {year}
        </p>
        <p>
          <strong>Conflict:</strong> {conflictingPeriods.length} efficacy periods overlap for this parameter-scaling group-year combination
        </p>
      </div>

      <div className="resolution-methods">
        <div className="method-selector">
          <label>
            <input
              type="radio"
              name="resolution-method"
              value="select"
              checked={resolutionMethod === 'select'}
              onChange={() => handleMethodChange('select')}
            />
            Select one period to keep
          </label>

          <label>
            <input
              type="radio"
              name="resolution-method"
              value="adjust"
              checked={resolutionMethod === 'adjust'}
              onChange={() => handleMethodChange('adjust')}
            />
            Automatically adjust boundaries
          </label>

          <label>
            <input
              type="radio"
              name="resolution-method"
              value="custom"
              checked={resolutionMethod === 'custom'}
              onChange={() => handleMethodChange('custom')}
            />
            Custom adjustment
          </label>
        </div>

        {resolutionMethod === 'select' && (
          <div className="select-method">
            <h4>Select Period to Keep</h4>
            <div className="period-list">
              {conflictingPeriods.map((period, index) => (
                <div 
                  key={`period-${index}`}
                  className={`period-item ${selectedResolution === index ? 'selected' : ''}`}
                  onClick={() => setSelectedResolution(index)}
                >
                  <div className="period-radio">
                    <input
                      type="radio"
                      name="selected-period"
                      checked={selectedResolution === index}
                      onChange={() => setSelectedResolution(index)}
                    />
                  </div>
                  <div className="period-details">
                    <div className="period-range">
                      Years {period.start} - {period.end}
                    </div>
                    {period.value !== undefined && (
                      <div className="period-value">
                        Value: {period.value}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {resolutionMethod === 'adjust' && (
          <div className="adjust-method">
            <h4>Automatic Boundary Adjustment</h4>
            <p>
              This will automatically adjust the boundaries of overlapping periods to eliminate the conflict.
            </p>
            <div className="adjustment-preview">
              <h5>Preview of Adjustments:</h5>
              <ul>
                {conflictingPeriods.map((period, index) => {
                  let adjustmentText = '';

                  // If this is the first period and year is at the start, adjust the end
                  if (index === 0 && period.start === year) {
                    adjustmentText = `End year will change from ${period.end} to ${year - 1}`;
                  }
                  // If this is the last period and year is at the end, adjust the start
                  else if (index === conflictingPeriods.length - 1 && period.end === year) {
                    adjustmentText = `Start year will change from ${period.start} to ${year + 1}`;
                  }
                  // Otherwise split the period
                  else {
                    adjustmentText = `Period will be split at year ${year}`;
                  }

                  return (
                    <li key={`adjustment-${index}`}>
                      Period {index + 1} (Years {period.start}-{period.end}): {adjustmentText}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {resolutionMethod === 'custom' && (
          <div className="custom-method">
            <h4>Custom Adjustment</h4>
            <p>
              Manually adjust the efficacy period boundaries to resolve the conflict.
            </p>
            <div className="custom-inputs">
              <div className="input-group">
                <label htmlFor="custom-start">Start Year:</label>
                <input
                  id="custom-start"
                  type="number"
                  min="1"
                  max={getMaxYear()}
                  value={customStartYear}
                  onChange={(e) => setCustomStartYear(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="custom-end">End Year:</label>
                <input
                  id="custom-end"
                  type="number"
                  min={customStartYear}
                  max={getMaxYear()}
                  value={customEndYear}
                  onChange={(e) => setCustomEndYear(parseInt(e.target.value) || customStartYear)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="resolution-actions">
        <button 
          className="cancel-button" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button 
          className="resolve-button" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Resolving...' : 'Apply Resolution'}
        </button>
      </div>
    </div>
  );
};

export default ConflictResolutionPanel;
