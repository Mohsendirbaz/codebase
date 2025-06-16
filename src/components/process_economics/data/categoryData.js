// src/modules/processEconomics/data/categoryData.js

/**
 * Process Economics Library Categories
 * Used for categorizing configurations in the library
 */
export const categories = [
    'Capital Cost Estimation',
    'Operating Cost Models',
    'Production Planning',
    'Capacity Planning',
    'Energy Efficiency',
    'Equipment Sizing',
    'Material Balance',
    'Heat Balance',
    'Economic Analysis',
    'ROI Models',
    'Life Cycle Assessment',
    'Process Optimization',
    'Sensitivity Analysis',
    'Risk Assessment',
    'Carbon Footprint',
    'Sustainability',
    'Inventory Management',
    'Supply Chain',
    'Batch Processing',
    'Continuous Processing',
    'Quality Control',
    'Regulatory Compliance',
    'Scale-up Models',
    'Conceptual Design',
    'FEED Models',
    'Detailed Engineering',
    'Project Management',
    'Commissioning',
    'Maintenance Planning',
    'Shutdown Planning',
    'Turnaround Models',
    'Utility Systems',
    'Waste Management',
    'Retrofit Analysis',
    'Debottlenecking',
    'Decarbonization Pathway',
    'Carbon Reduction',
    'Hydrogen Production',
    'Carbon Capture',
    'Electrification'
  ];

  /**
   * Category groups organized by domain
   * Helpful for filtering and navigation
   */
  export const categoryGroups = {
    'Cost Management': [
      'Capital Cost Estimation',
      'Operating Cost Models',
      'Economic Analysis',
      'ROI Models',
      'Life Cycle Assessment'
    ],
    'Process Engineering': [
      'Equipment Sizing',
      'Material Balance',
      'Heat Balance',
      'Process Optimization',
      'Scale-up Models'
    ],
    'Production Management': [
      'Production Planning',
      'Capacity Planning',
      'Batch Processing',
      'Continuous Processing',
      'Inventory Management',
      'Supply Chain'
    ],
    'Sustainability': [
      'Energy Efficiency',
      'Carbon Footprint',
      'Sustainability',
      'Waste Management',
      'Decarbonization Pathway',
      'Carbon Reduction',
      'Hydrogen Production',
      'Carbon Capture',
      'Electrification'
    ],
    'Project Lifecycle': [
      'Conceptual Design',
      'FEED Models',
      'Detailed Engineering',
      'Project Management',
      'Commissioning'
    ],
    'Operations': [
      'Maintenance Planning',
      'Shutdown Planning',
      'Turnaround Models',
      'Utility Systems',
      'Retrofit Analysis',
      'Debottlenecking'
    ],
    'Analysis': [
      'Sensitivity Analysis',
      'Risk Assessment',
      'Quality Control',
      'Regulatory Compliance'
    ]
  };

  /**
   * Category colors for visual differentiation
   */
  export const categoryColors = {
    'Capital Cost Estimation': '#3b82f6', // blue
    'Operating Cost Models': '#10b981', // green
    'Production Planning': '#8b5cf6', // purple
    'Capacity Planning': '#8b5cf6', // purple
    'Energy Efficiency': '#f59e0b', // amber
    'Equipment Sizing': '#ef4444', // red
    'Material Balance': '#ef4444', // red
    'Heat Balance': '#ef4444', // red
    'Economic Analysis': '#3b82f6', // blue
    'ROI Models': '#3b82f6', // blue
    'Life Cycle Assessment': '#10b981', // green
    'Process Optimization': '#8b5cf6', // purple
    'Sensitivity Analysis': '#f59e0b', // amber
    'Risk Assessment': '#f59e0b', // amber
    'Carbon Footprint': '#10b981', // green
    'Sustainability': '#10b981', // green
    'Inventory Management': '#ec4899', // pink
    'Supply Chain': '#ec4899', // pink
    'Batch Processing': '#8b5cf6', // purple
    'Continuous Processing': '#8b5cf6', // purple
    'Quality Control': '#f59e0b', // amber
    'Regulatory Compliance': '#f59e0b', // amber
    'Scale-up Models': '#ef4444', // red
    'Conceptual Design': '#3b82f6', // blue
    'FEED Models': '#3b82f6', // blue
    'Detailed Engineering': '#3b82f6', // blue
    'Project Management': '#ec4899', // pink
    'Commissioning': '#ec4899', // pink
    'Maintenance Planning': '#f59e0b', // amber
    'Shutdown Planning': '#f59e0b', // amber
    'Turnaround Models': '#f59e0b', // amber
    'Utility Systems': '#ef4444', // red
    'Waste Management': '#10b981', // green
    'Retrofit Analysis': '#ef4444', // red
    'Debottlenecking': '#ef4444', // red
    'Decarbonization Pathway': '#10b981', // green
    'Carbon Reduction': '#10b981', // green
    'Hydrogen Production': '#8b5cf6', // purple
    'Carbon Capture': '#0891b2', // cyan
    'Electrification': '#ec4899'  // pink
  };

  /**
   * Category icons mapping
   * Maps categories to their respective icon components
   * Note: Actual icon imports would need to be added
   */
  export const categoryIcons = {
    'Capital Cost Estimation': 'CurrencyDollarIcon',
    'Operating Cost Models': 'CalculatorIcon',
    'Production Planning': 'CalendarIcon',
    'Capacity Planning': 'ChartBarIcon',
    'Energy Efficiency': 'BoltIcon',
    'Equipment Sizing': 'BeakerIcon',
    'Material Balance': 'ScaleIcon',
    'Heat Balance': 'FireIcon',
    'Economic Analysis': 'TrendingUpIcon',
    'ROI Models': 'CashIcon',
    'Life Cycle Assessment': 'ClockIcon',
    'Process Optimization': 'AdjustmentsHorizontalIcon',
    'Sensitivity Analysis': 'ChartPieIcon',
    'Risk Assessment': 'ExclamationCircleIcon',
    'Carbon Footprint': 'CloudIcon',
    'Sustainability': 'GlobeIcon',
    'Inventory Management': 'CubeIcon',
    'Supply Chain': 'TruckIcon',
    'Batch Processing': 'Squares2X2Icon',
    'Continuous Processing': 'ArrowsExpandIcon',
    'Quality Control': 'BadgeCheckIcon',
    'Regulatory Compliance': 'DocumentTextIcon',
    'Scale-up Models': 'ArrowCircleUpIcon',
    'Conceptual Design': 'PencilAltIcon',
    'FEED Models': 'TemplateIcon',
    'Detailed Engineering': 'PuzzleIcon',
    'Project Management': 'ClipboardListIcon',
    'Commissioning': 'PlayIcon',
    'Maintenance Planning': 'WrenchIcon',
    'Shutdown Planning': 'StopIcon',
    'Turnaround Models': 'ArrowPathIcon',
    'Utility Systems': 'LightBulbIcon',
    'Waste Management': 'TrashIcon',
    'Retrofit Analysis': 'CogIcon',
    'Debottlenecking': 'SwitchHorizontalIcon',
    'Decarbonization Pathway': 'LeafIcon',
    'Carbon Reduction': 'CloudIcon',
    'Hydrogen Production': 'BeakerIcon',
    'Carbon Capture': 'FilterIcon',
    'Electrification': 'BoltIcon'
  };

  /**
   * Decarbonization categories 
   * Used for categorizing pathways in the decarbonization module
   */
  export const decarbonizationCategories = [
    'renewable',
    'low-carbon',
    'fossil',
    'emerging',
    'hydrogen',
    'carbon-capture',
    'electrification'
  ];

  /**
   * Mapping of decarbonization categories to colors
   */
  export const decarbonizationCategoryColors = {
    'renewable': '#10b981', // green
    'low-carbon': '#3b82f6', // blue
    'fossil': '#6b7280', // gray
    'emerging': '#f59e0b', // amber
    'hydrogen': '#8b5cf6', // purple
    'carbon-capture': '#0891b2', // cyan
    'electrification': '#ec4899' // pink
  };

  /**
   * Decarbonization category icons
   */
  export const decarbonizationCategoryIcons = {
    'renewable': 'LeafIcon',
    'low-carbon': 'CloudIcon',
    'fossil': 'FireIcon',
    'emerging': 'SparklesIcon',
    'hydrogen': 'BeakerIcon',
    'carbon-capture': 'FilterIcon',
    'electrification': 'BoltIcon'
  };

  export default {
    categories,
    categoryGroups,
    categoryColors,
    categoryIcons,
    decarbonizationCategories,
    decarbonizationCategoryColors,
    decarbonizationCategoryIcons
  };
