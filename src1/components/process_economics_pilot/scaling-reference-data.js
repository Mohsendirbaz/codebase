/**
 * Process Economics Reference Data
 * 
 * This module provides standard scaling factors and exponents for common process equipment
 * based on industry references to be used with the Process Economics Library
 */

// Standard scaling exponents by equipment type (based on six-tenths rule and industry standards)
export const scalingExponents = {
  // Heat Exchange Equipment
  heatExchangers: {
    shellAndTube: 0.6,
    plateAndFrame: 0.58,
    airCooled: 0.62,
    doublePipe: 0.55,
    spiralHeatExchanger: 0.63,
    condensers: 0.65,
    reboilers: 0.67,
    evaporators: 0.64
  },
  
  // Pressure Vessels & Reactors
  vessels: {
    storageTanks: 0.57,
    pressureVessels: 0.62,
    reactors: {
      cstr: 0.54,
      tubular: 0.56,
      fixedBed: 0.65,
      fluidizedBed: 0.7
    },
    columns: {
      tray: 0.65,
      packed: 0.6,
      highPressure: 0.72
    }
  },
  
  // Fluid Handling Equipment
  fluidHandling: {
    pumps: {
      centrifugal: 0.55,
      reciprocating: 0.6,
      rotary: 0.52,
      metering: 0.48
    },
    compressors: {
      centrifugal: 0.75,
      reciprocating: 0.7,
      screw: 0.65,
      axial: 0.8
    },
    blowers: 0.6,
    fans: 0.5,
    vacuumPumps: 0.63
  },
  
  // Solids Handling Equipment
  solidsHandling: {
    conveyors: 0.7,
    elevators: 0.65,
    feeders: 0.5,
    crushers: 0.75,
    grinders: 0.8,
    mixers: 0.6,
    screeners: 0.5,
    dryers: 0.7
  },
  
  // Separation Equipment
  separationEquipment: {
    filters: {
      plateAndFrame: 0.58,
      rotaryVacuum: 0.65,
      baghouse: 0.7,
      cartridge: 0.5
    },
    centrifuges: 0.68,
    cyclones: 0.5,
    electrostatic: 0.7,
    membranes: 0.85,
    extractors: 0.63,
    crystallizers: 0.7
  },
  
  // Utilities & Support Systems
  utilities: {
    cooling: {
      coolingTowers: 0.65,
      chillers: 0.7,
      refrigeration: 0.75
    },
    heating: {
      boilers: 0.7,
      furnaces: 0.75,
      heaters: 0.6
    },
    waterTreatment: 0.65,
    airCompression: 0.67,
    powerGeneration: 0.8,
    wasteDisposal: 0.6
  },
  
  // Instrumentation & Control
  instrumentation: {
    processControl: 0.3,
    analyzers: 0.2,
    safetySystem: 0.4
  }
};

// Material factors for adjusting equipment costs
export const materialFactors = {
  carbonSteel: 1.0,
  lowAlloySteel: 1.25,
  stainlessSteel304: 1.8,
  stainlessSteel316: 2.1,
  hastelloyC: 3.5,
  nickelAlloy: 3.2,
  titanium: 5.0,
  copper: 2.5,
  aluminum: 1.5,
  fiberglassReinforced: 1.8,
  polyvinylChloride: 0.7,
  polyethylene: 0.65,
  polypropylene: 0.7,
  ptfe: 4.0,
  glassLined: 2.4,
  rubberLined: 1.5,
  brick: 1.8,
  concrete: 0.9
};

