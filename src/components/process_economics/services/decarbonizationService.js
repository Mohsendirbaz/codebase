import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, useMockFirebase } from '../../../firebase/config';
import { getCurrentUserId } from '../utils/authUtils';

/**
 * Get decarbonization pathways data
 * @returns {Promise<Object>} Pathways data
 */
export const getDecarbonizationPathways = async () => {
  try {
    // Use mock data for development/testing
    if (useMockFirebase) {
      return getMockPathwaysData();
    }
    
    // Otherwise use Firebase
    const pathwaysRef = collection(db, 'decarbonization_pathways');
    const snapshot = await getDocs(pathwaysRef);
    
    const pathways = {};
    snapshot.forEach(doc => {
      pathways[doc.id] = {
        id: doc.id,
        ...doc.data()
      };
    });
    
    return pathways;
  } catch (error) {
    console.error('Error getting decarbonization pathways:', error);
    return getMockPathwaysData();  // Fallback to mock data
  }
};

/**
 * Get decarbonization pathway by ID
 * @param {string} pathwayId - ID of the pathway
 * @returns {Promise<Object>} Pathway data
 */
export const getDecarbonizationPathwayById = async (pathwayId) => {
  try {
    // Use mock data for development/testing
    if (useMockFirebase) {
      const mockData = getMockPathwaysData();
      return mockData[pathwayId] || null;
    }
    
    // Otherwise use Firebase
    const pathwayRef = doc(db, 'decarbonization_pathways', pathwayId);
    const snapshot = await getDoc(pathwayRef);
    
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting decarbonization pathway:', error);
    const mockData = getMockPathwaysData();
    return mockData[pathwayId] || null;  // Fallback to mock data
  }
};

/**
 * Get decarbonization pathways by category
 * @param {string} category - Category to filter by
 * @returns {Promise<Array>} Array of pathways
 */
