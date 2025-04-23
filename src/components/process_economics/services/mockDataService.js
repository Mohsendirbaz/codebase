// src/modules/processEconomics/services/mockDataService.js
/**
 * Central repository for mock data used in testing
 */
export const mockData = {
    personalLibrary: [
        {
            id: 'personal-item-1',
            name: 'My Custom Cost Model',
            description: 'Personalized cost model with custom parameters for chemical plant expansion',
            category: 'Capital Cost Estimation',
            tags: ['custom', 'chemical', 'expansion'],
            shelf: 'favorites',
            isFavorite: true,
            userId: 'test-user-123',
            dateAdded: '2024-03-15T10:30:00Z',
            dateModified: '2024-03-20T14:45:00Z',
            modeler: 'John Doe',
            configuration: {
                version: "1.2.0",
                metadata: {
                    exportDate: '2024-03-15T10:30:00Z',
                    exportedBy: "ScalingModule",
                    description: "Complete scaling configuration with cumulative calculations",
                    scalingType: "Amount4"
                },
                currentState: {
                    selectedGroupIndex: 0,
                    scalingGroups: [
                        {
                            id: 'group-1',
                            name: 'Base Case',
                            items: [
                                { id: 'item-1', label: 'Equipment Cost', operation: 'multiply', scalingFactor: 1 },
                                { id: 'item-2', label: 'Installation', operation: 'multiply', scalingFactor: 0.45 }
                            ]
                        },
                        {
                            id: 'group-2',
                            name: 'Scale-Up',
                            items: [
                                { id: 'item-3', label: 'Capacity Factor', operation: 'power', scalingFactor: 0.6 }
                            ]
                        }
                    ],
                    protectedTabs: ['group-1'],
                    tabConfigs: [
                        { id: 'group-1', label: 'Base Case', isProtected: true, _scalingType: 'Amount4' },
                        { id: 'group-2', label: 'Scale-Up', isProtected: false, _scalingType: 'Amount4' }
                    ]
                }
            }
        },
        {
            id: 'personal-item-2',
            name: 'Refinery Upgrade ROI',
            description: 'Return on investment model for refinery upgrades',
            category: 'ROI Models',
            tags: ['refinery', 'ROI', 'upgrade'],
            shelf: 'projects',
            isFavorite: false,
            userId: 'test-user-123',
            dateAdded: '2024-02-10T08:20:00Z',
            modeler: 'John Doe',
            configuration: {
                version: "1.2.0",
                metadata: {
                    exportDate: '2024-02-10T08:20:00Z',
                    exportedBy: "ScalingModule",
                    description: "ROI calculation configuration",
                    scalingType: "Amount5"
                },
                currentState: {
                    selectedGroupIndex: 0,
                    scalingGroups: [
                        {
                            id: 'group-1',
                            name: 'Capital Investment',
                            items: [
                                { id: 'item-1', label: 'Equipment', operation: 'add', scalingFactor: 1000000 },
                                { id: 'item-2', label: 'Installation', operation: 'multiply', scalingFactor: 0.3 }
                            ]
                        },
                        {
                            id: 'group-2',
                            name: 'Annual Returns',
                            items: [
                                { id: 'item-3', label: 'Revenue Increase', operation: 'add', scalingFactor: 250000 },
                                { id: 'item-4', label: 'Cost Reduction', operation: 'add', scalingFactor: 120000 }
                            ]
                        }
                    ],
                    protectedTabs: [],
                    tabConfigs: [
                        { id: 'group-1', label: 'Capital Investment', isProtected: false, _scalingType: 'Amount5' },
                        { id: 'group-2', label: 'Annual Returns', isProtected: false, _scalingType: 'Amount5' }
                    ]
                }
            }
        }
    ],
    generalLibrary: [
        {
            id: 'general-item-1',
            name: 'Standard Cost Estimation Model',
            description: 'Industry-standard model for chemical plant cost estimation',
            category: 'Capital Cost Estimation',
            tags: ['standard', 'chemical', 'estimation'],
            dateAdded: '2023-11-05T09:15:00Z',
            modeler: 'Engineering Standards Institute',
            usage: { total: 253, viewCount: 412, importCount: 253, shareCount: 87 },
            configuration: {
                version: "1.2.0",
                metadata: {
                    exportDate: '2023-11-05T09:15:00Z',
                    exportedBy: "ScalingModule",
                    description: "Standard cost estimation model",
                    scalingType: "Amount4"
                },
                currentState: {
                    selectedGroupIndex: 0,
                    scalingGroups: [
                        {
                            id: 'group-1',
                            name: 'Equipment Costs',
                            items: [
                                { id: 'item-1', label: 'Process Equipment', operation: 'add', scalingFactor: 1 },
                                { id: 'item-2', label: 'Auxiliary Equipment', operation: 'add', scalingFactor: 1 }
                            ]
                        },
                        {
                            id: 'group-2',
                            name: 'Installation Factors',
                            items: [
                                { id: 'item-3', label: 'Installation Labor', operation: 'multiply', scalingFactor: 0.3 },
                                { id: 'item-4', label: 'Foundations', operation: 'multiply', scalingFactor: 0.1 },
                                { id: 'item-5', label: 'Piping', operation: 'multiply', scalingFactor: 0.2 }
                            ]
                        },
                        {
                            id: 'group-3',
                            name: 'Indirect Costs',
                            items: [
                                { id: 'item-6', label: 'Engineering', operation: 'multiply', scalingFactor: 0.15 },
                                { id: 'item-7', label: 'Contingency', operation: 'multiply', scalingFactor: 0.2 }
                            ]
                        }
                    ],
                    protectedTabs: ['group-1'],
                    tabConfigs: [
                        { id: 'group-1', label: 'Equipment Costs', isProtected: true, _scalingType: 'Amount4' },
                        { id: 'group-2', label: 'Installation Factors', isProtected: false, _scalingType: 'Amount4' },
                        { id: 'group-3', label: 'Indirect Costs', isProtected: false, _scalingType: 'Amount4' }
                    ]
                }
            }
        },
        {
            id: 'general-item-2',
            name: 'Lifecycle Cost Analysis Framework',
            description: 'Comprehensive framework for lifecycle cost analysis',
            category: 'Life Cycle Assessment',
            tags: ['lifecycle', 'LCA', 'analysis'],
            dateAdded: '2024-01-20T11:30:00Z',
            modeler: 'Maria Chen',
            usage: { total: 198, viewCount: 321, importCount: 198, shareCount: 64 },
            configuration: {
                version: "1.2.0",
                metadata: {
                    exportDate: '2024-01-20T11:30:00Z',
                    exportedBy: "ScalingModule",
                    description: "Lifecycle cost analysis framework",
                    scalingType: "Amount6"
                },
                currentState: {
                    selectedGroupIndex: 0,
                    scalingGroups: [
                        {
                            id: 'group-1',
                            name: 'Initial Investment',
                            items: [
                                { id: 'item-1', label: 'Purchase Cost', operation: 'add', scalingFactor: 1 },
                                { id: 'item-2', label: 'Installation', operation: 'add', scalingFactor: 1 }
                            ]
                        },
                        {
                            id: 'group-2',
                            name: 'Operation',
                            items: [
                                { id: 'item-3', label: 'Energy', operation: 'add', scalingFactor: 1 },
                                { id: 'item-4', label: 'Maintenance', operation: 'add', scalingFactor: 1 },
                                { id: 'item-5', label: 'Labor', operation: 'add', scalingFactor: 1 }
                            ]
                        },
                        {
                            id: 'group-3',
                            name: 'End of Life',
                            items: [
                                { id: 'item-6', label: 'Disposal', operation: 'add', scalingFactor: 1 },
                                { id: 'item-7', label: 'Salvage Value', operation: 'subtract', scalingFactor: 1 }
                            ]
                        },
                        {
                            id: 'group-4',
                            name: 'Environmental Impact',
                            items: [
                                { id: 'item-8', label: 'Carbon Footprint', operation: 'add', scalingFactor: 1 },
                                { id: 'item-9', label: 'Resource Depletion', operation: 'add', scalingFactor: 1 }
                            ]
                        }
                    ],
                    protectedTabs: [],
                    tabConfigs: [
                        { id: 'group-1', label: 'Initial Investment', isProtected: false, _scalingType: 'Amount6' },
                        { id: 'group-2', label: 'Operation', isProtected: false, _scalingType: 'Amount6' },
                        { id: 'group-3', label: 'End of Life', isProtected: false, _scalingType: 'Amount6' },
                        { id: 'group-4', label: 'Environmental Impact', isProtected: false, _scalingType: 'Amount6' }
                    ]
                }
            }
        }
    ],
    ciloItems: {
        'fluid-handling': [
            {
                id: 'fluid-item-1',
                name: 'Pumping System Economics',
                description: 'Economic model for industrial pumping systems',
                category: 'Equipment Sizing',
                tags: ['pumps', 'fluid', 'hydraulic', 'energy efficiency'],
                dateAdded: '2024-02-05T10:15:00Z',
                modeler: 'Fluid Systems Group',
                usage: { total: 87, viewCount: 145, importCount: 87, shareCount: 32 },
                configuration: {
                    version: "1.2.0",
                    metadata: {
                        exportDate: '2024-02-05T10:15:00Z',
                        exportedBy: "ScalingModule",
                        description: "Pumping system economics model",
                        scalingType: "Amount5"
                    },
                    currentState: {
                        selectedGroupIndex: 0,
                        scalingGroups: [
                            {
                                id: 'group-1',
                                name: 'Pump Selection',
                                items: [
                                    { id: 'item-1', label: 'Base Pump Cost', operation: 'add', scalingFactor: 1 },
                                    { id: 'item-2', label: 'Materials Factor', operation: 'multiply', scalingFactor: 1 }
                                ]
                            },
                            {
                                id: 'group-2',
                                name: 'Operating Costs',
                                items: [
                                    { id: 'item-3', label: 'Energy', operation: 'add', scalingFactor: 1 },
                                    { id: 'item-4', label: 'Maintenance', operation: 'add', scalingFactor: 1 }
                                ]
                            }
                        ],
                        protectedTabs: [],
                        tabConfigs: [
                            { id: 'group-1', label: 'Pump Selection', isProtected: false, _scalingType: 'Amount5' },
                            { id: 'group-2', label: 'Operating Costs', isProtected: false, _scalingType: 'Amount5' }
                        ]
                    }
                }
            }
        ],
        'thermal-systems': [
            {
                id: 'thermal-item-1',
                name: 'Heat Exchanger Optimization',
                description: 'Economic optimization model for industrial heat exchangers',
                category: 'Heat Balance',
                tags: ['heat exchanger', 'thermal', 'optimization'],
                dateAdded: '2024-01-15T14:20:00Z',
                modeler: 'Thermal Design Institute',
                usage: { total: 65, viewCount: 112, importCount: 65, shareCount: 23 },
                configuration: {
                    version: "1.2.0",
                    metadata: {
                        exportDate: '2024-01-15T14:20:00Z',
                        exportedBy: "ScalingModule",
                        description: "Heat exchanger optimization model",
                        scalingType: "Amount5"
                    },
                    currentState: {
                        selectedGroupIndex: 0,
                        scalingGroups: [
                            {
                                id: 'group-1',
                                name: 'Heat Exchanger Cost',
                                items: [
                                    { id: 'item-1', label: 'Base Cost', operation: 'add', scalingFactor: 1 },
                                    { id: 'item-2', label: 'Area Factor', operation: 'power', scalingFactor: 0.6 }
                                ]
                            },
                            {
                                id: 'group-2',
                                name: 'Performance Metrics',
                                items: [
                                    { id: 'item-3', label: 'Heat Transfer Rate', operation: 'add', scalingFactor: 1 },
                                    { id: 'item-4', label: 'Pressure Drop', operation: 'add', scalingFactor: 1 }
                                ]
                            }
                        ],
                        protectedTabs: [],
                        tabConfigs: [
                            { id: 'group-1', label: 'Heat Exchanger Cost', isProtected: false, _scalingType: 'Amount5' },
                            { id: 'group-2', label: 'Performance Metrics', isProtected: false, _scalingType: 'Amount5' }
                        ]
                    }
                }
            }
        ],
        'columns': [
            {
                id: 'column-item-1',
                name: 'Distillation Column Sizing',
                description: 'Economic model for distillation column sizing and costing',
                category: 'Equipment Sizing',
                tags: ['distillation', 'column', 'separation'],
                dateAdded: '2023-12-10T09:30:00Z',
                modeler: 'Separation Technologies Inc.',
                usage: { total: 103, viewCount: 178, importCount: 103, shareCount: 45 },
                configuration: {
                    version: "1.2.0",
                    metadata: {
                        exportDate: '2023-12-10T09:30:00Z',
                        exportedBy: "ScalingModule",
                        description: "Distillation column sizing model",
                        scalingType: "Amount4"
                    },
                    currentState: {
                        selectedGroupIndex: 0,
                        scalingGroups: [
                            {
                                id: 'group-1',
                                name: 'Column Shell',
                                items: [
                                    { id: 'item-1', label: 'Base Cost', operation: 'add', scalingFactor: 1 },
                                    { id: 'item-2', label: 'Height Factor', operation: 'power', scalingFactor: 0.7 },
                                    { id: 'item-3', label: 'Diameter Factor', operation: 'power', scalingFactor: 1.2 }
                                ]
                            },
                            {
                                id: 'group-2',
                                name: 'Internals',
                                items: [
                                    { id: 'item-4', label: 'Trays', operation: 'add', scalingFactor: 1 },
                                    { id: 'item-5', label: 'Packing', operation: 'add', scalingFactor: 1 }
                                ]
                            }
                        ],
                        protectedTabs: [],
                        tabConfigs: [
                            { id: 'group-1', label: 'Column Shell', isProtected: false, _scalingType: 'Amount4' },
                            { id: 'group-2', label: 'Internals', isProtected: false, _scalingType: 'Amount4' }
                        ]
                    }
                }
            }
        ],
        'renewable-systems': [
            {
                id: 'renewable-item-1',
                name: 'Solar PV Economics',
                description: 'Economic model for utility-scale solar photovoltaic installations',
                category: 'ROI Models',
                tags: ['solar', 'renewable', 'PV', 'economics'],
                dateAdded: '2024-02-20T13:45:00Z',
                modeler: 'Renewable Energy Consortium',
                usage: { total: 72, viewCount: 124, importCount: 72, shareCount: 38 },
                configuration: {
                    version: "1.2.0",
                    metadata: {
                        exportDate: '2024-02-20T13:45:00Z',
                        exportedBy: "ScalingModule",
                        description: "Solar PV economics model",
                        scalingType: "Amount7"
                    },
                    currentState: {
                        selectedGroupIndex: 0,
                        scalingGroups: [
                            {
                                id: 'group-1',
                                name: 'Capital Expenditure',
                                items: [
                                    { id: 'item-1', label: 'PV Modules', operation: 'add', scalingFactor: 1 },
                                    { id: 'item-2', label: 'Inverters', operation: 'add', scalingFactor: 1 },
                                    { id: 'item-3', label: 'Balance of System', operation: 'add', scalingFactor: 1 }
                                ]
                            },
                            {
                                id: 'group-2',
                                name: 'Revenue Projection',
                                items: [
                                    { id: 'item-4', label: 'Energy Production', operation: 'add', scalingFactor: 1 },
                                    { id: 'item-5', label: 'PPA Rate', operation: 'multiply', scalingFactor: 1 }
                                ]
                            }
                        ],
                        protectedTabs: [],
                        tabConfigs: [
                            { id: 'group-1', label: 'Capital Expenditure', isProtected: false, _scalingType: 'Amount7' },
                            { id: 'group-2', label: 'Revenue Projection', isProtected: false, _scalingType: 'Amount7' }
                        ]
                    }
                }
            }
        ],
        'power-grid': [
            {
                id: 'grid-item-1',
                name: 'Transmission Line Economics',
                description: 'Economic model for high-voltage transmission line projects',
                category: 'Capital Cost Estimation',
                tags: ['transmission', 'grid', 'power', 'high-voltage'],
                dateAdded: '2023-11-25T11:10:00Z',
                modeler: 'Power Systems Engineering Group',
                usage: { total: 58, viewCount: 96, importCount: 58, shareCount: 27 },
                configuration: {
                    version: "1.2.0",
                    metadata: {
                        exportDate: '2023-11-25T11:10:00Z',
                        exportedBy: "ScalingModule",
                        description: "Transmission line economics model",
                        scalingType: "Amount4"
                    },
                    currentState: {
                        selectedGroupIndex: 0,
                        scalingGroups: [
                            {
                                id: 'group-1',
                                name: 'Line Construction',
                                items: [
                                    { id: 'item-1', label: 'Towers', operation: 'add', scalingFactor: 1 },
                                    { id: 'item-2', label: 'Conductors', operation: 'add', scalingFactor: 1 },
                                    { id: 'item-3', label: 'Insulators', operation: 'add', scalingFactor: 1 }
                                ]
                            },
                            {
                                id: 'group-2',
                                name: 'Substations',
                                items: [
                                    { id: 'item-4', label: 'Transformers', operation: 'add', scalingFactor: 1 },
                                    { id: 'item-5', label: 'Switchgear', operation: 'add', scalingFactor: 1 }
                                ]
                            }
                        ],
                        protectedTabs: [],
                        tabConfigs: [
                            { id: 'group-1', label: 'Line Construction', isProtected: false, _scalingType: 'Amount4' },
                            { id: 'group-2', label: 'Substations', isProtected: false, _scalingType: 'Amount4' }
                        ]
                    }
                }
            }
        ]
    },
    userProfiles: {
        'test-user-123': {
            id: 'test-user-123',
            name: 'John Doe',
            email: 'john.doe@example.com',
            createdAt: '2023-10-01T08:00:00Z',
            lastActive: '2024-04-01T15:30:00Z',
            isAnonymous: false,
            preferences: {
                defaultLibraryView: 'grid',
                defaultSorting: 'dateAdded',
                showUsageStats: true
            }
        }
    },
    shelves: ['favorites', 'projects', 'templates', 'archived']
};

