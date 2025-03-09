import React, { useState, useEffect } from 'react';
import './neumorphic-price.css';
import { loadPriceData } from '../services/priceDataService';
import AnalysisChart from './AnalysisChart';

const PriceDataPanel = ({
  version,
  extension,
  baseVersion,
  baseExtension,
  onDataLoaded
}) => {
  const [priceData, setPriceData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Load current version price data
        const currentData = await loadPriceData(version, extension);
        setPriceData(currentData);

        // Load base version for comparison if provided
        if (baseVersion) {
          const baseData = await loadPriceData(baseVersion, baseExtension);
          setComparisonData(baseData);
        }

        // Notify parent component
        if (onDataLoaded) {
          onDataLoaded({
            version,
            extension,
            priceData: currentData
          });
        }
      } catch (error) {
        console.error('Error loading price data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [version, extension, baseVersion, baseExtension, onDataLoaded]);

  const calculateDifference = (current, base) => {
    if (!current || !base) return null;
    return ((current - base) / base * 100).toFixed(2);
  };

  const renderPriceComparison = () => {
    if (!priceData) return null;

    return (
      <div className="price-comparison">
        <div className="price-metrics">
          <div className="metric-group">
            <h4>Average Selling Price</h4>
            <div className="price-value">
              ${priceData.averagePrice.toFixed(2)}
              {comparisonData && (
                <span className="price-difference">
                  {calculateDifference(priceData.averagePrice, comparisonData.averagePrice)}%
                </span>
              )}
            </div>
          </div>
          
          <div className="metric-group">
            <h4>Price Range</h4>
            <div className="price-range">
              <span>${priceData.minPrice.toFixed(2)}</span>
              <span>-</span>
              <span>${priceData.maxPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="metric-group">
            <h4>Price Stability</h4>
            <div className="stability-indicator">
              <div 
                className="stability-bar"
                style={{ width: `${priceData.stability * 100}%` }}
              />
              <span>{(priceData.stability * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <div className="price-visualization">
          <h4>Price Distribution</h4>
          <AnalysisChart
            type="distribution"
            data={{
              values: priceData.distribution,
              baseline: comparisonData?.averagePrice
            }}
            options={{
              height: 200,
              barColor: 'var(--model-color-primary)',
              baselineColor: 'var(--model-color-text-light)'
            }}
          />
        </div>

        {comparisonData && (
          <div className="price-trends">
            <h4>Price Trends</h4>
            <AnalysisChart
              type="line"
              data={{
                series: [
                  {
                    name: 'Current Version',
                    values: priceData.trends
                  },
                  {
                    name: 'Base Version',
                    values: comparisonData.trends
                  }
                ]
              }}
              options={{
                height: 200,
                colors: [
                  'var(--model-color-primary)',
                  'var(--model-color-text-light)'
                ]
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="price-data-panel">
      {isLoading ? (
        <div className="loading-indicator">
          <div className="spinner" />
          <span>Loading price data...</span>
        </div>
      ) : (
        renderPriceComparison()
      )}
    </div>
  );
};

export default PriceDataPanel;