export const getDecarbonizationPathwaysByCategory = async (category) => {
  try {
    // Use mock data for development/testing
    if (useMockFirebase) {
      const mockData = getMockPathwaysData();
      return Object.values(mockData).filter(pathway => pathway.category === category);
    }
    
    // Otherwise use Firebase
    const pathwaysRef = collection(db, 'decarbonization_pathways');
    const q = query(pathwaysRef, where('category', '==', category));
    const snapshot = await getDocs(q);
    
    const pathways = [];
    snapshot.forEach(doc => {
      pathways.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return pathways;
  } catch (error) {
    console.error('Error getting decarbonization pathways by category:', error);
    const mockData = getMockPathwaysData();
    return Object.values(mockData).filter(pathway => pathway.category === category);
  }
};

/**
 * Get hard-to-decarbonize pathways
 * @returns {Promise<Array>} Array of hard-to-decarbonize pathways
 */
export const getHardToDecarbonizePathways = async () => {
  try {
    // Use mock data for development/testing
    if (useMockFirebase) {
      const mockData = getMockPathwaysData();
      return Object.values(mockData).filter(pathway => pathway.isHardToDecarbonize);
    }
    
    // Otherwise use Firebase
    const pathwaysRef = collection(db, 'decarbonization_pathways');
    const q = query(pathwaysRef, where('isHardToDecarbonize', '==', true));
    const snapshot = await getDocs(q);
    
    const pathways = [];
    snapshot.forEach(doc => {
      pathways.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return pathways;
  } catch (error) {
    console.error('Error getting hard to decarbonize pathways:', error);
    const mockData = getMockPathwaysData();
    return Object.values(mockData).filter(pathway => pathway.isHardToDecarbonize);
  }
};

/**
 * Save pathway to user library
 * @param {Object} pathway - Pathway object
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const savePathwayToLibrary = async (pathway, userId = getCurrentUserId()) => {
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
    
    // Use library service to save to personal library
    const { saveToPersonalLibrary } = require('./libraryService');
    await saveToPersonalLibrary(userId, item);
    
    return true;
  } catch (error) {
    console.error('Error saving pathway to library:', error);
    return false;
  }
};

/**
 * Mock pathways data for development/testing
 */
const getMockPathwaysData = () => {
  return {
    "wind-pem": {
      id: "wind-pem",
      name: "Wind PEM",
      description: "Hydrogen production via electrolysis using wind power",
      category: "renewable",
      isHardToDecarbonize: false,
      inputs: {
        "Electricity (Commercial) kWh": 0.98,
        "Electricity (Industrial) kWh": null,
        "Electricity (On-shore wind) kWh": 55.50,
        "Natural Gas (Commercial) mmBtu": null,
        "Natural Gas (Industrial) mmBtu": null,
        "Biomass (s.ton)": null,
        "Coal (mmBtu)": null,
        "Diesel (gal)": null,
        "Water Total (gal)": 3.78
      },
      economics: {
        "Real Levelized Cost ($/kg H₂)": 2.77
      },
      carbonIntensity: 1.2, // kg CO2e/kg H2
      maturityLevel: "commercial",
      readinessYear: 2023
    },
    "solar-pem": {
      id: "solar-pem",
      name: "Solar PEM",
      description: "Hydrogen production via electrolysis using solar power",
      category: "renewable",
      isHardToDecarbonize: false,
      inputs: {
        "Electricity (Commercial) kWh": 0.98,
        "Electricity (Industrial) kWh": null,
        "Electricity (On-shore wind) kWh": null,
        "Natural Gas (Commercial) mmBtu": null,
        "Natural Gas (Industrial) mmBtu": null,
        "Biomass (s.ton)": null,
        "Coal (mmBtu)": null,
        "Diesel (gal)": null,
        "Water Total (gal)": 3.78
      },
      economics: {
        "Real Levelized Cost ($/kg H₂)": 2.35
      },
      carbonIntensity: 1.5, // kg CO2e/kg H2
      maturityLevel: "commercial",
      readinessYear: 2022
    },
    "natgas-ccs": {
      id: "natgas-ccs",
      name: "Natural Gas w/ CCS",
      description: "Hydrogen production via steam methane reforming with carbon capture",
      category: "low-carbon",
      isHardToDecarbonize: true,
      inputs: {
        "Electricity (Commercial) kWh": 0.98,
        "Electricity (Industrial) kWh": 3.49,
        "Electricity (On-shore wind) kWh": null,
        "Natural Gas (Commercial) mmBtu": null,
        "Natural Gas (Industrial) mmBtu": 0.16,
        "Biomass (s.ton)": null,
        "Coal (mmBtu)": null,
        "Diesel (gal)": null,
        "Water Total (gal)": 8.12
      },
      economics: {
        "Real Levelized Cost ($/kg H₂)": 5.04
      },
      carbonIntensity: 1.8, // kg CO2e/kg H2
      maturityLevel: "early-commercial",
      readinessYear: 2025
    },
    "natgas-noccs": {
      id: "natgas-noccs",
      name: "Natural Gas no CCS",
      description: "Hydrogen production via steam methane reforming without carbon capture",
      category: "fossil",
      isHardToDecarbonize: true,
      inputs: {
        "Electricity (Commercial) kWh": 0.98,
        "Electricity (Industrial) kWh": 0.13,
        "Electricity (On-shore wind) kWh": null,
        "Natural Gas (Commercial) mmBtu": null,
        "Natural Gas (Industrial) mmBtu": 0.16,
        "Biomass (s.ton)": null,
        "Coal (mmBtu)": null,
        "Diesel (gal)": null,
        "Water Total (gal)": 4.34
      },
      economics: {
        "Real Levelized Cost ($/kg H₂)": 1.70
      },
      carbonIntensity: 10.4, // kg CO2e/kg H2
      maturityLevel: "mature",
      readinessYear: 2020
    },
    "solid-oxide": {
      id: "solid-oxide",
      name: "Solid Oxide PEM",
      description: "Hydrogen production via solid oxide electrolysis",
      category: "emerging",
      isHardToDecarbonize: false,
      inputs: {
        "Electricity (Commercial) kWh": 0.98,
        "Electricity (Industrial) kWh": 36.80,
        "Electricity (On-shore wind) kWh": null,
        "Natural Gas (Commercial) mmBtu": null,
        "Natural Gas (Industrial) mmBtu": 0.06,
        "Biomass (s.ton)": null,
        "Coal (mmBtu)": null,
        "Diesel (gal)": null,
        "Water Total (gal)": 2.38
      },
      economics: {
        "Real Levelized Cost ($/kg H₂)": 4.53
      },
      carbonIntensity: 2.3, // kg CO2e/kg H2
      maturityLevel: "demonstration",
      readinessYear: 2027
    },
    "biomass-pem": {
      id: "biomass-pem",
      name: "Biomass",
      description: "Hydrogen production via biomass gasification",
      category: "renewable",
      isHardToDecarbonize: false,
      inputs: {
        "Electricity (Commercial) kWh": 0.98,
        "Electricity (Industrial) kWh": 55.50,
        "Electricity (On-shore wind) kWh": null,
        "Natural Gas (Commercial) mmBtu": null,
        "Natural Gas (Industrial) mmBtu": null,
        "Biomass (s.ton)": 0.015,
        "Coal (mmBtu)": null,
        "Diesel (gal)": null,
        "Water Total (gal)": 3.78
      },
      economics: {
        "Real Levelized Cost ($/kg H₂)": 4.64
      },
      carbonIntensity: 2.0, // kg CO2e/kg H2
      maturityLevel: "demonstration",
      readinessYear: 2026
    },
    "coal-ccs": {
      id: "coal-ccs",
      name: "Coal w/ CCS",
      description: "Hydrogen production via coal gasification with carbon capture",
      category: "fossil",
      isHardToDecarbonize: true,
      inputs: {
        "Electricity (Commercial) kWh": 0.98,
        "Electricity (Industrial) kWh": null,
        "Electricity (On-shore wind) kWh": null,
        "Natural Gas (Commercial) mmBtu": 0.006,
        "Natural Gas (Industrial) mmBtu": null,
        "Biomass (s.ton)": null,
        "Coal (mmBtu)": 0.19,
        "Diesel (gal)": null,
        "Water Total (gal)": 3.45
      },
      economics: {
        "Real Levelized Cost ($/kg H₂)": 2.16
      },
      carbonIntensity: 2.5, // kg CO2e/kg H2
      maturityLevel: "demonstration",
      readinessYear: 2028
    },
    "coal-noccs": {
      id: "coal-noccs",
      name: "Coal no CCS",
      description: "Hydrogen production via coal gasification without carbon capture",
      category: "fossil",
      isHardToDecarbonize: true,
      inputs: {
        "Electricity (Commercial) kWh": 0.98,
        "Electricity (Industrial) kWh": 1.04,
        "Electricity (On-shore wind) kWh": null,
        "Natural Gas (Commercial) mmBtu": null,
        "Natural Gas (Industrial) mmBtu": null,
        "Biomass (s.ton)": null,
        "Coal (mmBtu)": 0.19,
        "Diesel (gal)": null,
        "Water Total (gal)": 7.94
      },
      economics: {
        "Real Levelized Cost ($/kg H₂)": 10.30
      },
      carbonIntensity: 18.2, // kg CO2e/kg H2
      maturityLevel: "mature",
      readinessYear: 2020
    }
  };
};

export default {
  getDecarbonizationPathways,
  getDecarbonizationPathwayById,
  getDecarbonizationPathwaysByCategory,
  getHardToDecarbonizePathways,
  savePathwayToLibrary
};