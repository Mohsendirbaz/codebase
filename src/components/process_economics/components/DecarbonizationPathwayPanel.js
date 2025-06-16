import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, faLeaf, faIndustry, faWater, 
  faDollarSign, faClock, faPlus, faMinus, faCheck
} from '@fortawesome/free-solid-svg-icons';

import DecarbonizationPathwayCard from './DecarbonizationPathwayCard';
import PathwayComparisonChart from './PathwayComparisonChart';
import DecarbonizationTargetTimeline from './DecarbonizationTargetTimeline';

/**
 * DecarbonizationPathwayPanel - Main component for displaying and comparing decarbonization pathways
 * 
 * @param {Object} props - Component props
 * @param {Object} props.pathways - Pathways data object
 * @param {String} props.activePathwayId - ID of currently active pathway
 * @param {Array} props.comparisonPathwayIds - IDs of pathways selected for comparison
 * @param {Object} props.metrics - Metrics data for pathways
 * @param {Function} props.onSelectPathway - Callback when a pathway is selected
 * @param {Function} props.onAddToComparison - Callback when a pathway is added to comparison
 * @param {Function} props.onRemoveFromComparison - Callback when a pathway is removed from comparison
 * @param {Function} props.onCategoryChange - Callback when category filter is changed
 * @param {Boolean} props.filterHardToDecarbonize - Whether to filter for hard-to-decarbonize sectors
 * @param {Function} props.onToggleHardToDecarbonizeFilter - Callback to toggle hard-to-decarbonize filter
 * @param {Function} props.onImportConfiguration - Callback when a pathway is imported
 * @param {Function} props.onAddToPersonal - Callback when a pathway is added to personal library
 */