// Pressure factors for adjusting equipment costs
export const pressureFactors = {
  // For pressure vessels based on design pressure in bar gauge
  pressureVessels: (pressureBar) => {
    if (pressureBar <= 5) return 1.0;
    else if (pressureBar <= 10) return 1.2;
    else if (pressureBar <= 20) return 1.4;
    else if (pressureBar <= 50) return 1.8;
    else if (pressureBar <= 100) return 2.5;
    else return 3.0 + (pressureBar - 100) * 0.015;
  },
  
  // For heat exchangers based on design pressure in bar gauge
  heatExchangers: (pressureBar) => {
    if (pressureBar <= 5) return 1.0;
    else if (pressureBar <= 10) return 1.1;
    else if (pressureBar <= 20) return 1.25;
    else if (pressureBar <= 50) return 1.5;
    else if (pressureBar <= 100) return 2.0;
    else return 2.5 + (pressureBar - 100) * 0.01;
  },
  
  // For pumps based on design pressure in bar gauge
  pumps: (pressureBar) => {
    if (pressureBar <= 10) return 1.0;
    else if (pressureBar <= 20) return 1.15;
    else if (pressureBar <= 50) return 1.3;
    else if (pressureBar <= 100) return 1.6;
    else return 2.0 + (pressureBar - 100) * 0.01;
  }
};

// Temperature factors for adjusting equipment costs
export const temperatureFactors = {
  // For heat exchangers based on design temperature in °C
  heatExchangers: (tempC) => {
    if (tempC <= 100) return 1.0;
    else if (tempC <= 200) return 1.1;
    else if (tempC <= 300) return 1.3;
    else if (tempC <= 400) return 1.5;
    else if (tempC <= 500) return 1.8;
    else return 2.0 + (tempC - 500) * 0.005;
  },
  
  // For pressure vessels based on design temperature in °C
  pressureVessels: (tempC) => {
    if (tempC <= 100) return 1.0;
    else if (tempC <= 200) return 1.05;
    else if (tempC <= 300) return 1.15;
    else if (tempC <= 400) return 1.3;
    else if (tempC <= 500) return 1.5;
    else return 1.7 + (tempC - 500) * 0.003;
  }
};

// Installation factors for total installed cost calculation
export const installationFactors = {
  heatExchangers: 2.5,
  pressureVessels: 3.0,
  storageTanks: 2.2,
  columns: 4.0,
  reactors: 3.5,
  pumps: 2.3,
  compressors: 2.8,
  solidsHandling: 2.5,
  instrumentationAndControl: 2.0,
  piping: 3.5,
  electricalSystems: 2.0,
  utilities: 2.5
};

// Cost index values by year for adjusting historical costs to present day
export const costIndices = {
  // Chemical Engineering Plant Cost Index (CEPCI)
  CEPCI: {
    2010: 550.8,
    2011: 585.7,
    2012: 584.6,
    2013: 567.3,
    2014: 576.1,
    2015: 556.8,
    2016: 541.7,
    2017: 567.5,
    2018: 603.1,
    2019: 607.5,
    2020: 596.2,
    2021: 680.0, // Approximate value
    2022: 766.0, // Approximate value
    2023: 752.0, // Approximate value
    2024: 748.0  // Approximate value
  },
  
  // Marshall & Swift Equipment Cost Index (M&S)
  MarshallSwift: {
    2010: 1457.4,
    2011: 1490.2,
    2012: 1536.5,
    2013: 1582.0,
    2014: 1593.7,
    2015: 1578.9,
    2016: 1561.9,
    2017: 1593.1,
    2018: 1645.2,
    2019: 1674.8,
    2020: 1682.0, // Approximate value
    2021: 1788.0, // Approximate value
    2022: 1895.0, // Approximate value
    2023: 1920.0, // Approximate value
    2024: 1945.0  // Approximate value
  },
  
  // Engineering News-Record Construction Cost Index (ENR)
  ENR: {
    2010: 8800,
    2011: 9070,
    2012: 9308,
    2013: 9547,
    2014: 9806,
    2015: 10035,
    2016: 10338,
    2017: 10737,
    2018: 11062,
    2019: 11281,
    2020: 11642,
    2021: 12222,
    2022: 13198,
    2023: 13779,
    2024: 14300  // Approximate value
  }
};

