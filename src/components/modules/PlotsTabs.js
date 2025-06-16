import React, { useState, useEffect } from 'react';
import CustomizableImage from './CustomizableImage';
import '../../styles/HomePage.CSS/HCSS.css';

const PlotsTabs = ({ version, sensitivity = false }) => {
    const [plotCategories, setPlotCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [plotGroups, setPlotGroups] = useState({});
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [plots, setPlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imagesLoaded, setImagesLoaded] = useState({});

    useEffect(() => {
        const fetchPlots = async () => {
            setLoading(true);
            setError(null);

            try {
                // Determine which API endpoint to use based on sensitivity flag
                const endpoint = sensitivity 
                    ? `http://localhost:5008/api/sensitivity-plots/${version}`
                    : `http://localhost:5008/api/plots/${version}`;

                const response = await fetch(endpoint);

                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                const data = await response.json();

                if (!data || data.length === 0) {
                    setPlotCategories([]);
                    setPlotGroups({});
                    setPlots([]);
                    setError("No plots available for this version");
                    setLoading(false);
                    return;
                }

                // Organize plots by category and group
                const categories = [...new Set(data.map(plot => plot.category))];

                // Create groups within each category
                const groupsByCategory = {};
                categories.forEach(category => {
                    const categoryPlots = data.filter(plot => plot.category === category);
                    const groups = [...new Set(categoryPlots.map(plot => plot.group))];
                    groupsByCategory[category] = groups;
                });

                setPlotCategories(categories);
                setPlotGroups(groupsByCategory);

                // Set initial selections
                if (categories.length > 0) {
                    setSelectedCategory(categories[0]);

                    if (groupsByCategory[categories[0]].length > 0) {
                        setSelectedGroup(groupsByCategory[categories[0]][0]);

                        // Set initial plots
                        const initialPlots = data.filter(
                            plot => plot.category === categories[0] && 
                                   plot.group === groupsByCategory[categories[0]][0]
                        );
                        setPlots(initialPlots);
                    }
                }
            } catch (err) {
                console.error('Error fetching plots:', err);
                setError(`Failed to load plots: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        // Skip API call if version is empty (during refresh)
        if (!version) {
            console.log('Skipping plot fetch - version is empty');
            return;
        }

        fetchPlots();
    }, [version, sensitivity]);

    // Update plots when category or group changes
    useEffect(() => {
        if (selectedCategory && selectedGroup) {
            // Fetch plots for the selected category and group
            const fetchPlotsByGroup = async () => {
                setLoading(true);

                try {
                    const endpoint = sensitivity 
                        ? `http://localhost:5008/api/sensitivity-plots/${version}/${selectedCategory}/${selectedGroup}`
                        : `http://localhost:5008/api/plots/${version}/${selectedCategory}/${selectedGroup}`;

                    const response = await fetch(endpoint);

                    if (!response.ok) {
                        throw new Error(`HTTP error: ${response.status}`);
                    }

                    const data = await response.json();
                    setPlots(data);
                } catch (err) {
                    console.error('Error fetching plots by group:', err);
                    setError(`Failed to load plots: ${err.message}`);
                } finally {
                    setLoading(false);
                }
            };

            fetchPlotsByGroup();
        }
    }, [selectedCategory, selectedGroup, version, sensitivity]);

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);

        // Reset group selection to the first group in the new category
        if (plotGroups[category] && plotGroups[category].length > 0) {
            setSelectedGroup(plotGroups[category][0]);
        } else {
            setSelectedGroup(null);
            setPlots([]);
        }
    };

    const handleGroupChange = (group) => {
        setSelectedGroup(group);
    };

    const transformPath = (path) => {
        // Normalize the file path to replace backslashes with forward slashes
        const normalizedPath = path.replace(/\\/g, '/');

        // Extract the batch version
        const batchMatch = normalizedPath.match(/Batch\((\d+)\)/);
        if (!batchMatch) return normalizedPath; // If no batch number found, return original path

        const batchVersion = batchMatch[1];

        // Construct the URL using the extracted parts
        return `http://localhost:5008/images/Batch(${batchVersion})/Results(${batchVersion})/${normalizedPath.split('Results(')[1]}`;
    };

    const handleImageLoad = (index) => {
        setImagesLoaded(prev => ({ ...prev, [index]: true }));
    };

    return (
        <div className="plots-tabs-container">
            {/* Main category tabs */}
            <div className="plots-category-tabs">
                {plotCategories.map(category => (
                    <button 
                        key={category}
                        className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                        onClick={() => handleCategoryChange(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Group tabs for selected category */}
            <div className="plots-group-tabs">
                {selectedCategory && plotGroups[selectedCategory] && 
                    plotGroups[selectedCategory].map(group => (
                        <button 
                            key={group}
                            className={`group-tab ${selectedGroup === group ? 'active' : ''}`}
                            onClick={() => handleGroupChange(group)}
                        >
                            {group}
                        </button>
                    ))
                }
            </div>

            {/* Plot display area */}
            <div className="plots-display-area">
                {loading ? (
                    <div className="plots-loading">Loading plots...</div>
                ) : error ? (
                    <div className="plots-error">{error}</div>
                ) : plots.length === 0 ? (
                    <div className="plots-empty">No plots available for this selection</div>
                ) : (
                    <div className="plots-grid">
                        {plots.map((plot, index) => (
                            <div 
                                key={index} 
                                className={`plot-container ${imagesLoaded[index] ? 'loaded' : ''}`}
                            >
                                <h3 className="plot-title">{plot.title || `Plot ${index + 1}`}</h3>
                                <CustomizableImage
                                    src={transformPath(plot.path)}
                                    alt={plot.title || `Plot ${index + 1}`}
                                    width="100%"
                                    height="auto"
                                    onLoad={() => handleImageLoad(index)}
                                    className={imagesLoaded[index] ? 'loaded' : ''}
                                />
                                {plot.description && (
                                    <p className="plot-description">{plot.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlotsTabs;