const DecarbonizationPathwayPanel = ({
  pathways = {},
  activePathwayId,
  comparisonPathwayIds = [],
  metrics = {},
  onSelectPathway,
  onAddToComparison,
  onRemoveFromComparison,
  onCategoryChange,
  filterHardToDecarbonize = false,
  onToggleHardToDecarbonizeFilter,
  onImportConfiguration,
  onAddToPersonal
}) => {
  const [view, setView] = useState('list'); // 'list', 'detail', 'compare'
  const [sortBy, setSortBy] = useState('cost'); // 'cost', 'emissions', 'readiness', 'water'
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Extract all categories from pathways
  const categories = useMemo(() => {
    const cats = new Set(['all']);
    Object.values(pathways).forEach(pathway => {
      if (pathway.category) cats.add(pathway.category);
    });
    return Array.from(cats);
  }, [pathways]);
  
  // Filter and sort pathways
  const filteredPathways = useMemo(() => {
    return Object.values(pathways)
      .filter(pathway => {
        // Category filter
        const categoryMatch = selectedCategory === 'all' || pathway.category === selectedCategory;
        
        // Hard to decarbonize filter
        const hardToDecarbonizeMatch = !filterHardToDecarbonize || pathway.isHardToDecarbonize;
        
        return categoryMatch && (filterHardToDecarbonize ? hardToDecarbonizeMatch : true);
      })
      .sort((a, b) => {
        // Sort by selected metric
        const metricA = metrics[a.id] || {};
        const metricB = metrics[b.id] || {};
        
        switch (sortBy) {
          case 'cost':
            return (a.economics?.["Real Levelized Cost ($/kg H₂)"] || 999) - 
                   (b.economics?.["Real Levelized Cost ($/kg H₂)"] || 999);
          case 'emissions':
            return (a.carbonIntensity || 999) - (b.carbonIntensity || 999);
          case 'readiness':
            return (a.readinessYear || 2050) - (b.readinessYear || 2050);
          case 'water':
            return (a.inputs?.["Water Total (gal)"] || 999) - 
                   (b.inputs?.["Water Total (gal)"] || 999);
          case 'score':
            return (metricB.overallScore || 0) - (metricA.overallScore || 0);
          default:
            return 0;
        }
      });
  }, [pathways, selectedCategory, sortBy, filterHardToDecarbonize, metrics]);
  
  // Get active pathway
  const activePathway = useMemo(() => {
    return pathways[activePathwayId] || null;
  }, [pathways, activePathwayId]);
  
  // Get comparison pathways
  const comparisonPathways = useMemo(() => {
    return comparisonPathwayIds
      .map(id => pathways[id])
      .filter(Boolean);
  }, [pathways, comparisonPathwayIds]);
  
  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (onCategoryChange) onCategoryChange(category);
  };
  
  // Switch to compare view when comparison pathways are selected
  useEffect(() => {
    if (comparisonPathwayIds.length > 0) {
      setView('compare');
    } else if (view === 'compare') {
      setView('list');
    }
  }, [comparisonPathwayIds, view]);
  
  // Handle pathway selection
  const handlePathwaySelect = (pathwayId) => {
    if (onSelectPathway) onSelectPathway(pathwayId);
    
    // If in list view, switch to detail view
    if (view === 'list') {
      setView('detail');
    }
  };
  
  // Handle adding to comparison
  const handleAddToComparison = (pathwayId) => {
    if (onAddToComparison) onAddToComparison(pathwayId);
  };
  
  // Handle removing from comparison
  const handleRemoveFromComparison = (pathwayId) => {
    if (onRemoveFromComparison) onRemoveFromComparison(pathwayId);
  };
  
  // Handle back to list
  const handleBackToList = () => {
    setView('list');
  };
  
  // Handle importing a pathway
  const handleImport = (pathwayId) => {
    if (onImportConfiguration) onImportConfiguration(pathwayId);
  };
  
  // Handle adding a pathway to personal library
  const handleAddToPersonal = (pathway) => {
    if (onAddToPersonal) onAddToPersonal(pathway);
  };
  
  return (
    <div className="decarbonization-pathway-panel">
      <div className="pathway-panel-header">
        <h2>Decarbonization Pathways</h2>
        
        <div className="pathway-controls">
          {/* View selector */}
          <div className="view-selector">
            <button 
              className={`view-button ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              List View
            </button>
            {activePathway && (
              <button 
                className={`view-button ${view === 'detail' ? 'active' : ''}`}
                onClick={() => setView('detail')}
              >
                Detail View
              </button>
            )}
            {comparisonPathwayIds.length > 0 && (
              <button 
                className={`view-button ${view === 'compare' ? 'active' : ''}`}
                onClick={() => setView('compare')}
              >
                Compare ({comparisonPathwayIds.length})
              </button>
            )}
          </div>
          
          {/* Category filter */}
          <div className="category-filter">
            <label>Category:</label>
            <select 
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : 
                   category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Hard to decarbonize filter */}
          <div className="hard-to-decarbonize-filter">
            <label>
              <input 
                type="checkbox"
                checked={filterHardToDecarbonize}
                onChange={() => onToggleHardToDecarbonizeFilter(!filterHardToDecarbonize)}
              />
              Hard-to-Decarbonize Only
            </label>
          </div>
          
          {/* Sort selector */}
          <div className="sort-selector">
            <label>Sort by:</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="cost">Cost</option>
              <option value="emissions">Emissions</option>
              <option value="readiness">Readiness</option>
              <option value="water">Water Usage</option>
              <option value="score">Overall Score</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="pathway-panel-content">
        <AnimatePresence mode="wait">
          {/* List View */}
          {view === 'list' && (
            <motion.div 
              key="list"
              className="pathway-list-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="pathway-list-header">
                <div className="pathway-header-name">Pathway</div>
                <div className="pathway-header-cost">
                  <FontAwesomeIcon icon={faDollarSign} /> Cost ($/kg H₂)
                </div>
                <div className="pathway-header-emissions">
                  <FontAwesomeIcon icon={faLeaf} /> Emissions (kg CO₂e/kg H₂)
                </div>
                <div className="pathway-header-readiness">
                  <FontAwesomeIcon icon={faClock} /> Readiness
                </div>
                <div className="pathway-header-water">
                  <FontAwesomeIcon icon={faWater} /> Water (gal/kg H₂)
                </div>
                <div className="pathway-header-actions">Actions</div>
              </div>
              
              <div className="pathway-list">
                {filteredPathways.map(pathway => (
                  <div 
                    key={pathway.id}
                    className={`pathway-list-item ${pathway.id === activePathwayId ? 'active' : ''}`}
                    onClick={() => handlePathwaySelect(pathway.id)}
                  >
                    <div className="pathway-item-name">
                      <span className={`pathway-category-indicator ${pathway.category}`}>
                        {pathway.category && pathway.category.charAt(0).toUpperCase()}
                      </span>
                      <span className="pathway-name">{pathway.name}</span>
                      {pathway.isHardToDecarbonize && (
                        <span className="hard-to-decarbonize-badge">
                          <FontAwesomeIcon icon={faIndustry} /> Hard to Decarbonize
                        </span>
                      )}
                    </div>
                    
                    <div className="pathway-item-cost">
                      ${pathway.economics?.["Real Levelized Cost ($/kg H₂)"]?.toFixed(2) || 'N/A'}
                    </div>
                    
                    <div className="pathway-item-emissions">
                      {pathway.carbonIntensity?.toFixed(1) || 'N/A'}
                    </div>
                    
                    <div className="pathway-item-readiness">
                      {pathway.maturityLevel && (
                        <span className={`readiness-badge ${pathway.maturityLevel}`}>
                          {pathway.maturityLevel}
                        </span>
                      )}
                      {pathway.readinessYear && (
                        <span className="readiness-year">{pathway.readinessYear}</span>
                      )}
                    </div>
                    
                    <div className="pathway-item-water">
                      {pathway.inputs?.["Water Total (gal)"]?.toFixed(2) || 'N/A'}
                    </div>
                    
                    <div className="pathway-item-actions" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="item-action-button primary"
                        onClick={() => handleImport(pathway.id)}
                        title="Import pathway"
                      >
                        <FontAwesomeIcon icon={faCheck} /> Import
                      </button>
                      
                      {comparisonPathwayIds.includes(pathway.id) ? (
                        <button 
                          className="remove-from-comparison-button"
                          onClick={() => handleRemoveFromComparison(pathway.id)}
                        >
                          <FontAwesomeIcon icon={faMinus} /> Remove
                        </button>
                      ) : (
                        <button 
                          className="add-to-comparison-button"
                          onClick={() => handleAddToComparison(pathway.id)}
                          disabled={comparisonPathwayIds.length >= 4}
                        >
                          <FontAwesomeIcon icon={faPlus} /> Compare
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredPathways.length === 0 && (
                  <div className="no-pathways-message">
                    No pathways match the current filters
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {/* Detail View */}
          {view === 'detail' && activePathway && (
            <motion.div 
              key="detail"
              className="pathway-detail-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button className="back-button" onClick={handleBackToList}>
                ← Back to List
              </button>
              
              <DecarbonizationPathwayCard 
                pathway={activePathway}
                metrics={metrics[activePathway.id] || {}}
                isComparison={false}
                isInComparison={comparisonPathwayIds.includes(activePathway.id)}
                onAddToComparison={() => handleAddToComparison(activePathway.id)}
                onRemoveFromComparison={() => handleRemoveFromComparison(activePathway.id)}
                onImport={() => handleImport(activePathway.id)}
                onAddToPersonal={() => handleAddToPersonal(activePathway)}
              />
              
              <div className="pathway-additional-info">
                <h3>Greenhouse Gas Emissions</h3>
                <p>
                  {activePathway.name} produces approximately {activePathway.carbonIntensity?.toFixed(1) || 'N/A'} kg 
                  CO₂e per kg of hydrogen produced. 
                  {activePathway.carbonIntensity < 5 ? 
                    ' This is considered a low-carbon hydrogen production method.' : 
                    ' This is a higher-carbon production method compared to alternatives.'}
                </p>
                
                <h3>Implementation Timeline</h3>
                <DecarbonizationTargetTimeline 
                  maturityLevel={activePathway.maturityLevel}
                  readinessYear={activePathway.readinessYear}
                />
                
                <h3>Resource Requirements</h3>
                <div className="resource-requirements">
                  <div className="resource-table">
                    <div className="resource-table-header">
                      <div className="resource-name">Resource</div>
                      <div className="resource-value">Value</div>
                    </div>
                    {activePathway.inputs && Object.entries(activePathway.inputs)
                      .filter(([_, value]) => value !== null && value !== undefined)
                      .map(([name, value]) => (
                        <div key={name} className="resource-row">
                          <div className="resource-name">{name}</div>
                          <div className="resource-value">{typeof value === 'number' ? value.toFixed(2) : value}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Compare View */}
          {view === 'compare' && comparisonPathways.length > 0 && (
            <motion.div 
              key="compare"
              className="pathway-compare-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="comparison-header">
                <h3>Pathway Comparison</h3>
                <button 
                  className="clear-comparison-button"
                  onClick={() => {
                    comparisonPathwayIds.forEach(id => handleRemoveFromComparison(id));
                  }}
                >
                  Clear Comparison
                </button>
              </div>
              
              <div className="comparison-charts">
                <div className="chart-container cost-chart">
                  <h4>Cost Comparison ($/kg H₂)</h4>
                  <PathwayComparisonChart 
                    pathways={comparisonPathways}
                    dataKey="economics.Real Levelized Cost ($/kg H₂)"
                    format={(value) => `$${value?.toFixed(2)}`}
                    ascending={true}
                    color="#2c7bb6"
                  />
                </div>
                
                <div className="chart-container emissions-chart">
                  <h4>Emissions Comparison (kg CO₂e/kg H₂)</h4>
                  <PathwayComparisonChart 
                    pathways={comparisonPathways}
                    dataKey="carbonIntensity"
                    format={(value) => value?.toFixed(1)}
                    ascending={true}
                    color="#1a9850"
                  />
                </div>
                
                <div className="chart-container water-chart">
                  <h4>Water Usage Comparison (gal/kg H₂)</h4>
                  <PathwayComparisonChart 
                    pathways={comparisonPathways}
                    dataKey="inputs.Water Total (gal)"
                    format={(value) => value?.toFixed(2)}
                    ascending={true}
                    color="#5ab4ac"
                  />
                </div>
                
                <div className="chart-container readiness-chart">
                  <h4>Readiness Comparison (Year)</h4>
                  <PathwayComparisonChart 
                    pathways={comparisonPathways}
                    dataKey="readinessYear"
                    format={(value) => value?.toString()}
                    ascending={true}
                    color="#d8b365"
                  />
                </div>
              </div>
              
              <div className="comparison-cards">
                {comparisonPathways.map(pathway => (
                  <DecarbonizationPathwayCard 
                    key={pathway.id}
                    pathway={pathway}
                    metrics={metrics[pathway.id] || {}}
                    isComparison={true}
                    isInComparison={true}
                    onRemoveFromComparison={() => handleRemoveFromComparison(pathway.id)}
                    onImport={() => handleImport(pathway.id)}
                    onAddToPersonal={() => handleAddToPersonal(pathway)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DecarbonizationPathwayPanel;