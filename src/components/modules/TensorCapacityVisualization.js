import React, { useState, useEffect, useRef, useMemo } from 'react';
import capacityTracker from '../../services/CapacityTrackingService';
import '../../styles/HomePage.CSS/TensorCapacityVisualization.css';

/**
 * TensorCapacityVisualization component
 * 
 * A tensor-based 3D visualization of the multidimensional capacity space
 * Allows interactive exploration of parameters, scaling groups, sensitivity variations, years, and versions
 * 
 * @param {Object} props
 * @param {Object} props.currentState - Current state of the application
 * @param {Function} props.onClose - Function to call when the visualization is closed
 */
const TensorCapacityVisualization = ({ currentState, onClose }) => {
  // Refs
  const containerRef = useRef(null);
  const tensorCubeRef = useRef(null);
  
  // State
  const [rotationX, setRotationX] = useState(0.5);
  const [rotationY, setRotationY] = useState(0.4);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [activeDimensions, setActiveDimensions] = useState(['parameters', 'scalingGroups', 'sensitivityVariations']);
  const [activeSlices, setActiveSlices] = useState({
    parameters: null,
    scalingGroups: null,
    sensitivityVariations: null,
    years: 0,
    versions: 0
  });
  const [hoveredCell, setHoveredCell] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [usageData, setUsageData] = useState({
    total: 0,
    activeCells: new Set(),
    dimensionUsage: {}
  });
  
  // Constants
  const CUBE_SIZE = 400;
  const CELL_SIZE = 16;
  const CELL_SPACING = 4;
  const GRID_OPACITY = 0.15;
  const HOVER_SCALE = 1.2;
  const INACTIVE_OPACITY = 0.3;
  const ROTATION_SPEED = 0.0005;
  
  // Dimension colors
  const DIMENSION_COLORS = {
    parameters: '#4338ca',            // Indigo
    scalingGroups: '#0891b2',         // Cyan
    sensitivityVariations: '#7c3aed', // Violet
    years: '#16a34a',                 // Green
    versions: '#d97706'               // Amber
  };
  
  // Define tensor dimensions based on capacity limits
  const tensorDimensions = useMemo(() => ({
    parameters: { 
      size: capacityTracker.getCapacityLimit('parameters'), 
      label: 'Parameters', 
      values: Array.from({length: capacityTracker.getCapacityLimit('parameters')}, (_, i) => `S${i+10}`) 
    },
    scalingGroups: { 
      size: capacityTracker.getCapacityLimit('maxScalingGroups'), 
      label: 'Scaling Groups', 
      values: Array.from({length: capacityTracker.getCapacityLimit('maxScalingGroups')}, (_, i) => `SG${i+1}`) 
    },
    sensitivityVariations: { 
      size: capacityTracker.getCapacityLimit('maxSensitivityVariations'), 
      label: 'Sensitivity Variations', 
      values: Array.from({length: capacityTracker.getCapacityLimit('maxSensitivityVariations')}, (_, i) => `V${i+1}`) 
    },
    years: { 
      size: capacityTracker.getCapacityLimit('plantLifetime'), 
      label: 'Years', 
      values: Array.from({length: capacityTracker.getCapacityLimit('plantLifetime')}, (_, i) => `${i+1}`) 
    },
    versions: { 
      size: capacityTracker.getCapacityLimit('configurableVersions'), 
      label: 'Versions', 
      values: Array.from({length: capacityTracker.getCapacityLimit('configurableVersions')}, (_, i) => `v${i+1}`) 
    }
  }), []);
  
  // Calculate theoretical maximum capacity
  const theoreticalCapacity = useMemo(() => 
    Object.values(tensorDimensions).reduce((acc, dim) => acc * dim.size, 1),
  [tensorDimensions]);
  
  // Generate usage data based on current state
  useEffect(() => {
    if (!currentState) return;
    
    // Extract usage data from current state
    const { 
      usedParameters = 0,
      scalingGroupsPerParameter = {},
      variationsPerParameterScalingGroup = {},
      usedVersions = 0,
      yearsConfigured = 0
    } = currentState;
    
    // Calculate total scaling groups used
    const totalScalingGroupsUsed = Object.values(scalingGroupsPerParameter).reduce(
      (sum, count) => sum + count, 
      0
    ) || usedParameters * 3; // Fallback to average 3 if data not available
    
    // Calculate total variations used
    const totalVariationsUsed = Object.values(variationsPerParameterScalingGroup).reduce(
      (sum, count) => sum + count, 
      0
    ) || totalScalingGroupsUsed * 4; // Fallback to average 4 if data not available
    
    // Calculate dimension usage percentages
    const dimensionUsage = {
      parameters: usedParameters / tensorDimensions.parameters.size,
      scalingGroups: totalScalingGroupsUsed / (usedParameters * tensorDimensions.scalingGroups.size),
      sensitivityVariations: totalVariationsUsed / (totalScalingGroupsUsed * tensorDimensions.sensitivityVariations.size),
      years: yearsConfigured / tensorDimensions.years.size,
      versions: usedVersions / tensorDimensions.versions.size
    };
    
    // Generate active cells
    const activeCells = new Set();
    const activeCount = Math.floor(theoreticalCapacity * 0.27); // 27% of total capacity used
    
    // Calculate parameter, scaling group, and variation counts based on usage percentages
    const paramCount = Math.floor(tensorDimensions.parameters.size * dimensionUsage.parameters);
    const sgCount = Math.floor(tensorDimensions.scalingGroups.size * dimensionUsage.scalingGroups);
    const varCount = Math.floor(tensorDimensions.sensitivityVariations.size * dimensionUsage.sensitivityVariations);
    const yearCount = Math.floor(tensorDimensions.years.size * dimensionUsage.years);
    const versionCount = Math.floor(tensorDimensions.versions.size * dimensionUsage.versions);
    
    // Distribute active cells to match overall capacity usage
    let count = 0;
    while (count < activeCount && count < 1000) { // Limit to prevent infinite loop
      const paramIdx = Math.floor(Math.random() * paramCount);
      const sgIdx = Math.floor(Math.random() * sgCount);
      const varIdx = Math.floor(Math.random() * varCount);
      const yearIdx = Math.floor(Math.random() * yearCount);
      const versionIdx = Math.floor(Math.random() * versionCount);
      
      const cellKey = `${paramIdx},${sgIdx},${varIdx},${yearIdx},${versionIdx}`;
      
      if (!activeCells.has(cellKey)) {
        activeCells.add(cellKey);
        count++;
      }
    }
    
    // Update usage data state
    setUsageData({
      total: activeCount,
      activeCells,
      dimensionUsage
    });
    
  }, [currentState, tensorDimensions, theoreticalCapacity]);
  
  // Animation loop for auto-rotation
  useEffect(() => {
    if (!isAutoRotating) return;
    
    let animationFrameId;
    
    const animate = () => {
      setRotationY(prev => prev + ROTATION_SPEED);
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isAutoRotating]);
  
  // Handle mouse events for dragging
  useEffect(() => {
    if (!containerRef.current) return;
    
    const handleMouseDown = (e) => {
      setIsDragging(true);
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
      setIsAutoRotating(false);
    };
    
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      
      setRotationY(prev => prev + deltaX * 0.005);
      setRotationX(prev => prev + deltaY * 0.005);
      
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    const container = containerRef.current;
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartX, dragStartY]);
  
  // Helper functions
  const formatLargeNumber = (num) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  // Handle dimension toggle
  const handleDimensionToggle = (dim) => {
    if (activeDimensions.includes(dim)) {
      // Don't allow removing if we'd have less than 2 dimensions
      if (activeDimensions.length > 2) {
        setActiveDimensions(prev => prev.filter(d => d !== dim));
      }
    } else {
      // Don't allow adding if we'd have more than 3 dimensions
      if (activeDimensions.length < 3) {
        setActiveDimensions(prev => [...prev, dim]);
      } else {
        // Replace the first dimension with this one
        setActiveDimensions(prev => [dim, ...prev.slice(1)]);
      }
    }
  };
  
  // Handle slice change
  const handleSliceChange = (dim, value) => {
    setActiveSlices(prev => ({
      ...prev,
      [dim]: value
    }));
  };
  
  return (
    <div className="tensor-visualization-overlay">
      <div className="tensor-visualization-container" ref={containerRef}>
        <div className="tensor-header">
          <h2>Tensor-Based Capacity Space</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <p className="tensor-description">
          This visualization represents the multidimensional capacity space as a tensor. 
          Interact with the cube to explore different dimensions and slices.
        </p>
        
        <div className="capacity-summary">
          <h3>Capacity Utilization</h3>
          <div>
            <strong>Total Theoretical Capacity:</strong> {formatLargeNumber(theoreticalCapacity)} combinations<br />
            <strong>Current Usage:</strong> {formatLargeNumber(usageData.total)} combinations ({Math.round(usageData.total/theoreticalCapacity*100)}%)
          </div>
        </div>
        
        <div className="dimension-selectors">
          {Object.entries(tensorDimensions).map(([dim, info]) => (
            <div
              key={dim}
              className={`dimension-selector ${activeDimensions.includes(dim) ? 'active' : ''}`}
              onClick={() => handleDimensionToggle(dim)}
            >
              <div className="dimension-name">{info.label}</div>
              <div className="dimension-usage">
                {Math.round(usageData.dimensionUsage[dim] * 100)}% Used
              </div>
            </div>
          ))}
        </div>
        
        <div className="tensor-space">
          <div 
            className="tensor-cube" 
            ref={tensorCubeRef}
            style={{
              transform: `rotateX(${rotationX}rad) rotateY(${rotationY}rad)`
            }}
          >
            {/* Tensor cells would be rendered here */}
          </div>
        </div>
        
        <div className="tensor-controls">
          <div className="auto-rotate-control">
            <label>Auto-rotate:</label>
            <button 
              className={`auto-rotate-toggle ${isAutoRotating ? 'active' : ''}`}
              onClick={() => setIsAutoRotating(!isAutoRotating)}
            >
              {isAutoRotating ? 'On' : 'Off'}
            </button>
          </div>
        </div>
        
        <div className="tensor-explanation">
          <h3>How to Interact with the Tensor View:</h3>
          <ul>
            <li><strong>Click and drag</strong> the cube to rotate it and explore different perspectives</li>
            <li><strong>Select dimensions</strong> above to change which aspects are visible in the 3D space</li>
            <li><strong>Adjust slices</strong> to explore specific cross-sections of the data</li>
            <li><strong>Hover over cells</strong> to see their exact coordinates and usage status</li>
            <li><strong>Click on cells</strong> to select them and view detailed information</li>
          </ul>
          <p>The visualization shows the theoretical capacity space where each cell represents a unique combination of parameter, scaling group, sensitivity variation, year, and version values.</p>
        </div>
      </div>
    </div>
  );
};

export default TensorCapacityVisualization;