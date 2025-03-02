import React, { useEffect, useRef } from 'react';
import './AnalysisChart.css';

const CHART_TYPES = {
  SENSITIVITY: 'sensitivity',
  DISTRIBUTION: 'distribution',
  TORNADO: 'tornado'
};

const AnalysisChart = ({ type, data, options = {} }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    switch (type) {
      case CHART_TYPES.SENSITIVITY:
        drawSensitivityChart(ctx, data, width, height, options);
        break;
      case CHART_TYPES.DISTRIBUTION:
        drawDistributionChart(ctx, data, width, height, options);
        break;
      case CHART_TYPES.TORNADO:
        drawTornadoChart(ctx, data, width, height, options);
        break;
      default:
        console.warn('Unknown chart type:', type);
    }
  }, [type, data, options]);

  const drawSensitivityChart = (ctx, data, width, height, options) => {
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding); // x-axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding); // y-axis
    ctx.stroke();

    // Draw data points
    if (!data?.values?.length) return;

    const xScale = chartWidth / (data.values.length - 1);
    const yScale = chartHeight / (Math.max(...data.values.map(v => Math.abs(v.impact))) * 2);

    // Draw zero line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.moveTo(padding, height / 2);
    ctx.lineTo(width - padding, height / 2);
    ctx.stroke();

    // Draw curve
    ctx.beginPath();
    ctx.strokeStyle = options.lineColor || '#3b82f6';
    ctx.lineWidth = 2;

    data.values.forEach((point, i) => {
      const x = padding + i * xScale;
      const y = height / 2 - point.impact * yScale;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    data.values.forEach((point, i) => {
      const x = padding + i * xScale;
      const y = height / 2 - point.impact * yScale;

      ctx.beginPath();
      ctx.fillStyle = options.pointColor || '#3b82f6';
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';

    // X-axis labels
    data.values.forEach((point, i) => {
      const x = padding + i * xScale;
      ctx.fillText(point.value.toFixed(1), x, height - padding + 20);
    });

    // Y-axis labels
    ctx.textAlign = 'right';
    const yStep = chartHeight / 4;
    for (let i = 0; i <= 4; i++) {
      const y = padding + i * yStep;
      const value = ((2 - i * 0.5) * 100).toFixed(0) + '%';
      ctx.fillText(value, padding - 10, y + 4);
    }
  };

  const drawDistributionChart = (ctx, data, width, height, options) => {
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    if (!data?.values?.length) return;

    // Calculate histogram
    const bins = 20;
    const values = data.values.map(v => v.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins;
    const histogram = new Array(bins).fill(0);

    values.forEach(value => {
      const binIndex = Math.min(bins - 1, Math.floor((value - min) / binWidth));
      histogram[binIndex]++;
    });

    const maxCount = Math.max(...histogram);
    const xScale = chartWidth / bins;
    const yScale = chartHeight / maxCount;

    // Draw bars
    histogram.forEach((count, i) => {
      const x = padding + i * xScale;
      const y = height - padding - count * yScale;
      const barHeight = count * yScale;

      ctx.fillStyle = options.barColor || 'rgba(59, 130, 246, 0.2)';
      ctx.fillRect(x, y, xScale - 1, barHeight);

      ctx.strokeStyle = options.barBorder || 'rgba(59, 130, 246, 0.5)';
      ctx.strokeRect(x, y, xScale - 1, barHeight);
    });

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';

    // X-axis labels
    for (let i = 0; i <= bins; i += bins / 4) {
      const x = padding + i * xScale;
      const value = min + i * binWidth;
      ctx.fillText(value.toFixed(0), x, height - padding + 20);
    }

    // Y-axis labels
    ctx.textAlign = 'right';
    const yStep = chartHeight / 4;
    for (let i = 0; i <= 4; i++) {
      const y = padding + i * yStep;
      const value = ((4 - i) * maxCount / 4).toFixed(0);
      ctx.fillText(value, padding - 10, y + 4);
    }
  };

  const drawTornadoChart = (ctx, data, width, height, options) => {
    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    if (!data?.parameters?.length) return;

    const maxImpact = Math.max(...data.parameters.map(p => Math.max(Math.abs(p.low), Math.abs(p.high))));
    const barHeight = chartHeight / (data.parameters.length * 2);
    const xScale = chartWidth / (maxImpact * 2);
    const xMiddle = padding + chartWidth / 2;

    // Draw center line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.moveTo(xMiddle, padding);
    ctx.lineTo(xMiddle, height - padding);
    ctx.stroke();

    // Draw bars
    data.parameters.forEach((param, i) => {
      const y = padding + i * barHeight * 2;

      // Negative impact (left)
      ctx.fillStyle = options.negativeColor || 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(xMiddle - Math.abs(param.low) * xScale, y, Math.abs(param.low) * xScale, barHeight);

      // Positive impact (right)
      ctx.fillStyle = options.positiveColor || 'rgba(34, 197, 94, 0.2)';
      ctx.fillRect(xMiddle, y, param.high * xScale, barHeight);

      // Labels
      ctx.fillStyle = '#666';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(param.name, padding - 10, y + barHeight / 2 + 4);

      // Values
      ctx.textAlign = 'left';
      ctx.fillText(`${(param.low * 100).toFixed(1)}%`, xMiddle - Math.abs(param.low) * xScale - 5, y + barHeight / 2);
      ctx.fillText(`+${(param.high * 100).toFixed(1)}%`, xMiddle + param.high * xScale + 5, y + barHeight / 2);
    });
  };

  return (
    <div className="analysis-chart">
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="chart-canvas"
      />
    </div>
  );
};

export default AnalysisChart;
