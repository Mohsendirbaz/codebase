import React, { useState, useEffect, useRef } from 'react';
import './EnhancedInheritanceControl.css';
import { useVersionState } from '../../contexts/VersionStateContext';
import axios from 'axios';

/**
 * EnhancedInheritanceControl Component
 * 
 * An advanced version of InheritanceControl that visualizes parameter inheritance relationships,
 * historical evolution, and configuration hierarchies. This component fulfills the financial
 * literacy mission by demonstrating how parameters relate and propagate through models.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.models - Model configurations with inheritance relationships
 * @param {Function} props.onUpdate - Callback for updating model configurations
 * @param {Object} props.propertyMapping - Property mapping information from useFormValues
 * @param {Object} props.formValues - Current form values from useFormValues
 */
const EnhancedInheritanceControl = ({ 
  models = {
    base: { filters: {}, departure: 0, priority: 'high' },
    variant1: { filters: {}, departure: 0, priority: 'medium' },
    variant2: { filters: {}, departure: 0, priority: 'low' }
  }, 
  onUpdate,
  propertyMapping = {},
  formValues = {}
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { version } = useVersionState();
  
  // State management
  const [hoveredConnection, setHoveredConnection] = useState(null);
  const [activeConnection, setActiveConnection] = useState(null);
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [parameterHistory, setParameterHistory] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [configTree, setConfigTree] = useState(null);
  const [viewMode, setViewMode] = useState('inheritance'); // 'inheritance', 'parameters', 'history'
  const [parameterRelationships, setParameterRelationships] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Load parameter relationships on mount
  useEffect(() => {
    fetchParameterRelationships();
  }, []);
  
  // Update configuration tree when models change
  useEffect(() => {
    generateConfigTree();
  }, [models]);
  
  // Fetch configuration hierarchy from the backend
  const fetchConfigurationHierarchy = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/configuration/hierarchy');
      setConfigTree(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching configuration hierarchy:', error);
      setLoading(false);
    }
  };
  
  // Simulate fetching parameter relationships
  // In a real implementation, this would come from the backend
  const fetchParameterRelationships = () => {
    setLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // These relationships show how parameters affect each other
      const relationships = {
        // Financial parameters
        "bECAmount11": ["initialSellingPriceAmount13", "totalOperatingCostPercentageAmount14"],
        "initialSellingPriceAmount13": ["iRRAmount30"],
        "annualInterestRateAmount31": ["interestProportionAmount24", "principalProportionAmount25"],
        "stateTaxRateAmount32": ["federalTaxRateAmount33"],
        "federalTaxRateAmount33": ["iRRAmount30"],
        
        // Operational parameters
        "plantLifetimeAmount10": ["depreciationMethodAmount20", "iRRAmount30"],
        "numberOfUnitsAmount12": ["bECAmount11", "initialSellingPriceAmount13"],
        "rawmaterialAmount34": ["totalOperatingCostPercentageAmount14"],
        "laborAmount35": ["totalOperatingCostPercentageAmount14"],
        "utilityAmount36": ["totalOperatingCostPercentageAmount14"],
        
        // Project parameters
        "engineering_Procurement_and_Construction_EPC_Amount15": ["bECAmount11"],
        "process_contingency_PC_Amount16": ["bECAmount11"],
        "project_Contingency_PT_BEC_EPC_PCAmount17": ["bECAmount11"],
      };
      
      setParameterRelationships(relationships);
      setLoading(false);
    }, 500);
  };
  
  // Simulate fetching parameter history
  const fetchParameterHistory = (parameterId) => {
    setLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // This would typically come from the backend
      const history = {
        values: [
          { timestamp: new Date('2025-01-05').getTime(), value: getBaseValue(parameterId) * 0.85, model: "base", version: "1.0" },
          { timestamp: new Date('2025-01-15').getTime(), value: getBaseValue(parameterId) * 0.9, model: "base", version: "1.1" },
          { timestamp: new Date('2025-02-01').getTime(), value: getBaseValue(parameterId), model: "base", version: "1.2" },
          { timestamp: new Date('2025-02-10').getTime(), value: getBaseValue(parameterId) * 1.1, model: "variant1", version: "1.0" },
          { timestamp: new Date('2025-02-20').getTime(), value: getBaseValue(parameterId) * 1.2, model: "variant2", version: "1.0" },
          { timestamp: new Date('2025-03-01').getTime(), value: getBaseValue(parameterId) * 1.15, model: "variant1", version: "1.1" },
        ],
        changes: [
          { timestamp: new Date('2025-01-15').getTime(), reason: "Baseline adjustment", author: "System" },
          { timestamp: new Date('2025-02-01').getTime(), reason: "Market data update", author: "User" },
          { timestamp: new Date('2025-02-10').getTime(), reason: "Cost variant creation", author: "User" },
          { timestamp: new Date('2025-02-20').getTime(), reason: "Brand variant creation", author: "User" },
          { timestamp: new Date('2025-03-01').getTime(), reason: "Optimization adjustment", author: "System" },
        ]
      };
      
      setParameterHistory({
        ...parameterHistory,
        [parameterId]: history
      });
      
      setLoading(false);
      setShowHistory(true);
    }, 300);
  };
  
  // Helper function to get base value for a parameter
  const getBaseValue = (parameterId) => {
    if (formValues[parameterId] && formValues[parameterId].value !== undefined) {
      return formValues[parameterId].value;
    }
    
    // Default fallback values for simulation
    const defaults = {
      "bECAmount11": 200000,
      "numberOfUnitsAmount12": 30000,
      "initialSellingPriceAmount13": 2,
      "plantLifetimeAmount10": 20,
      "annualInterestRateAmount31": 0.04,
      "iRRAmount30": 0.05,
    };
    
    return defaults[parameterId] || 1;
  };
  
  // Generate configuration tree from models
  const generateConfigTree = () => {
    if (!models) return;
    
    // Create tree representation of inheritance hierarchy
    const tree = {
      id: 'base',
      name: 'Base Model',
      filters: models.base?.filters || {},
      children: [
        {
          id: 'variant1',
          name: 'Core Cost',
          parent: 'base',
          overrides: getParameterOverrides('variant1', 'base'),
          filters: models.variant1?.filters || {},
          children: []
        },
        {
          id: 'variant2',
          name: 'Brand Cost',
          parent: 'base',
          overrides: getParameterOverrides('variant2', 'base'),
          filters: models.variant2?.filters || {},
          children: []
        }
      ]
    };
    
    setConfigTree(tree);
  };
  
  // Get parameter overrides between two models
  const getParameterOverrides = (childModel, parentModel) => {
    // This would typically come from the backend
    // Simulating some overrides for demonstration
    return {
      "initialSellingPriceAmount13": { parentValue: 2, childValue: 2.2 },
      "rawmaterialAmount34": { parentValue: 10000, childValue: 11000 },
      "laborAmount35": { parentValue: 24000, childValue: 25000 }
    };
  };
  
  // Update canvas when component changes
  useEffect(() => {
    switch (viewMode) {
      case 'inheritance':
        drawInheritanceGraph();
        break;
      case 'parameters':
        drawParameterRelationships();
        break;
      case 'history':
        drawParameterHistory();
        break;
      default:
        drawInheritanceGraph();
    }
  }, [models, hoveredConnection, activeConnection, viewMode, selectedParameter, parameterHistory, showHistory, parameterRelationships]);
  
  // Handle mouse interactions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (viewMode === 'inheritance') {
        // Check if mouse is near any connection line
        const connection = getConnectionAtPoint(x, y);
        setHoveredConnection(connection);
      } else if (viewMode === 'parameters') {
        // Check if mouse is near any parameter node
        const parameter = getParameterAtPoint(x, y);
        if (parameter !== hoveredConnection) {
          setHoveredConnection(parameter);
        }
      }
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (viewMode === 'inheritance') {
        const connection = getConnectionAtPoint(x, y);
        setActiveConnection(connection === activeConnection ? null : connection);
      } else if (viewMode === 'parameters') {
        const parameter = getParameterAtPoint(x, y);
        if (parameter) {
          setSelectedParameter(parameter);
          fetchParameterHistory(parameter);
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [viewMode, activeConnection, hoveredConnection]);
  
  // Helper functions for interactions
  const getConnectionAtPoint = (x, y) => {
    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;
    
    const baseX = width / 2;
    const baseY = 80;
    const variant1X = width / 4;
    const variant2X = (width * 3) / 4;
    const variantY = height - 80;

    // Check variant1 connection
    if (isPointNearLine(x, y, baseX, baseY + 20, variant1X, variantY - 20)) {
      return 'variant1';
    }
    
    // Check variant2 connection
    if (isPointNearLine(x, y, baseX, baseY + 20, variant2X, variantY - 20)) {
      return 'variant2';
    }

    return null;
  };
  
  const getParameterAtPoint = (x, y) => {
    // This would need to check all parameter nodes drawn on the canvas
    // For now, we'll use a simple proximity check for demo purposes
    const parameters = Object.keys(parameterRelationships);
    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;
    
    // Layout parameters in a grid
    const cols = 3;
    const rows = Math.ceil(parameters.length / cols);
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    for (let i = 0; i < parameters.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const centerX = col * cellWidth + cellWidth / 2;
      const centerY = row * cellHeight + cellHeight / 2;
      
      // Check if point is near the parameter node
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distance < 30) {
        return parameters[i];
      }
    }
    
    return null;
  };

  const isPointNearLine = (px, py, x1, y1, x2, y2) => {
    const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const distance = Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1) / lineLength;
    return distance < 10;
  };

  // Rendering functions
  const drawInheritanceGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate positions
    const baseX = width / 2;
    const baseY = 80;
    const variant1X = width / 4;
    const variant2X = (width * 3) / 4;
    const variantY = height - 80;

    // Draw base model node
    drawModelNode(ctx, baseX, baseY, 'Base Model', models.base);

    // Draw variant models
    drawModelNode(ctx, variant1X, variantY, 'Core Cost', models.variant1);
    drawModelNode(ctx, variant2X, variantY, 'Brand Cost', models.variant2);

    // Draw connections with enhanced styling
    drawConnection(ctx, baseX, baseY + 20, variant1X, variantY - 20, 'variant1', models.variant1);
    drawConnection(ctx, baseX, baseY + 20, variant2X, variantY - 20, 'variant2', models.variant2);

    // Draw inheritance details
    drawInheritanceDetails(ctx, baseX, variant1X, variant2X, variantY, models);
  };
  
  const drawModelNode = (ctx, x, y, name, model) => {
    const radius = 50;
    
    // Draw outer circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw inner circle
    ctx.beginPath();
    ctx.arc(x, y, radius - 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    // Draw priority indicator
    if (model && model.priority) {
      const priorityColors = {
        high: '#10b981',
        medium: '#f59e0b',
        low: '#ef4444'
      };
      
      ctx.beginPath();
      ctx.arc(x, y - radius + 10, 5, 0, Math.PI * 2);
      ctx.fillStyle = priorityColors[model.priority] || '#64748b';
      ctx.fill();
    }
    
    // Draw model name
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x, y);
    
    // Draw model filters if any
    if (model && model.filters) {
      const activeFilters = Object.entries(model.filters)
        .filter(([_, active]) => active)
        .map(([type]) => type);
      
      if (activeFilters.length > 0) {
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#64748b';
        activeFilters.forEach((filter, index) => {
          ctx.fillText(filter.charAt(0).toUpperCase() + filter.slice(1), x, y + 15 + index * 12);
        });
      }
    }
  };
  
  const drawConnection = (ctx, startX, startY, endX, endY, connectionId, model) => {
    const isHovered = hoveredConnection === connectionId;
    const isActive = activeConnection === connectionId;
    const hasActiveFilters = model && Object.values(model.filters).some(v => v);
    
    // Draw connection line
    ctx.beginPath();
    ctx.strokeStyle = hasActiveFilters ? '#3b82f6' : '#e2e8f0';
    ctx.lineWidth = isHovered ? 3 : 2;
    
    if (isActive) {
      ctx.setLineDash([5, 3]);
    } else {
      ctx.setLineDash([]);
    }
    
    // Draw a bezier curve instead of straight line
    const controlPointX = (startX + endX) / 2;
    const controlPointY = (startY + endY) / 2 - 50;
    
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(controlPointX, controlPointY, endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw connection highlight for hover
    if (isHovered) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 8;
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlPointX, controlPointY, endX, endY);
      ctx.stroke();
    }
    
    // Draw inheritance strength indicator
    if (model && model.departure > 0) {
      const pointX = controlPointX;
      const pointY = controlPointY;
      
      ctx.beginPath();
      ctx.arc(pointX, pointY, 15, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? 'rgba(59, 130, 246, 0.1)' : 'rgba(241, 245, 249, 0.8)';
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.fillStyle = isHovered ? '#2563eb' : '#64748b';
      ctx.font = `${isHovered ? 'bold ' : ''}10px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${model.departure}%`, pointX, pointY);
    }
  };
  
  const drawInheritanceDetails = (ctx, baseX, variant1X, variant2X, variantY, models) => {
    if (activeConnection) {
      const isVariant1 = activeConnection === 'variant1';
      const variant = isVariant1 ? models.variant1 : models.variant2;
      const variantX = isVariant1 ? variant1X : variant2X;
      
      // Draw details panel
      const panelX = (baseX + variantX) / 2;
      const panelY = (variantY - 80) / 2;
      const panelWidth = 180;
      const panelHeight = 120;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      
      // Draw panel with rounded corners
      ctx.beginPath();
      ctx.roundRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 8);
      ctx.fill();
      ctx.stroke();
      
      // Draw panel title
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${isVariant1 ? 'Core Cost' : 'Brand Cost'} Inheritance`, panelX, panelY - panelHeight / 2 + 15);
      
      // Draw inheritance details
      ctx.font = '11px system-ui';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      
      // Draw inherited parameters
      let y = panelY - panelHeight / 2 + 35;
      ctx.fillText('Inherited Parameters:', panelX - panelWidth / 2 + 10, y);
      y += 15;
      
      // Sample inherited parameters for demo
      const inheritedParams = [
        'Plant Lifetime',
        'Depreciation Method',
        'Federal Tax Rate'
      ];
      
      inheritedParams.forEach(param => {
        ctx.fillText(`• ${param}`, panelX - panelWidth / 2 + 15, y);
        y += 15;
      });
      
      // Draw overridden parameters
      y += 5;
      ctx.fillStyle = '#2563eb';
      ctx.fillText('Overridden Parameters:', panelX - panelWidth / 2 + 10, y);
      y += 15;
      
      // Sample overridden parameters for demo
      const overriddenParams = isVariant1 ? ['Selling Price', 'Labor Cost'] : ['Raw Material', 'Utility Cost', 'Selling Price'];
      
      overriddenParams.forEach(param => {
        ctx.fillText(`• ${param}`, panelX - panelWidth / 2 + 15, y);
        y += 15;
      });
    }
  };
  
  const drawParameterRelationships = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Parameter Relationship Map', width / 2, 20);
    
    const parameters = Object.keys(parameterRelationships);
    
    // Skip if no parameters
    if (parameters.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px system-ui';
      ctx.fillText('No parameter relationships available', width / 2, height / 2);
      return;
    }
    
    // Layout parameters in a grid
    const cols = 3;
    const rows = Math.ceil(parameters.length / cols);
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    // Draw parameter nodes
    const nodePositions = {};
    
    parameters.forEach((parameter, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = col * cellWidth + cellWidth / 2;
      const y = row * cellHeight + cellHeight / 2 + 30; // +30 for title offset
      
      nodePositions[parameter] = { x, y };
      
      drawParameterNode(ctx, x, y, parameter, parameter === hoveredConnection, parameter === selectedParameter);
    });
    
    // Draw relationships
    for (const [source, targets] of Object.entries(parameterRelationships)) {
      if (nodePositions[source]) {
        for (const target of targets) {
          if (nodePositions[target]) {
            drawRelationship(ctx, nodePositions[source], nodePositions[target]);
          }
        }
      }
    }
  };
  
  const drawParameterNode = (ctx, x, y, parameterId, isHovered, isSelected) => {
    const label = propertyMapping[parameterId] || parameterId;
    const radius = isHovered || isSelected ? 30 : 25;
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    // Fill based on state
    if (isSelected) {
      ctx.fillStyle = '#3b82f6';
    } else if (isHovered) {
      ctx.fillStyle = '#93c5fd';
    } else {
      ctx.fillStyle = '#e2e8f0';
    }
    
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = isSelected ? '#1e40af' : '#cbd5e1';
    ctx.lineWidth = isHovered || isSelected ? 2 : 1;
    ctx.stroke();
    
    // Draw label
    ctx.fillStyle = isSelected ? '#ffffff' : '#1e293b';
    ctx.font = `${isHovered || isSelected ? 'bold ' : ''}10px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Truncate label if too long
    const shortLabel = parameterId.replace(/^(\w+)Amount\d+$/, '$1');
    ctx.fillText(shortLabel, x, y);
    
    // Draw tooltip for full name on hover
    if (isHovered) {
      const tooltipY = y - radius - 15;
      const tooltipText = label;
      const tooltipWidth = ctx.measureText(tooltipText).width + 16;
      
      // Draw tooltip background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(x - tooltipWidth / 2, tooltipY - 10, tooltipWidth, 20, 4);
      ctx.fill();
      
      // Draw tooltip text
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px system-ui';
      ctx.fillText(tooltipText, x, tooltipY);
    }
  };
  
  const drawRelationship = (ctx, source, target) => {
    // Draw arrow from source to target
    const headlen = 10;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const angle = Math.atan2(dy, dx);
    
    // Calculate points to start and end the line (adjusted by the node radius)
    const sourceRadius = 25;
    const targetRadius = 25;
    
    const startX = source.x + sourceRadius * Math.cos(angle);
    const startY = source.y + sourceRadius * Math.sin(angle);
    
    const endX = target.x - targetRadius * Math.cos(angle);
    const endY = target.y - targetRadius * Math.sin(angle);
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
  };
  
  const drawParameterHistory = () => {
    if (!selectedParameter || !parameterHistory[selectedParameter]) {
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw title
    const paramName = propertyMapping[selectedParameter] || selectedParameter;
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Parameter History: ${paramName}`, width / 2, 20);
    
    const history = parameterHistory[selectedParameter];
    if (!history || !history.values || history.values.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px system-ui';
      ctx.fillText('No historical data available', width / 2, height / 2);
      return;
    }
    
    // Sort values by timestamp
    const sortedValues = [...history.values].sort((a, b) => a.timestamp - b.timestamp);
    
    // Find min and max values for scaling
    const values = sortedValues.map(v => v.value);
    const minValue = Math.min(...values) * 0.95;
    const maxValue = Math.max(...values) * 1.05;
    
    // Calculate chart dimensions
    const chartLeft = 60;
    const chartRight = width - 20;
    const chartTop = 60;
    const chartBottom = height - 60;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartTop);
    ctx.lineTo(chartLeft, chartBottom);
    ctx.lineTo(chartRight, chartBottom);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw vertical gridlines and labels
    const valueStep = (maxValue - minValue) / 4;
    
    for (let i = 0; i <= 4; i++) {
      const value = minValue + i * valueStep;
      const y = chartBottom - (value - minValue) / (maxValue - minValue) * chartHeight;
      
      // Draw gridline
      ctx.beginPath();
      ctx.moveTo(chartLeft - 5, y);
      ctx.lineTo(chartRight, y);
      ctx.strokeStyle = i === 0 ? '#cbd5e1' : '#e2e8f0';
      ctx.lineWidth = i === 0 ? 1 : 0.5;
      ctx.stroke();
      
      // Draw value label
      ctx.fillStyle = '#64748b';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(value.toLocaleString('en-US', { maximumFractionDigits: 2 }), chartLeft - 10, y);
    }
    
    // Draw line connecting data points
    ctx.beginPath();
    sortedValues.forEach((dataPoint, index) => {
      const x = chartLeft + (dataPoint.timestamp - sortedValues[0].timestamp) / 
               (sortedValues[sortedValues.length - 1].timestamp - sortedValues[0].timestamp) * chartWidth;
      const y = chartBottom - (dataPoint.value - minValue) / (maxValue - minValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw data points
    sortedValues.forEach((dataPoint, index) => {
      const x = chartLeft + (dataPoint.timestamp - sortedValues[0].timestamp) / 
               (sortedValues[sortedValues.length - 1].timestamp - sortedValues[0].timestamp) * chartWidth;
      const y = chartBottom - (dataPoint.value - minValue) / (maxValue - minValue) * chartHeight;
      
      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Draw model indicator
      const modelColor = dataPoint.model === 'base' ? '#64748b' : 
                         dataPoint.model === 'variant1' ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(x, y - 12, 3, 0, Math.PI * 2);
      ctx.fillStyle = modelColor;
      ctx.fill();
      
      // Draw value tooltip (only for first and last points)
      if (index === 0 || index === sortedValues.length - 1) {
        const tooltipX = index === 0 ? x + 10 : x - 10;
        const tooltipText = dataPoint.value.toLocaleString('en-US', { maximumFractionDigits: 2 });
        
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = index === 0 ? 'left' : 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(tooltipText, tooltipX, y - 12);
      }
    });
    
    // Draw time axis
    const timeFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    
    sortedValues.forEach((dataPoint, index) => {
      if (index % 2 === 0 || index === sortedValues.length - 1) {
        const x = chartLeft + (dataPoint.timestamp - sortedValues[0].timestamp) / 
                 (sortedValues[sortedValues.length - 1].timestamp - sortedValues[0].timestamp) * chartWidth;
        
        // Draw tick
        ctx.beginPath();
        ctx.moveTo(x, chartBottom);
        ctx.lineTo(x, chartBottom + 5);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw date label
        const date = new Date(dataPoint.timestamp);
        ctx.fillStyle = '#64748b';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(timeFormat.format(date), x, chartBottom + 8);
      }
    });
    
    // Draw legend
    const legendX = width - 150;
    const legendY = chartTop + 20;
    
    // Draw background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.roundRect(legendX - 10, legendY - 10, 140, 80, 4);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw legend items
    const models = [
      { name: 'Base Model', color: '#64748b' },
      { name: 'Core Cost', color: '#10b981' },
      { name: 'Brand Cost', color: '#f59e0b' }
    ];
    
    models.forEach((model, index) => {
      const itemY = legendY + index * 20;
      
      // Draw color indicator
      ctx.beginPath();
      ctx.arc(legendX, itemY, 5, 0, Math.PI * 2);
      ctx.fillStyle = model.color;
      ctx.fill();
      
      // Draw model name
      ctx.fillStyle = '#1e293b';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(model.name, legendX + 10, itemY);
    });
  };
  
  // Component rendering
  return (
    <div className="enhanced-inheritance-control" ref={containerRef}>
      <div className="view-mode-tabs">
        <button 
          className={viewMode === 'inheritance' ? 'active' : ''}
          onClick={() => setViewMode('inheritance')}
        >
          Inheritance
        </button>
        <button 
          className={viewMode === 'parameters' ? 'active' : ''}
          onClick={() => setViewMode('parameters')}
        >
          Parameters
        </button>
        {selectedParameter && (
          <button 
            className={viewMode === 'history' ? 'active' : ''}
            onClick={() => setViewMode('history')}
          >
            History
          </button>
        )}
      </div>
      
      <canvas 
        ref={canvasRef}
        width={800}
        height={400}
        className="inheritance-canvas"
      />
      
      <div className="inheritance-controls">
        {loading && (
          <div className="loading-indicator">
            <span>Loading data...</span>
          </div>
        )}
        
        {selectedParameter && (
          <div className="parameter-info">
            <h3>{propertyMapping[selectedParameter] || selectedParameter}</h3>
            {showHistory && parameterHistory[selectedParameter]?.changes && (
              <div className="change-history">
                <h4>Change History</h4>
                <ul>
                  {parameterHistory[selectedParameter].changes.map((change, index) => (
                    <li key={index}>
                      <span>{new Date(change.timestamp).toLocaleDateString()}</span>
                      <span>{change.reason}</span>
                      <span>by {change.author}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="inheritance-legend">
        <div className="legend-item">
          <div className="legend-color active"></div>
          <span>Active Inheritance</span>
        </div>
        <div className="legend-item">
          <div className="legend-color"></div>
          <span>Inactive Inheritance</span>
        </div>
        <div className="legend-tip">
          {viewMode === 'inheritance' && 'Click connections to see inheritance details'}
          {viewMode === 'parameters' && 'Click parameters to view history'}
          {viewMode === 'history' && 'Hover over points to see details'}
        </div>
      </div>
    </div>
  );
};

export default EnhancedInheritanceControl;