/**
 * Get mock data filtered by various parameters
 * @param {string} category - Data category to retrieve
 * @param {Object} filters - Optional filters to apply
 * @returns {Array|Object} Filtered mock data
 */
export const getMockData = (category, filters = {}) => {
    let result;

    // Retrieve base data
    switch (category) {
        case 'personalLibrary':
            result = [...mockData.personalLibrary];
            break;
        case 'generalLibrary':
            result = [...mockData.generalLibrary];
            break;
        case 'ciloItems':
            if (filters.ciloType) {
                result = mockData.ciloItems[filters.ciloType] || [];
            } else {
                // Flatten all cilo items into a single array if no specific type requested
                result = Object.values(mockData.ciloItems).flat();
            }
            break;
        case 'userProfile':
            result = filters.userId ? mockData.userProfiles[filters.userId] : null;
            break;
        case 'shelves':
            result = [...mockData.shelves];
            break;
        default:
            result = null;
    }

    // Return early if no result or no filters
    if (!result || Object.keys(filters).length === 0) {
        return result;
    }

    // Apply filters for array data
    if (Array.isArray(result)) {
        // Filter by search term
        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            result = result.filter(item =>
                (item.name && item.name.toLowerCase().includes(searchLower)) ||
                (item.description && item.description.toLowerCase().includes(searchLower)) ||
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
                (item.modeler && item.modeler.toLowerCase().includes(searchLower))
            );
        }

        // Filter by category
        if (filters.category && filters.category !== 'all') {
            result = result.filter(item => item.category === filters.category);
        }

        // Filter by shelf
        if (filters.shelf) {
            if (filters.shelf === 'favorites') {
                result = result.filter(item => item.isFavorite);
            } else if (filters.shelf !== 'all') {
                result = result.filter(item => item.shelf === filters.shelf);
            }
        }

        // Filter by user ID
        if (filters.userId) {
            result = result.filter(item => item.userId === filters.userId);
        }

        // Filter by date range
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            result = result.filter(item => new Date(item.dateAdded) >= startDate);
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            result = result.filter(item => new Date(item.dateAdded) <= endDate);
        }

        // Sort results
        if (filters.sortBy) {
            result.sort((a, b) => {
                switch (filters.sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'dateAdded':
                        return new Date(b.dateAdded) - new Date(a.dateAdded);
                    case 'dateModified':
                        return new Date(b.dateModified || b.dateAdded) - new Date(a.dateModified || a.dateAdded);
                    case 'popularity':
                        return (b.usage?.total || 0) - (a.usage?.total || 0);
                    case 'complexity':
                        return (
                            b.configuration.currentState.scalingGroups.length -
                            a.configuration.currentState.scalingGroups.length
                        );
                    default:
                        return 0;
                }
            });
        }

        // Limit results
        if (filters.limit && typeof filters.limit === 'number') {
            result = result.slice(0, filters.limit);
        }
    }

    return result;
};

export default {
    mockData,
    getMockData
};