// Function to adjust equipment cost from a reference year to current
export const adjustCostForInflation = (baseCost, referenceYear, currentYear = 2024, indexType = 'CEPCI') => {
  let indexData;
  
  // Select the appropriate cost index
  switch(indexType) {
    case 'CEPCI':
      indexData = costIndices.CEPCI;
      break;
    case 'MarshallSwift':
      indexData = costIndices.MarshallSwift;
      break;
    case 'ENR':
      indexData = costIndices.ENR;
      break;
    default:
      indexData = costIndices.CEPCI;
  }
  
  // Check if the years exist in the data
  if (!indexData[referenceYear] || !indexData[currentYear]) {
    throw new Error(`Cost indices not available for ${referenceYear} or ${currentYear}`);
  }
  
  // Calculate adjusted cost
  return baseCost * (indexData[currentYear] / indexData[referenceYear]);
};

// Template scaling relationships for common equipment types
export const equipmentTemplates = {
  // Shell and tube heat exchanger template
  shellAndTubeHeatExchanger: {
    name: "Shell & Tube Heat Exchanger",
    category: "Heat Exchangers",
    description: "Standard shell and tube heat exchanger with carbon steel construction",
    tags: ["heat transfer", "shell & tube", "basic"],
    scalingGroups: [
      {
        id: 'default',
        name: 'Default Scaling',
        items: []
      },
      {
        id: 'area-scaling',
        name: 'Area Scaling',
        items: [
          {
            id: 'base-cost',
            label: 'Base Cost',
            operation: 'multiply',
            scalingFactor: 1.0,
            enabled: true
          }
        ]
      },
      {
        id: 'pressure-adjustment',
        name: 'Pressure Adjustment',
        items: [
          {
            id: 'pressure-factor',
            label: 'Pressure Factor',
            operation: 'multiply',
            scalingFactor: 1.0,
            enabled: true
          }
        ]
      },
      {
        id: 'material-adjustment',
        name: 'Material Adjustment',
        items: [
          {
            id: 'material-factor',
            label: 'Material Factor',
            operation: 'multiply',
            scalingFactor: 1.0,
            enabled: true
          }
        ]
      }
    ],
    baseParameters: {
      heatTransferArea: 10, // m²
      designPressure: 10, // bar
      materialType: 'carbonSteel'
    },
    calculateScalingFactors: (parameters) => {
      const { heatTransferArea, designPressure, materialType } = parameters;
      
      // Calculate area scaling using six-tenths rule
      const areaScalingFactor = Math.pow(heatTransferArea / 10, scalingExponents.heatExchangers.shellAndTube);
      
      // Get pressure factor
      const pressureFactor = pressureFactors.heatExchangers(designPressure);
      
      // Get material factor
      const materialFactor = materialFactors[materialType] || 1.0;
      
      return {
        'area-scaling': {
          'base-cost': areaScalingFactor
        },
        'pressure-adjustment': {
          'pressure-factor': pressureFactor
        },
        'material-adjustment': {
          'material-factor': materialFactor
        }
      };
    }
  },
  
  // Centrifugal pump template
  centrifugalPump: {
    name: "Centrifugal Pump",
    category: "Pumps & Compressors",
    description: "Horizontal centrifugal pump with motor, baseplate, and coupling",
    tags: ["pump", "centrifugal", "fluid handling"],
    scalingGroups: [
      {
        id: 'default',
        name: 'Default Scaling',
        items: []
      },
      {
        id: 'flow-scaling',
        name: 'Flow Scaling',
        items: [
          {
            id: 'base-cost',
            label: 'Base Cost',
            operation: 'multiply',
            scalingFactor: 1.0,
            enabled: true
          }
        ]
      },
      {
        id: 'head-adjustment',
        name: 'Head/Pressure Adjustment',
        items: [
          {
            id: 'head-factor',
            label: 'Head Factor',
            operation: 'multiply',
            scalingFactor: 1.0,
            enabled: true
          }
        ]
      },
      {
        id: 'material-adjustment',
        name: 'Material Adjustment',
        items: [
          {
            id: 'material-factor',
            label: 'Material Factor',
            operation: 'multiply',
            scalingFactor: 1.0,
            enabled: true
          }
        ]
      },
      {
        id: 'motor-adjustment',
        name: 'Motor/Drive Adjustment',
        items: [
          {
            id: 'motor-factor',
            label: 'Motor Factor',
            operation: 'multiply',
            scalingFactor: 1.0,
            enabled: true
          }
        ]
      }
    ],
    baseParameters: {
      flowRate: 50, // m³/h
      head: 30, // m
      materialType: 'carbonSteel',
      motorPower: 5 // kW
    },
    calculateScalingFactors: (parameters) => {
      const { flowRate, head, materialType, motorPower } = parameters;
      
      // Calculate flow scaling
      const flowScalingFactor = Math.pow(flowRate / 50, scalingExponents.fluidHandling.pumps.centrifugal);
      
      // Calculate head factor (custom relationship)
      const headFactor = Math.pow(head / 30, 0.25);
      
      // Get material factor
      const materialFactor = materialFactors[materialType] || 1.0;
      
      // Calculate motor factor (simple linear relationship with base at 5kW)
      const motorFactor = 0.85 + (0.03 * motorPower);
      
      return {
        'flow-scaling': {
          'base-cost': flowScalingFactor
        },
        'head-adjustment': {
          'head-factor': headFactor
        },
        'material-adjustment': {
          'material-factor': materialFactor
        },
        'motor-adjustment': {
          'motor-factor': motorFactor
        }
      };
    }
  },
  
  // Storage tank template
  storageTank: {
    name: "Storage Tank",
    category: "Vessels & Tanks",
    description: "Cylindrical storage tank with typical accessories",
    tags: ["storage", "tank", "vessel"],
    scalingGroups: [
      {
        id: 'default',
        name: 'Default Scaling',
        items: []
      },
      {
        id: 'volume-scaling',
        name: 'Volume Scaling',
        items: [
          {
            id: 'base-cost',
            label: 'Base Cost',
            operation: 'multiply',
            scalingFactor: 1.0,
            enabled: true
          }
        ]
      },
      {
        id: 'material-adjustment',
        name: 'Material Adjustment',
        items: [
          {
            id: 'material-factor',
            label: 'Material Factor',
            operation: 'multiply',
            scalingFactor: 1.0,
            enabled: true
          }
        ]
      },
      {
        id: 'accessories-adjustment',
        name: 'Accessories Adjustment',
        items: [
          {
            id: 'accessories-factor',
            label: 'Accessories Factor',
            operation: 'multiply',
            scalingFactor: 1.0,
            enabled: true
          }
        ]
      }
    ],
    baseParameters: {
      volume: 100, // m³
      materialType: 'carbonSteel',
      accessories: 'basic' // basic, standard, comprehensive
    },
    calculateScalingFactors: (parameters) => {
      const { volume, materialType, accessories } = parameters;
      
      // Calculate volume scaling
      const volumeScalingFactor = Math.pow(volume / 100, scalingExponents.vessels.storageTanks);
      
      // Get material factor
      const materialFactor = materialFactors[materialType] || 1.0;
      
      // Calculate accessories factor
      let accessoriesFactor = 1.0;
      switch(accessories) {
        case 'basic':
          accessoriesFactor = 1.0;
          break;
        case 'standard':
          accessoriesFactor = 1.2;
          break;
        case 'comprehensive':
          accessoriesFactor = 1.5;
          break;
        default:
          accessoriesFactor = 1.0;
      }
      
      return {
        'volume-scaling': {
          'base-cost': volumeScalingFactor
        },
        'material-adjustment': {
          'material-factor': materialFactor
        },
        'accessories-adjustment': {
          'accessories-factor': accessoriesFactor
        }
      };
    }
  }
};

export default {
  scalingExponents,
  materialFactors,
  pressureFactors,
  temperatureFactors,
  installationFactors,
  costIndices,
  adjustCostForInflation,
  equipmentTemplates
};