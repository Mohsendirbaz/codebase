// src/modules/processEconomics/data/ciloData.js
import {
    BeakerIcon,
    FireIcon,
    CubeTransparentIcon,
    SunIcon, 
    BoltIcon
  } from '@heroicons/react/24/outline';
  
  export const ciloTypes = {
    FLUID_HANDLING: 'fluid-handling',
    THERMAL_SYSTEMS: 'thermal-systems',
    COLUMNS: 'columns',
    RENEWABLE_SYSTEMS: 'renewable-systems',
    POWER_GRID: 'power-grid'
  };
  
  export const ciloData = [
    {
      id: ciloTypes.FLUID_HANDLING,
      name: 'Fluid Handling Systems',
      icon: BeakerIcon,
      description: 'Specialized configurations for pumps, pipes, valves, and fluid transport systems.',
      categories: ['Pumps', 'Pipes', 'Valves', 'Flow Control', 'Pressure Systems'],
      tags: ['fluid', 'flow', 'hydraulic', 'pump', 'valve', 'pressure']
    },
    {
      id: ciloTypes.THERMAL_SYSTEMS,
      name: 'Thermal Systems',
      icon: FireIcon,
      description: 'Heat exchangers, boilers, thermal storage, and temperature control systems.',
      categories: ['Heat Exchangers', 'Boilers', 'Thermal Storage', 'Cooling Systems', 'Insulation'],
      tags: ['heat', 'thermal', 'temperature', 'exchanger', 'cooling', 'boiler']
    },
    {
      id: ciloTypes.COLUMNS,
      name: 'Columns',
      icon: CubeTransparentIcon,
      description: 'Distillation, absorption, extraction, and separation column configurations.',
      categories: ['Distillation', 'Absorption', 'Extraction', 'Packed Columns', 'Tray Columns'],
      tags: ['column', 'separation', 'distillation', 'extraction', 'absorption']
    },
    {
      id: ciloTypes.RENEWABLE_SYSTEMS,
      name: 'Renewable Systems',
      icon: SunIcon,
      description: 'Solar, wind, hydro, biomass, and other renewable energy system configurations.',
      categories: ['Solar', 'Wind', 'Hydro', 'Biomass', 'Geothermal', 'Storage'],
      tags: ['renewable', 'solar', 'wind', 'hydro', 'biomass', 'sustainable']
    },
    {
      id: ciloTypes.POWER_GRID,
      name: 'Power Grid',
      icon: BoltIcon,
      description: 'Transmission, distribution, control systems, and grid stability configurations.',
      categories: ['Transmission', 'Distribution', 'Control', 'Protection', 'Stability'],
      tags: ['grid', 'power', 'electric', 'transmission', 'distribution', 'energy']
    }
  ];