import { useState } from 'react';

export const useFeatureToggles = () => {
  const [remarks, setRemarks] = useState('off');
  const [customizedFeatures, setCustomizedFeatures] = useState('off');
  
  // States for F1-F5
  const [F, setF] = useState({ 
    F1: 'on', 
    F2: 'on', 
    F3: 'on', 
    F4: 'on', 
    F5: 'on' 
  });

  // States for V1-V10
  const [V, setV] = useState({
    V1: 'on',
    V2: 'off',
    V3: 'off',
    V4: 'off',
    V5: 'off',
    V6: 'off',
    V7: 'off',
    V8: 'off',
    V9: 'off',
    V10: 'off',
  });

  const toggleRemarks = () => {
    setRemarks((prevState) => (prevState === 'off' ? 'on' : 'off'));
  };

  const toggleCustomizedFeatures = () => {
    setCustomizedFeatures((prevState) => (prevState === 'off' ? 'on' : 'off'));
  };

  const toggleF = (key) => {
    setF((prev) => ({
      ...prev,
      [key]: prev[key] === 'off' ? 'on' : 'off',
    }));
  };

  const toggleV = (key) => {
    setV((prev) => ({
      ...prev,
      [key]: prev[key] === 'off' ? 'on' : 'off',
    }));
  };

  return {
    remarks,
    customizedFeatures,
    F,
    V,
    toggleRemarks,
    toggleCustomizedFeatures,
    toggleF,
    toggleV,
  };
};

export default useFeatureToggles;
