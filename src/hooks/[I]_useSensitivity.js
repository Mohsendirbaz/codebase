import { useState } from 'react';

export const useSensitivity = () => {
  const [S, setS] = useState(() => {
    const initialS = {};
    for (let i = 10; i <= 61; i++) {
      initialS[`S${i}`] = {
        mode: null,
        values: [],
        enabled: false,
        compareToKey: '',
        comparisonType: null,
        waterfall: false,
        bar: false,
        point: false,
      };
    }
    
    // Enable and configure S34-S38
    for (let i = 34; i <= 38; i++) {
      initialS[`S${i}`] = {
        ...initialS[`S${i}`],
        mode: 'symmetrical',
        enabled: true,
        compareToKey: 'S13',
        comparisonType: 'primary',
        waterfall: true,
        bar: true,
        point: true,
      };
    }
    
    return initialS;
  });

  const enableParameter = (key, config = {}) => {
    setS(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: true,
        mode: config.mode || 'symmetrical',
        compareToKey: config.compareToKey || '',
        comparisonType: config.comparisonType || null,
        waterfall: config.waterfall ?? true,
        bar: config.bar ?? true,
        point: config.point ?? true,
      }
    }));
  };

  return {
    S,
    setS,
    enableParameter
  };
};

export default useSensitivity;
