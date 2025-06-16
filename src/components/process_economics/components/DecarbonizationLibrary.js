import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Squares2X2Icon, 
  Bars3Icon,
  BarsArrowUpIcon,
  ChevronDownIcon,
  FireIcon,
  LeafIcon,
  IndustryIcon,
  WaterIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

import DecarbonizationPathwayCard from './DecarbonizationPathwayCard';
import DecarbonizationPathwayPanel from './DecarbonizationPathwayPanel';
import CategorySelector from './CategorySelector';
import PopularItemsCarousel from './PopularItemsCarousel';
import { saveToPersonalLibrary } from '../services/libraryService';
import { getDecarbonizationPathways } from '../services/decarbonizationService';
import { usageTracker } from '../services/usageTrackingService';

const DecarbonizationLibrary = ({ 
  onImportConfiguration,
  userId,
  isSearchView = false
}) => {
  const [pathways, setPathways] = useState({});
  const [activePathwayId, setActivePathwayId] = useState(null);
  const [comparisonPathwayIds, setComparisonPathwayIds] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortOption, setSortOption] = useState('emissions');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [popularPathways, setPopularPathways] = useState([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  const [filterHardToDecarbonize, setFilterHardToDecarbonize] = useState(false);
  const [pathwayMetrics, setPathwayMetrics] = useState({});
  
  // Load pathways data
  useEffect(() => {
    const loadPathways = async () => {
      try {
        const pathwaysData = await getDecarbonizationPathways();
        setPathways(pathwaysData);
        
        // Set default active pathway
        if (Object.keys(pathwaysData).length > 0 && !activePathwayId) {
          setActivePathwayId(Object.keys(pathwaysData)[0]);
        }
        
        // Calculate metrics for all pathways
        const metrics = {};
        Object.values(pathwaysData).forEach(pathway => {
          metrics[pathway.id] = calculatePathwayMetrics(pathway);
        });
        setPathwayMetrics(metrics);
      } catch (error) {
        console.error('Error loading decarbonization pathways:', error);
      }
    };
    
    loadPathways();
  }, []);
  
  // Load popular pathways
  useEffect(() => {
    const loadPopularPathways = async () => {
      setIsLoadingPopular(true);
      try {
        // Get usage stats for pathways
        const usageStats = await usageTracker.getItemsByTypeUsage('decarbonization-pathway', 6);
        
        // Map stats to pathway objects
        const popular = usageStats
          .map(stat => ({
            ...pathways[stat.itemId],
            usage: stat.usage
          }))
          .filter(Boolean);
        
        setPopularPathways(popular);
      } catch (error) {
        console.error('Error loading popular pathways:', error);
      } finally {
        setIsLoadingPopular(false);
      }
    };
    
    if (Object.keys(pathways).length > 0) {
      loadPopularPathways();
    }
  }, [pathways]);
  
  // Helper function to calculate pathway metrics
  const calculatePathwayMetrics = (pathway) => {
    // Calculate various metrics for comparison
    const metrics = {
      costEffectiveness: 0,
      emissionReduction: 0,
      implementationTimeframe: 0,
      waterEfficiency: 0,
      overallScore: 0
    };
    
    // Logic for cost effectiveness (inverse of cost, normalized to 0-100)
    if (pathway.economics && pathway.economics["Real Levelized Cost ($/kg H₂)"]) {
      const cost = pathway.economics["Real Levelized Cost ($/kg H₂)"];
      // Assuming $10/kg as high benchmark for normalization
      metrics.costEffectiveness = Math.max(0, Math.min(100, (1 - cost/10) * 100));
    }
    
    // Logic for emission reduction (inverse of carbon intensity, normalized to 0-100)
    if (pathway.carbonIntensity) {
      // Assuming 20 kg CO2e/kg H2 as high benchmark
      metrics.emissionReduction = Math.max(0, Math.min(100, (1 - pathway.carbonIntensity/20) * 100));
    }
    
    // Logic for implementation timeframe (based on readiness year, normalized to 0-100)
    if (pathway.readinessYear) {
      // 2020 as earliest, 2035 as latest for normalization
      metrics.implementationTimeframe = Math.max(0, Math.min(100, ((2035 - pathway.readinessYear) / 15) * 100));
    }
    
    // Logic for water efficiency (inverse of water usage, normalized to 0-100)
    if (pathway.inputs && pathway.inputs["Water Total (gal)"]) {
      // Assuming 10 gal as high benchmark
      metrics.waterEfficiency = Math.max(0, Math.min(100, (1 - pathway.inputs["Water Total (gal)"]/10) * 100));
    }
    
    // Calculate overall score (weighted average)
    metrics.overallScore = (
      metrics.costEffectiveness * 0.35 + 
      metrics.emissionReduction * 0.35 + 
      metrics.implementationTimeframe * 0.15 + 
      metrics.waterEfficiency * 0.15
    );
    
    return metrics;
  };
  
  // Extract categories from pathways
  const categories = React.useMemo(() => {
    const cats = new Set(['all']);
    Object.values(pathways).forEach(pathway => {
      if (pathway.category) cats.add(pathway.category);
    });
    return Array.from(cats);
  }, [pathways]);
  
  // Filter pathways by category and hard-to-decarbonize filter
  const filteredPathways = React.useMemo(() => {
    return Object.values(pathways).filter(pathway => {
      // Category filter
      const categoryMatch = selectedCategory === 'all' || pathway.category === selectedCategory;
      
      // Hard to decarbonize filter
      const hardToDecarbonizeMatch = !filterHardToDecarbonize || pathway.isHardToDecarbonize;
      
      return categoryMatch && (filterHardToDecarbonize ? hardToDecarbonizeMatch : true);
    });
  }, [pathways, selectedCategory, filterHardToDecarbonize]);
  
  // Sort pathways
  const sortedPathways = React.useMemo(() => {
    return [...filteredPathways].sort((a, b) => {
      switch(sortOption) {
        case 'name':
          return a.name.localeCompare(b.name);
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
          return (pathwayMetrics[b.id]?.overallScore || 0) - (pathwayMetrics[a.id]?.overallScore || 0);
        default:
          return 0;
      }
    });
  }, [filteredPathways, sortOption, pathwayMetrics]);
  
  // Handle adding to comparison
  const handleAddToComparison = (pathwayId) => {
    if (comparisonPathwayIds.length >= 4) return;
    
    if (!comparisonPathwayIds.includes(pathwayId)) {
      setComparisonPathwayIds([...comparisonPathwayIds, pathwayId]);
    }
  };
  
  // Handle removing from comparison
  const handleRemoveFromComparison = (pathwayId) => {
    setComparisonPathwayIds(comparisonPathwayIds.filter(id => id !== pathwayId));
  };
  
  // Handle adding a pathway to personal library
  const handleAddToPersonal = async (pathway) => {
    try {
      // Convert pathway to library item format
      const item = {
        id: pathway.id,
        name: pathway.name,
        description: pathway.description,
        category: "Decarbonization Pathway",
        tags: [pathway.category, pathway.isHardToDecarbonize ? "Hard to Decarbonize" : ""],
        modeler: "Climate Module",
        configuration: {
          version: "1.0.0",
          metadata: {
            exportDate: new Date().toISOString(),
            description: `Decarbonization pathway for ${pathway.name}`,
            scalingType: "Decarbonization"
          },
          currentState: {
            id: pathway.id,
            pathwayType: "decarbonization",
            data: pathway
          }
        }
      };
      
      // Add to personal library
      await saveToPersonalLibrary(userId, item);
      
      // Show success message
      alert(`Added "${pathway.name}" to your personal library`);
    } catch (error) {
      console.error('Error saving to personal library:', error);
      alert('Error adding to personal library');
    }
  };
  
  // If this is a search view, render a simpler version
  if (isSearchView) {
    return (
      <div className="library-items-grid">
        {sortedPathways.map(pathway => (
          <DecarbonizationPathwayCard 
            key={pathway.id}
            pathway={pathway}
            metrics={pathwayMetrics[pathway.id] || {}}
            isComparison={false}
            isInComparison={comparisonPathwayIds.includes(pathway.id)}
            onAddToComparison={() => handleAddToComparison(pathway.id)}
            onRemoveFromComparison={() => handleRemoveFromComparison(pathway.id)}
            onAddToPersonal={() => handleAddToPersonal(pathway)}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className="decarbonization-library">
      {/* Add Popular Pathways Carousel */}
      {!isLoadingPopular && popularPathways.length > 0 && (
        <div className="popular-items-section">
          <div className="section-header">
            <h2>
              <FireIcon className="section-icon" />
              <span>Popular Decarbonization Pathways</span>
            </h2>
          </div>
          <PopularItemsCarousel 
            items={popularPathways.map(pathway => ({
              id: pathway.id,
              name: pathway.name,
              category: pathway.category,
              description: pathway.description,
              usage: pathway.usage,
              configuration: {
                currentState: {
                  id: pathway.id,
                  pathwayType: "decarbonization",
                  data: pathway
                }
              }
            }))}
            onImport={(config) => {
              const pathwayId = config.currentState.id;
              setActivePathwayId(pathwayId);
            }}
            onAddToPersonal={(item) => handleAddToPersonal(pathways[item.id])}
            customItemComponent={DecarbonizationPathwayCard}
            customItemProps={(item) => ({
              pathway: pathways[item.id],
              metrics: pathwayMetrics[item.id] || {},
              isCarouselItem: true
            })}
          />
        </div>
      )}
      
      <div className="decarbonization-library-header">
        <div className="category-navigation">
          <CategorySelector 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
        
        <div className="view-options">
          <div className="sort-selector">
            <button 
              className="sort-button"
              onClick={() => setShowSortOptions(!showSortOptions)}
            >
              <BarsArrowUpIcon className="sort-icon" />
              <span>Sort: {sortOption}</span>
              <ChevronDownIcon className="chevron-icon" />
            </button>
            
            {showSortOptions && (
              <div className="sort-options">
                <button 
                  className={`sort-option ${sortOption === 'name' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('name');
                    setShowSortOptions(false);
                  }}
                >
                  Name
                </button>
                <button 
                  className={`sort-option ${sortOption === 'cost' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('cost');
                    setShowSortOptions(false);
                  }}
                >
                  Cost
                </button>
                <button 
                  className={`sort-option ${sortOption === 'emissions' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('emissions');
                    setShowSortOptions(false);
                  }}
                >
                  Emissions
                </button>
                <button 
                  className={`sort-option ${sortOption === 'readiness' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('readiness');
                    setShowSortOptions(false);
                  }}
                >
                  Readiness Year
                </button>
                <button 
                  className={`sort-option ${sortOption === 'water' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('water');
                    setShowSortOptions(false);
                  }}
                >
                  Water Usage
                </button>
                <button 
                  className={`sort-option ${sortOption === 'score' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('score');
                    setShowSortOptions(false);
                  }}
                >
                  Overall Score
                </button>
              </div>
            )}
          </div>
          
          <div className="view-mode-toggle">
            <button 
              className={`view-mode-button ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Squares2X2Icon className="view-mode-icon" />
            </button>
            <button 
              className={`view-mode-button ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <Bars3Icon className="view-mode-icon" />
            </button>
          </div>
          
          <div className="hard-to-decarbonize-filter">
            <label>
              <input 
                type="checkbox"
                checked={filterHardToDecarbonize}
                onChange={() => setFilterHardToDecarbonize(!filterHardToDecarbonize)}
              />
              Hard-to-Decarbonize Only
            </label>
          </div>
        </div>
      </div>
      
      {/* Advanced view with DecarbonizationPathwayPanel */}
      <DecarbonizationPathwayPanel
        pathways={pathways}
        activePathwayId={activePathwayId}
        comparisonPathwayIds={comparisonPathwayIds}
        metrics={pathwayMetrics}
        onSelectPathway={setActivePathwayId}
        onAddToComparison={handleAddToComparison}
        onRemoveFromComparison={handleRemoveFromComparison}
        onCategoryChange={setSelectedCategory}
        filterHardToDecarbonize={filterHardToDecarbonize}
        onToggleHardToDecarbonizeFilter={setFilterHardToDecarbonize}
        onImportConfiguration={(pathwayId) => {
          const pathway = pathways[pathwayId];
          if (pathway) {
            const config = {
              version: "1.0.0",
              metadata: {
                exportDate: new Date().toISOString(),
                description: `Decarbonization pathway for ${pathway.name}`,
                scalingType: "Decarbonization"
              },
              currentState: {
                id: pathway.id,
                pathwayType: "decarbonization",
                data: pathway
              }
            };
            onImportConfiguration(config);
          }
        }}
        onAddToPersonal={handleAddToPersonal}
      />
    </div>
  );
};

export default DecarbonizationLibrary;