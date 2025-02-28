import React, { useEffect, useRef, useState } from 'react';
import './InheritanceControl.css';

const InheritanceControl = ({ models, onUpdate }) => {
  const canvasRef = useRef(null);
  const [hoveredConnection, setHoveredConnection] = useState(null);
  const [activeConnection, setActiveConnection] = useState(null);

  useEffect(() => {
    drawInheritanceGraph();
  }, [models, hoveredConnection, activeConnection]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if mouse is near any connection line
      const connection = getConnectionAtPoint(x, y);
      setHoveredConnection(connection);
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const connection = getConnectionAtPoint(x, y);
      setActiveConnection(connection === activeConnection ? null : connection);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [activeConnection]);

  const getConnectionAtPoint = (x, y) => {
    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;
    
    const baseX = width / 2;
    const baseY = 40;
    const variant1X = width / 4;
    const variant2X = (width * 3) / 4;
    const variantY = height - 40;

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

  const isPointNearLine = (px, py, x1, y1, x2, y2) => {
    const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const distance = Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1) / lineLength;
    return distance < 5;
  };

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
    const baseY = 40;
    const variant1X = width / 4;
    const variant2X = (width * 3) / 4;
    const variantY = height - 40;

    // Draw connections with enhanced styling
    // Variant 1 connection
    const variant1Active = models.variant1.filters.cost || 
                         models.variant1.filters.time || 
                         models.variant1.filters.process;
    
    ctx.beginPath();
    ctx.strokeStyle = variant1Active ? '#3b82f6' : '#e2e8f0';
    ctx.lineWidth = hoveredConnection === 'variant1' ? 3 : 2;
    
    if (activeConnection === 'variant1') {
      ctx.setLineDash([5, 3]);
    } else {
      ctx.setLineDash([]);
    }
    
    ctx.moveTo(baseX, baseY + 20);
    ctx.lineTo(variant1X, variantY - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // Variant 2 connection
    const variant2Active = models.variant2.filters.cost || 
                         models.variant2.filters.time || 
                         models.variant2.filters.process;
    
    ctx.beginPath();
    ctx.strokeStyle = variant2Active ? '#3b82f6' : '#e2e8f0';
    ctx.lineWidth = hoveredConnection === 'variant2' ? 3 : 2;
    
    if (activeConnection === 'variant2') {
      ctx.setLineDash([5, 3]);
    } else {
      ctx.setLineDash([]);
    }
    
    ctx.moveTo(baseX, baseY + 20);
    ctx.lineTo(variant2X, variantY - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw connection highlights
    if (hoveredConnection) {
      const isVariant1 = hoveredConnection === 'variant1';
      const startX = baseX;
      const startY = baseY + 20;
      const endX = isVariant1 ? variant1X : variant2X;
      const endY = variantY - 20;
      
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 8;
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Draw filter indicators with enhanced visibility
    drawFilterIndicators(
      ctx, 
      baseX, 
      variant1X, 
      variant2X, 
      variantY, 
      models,
      hoveredConnection,
      activeConnection
    );
  };

  const drawFilterIndicators = (
    ctx, 
    baseX, 
    variant1X, 
    variant2X, 
    variantY, 
    models,
    hoveredConnection,
    activeConnection
  ) => {
    // Variant 1 Indicators with enhanced visibility
    if (models.variant1.departure > 0) {
      const isHighlighted = hoveredConnection === 'variant1' || activeConnection === 'variant1';
      drawDepartureLabel(
        ctx, 
        (baseX + variant1X) / 2, 
        (variantY - 60) / 2, 
        models.variant1.departure,
        isHighlighted
      );
    }

    const variant1Filters = Object.entries(models.variant1.filters)
      .filter(([_, active]) => active)
      .map(([type]) => type);

    if (variant1Filters.length > 0) {
      const isHighlighted = hoveredConnection === 'variant1' || activeConnection === 'variant1';
      drawFilterLabels(
        ctx, 
        (baseX + variant1X) / 2 - 40, 
        (variantY - 60) / 2 + 20, 
        variant1Filters,
        isHighlighted
      );
    }

    // Variant 2 Indicators with enhanced visibility
    if (models.variant2.departure > 0) {
      const isHighlighted = hoveredConnection === 'variant2' || activeConnection === 'variant2';
      drawDepartureLabel(
        ctx, 
        (baseX + variant2X) / 2, 
        (variantY - 60) / 2, 
        models.variant2.departure,
        isHighlighted
      );
    }

    const variant2Filters = Object.entries(models.variant2.filters)
      .filter(([_, active]) => active)
      .map(([type]) => type);

    if (variant2Filters.length > 0) {
      const isHighlighted = hoveredConnection === 'variant2' || activeConnection === 'variant2';
      drawFilterLabels(
        ctx, 
        (baseX + variant2X) / 2 + 40, 
        (variantY - 60) / 2 + 20, 
        variant2Filters,
        isHighlighted
      );
    }
  };

  const drawDepartureLabel = (ctx, x, y, departure, isHighlighted) => {
    ctx.save();
    if (isHighlighted) {
      // Draw highlight background
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.beginPath();
      ctx.roundRect(x - 20, y - 10, 40, 20, 4);
      ctx.fill();
    }
    
    ctx.fillStyle = isHighlighted ? '#2563eb' : '#3b82f6';
    ctx.font = `${isHighlighted ? 'bold ' : ''}12px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(`${departure}%`, x, y);
    ctx.restore();
  };

  const drawFilterLabels = (ctx, x, y, filters, isHighlighted) => {
    ctx.save();
    filters.forEach((filter, index) => {
      const yPos = y + (index * 16);
      
      if (isHighlighted) {
        // Draw highlight background
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        const label = filter.charAt(0).toUpperCase() + filter.slice(1);
        const labelWidth = ctx.measureText(label).width;
        ctx.beginPath();
        ctx.roundRect(x - 4, yPos - 8, labelWidth + 8, 16, 4);
        ctx.fill();
      }
      
      ctx.fillStyle = isHighlighted ? '#2563eb' : '#64748b';
      ctx.font = `${isHighlighted ? 'bold ' : ''}11px system-ui`;
      const label = filter.charAt(0).toUpperCase() + filter.slice(1);
      ctx.fillText(label, x, yPos);
    });
    ctx.restore();
  };

  return (
    <div className="inheritance-control">
      <canvas 
        ref={canvasRef}
        width={400}
        height={200}
        className="inheritance-canvas"
      />
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
          Hover over connections to see details
        </div>
      </div>
    </div>
  );
};

export default InheritanceControl;
