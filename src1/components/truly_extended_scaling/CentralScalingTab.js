import React, { useState, useEffect, useCallback } from 'react';
import { Tab } from '@headlessui/react';
import { CalculatorIcon, CubeIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import ExtendedScaling from './ExtendedScaling';
import '../../styles/HomePage.CSS/HCSS.css'

// Scaling types configuration
const scalingTypes = [
    {
        id: 'Amount4',
        label: 'Process Quantities',
        filterKeyword: 'Amount4',
        icon: CubeIcon,
        description: 'Scale process input quantities (Vs, units)'
    },
    {
        id: 'Amount5',
        label: 'Process Costs',
        filterKeyword: 'Amount5',
        icon: CurrencyDollarIcon,
        description: 'Scale process costs (Vs, $ / unit)'
    },
    {
        id: 'Amount6',
        label: 'Revenue Quantities',
        filterKeyword: 'Amount6',
        icon: ChartBarIcon,
        description: 'Scale revenue stream quantities (Rs, units)'
    },
    {
        id: 'Amount7',
        label: 'Revenue Prices',
        filterKeyword: 'Amount7',
        icon: CalculatorIcon,
        description: 'Scale revenue stream prices (Rs, $ / unit)'
    }
];
/**
 * CentralScalingTab - A unified interface for managing all scaling operations
 *
 * @param {Object} props - Component props
 * @param {Object} props.formValues - The form values from the parent component
 * @param {Object} props.V - The V state (process quantities variables)
 * @param {Object} props.R - The R state (revenue variables)
 * @param {Function} props.toggleV - Function to toggle V state
 * @param {Function} props.toggleR - Function to toggle R state
 * @param {Object} props.scalingBaseCosts - Base costs for each scaling type
 * @param {Function} props.setScalingBaseCosts - Function to update base costs
 * @param {Array} props.scalingGroups - Scaling groups from the parent component
 * @param {Function} props.onScalingGroupsChange - Function to update scaling groups
 * @param {Function} props.onScaledValuesChange - Function to handle scaled values changes
 */
const CentralScalingTab = ({
                               formValues,
                               V,
                               R,
                               toggleV,
                               toggleR,
                               scalingBaseCosts,
                               setScalingBaseCosts,
                               scalingGroups,
                               onScalingGroupsChange,
                               onScaledValuesChange,
                               onActiveGroupChange
                           }) => {
    // State for the active tab
    const [activeTab, setActiveTab] = useState(0);
    const [activeScalingGroups, setActiveScalingGroups] = useState(() => {
        return scalingTypes.reduce((acc, type) => {
            acc[type.id] = 0; // Default all to index 0
            return acc;
        }, {});
    });

    const handleActiveGroupChange = useCallback((groupIndex, filterKeyword) => {
        setActiveScalingGroups(prev => ({
            ...prev,
            [filterKeyword]: groupIndex
        }));
    }, []);

    // Handle tab change
    const handleTabChange = (index) => {
        setActiveTab(index);
    };

    // Function to extract base costs for the active tab
    const getActiveBaseCosts = useCallback(() => {
        const activeType = scalingTypes[activeTab].id;
        return scalingBaseCosts[activeType] || [];
    }, [activeTab, scalingBaseCosts, scalingTypes]);

    // Filter scaling groups for the active tab
    const getActiveScalingGroups = useCallback(() => {
        const activeType = scalingTypes[activeTab].id;
        return (scalingGroups || []).filter(group => group._scalingType === activeType);
    }, [activeTab, scalingGroups, scalingTypes]);
// Add this inside the CentralScalingTab component


    // Handle scaling groups change for the active tab
    const handleScalingGroupsChange = (newGroups) => {
        const activeType = scalingTypes[activeTab].id;

        // Add the scaling type to each group if it doesn't exist
        const updatedGroups = newGroups.map(group => ({
            ...group,
            _scalingType: group._scalingType || activeType
        }));

        // Replace groups of the current type while preserving others
        const otherGroups = (scalingGroups || []).filter(group => group._scalingType !== activeType);

        onScalingGroupsChange([...otherGroups, ...updatedGroups]);
    };

    // Effect to update base costs when formValues change
    useEffect(() => {
        const newBaseCosts = {};

        // Process each scaling type
        scalingTypes.forEach(type => {
            const filteredCosts = Object.entries(formValues || {})
                .filter(([key]) => key.includes(type.filterKeyword))
                .map(([key, value]) => {
                    // Determine if this is a V or R item
                    const vKey = key.includes('vAmount') ? getVNumber(key.replace('vAmount', '')) : null;
                    const rKey = key.includes('rAmount') ? getRNumber(key.replace('rAmount', '')) : null;

                    return {
                        id: key,
                        label: value.label || 'Unnamed Item',
                        baseValue: parseFloat(value.value) || 0,
                        vKey,
                        rKey
                    };
                });

            newBaseCosts[type.id] = filteredCosts;
        });

        setScalingBaseCosts(newBaseCosts);
    }, [formValues, setScalingBaseCosts, scalingTypes]);

    // Helper function to determine V number
    function getVNumber(vAmountNum) {
        const num = parseInt(vAmountNum);
        if (num >= 40 && num <= 49) return `V${num - 39}`;
        if (num >= 50 && num <= 59) return `V${num - 49}`;
        return null;
    }

    // Helper function to determine R number
    function getRNumber(rAmountNum) {
        const num = parseInt(rAmountNum);
        if (num >= 50 && num <= 69) return `R${num - 59}`;
        if (num >= 50 && num <= 79) return `R${num - 69}`;
        return null;
    }

    return (
        <div className="central-scaling-container">
            <h2 className="central-scaling-title">Unified Scaling Manager</h2>
            <p className="central-scaling-description">
                Manage scaling operations for process and revenue items in one centralized interface.
            </p>

            <Tab.Group selectedIndex={activeTab} onChange={handleTabChange}>
                <Tab.List className="central-scaling-tab-list">
                    {scalingTypes.map((type, index) => {
                        const Icon = type.icon;
                        return (
                            <Tab
                                key={type.id}
                                className={({ selected }) =>
                                    `central-scaling-tab ${selected ? 'central-scaling-tab-selected' : ''}`
                                }
                            >
                                <Icon className="central-scaling-tab-icon" />
                                <span>{type.label}</span>
                            </Tab>
                        );
                    })}
                </Tab.List>

                <Tab.Panels className="central-scaling-panels">
                    {scalingTypes.map((type, index) => (
                        <Tab.Panel key={type.id} className="central-scaling-panel">
                            <div className="scaling-type-description">
                                <type.icon className="scaling-type-icon" />
                                <div>
                                    <h3>{type.label} Scaling</h3>
                                    <p>{type.description}</p>
                                </div>
                            </div>

                            <ExtendedScaling
                                baseCosts={scalingBaseCosts[type.id] || []}
                                onScaledValuesChange={onScaledValuesChange}
                                initialScalingGroups={getActiveScalingGroups()}
                                onScalingGroupsChange={handleScalingGroupsChange}
                                filterKeyword={type.filterKeyword}
                                V={V}
                                R={R}
                                toggleV={toggleV}
                                toggleR={toggleR}
                                activeGroupIndex={activeScalingGroups[type.id] || 0}
                                onActiveGroupChange={(groupIndex, filterKeyword) => {
                                    handleActiveGroupChange(groupIndex, filterKeyword);
                                    onActiveGroupChange && onActiveGroupChange(groupIndex, filterKeyword);
                                }}
                            />
                        </Tab.Panel>
                    ))}
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
};

export default CentralScalingTab;
